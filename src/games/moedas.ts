import { MOEDA_DE_PAIS, formasAceitas, moedaDoPais, paisesDaMoeda } from '@/data/moedas'
import type { Moeda } from '@/data/moedas'
import { PAISES } from '@/data/paises'
import type { Pais } from '@/data/paises'
import { AVISOS } from './avisos'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * País → moeda, digitado, baralho de 195.
 *
 * É o terceiro baralho que pergunta sobre os mesmos países — depois das bandeiras
 * e das capitais — e é de propósito: o acervo de países é o maior do app e cada
 * ângulo novo cobra uma coisa diferente do mesmo mapa mental. Aqui a pergunta é
 * de economia disfarçada de geografia.
 *
 * **Flashcard, e não grade sobre o mapa-múndi como as capitais.** A grade só
 * funciona quando a resposta identifica a célula: "Gitega" acende o Burundi e mais
 * nenhum país. Aqui não identifica nada — "euro" acenderia 26 países de uma vez, e
 * a mecânica de ordem livre não tem o que fazer com isso. Foi a primeira ideia e
 * morreu no papel.
 *
 * **Os 195 soberanos, sem os 9 territórios**, ao contrário do baralho de
 * bandeiras e do mapa de capitais. O motivo está no cabeçalho de `data/moedas.ts`:
 * território quase sempre usa o dinheiro de quem administra, e dois deles não têm
 * resposta que eu assine embaixo.
 *
 * **O gabarito diz quantos países dividem a moeda.** É a resposta de desenho para
 * o problema central deste dataset: 26 cartas respondem "euro" e 14 respondem
 * "franco CFA". Sem o número, a repetição é só repetição; com ele, a carta da
 * Eslováquia ensina que a zona do euro tem 21 membros e que a Polônia não é um
 * deles. A alternativa descartada era cortar o baralho para uma carta por moeda,
 * sorteando um país representante: isso apagaria justamente o que vale saber, que
 * é *quem* está em cada bloco.
 *
 * A tolerância a erro de digitação fica **ligada**, como nas bandeiras e nas
 * capitais. `data/moedas.test.ts` mede o baralho inteiro e não acha nenhum par de
 * moedas distintas a um caractere de distância, então ela é misericórdia pura com
 * "dólar de Trinidad e Tobago" e "colón costarriquenho". Duas cartas com a
 * resposta literalmente igual ("dólar" é forma aceita de quinze moedas) não são
 * problema: o validador casa a forma exata antes de cogitar typo.
 *
 * **O que a repetição custa, e está medido em `moedas.test.ts`:** nas moedas
 * compartilhadas a tolerância deixa de existir. A trava de ambiguidade compara a
 * entrada com as formas das outras cartas, e as outras sete cartas do bloco CFA
 * carregam exatamente a mesma forma — então qualquer typo encosta num vizinho e é
 * recusado. Fica assim de propósito: escrever certo continua pontuando, essas
 * moedas têm a saída de uma palavra ("franco", "dólar", "euro"), e mexer na trava
 * para recuperar a misericórdia derrubaria a única coisa que impede uma carta de
 * dar o ponto da outra.
 *
 * **A forma curta vale em todas, inclusive nas compartilhadas** — decisão 3 do
 * cabeçalho de `data/moedas.ts`, que mudou depois de medida. Eram 34 das 195
 * cartas exigindo o qualificador (os dois CFA, o franco suíço, os três dólares de
 * bloco), e nelas o jogador que sabia a resposta ainda perdia o ponto por não
 * completar o nome. O fato que o qualificador carregava não se perdeu: sai no
 * gabarito de toda carta, com o tamanho do bloco junto.
 */
function cartaMoeda(p: Pais): Carta {
  // O dataset cobre exatamente os soberanos, e o teste é quem garante — o filtro
  // abaixo e a tabela não podem divergir sem quebrar `moedas.test.ts`.
  const chave = MOEDA_DE_PAIS[p.id] as string
  const moeda = moedaDoPais(p.id) as Moeda
  const quantos = paisesDaMoeda(chave).length

  return {
    tipo: 'digitada',
    id: `moeda-${p.id}`,
    pergunta: { kind: 'texto', valor: p.nome },
    // O mesmo recado dos mapas e do baralho de bandeiras, na mesma lista: uma
    // posição dessas não pode valer num tabuleiro e sumir aqui.
    ...(AVISOS[p.id] ? { aviso: AVISOS[p.id] } : {}),
    resposta: {
      tipo: 'texto',
      canonica: moeda.nome,
      aceitas: formasAceitas(moeda),
    },
    gabarito:
      quantos > 1
        ? `${moeda.nome} (${moeda.codigo}) — a moeda de ${quantos} países desta lista`
        : `${moeda.nome} (${moeda.codigo})`,
  }
}

export const moedas: JogoFlashcard = {
  id: 'moedas',
  mecanica: 'flashcard',
  nome: 'Moedas do mundo',
  icone: '💱',
  resumo: 'Aparece o país, você escreve a moeda. São 141 para 195 países.',
  categoria: 'geografia',
  // "31 moedas" e não "31 países", ao contrário do baralho de idiomas: aqui a
  // carta tem uma moeda só, e é ela que o jogador nomeou.
  unidade: { singular: 'moeda', plural: 'moedas' },
  comoJogar: [
    'Aparece "Paraguai" e você escreve "guarani". São os 195 países soberanos.',
    'A família basta sempre: "dólar" vale para o Canadá e para o Equador, "franco" para o Congo e para o Senegal, "coroa" para a Suécia.',
    'O gabarito devolve o nome inteiro — e, quando a moeda é de bloco, quantos países a dividem.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(PAISES.filter((p) => p.soberano)).map(cartaMoeda),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
