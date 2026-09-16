import { describe, expect, it } from 'vitest'
import { EQUACOES, balancear, confere, exibirConjunto } from '@/data/equacoes'
import { mulberry32 } from '@/core/rng'
import type { Exercicio } from '@/core/types'
import { balanceamento, gerarBalanceamento } from './balanceamento'

const NIVEL_MAX = 2

function amostra(nivel: number, quantos = 300): Exercicio[] {
  return Array.from({ length: quantos }, (_, i) => gerarBalanceamento(mulberry32(i + 1), nivel))
}

/** A equação do exercício, achada pela chave de anti-repetição. */
function equacaoDe(e: Exercicio) {
  const id = e.chave.replace(/^bal:/, '')
  const eq = EQUACOES.find((q) => q.id === id)
  expect(eq, `chave ${e.chave} não aponta para equação nenhuma`).toBeDefined()
  return eq as (typeof EQUACOES)[number]
}

describe('gerador de balanceamento', () => {
  it('sempre produz quatro alternativas distintas, com a certa entre elas', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(nivel)) {
        if (e.tipo !== 'escolha') throw new Error(`${e.chave} devia ser de escolha`)
        expect(e.alternativas, e.chave).toHaveLength(4)
        expect(e.alternativas[e.indiceCorreto]?.valor, e.chave).toBe(e.gabarito)
        const valores = e.alternativas.map((a) => a.valor)
        expect(new Set(valores).size, `${e.chave}: ${valores.join(' | ')}`).toBe(4)
      }
    }
  })

  it('a alternativa certa é o conjunto que o solucionador devolve', () => {
    // O gabarito não pode ter vindo do enunciado nem de um número solto: ele é
    // o que `balancear()` resolve para aquela equação, e mais nada.
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(nivel, 120)) {
        expect(e.gabarito, e.chave).toBe(exibirConjunto(balancear(equacaoDe(e))))
      }
    }
  })

  it('só uma alternativa é o menor conjunto que fecha a equação', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(nivel, 120)) {
        if (e.tipo !== 'escolha') continue
        const eq = equacaoDe(e)
        const certo = balancear(eq)

        const fecham = e.alternativas.filter((a) => {
          const coeficientes = a.valor.split(', ').map(Number)
          return coeficientes.length === certo.length && confere(eq, coeficientes)
        })

        // Mais de uma pode conservar os átomos — o conjunto dobrado conserva —,
        // mas só uma é a mínima, e é a que pontua.
        const minimas = fecham.filter((a) => a.valor === exibirConjunto(certo))
        expect(minimas, `${e.chave}: ${e.alternativas.map((a) => a.valor).join(' | ')}`).toHaveLength(1)
      }
    }
  })

  it('toda alternativa é uma lista de inteiros positivos, do tamanho da equação', () => {
    for (const e of amostra(NIVEL_MAX)) {
      if (e.tipo !== 'escolha') continue
      const especies = equacaoDe(e).reagentes.length + equacaoDe(e).produtos.length
      for (const a of e.alternativas) {
        expect(a.valor, `${e.chave}: ${a.valor}`).toMatch(/^[1-9]\d*(, [1-9]\d*)*$/)
        expect(a.valor.split(', '), `${e.chave}: ${a.valor}`).toHaveLength(especies)
      }
    }
  })

  it('o enunciado mostra a equação sem coeficiente nenhum', () => {
    // Se um número vazar para o enunciado, parte da resposta está na pergunta.
    for (const e of amostra(NIVEL_MAX)) {
      expect(e.enunciado.valor, e.chave).toContain('→')
      // `\d` é só ASCII: os índices das fórmulas são subscritos Unicode e
      // passam de propósito. O que não pode aparecer é um coeficiente.
      expect(e.enunciado.valor, e.chave).not.toMatch(/\d/)
    }
  })

  it('explica a resposta no último degrau, e só nele', () => {
    const comExplicacao = amostra(NIVEL_MAX, 200).filter((e) => e.porque !== undefined)
    expect(comExplicacao.length).toBeGreaterThan(0)
    for (const e of amostra(0, 200)) {
      expect(e.porque, e.chave).toBeUndefined()
    }
  })

  it('acumula os níveis em vez de substituí-los', () => {
    const chaves = amostra(NIVEL_MAX, 400).map((e) => e.chave)
    expect(chaves.some((c) => c === 'bal:octano' || c === 'bal:pirita')).toBe(true)
    expect(chaves.some((c) => c === 'bal:agua' || c === 'bal:metano')).toBe(true)
  })

  it('o nível 0 só sorteia equação do nível 0', () => {
    for (const e of amostra(0, 200)) {
      expect(equacaoDe(e).nivel, e.chave).toBe(0)
    }
  })
})

describe('jogo', () => {
  it('declara o relógio mais folgado que os outros geradores, e um teto coerente', () => {
    const config = balanceamento.config()
    expect(config.segundosIniciais).toBeGreaterThan(60)
    expect(config.tetoSegundos).toBeGreaterThan(config.segundosIniciais)
    // Bônus maior que o tempo de leitura de uma equação, senão o relógio só cai.
    expect(config.bonusPorAcertoS).toBeGreaterThanOrEqual(5)
  })

  it('a escala chega ao último degrau e para lá', () => {
    const { escala } = balanceamento.config()
    expect(escala(0)).toBe(0)
    expect(escala(1000)).toBe(NIVEL_MAX)
  })
})
