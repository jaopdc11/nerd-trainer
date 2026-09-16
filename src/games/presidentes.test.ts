import { describe, expect, it } from 'vitest'
import { FIM_DA_REPUBLICA_VELHA, PRESIDENTES } from '@/data/presidentes'
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
   * regulamento. Enquanto a lista excluir juntas e interinos e contar
   * sucessores, as duas coisas têm de estar ditas na abertura — e é isto que
   * trava a remoção distraída de uma dessas linhas.
   */
  it('o comoJogar diz a regra do recorte', () => {
    const texto = presidentes.comoJogar.join(' ').toLowerCase()
    expect(texto).toContain('sucessão')
    expect(texto).toContain('juntas governativas')
    expect(texto).toContain('duas vezes')
    // Os quatro excluídos aparecem pelo nome: dizer "e outros" não é regra.
    for (const fora of ['josé linhares', 'carlos luz', 'nereu ramos', 'mazzilli']) {
      expect(texto, fora).toContain(fora)
    }
  })

  it('a abertura promete a lista desde 1889, que é o que o jogo entrega', () => {
    expect(presidentes.comoJogar.join(' ')).toContain('1889')
    expect(presidentes.resumo).toContain('Deodoro')
  })
})

describe('sequência', () => {
  it('tem um item por mandato, na ordem do dataset', () => {
    expect(config.itens).toEqual(PRESIDENTES.map((p) => p.nome))
    expect(config.total).toBe(PRESIDENTES.length)
    expect(config.itens).toHaveLength(34)
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

  it('começa em Deodoro da Fonseca e termina em Lula', () => {
    expect(config.itens?.[0]).toBe('Deodoro da Fonseca')
    expect(config.itens?.at(-1)).toBe('Lula')
  })

  it('pede termo e teclado de texto', () => {
    // 'caractere' julgaria tecla a tecla e aceitaria "Lu" por "Lula"; teclado
    // numérico num jogo de nomes é o defeito mais burro possível no celular.
    expect(config.entrada).toBe('termo')
    expect(config.teclado).toBe('texto')
  })

  it('não usa itemEm: a lista é curta e mora inteira no dataset', () => {
    // Geração preguiçosa existe para dez mil primos. Trinta e quatro nomes na
    // abertura do menu não custam nada, e `itens` deixa o teste de ordem direto.
    expect(config.itemEm).toBeUndefined()
  })
})

describe('os números que a lista de 1889 mudou', () => {
  /**
   * A revisão pós-morte e o bloco da fita são o mesmo número de propósito: o
   * pedaço que o jogador decora depois de morrer é exatamente uma linha do que
   * ele vai ver na tentativa seguinte.
   */
  it('a revisão pós-morte e o bloco da fita têm o mesmo tamanho', () => {
    expect(config.revisaoPosMorte).toBe(config.agrupar)
    expect(config.revisaoPosMorte).toBe(5)
  })

  /**
   * A revisão cresceu junto com a lista, e por um motivo: com a partida
   * começando em 1889, a morte típica acontece nos primeiros itens, e o que
   * vem depois do fim é o único conteúdo real daquela partida.
   */
  it('a revisão cobre mais do que a República Velha inteira em três partidas', () => {
    const quantos = config.revisaoPosMorte ?? 0
    expect(quantos * 3).toBeGreaterThanOrEqual(FIM_DA_REPUBLICA_VELHA)
  })

  /**
   * A conta da meta sugerida ao Nerdômetro, fixada aqui porque o argumento é
   * uma propriedade da lista e não uma opinião solta: 17 é metade dos 34 **e**
   * cai exatamente em Café Filho, ou seja, cobre a República Velha inteira mais
   * as duas armadilhas do miolo (o Vargas repetido e o vice que assumiu depois
   * do suicídio). Se a lista crescer, a conta tem de ser refeita — e este teste
   * é o alarme.
   */
  it('a meta sugerida cai em Café Filho, na metade da lista', () => {
    const meta = (config.itens?.length ?? 0) / 2
    expect(meta).toBe(17)
    expect(config.itens?.[meta - 1]).toBe('Café Filho')
    // E a metade de baixo contém, inteira, a parte difícil.
    expect(meta).toBeGreaterThan(FIM_DA_REPUBLICA_VELHA)
  })
})
