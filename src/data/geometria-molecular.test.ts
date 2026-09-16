import { describe, expect, it } from 'vitest'
import { MOLECULAS, POR_DOMINIOS } from './geometria-molecular'

/**
 * A geometria eletrônica não é um dado independente: ela é função *só* do
 * número de domínios. Então o teste a recalcula a partir de `ligados` e
 * `isolados` em vez de confiar no que está escrito — se alguém digitar o campo
 * errado ao acrescentar uma molécula, o baralho passaria a oferecer um distrator
 * absurdo e nada acusaria.
 */
describe('coerência do dataset', () => {
  it('a geometria eletrônica sai da contagem de domínios', () => {
    for (const m of MOLECULAS) {
      const esperada = POR_DOMINIOS[m.ligados + m.isolados]
      expect(m.eletronica, `${m.formula}`).toBe(esperada)
    }
  })

  it('a notação AXE bate com a contagem', () => {
    const IND = ['₀', '₁', '₂', '₃', '₄', '₅', '₆'] as const
    for (const m of MOLECULAS) {
      const x = m.ligados === 1 ? 'X' : `X${IND[m.ligados]}`
      const e = m.isolados === 0 ? '' : m.isolados === 1 ? 'E' : `E${IND[m.isolados]}`
      expect(m.axe, `${m.formula}`).toBe(`A${x}${e}`)
    }
  })

  it('só difere da eletrônica quando há par isolado', () => {
    for (const m of MOLECULAS) {
      expect(m.geometria === m.eletronica, `${m.formula}`).toBe(m.isolados === 0)
    }
  })

  it('nenhuma fórmula repetida', () => {
    const vistas = new Set(MOLECULAS.map((m) => m.formula))
    expect(vistas.size).toBe(MOLECULAS.length)
  })

  it('índices e cargas em Unicode, nunca em ASCII', () => {
    // "H2O" com o 2 na linha de base destoaria das outras fórmulas na carta.
    for (const m of MOLECULAS) {
      expect(m.formula, `${m.formula} tem dígito ASCII`).not.toMatch(/\d/)
      expect(m.formula, `${m.formula} usa - ou + ASCII`).not.toMatch(/[-+]/)
    }
  })

  it('cobre a tabela VSEPR inteira, sem forma órfã', () => {
    const usadas = new Set(MOLECULAS.map((m) => m.geometria))
    for (const forma of [
      'linear',
      'angular',
      'trigonal plana',
      'piramidal trigonal',
      'tetraédrica',
      'bipiramidal trigonal',
      'gangorra',
      'forma de T',
      'quadrada planar',
      'piramidal quadrada',
      'octaédrica',
    ]) {
      expect(usadas.has(forma as never), `nenhuma molécula é ${forma}`).toBe(true)
    }
  })

  it('a meta do Nerdômetro é o baralho inteiro', async () => {
    const { CRITERIOS } = await import('@/core/nerdometro')
    const c = CRITERIOS.find((x) => x.jogoId === 'geometria-molecular')
    expect(c?.meta).toBe(MOLECULAS.length)
  })
})
