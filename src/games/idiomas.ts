import { formasAceitas, idiomasDoPais } from '@/data/idiomas'
import type { Idioma } from '@/data/idiomas'
import { PAISES } from '@/data/paises'
import type { Pais } from '@/data/paises'
import { AVISOS } from './avisos'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * País → idioma oficial, digitado, baralho de 195.
 *
 * **A pergunta é "um idioma oficial", não "o idioma oficial"**, e isso não é
 * amaciar a cobrança: é o que o dado permite perguntar. Mais de sessenta países
 * desta lista têm mais de uma língua oficial, a África do Sul tem doze e o
 * Zimbábue dezesseis. Qualquer uma delas pontua, exatamente como as três sedes da
 * África do Sul pontuam no jogo de capitais — a alternativa, eleger uma e recusar
 * as outras, corrigiria como erro quem respondeu "francês" para o Canadá.
 *
 * **O gabarito mostra a lista inteira, e é aí que o jogo ensina.** Quem escreveu
 * "alemão" para a Suíça ganha o ponto e descobre na mesma tela que são quatro;
 * quem escreveu "inglês" para a Índia descobre que o hindi está junto e que
 * língua nacional a Índia não tem. Um gabarito de uma linha só desperdiçaria o
 * melhor do dataset.
 *
 * **Os 195 soberanos, sem os 9 territórios**, pelo mesmo motivo das moedas e com
 * o mesmo caso decisivo: o idioma oficial do Saara Ocidental depende de a quem se
 * pergunta, e uma carta assim não corrige ninguém, só toma partido.
 *
 * **Flashcard e não grade sobre o mapa**, também como as moedas: "inglês" é
 * resposta de 59 países e não identifica célula nenhuma, que é o que a mecânica de
 * ordem livre precisa para funcionar.
 *
 * A tolerância a erro de digitação fica **ligada**. `data/idiomas.test.ts` mede o
 * catálogo inteiro e acha um único par a um caractere de distância — "islandês" e
 * "irlandês" —, e quem resolve esse par é a trava de vizinhança do validador, que
 * recusa a entrada que encosta nas duas. Nos idiomas mais repetidos a tolerância
 * acaba morrendo por consequência dessa mesma trava (as outras 58 cartas de inglês
 * carregam a forma idêntica), e fica assim: "inglês" tem seis letras e não precisa
 * de misericórdia; "crioulo seichelense" precisa, e é carta única.
 */
function cartaIdioma(p: Pais): Carta {
  // O dataset cobre exatamente os soberanos, e `idiomas.test.ts` é quem garante —
  // uma lista vazia aqui seria carta sem resposta possível.
  const idiomas: readonly Idioma[] = idiomasDoPais(p.id)
  const primeiro = idiomas[0] as Idioma

  return {
    tipo: 'digitada',
    id: `idioma-${p.id}`,
    pergunta: { kind: 'texto', valor: p.nome },
    // O mesmo recado dos mapas e dos outros baralhos de países, na mesma lista.
    ...(AVISOS[p.id] ? { aviso: AVISOS[p.id] } : {}),
    /*
     * A dica diz quantas são, e não quais — e existe para tirar a dúvida de
     * regra, não para dar a resposta. Sem ela, quem sabe que a Bélgica tem três
     * oficiais fica travado tentando adivinhar qual delas o jogo quer, que é
     * exatamente a insegurança que este baralho não deveria produzir. O que ela
     * entrega — "este país é multilíngue" — não aproxima ninguém de escrever
     * "neerlandês".
     */
    ...(idiomas.length > 1 ? { dica: `${idiomas.length} oficiais — qualquer uma vale` } : {}),
    resposta: {
      tipo: 'texto',
      canonica: primeiro.nome,
      aceitas: formasAceitas(idiomas),
    },
    gabarito: idiomas.map((i) => i.nome).join(', '),
  }
}

export const idiomas: JogoFlashcard = {
  id: 'idiomas',
  mecanica: 'flashcard',
  nome: 'Idiomas oficiais',
  icone: '🗣',
  resumo: 'Aparece o país, você escreve um idioma oficial dele.',
  categoria: 'geografia',
  /*
   * "31 países", e não "31 idiomas": quem acertou trinta e uma cartas pode ter
   * escrito "inglês" em vinte delas, e um placar dizendo "31 idiomas" mentiria
   * sobre o que foi feito. O que se contou foram países cujo idioma oficial ele
   * soube.
   */
  unidade: { singular: 'país', plural: 'países' },
  comoJogar: [
    'Aparece "Suriname" e você escreve "neerlandês". São os 195 países soberanos.',
    'Onde há mais de um oficial, qualquer um vale: para o Canadá, "inglês" e "francês" pontuam igual.',
    'O gabarito mostra todos — é lá que você descobre que a Suíça tem quatro e a África do Sul, doze.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(PAISES.filter((p) => p.soberano)).map(cartaIdioma),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
