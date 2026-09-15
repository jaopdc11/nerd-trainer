import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ConfigSequencia, ResultadoRun } from '@/core/types'
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

function montar(config: ConfigSequencia) {
  const aoFinalizar = vi.fn<(r: Parcial) => void>()
  const hook = renderHook(() => useSequence(config, aoFinalizar))
  return { hook, aoFinalizar }
}

describe('useSequence', () => {
  it('começa pronto e vira jogando na primeira tecla', () => {
    const { hook } = montar(DIGITOS)
    expect(hook.result.current.estado).toBe('pronto')

    act(() => {
      hook.result.current.digitar('1')
    })
    expect(hook.result.current.estado).toBe('jogando')
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

  it('reinicia zerando tudo e trocando o runId', () => {
    const { hook, aoFinalizar } = montar(DIGITOS)
    act(() => {
      hook.result.current.digitar('1')
    })
    act(() => {
      hook.result.current.digitar('9')
    })
    const primeiroRun = aoFinalizar.mock.calls[0]?.[0].runId

    act(() => {
      hook.result.current.reiniciar()
    })
    expect(hook.result.current.estado).toBe('pronto')
    expect(hook.result.current.indice).toBe(0)
    expect(hook.result.current.erro).toBeNull()

    act(() => {
      hook.result.current.digitar('9')
    })
    expect(aoFinalizar.mock.calls[1]?.[0].runId).not.toBe(primeiroRun)
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
