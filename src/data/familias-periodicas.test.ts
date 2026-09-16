import { describe, expect, it } from 'vitest'
import { ELEMENTOS } from './tabela-periodica'
import type { Elemento } from './tabela-periodica'
import {
  FAMILIAS,
  ROTULO_FAMILIA,
  VIZINHAS,
  distratores,
  familiaDe,
} from './familias-periodicas'
import type { Familia } from './familias-periodicas'

/**
 * O gabarito das 118, escrito à mão, elemento a elemento.
 *
 * `familiaDe()` deriva a resposta do grupo e do bloco, e é exatamente por isso
 * que ela não pode ser sua própria testemunha: um grupo trocado no dataset
 * devolveria uma família perfeitamente plausível e o jogo ensinaria que o
 * antimônio é calcogênio sem nada acusar. Esta lista veio da tabela, não da
 * função.
 *
 * Está agrupada por família, e não por Z, porque é assim que dá para conferir
 * de olho: uma coluna da tabela periódica lida de cima para baixo é uma linha
 * aqui, e um elemento no lugar errado salta.
 */
const GABARITO: Readonly<Record<Familia, readonly string[]>> = {
  hidrogenio: ['H'],
  alcalinos: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr'],
  alcalinoterrosos: ['Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra'],
  transicao: [
    'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
    'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd',
    'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
    'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn',
  ],
  lantanideos: [
    'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu',
    'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
  ],
  actinideos: [
    'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am',
    'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr',
  ],
  boro: ['B', 'Al', 'Ga', 'In', 'Tl', 'Nh'],
  carbono: ['C', 'Si', 'Ge', 'Sn', 'Pb', 'Fl'],
  pnictogenios: ['N', 'P', 'As', 'Sb', 'Bi', 'Mc'],
  calcogenios: ['O', 'S', 'Se', 'Te', 'Po', 'Lv'],
  halogenios: ['F', 'Cl', 'Br', 'I', 'At', 'Ts'],
  nobres: ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og'],
}

const por = (simbolo: string): Elemento =>
  ELEMENTOS.find((e) => e.simbolo === simbolo) as Elemento

describe('familiaDe', () => {
  it('bate com o gabarito conferido à mão, elemento a elemento', () => {
    for (const [familia, simbolos] of Object.entries(GABARITO)) {
      for (const s of simbolos) {
        const e = por(s)
        expect(e, `${s} não existe no dataset`).toBeDefined()
        expect(familiaDe(e), `${s} (Z=${e.z})`).toBe(familia)
      }
    }
  })

  it('o gabarito cobre os 118 e não tem sobra', () => {
    const listados = Object.values(GABARITO).flat()
    expect(listados).toHaveLength(118)
    expect([...listados].sort()).toEqual(ELEMENTOS.map((e) => e.simbolo).sort())
  })

  it('classifica todos os 118 sem lançar', () => {
    for (const e of ELEMENTOS) {
      expect(() => familiaDe(e), `${e.simbolo}`).not.toThrow()
    }
  })
})

describe('os casos-limite, um por um', () => {
  /*
   * Estes seis são a razão de este arquivo existir. Se a classificação um dia
   * mudar por acidente, é aqui que ela quebra primeiro — e cada um deles tem um
   * argumento químico por trás, não é só cobertura de linha.
   */

  it('o hidrogênio não é alcalino, apesar do grupo 1', () => {
    expect(por('H').grupo, 'o dataset continua pondo H no grupo 1').toBe(1)
    expect(familiaDe(por('H'))).toBe('hidrogenio')
    expect(familiaDe(por('H'))).not.toBe('alcalinos')
  })

  it('o hélio é gás nobre, apesar do bloco s', () => {
    // O erro simétrico do anterior: quem classificasse pelo bloco faria do He um
    // alcalinoterroso, porque ele tem 1s² como o berílio tem 2s².
    expect(por('He').bloco).toBe('s')
    expect(familiaDe(por('He'))).toBe('nobres')
  })

  it('lantânio e actínio ficam nas faixas, não no grupo 3', () => {
    // A convenção do dataset: La e Ac descem para as faixas e o grupo 3 dos
    // períodos 6 e 7 fica vago. Se alguém reverter isso lá em cima, estes dois
    // passariam a ser metais de transição sem ninguém decidir nada.
    expect(por('La').grupo).toBeNull()
    expect(por('Ac').grupo).toBeNull()
    expect(familiaDe(por('La'))).toBe('lantanideos')
    expect(familiaDe(por('Ac'))).toBe('actinideos')
  })

  it('escândio, ítrio e lutécio: o grupo 3 que sobrou é de transição, o resto é faixa', () => {
    expect(familiaDe(por('Sc'))).toBe('transicao')
    expect(familiaDe(por('Y'))).toBe('transicao')
    // Lu fecha a faixa f nesta convenção, e é o candidato da IUPAC ao grupo 3.
    expect(familiaDe(por('Lu'))).toBe('lantanideos')
    expect(familiaDe(por('Lr'))).toBe('actinideos')
  })

  it('os grupos 3 a 12 inteiros são metais de transição, o 12 incluído', () => {
    const doGrupo = ELEMENTOS.filter((e) => e.grupo !== null && e.grupo >= 3 && e.grupo <= 12)
    expect(doGrupo).toHaveLength(38)
    for (const e of doGrupo) {
      expect(familiaDe(e), `${e.simbolo} (grupo ${e.grupo})`).toBe('transicao')
    }
    // O grupo 12 é o que tem discussão: d¹⁰ completo. Decisão registrada.
    for (const s of ['Zn', 'Cd', 'Hg', 'Cn']) {
      expect(familiaDe(por(s)), s).toBe('transicao')
    }
  })

  it('a faixa f inteira se divide em 15 lantanídeos e 15 actinídeos', () => {
    const f = ELEMENTOS.filter((e) => e.bloco === 'f')
    expect(f).toHaveLength(30)
    const lant = f.filter((e) => familiaDe(e) === 'lantanideos')
    const act = f.filter((e) => familiaDe(e) === 'actinideos')
    expect(lant).toHaveLength(15)
    expect(act).toHaveLength(15)
    expect(lant.map((e) => e.z)).toEqual(Array.from({ length: 15 }, (_, i) => 57 + i))
    expect(act.map((e) => e.z)).toEqual(Array.from({ length: 15 }, (_, i) => 89 + i))
  })
})

describe('guardas', () => {
  const inventado = (patch: Partial<Elemento>): Elemento => ({
    z: 999, simbolo: 'Xx', nome: 'inventado', sinonimos: [],
    grupo: 1, periodo: 4, bloco: 'd', linha: 4, coluna: 3,
    ...patch,
  })

  it('quebra quando o bloco f está fora das faixas', () => {
    expect(() => familiaDe(inventado({ bloco: 'f', linha: 6, grupo: null }))).toThrow(/bloco f/)
  })

  it('quebra quando falta grupo fora do bloco f', () => {
    expect(() => familiaDe(inventado({ grupo: null }))).toThrow(/sem grupo/)
  })

  it('quebra num grupo que não existe', () => {
    expect(() => familiaDe(inventado({ grupo: 19 }))).toThrow(/não existe/)
  })
})

describe('rótulos e vizinhança', () => {
  it('toda família tem rótulo, e nenhum rótulo se repete', () => {
    const rotulos = FAMILIAS.map((f) => ROTULO_FAMILIA[f])
    expect(rotulos.every((r) => r.length > 0)).toBe(true)
    expect(new Set(rotulos).size).toBe(FAMILIAS.length)
  })

  it('o rótulo do hidrogênio não entrega a resposta', () => {
    // A carta do H mostra "H — Hidrogênio" na pergunta. Se o botão repetisse a
    // palavra, a única carta que ensina a exceção viraria a mais fácil do jogo.
    expect(ROTULO_FAMILIA.hidrogenio.toLowerCase()).not.toContain('hidrog')
  })

  it('as doze famílias do tipo estão todas em FAMILIAS, sem sobra', () => {
    expect(FAMILIAS).toHaveLength(12)
    expect(new Set(FAMILIAS).size).toBe(12)
    expect([...FAMILIAS].sort()).toEqual(Object.keys(ROTULO_FAMILIA).sort())
  })

  it('vizinhança é simétrica entre as onze famílias de verdade', () => {
    // Assimetria aqui seria esquecimento, não intenção: o par que confunde
    // confunde nos dois sentidos. O hidrogênio fica de fora porque a assimetria
    // dele é a decisão — ele aponta para alcalinos, halogênios e nobres, e
    // nenhum deles pode apontar de volta para "nenhuma — é caso à parte".
    for (const a of FAMILIAS) {
      if (a === 'hidrogenio') continue
      for (const b of VIZINHAS[a]) {
        expect(VIZINHAS[b], `${b} não lista ${a} de volta`).toContain(a)
      }
    }
  })

  it('ninguém é vizinho de si mesmo, e ninguém é vizinho do hidrogênio', () => {
    for (const a of FAMILIAS) {
      expect(VIZINHAS[a], a).not.toContain(a)
      if (a !== 'hidrogenio') {
        expect(VIZINHAS[a], `${a} oferece "caso à parte" como erro plausível`).not.toContain(
          'hidrogenio',
        )
      }
    }
  })

  it('toda família tem pelo menos três vizinhas — a sobra nunca é usada', () => {
    // É esta a trava contra o distrator absurdo: enquanto valer, as três
    // alternativas erradas de qualquer carta saem só de `VIZINHAS`.
    for (const f of FAMILIAS) {
      expect(VIZINHAS[f].length, f).toBeGreaterThanOrEqual(3)
      expect(distratores(f).slice(0, 3).every((d) => VIZINHAS[f].includes(d)), f).toBe(true)
    }
  })

  it('os distratores nunca incluem a resposta certa nem se repetem', () => {
    for (const f of FAMILIAS) {
      const lista = distratores(f)
      expect(lista, f).not.toContain(f)
      expect(new Set(lista).size, f).toBe(lista.length)
      expect(lista.length, f).toBeGreaterThanOrEqual(3)
    }
  })

  it('o hidrogênio oferece as três leituras que têm defesa', () => {
    expect(distratores('hidrogenio').slice(0, 3)).toEqual([
      'alcalinos',
      'halogenios',
      'nobres',
    ])
  })
})
