import { describe, expect, it } from 'vitest'
import {
  exibirArea,
  MAIORES_POR_AREA,
  PRIMEIRO_DE_FORA,
  TOTAL_MAIORES,
} from './maiores-paises'
import type { PaisPorArea } from './maiores-paises'
import { PAISES } from './paises'

const POR_ID = new Map(PAISES.map((p) => [p.id, p]))
const nome = (id: string) => POR_ID.get(id)?.nome ?? `«${id}» não existe em paises.ts`

describe('a lista', () => {
  it('tem vinte países, sem repetir nenhum', () => {
    expect(MAIORES_POR_AREA).toHaveLength(20)
    expect(TOTAL_MAIORES).toBe(20)
    expect(new Set(MAIORES_POR_AREA.map((p) => p.id)).size).toBe(20)
  })

  /**
   * O teste que justifica o módulo existir.
   *
   * A ordem é escrita à mão, linha por linha, e é ela que o jogo recita. Escrever
   * a ordem num lugar e o número no outro é convidar os dois a discordarem — e
   * quando discordam, quem perde é o jogador, que morre no item 11 obedecendo a
   * uma lista errada. Então a ordem declarada é reconstruída a partir dos números
   * e tem que dar exatamente a mesma coisa.
   */
  it('a ordem declarada é a ordem dos números, sem empate', () => {
    const declarada = MAIORES_POR_AREA.map((p) => p.id)
    const pelosNumeros = [...MAIORES_POR_AREA].sort((a, b) => b.areaKm2 - a.areaKm2).map((p) => p.id)
    expect(declarada).toEqual(pelosNumeros)

    // Estritamente decrescente: empate deixaria a ordem acima indefinida, e o
    // `sort` estável esconderia o problema em vez de mostrá-lo.
    for (let i = 1; i < MAIORES_POR_AREA.length; i++) {
      const anterior = MAIORES_POR_AREA[i - 1] as PaisPorArea
      const atual = MAIORES_POR_AREA[i] as PaisPorArea
      expect(atual.areaKm2, `${nome(atual.id)} não é menor que ${nome(anterior.id)}`).toBeLessThan(
        anterior.areaKm2,
      )
    }
  })

  it('todo id existe em paises.ts e é país soberano', () => {
    for (const p of MAIORES_POR_AREA) {
      const pais = POR_ID.get(p.id)
      expect(pais, `id "${p.id}" não está em paises.ts`).toBeDefined()
      // Groenlândia (2,1 milhões de km²) entraria em 12º se território valesse:
      // a lista é dos maiores *países*, e o filtro tem que ser explícito.
      expect(pais?.soberano, `${pais?.nome} não é soberano`).toBe(true)
    }
  })

  it('o corte no vigésimo é fronteira, não arredondamento', () => {
    const ultimo = MAIORES_POR_AREA[19] as PaisPorArea
    expect(POR_ID.get(PRIMEIRO_DE_FORA.id), 'o 21º também tem que existir em paises.ts').toBeDefined()
    expect(MAIORES_POR_AREA.some((p) => p.id === PRIMEIRO_DE_FORA.id)).toBe(false)
    expect(PRIMEIRO_DE_FORA.areaKm2).toBeLessThan(ultimo.areaKm2)
    // 17 mil km² de folga — mais que a área inteira do Kuwait. Se um dia isso
    // encolher para perto de zero, a lista passa a depender da fonte e este
    // teste é quem avisa.
    expect(ultimo.areaKm2 - PRIMEIRO_DE_FORA.areaKm2).toBeGreaterThan(10_000)
  })
})

/**
 * A troca declarada é uma decisão editorial — o cabeçalho do dataset explica que
 * China e EUA só se ordenam depois de escolhida a convenção de medida. Este teste
 * impede que ela vire acidente: uma troca de mão única seria armadilha, porque a
 * sequência aceitaria "Estados Unidos" na casa da China e recusaria a volta.
 */
describe('o par trocável', () => {
  it('é recíproco e entre posições vizinhas', () => {
    for (let i = 0; i < MAIORES_POR_AREA.length; i++) {
      const p = MAIORES_POR_AREA[i] as PaisPorArea
      if (!p.trocaCom) continue

      const j = MAIORES_POR_AREA.findIndex((o) => o.id === p.trocaCom)
      expect(j, `${nome(p.id)} troca com quem não está na lista`).toBeGreaterThanOrEqual(0)
      expect(
        (MAIORES_POR_AREA[j] as PaisPorArea).trocaCom,
        `${nome(p.id)} declara a troca, ${nome(p.trocaCom)} não devolve`,
      ).toBe(p.id)
      expect(Math.abs(i - j), 'trocar de lugar só faz sentido entre vizinhos').toBe(1)
    }
  })

  it('só China e Estados Unidos trocam — e a diferença entre eles é menor que 1%', () => {
    const trocaveis = MAIORES_POR_AREA.filter((p) => p.trocaCom).map((p) => p.id)
    expect(trocaveis.sort()).toEqual(['cn', 'us'])

    const cn = MAIORES_POR_AREA.find((p) => p.id === 'cn') as PaisPorArea
    const us = MAIORES_POR_AREA.find((p) => p.id === 'us') as PaisPorArea
    expect((cn.areaKm2 - us.areaKm2) / cn.areaKm2).toBeLessThan(0.01)
  })
})

/**
 * Âncoras conferidas à mão contra o Factbook, uma a uma. São as que mais doeriam
 * se escapassem: o pódio, o Brasil (que todo brasileiro sabe onde fica e notaria
 * na hora) e as duas pontas do corte.
 */
describe('os números conferidos à mão', () => {
  const posicao = (id: string) => MAIORES_POR_AREA.findIndex((p) => p.id === id) + 1
  const area = (id: string) => MAIORES_POR_AREA.find((p) => p.id === id)?.areaKm2

  it('o pódio', () => {
    expect(posicao('ru')).toBe(1)
    expect(area('ru')).toBe(17_098_246)
    expect(posicao('ca')).toBe(2)
    expect(area('ca')).toBe(9_984_670)
    expect(posicao('cn')).toBe(3)
    expect(area('cn')).toBe(9_596_961)
  })

  it('o Brasil é o quinto, atrás da Austrália por quase 800 mil km²', () => {
    expect(posicao('br')).toBe(5)
    expect(area('br')).toBe(8_515_767)
    expect((area('au') as number) - (area('br') as number)).toBeLessThan(0)
    expect((area('br') as number) - (area('au') as number)).toBeGreaterThan(800_000)
  })

  it('as casas 19 e 20 estão a pouco mais de mil km² uma da outra', () => {
    expect(posicao('pe')).toBe(19)
    expect(posicao('td')).toBe(20)
    expect((area('pe') as number) - (area('td') as number)).toBe(1_216)
  })

  it('a Rússia sozinha é maior que os três seguintes... quase', () => {
    // Não é: 17,1 contra 19,6 milhões. A conta está aqui porque a intuição de
    // "a Rússia é maior que tudo" é justamente o tipo de coisa que entra num
    // dataset como fato sem ninguém somar.
    const tres = ['ca', 'cn', 'us'].reduce((s, id) => s + (area(id) as number), 0)
    expect(area('ru')).toBeLessThan(tres)
  })
})

describe('exibirArea', () => {
  it('escreve o número no formato brasileiro', () => {
    expect(exibirArea(17_098_246)).toBe('17.098.246 km²')
    expect(exibirArea(1_284_000)).toBe('1.284.000 km²')
  })
})
