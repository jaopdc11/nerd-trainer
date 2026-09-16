import { useCallback, useEffect, useRef, useState } from 'react'
import { completaSemAmbiguidade, formasDeAutoCommit, validar } from '@/core/answer'
import { normalizarTexto } from '@/core/answer/normalize'
import type { Veredito } from '@/core/answer/types'
import { mulberry32, seedAleatoria } from '@/core/rng'
import { useSaveOnExit } from '@/core/useSaveOnExit'
import type { Carta, ConfigFlashcard, ResultadoRun } from '@/core/types'

/**
 * Mecânica C: baralho sorteado, uma carta por vez.
 *
 * Dois fins possíveis, decididos pelo dataset: 'morte-subita' (errou, acabou) e
 * 'baralho' (vai até a última carta, e o placar é quantas você acertou). Grego e
 * prefixos SI usam o baralho inteiro, porque são conjuntos fechados que a gente
 * quer ver terminados; fórmulas usam morte súbita, porque o baralho é grande.
 */

export type EstadoFlashcard = 'pronto' | 'jogando' | 'fim'

/** Tempo que o gabarito fica na tela depois de um erro. */
const PAUSA_MS = 1100

export interface SessaoFlashcard {
  readonly estado: EstadoFlashcard
  readonly carta: Carta | null
  readonly acertos: number
  readonly erros: number
  readonly total: number
  readonly posicao: number
  /** Gabarito mostrado após erro; `null` enquanto ele responde. */
  readonly correcao: string | null
  /**
   * Recado preso a uma carta que já saiu. Fica na tela até o fim da partida,
   * como na grade: é coisa que o jogo tem a dizer, não retorno sobre a tecla.
   */
  readonly nota: string | null
  readonly duracaoMs: number
  iniciar(): void
  responder(texto: string): Veredito
  podeAutoCommitar(texto: string): boolean
  escolher(indice: number): Veredito
  /** "Não sei": revela o gabarito e avança. Conta como erro. */
  pular(): void
  reiniciar(): void
}

export function useFlashcard(
  config: ConfigFlashcard,
  aoFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void,
): SessaoFlashcard {
  const [estado, setEstado] = useState<EstadoFlashcard>('pronto')
  const [baralho, setBaralho] = useState<readonly Carta[]>([])
  const [posicao, setPosicao] = useState(0)
  const [acertos, setAcertos] = useState(0)
  const [erros, setErros] = useState(0)
  const [correcao, setCorrecao] = useState<string | null>(null)
  const [nota, setNota] = useState<string | null>(null)
  const [duracaoMs, setDuracaoMs] = useState(0)

  const inicio = useRef(0)
  const runId = useRef(novoRunId())
  const pausa = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(pausa.current), [])

  /**
   * Persiste o que já foi acertado sem encerrar nada.
   *
   * É o que roda quando ele troca de aba: o parcial vai para o storage e a
   * carta continua na tela, esperando a resposta de quem voltou.
   */
  const gravar = useCallback(
    (pontuacao: number, errosNaRun: number, completou: boolean): number => {
      const ms = performance.now() - inicio.current
      aoFinalizar({
        pontuacao,
        total: baralho.length,
        duracaoMs: ms,
        erros: errosNaRun,
        completou,
        runId: runId.current,
      })
      return ms
    },
    [aoFinalizar, baralho.length],
  )

  /** Grava e encerra de fato: baralho fechado, placar final na tela. */
  const finalizar = useCallback(
    (pontuacao: number, errosNaRun: number, completou: boolean) => {
      setDuracaoMs(gravar(pontuacao, errosNaRun, completou))
      setEstado('fim')
      setCorrecao(null)
    },
    [gravar],
  )

  const iniciar = useCallback(() => {
    setBaralho(config.montarBaralho(mulberry32(seedAleatoria())))
    setPosicao(0)
    setAcertos(0)
    setErros(0)
    setCorrecao(null)
    setNota(null)
    setDuracaoMs(0)
    runId.current = novoRunId()
    inicio.current = performance.now()
    setEstado('jogando')
  }, [config])

  const avancar = useCallback(
    (proximaPosicao: number, novosAcertos: number, novosErros: number) => {
      if (proximaPosicao >= baralho.length) {
        finalizar(novosAcertos, novosErros, true)
        return
      }
      setPosicao(proximaPosicao)
    },
    [baralho.length, finalizar],
  )

  const julgar = useCallback(
    (veredito: Veredito, resolvida: Carta): Veredito => {
      const gabarito = resolvida.gabarito
      // A carta saiu: se ela tem algo a dizer, diz agora — tenha sido acerto,
      // erro ou "não sei". O recado é sobre a resposta, não sobre o placar.
      if (resolvida.aviso) setNota(resolvida.aviso)

      // 'quase' (typo perdoado, caixa errada em treino) conta como acerto, mas
      // a UI mostra a grafia certa — ensina sem punir.
      if (veredito !== 'errado') {
        const novos = acertos + 1
        setAcertos(novos)
        avancar(posicao + 1, novos, erros)
        return veredito
      }

      const novosErros = erros + 1
      setErros(novosErros)

      if (config.fim === 'morte-subita') {
        setCorrecao(gabarito)
        finalizar(acertos, novosErros, false)
        return 'errado'
      }

      setCorrecao(gabarito)
      pausa.current = setTimeout(() => {
        setCorrecao(null)
        avancar(posicao + 1, acertos, novosErros)
      }, PAUSA_MS)
      return 'errado'
    },
    [acertos, erros, posicao, config.fim, avancar, finalizar],
  )

  const carta = estado === 'jogando' ? (baralho[posicao] ?? null) : null

  const responder = useCallback(
    (texto: string): Veredito => {
      if (!carta || carta.tipo !== 'digitada' || correcao !== null) return 'errado'

      // A vizinhança é o que impede a tolerância a typo de aceitar a resposta de
      // outra carta do mesmo baralho.
      const vizinhanca = new Set(
        baralho
          .filter((c) => c.id !== carta.id && c.tipo === 'digitada')
          .flatMap((c) => (c.tipo === 'digitada' && c.resposta.tipo === 'texto'
            ? c.resposta.aceitas
            : [])),
      )

      /*
       * E sai dali tudo que também é resposta DESTA carta.
       *
       * O filtro acima é por `id`, e id não é resposta: num baralho em que o
       * mesmo autor responde por várias cartas — Kant tem três na filosofia,
       * Nietzsche quatro, Tarsila quatro nas pinturas —, a resposta certa
       * entrava na própria vizinhança. O texto encostava em duas cartas ao
       * mesmo tempo, o validador chamava de ambíguo, e **a tolerância a erro de
       * digitação estava morta para todo autor repetido**: "Schumpetter" era
       * recusado porque Schumpeter tem duas cartas. A grade sempre fez esta
       * subtração (ver `useGrid`); aqui faltava, e ninguém tinha percebido
       * porque os baralhos antigos quase não repetem resposta.
       */
      if (carta.resposta.tipo === 'texto') {
        const minhas = new Set(carta.resposta.aceitas.map((a) => normalizarTexto(a)))
        for (const forma of vizinhanca) {
          if (minhas.has(normalizarTexto(forma))) vizinhanca.delete(forma)
        }
      }

      // Estrito pelo mesmo motivo da grade: nos modos de símbolo (grego, SI) a
      // caixa é a resposta — σ não é Σ, k não é K. A misericórdia com erro de
      // digitação em texto continua valendo, porque não depende do rigor.
      const r = validar(texto, carta.resposta, { rigor: 'estrito', vizinhanca })
      return julgar(r.veredito, carta)
    },
    [carta, correcao, baralho, julgar],
  )

  const escolher = useCallback(
    (indice: number): Veredito => {
      if (!carta || carta.tipo !== 'escolha' || correcao !== null) return 'errado'
      const certo = indice === carta.indiceCorreto
      return julgar(certo ? 'certo' : 'errado', carta)
    },
    [carta, correcao, julgar],
  )

  /**
   * "Não sei": a carta que ele não sabe sai da frente.
   *
   * Sem isto o jogo simplesmente travava numa bandeira desconhecida — o
   * `AnswerInput` não envia campo vazio (de propósito: um Enter acidental não
   * pode queimar uma carta), então não havia como avançar.
   *
   * É exatamente o caminho do erro: mostra o gabarito com a mesma pausa e o
   * mesmo visual, porque não saber é a hora de aprender, não de esconder a
   * resposta; e conta erro, porque não saber é não saber. Em morte súbita
   * encerra igual a errar — senão o botão viraria o jeito de burlar a morte
   * súbita.
   */
  const pular = useCallback(() => {
    if (estado !== 'jogando' || !carta || correcao !== null) return
    julgar('errado', carta)
  }, [estado, carta, correcao, julgar])

  const podeAutoCommitar = useCallback(
    (texto: string): boolean => {
      if (!carta || carta.tipo !== 'digitada' || correcao !== null) return false
      const auto = formasDeAutoCommit(carta.resposta)
      if (!auto) return false
      return completaSemAmbiguidade(auto.normalizar(texto), auto.formas)
    },
    [carta, correcao],
  )

  const estadoRef = useRef(estado)
  const acertosRef = useRef(acertos)
  const errosRef = useRef(erros)
  estadoRef.current = estado
  acertosRef.current = acertos
  errosRef.current = erros
  // Só conta como partida se ele chegou a pontuar: abrir o jogo e voltar
  // enchia o histórico de runs de zero e inflava o contador de partidas.
  // `gravar`, nunca `finalizar`: trocar de aba salva o parcial e mais nada.
  useSaveOnExit(
    () => estadoRef.current === 'jogando' && acertosRef.current > 0,
    () => {
      gravar(acertosRef.current, errosRef.current, false)
    },
  )

  const reiniciar = useCallback(() => {
    clearTimeout(pausa.current)
    setEstado('pronto')
    setCorrecao(null)
    setNota(null)
  }, [])

  return {
    estado,
    carta,
    acertos,
    erros,
    total: baralho.length,
    posicao,
    correcao,
    nota,
    duracaoMs,
    iniciar,
    responder,
    podeAutoCommitar,
    escolher,
    pular,
    reiniciar,
  }
}

function novoRunId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}
