import { describe, expect, it } from 'vitest'
import { chaveDeTexto } from '@/core/answer'
import { COMPOSTOS } from './nox'
import { ELEMENTOS } from './tabela-periodica'
import {
  IONS,
  ehCation,
  ehMonoatomico,
  formasDoIon,
  formulaDoIon,
  sufixoCarga,
  tipoDoIon,
} from './ions'

/**
 * O gabarito, conferido à mão, íon a íon.
 *
 * A fórmula exibida é montada (`nucleo` + `carga`), então ela é a parte que um
 * dedo errado no campo `carga` estraga em silêncio: trocar −2 por −1 em SO₄
 * transformaria a carta em "SO₄⁻ → sulfato", que é química errada com cara de
 * certa. Esta tabela veio do livro, não da função.
 */
const GABARITO: Readonly<Record<string, string>> = {
  // cátions
  'Li⁺': 'lítio',
  'Na⁺': 'sódio',
  'K⁺': 'potássio',
  'Ag⁺': 'prata',
  'Mg²⁺': 'magnésio',
  'Ca²⁺': 'cálcio',
  'Ba²⁺': 'bário',
  'Zn²⁺': 'zinco',
  'Al³⁺': 'alumínio',
  'Fe²⁺': 'ferro(II)',
  'Fe³⁺': 'ferro(III)',
  'Cu⁺': 'cobre(I)',
  'Cu²⁺': 'cobre(II)',
  'Pb²⁺': 'chumbo(II)',
  'NH₄⁺': 'amônio',
  'H₃O⁺': 'hidrônio',

  // ânions monoatômicos
  'F⁻': 'fluoreto',
  'Cl⁻': 'cloreto',
  'Br⁻': 'brometo',
  'I⁻': 'iodeto',
  'H⁻': 'hidreto',
  'O²⁻': 'óxido',
  'S²⁻': 'sulfeto',
  'N³⁻': 'nitreto',
  'P³⁻': 'fosfeto',

  // ânions poliatômicos
  'OH⁻': 'hidróxido',
  'CN⁻': 'cianeto',
  'SCN⁻': 'tiocianato',
  'O₂²⁻': 'peróxido',
  'CH₃COO⁻': 'acetato',
  'C₂O₄²⁻': 'oxalato',
  'NO₂⁻': 'nitrito',
  'NO₃⁻': 'nitrato',
  'SO₃²⁻': 'sulfito',
  'SO₄²⁻': 'sulfato',
  'HSO₄⁻': 'hidrogenossulfato',
  'S₂O₃²⁻': 'tiossulfato',
  'CO₃²⁻': 'carbonato',
  'HCO₃⁻': 'hidrogenocarbonato',
  'PO₄³⁻': 'fosfato',
  'HPO₄²⁻': 'hidrogenofosfato',
  'H₂PO₄⁻': 'di-hidrogenofosfato',
  'ClO⁻': 'hipoclorito',
  'ClO₂⁻': 'clorito',
  'ClO₃⁻': 'clorato',
  'ClO₄⁻': 'perclorato',
  'MnO₄⁻': 'permanganato',
  'CrO₄²⁻': 'cromato',
  'Cr₂O₇²⁻': 'dicromato',
}

describe('fórmula montada a partir da carga', () => {
  it('bate com o gabarito conferido à mão, íon a íon', () => {
    for (const ion of IONS) {
      const formula = formulaDoIon(ion)
      const esperado = GABARITO[formula]
      expect(esperado, `${formula} não está no gabarito do teste`).toBeDefined()
      expect(ion.nome, formula).toBe(esperado)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual(IONS.map(formulaDoIon).sort())
  })

  it('não escreve o módulo 1: é Cl⁻, nunca Cl¹⁻', () => {
    expect(sufixoCarga(-1)).toBe('⁻')
    expect(sufixoCarga(1)).toBe('⁺')
    expect(sufixoCarga(-2)).toBe('²⁻')
    expect(sufixoCarga(3)).toBe('³⁺')
  })

  it('quebra onde não há íon nenhum', () => {
    // Carga zero é composto neutro, e isso é o outro jogo.
    expect(() => sufixoCarga(0)).toThrow(/não é um íon/)
    expect(() => sufixoCarga(-12)).toThrow(/fora da faixa/)
  })
})

describe('coerência com o dataset de nox', () => {
  /**
   * `nox.ts` conhece treze destes íons, e conhece por outro motivo — lá eles
   * existem para ter o nox do átomo central perguntado. Duas listas com o mesmo
   * íon sob nomes diferentes é como um app passa a ensinar duas químicas; este
   * teste é o preço de manter os dois datasets separados, e é barato.
   */
  const ionsDoNox = COMPOSTOS.filter((c) => c.carga !== 0)

  it('todo íon que o nox conhece está no baralho, com o mesmo nome e a mesma carga', () => {
    for (const c of ionsDoNox) {
      const aqui = IONS.find((i) => formulaDoIon(i) === c.formula)
      expect(
        aqui,
        `${c.formula} existe em nox.ts e não existe em ions.ts — o baralho de íons não pode ignorar um íon que o outro jogo já ensina`,
      ).toBeDefined()
      expect(aqui?.nome, c.formula).toBe(c.nome)
      expect(aqui?.carga, c.formula).toBe(c.carga)
    }
  })
})

describe('coerência com a tabela periódica', () => {
  const monoatomicos = IONS.filter(ehMonoatomico)

  it('todo íon monoatômico tem um símbolo de elemento de verdade no núcleo', () => {
    for (const ion of monoatomicos) {
      const elemento = ELEMENTOS.find((e) => e.simbolo === ion.nucleo)
      expect(elemento, `${ion.nucleo} não é símbolo de nenhum elemento`).toBeDefined()
    }
  })

  it('cátion monoatômico se chama como o elemento', () => {
    // "Ca²⁺ é o íon cálcio" não é uma informação nova, é a mesma palavra da
    // tabela periódica. Onde a carga varia, o nome ganha o algarismo romano
    // depois — daí `startsWith` e não igualdade.
    for (const ion of monoatomicos.filter(ehCation)) {
      const elemento = ELEMENTOS.find((e) => e.simbolo === ion.nucleo)
      const doElemento = chaveDeTexto(elemento?.nome ?? '')
      expect(chaveDeTexto(ion.nome), `${formulaDoIon(ion)} × ${elemento?.nome}`).toMatch(
        new RegExp(`^${doElemento}`),
      )
    }
  })

  it('ânion monoatômico termina em -eto ou -ido', () => {
    // A primeira regra de nomenclatura que se aprende, e a razão de sulfeto,
    // sulfito e sulfato serem três coisas diferentes.
    for (const ion of monoatomicos.filter((i) => !ehCation(i))) {
      expect(ion.nome, formulaDoIon(ion)).toMatch(/(eto|ido)$/)
    }
  })
})

describe('dataset', () => {
  it('nenhum íon repetido', () => {
    const formulas = IONS.map(formulaDoIon)
    expect(new Set(formulas).size).toBe(formulas.length)
  })

  it('nenhuma forma aceita é compartilhada por dois íons', () => {
    // É o teste que impede o jogo de virar loteria: se "bicarbonato" valesse em
    // duas cartas, acertar dependeria de qual delas caiu.
    const dono = new Map<string, string>()
    for (const ion of IONS) {
      for (const forma of new Set(formasDoIon(ion).map((f) => chaveDeTexto(f)))) {
        const anterior = dono.get(forma)
        expect(
          anterior,
          `"${forma}" é aceito por dois íons: ${anterior} e ${formulaDoIon(ion)}`,
        ).toBeUndefined()
        dono.set(forma, formulaDoIon(ion))
      }
    }
  })

  it('carga nunca é zero, e o tipo sai do sinal', () => {
    for (const ion of IONS) {
      expect(ion.carga, formulaDoIon(ion)).not.toBe(0)
      expect(tipoDoIon(ion)).toBe(ion.carga > 0 ? 'cátion' : 'ânion')
    }
  })

  it('núcleos em Unicode, sem dígito ASCII e sem sinal digitado à mão', () => {
    // Mesma régua de nox.ts e de geometria-molecular.ts: "SO4" com o 4 na linha
    // de base destoaria da carta ao lado, e um "+" digitado no núcleo seria a
    // carga escrita duas vezes.
    for (const ion of IONS) {
      expect(ion.nucleo, `${ion.nucleo} tem dígito ASCII`).not.toMatch(/\d/)
      expect(ion.nucleo, `${ion.nucleo} traz a carga no núcleo`).not.toMatch(/[-+]/)
      expect(formulaDoIon(ion), `${formulaDoIon(ion)} tem dígito ASCII`).not.toMatch(/\d/)
    }
  })

  it('tem cátion e ânion em quantidade que justifique o nome do jogo', () => {
    expect(IONS.filter(ehCation).length).toBeGreaterThanOrEqual(12)
    expect(IONS.filter((i) => !ehCation(i)).length).toBeGreaterThanOrEqual(25)
  })

  it('a série do cloro entra inteira — quatro oxiânions, não dois', () => {
    // Hipoclorito/clorito/clorato/perclorato é a mesma regra do jogo de
    // nomenclatura de ácidos vista do lado do ânion. Meia série não ensina nada.
    for (const nome of ['hipoclorito', 'clorito', 'clorato', 'perclorato']) {
      expect(IONS.map((i) => i.nome), `falta ${nome}`).toContain(nome)
    }
  })

  it('todo -ito tem o -ato correspondente', () => {
    // Sem o par, o sufixo vira decoreba: é a diferença entre eles que informa.
    //
    // O `hipo` sai da conta porque ele é outro eixo da mesma regra: o par de
    // "hipoclorito" é "clorato" — o afixo conta oxigênio para baixo, o sufixo
    // conta para cima, e exigir um inexistente "hipoclorato" seria confundir os
    // dois.
    for (const ion of IONS.filter((i) => i.nome.endsWith('ito'))) {
      const raiz = ion.nome.replace(/^hipo/, '').slice(0, -3)
      expect(IONS.map((i) => i.nome), `${ion.nome} sem ${raiz}ato`).toContain(`${raiz}ato`)
    }
  })
})
