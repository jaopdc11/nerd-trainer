import { useCallback, useEffect, useRef, useState } from 'react'
import { completaSemAmbiguidade, formasDeAutoCommit, validar } from '@/core/answer'
import type { Veredito } from '@/core/answer/types'
import { mulberry32, seedAleatoria } from '@/core/rng'
import type { Rng } from '@/core/rng'
import { useClock } from '@/core/useClock'
import { useSaveOnExit } from '@/core/useSaveOnExit'
import type { ConfigGerador, Exercicio, ResultadoRun } from '@/core/types'

/**
 * Mecânica D: exercícios gerados na hora, contra o relógio.
 *
 * Errar não encerra a partida — encerraria em três segundos e o modo viraria
 * outra coisa. O erro custa o tempo que passou, mostra o gabarito por um
 * instante e segue. A partida acaba quando o relógio zera.
 */

export type EstadoGerador = 'pronto' | 'jogando' | 'fim'

/** Quanto tempo o gabarito fica na tela depois de um erro. */
const PAUSA_DO_ERRO_MS = 900

/** Quantas chaves recentes lembrar, para não repetir o mesmo exercício. */
const JANELA_ANTI_REPETICAO = 8

/** Tentativas de sorteio antes de aceitar uma repetição e seguir em frente. */
const TENTATIVAS = 12

export interface SessaoGerador {
  readonly estado: EstadoGerador
  readonly exercicio: Exercicio | null
  readonly acertos: number
  readonly erros: number
  readonly nivel: number
  readonly restanteMs: number
  /** Gabarito exibido após um erro; `null` enquanto ele responde. */
  readonly correcao: string | null
  readonly duracaoMs: number
  iniciar(): void
  responder(texto: string): Veredito
  escolher(indice: number): Veredito
  /** O que foi digitado já é a resposta inteira? Dispensa o Enter. */
  podeAutoCommitar(texto: string): boolean
  reiniciar(): void
}

export function useGenerator(
  config: ConfigGerador,
  aoFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void,
): SessaoGerador {
  const [estado, setEstado] = useState<EstadoGerador>('pronto')
  const [exercicio, setExercicio] = useState<Exercicio | null>(null)
  const [acertos, setAcertos] = useState(0)
  const [erros, setErros] = useState(0)
  const [correcao, setCorrecao] = useState<string | null>(null)
  const [duracaoMs, setDuracaoMs] = useState(0)

  const relogio = useClock(config.segundosIniciais * 1000, config.tetoSegundos * 1000)

  const rng = useRef<Rng>(mulberry32(seedAleatoria()))
  const recentes = useRef<string[]>([])
  const runId = useRef(novoRunId())
  const inicio = useRef(0)
  const pausa = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const nivel = config.escala(acertos)

  const sortear = useCallback(
    (nivelAtual: number): Exercicio => {
      // Rejection sampling: tenta algumas vezes evitar o que acabou de cair, e
      // na última aceita o que vier — melhor repetir um exercício do que travar.
      let candidato = config.gerar(rng.current, nivelAtual)
      for (let i = 0; i < TENTATIVAS && recentes.current.includes(candidato.chave); i++) {
        candidato = config.gerar(rng.current, nivelAtual)
      }
      recentes.current = [candidato.chave, ...recentes.current].slice(0, JANELA_ANTI_REPETICAO)
      return candidato
    },
    [config],
  )

  const finalizar = useCallback(
    (pontuacao: number, errosNaRun: number) => {
      const ms = performance.now() - inicio.current
      setDuracaoMs(ms)
      setEstado('fim')
      setExercicio(null)
      aoFinalizar({
        pontuacao,
        duracaoMs: ms,
        erros: errosNaRun,
        completou: false,
        runId: runId.current,
      })
    },
    [aoFinalizar],
  )

  // O relógio zerou: encerra a partida.
  const acertosRef = useRef(acertos)
  const errosRef = useRef(erros)
  acertosRef.current = acertos
  errosRef.current = erros

  useEffect(() => {
    if (estado === 'jogando' && relogio.restanteMs <= 0) {
      finalizar(acertosRef.current, errosRef.current)
    }
  }, [estado, relogio.restanteMs, finalizar])

  useEffect(() => () => clearTimeout(pausa.current), [])

  // Fechou a aba ou voltou para o menu no meio da partida: o que já foi feito
  // conta. Sem isso, quem fizesse 50 acertos e desistisse perdia os 50.
  const estadoRef = useRef(estado)
  estadoRef.current = estado
  // Só conta como partida se ele chegou a pontuar: abrir o jogo e voltar
  // enchia o histórico de runs de zero e inflava o contador de partidas.
  useSaveOnExit(
    () => estadoRef.current === 'jogando' && acertosRef.current > 0,
    () => finalizar(acertosRef.current, errosRef.current),
  )

  const iniciar = useCallback(() => {
    rng.current = mulberry32(seedAleatoria())
    recentes.current = []
    runId.current = novoRunId()
    inicio.current = performance.now()
    setAcertos(0)
    setErros(0)
    setCorrecao(null)
    setExercicio(sortear(config.escala(0)))
    setEstado('jogando')
    relogio.iniciar()
  }, [config, sortear, relogio])

  /** Parte comum de acertar e errar, para digitado e escolha caírem no mesmo lugar. */
  const julgar = useCallback(
    (certo: boolean, gabarito: string): Veredito => {
      if (certo) {
        const novos = acertos + 1
        setAcertos(novos)
        relogio.creditar(config.bonusPorAcertoS * 1000)
        setExercicio(sortear(config.escala(novos)))
        return 'certo'
      }

      setErros((e) => e + 1)
      // Mostra o gabarito por um instante: errar sem saber o certo não ensina.
      setCorrecao(gabarito)
      pausa.current = setTimeout(() => {
        setCorrecao(null)
        setExercicio(sortear(config.escala(acertos)))
      }, PAUSA_DO_ERRO_MS)
      return 'errado'
    },
    [acertos, config, relogio, sortear],
  )

  const responder = useCallback(
    (texto: string): Veredito => {
      if (estado !== 'jogando' || !exercicio || correcao !== null) return 'errado'
      if (exercicio.tipo !== 'digitado') return 'errado'
      const r = validar(texto, exercicio.resposta, { rigor: 'estrito' })
      return julgar(r.veredito === 'certo', exercicio.gabarito)
    },
    [estado, exercicio, correcao, julgar],
  )

  const escolher = useCallback(
    (indice: number): Veredito => {
      if (estado !== 'jogando' || !exercicio || correcao !== null) return 'errado'
      if (exercicio.tipo !== 'escolha') return 'errado'
      return julgar(indice === exercicio.indiceCorreto, exercicio.gabarito)
    },
    [estado, exercicio, correcao, julgar],
  )

  const podeAutoCommitar = useCallback(
    (texto: string): boolean => {
      if (estado !== 'jogando' || !exercicio || correcao !== null) return false
      if (exercicio.tipo !== 'digitado') return false
      const auto = formasDeAutoCommit(exercicio.resposta)
      // `formasDeAutoCommit` devolve null para resposta numérica de precisão
      // livre (ordem de grandeza): ali "3e8" e "3,0e8" são ambas válidas e não
      // dá para saber quando o jogador terminou de digitar.
      if (!auto) return false
      return completaSemAmbiguidade(auto.normalizar(texto), auto.formas)
    },
    [estado, exercicio, correcao],
  )

  const reiniciar = useCallback(() => {
    clearTimeout(pausa.current)
    setEstado('pronto')
    setExercicio(null)
    setAcertos(0)
    setErros(0)
    setCorrecao(null)
    setDuracaoMs(0)
    relogio.reiniciar()
  }, [relogio])

  return {
    estado,
    exercicio,
    acertos,
    erros,
    nivel,
    restanteMs: relogio.restanteMs,
    correcao,
    duracaoMs,
    iniciar,
    responder,
    escolher,
    podeAutoCommitar,
    reiniciar,
  }
}

function novoRunId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}
