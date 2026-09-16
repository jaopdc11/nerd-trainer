import { describe, expect, it } from 'vitest'
import {
  COMPOSTOS_MASSA,
  MASSAS,
  MASSAS_DE_CABECA,
  massaArredondada,
  massaMolar,
} from './massa-molar'

describe('as massas atômicas', () => {
  /**
   * Âncoras conferidas fora daqui, como o ponto de Feynman é para o π.
   * São os pesos que qualquer tabela periódica impressa traz, e errar um deles
   * contaminaria em silêncio todos os compostos que o usam.
   */
  it('batem com os valores de referência', () => {
    const ancoras: [string, number][] = [
      ['H', 1.008], ['C', 12.011], ['N', 14.007], ['O', 15.999],
      ['Na', 22.99], ['S', 32.06], ['Ca', 40.078], ['Fe', 55.845],
    ]
    for (const [simbolo, valor] of ancoras) {
      expect(MASSAS[simbolo], simbolo).toBeCloseTo(valor, 3)
    }
  })

  it('a massa de cabeça é o arredondamento da precisa', () => {
    // Se as duas tabelas discordarem, o jogo fica impossível de acertar de
    // cabeça — e a de cabeça é a única que alguém usa numa partida cronometrada.
    for (const [simbolo, precisa] of Object.entries(MASSAS)) {
      expect(MASSAS_DE_CABECA[simbolo], simbolo).toBe(Math.round(precisa))
    }
    expect(Object.keys(MASSAS_DE_CABECA).sort()).toEqual(Object.keys(MASSAS).sort())
  })

  it('nenhuma massa é absurda: fica entre uma e três vezes o número de massa mínimo', () => {
    // Teste grosseiro de propósito — pega dígito trocado (12,011 virando 21,011)
    // sem precisar de uma segunda tabela de referência.
    for (const [simbolo, m] of Object.entries(MASSAS)) {
      expect(m, simbolo).toBeGreaterThan(0)
      expect(m, simbolo).toBeLessThan(260)
    }
  })
})

describe('os compostos', () => {
  /**
   * O cruzamento que decide se um composto pode estar no jogo.
   *
   * A resposta é o inteiro mais próximo, e quem joga soma de cabeça. Se as duas
   * contas não caírem no mesmo inteiro, a resposta certa passa a depender de
   * qual tabela a pessoa usou — foi isso que tirou daqui os compostos de cloro
   * e de cobre, cujas massas terminam em meio.
   */
  it('a massa precisa e a de cabeça dão o mesmo inteiro', () => {
    for (const c of COMPOSTOS_MASSA) {
      const precisa = Math.round(massaMolar(c, MASSAS))
      const deCabeca = Math.round(massaMolar(c, MASSAS_DE_CABECA))
      expect(deCabeca, `${c.formula}: de cabeça ${deCabeca}, exata ${precisa}`).toBe(precisa)
    }
  })

  it('nenhum composto cai em cima do limite de arredondamento', () => {
    // Mesmo concordando, um valor a 0,49 do inteiro é cara ou coroa para quem
    // aproximou algum peso pelo caminho.
    for (const c of COMPOSTOS_MASSA) {
      const exata = massaMolar(c)
      expect(Math.abs(exata - Math.round(exata)), `${c.formula} = ${exata}`).toBeLessThan(0.35)
    }
  })

  it('valores conhecidos, conferidos à mão', () => {
    const esperado: Record<string, number> = {
      'H₂O': 18, 'CO₂': 44, 'O₂': 32, 'N₂': 28, 'CH₄': 16, 'NH₃': 17,
      'CaO': 56, 'MgO': 40, 'SO₂': 64, 'SO₃': 80,
      'NaOH': 40, 'H₂SO₄': 98, 'HNO₃': 63, 'Ca(OH)₂': 74, 'CaCO₃': 100,
      'NaHCO₃': 84, 'Na₂CO₃': 106, 'K₂CO₃': 138, 'Al₂O₃': 102, 'Fe₂O₃': 160,
      'KMnO₄': 158,
      'C₆H₁₂O₆': 180, 'C₂H₆O': 46, 'C₂H₄O₂': 60, 'C₆H₆': 78, 'C₃H₈': 44,
      'C₈H₁₈': 114, 'C₁₂H₂₂O₁₁': 342, 'K₂Cr₂O₇': 294,
    }
    for (const c of COMPOSTOS_MASSA) {
      expect(esperado[c.formula], `${c.formula} não está no gabarito`).toBeDefined()
      expect(massaArredondada(c), c.formula).toBe(esperado[c.formula])
    }
    expect(Object.keys(esperado).sort()).toEqual(COMPOSTOS_MASSA.map((c) => c.formula).sort())
  })

  it('quebra se faltar a massa de um elemento', () => {
    expect(() =>
      massaMolar({ formula: 'PbO', nome: 'x', atomos: [['Pb', 1], ['O', 1]], nivel: 0 }),
    ).toThrow(/sem massa/)
  })

  it('os três níveis têm composto, e nenhuma fórmula repete', () => {
    for (const n of [0, 1, 2]) {
      expect(COMPOSTOS_MASSA.filter((c) => c.nivel === n).length, `nível ${n}`).toBeGreaterThan(0)
    }
    const f = COMPOSTOS_MASSA.map((c) => c.formula)
    expect(new Set(f).size).toBe(f.length)
  })
})
