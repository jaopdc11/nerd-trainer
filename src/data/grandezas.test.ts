import { describe, expect, it } from 'vitest'
import {
  BASES_SI,
  GRANDEZAS,
  GRANDEZAS_COM_UNIDADE,
  emUnidadesBase,
  expoentes,
  gabaritoDaUnidade,
  sobrescrito,
  temUnidade,
} from './grandezas'
import type { Grandeza } from './grandezas'

/**
 * O gabarito, escrito à mão a partir da brochura do SI.
 *
 * `emUnidadesBase()` monta a cadeia sozinho a partir dos expoentes, e é
 * exatamente por isso que ele não pode se autoaprovar: um `s: -3` digitado onde
 * devia ser `-2` produz `kg·m²·s⁻³` — uma string perfeitamente bem formada, que
 * ninguém percebe em revisão de código e que ensina física errada em silêncio.
 * Estes valores vieram da tabela, um a um, não da função.
 */
const GABARITO_BASE: Readonly<Record<string, string>> = {
  // as sete de base
  massa: 'kg',
  comprimento: 'm',
  tempo: 's',
  'corrente-eletrica': 'A',
  temperatura: 'K',
  'quantidade-de-materia': 'mol',
  'intensidade-luminosa': 'cd',

  // derivadas com nome próprio
  frequencia: 's⁻¹',
  forca: 'kg·m·s⁻²',
  pressao: 'kg·m⁻¹·s⁻²',
  energia: 'kg·m²·s⁻²',
  potencia: 'kg·m²·s⁻³',
  'carga-eletrica': 's·A',
  'tensao-eletrica': 'kg·m²·s⁻³·A⁻¹',
  'resistencia-eletrica': 'kg·m²·s⁻³·A⁻²',
  capacitancia: 'kg⁻¹·m⁻²·s⁴·A²',
  'condutancia-eletrica': 'kg⁻¹·m⁻²·s³·A²',
  'fluxo-magnetico': 'kg·m²·s⁻²·A⁻¹',
  'inducao-magnetica': 'kg·s⁻²·A⁻¹',
  indutancia: 'kg·m²·s⁻²·A⁻²',
  'fluxo-luminoso': 'cd',
  iluminancia: 'm⁻²·cd',
  'atividade-radioativa': 's⁻¹',
  'dose-absorvida': 'm²·s⁻²',
  'dose-equivalente': 'm²·s⁻²',
  'atividade-catalitica': 's⁻¹·mol',

  // sem nome próprio
  velocidade: 'm·s⁻¹',
  aceleracao: 'm·s⁻²',
  'quantidade-de-movimento': 'kg·m·s⁻¹',
  impulso: 'kg·m·s⁻¹',
  torque: 'kg·m²·s⁻²',
  'momento-de-inercia': 'kg·m²',
  densidade: 'kg·m⁻³',
  vazao: 'm³·s⁻¹',
  viscosidade: 'kg·m⁻¹·s⁻¹',
  'tensao-superficial': 'kg·s⁻²',
  'constante-elastica': 'kg·s⁻²',
  'campo-eletrico': 'kg·m·s⁻³·A⁻¹',
  entropia: 'kg·m²·s⁻²·K⁻¹',
  'calor-especifico': 'm²·s⁻²·K⁻¹',
  'constante-dos-gases': 'kg·m²·s⁻²·K⁻¹·mol⁻¹',
  'constante-de-planck': 'kg·m²·s⁻¹',
  'constante-gravitacional': 'kg⁻¹·m³·s⁻²',
}

/** Nome e símbolo da unidade, também conferidos um a um. */
const GABARITO_UNIDADE: Readonly<Record<string, readonly [string, string]>> = {
  massa: ['quilograma', 'kg'],
  comprimento: ['metro', 'm'],
  tempo: ['segundo', 's'],
  'corrente-eletrica': ['ampere', 'A'],
  temperatura: ['kelvin', 'K'],
  'quantidade-de-materia': ['mol', 'mol'],
  'intensidade-luminosa': ['candela', 'cd'],
  frequencia: ['hertz', 'Hz'],
  forca: ['newton', 'N'],
  pressao: ['pascal', 'Pa'],
  energia: ['joule', 'J'],
  potencia: ['watt', 'W'],
  'carga-eletrica': ['coulomb', 'C'],
  'tensao-eletrica': ['volt', 'V'],
  'resistencia-eletrica': ['ohm', '\u03A9'],
  capacitancia: ['farad', 'F'],
  'condutancia-eletrica': ['siemens', 'S'],
  'fluxo-magnetico': ['weber', 'Wb'],
  'inducao-magnetica': ['tesla', 'T'],
  indutancia: ['henry', 'H'],
  'fluxo-luminoso': ['lúmen', 'lm'],
  iluminancia: ['lux', 'lx'],
  'atividade-radioativa': ['becquerel', 'Bq'],
  'dose-absorvida': ['gray', 'Gy'],
  'dose-equivalente': ['sievert', 'Sv'],
  'atividade-catalitica': ['katal', 'kat'],
}

const acha = (id: string): Grandeza => {
  const g = GRANDEZAS.find((x) => x.id === id)
  if (!g) throw new Error(`${id} não está no dataset`)
  return g
}

describe('unidades de base', () => {
  it('batem com o gabarito conferido à mão, grandeza a grandeza', () => {
    for (const g of GRANDEZAS) {
      const esperado = GABARITO_BASE[g.id]
      expect(esperado, `${g.id} não está no gabarito do teste`).toBeDefined()
      expect(emUnidadesBase(g), `${g.nome}`).toBe(esperado)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO_BASE).sort()).toEqual(GRANDEZAS.map((g) => g.id).sort())
  })

  it('saem na ordem do SI, e não na ordem em que foram digitados', () => {
    // O coulomb é s·A e não A·s; o volt começa em kg. Se a ordem de `BASES_SI`
    // mudar, estas duas quebram antes de o jogador ver a unidade errada.
    expect(emUnidadesBase(acha('carga-eletrica'))).toBe('s·A')
    expect(emUnidadesBase(acha('tensao-eletrica'))).toBe('kg·m²·s⁻³·A⁻¹')
  })

  it('o gabarito da unidade junta nome, símbolo e cadeia', () => {
    const pressao = acha('pressao')
    expect(temUnidade(pressao)).toBe(true)
    if (!temUnidade(pressao)) return
    expect(gabaritoDaUnidade(pressao)).toBe('pascal (Pa) = kg·m⁻¹·s⁻²')
  })
})

describe('unidades com nome próprio', () => {
  it('nome e símbolo batem com o gabarito', () => {
    for (const g of GRANDEZAS_COM_UNIDADE) {
      const esperado = GABARITO_UNIDADE[g.id]
      expect(esperado, `${g.id} não está no gabarito de unidades`).toBeDefined()
      expect([g.unidade.nome, g.unidade.simbolo], g.nome).toEqual(esperado)
    }
  })

  it('o gabarito de unidades cobre exatamente quem tem unidade', () => {
    expect(Object.keys(GABARITO_UNIDADE).sort()).toEqual(
      GRANDEZAS_COM_UNIDADE.map((g) => g.id).sort(),
    )
    // 7 de base + 19 derivadas com nome. Se este número mudar sem que alguém
    // mexa no gabarito acima, foi cadastro sem conferência.
    expect(GRANDEZAS_COM_UNIDADE.length).toBe(26)
  })

  it('a regra da eponímia vale sem exceção: nome de gente, símbolo maiúsculo', () => {
    // É o guarda que pega "pa" no lugar de "Pa" e "Lx" no lugar de "lx". No SI a
    // regra não tem exceção — inclusive o ohm, cujo Ω é maiúsculo de verdade.
    for (const g of GRANDEZAS_COM_UNIDADE) {
      const maiusculo = /^\p{Lu}/u.test(g.unidade.simbolo)
      expect(maiusculo, `${g.unidade.nome} (${g.unidade.simbolo})`).toBe(g.unidade.deNomeProprio)
    }
  })

  it('nenhum símbolo repetido — senão o baralho teria duas respostas certas', () => {
    const simbolos = GRANDEZAS_COM_UNIDADE.map((g) => g.unidade.simbolo)
    expect(new Set(simbolos).size).toBe(simbolos.length)
  })

  it('as grafias aceitas não repetem o canônico e cobrem o ômega que o teclado não tem', () => {
    for (const g of GRANDEZAS_COM_UNIDADE) {
      for (const alt of g.unidade.simbolosAceitos ?? []) {
        expect(alt, `${g.unidade.nome}`).not.toBe(g.unidade.simbolo)
        expect(alt.length, `${g.unidade.nome}: grafia vazia`).toBeGreaterThan(0)
      }
    }

    const ohm = acha('resistencia-eletrica')
    if (!temUnidade(ohm)) throw new Error('o ohm perdeu a unidade')
    expect(ohm.unidade.simbolo).toBe('\u03A9') // ômega grego, o canônico
    // U+2126 renderiza idêntico e compara diferente: se ele sair da lista, quem
    // colar o símbolo de outro lugar erra a carta sem entender por quê.
    expect(ohm.unidade.simbolosAceitos).toContain('\u2126') // OHM SIGN, o gêmeo invisível
    expect(ohm.unidade.simbolosAceitos).toContain('ohm')
  })

  it('só as 26 com unidade passam por temUnidade', () => {
    const semUnidade = GRANDEZAS.filter((g) => !temUnidade(g))
    expect(semUnidade.length).toBe(GRANDEZAS.length - GRANDEZAS_COM_UNIDADE.length)
    for (const g of semUnidade) expect(g.unidade, g.id).toBeUndefined()
  })
})

describe('guardas', () => {
  it('quebra quando alguém escreve expoente 0 à mão', () => {
    // Ausente já é zero. Aceitar as duas grafias faria dois cadastros idênticos
    // renderizarem diferente, que é como uma tabela começa a divergir de si mesma.
    expect(() =>
      expoentes({ id: 'x', nome: 'x', base: { kg: 1, A: 0 }, definicao: 'x' }),
    ).toThrow(/expoente 0/)
  })

  it('quebra com expoente fracionário', () => {
    expect(() =>
      expoentes({ id: 'x', nome: 'x', base: { s: 0.5 }, definicao: 'x' }),
    ).toThrow(/não é inteiro/)
  })

  it('quebra na grandeza adimensional, que ficou de fora de propósito', () => {
    expect(() => expoentes({ id: 'angulo', nome: 'ângulo', base: {}, definicao: 'θ = s/r' })).toThrow(
      /adimensional/,
    )
  })
})

describe('dataset', () => {
  it('ids únicos e em kebab-case sem acento', () => {
    const ids = GRANDEZAS.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id, id).toMatch(/^[a-z][a-z-]*[a-z]$/)
  })

  it('toda grandeza explica de onde vêm os expoentes', () => {
    // Sem a definição o gabarito vira só a resposta, e quem errou não sai
    // sabendo por quê.
    for (const g of GRANDEZAS) expect(g.definicao.length, g.id).toBeGreaterThan(3)
  })

  it('nenhuma base fora das sete', () => {
    for (const g of GRANDEZAS) {
      for (const chave of Object.keys(g.base)) {
        expect(BASES_SI as readonly string[], `${g.id}: ${chave}`).toContain(chave)
      }
    }
  })

  it('sobrescrito some no expoente 1 e usa o menos tipográfico', () => {
    expect(sobrescrito(1)).toBe('')
    expect(sobrescrito(2)).toBe('²')
    expect(sobrescrito(-2)).toBe('⁻²')
    expect(sobrescrito(-1)).toBe('⁻¹')
    expect(sobrescrito(4)).toBe('⁴')
  })
})
