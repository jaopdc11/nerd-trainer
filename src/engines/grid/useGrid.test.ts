import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ResultadoRun } from '@/core/types'
import { tabelaPeriodica } from '@/games/tabela-periodica'
import { useGrid } from './useGrid'

type Parcial = Omit<ResultadoRun, 'jogoId' | 'modoId'>

function montar(modoId: string) {
  const aoFinalizar = vi.fn<(r: Parcial) => void>()
  const config = tabelaPeriodica.config(modoId)
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

describe('modo pelo nome', () => {
  it('faz a resposta cair na célula certa, em qualquer ordem', () => {
    const { hook } = montar('nome')

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
    const { hook } = montar('nome')
    expect(responder(hook, 'nitrogenio')).not.toBe('errado')
    expect(responder(hook, 'Natrium')).not.toBe('errado')
    expect(hook.result.current.preenchidas.get('z7')).toBe('N')
    expect(hook.result.current.preenchidas.get('z11')).toBe('Na')
  })

  it('não preenche duas vezes a mesma célula', () => {
    const { hook } = montar('nome')
    responder(hook, 'ferro')
    expect(responder(hook, 'ferro')).toBe('errado')
    expect(hook.result.current.acertos).toBe(1)
    expect(hook.result.current.erros).toBe(1)
  })

  it('conta erro quando o nome não existe', () => {
    const { hook } = montar('nome')
    expect(responder(hook, 'kriptonita')).toBe('errado')
    expect(hook.result.current.acertos).toBe(0)
    expect(hook.result.current.erros).toBe(1)
  })

  it('não deixa um erro de digitação cair na célula de outro elemento', () => {
    const { hook } = montar('nome')
    // "cobra" fica a um caractere de "cobre"; mas é curto demais para a
    // tolerância, e "cobalto" está por perto no baralho.
    expect(responder(hook, 'cobra')).toBe('errado')
    expect(hook.result.current.preenchidas.get('z29')).toBeUndefined()
    expect(hook.result.current.preenchidas.get('z27')).toBeUndefined()
  })
})

describe('modo pelo símbolo', () => {
  it('distingue Co de CO', () => {
    const { hook } = montar('simbolo')
    responder(hook, 'Co')
    expect(hook.result.current.preenchidas.get('z27')).toBe('Co')

    // CO não é elemento nenhum: não pode cair em cobalto nem em carbono.
    expect(responder(hook, 'CO')).toBe('errado')
    expect(hook.result.current.preenchidas.get('z6')).toBeUndefined()
  })

  it('recusa o símbolo em caixa errada', () => {
    const { hook } = montar('simbolo')
    expect(responder(hook, 'fe')).toBe('errado')
    expect(responder(hook, 'FE')).toBe('errado')
    expect(responder(hook, 'Fe')).not.toBe('errado')
  })
})

describe('modo pelo número atômico', () => {
  it('pergunta uma célula por vez e avança ao acertar', () => {
    const { hook } = montar('por-z')
    const primeiro = hook.result.current.alvo
    expect(primeiro).not.toBeNull()

    const z = Number(primeiro?.rotulo)
    const nome = primeiro?.gabarito.split(' · ')[1] ?? ''
    expect(responder(hook, nome)).not.toBe('errado')

    expect(hook.result.current.preenchidas.get(`z${z}`)).toBeDefined()
    expect(hook.result.current.alvo?.id).not.toBe(primeiro?.id)
  })

  it('aceita também o símbolo como resposta', () => {
    const { hook } = montar('por-z')
    const simbolo = hook.result.current.alvo?.gabarito.split(' · ')[0] ?? ''
    expect(responder(hook, simbolo)).not.toBe('errado')
  })
})

describe('encerramento', () => {
  it('desistir grava o parcial e lista o que faltou', () => {
    const { hook, aoFinalizar } = montar('nome')
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
    const { hook, aoFinalizar } = montar('nome')
    act(() => {
      hook.result.current.encerrar()
    })
    act(() => {
      hook.result.current.encerrar()
    })
    expect(aoFinalizar).toHaveBeenCalledOnce()
  })
})
