import { useCallback, useMemo, useRef, useState } from 'react'
import { useSaveOnExit } from '@/core/useSaveOnExit'
import { validar } from '@/core/answer'
import type { EspecResposta, Veredito } from '@/core/answer/types'
import type { ConfigSequencia, ResultadoRun } from '@/core/types'

/**
 * Mecânica A: sequência infinita com morte súbita.
 *
 * O jogo inteiro é um índice que só anda para a frente. Errou, acabou — e o
 * valor pedagógico vem depois do fim, na revisão: onde você parou e o que vinha
 * a seguir, para decorar o próximo pedaço antes de tentar de novo.
 */

export type EstadoSequencia = 'pronto' | 'jogando' | 'morto' | 'completo'

export interface Erro {
  readonly esperado: string
  readonly digitado: string
  readonly indice: number
}

export interface Sessao {
  readonly estado: EstadoSequencia
  /** Índice do próximo item esperado — e também quantos ele acertou. */
  readonly indice: number
  /** Itens já acertados, para a fita. */
  readonly acertados: readonly string[]
  readonly erro: Erro | null
  /** Os próximos itens, mostrados na revisão pós-morte. */
  readonly proximos: readonly string[]
  readonly duracaoMs: number
  digitar(c: string): Veredito
  enviar(texto: string): Veredito
  /** Sai da abertura e começa a valer: zera tudo e marca o início do cronômetro. */
  iniciar(): void
  /** Descarta a partida e volta para a abertura. */
  reiniciar(): void
}

/** Quantos itens acertados manter na fita. Ver a nota de desempenho abaixo. */
const JANELA_DA_FITA = 60

export function useSequence(
  config: ConfigSequencia,
  aoFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void,
): Sessao {
  const [estado, setEstado] = useState<EstadoSequencia>('pronto')
  const [indice, setIndice] = useState(0)
  const [acertados, setAcertados] = useState<readonly string[]>([])
  const [erro, setErro] = useState<Erro | null>(null)
  const [duracaoMs, setDuracaoMs] = useState(0)

  const inicio = useRef<number | null>(null)
  const runId = useRef<string>(novoRunId())

  const itemEm = useCallback(
    (i: number): string | null => {
      if (config.itens) return config.itens[i] ?? null
      return config.itemEm?.(i) ?? null
    },
    [config],
  )

  const proximos = useMemo(() => {
    if (estado !== 'morto' && estado !== 'completo') return []
    const quantos = config.revisaoPosMorte ?? 10
    const lista: string[] = []
    for (let i = indice; i < indice + quantos; i++) {
      const item = itemEm(i)
      if (item === null) break
      lista.push(item)
    }
    return lista
  }, [estado, indice, itemEm, config.revisaoPosMorte])

  /**
   * Persiste o que já foi feito sem encerrar nada.
   *
   * É o que roda quando ele troca de aba: o parcial vai para o storage e a
   * partida continua exatamente onde estava. Nenhum `setState` aqui — trocar de
   * aba não pode mexer na sessão, e no cleanup do efeito o componente já está
   * saindo de cena.
   */
  const gravar = useCallback(
    (pontuacao: number, completou: boolean, errosNaRun: number): number => {
      const ms = inicio.current === null ? 0 : performance.now() - inicio.current
      // Gravar aqui, no handler, e não num efeito: o StrictMode do React roda
      // efeitos duas vezes, e a partida seria contada em dobro.
      aoFinalizar({
        pontuacao,
        ...(config.total !== undefined ? { total: config.total } : {}),
        duracaoMs: ms,
        erros: errosNaRun,
        completou,
        runId: runId.current,
      })
      return ms
    },
    [aoFinalizar, config.total],
  )

  /** Grava e encerra de fato: é o fim da partida, não uma pausa. */
  const finalizar = useCallback(
    (pontuacao: number, completou: boolean, errosNaRun: number) => {
      setDuracaoMs(gravar(pontuacao, completou, errosNaRun))
    },
    [gravar],
  )

  const julgar = useCallback(
    (digitado: string): Veredito => {
      // Antes valia qualquer tecla e a partida nascia sozinha na primeira.
      // Agora o começo é explícito, pelo botão da abertura: fora de 'jogando'
      // o teclado não conta.
      if (estado !== 'jogando') return 'errado'

      const esperado = itemEm(indice)
      if (esperado === null) {
        setEstado('completo')
        finalizar(indice, true, 0)
        return 'certo'
      }

      const espec: EspecResposta =
        config.respostaEm?.(indice) ??
        (config.entrada === 'caractere'
          ? { tipo: 'digito', valor: esperado }
          : { tipo: 'inteiroGrande', valor: esperado })

      // Rigor sempre estrito: aqui o dígito É o conhecimento. Tolerar erro de
      // digitação em pi seria aceitar que ele não sabe pi.
      const r = validar(digitado, espec, { rigor: 'estrito' })

      if (r.veredito !== 'certo') {
        setErro({ esperado, digitado, indice })
        setEstado('morto')
        finalizar(indice, false, 1)
        return 'errado'
      }

      const proximoIndice = indice + 1
      setIndice(proximoIndice)
      setAcertados((a) => [...a, esperado].slice(-JANELA_DA_FITA))

      if (itemEm(proximoIndice) === null) {
        setEstado('completo')
        finalizar(proximoIndice, true, 0)
      }
      return 'certo'
    },
    [estado, indice, itemEm, config.entrada, config.respostaEm, finalizar],
  )

  // Saiu no meio: as casas que ele já acertou contam como partida.
  const estadoRef = useRef(estado)
  const indiceRef = useRef(indice)
  estadoRef.current = estado
  indiceRef.current = indice
  // Só conta como partida se ele chegou a pontuar: abrir o jogo e voltar
  // enchia o histórico de runs de zero e inflava o contador de partidas.
  // `gravar`, nunca `finalizar`: trocar de aba salva o parcial e mais nada.
  useSaveOnExit(
    () => estadoRef.current === 'jogando' && indiceRef.current > 0,
    () => {
      gravar(indiceRef.current, false, 0)
    },
  )

  /** Volta tudo ao zero. Quem chama decide se o próximo estado é abertura ou jogo. */
  const zerar = useCallback(() => {
    setIndice(0)
    setAcertados([])
    setErro(null)
    setDuracaoMs(0)
    runId.current = novoRunId()
  }, [])

  const iniciar = useCallback(() => {
    zerar()
    inicio.current = performance.now()
    setEstado('jogando')
  }, [zerar])

  const reiniciar = useCallback(() => {
    zerar()
    inicio.current = null
    setEstado('pronto')
  }, [zerar])

  return {
    estado,
    indice,
    acertados,
    erro,
    proximos,
    duracaoMs,
    digitar: julgar,
    enviar: julgar,
    iniciar,
    reiniciar,
  }
}

function novoRunId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}
