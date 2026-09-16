import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registrar } from '@/core/storage'
import type { Banco } from '@/core/storage'
import type { ConfigGerador, ResultadoRun } from '@/core/types'
import { esconderAba, voltarParaAba } from '../trocaDeAba.testing'
import { useGenerator } from './useGenerator'

type Parcial = Omit<ResultadoRun, 'jogoId' | 'modoId'>

/** Somas de dois dígitos: gerador mínimo, só para exercitar a mecânica. */
const GERADOR: ConfigGerador = {
  gerar: (rng) => {
    const a = rng.int(10, 99)
    const b = rng.int(10, 99)
    return {
      tipo: 'digitado',
      chave: `soma:${a}+${b}`,
      enunciado: { kind: 'texto', valor: `${a} + ${b}` },
      gabarito: String(a + b),
      resposta: { tipo: 'inteiroGrande', valor: String(a + b) },
    }
  },
  segundosIniciais: 60,
  bonusPorAcertoS: 3,
  tetoSegundos: 90,
  escala: () => 0,
  teclado: 'numerico',
}

/** Igual, mas acaba em instantes: para ver o desfecho de verdade sem esperar. */
const RELAMPAGO: ConfigGerador = {
  ...GERADOR,
  segundosIniciais: 0.2,
  bonusPorAcertoS: 0,
  tetoSegundos: 1,
}

function montar(config: ConfigGerador) {
  const aoFinalizar = vi.fn<(r: Parcial) => void>()
  const hook = renderHook(() => useGenerator(config, aoFinalizar))
  act(() => {
    hook.result.current.iniciar()
  })
  return { hook, aoFinalizar }
}

/** Responde o próprio gabarito do exercício que está na tela. */
function acertar(hook: ReturnType<typeof montar>['hook']): void {
  const gabarito = hook.result.current.exercicio?.gabarito ?? ''
  act(() => {
    hook.result.current.responder(gabarito)
  })
}

describe('trocar de aba no meio da partida', () => {
  it('grava o parcial sem encerrar a partida nem tirar o exercício da tela', () => {
    const { hook, aoFinalizar } = montar(GERADOR)
    acertar(hook)
    acertar(hook)

    esconderAba()

    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 2, completou: false })
    // O ponto do bug: o exercício continua lá, e o relógio também.
    expect(hook.result.current.estado).toBe('jogando')
    expect(hook.result.current.exercicio).not.toBeNull()
    expect(hook.result.current.restanteMs).toBeGreaterThan(0)

    voltarParaAba()
    acertar(hook)
    expect(hook.result.current.acertos).toBe(3)
  })

  it('voltar e deixar o relógio zerar grava o desfecho real', async () => {
    const { hook, aoFinalizar } = montar(RELAMPAGO)
    acertar(hook)
    esconderAba()
    voltarParaAba()
    acertar(hook)
    acertar(hook)

    await waitFor(() => {
      expect(hook.result.current.estado).toBe('fim')
    })

    const [parcial, fim] = aoFinalizar.mock.calls.map((c) => c[0]) as [Parcial, Parcial]
    expect(parcial.pontuacao).toBe(1)
    expect(fim.pontuacao).toBe(3)
    expect(fim.runId).toBe(parcial.runId)

    const vazio: Banco = { versao: 1, entradas: {} }
    const um = registrar(vazio, { ...parcial, jogoId: 'aritmetica' })
    const dois = registrar(um.banco, { ...fim, jogoId: 'aritmetica' })
    expect(dois.entrada.recorde.pontuacao, 'o desfecho não pode ser engolido').toBe(3)
    expect(dois.entrada.partidas, 'continua sendo UMA partida').toBe(1)
  })

  it('desmontar a tela grava o parcial', () => {
    const { hook, aoFinalizar } = montar(GERADOR)
    acertar(hook)

    hook.unmount()

    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 1, completou: false })
  })
})

describe('pular o exercício que ele não sabe', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('revela o gabarito, conta erro e sorteia outro — sem ganhar tempo', () => {
    const { hook } = montar(GERADOR)
    const antes = hook.result.current.exercicio

    act(() => {
      hook.result.current.pular()
    })
    expect(hook.result.current.correcao).toBe(antes?.gabarito)
    expect(hook.result.current.acertos).toBe(0)
    expect(hook.result.current.erros).toBe(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(hook.result.current.correcao).toBeNull()
    expect(hook.result.current.exercicio?.chave).not.toBe(antes?.chave)
    expect(hook.result.current.estado).toBe('jogando')
    // O bônus mora só no caminho do acerto: pular não credita relógio.
    expect(hook.result.current.acertos).toBe(0)
  })

  it('não pula de novo enquanto o gabarito está na tela', () => {
    const { hook } = montar(GERADOR)
    act(() => {
      hook.result.current.pular()
    })
    act(() => {
      hook.result.current.pular()
    })
    expect(hook.result.current.erros).toBe(1)
  })
})
