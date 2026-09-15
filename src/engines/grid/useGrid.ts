import { useCallback, useMemo, useRef, useState } from 'react'
import { normalizarTexto, validar } from '@/core/answer'
import type { Veredito } from '@/core/answer/types'
import { mulberry32, seedAleatoria } from '@/core/rng'
import type { CelulaGrade, ConfigGrade, ResultadoRun } from '@/core/types'

/**
 * Mecânica B: grade preenchida em ordem livre.
 *
 * No modo 'livre' não existe "célula atual": o jogador digita o que lembrar e o
 * motor procura qual célula ainda vazia aceita aquilo. É o que dá a sensação de
 * ir despejando o que sabe, em vez de ser interrogado casa a casa.
 *
 * No modo 'sorteada' o motor escolhe uma célula vazia e pergunta por ela — é o
 * mesmo dataset servindo de flashcard sem virar outro jogo.
 */

export type EstadoGrade = 'pronto' | 'jogando' | 'fim'

export interface SessaoGrade {
  readonly estado: EstadoGrade
  readonly preenchidas: ReadonlyMap<string, string>
  /** Célula perguntada no modo 'sorteada'; `null` no modo livre. */
  readonly alvo: CelulaGrade | null
  /** Última acertada, para o destaque e o scroll. */
  readonly ultima: string | null
  readonly acertos: number
  readonly erros: number
  readonly restantes: number
  readonly duracaoMs: number
  /** Só depois do fim: as células que ficaram em branco. */
  readonly faltaram: readonly CelulaGrade[]
  iniciar(): void
  responder(texto: string): Veredito
  encerrar(): void
}

export function useGrid(
  config: ConfigGrade,
  aoFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void,
): SessaoGrade {
  const [estado, setEstado] = useState<EstadoGrade>('pronto')
  const [preenchidas, setPreenchidas] = useState<ReadonlyMap<string, string>>(new Map())
  const [alvoId, setAlvoId] = useState<string | null>(null)
  const [ultima, setUltima] = useState<string | null>(null)
  const [erros, setErros] = useState(0)
  const [duracaoMs, setDuracaoMs] = useState(0)

  const inicio = useRef(0)
  const runId = useRef(novoRunId())
  const rng = useRef(mulberry32(seedAleatoria()))

  const porId = useMemo(
    () => new Map(config.celulas.map((c) => [c.id, c])),
    [config.celulas],
  )

  /**
   * Formas aceitas por todas as células, para a trava de vizinhança. Sem isso a
   * tolerância a erro de digitação deixaria "Cobalto" cair na célula do Cobre.
   */
  const todasAsFormas = useMemo(() => {
    const saida = new Set<string>()
    for (const c of config.celulas) {
      if (c.resposta.tipo === 'texto') {
        for (const a of c.resposta.aceitas) saida.add(normalizarTexto(a))
      }
    }
    return saida
  }, [config.celulas])

  const acertos = preenchidas.size
  const restantes = config.celulas.length - acertos

  const finalizar = useCallback(
    (pontuacao: number, errosNaRun: number) => {
      const ms = performance.now() - inicio.current
      setDuracaoMs(ms)
      setEstado('fim')
      setAlvoId(null)
      aoFinalizar({
        pontuacao,
        total: config.celulas.length,
        duracaoMs: ms,
        erros: errosNaRun,
        completou: pontuacao === config.celulas.length,
        runId: runId.current,
      })
    },
    [aoFinalizar, config.celulas.length],
  )

  const sortearAlvo = useCallback(
    (jaPreenchidas: ReadonlyMap<string, string>): string | null => {
      const vazias = config.celulas.filter((c) => !jaPreenchidas.has(c.id))
      return vazias.length === 0 ? null : (rng.current.pick(vazias).id ?? null)
    },
    [config.celulas],
  )

  const iniciar = useCallback(() => {
    const vazio = new Map<string, string>()
    rng.current = mulberry32(seedAleatoria())
    runId.current = novoRunId()
    inicio.current = performance.now()
    setPreenchidas(vazio)
    setErros(0)
    setUltima(null)
    setDuracaoMs(0)
    setAlvoId(config.ordem === 'sorteada' ? sortearAlvo(vazio) : null)
    setEstado('jogando')
  }, [config.ordem, sortearAlvo])

  const responder = useCallback(
    (texto: string): Veredito => {
      if (estado !== 'jogando') return 'errado'

      const candidatas =
        config.ordem === 'sorteada'
          ? [porId.get(alvoId ?? '')].filter((c): c is CelulaGrade => c !== undefined)
          : config.celulas.filter((c) => !preenchidas.has(c.id))

      for (const celula of candidatas) {
        const outras = new Set(todasAsFormas)
        if (celula.resposta.tipo === 'texto') {
          for (const a of celula.resposta.aceitas) outras.delete(normalizarTexto(a))
        }

        // Rigor estrito: no modo símbolo a caixa É o exercício, e aceitar "fe"
        // como ferro esvaziaria o modo. Isso não tira a tolerância a erro de
        // digitação no modo nome, que não depende do rigor.
        const r = validar(texto, celula.resposta, { rigor: 'estrito', vizinhanca: outras })
        if (r.veredito === 'errado') continue

        const proximas = new Map(preenchidas).set(celula.id, celula.gabarito)
        setPreenchidas(proximas)
        setUltima(celula.id)

        if (proximas.size === config.celulas.length) {
          finalizar(proximas.size, erros)
        } else if (config.ordem === 'sorteada') {
          setAlvoId(sortearAlvo(proximas))
        }
        return r.veredito
      }

      setErros((e) => e + 1)
      return 'errado'
    },
    [
      estado,
      config.ordem,
      config.celulas,
      porId,
      alvoId,
      preenchidas,
      todasAsFormas,
      erros,
      finalizar,
      sortearAlvo,
    ],
  )

  const encerrar = useCallback(() => {
    if (estado === 'jogando') finalizar(preenchidas.size, erros)
  }, [estado, preenchidas.size, erros, finalizar])

  const faltaram = useMemo(
    () => (estado === 'fim' ? config.celulas.filter((c) => !preenchidas.has(c.id)) : []),
    [estado, config.celulas, preenchidas],
  )

  return {
    estado,
    preenchidas,
    alvo: alvoId ? (porId.get(alvoId) ?? null) : null,
    ultima,
    acertos,
    erros,
    restantes,
    duracaoMs,
    faltaram,
    iniciar,
    responder,
    encerrar,
  }
}

function novoRunId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}
