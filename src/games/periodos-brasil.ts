import { PERIODOS } from '@/data/periodos-brasil'
import type { JogoSequencia } from '@/core/types'

/**
 * História do Brasil em períodos, do pré-cabralino à Nova República.
 *
 * Mecânica A, e aqui ela é quase obrigatória: um período **é** sua posição
 * entre dois outros. Saber que existe uma coisa chamada Regência sem saber que
 * ela fica entre a abdicação e a maioridade é saber uma palavra, não um
 * período. Um flashcard "1831–1840 → ?" testaria o número; a sequência testa a
 * costura, que é o que a periodização tem para ensinar.
 *
 * **Por que é um jogo separado do de presidentes**, e não uma segunda lista do
 * mesmo: são onze itens contra vinte e um, e são réguas diferentes de tempo —
 * quinhentos anos em blocos contra noventa anos em mandatos. Juntar os dois num
 * jogo só faria uma fita de trinta e dois itens em que a primeira metade é
 * conceito e a segunda é gente, e quem morresse no item 12 nunca veria a
 * metade que sabe.
 *
 * A lista é curta de propósito e o jogo é, por isso, o mais fácil dos dois — é
 * a porta de entrada da categoria. A meta no Nerdômetro tem de refletir isso:
 * onze itens decoráveis valem peso baixo, não nota de façanha.
 *
 * **Contrato com a engine.** Como em `presidentes`, os itens são texto e
 * `useSequence` ainda deriva a especificação da resposta só de `entrada`
 * ('termo' → `inteiroGrande`). Falta lá o ramo de texto; o dataset já traz as
 * formas aceitas prontas para ele.
 */

const ITENS: readonly string[] = PERIODOS.map((p) => p.nome)

export const periodosBrasil: JogoSequencia = {
  id: 'periodos-brasil',
  mecanica: 'sequencia',
  nome: 'Períodos da História do Brasil',
  icone: '📜',
  resumo: 'Do pré-cabralino à Nova República, na ordem. Onze blocos de quinhentos anos.',
  categoria: 'humanas',
  unidade: { singular: 'período', plural: 'períodos' },
  comoJogar: [
    'Digite os períodos em ordem, do pré-cabralino até hoje, confirmando cada um com Enter.',
    'São onze: Colônia, Reino Unido, Primeiro Reinado, Regência, Segundo Reinado, República Velha, Era Vargas, República de 1946, Ditadura Militar e Nova República.',
    'Sinônimos de sala de aula valem — "Primeira República" por República Velha, "Brasil Colônia" por Colônia. Acento e maiúscula não importam.',
    'A Colônia acaba em 1815, quando o Brasil vira Reino Unido: o Reino Unido é um item, não um detalhe da Colônia.',
  ],
  config: () => ({
    itens: ITENS,
    total: ITENS.length,
    // Ver a nota do jogo de presidentes: é `respostaEm` que faz "Primeira
    // República" valer por República Velha.
    respostaEm: (i) => {
      const p = PERIODOS[i]
      return { tipo: 'texto', canonica: p?.nome ?? '', aceitas: p?.aceitas ?? [] }
    },
    // 'termo': "Primeiro Reinado" é uma resposta de duas palavras, e julgar na
    // tecla mataria o jogador no espaço.
    entrada: 'termo',
    teclado: 'texto',
    separador: ' → ',
    // Sem `agrupar`: onze itens cabem na fita inteira, e quebrar em blocos
    // sugeriria uma divisão que a periodização não tem.
    revisaoPosMorte: 3,
  }),
}
