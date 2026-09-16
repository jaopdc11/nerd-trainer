import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { completaSemAmbiguidade, formasDeAutoCommit, normalizarTexto, validar } from '@/core/answer'
import type { Veredito } from '@/core/answer/types'
import { mulberry32, seedAleatoria } from '@/core/rng'
import { useClock } from '@/core/useClock'
import { useSaveOnExit } from '@/core/useSaveOnExit'
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

/**
 * Por que a resposta não entrou.
 *
 * Sem isto, repetir um país que você já acertou e digitar besteira eram a mesma
 * coisa na tela: nada acontecia e o erro era contado igual. Num mapa de 195
 * células, com o relógio correndo, o jogador não tem como saber se errou o nome
 * ou se já tinha dito aquele — e fica repetindo a mesma tentativa.
 */
export interface AvisoGrade {
  readonly tipo: 'repetido' | 'desconhecido'
  readonly texto: string
}

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
  /** Resposta recusada, e por quê. Some na próxima tentativa. */
  readonly aviso: AvisoGrade | null
  /**
   * Recado preso a uma célula acertada. Ao contrário do `aviso`, fica na tela
   * até o fim da partida: é uma coisa que o jogo tem a dizer, não um retorno
   * sobre a última tecla.
   */
  readonly nota: string | null
  /** `null` quando a partida não é cronometrada. */
  readonly restanteMs: number | null
  /** Só depois do fim: as células que ficaram em branco. */
  readonly faltaram: readonly CelulaGrade[]
  iniciar(): void
  responder(texto: string): Veredito
  /** O que foi digitado já é resposta inequívoca de alguma célula vazia? */
  podeAutoCommitar(texto: string): boolean
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
  const [aviso, setAviso] = useState<AvisoGrade | null>(null)
  const [nota, setNota] = useState<string | null>(null)

  const inicio = useRef(0)
  const runId = useRef(novoRunId())

  /*
   * O relógio é opcional: a tabela periódica não tem tempo, o mapa-múndi tem
   * dez minutos. Sem crédito por acerto — aqui o tempo é o adversário, e não
   * uma moeda que se reconquista como no gerador.
   */
  const limiteMs = (config.limiteSegundos ?? 0) * 1000
  const relogio = useClock(limiteMs, limiteMs)
  const cronometrado = limiteMs > 0
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

  // Ref para o `finalizar` não depender do relógio e re-criar a cada quadro.
  const relogioRef = useRef(relogio)
  relogioRef.current = relogio

  /**
   * Persiste o que já foi preenchido sem encerrar nada.
   *
   * É o que roda quando ele troca de aba: o parcial vai para o storage, a
   * sessão continua 'jogando' e o relógio continua correndo — não pausar ao
   * perder o foco é decisão de design do `useClock`, e o que não pode é a
   * partida acabar sozinha.
   */
  const gravar = useCallback(
    (pontuacao: number, errosNaRun: number): number => {
      const ms = performance.now() - inicio.current
      aoFinalizar({
        pontuacao,
        total: config.celulas.length,
        duracaoMs: ms,
        erros: errosNaRun,
        completou: pontuacao === config.celulas.length,
        runId: runId.current,
      })
      return ms
    },
    [aoFinalizar, config.celulas.length],
  )

  /** Grava e encerra de fato: relógio parado, grade congelada, gabarito à vista. */
  const finalizar = useCallback(
    (pontuacao: number, errosNaRun: number) => {
      setDuracaoMs(gravar(pontuacao, errosNaRun))
      setEstado('fim')
      setAlvoId(null)
      relogioRef.current.parar()
    },
    [gravar],
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
    setAviso(null)
    setNota(null)
    setDuracaoMs(0)
    setAlvoId(config.ordem === 'sorteada' ? sortearAlvo(vazio) : null)
    setEstado('jogando')
    if (cronometrado) relogio.iniciar()
  }, [config.ordem, sortearAlvo, cronometrado, relogio])

  const responder = useCallback(
    (texto: string): Veredito => {
      if (estado !== 'jogando') return 'errado'

      const candidatas =
        config.ordem === 'sorteada'
          ? [porId.get(alvoId ?? '')].filter((c): c is CelulaGrade => c !== undefined)
          : config.celulas.filter((c) => !preenchidas.has(c.id))

      setAviso(null)

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
        // A célula pontuou; se ela tem algo a dizer, diz agora.
        if (celula.aviso) setNota(celula.aviso)

        // Marco fechado com esta resposta. Só o primeiro que fechar aqui fala,
        // para dois marcos simultâneos não brigarem pela mesma linha.
        const marco = config.marcos?.find(
          (m) => !m.ids.every((id) => preenchidas.has(id)) && m.ids.every((id) => proximas.has(id)),
        )
        if (marco) setNota(marco.texto)

        if (proximas.size === config.celulas.length) {
          finalizar(proximas.size, erros)
        } else if (config.ordem === 'sorteada') {
          setAlvoId(sortearAlvo(proximas))
        }
        return r.veredito
      }

      /*
       * Não casou com nenhuma célula vazia. Antes de contar erro, vale conferir
       * se casa com alguma JÁ PREENCHIDA: repetir o que você acertou não é o
       * mesmo que chutar errado, e não deveria custar um erro.
       */
      const jaDito = config.celulas.find((c) => {
        if (!preenchidas.has(c.id)) return false
        return validar(texto, c.resposta, { rigor: 'estrito' }).veredito !== 'errado'
      })

      if (jaDito) {
        setAviso({ tipo: 'repetido', texto: `${jaDito.gabarito} você já acertou` })
        return 'errado'
      }

      setAviso({ tipo: 'desconhecido', texto: `"${texto.trim()}" não está no mapa` })
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
      config.marcos,
      erros,
      finalizar,
      sortearAlvo,
    ],
  )

  /**
   * O universo do auto-commit são só as células **ainda vazias**: conforme a
   * grade enche, formas que eram ambíguas passam a ser únicas e o jogo vai
   * ficando mais fluido sozinho.
   */
  const universoAberto = useMemo(() => {
    const abertas =
      config.ordem === 'sorteada'
        ? [porId.get(alvoId ?? '')].filter((c): c is CelulaGrade => c !== undefined)
        : config.celulas.filter((c) => !preenchidas.has(c.id))

    const formas: string[] = []
    for (const c of abertas) {
      const auto = formasDeAutoCommit(c.resposta)
      if (auto) formas.push(...auto.formas)
    }
    return formas
  }, [config.ordem, config.celulas, porId, alvoId, preenchidas])

  const podeAutoCommitar = useCallback(
    (texto: string): boolean => {
      if (estado !== 'jogando') return false
      const primeira = config.celulas[0]
      if (!primeira) return false

      const auto = formasDeAutoCommit(primeira.resposta)
      if (!auto) return false

      return completaSemAmbiguidade(auto.normalizar(texto), universoAberto)
    },
    [estado, config.celulas, universoAberto],
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
      gravar(acertosRef.current, errosRef.current)
    },
  )

  /*
   * Zerou o relógio, acabou a partida — com o que já foi preenchido. Roda num
   * efeito e não dentro do `useClock` porque quem sabe o que é "pontuação" é a
   * mecânica, não o cronômetro.
   */
  const preenchidasRef = useRef(preenchidas)
  preenchidasRef.current = preenchidas
  useEffect(() => {
    if (!cronometrado || estado !== 'jogando' || relogio.restanteMs > 0) return
    finalizar(preenchidasRef.current.size, errosRef.current)
  }, [cronometrado, estado, relogio.restanteMs, finalizar])

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
    aviso,
    nota,
    restanteMs: cronometrado ? relogio.restanteMs : null,
    faltaram,
    iniciar,
    responder,
    podeAutoCommitar,
    encerrar,
  }
}

function novoRunId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}
