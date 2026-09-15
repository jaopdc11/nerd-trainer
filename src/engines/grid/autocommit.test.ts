import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { completaSemAmbiguidade } from '@/core/answer'
import type { ResultadoRun } from '@/core/types'
import { tabelaPeriodica } from '@/games/tabela-periodica'
import { useGrid } from './useGrid'

type Parcial = Omit<ResultadoRun, 'jogoId' | 'modoId'>

function montar() {
  const aoFinalizar = vi.fn<(r: Parcial) => void>()
  const hook = renderHook(() => useGrid(tabelaPeriodica.config(), aoFinalizar))
  act(() => {
    hook.result.current.iniciar()
  })
  return hook
}

const responder = (hook: ReturnType<typeof montar>, texto: string) => {
  act(() => {
    hook.result.current.responder(texto)
  })
}

describe('completaSemAmbiguidade', () => {
  it('aceita quando nada mais continua a partir do texto', () => {
    expect(completaSemAmbiguidade('ferro', ['ferro', 'cobre'])).toBe(true)
  })

  it('espera quando o texto ainda pode crescer', () => {
    // "N" é nitrogênio, mas também começa Na, Ne, Ni. Commitar aqui tornaria
    // impossível digitar sódio.
    expect(completaSemAmbiguidade('N', ['N', 'Na', 'Ne', 'Ni'])).toBe(false)
  })

  it('recusa o que não casa com nada', () => {
    expect(completaSemAmbiguidade('Xy', ['N', 'Na'])).toBe(false)
    expect(completaSemAmbiguidade('', ['N'])).toBe(false)
  })

  it('aceita o prefixo assim que as continuações somem', () => {
    expect(completaSemAmbiguidade('N', ['N'])).toBe(true)
  })
})

describe('auto-commit na tabela periódica', () => {
  it('commita um nome completo sem esperar o Enter', () => {
    const hook = montar()
    expect(hook.result.current.podeAutoCommitar('oganessonio')).toBe(true)
    expect(hook.result.current.podeAutoCommitar('ouro')).toBe(true)
  })

  it('não commita um nome que é começo de outro', () => {
    const hook = montar()
    // "Bor" ainda pode virar "Boro"; "Cob" pode virar Cobre ou Cobalto.
    expect(hook.result.current.podeAutoCommitar('bor')).toBe(false)
    expect(hook.result.current.podeAutoCommitar('cob')).toBe(false)
  })

  it('não commita o que não é elemento', () => {
    const hook = montar()
    expect(hook.result.current.podeAutoCommitar('kriptonita')).toBe(false)
  })

  it('não commita mais um elemento já preenchido', () => {
    const hook = montar()
    responder(hook, 'ouro')
    expect(hook.result.current.podeAutoCommitar('ouro')).toBe(false)
  })

  it('não commita antes do jogo começar', () => {
    const aoFinalizar = vi.fn<(r: Parcial) => void>()
    const hook = renderHook(() => useGrid(tabelaPeriodica.config(), aoFinalizar))
    expect(hook.result.current.podeAutoCommitar('ouro')).toBe(false)
  })
})
