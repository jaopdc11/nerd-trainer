import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { registrar } from '@/core/storage'
import type { Banco } from '@/core/storage'
import type { ConfigSequencia, ResultadoRun } from '@/core/types'
import { esconderAba, voltarParaAba } from '../trocaDeAba.testing'
import { useSequence } from './useSequence'

type Parcial = Omit<ResultadoRun, 'jogoId' | 'modoId'>

const DIGITOS: ConfigSequencia = {
  itens: [...'14159265'],
  total: 8,
  entrada: 'caractere',
  teclado: 'numerico',
  prefixo: '3,',
  revisaoPosMorte: 3,
}

const TERMOS: ConfigSequencia = {
  itemEm: (i) => (i > 4 ? null : (2n ** BigInt(i)).toString()),
  total: 5,
  entrada: 'termo',
  teclado: 'numerico',
  separador: ', ',
}

/**
 * Monta a sessão já jogando: a abertura é do fluxo da tela, e repetir o clique
 * em "Começar" em cada teste só esconderia o que cada um prova.
 */
function montar(config: ConfigSequencia) {
  const aoFinalizar = vi.fn<(r: Parcial) => void>()
  const hook = renderHook(() => useSequence(config, aoFinalizar))
  act(() => {
    hook.result.current.iniciar()
  })
  return { hook, aoFinalizar }
}

describe('useSequence', () => {
  it('nasce na abertura e ignora o teclado antes de iniciar', () => {
    const aoFinalizar = vi.fn<(r: Parcial) => void>()
    const hook = renderHook(() => useSequence(DIGITOS, aoFinalizar))
    expect(hook.result.current.estado).toBe('pronto')

    act(() => {
      hook.result.current.digitar('1') // seria o item certo, mas o jogo não começou
    })
    expect(hook.result.current.estado).toBe('pronto')
    expect(hook.result.current.indice).toBe(0)
    expect(aoFinalizar).not.toHaveBeenCalled()

    act(() => {
      hook.result.current.iniciar()
    })
    expect(hook.result.current.estado).toBe('jogando')

    act(() => {
      hook.result.current.digitar('1')
    })
    expect(hook.result.current.indice).toBe(1)
  })

  it('avança enquanto acerta', () => {
    const { hook } = montar(DIGITOS)
    for (const c of '1415') {
      act(() => {
        hook.result.current.digitar(c)
      })
    }
    expect(hook.result.current.indice).toBe(4)
    expect(hook.result.current.acertados.join('')).toBe('1415')
  })

  it('mata na primeira tecla errada e guarda o que era esperado', () => {
    const { hook, aoFinalizar } = montar(DIGITOS)
    act(() => {
      hook.result.current.digitar('1')
    })
    act(() => {
      hook.result.current.digitar('7') // era 4
    })

    expect(hook.result.current.estado).toBe('morto')
    expect(hook.result.current.erro).toMatchObject({ esperado: '4', digitado: '7', indice: 1 })
    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 1, completou: false })
  })

  it('mostra os próximos itens só depois do fim', () => {
    const { hook } = montar(DIGITOS)
    act(() => {
      hook.result.current.digitar('1')
    })
    expect(hook.result.current.proximos).toEqual([])

    act(() => {
      hook.result.current.digitar('0') // era 4
    })
    // Revisão pós-morte: retoma de onde parou, não do começo.
    expect(hook.result.current.proximos).toEqual(['4', '1', '5'])
  })

  it('ignora teclas depois de morrer', () => {
    const { hook, aoFinalizar } = montar(DIGITOS)
    act(() => {
      hook.result.current.digitar('9') // era 1
    })
    act(() => {
      hook.result.current.digitar('1')
    })
    expect(hook.result.current.indice).toBe(0)
    expect(aoFinalizar).toHaveBeenCalledOnce()
  })

  it('completa a sequência inteira e marca completou', () => {
    const { hook, aoFinalizar } = montar(DIGITOS)
    for (const c of '14159265') {
      act(() => {
        hook.result.current.digitar(c)
      })
    }
    expect(hook.result.current.estado).toBe('completo')
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 8, completou: true })
  })

  it('reinicia zerando tudo e voltando para a abertura', () => {
    const { hook } = montar(DIGITOS)
    act(() => {
      hook.result.current.digitar('1')
    })
    act(() => {
      hook.result.current.digitar('9')
    })

    act(() => {
      hook.result.current.reiniciar()
    })
    expect(hook.result.current.estado).toBe('pronto')
    expect(hook.result.current.indice).toBe(0)
    expect(hook.result.current.erro).toBeNull()
  })

  it('"tentar de novo" recomeça direto, com runId novo', () => {
    const { hook, aoFinalizar } = montar(DIGITOS)
    act(() => {
      hook.result.current.digitar('1')
    })
    act(() => {
      hook.result.current.digitar('9')
    })
    const primeiroRun = aoFinalizar.mock.calls[0]?.[0].runId

    act(() => {
      hook.result.current.iniciar()
    })
    expect(hook.result.current.estado).toBe('jogando')
    expect(hook.result.current.indice).toBe(0)
    expect(hook.result.current.erro).toBeNull()

    act(() => {
      hook.result.current.digitar('9')
    })
    // Partida nova: o runId tem de mudar, senão a idempotência do storage
    // trataria as duas como a mesma.
    expect(aoFinalizar.mock.calls[1]?.[0].runId).not.toBe(primeiroRun)
  })

  it('trocar de aba grava o parcial e a partida continua de onde parou', () => {
    const { hook, aoFinalizar } = montar(DIGITOS)
    for (const c of '14') {
      act(() => {
        hook.result.current.digitar(c)
      })
    }

    esconderAba()

    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 2, completou: false })
    // O ponto do bug: a sessão NÃO pode ter terminado.
    expect(hook.result.current.estado).toBe('jogando')
    expect(hook.result.current.indice).toBe(2)

    voltarParaAba()
    act(() => {
      hook.result.current.digitar('1')
    })
    expect(hook.result.current.indice).toBe(3)
  })

  it('voltar e morrer com pontuação maior grava o desfecho real', () => {
    const { hook, aoFinalizar } = montar(DIGITOS)
    for (const c of '14') {
      act(() => {
        hook.result.current.digitar(c)
      })
    }
    esconderAba()
    voltarParaAba()

    for (const c of '159') {
      act(() => {
        hook.result.current.digitar(c)
      })
    }
    act(() => {
      hook.result.current.digitar('0') // era 2
    })

    expect(hook.result.current.estado).toBe('morto')
    const [parcial, fim] = aoFinalizar.mock.calls.map((c) => c[0]) as [Parcial, Parcial]
    expect(parcial.pontuacao).toBe(2)
    expect(fim.pontuacao).toBe(5)
    // Mesma partida: é o runId igual que faz a idempotência atualizar em vez de
    // duplicar — e é justamente ele que quase engoliu o desfecho real.
    expect(fim.runId).toBe(parcial.runId)

    const vazio: Banco = { versao: 1, entradas: {} }
    const um = registrar(vazio, { ...parcial, jogoId: 'pi' })
    const dois = registrar(um.banco, { ...fim, jogoId: 'pi' })
    expect(dois.entrada.recorde.pontuacao).toBe(5)
    expect(dois.entrada.partidas).toBe(1)
  })

  it('desmontar a tela grava o parcial', () => {
    const { hook, aoFinalizar } = montar(DIGITOS)
    for (const c of '141') {
      act(() => {
        hook.result.current.digitar(c)
      })
    }

    hook.unmount()

    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 3, completou: false })
  })

  it('não grava nada se ele trocar de aba sem ter pontuado', () => {
    const { aoFinalizar } = montar(DIGITOS)
    esconderAba()
    expect(aoFinalizar).not.toHaveBeenCalled()
  })

  it('aceita termos inteiros com qualquer separador de milhar', () => {
    const { hook } = montar(TERMOS)
    act(() => {
      hook.result.current.enviar('1')
    })
    act(() => {
      hook.result.current.enviar('2')
    })
    act(() => {
      hook.result.current.enviar('4')
    })
    expect(hook.result.current.indice).toBe(3)

    act(() => {
      hook.result.current.enviar('8')
    })
    act(() => {
      hook.result.current.enviar('1.6') // separador de milhar, vale 16
    })
    expect(hook.result.current.estado).toBe('completo')
  })
})
