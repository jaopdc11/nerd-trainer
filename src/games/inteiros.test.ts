import { describe, expect, it } from 'vitest'
import { fibonacciJogo, potencias2Jogo, primosJogo } from './inteiros'

const itensDe = (jogo: typeof primosJogo, ate: number): string[] => {
  const itemEm = jogo.config().itemEm
  if (!itemEm) throw new Error('jogo sem itemEm')
  const saida: string[] = []
  for (let i = 0; i < ate; i++) {
    const item = itemEm(i)
    if (item === null) break
    saida.push(item)
  }
  return saida
}

describe('primos', () => {
  it('começa certo e não pula nenhum', () => {
    expect(itensDe(primosJogo, 10)).toEqual(
      ['2', '3', '5', '7', '11', '13', '17', '19', '23', '29'],
    )
  })

  it('cresce o crivo sem furar', () => {
    const itemEm = primosJogo.config().itemEm
    // O 1000º primo é 7919 — número clássico, e está bem além do crivo inicial.
    expect(itemEm?.(999)).toBe('7919')
    // O 10000º é 104729; é também o último, então o seguinte encerra o jogo.
    expect(itemEm?.(9999)).toBe('104729')
    expect(itemEm?.(10_000)).toBeNull()
  })
})

describe('fibonacci', () => {
  it('começa em 1, 1 e soma os dois anteriores', () => {
    expect(itensDe(fibonacciJogo, 10)).toEqual(
      ['1', '1', '2', '3', '5', '8', '13', '21', '34', '55'],
    )
  })

  it('mantém exatidão além de 2^53, onde Number arredondaria', () => {
    const itemEm = fibonacciJogo.config().itemEm
    // F(79) na contagem 1,1,2… é o índice 78 e já passa de 2^53.
    expect(itemEm?.(78)).toBe('14472334024676221')
    expect(Number(itemEm?.(78))).toBeGreaterThan(Number.MAX_SAFE_INTEGER)
    // F(100) escrito à mão: qualquer volta para `number` quebra este teste.
    expect(itemEm?.(99)).toBe('354224848179261915075')
  })
})

describe('potências de 2', () => {
  it('vai de 2^0 a 2^64 e para lá', () => {
    const itemEm = potencias2Jogo.config().itemEm
    expect(itemEm?.(0)).toBe('1')
    expect(itemEm?.(10)).toBe('1024')
    expect(itemEm?.(64)).toBe('18446744073709551616')
    expect(itemEm?.(65)).toBeNull()
  })

  it('não repete o erro de Number: 2^64 termina em 551616, não 552000', () => {
    const itemEm = potencias2Jogo.config().itemEm
    expect(itemEm?.(64)).not.toBe(String(2 ** 64))
    expect(String(2 ** 64)).toBe('18446744073709552000') // o que NÃO queremos
  })
})
