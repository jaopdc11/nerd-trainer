import { describe, expect, it } from 'vitest'
import {
  CORPOS,
  PLANETAS,
  POR_DISTANCIA,
  POR_GRAVIDADE,
  POR_PERIODO,
  POR_RAIO,
  exibirDistancia,
  exibirGravidade,
  exibirPeriodo,
  exibirRaio,
  ordinal,
} from './sistema-solar'

/**
 * O gabarito, escrito à mão a partir da Planetary Fact Sheet — não gerado deste
 * arquivo.
 *
 * O risco aqui é diferente do de `nox`: lá um erro de composição devolvia um
 * inteiro plausível, aqui um dígito trocado devolve um número que ninguém
 * confere de cabeça. 25.362 km virando 23.562 passaria despercebido para sempre,
 * e o jogo ensinaria o raio errado de Urano com a maior naturalidade. Por isso
 * as ordenações são conferidas contra listas escritas na mão, e os números
 * contra a terceira lei de Kepler, que é um teste que o dataset não tem como
 * passar por acidente.
 */

/** Ordem a partir do Sol. É a lista que todo mundo decora, e é o piso do jogo. */
const ORDEM_CONHECIDA = [
  'mercurio', 'venus', 'terra', 'marte', 'jupiter', 'saturno', 'urano', 'netuno',
]

/**
 * Ordem de tamanho, do maior raio ao menor, com os anões no meio.
 *
 * Os dois pares que valem a lista inteira: Urano é **maior** que Netuno (25.362
 * contra 24.622 km), o que contraria a intuição de que o mais distante é o
 * menor; e Plutão é maior que Éris em raio, embora Éris seja mais maciça.
 */
const TAMANHO_CONHECIDO = [
  'jupiter', 'saturno', 'urano', 'netuno', 'terra', 'venus', 'marte', 'mercurio',
  'plutao', 'eris', 'haumea', 'makemake', 'ceres',
]

describe('corpos', () => {
  it('tem os oito planetas e os cinco anões da IAU, sem repetir', () => {
    expect(CORPOS).toHaveLength(13)
    expect(PLANETAS).toHaveLength(8)
    expect(CORPOS.filter((c) => c.tipo === 'anao')).toHaveLength(5)

    const ids = CORPOS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    const nomes = CORPOS.map((c) => c.nome)
    expect(new Set(nomes).size).toBe(nomes.length)
  })

  it('nome em português com acento, e id sem acento', () => {
    // O id é chave de carta e de URL; o nome é o que a pessoa lê e digita.
    // Trocar os dois papéis daria "Plutao" na tela ou "Éris" numa chave.
    const porId = new Map(CORPOS.map((c) => [c.id, c.nome]))
    expect(porId.get('mercurio')).toBe('Mercúrio')
    expect(porId.get('venus')).toBe('Vênus')
    expect(porId.get('jupiter')).toBe('Júpiter')
    expect(porId.get('plutao')).toBe('Plutão')
    expect(porId.get('eris')).toBe('Éris')
    for (const c of CORPOS) expect(c.id, c.id).toMatch(/^[a-z]+$/)
  })

  it('só planeta tem ordem e gravidade, e a ordem é 1..8 sem buraco', () => {
    for (const c of CORPOS) {
      expect(c.ordem !== undefined, c.id).toBe(c.tipo === 'planeta')
      expect(c.gravidade !== undefined, c.id).toBe(c.tipo === 'planeta')
    }
    expect(PLANETAS.map((p) => p.ordem).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ])
  })

  it('todo corpo diz o que faz dele uma carta', () => {
    for (const c of CORPOS) expect(c.nota.length, c.id).toBeGreaterThan(10)
  })
})

describe('ordenações', () => {
  it('a ordem declarada dos planetas bate com o semieixo maior', () => {
    // Guarda contra o erro mais bobo possível: alguém corrigir uma distância e
    // esquecer de mexer no campo `ordem`, ou o contrário.
    const porSemieixo = PLANETAS.map((p) => p).sort((a, b) => a.semieixoUA - b.semieixoUA)
    expect(porSemieixo.map((p) => p.id)).toEqual(ORDEM_CONHECIDA)
    expect(porSemieixo.map((p) => p.ordem)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('os anões caem onde devem na fila de distância', () => {
    const fila = POR_DISTANCIA.map((c) => c.id)
    // Ceres entre Marte e Júpiter (é o cinturão principal); os outros quatro
    // depois de Netuno, com Éris no fim.
    expect(fila.indexOf('ceres')).toBe(fila.indexOf('marte') + 1)
    expect(fila.indexOf('ceres')).toBe(fila.indexOf('jupiter') - 1)
    for (const id of ['plutao', 'haumea', 'makemake', 'eris']) {
      expect(fila.indexOf(id), id).toBeGreaterThan(fila.indexOf('netuno'))
    }
    expect(fila.at(-1)).toBe('eris')
  })

  it('a ordem de tamanho bate com a lista conferida à mão', () => {
    expect(POR_RAIO.map((c) => c.id)).toEqual(TAMANHO_CONHECIDO)
  })

  it('mais longe é sempre ano mais longo — sem exceção nesta lista', () => {
    // Não é lei: uma órbita muito excêntrica poderia bagunçar a comparação por
    // semieixo. Nestes treze corpos não bagunça, e é o que o jogo assume quando
    // usa vizinho de ranking como distrator.
    expect(POR_PERIODO.map((c) => c.id)).toEqual(POR_DISTANCIA.map((c) => c.id))
  })

  it('a gravidade só ordena planeta, e Vênus empata com Urano', () => {
    expect(POR_GRAVIDADE).toHaveLength(8)
    expect(POR_GRAVIDADE.map((c) => c.id)).toEqual([
      'mercurio', 'marte', 'venus', 'urano', 'terra', 'saturno', 'netuno', 'jupiter',
    ])
    // Os dois empates que obrigam o jogo a filtrar distrator por texto exibido,
    // e não por corpo: com uma casa decimal, estes quatro viram duas etiquetas.
    const g = (id: string) => CORPOS.find((c) => c.id === id)?.gravidade as number
    expect(exibirGravidade(g('venus'))).toBe(exibirGravidade(g('urano')))
    expect(exibirGravidade(g('mercurio'))).toBe(exibirGravidade(g('marte')))
  })
})

describe('sanidade física', () => {
  it('T² = a³ em todos os treze, dentro de 3%', () => {
    /*
     * A terceira lei de Kepler, na forma em que ela é trivial: com a em UA e T
     * em anos, T²/a³ = 1 para tudo que orbita o Sol.
     *
     * É o melhor teste que este dataset pode ter, porque liga duas colunas que
     * foram copiadas de lugares diferentes. Um dígito trocado no período OU na
     * distância quebra a igualdade; nenhum erro de digitação plausível a
     * mantém. A folga de 3% é para os elementos médios de Saturno, que saem
     * 1,4% fora — a fonte usa elementos osculantes numa época específica, e
     * apertar mais que isso transformaria o teste num alarme falso.
     */
    for (const c of CORPOS) {
      const razao = c.periodoAnos ** 2 / c.semieixoUA ** 3
      expect(Math.abs(razao - 1), `${c.id}: T²/a³ = ${razao.toFixed(3)}`).toBeLessThan(0.03)
    }
  })

  it('nenhum número absurdo', () => {
    for (const c of CORPOS) {
      expect(c.semieixoUA, c.id).toBeGreaterThan(0)
      expect(c.raioKm, c.id).toBeGreaterThan(100)
      expect(c.raioKm, c.id).toBeLessThan(80000)
      expect(c.periodoAnos, c.id).toBeGreaterThan(0)
      if (c.gravidade !== undefined) {
        expect(c.gravidade, c.id).toBeGreaterThan(1)
        expect(c.gravidade, c.id).toBeLessThan(30)
      }
    }
  })

  it('a Terra é a régua: 1 UA e 1 ano, por definição', () => {
    const terra = CORPOS.find((c) => c.id === 'terra')
    expect(terra?.semieixoUA).toBe(1)
    expect(terra?.periodoAnos).toBe(1)
  })
})

describe('exibição', () => {
  it('período em dias abaixo de um ano, em anos acima', () => {
    expect(exibirPeriodo(0.2408)).toBe('88 dias')
    expect(exibirPeriodo(0.6152)).toBe('225 dias')
    expect(exibirPeriodo(1)).toBe('1 ano')
    expect(exibirPeriodo(1.8808)).toBe('1,9 anos')
    expect(exibirPeriodo(164.79)).toBe('165 anos')
    expect(exibirPeriodo(558)).toBe('558 anos')
  })

  it('gravidade, raio e distância no formato do português', () => {
    expect(exibirGravidade(9.81)).toBe('9,8 m/s²')
    expect(exibirRaio(69911)).toBe('69.911 km')
    expect(exibirRaio(2439.7)).toBe('2.440 km')
    expect(exibirDistancia(5.204)).toBe('5,204 UA')
  })

  it('ordinal só existe de 1 a 8', () => {
    expect(ordinal(1)).toBe('1º')
    expect(ordinal(8)).toBe('8º')
    expect(() => ordinal(9)).toThrow(/não existe/)
    expect(() => ordinal(0)).toThrow(/não existe/)
  })
})
