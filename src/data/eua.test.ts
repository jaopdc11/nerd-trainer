import { describe, expect, it } from 'vitest'
import { distancia, normalizarTexto } from '@/core/answer'
import { ALTURA_MAPA, FORMAS, LARGURA_MAPA } from './eua-mapa'
import { ESTADOS_EUA } from './eua'

describe('o conjunto', () => {
  it('são 51: os 50 estados mais o Distrito de Colúmbia', () => {
    expect(ESTADOS_EUA).toHaveLength(51)
    expect(ESTADOS_EUA.filter((e) => e.sigla === 'DC')).toHaveLength(1)
  })

  it('não repete sigla nem nome', () => {
    expect(new Set(ESTADOS_EUA.map((e) => e.sigla)).size).toBe(ESTADOS_EUA.length)
    expect(new Set(ESTADOS_EUA.map((e) => normalizarTexto(e.nome, true))).size).toBe(
      ESTADOS_EUA.length,
    )
  })

  it('a sigla é sempre duas letras maiúsculas', () => {
    for (const e of ESTADOS_EUA) expect(e.sigla, e.nome).toMatch(/^[A-Z]{2}$/)
  })

  it('as quatro regiões têm o total do Census, e ninguém ficou sem região', () => {
    const porRegiao = new Map<string, number>()
    for (const e of ESTADOS_EUA) porRegiao.set(e.regiao, (porRegiao.get(e.regiao) ?? 0) + 1)

    // Contagem do Census Bureau, com DC no Sul: é o que pega um estado trocado de
    // região sem que o total de 51 mude.
    expect(porRegiao.get('Nordeste')).toBe(9)
    expect(porRegiao.get('Meio-Oeste')).toBe(12)
    expect(porRegiao.get('Sul')).toBe(17)
    expect(porRegiao.get('Oeste')).toBe(13)
    expect([...porRegiao.values()].reduce((a, b) => a + b, 0)).toBe(51)
  })
})

/**
 * A conferência por caminho independente, que é a regra do projeto: o teste não
 * pode ser o próprio dado se autoaprovando.
 *
 * A tabela abaixo foi escrita de novo, à mão, agrupada **por região** — e não na
 * ordem alfabética em que o gerador emite — para que conferir uma contra a outra
 * seja leitura de verdade, e não copiar-colar. Se as duas discordarem, uma está
 * errada e o teste não diz qual: é para ir olhar.
 */
const REGIAO: Readonly<Record<string, string>> = {
  // Nordeste (Northeast)
  CT: 'Nordeste', ME: 'Nordeste', MA: 'Nordeste', NH: 'Nordeste', RI: 'Nordeste',
  VT: 'Nordeste', NJ: 'Nordeste', NY: 'Nordeste', PA: 'Nordeste',
  // Meio-Oeste (Midwest)
  IL: 'Meio-Oeste', IN: 'Meio-Oeste', MI: 'Meio-Oeste', OH: 'Meio-Oeste', WI: 'Meio-Oeste',
  IA: 'Meio-Oeste', KS: 'Meio-Oeste', MN: 'Meio-Oeste', MO: 'Meio-Oeste', NE: 'Meio-Oeste',
  ND: 'Meio-Oeste', SD: 'Meio-Oeste',
  // Sul (South) — inclui DC
  DE: 'Sul', FL: 'Sul', GA: 'Sul', MD: 'Sul', NC: 'Sul', SC: 'Sul', VA: 'Sul', WV: 'Sul', DC: 'Sul',
  AL: 'Sul', KY: 'Sul', MS: 'Sul', TN: 'Sul', AR: 'Sul', LA: 'Sul', OK: 'Sul', TX: 'Sul',
  // Oeste (West)
  AZ: 'Oeste', CO: 'Oeste', ID: 'Oeste', MT: 'Oeste', NV: 'Oeste', NM: 'Oeste', UT: 'Oeste',
  WY: 'Oeste', AK: 'Oeste', CA: 'Oeste', HI: 'Oeste', OR: 'Oeste', WA: 'Oeste',
}

describe('regiões', () => {
  it('cada estado está na região que a tabela conferida à mão diz', () => {
    for (const e of ESTADOS_EUA) {
      expect(e.regiao, `região de ${e.nome} (${e.sigla})`).toBe(REGIAO[e.sigla])
    }
  })

  it('a tabela de conferência cobre as 51 e nenhuma a mais', () => {
    expect(Object.keys(REGIAO)).toHaveLength(51)
    const siglas = new Set(ESTADOS_EUA.map((e) => e.sigla))
    for (const sigla of Object.keys(REGIAO)) expect(siglas.has(sigla), sigla).toBe(true)
  })
})

/**
 * Acentuação, do mesmo jeito que os elementos químicos têm o teste do "Azoto".
 *
 * Nome de estado sem acento passa despercebido no código e aparece na tela do
 * jogador. Como o validador ignora acento nada quebra ao responder — o que
 * estraga é o gabarito mostrar "California" ou "Georgia".
 */
describe('acentuação', () => {
  const ACENTUADOS = [
    'Califórnia', 'Flórida', 'Geórgia', 'Havaí', 'Novo México', 'Pensilvânia',
    'Virgínia', 'Virgínia Ocidental', 'Distrito de Colúmbia',
  ]

  it('os nomes que levam acento estão escritos com ele', () => {
    const nomes = new Set(ESTADOS_EUA.map((e) => e.nome))
    for (const nome of ACENTUADOS) expect(nomes.has(nome), `falta "${nome}"`).toBe(true)
  })
})

describe('geometria', () => {
  it('bijeção nos dois sentidos: todo estado tem forma e toda forma tem estado', () => {
    const siglas = new Set(ESTADOS_EUA.map((e) => e.sigla))
    for (const e of ESTADOS_EUA) {
      expect(FORMAS[e.sigla], `${e.nome} não tem contorno`).toBeDefined()
    }
    for (const sigla of Object.keys(FORMAS)) expect(siglas.has(sigla), sigla).toBe(true)
    expect(Object.keys(FORMAS)).toHaveLength(ESTADOS_EUA.length)
  })

  it('todo contorno é um path fechado dentro da caixa da projeção', () => {
    for (const e of ESTADOS_EUA) {
      const d = FORMAS[e.sigla]?.d ?? ''
      expect(d.startsWith('M'), e.nome).toBe(true)
      expect(d.endsWith('Z'), e.nome).toBe(true)

      const numeros = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
      // DC é um distrito minúsculo — um punhado de vértices, não um estado
      // inteiro; os demais têm contorno farto.
      const minimo = e.sigla === 'DC' ? 6 : 20
      expect(numeros.length, `${e.nome} tem contorno vazio`).toBeGreaterThanOrEqual(minimo)
      for (let i = 0; i < numeros.length; i += 2) {
        expect(numeros[i], `${e.nome}: x fora da caixa`).toBeGreaterThanOrEqual(0)
        expect(numeros[i], `${e.nome}: x fora da caixa`).toBeLessThanOrEqual(LARGURA_MAPA)
        expect(numeros[i + 1], `${e.nome}: y fora da caixa`).toBeGreaterThanOrEqual(0)
        expect(numeros[i + 1], `${e.nome}: y fora da caixa`).toBeLessThanOrEqual(ALTURA_MAPA)
      }
    }
  })

  /**
   * A Albers USA reposiciona Alasca e Havaí no canto inferior esquerdo; o resto é
   * o continente com o y para baixo. Este teste fixa o esqueleto do mapa para que
   * uma projeção trocada (ou uma reflexão em y) não volte em silêncio.
   */
  it('o mapa está orientado: Washington no topo, Texas embaixo, Maine à direita, Alasca no canto de baixo', () => {
    const centro = (sigla: string) => {
      const numeros = (FORMAS[sigla]?.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
      const xs = numeros.filter((_, i) => i % 2 === 0)
      const ys = numeros.filter((_, i) => i % 2 === 1)
      return {
        x: xs.reduce((a, b) => a + b, 0) / xs.length,
        y: ys.reduce((a, b) => a + b, 0) / ys.length,
      }
    }

    expect(centro('WA').y).toBeLessThan(centro('TX').y)
    expect(centro('CA').x).toBeLessThan(centro('ME').x)
    // Alasca é o inset do canto inferior esquerdo: abaixo de Washington e à
    // esquerda de Maine, apesar de ser o estado mais ao norte na realidade.
    expect(centro('AK').y).toBeGreaterThan(centro('WA').y)
    expect(centro('AK').x).toBeLessThan(centro('ME').x)

    // O desenho ocupa a caixa inteira: "está lá" e "está do tamanho certo" não
    // podem ser a mesma asserção.
    const todos = Object.values(FORMAS).flatMap((f) => (f.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number))
    const xs = todos.filter((_, i) => i % 2 === 0)
    const ys = todos.filter((_, i) => i % 2 === 1)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(LARGURA_MAPA * 0.99)
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(ALTURA_MAPA * 0.99)
  })
})

/**
 * Por que este jogo pode deixar a tolerância a erro de digitação **ligada**,
 * como o do Brasil e ao contrário do mapa-múndi.
 *
 * São 51 nomes, e a medida abaixo é o que autoriza a decisão: se alguém
 * acrescentar um sinônimo que aproxime dois estados, este teste cai antes de o
 * jogo passar a dar ponto pelo vizinho.
 */
describe('distância entre as respostas', () => {
  /** Raio de perdão pelo tamanho: um caractere a cada sete, teto três — a régua do projeto. */
  const raio = (tamanho: number) => Math.min(3, Math.floor(tamanho / 7))

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
    expect(colisoes(ESTADOS_EUA.map((e) => normalizarTexto(e.nome, true)))).toEqual([])
  })

  it('nem com as siglas na mesma sacola', () => {
    // As siglas colidem entre si o tempo todo (MN/MO/MT...), e não faz diferença:
    // com duas letras o raio é zero, e o que sobra é a exigência de que nenhuma
    // seja igual a outra.
    const formas = ESTADOS_EUA.flatMap((e) => [
      normalizarTexto(e.nome, true),
      normalizarTexto(e.sigla, true),
    ])
    expect(colisoes(formas)).toEqual([])
  })

  it('nem os nomes em inglês contra os nomes em português de OUTROS estados', () => {
    // O sinônimo em inglês de um estado não pode cair no raio do nome (pt) de
    // outro — senão "Virginia" digitado poderia acender a Virgínia Ocidental.
    for (const alvo of ESTADOS_EUA) {
      for (const sin of alvo.sinonimos) {
        for (const outro of ESTADOS_EUA) {
          if (outro.sigla === alvo.sigla) continue
          const a = normalizarTexto(sin, true)
          const b = normalizarTexto(outro.nome, true)
          const limite = raio(Math.max(a.length, b.length))
          expect(
            distancia(a, b, limite + 1) > limite,
            `"${sin}" (${alvo.sigla}) colide com "${outro.nome}" (${outro.sigla})`,
          ).toBe(true)
        }
      }
    }
  })
})
