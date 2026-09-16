import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { GRANDEZAS } from '@/data/grandezas'
import { notacaoDimensional } from '@/data/dimensoes'
import { analiseDimensional } from './analise-dimensional'

const baralho = (seed: number): readonly Carta[] =>
  analiseDimensional.config().montarBaralho(mulberry32(seed))

const cartas = baralho(23)

function carta(id: string) {
  const c = cartas.find((k) => k.id === `dim-${id}`)
  if (c?.tipo !== 'escolha') throw new Error(`carta de ${id} não encontrada`)
  return c
}

const alternativas = (id: string): readonly string[] =>
  carta(id).alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))

const correta = (id: string): string => {
  const c = carta(id)
  const escolhida = c.alternativas[c.indiceCorreto]
  return escolhida?.kind === 'texto' ? escolhida.valor : ''
}

describe('baralho', () => {
  it('tem uma carta por grandeza — a tabela inteira, não só as que têm unidade', () => {
    expect(cartas).toHaveLength(GRANDEZAS.length)
    expect(cartas).toHaveLength(43)
    // As sem unidade com nome próprio são justamente as melhores perguntas de
    // análise dimensional, e é aqui que elas existem.
    expect(cartas.some((c) => c.id === 'dim-torque')).toBe(true)
    expect(cartas.some((c) => c.id === 'dim-constante-gravitacional')).toBe(true)
  })

  it('toda carta é de escolha, com quatro opções distintas', () => {
    for (const c of cartas) {
      expect(c.tipo, c.id).toBe('escolha')
      if (c.tipo !== 'escolha') continue
      expect(c.alternativas, c.id).toHaveLength(4)
      const textos = c.alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))
      expect(new Set(textos).size, `${c.id}: opção repetida`).toBe(4)
    }
  })

  it('o índice correto aponta mesmo para a dimensão da grandeza', () => {
    // A trava contra o erro clássico de montar alternativa: embaralhar e
    // esquecer de recalcular o índice.
    for (const g of GRANDEZAS) {
      expect(correta(g.id), g.nome).toBe(notacaoDimensional(g))
    }
  })

  it('o gabarito mostra a dimensão, a unidade e a relação que as produz', () => {
    expect(carta('forca').gabarito).toBe('MLT⁻² = kg·m·s⁻² — F = m·a')
    // Na grandeza sem unidade com nome, a cadeia de base é o que sobra de
    // concreto — e é ela que mostra de onde vem cada letra.
    expect(carta('constante-gravitacional').gabarito).toContain('M⁻¹L³T⁻² = kg⁻¹·m³·s⁻²')
  })
})

describe('as opções erradas medem alguma coisa', () => {
  it('a vizinha está na tela: energia contra potência', () => {
    // Se o distrator fosse aleatório, esta carta se resolveria por eliminação
    // sem ninguém saber que potência é energia por tempo.
    expect(alternativas('energia')).toContain('ML²T⁻³') // potência
    expect(alternativas('energia')).toContain('ML²T²') // o sinal trocado
  })

  it('o sinal trocado está em toda carta que tem tempo na cadeia', () => {
    expect(alternativas('forca')).toContain('MLT²')
    expect(alternativas('velocidade')).toContain('LT')
    expect(alternativas('pressao')).toContain('ML⁻¹T²')
  })

  it('a resposta certa nunca aparece duas vezes, nem disfarçada de vizinha', () => {
    // Torque e energia têm os mesmos expoentes; gray e sievert também. A carta
    // de um não pode oferecer a do outro como se fosse opção errada.
    const torque = alternativas('torque')
    expect(torque.filter((a) => a === 'ML²T⁻²')).toHaveLength(1)
    const gray = alternativas('dose-absorvida')
    expect(gray.filter((a) => a === 'L²T⁻²')).toHaveLength(1)
  })
})

describe('sorteio', () => {
  it('a mesma seed dá o mesmo baralho, e seeds diferentes dão ordens diferentes', () => {
    expect(baralho(5).map((c) => c.id)).toEqual(baralho(5).map((c) => c.id))
    expect(baralho(5).map((c) => c.id)).not.toEqual(baralho(6).map((c) => c.id))
  })

  it('a posição da resposta certa varia entre as seeds', () => {
    // Se ela caísse sempre no mesmo lugar, o jogo teria uma estratégia que não é
    // física.
    const posicoes = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => {
        const c = baralho(seed).find((k) => k.id === 'dim-pressao')
        return c?.tipo === 'escolha' ? c.indiceCorreto : -1
      }),
    )
    expect(posicoes.size).toBeGreaterThan(1)
  })
})

describe('metadados', () => {
  it('é o que o registry espera', () => {
    expect(analiseDimensional.id).toBe('analise-dimensional')
    expect(analiseDimensional.mecanica).toBe('flashcard')
    expect(analiseDimensional.categoria).toBe('fisica')
    expect(analiseDimensional.config().fim).toBe('baralho')
    expect(analiseDimensional.comoJogar.length).toBeGreaterThanOrEqual(3)
  })
})
