import { describe, expect, it } from 'vitest'
import { PRESIDENTES } from '@/data/presidentes'
import { presidentes } from './presidentes'

const config = presidentes.config()

describe('metadados', () => {
  it('é sequência de humanas, com id estável', () => {
    expect(presidentes.id).toBe('presidentes')
    expect(presidentes.mecanica).toBe('sequencia')
    expect(presidentes.categoria).toBe('humanas')
  })

  /**
   * A regra do recorte é parte do jogo, não trivia.
   *
   * Quem digita "Nereu Ramos" na hora certa e morre por isso perdeu para o
   * regulamento. Enquanto a lista excluir interinos e contar sucessores, as
   * duas coisas têm de estar ditas na abertura — e é isto que trava a remoção
   * distraída de uma dessas linhas.
   */
  it('o comoJogar diz a regra do recorte', () => {
    const texto = presidentes.comoJogar.join(' ').toLowerCase()
    expect(texto).toContain('sucessão')
    expect(texto).toContain('itamar')
    expect(texto).toContain('sarney')
    expect(texto).toContain('temer')
    expect(texto).toContain('juntas governativas')
    expect(texto).toContain('duas vezes')
  })
})

describe('sequência', () => {
  it('tem um item por mandato, na ordem do dataset', () => {
    expect(config.itens).toEqual(PRESIDENTES.map((p) => p.nome))
    expect(config.total).toBe(PRESIDENTES.length)
  })

  it('são 21 mandatos', () => {
    // Número escrito à mão de propósito: se a lista mudar de tamanho, que seja
    // por decisão, e a decisão passa por aqui e pela meta do Nerdômetro.
    expect(config.itens).toHaveLength(21)
  })

  /**
   * A ordem do jogo é a ordem cronológica — o teste é redundante com o do
   * dataset e isso é intencional: lá se verifica o dado, aqui se verifica que o
   * jogo não reordenou, filtrou nem embaralhou nada no caminho.
   */
  it('a fita anda para a frente no tempo', () => {
    const porNome = PRESIDENTES.map((p) => [p.nome, p.inicio] as const)
    const itens = config.itens ?? []
    for (let i = 1; i < itens.length; i++) {
      expect(porNome[i]?.[1].localeCompare(porNome[i - 1]?.[1] ?? '')).toBeGreaterThan(0)
      expect(itens[i]).toBe(porNome[i]?.[0])
    }
  })

  it('começa em Getúlio Vargas e termina em Lula', () => {
    expect(config.itens?.[0]).toBe('Getúlio Vargas')
    expect(config.itens?.at(-1)).toBe('Lula')
  })

  it('pede termo e teclado de texto', () => {
    // 'caractere' julgaria tecla a tecla e aceitaria "Lu" por "Lula"; teclado
    // numérico num jogo de nomes é o defeito mais burro possível no celular.
    expect(config.entrada).toBe('termo')
    expect(config.teclado).toBe('texto')
  })

  it('não usa itemEm: a lista é curta e mora inteira no dataset', () => {
    // Geração preguiçosa existe para dez mil primos. Vinte e um nomes na
    // abertura do menu não custam nada, e `itens` deixa o teste de ordem direto.
    expect(config.itemEm).toBeUndefined()
  })
})
