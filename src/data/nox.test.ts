import { describe, expect, it } from 'vitest'
import { COMPOSTOS, distratores, exibirNox, nox } from './nox'

/**
 * O gabarito, escrito à mão.
 *
 * `nox()` resolve a equação sozinho, e é justamente por isso que ele não pode
 * se autoaprovar: um erro de composição no dataset (`O` com quantidade errada,
 * carga trocada de sinal) devolveria um inteiro perfeitamente plausível e o
 * jogo ensinaria química errada em silêncio. Estes números vieram da tabela, um
 * a um, não da função.
 */
const GABARITO: Readonly<Record<string, number>> = {
  'H₂SO₄': 6, 'HNO₃': 5, 'H₃PO₄': 5, 'H₂CO₃': 4, 'HClO₄': 7, 'HClO': 1,
  'H₂SO₃': 4, 'SO₂': 4, 'SO₃': 6, 'N₂O₅': 5, 'N₂O': 1, 'Fe₂O₃': 3,
  'MnO₂': 4, 'Cu₂O': 1, 'FeCl₃': 3, 'NH₃': -3, 'CH₄': -4,
  'SO₄²⁻': 6, 'SO₃²⁻': 4, 'NO₃⁻': 5, 'NO₂⁻': 3, 'MnO₄⁻': 7, 'Cr₂O₇²⁻': 6,
  'CrO₄²⁻': 6, 'PO₄³⁻': 5, 'CO₃²⁻': 4, 'ClO₃⁻': 5, 'ClO₂⁻': 3, 'NH₄⁺': -3,
  'S₂O₃²⁻': 2,
  'H₂O₂': -1, 'Na₂O₂': -1, 'OF₂': 2, 'NaH': -1, 'CaH₂': -1, 'LiAlH₄': -1,
}

describe('nox', () => {
  it('bate com o gabarito conferido à mão, composto a composto', () => {
    for (const c of COMPOSTOS) {
      const esperado = GABARITO[c.formula]
      expect(esperado, `${c.formula} não está no gabarito do teste`).toBeDefined()
      expect(nox(c), `${c.formula}, nox do ${c.alvo}`).toBe(esperado)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual(COMPOSTOS.map((c) => c.formula).sort())
  })

  it('as armadilhas contradizem mesmo a regra decorada', () => {
    // Se algum dia estes caírem no valor "de livro", o nível 2 perdeu a razão
    // de existir e alguém mexeu na composição sem perceber.
    const de = (f: string) => nox(COMPOSTOS.find((c) => c.formula === f) as never)
    expect(de('H₂O₂'), 'peróxido tem de fugir do −2').not.toBe(-2)
    expect(de('OF₂'), 'oxigênio ligado a flúor tem de ser positivo').toBeGreaterThan(0)
    expect(de('NaH'), 'hidreto tem de fugir do +1').not.toBe(1)
    expect(de('LiAlH₄')).toBe(-1)
  })
})

describe('distratores', () => {
  it('dão sempre pelo menos três opções erradas, distintas e plausíveis', () => {
    for (const c of COMPOSTOS) {
      const errados = distratores(c)
      expect(errados.length, c.formula).toBeGreaterThanOrEqual(3)
      expect(new Set(errados).size, c.formula).toBe(errados.length)
      for (const v of errados) {
        expect(v, `${c.formula}: ${v} é a resposta certa`).not.toBe(nox(c))
        expect(Number.isInteger(v), `${c.formula}: ${v}`).toBe(true)
        // Fora da faixa que existe em química, a opção se elimina sozinha e a
        // carta vira três alternativas.
        expect(v, `${c.formula}: ${v}`).toBeGreaterThanOrEqual(-4)
        expect(v, `${c.formula}: ${v}`).toBeLessThanOrEqual(7)
      }
    }
  })

  it('oferecem a regra decorada onde ela trai — que é o nível 2 inteiro', () => {
    // Em H₂O₂ o oxigênio vale −1, e −2 tem de estar na tela: é a opção que a
    // pessoa marca quando repete "oxigênio é sempre −2".
    const de = (f: string) => distratores(COMPOSTOS.find((c) => c.formula === f) as never)
    expect(de('H₂O₂')).toContain(-2)
    expect(de('Na₂O₂')).toContain(-2)
    expect(de('OF₂')).toContain(-2)
    expect(de('NaH')).toContain(1)
    expect(de('CaH₂')).toContain(1)
    expect(de('LiAlH₄')).toContain(1)
  })

  it('oferecem a carga esquecida nos íons', () => {
    // Em SO₄²⁻ o enxofre é +6; quem resolve como se o íon fosse neutro acha +8.
    const sulfato = COMPOSTOS.find((c) => c.formula === 'SO₄²⁻') as never
    expect(nox(sulfato)).toBe(6)
    // +8 está fora da faixa e cai fora de propósito: sobra o resto da lista.
    expect(distratores(sulfato).length).toBeGreaterThanOrEqual(3)

    // No nitrito o erro de carga cabe na faixa e tem de aparecer: +3 é o certo,
    // +4 é o que sai sem a carga.
    const nitrito = COMPOSTOS.find((c) => c.formula === 'NO₂⁻') as never
    expect(nox(nitrito)).toBe(3)
    expect(distratores(nitrito)).toContain(4)
  })
})

describe('guardas', () => {
  it('quebra quando o acompanhante não tem nox fixo', () => {
    // Dois metais de transição no mesmo composto: não dá para resolver, e
    // devolver um número seria pior que falhar.
    expect(() =>
      nox({
        formula: 'FeCrO₄', nome: 'inventado', alvo: 'Fe',
        atomos: [['Fe', 1], ['Cr', 1], ['O', 4]], carga: 0, nivel: 0,
      }),
    ).toThrow(/nox fixo/)
  })

  it('quebra quando o resultado não é inteiro', () => {
    // Fe₃O₄ dá 8/3. A resposta do jogo é digitada: fração não entra.
    expect(() =>
      nox({
        formula: 'Fe₃O₄', nome: 'magnetita', alvo: 'Fe',
        atomos: [['Fe', 3], ['O', 4]], carga: 0, nivel: 0,
      }),
    ).toThrow(/não é inteiro/)
  })

  it('quebra quando o alvo não está na composição', () => {
    expect(() =>
      nox({
        formula: 'H₂O', nome: 'água', alvo: 'S',
        atomos: [['H', 2], ['O', 1]], carga: 0, nivel: 0,
      }),
    ).toThrow(/não aparece/)
  })
})

describe('dataset', () => {
  it('nenhum composto repetido', () => {
    const chaves = COMPOSTOS.map((c) => `${c.formula}:${c.alvo}`)
    expect(new Set(chaves).size).toBe(chaves.length)
  })

  it('os três níveis têm composto', () => {
    for (const n of [0, 1, 2]) {
      expect(COMPOSTOS.filter((c) => c.nivel === n).length, `nível ${n} vazio`).toBeGreaterThan(0)
    }
  })

  it('toda armadilha explica o porquê, e só ela', () => {
    for (const c of COMPOSTOS) {
      expect(c.porque !== undefined, `${c.formula}`).toBe(c.nivel === 2)
    }
  })

  it('fórmulas em Unicode, sem dígito ASCII', () => {
    for (const c of COMPOSTOS) {
      expect(c.formula, `${c.formula}`).not.toMatch(/\d/)
    }
  })

  it('exibirNox usa o menos tipográfico e marca o positivo', () => {
    expect(exibirNox(6)).toBe('+6')
    expect(exibirNox(-2)).toBe('−2')
    expect(exibirNox(0)).toBe('0')
  })
})
