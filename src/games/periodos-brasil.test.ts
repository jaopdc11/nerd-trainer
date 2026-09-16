import { describe, expect, it } from 'vitest'
import { PERIODOS } from '@/data/periodos-brasil'
import { periodosBrasil } from './periodos-brasil'

const config = periodosBrasil.config()

describe('metadados', () => {
  it('é sequência de humanas, com id estável', () => {
    expect(periodosBrasil.id).toBe('periodos-brasil')
    expect(periodosBrasil.mecanica).toBe('sequencia')
    expect(periodosBrasil.categoria).toBe('humanas')
  })

  /**
   * A escolha discutível do dataset — Colônia até 1815, com o Reino Unido como
   * período próprio — é a única coisa que o jogador pode errar sabendo
   * história, então ela tem de estar dita na abertura.
   */
  it('o comoJogar avisa do corte de 1815', () => {
    const texto = periodosBrasil.comoJogar.join(' ')
    expect(texto).toContain('1815')
    expect(texto).toContain('Reino Unido')
  })
})

describe('sequência', () => {
  it('tem um item por período, na ordem do dataset', () => {
    expect(config.itens).toEqual(PERIODOS.map((p) => p.nome))
    expect(config.total).toBe(PERIODOS.length)
    expect(config.itens).toHaveLength(11)
  })

  it('a fita anda para a frente no tempo', () => {
    // Redundante com o teste de continuidade do dataset, e de propósito: aqui
    // se verifica que o jogo não reordenou nem filtrou nada no caminho.
    const anos = PERIODOS.map((p) => p.inicio ?? Number.NEGATIVE_INFINITY)
    for (let i = 1; i < anos.length; i++) {
      expect(anos[i], `${PERIODOS[i]?.id}`).toBeGreaterThan(anos[i - 1] as number)
    }
  })

  it('começa no pré-cabralino e termina na Nova República', () => {
    expect(config.itens?.[0]).toBe('Pré-cabralino')
    expect(config.itens?.at(-1)).toBe('Nova República')
  })

  it('pede termo e teclado de texto', () => {
    expect(config.entrada).toBe('termo')
    expect(config.teclado).toBe('texto')
  })

  it('não agrupa a fita: onze itens são um bloco só', () => {
    expect(config.agrupar).toBeUndefined()
  })
})
