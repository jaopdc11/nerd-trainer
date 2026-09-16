import { describe, expect, it } from 'vitest'
import { distancia, normalizarTexto } from '@/core/answer'
import { ALTURA_MAPA, FORMAS, LARGURA_MAPA } from './estados-mapa'
import { ESTADOS } from './estados'

describe('o conjunto', () => {
  it('são 27: os 26 estados mais o Distrito Federal', () => {
    expect(ESTADOS).toHaveLength(27)
    expect(ESTADOS.filter((e) => e.sigla === 'DF')).toHaveLength(1)
  })

  it('não repete sigla nem nome', () => {
    expect(new Set(ESTADOS.map((e) => e.sigla)).size).toBe(ESTADOS.length)
    expect(new Set(ESTADOS.map((e) => normalizarTexto(e.nome, true))).size).toBe(ESTADOS.length)
  })

  it('a sigla é sempre duas letras maiúsculas', () => {
    for (const e of ESTADOS) expect(e.sigla, e.nome).toMatch(/^[A-Z]{2}$/)
  })

  it('as cinco regiões têm estado, e nenhum estado ficou sem região', () => {
    const porRegiao = new Map<string, number>()
    for (const e of ESTADOS) porRegiao.set(e.regiao, (porRegiao.get(e.regiao) ?? 0) + 1)

    // Contagem oficial do IBGE, região a região: é o que pega uma UF trocada de
    // lado sem que o total mude.
    expect(porRegiao.get('Norte')).toBe(7)
    expect(porRegiao.get('Nordeste')).toBe(9)
    expect(porRegiao.get('Sudeste')).toBe(4)
    expect(porRegiao.get('Sul')).toBe(3)
    expect(porRegiao.get('Centro-Oeste')).toBe(4)
    expect([...porRegiao.values()].reduce((a, b) => a + b, 0)).toBe(27)
  })
})

/**
 * A conferência por caminho independente, que é a regra do projeto: o teste não
 * pode ser o próprio dado se autoaprovando.
 *
 * A tabela abaixo foi escrita de novo, à mão, agrupada **por região** — e não na
 * ordem alfabética em que o gerador emite —, justamente para que conferir uma
 * contra a outra seja uma leitura de verdade e não um copiar-colar. Se as duas
 * discordarem, uma das duas está errada e o teste não diz qual: é para ir olhar.
 */
const CAPITAIS: Readonly<Record<string, string>> = {
  // Norte
  AC: 'Rio Branco',
  AP: 'Macapá',
  AM: 'Manaus',
  PA: 'Belém',
  RO: 'Porto Velho',
  RR: 'Boa Vista',
  TO: 'Palmas',
  // Nordeste
  AL: 'Maceió',
  BA: 'Salvador',
  CE: 'Fortaleza',
  MA: 'São Luís',
  PB: 'João Pessoa',
  PE: 'Recife',
  PI: 'Teresina',
  RN: 'Natal',
  SE: 'Aracaju',
  // Sudeste
  ES: 'Vitória',
  MG: 'Belo Horizonte',
  RJ: 'Rio de Janeiro',
  SP: 'São Paulo',
  // Sul
  PR: 'Curitiba',
  RS: 'Porto Alegre',
  SC: 'Florianópolis',
  // Centro-Oeste
  DF: 'Brasília',
  GO: 'Goiânia',
  MS: 'Campo Grande',
  MT: 'Cuiabá',
}

describe('capitais', () => {
  it('cada UF tem a capital que a tabela conferida à mão diz', () => {
    for (const e of ESTADOS) {
      expect(e.capital, `capital de ${e.nome} (${e.sigla})`).toBe(CAPITAIS[e.sigla])
    }
  })

  it('a tabela de conferência cobre as 27 e nenhuma a mais', () => {
    expect(Object.keys(CAPITAIS)).toHaveLength(27)
    const siglas = new Set(ESTADOS.map((e) => e.sigla))
    for (const sigla of Object.keys(CAPITAIS)) expect(siglas.has(sigla), sigla).toBe(true)
  })

  it('duas UFs não compartilham capital', () => {
    expect(new Set(ESTADOS.map((e) => e.capital)).size).toBe(27)
  })

  it('os casos em que capital e estado têm o mesmo nome continuam certos', () => {
    // Rio de Janeiro e São Paulo, e só eles: é o erro clássico de quem "arruma"
    // o dataset achando que houve copiar-colar.
    const iguais = ESTADOS.filter((e) => e.capital === e.nome).map((e) => e.sigla)
    expect(iguais.sort()).toEqual(['RJ', 'SP'])
  })
})

/**
 * Acentuação, do mesmo jeito que os elementos químicos têm o teste do "Azoto".
 *
 * Aqui não é português europeu que contamina, é teclado: nome de estado sem
 * acento passa despercebido no código e aparece na tela do jogador. Como o
 * validador ignora acento, nada quebra na hora de responder — o que estraga é o
 * gabarito mostrar "Piaui".
 */
describe('acentuação', () => {
  const ACENTUADOS = [
    'Amapá', 'Goiás', 'Pará', 'Ceará', 'Maranhão', 'Piauí', 'Paraíba',
    'Rondônia', 'Espírito Santo', 'São Paulo', 'Paraná',
  ]

  it('os nomes que levam acento estão escritos com ele', () => {
    const nomes = new Set(ESTADOS.map((e) => e.nome))
    for (const nome of ACENTUADOS) expect(nomes.has(nome), `falta "${nome}"`).toBe(true)
  })

  it('as capitais acentuadas também', () => {
    const capitais = new Set(ESTADOS.map((e) => e.capital))
    for (const nome of ['Macapá', 'Belém', 'Maceió', 'São Luís', 'Vitória', 'Brasília', 'Goiânia', 'Cuiabá', 'Florianópolis']) {
      expect(capitais.has(nome), `falta "${nome}"`).toBe(true)
    }
  })
})

describe('geometria', () => {
  it('toda UF tem forma — nenhuma fica fora do tabuleiro', () => {
    for (const e of ESTADOS) {
      expect(FORMAS[e.sigla], `${e.nome} não tem contorno`).toBeDefined()
    }
  })

  it('não sobra forma sem UF', () => {
    const siglas = new Set(ESTADOS.map((e) => e.sigla))
    for (const sigla of Object.keys(FORMAS)) expect(siglas.has(sigla), sigla).toBe(true)
  })

  it('todo contorno é um path fechado dentro da caixa da projeção', () => {
    for (const e of ESTADOS) {
      const d = FORMAS[e.sigla]?.d ?? ''
      expect(d.startsWith('M'), e.nome).toBe(true)
      expect(d.endsWith('Z'), e.nome).toBe(true)

      const numeros = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
      expect(numeros.length, `${e.nome} tem contorno vazio`).toBeGreaterThan(20)
      for (let i = 0; i < numeros.length; i += 2) {
        expect(numeros[i], `${e.nome}: x fora da caixa`).toBeGreaterThanOrEqual(0)
        expect(numeros[i], `${e.nome}: x fora da caixa`).toBeLessThanOrEqual(LARGURA_MAPA)
        expect(numeros[i + 1], `${e.nome}: y fora da caixa`).toBeGreaterThanOrEqual(0)
        expect(numeros[i + 1], `${e.nome}: y fora da caixa`).toBeLessThanOrEqual(ALTURA_MAPA)
      }
    }
  })

  /**
   * A malha do IBGE vem com os anéis no sentido oposto ao que o `d3-geo` espera,
   * e o sintoma disso é traiçoeiro: cada UF vira "o planeta menos a UF", o
   * `fitSize` enxerga o mundo inteiro e o Brasil sai do tamanho de uma unha num
   * canto do viewBox. Nada quebra, só fica errado. Este teste fixa o esqueleto
   * do mapa para que o erro não volte em silêncio.
   */
  it('o mapa está orientado: Roraima no topo, Rio Grande do Sul embaixo, Acre à esquerda', () => {
    const centro = (sigla: string) => {
      const numeros = (FORMAS[sigla]?.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
      const xs = numeros.filter((_, i) => i % 2 === 0)
      const ys = numeros.filter((_, i) => i % 2 === 1)
      return { x: xs.reduce((a, b) => a + b, 0) / xs.length, y: ys.reduce((a, b) => a + b, 0) / ys.length }
    }

    expect(centro('RR').y).toBeLessThan(centro('RS').y)
    expect(centro('AC').x).toBeLessThan(centro('PB').x)
    expect(centro('DF').x).toBeGreaterThan(centro('AM').x)

    // O desenho ocupa a caixa inteira: sem isso, "está lá" e "está do tamanho
    // certo" seriam a mesma asserção, e não são.
    const todos = Object.values(FORMAS).flatMap((f) => (f.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number))
    const xs = todos.filter((_, i) => i % 2 === 0)
    const ys = todos.filter((_, i) => i % 2 === 1)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(LARGURA_MAPA * 0.99)
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(ALTURA_MAPA * 0.99)
  })
})

/**
 * Por que os dois jogos daqui podem deixar a tolerância a erro de digitação
 * **ligada**, ao contrário do mapa-múndi.
 *
 * Nos 195 países há pares a um caractere de distância, e por isso o jogo de lá
 * roda com `tolerarTypo: false`. Aqui são 27 nomes, e a medida abaixo é o que
 * autoriza a decisão oposta — se alguém acrescentar um sinônimo que aproxime
 * dois itens, este teste cai antes de o jogo passar a dar ponto pelo vizinho.
 */
describe('distância entre as respostas', () => {
  /**
   * O raio de perdão de uma forma aceita, pelo tamanho dela: um caractere a
   * cada sete, que é a régua do projeto — sete letras valem um erro. Abaixo de
   * sete a tolerância não existe, e é por isso que `para` e `parana`, a dois
   * caracteres um do outro, não são um problema: nenhum dos dois chega ao
   * tamanho mínimo para ser corrigido.
   */
  const raio = (tamanho: number) => Math.min(3, Math.floor(tamanho / 7))

  /** Toda forma tem que estar FORA do raio de perdão de qualquer outra. */
  const colisoes = (formas: readonly string[]): string[] => {
    const saida: string[] = []
    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i] as string
        const b = formas[j] as string
        const limite = raio(Math.max(a.length, b.length))
        if (distancia(a, b, limite + 1) <= limite) saida.push(`${a} / ${b}`)
      }
    }
    return saida
  }

  it('nenhum nome de estado cai dentro do raio de perdão de outro', () => {
    expect(colisoes(ESTADOS.map((e) => normalizarTexto(e.nome, true)))).toEqual([])
  })

  it('nem com as siglas na mesma sacola', () => {
    // As siglas colidem entre si o tempo todo — "MT" e "MS" estão a um
    // caractere —, e não faz diferença: com duas letras o raio é zero, e o que
    // sobra é a exigência de que nenhuma seja igual a outra.
    const formas = ESTADOS.flatMap((e) => [normalizarTexto(e.nome, true), normalizarTexto(e.sigla, true)])
    expect(colisoes(formas)).toEqual([])
  })

  it('nenhuma capital cai dentro do raio de perdão de outra', () => {
    expect(colisoes(ESTADOS.map((e) => normalizarTexto(e.capital, true)))).toEqual([])
  })
})
