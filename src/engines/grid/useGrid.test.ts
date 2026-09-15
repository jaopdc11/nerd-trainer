import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ResultadoRun } from '@/core/types'
import { tabelaPeriodica } from '@/games/tabela-periodica'
import { useGrid } from './useGrid'

type Parcial = Omit<ResultadoRun, 'jogoId' | 'modoId'>

function montar() {
  const aoFinalizar = vi.fn<(r: Parcial) => void>()
  const config = tabelaPeriodica.config()
  const hook = renderHook(() => useGrid(config, aoFinalizar))
  act(() => {
    hook.result.current.iniciar()
  })
  return { hook, aoFinalizar, config }
}

const responder = (hook: ReturnType<typeof montar>['hook'], texto: string) => {
  let veredito = ''
  act(() => {
    veredito = hook.result.current.responder(texto)
  })
  return veredito
}

describe('preenchimento em ordem livre', () => {
  it('faz a resposta cair na célula certa, em qualquer ordem', () => {
    const { hook } = montar()

    responder(hook, 'ouro')
    responder(hook, 'hidrogênio')
    responder(hook, 'OGANESSÔNIO')

    const p = hook.result.current.preenchidas
    expect(p.get('z79')).toBe('Au')
    expect(p.get('z1')).toBe('H')
    expect(p.get('z118')).toBe('Og')
    expect(hook.result.current.acertos).toBe(3)
  })

  it('aceita sem acento e aceita o nome em latim', () => {
    const { hook } = montar()
    expect(responder(hook, 'nitrogenio')).not.toBe('errado')
    expect(responder(hook, 'Natrium')).not.toBe('errado')
    expect(hook.result.current.preenchidas.get('z7')).toBe('N')
    expect(hook.result.current.preenchidas.get('z11')).toBe('Na')
  })

  it('não preenche duas vezes a mesma célula', () => {
    const { hook } = montar()
    responder(hook, 'ferro')
    expect(responder(hook, 'ferro')).toBe('errado')
    expect(hook.result.current.acertos).toBe(1)
    expect(hook.result.current.erros).toBe(1)
  })

  it('conta erro quando o nome não existe', () => {
    const { hook } = montar()
    expect(responder(hook, 'kriptonita')).toBe('errado')
    expect(hook.result.current.acertos).toBe(0)
    expect(hook.result.current.erros).toBe(1)
  })

  it('não deixa um erro de digitação cair na célula de outro elemento', () => {
    const { hook } = montar()
    // "cobra" fica a um caractere de "cobre"; mas é curto demais para a
    // tolerância, e "cobalto" está por perto no baralho.
    expect(responder(hook, 'cobra')).toBe('errado')
    expect(hook.result.current.preenchidas.get('z29')).toBeUndefined()
    expect(hook.result.current.preenchidas.get('z27')).toBeUndefined()
  })
})

describe('encerramento', () => {
  it('desistir grava o parcial e lista o que faltou', () => {
    const { hook, aoFinalizar } = montar()
    responder(hook, 'ouro')
    responder(hook, 'prata')

    act(() => {
      hook.result.current.encerrar()
    })

    expect(hook.result.current.estado).toBe('fim')
    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({
      pontuacao: 2,
      total: 118,
      completou: false,
    })
    expect(hook.result.current.faltaram).toHaveLength(116)
  })

  it('não grava duas vezes se encerrar for chamado de novo', () => {
    const { hook, aoFinalizar } = montar()
    act(() => {
      hook.result.current.encerrar()
    })
    act(() => {
      hook.result.current.encerrar()
    })
    expect(aoFinalizar).toHaveBeenCalledOnce()
  })
})
