import { describe, expect, it } from 'vitest'
import { chaveDeTexto } from '@/core/answer'
import {
  ACIDOS,
  adjetivoDoAcido,
  formasDoAcido,
  formulaDoAcido,
  grauDo,
  nomeDoAcido,
  noxCentral,
} from './acidos'
import type { Acido, Grau } from './acidos'
import { COMPOSTOS, nox } from './nox'

/**
 * O gabarito, conferido à mão, fórmula a fórmula.
 *
 * O nome é montado a partir do nox, e o nox é calculado da composição: é uma
 * cadeia bonita e é exatamente por isso que ela não pode se autoaprovar. Um
 * oxigênio a mais em `atomos` muda o nox, muda o degrau e muda o nome, e o
 * resultado continuaria sendo um nome perfeitamente plausível de ácido. Estes
 * vieram do livro, não da função.
 */
const GABARITO: Readonly<Record<string, string>> = {
  // hidrácidos
  HF: 'ácido fluorídrico',
  HCl: 'ácido clorídrico',
  HBr: 'ácido bromídrico',
  HI: 'ácido iodídrico',
  'H₂S': 'ácido sulfídrico',
  HCN: 'ácido cianídrico',

  // cloro: a série completa
  HClO: 'ácido hipocloroso',
  'HClO₂': 'ácido cloroso',
  'HClO₃': 'ácido clórico',
  'HClO₄': 'ácido perclórico',

  // bromo
  HBrO: 'ácido hipobromoso',
  'HBrO₂': 'ácido bromoso',
  'HBrO₃': 'ácido brômico',
  'HBrO₄': 'ácido perbrômico',

  // iodo
  HIO: 'ácido hipoiodoso',
  'HIO₂': 'ácido iodoso',
  'HIO₃': 'ácido iódico',
  'HIO₄': 'ácido periódico',

  // enxofre, nitrogênio, fósforo
  'H₂SO₃': 'ácido sulfuroso',
  'H₂SO₄': 'ácido sulfúrico',
  'HNO₂': 'ácido nitroso',
  'HNO₃': 'ácido nítrico',
  'H₃PO₂': 'ácido hipofosforoso',
  'H₃PO₃': 'ácido fosforoso',
  'H₃PO₄': 'ácido fosfórico',

  // famílias de um degrau só
  'H₂CO₃': 'ácido carbônico',
  'H₃BO₃': 'ácido bórico',
  'H₂CrO₄': 'ácido crômico',
}

const acido = (formula: string): Acido => {
  const a = ACIDOS.find((x) => formulaDoAcido(x) === formula)
  if (a === undefined) throw new Error(`${formula} não está no dataset`)
  return a
}

describe('o nome montado pela regra', () => {
  it('bate com o gabarito conferido à mão, ácido a ácido', () => {
    for (const a of ACIDOS) {
      const formula = formulaDoAcido(a)
      const esperado = GABARITO[formula]
      expect(esperado, `${formula} não está no gabarito do teste`).toBeDefined()
      expect(nomeDoAcido(a), formula).toBe(esperado)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual(ACIDOS.map(formulaDoAcido).sort())
  })

  it('o adjetivo sozinho também é resposta', () => {
    expect(adjetivoDoAcido(acido('HClO'))).toBe('hipocloroso')
    expect(formasDoAcido(acido('HClO'))).toContain('ácido hipocloroso')
    expect(formasDoAcido(acido('HClO'))).toContain('hipocloroso')
  })
})

describe('a série, que é o jogo inteiro', () => {
  /**
   * A escada do cloro é o caso-escola: +1, +3, +5, +7, um degrau de dois em
   * dois, e cada degrau com o seu afixo. Se este teste cair, o dataset deixou de
   * ensinar uma regra e passou a listar nomes.
   */
  it('o cloro sobe de dois em dois, e cada nox tem o seu afixo', () => {
    const escada: readonly (readonly [string, number, Grau])[] = [
      ['HClO', 1, 'hipo-oso'],
      ['HClO₂', 3, 'oso'],
      ['HClO₃', 5, 'ico'],
      ['HClO₄', 7, 'per-ico'],
    ]
    for (const [formula, esperadoNox, esperadoGrau] of escada) {
      expect(noxCentral(acido(formula)), formula).toBe(esperadoNox)
      expect(grauDo(acido(formula)), formula).toBe(esperadoGrau)
    }
  })

  it('os três halogênios têm a série inteira, não meia série', () => {
    for (const familia of ['cloro', 'bromo', 'iodo']) {
      const graus = ACIDOS.filter((a) => a.tipo === 'oxiacido' && a.familia === familia).map(grauDo)
      expect(graus.sort(), familia).toEqual(['hipo-oso', 'ico', 'oso', 'per-ico'])
    }
  })

  it('o fósforo traz os três degraus, incluindo o hipo- que ninguém espera', () => {
    const graus = ACIDOS.filter((a) => a.tipo === 'oxiacido' && a.familia === 'fosforo').map(grauDo)
    expect(graus.sort()).toEqual(['hipo-oso', 'ico', 'oso'])
    expect(noxCentral(acido('H₃PO₂'))).toBe(1)
  })

  it('enxofre e nitrogênio têm os dois degraus que existem neles', () => {
    for (const familia of ['enxofre', 'nitrogenio']) {
      const graus = ACIDOS.filter((a) => a.tipo === 'oxiacido' && a.familia === familia).map(grauDo)
      expect(graus.sort(), familia).toEqual(['ico', 'oso'])
    }
  })

  it('toda família de oxiácido tem o seu -ico: é dele que os outros são medidos', () => {
    const familias = new Set(ACIDOS.filter((a) => a.tipo === 'oxiacido').map((a) => a.familia))
    for (const familia of familias) {
      const graus = ACIDOS.filter((a) => a.tipo === 'oxiacido' && a.familia === familia).map(grauDo)
      expect(graus, `${familia} sem -ico`).toContain('ico')
    }
  })

  it('hidrácido é -ídrico e nada mais', () => {
    for (const a of ACIDOS.filter((x) => x.tipo === 'hidracido')) {
      expect(grauDo(a), formulaDoAcido(a)).toBe('ídrico')
      expect(nomeDoAcido(a)).toMatch(/ídrico$/)
      // Sem oxigênio: é essa a diferença que manda no sufixo.
      expect(a.atomos.map(([s]) => s), formulaDoAcido(a)).not.toContain('O')
    }
  })
})

describe('coerência com o dataset de nox', () => {
  /**
   * Sete destes ácidos já vivem em `nox.ts`, e o nox que decide o sufixo aqui é
   * calculado pela mesma função de lá. Este teste fecha o círculo: o nome que o
   * jogo de ácidos ensina tem de ser o mesmo que o jogo de nox exibe, e o nox
   * que o sufixo pressupõe tem de ser o mesmo que a outra engine calcula.
   */
  it('mesmo nome e mesmo nox nos ácidos que os dois datasets conhecem', () => {
    const emComum = COMPOSTOS.filter((c) => ACIDOS.some((a) => formulaDoAcido(a) === c.formula))
    expect(emComum.length, 'os dois datasets deviam se cruzar em vários ácidos').toBeGreaterThan(5)

    for (const c of emComum) {
      const a = acido(c.formula)
      expect(nomeDoAcido(a), c.formula).toBe(c.nome)
      if (a.tipo === 'oxiacido' && c.alvo === a.central) {
        expect(noxCentral(a), `${c.formula}: nox do ${c.alvo}`).toBe(nox(c))
      }
    }
  })
})

describe('guardas', () => {
  it('não finge que hidrácido tem série', () => {
    expect(() => noxCentral(acido('HCl'))).toThrow(/não tem série/)
  })

  it('quebra num nox que não cai em degrau nenhum', () => {
    // H₂MnO₄ e HMnO₄ são +6 e +7: degrau de 1. Não pertencem à série tradicional
    // e por isso ficaram fora do baralho — se alguém os enfiar de volta, quebra
    // aqui em vez de inventar um sufixo.
    expect(() =>
      grauDo({
        tipo: 'oxiacido', familia: 'cloro', raiz: 'clor', central: 'Cl',
        atomos: [['H', 1], ['Cl', 1], ['O', 5]],
      }),
    ).toThrow(/degrau/)
  })

  it('quebra numa família que não declarou o nox do -ico', () => {
    expect(() =>
      grauDo({
        tipo: 'oxiacido', familia: 'selenio', raiz: 'selen', central: 'Se',
        atomos: [['H', 2], ['Se', 1], ['O', 4]],
      }),
    ).toThrow(/não declara/)
  })
})

describe('dataset', () => {
  it('nenhuma fórmula repetida', () => {
    const formulas = ACIDOS.map(formulaDoAcido)
    expect(new Set(formulas).size).toBe(formulas.length)
  })

  it('nenhuma forma aceita é compartilhada por dois ácidos', () => {
    const dono = new Map<string, string>()
    for (const a of ACIDOS) {
      for (const forma of new Set(formasDoAcido(a).map((f) => chaveDeTexto(f)))) {
        const anterior = dono.get(forma)
        expect(
          anterior,
          `"${forma}" é aceito por dois ácidos: ${anterior} e ${formulaDoAcido(a)}`,
        ).toBeUndefined()
        dono.set(forma, formulaDoAcido(a))
      }
    }
  })

  it('índices em Unicode, sem dígito ASCII', () => {
    for (const a of ACIDOS) {
      expect(formulaDoAcido(a), formulaDoAcido(a)).not.toMatch(/\d/)
    }
  })

  it('todo ácido começa com hidrogênio, que é o que faz dele um ácido', () => {
    for (const a of ACIDOS) {
      expect(a.atomos[0]?.[0], formulaDoAcido(a)).toBe('H')
    }
  })

  it('o -oso e o -ico da mesma família diferem só nas duas letras do sufixo', () => {
    // A medição que justifica desligar a tolerância a erro de digitação no jogo:
    // "acidosulfurico" × "acidosulfuroso" são 14 caracteres com distância 2, e a
    // régua padrão perdoa 2 nesse tamanho. Ver `games/nomenclatura-acidos.ts`.
    const chave = (f: string) => chaveDeTexto(nomeDoAcido(acido(f)))
    expect(chave('H₂SO₄')).toHaveLength(14)
    expect(chave('H₂SO₃')).toHaveLength(14)
  })
})
