import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registrar } from '@/core/storage'
import type { Banco } from '@/core/storage'
import type { Carta, ConfigFlashcard, ResultadoRun } from '@/core/types'
import { esconderAba, voltarParaAba } from '../trocaDeAba.testing'
import { useFlashcard } from './useFlashcard'

type Parcial = Omit<ResultadoRun, 'jogoId' | 'modoId'>

/**
 * Baralho fixo: o sorteio é do jogo, não da mecânica, e aqui o que se testa é a
 * mecânica. Quatro cartas bastam para pular uma e ainda sobrar partida.
 */
function carta(id: string, resposta: string): Carta {
  return {
    tipo: 'digitada',
    id,
    pergunta: { kind: 'texto', valor: `pergunta ${id}` },
    resposta: { tipo: 'texto', canonica: resposta, aceitas: [resposta] },
    gabarito: resposta,
  }
}

const CARTAS = [carta('c1', 'alfa'), carta('c2', 'beta'), carta('c3', 'gama'), carta('c4', 'delta')]

const BARALHO: ConfigFlashcard = {
  montarBaralho: () => CARTAS,
  fim: 'baralho',
  teclado: 'texto',
}

const MORTE_SUBITA: ConfigFlashcard = { ...BARALHO, fim: 'morte-subita' }

function montar(config: ConfigFlashcard) {
  const aoFinalizar = vi.fn<(r: Parcial) => void>()
  const hook = renderHook(() => useFlashcard(config, aoFinalizar))
  act(() => {
    hook.result.current.iniciar()
  })
  return { hook, aoFinalizar }
}

const responder = (hook: ReturnType<typeof montar>['hook'], texto: string) => {
  act(() => {
    hook.result.current.responder(texto)
  })
}

describe('trocar de aba no meio da partida', () => {
  it('grava o parcial sem encerrar a partida', () => {
    const { hook, aoFinalizar } = montar(BARALHO)
    responder(hook, 'alfa')
    responder(hook, 'beta')

    esconderAba()

    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 2, completou: false })
    // O ponto do bug: a carta continua na mesa, esperando quem voltou.
    expect(hook.result.current.estado).toBe('jogando')
    expect(hook.result.current.carta?.id).toBe('c3')

    voltarParaAba()
    responder(hook, 'gama')
    expect(hook.result.current.acertos).toBe(3)
  })

  it('voltar e terminar o baralho grava o desfecho real', () => {
    const { hook, aoFinalizar } = montar(BARALHO)
    responder(hook, 'alfa')
    esconderAba()
    voltarParaAba()

    responder(hook, 'beta')
    responder(hook, 'gama')
    responder(hook, 'delta')

    expect(hook.result.current.estado).toBe('fim')
    const [parcial, fim] = aoFinalizar.mock.calls.map((c) => c[0]) as [Parcial, Parcial]
    expect(parcial.pontuacao).toBe(1)
    expect(fim).toMatchObject({ pontuacao: 4, completou: true })
    expect(fim.runId).toBe(parcial.runId)

    const vazio: Banco = { versao: 1, entradas: {} }
    const um = registrar(vazio, { ...parcial, jogoId: 'grego' })
    const dois = registrar(um.banco, { ...fim, jogoId: 'grego' })
    expect(dois.entrada.recorde.pontuacao, 'o desfecho não pode ser engolido').toBe(4)
    expect(dois.entrada.partidas, 'continua sendo UMA partida').toBe(1)
  })

  it('desmontar a tela grava o parcial', () => {
    const { hook, aoFinalizar } = montar(BARALHO)
    responder(hook, 'alfa')

    hook.unmount()

    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 1, completou: false })
  })
})

describe('pular a carta que ele não sabe', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('revela o gabarito, conta erro e avança', () => {
    const { hook } = montar(BARALHO)

    act(() => {
      hook.result.current.pular()
    })
    expect(hook.result.current.correcao).toBe('alfa')
    expect(hook.result.current.acertos).toBe(0)
    expect(hook.result.current.erros).toBe(1)
    // Ainda na mesma carta enquanto o gabarito está na tela.
    expect(hook.result.current.carta?.id).toBe('c1')

    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(hook.result.current.correcao).toBeNull()
    expect(hook.result.current.carta?.id).toBe('c2')
    expect(hook.result.current.estado).toBe('jogando')
  })

  it('não pula duas vezes enquanto o gabarito está na tela', () => {
    const { hook } = montar(BARALHO)
    act(() => {
      hook.result.current.pular()
    })
    act(() => {
      hook.result.current.pular()
    })
    expect(hook.result.current.erros).toBe(1)
  })

  it('em morte súbita, pular encerra a partida como um erro encerra', () => {
    const { hook, aoFinalizar } = montar(MORTE_SUBITA)
    act(() => {
      hook.result.current.responder('alfa')
    })

    act(() => {
      hook.result.current.pular()
    })

    expect(hook.result.current.estado).toBe('fim')
    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({
      pontuacao: 1,
      erros: 1,
      completou: false,
    })
  })
})
