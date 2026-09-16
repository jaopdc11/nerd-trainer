import { PRESIDENTES } from '@/data/presidentes'
import type { JogoSequencia } from '@/core/types'

/**
 * Presidentes do Brasil, em ordem, de 1889 até hoje.
 *
 * Mecânica A, a mesma de pi e dos primos, e pelo mesmo motivo: o conhecimento
 * aqui **é** a ordem. Perguntar "quem governou entre 1967 e 1969" com quatro
 * alternativas mede reconhecimento; recitar a fila de Deodoro até hoje sem
 * errar um degrau mede a única coisa que uma lista de presidentes tem para
 * ensinar, que é a costura entre um governo e o seguinte.
 *
 * Por que não flashcard "período → presidente": porque a sequência já contém
 * essa pergunta e mais uma. Quem sabe responder a carta isolada não
 * necessariamente sabe a ordem; quem sabe a ordem responde a carta isolada de
 * graça.
 *
 * **A lista inteira, desde a Proclamação.** O recorte anterior começava em
 * 1930 e foi derrubado pelo teste mais simples que existe: o dono do app
 * digitou "Deodoro da Fonseca" e levou errado. Um jogo pode ser duro, não pode
 * recusar a resposta certa — e "Presidentes do Brasil" que não aceita Deodoro
 * está contrariando o próprio nome. O que se perde com isso é real e está
 * medido: a dificuldade da lista está **toda** nos treze primeiros itens, então
 * a escada agora começa perto do teto. Não dá para consertar isso reordenando
 * (a ordem é o jogo), então o conserto está distribuído em três parâmetros:
 *
 * 1. **A meta do Nerdômetro é 17, metade da lista, e não os 34.** Dezessete é
 *    onde cai Café Filho — ou seja, é a República Velha inteira mais Vargas,
 *    Dutra, Vargas e o vice que assumiu depois do suicídio, que são as duas
 *    armadilhas do miolo. Quem chega ali atravessou a parte que ninguém sabe;
 *    a segunda metade (de JK em diante) é a que a escola e o noticiário já
 *    deram, e exigi-la não separaria ninguém de ninguém — só puniria de novo,
 *    no fim, quem já pagou no começo.
 * 2. **A revisão pós-morte subiu para cinco.** Com a lista começando em 1889, a
 *    morte típica acontece nos primeiros itens, e aí o que vem depois do fim é
 *    o único conteúdo real da partida: é ali que se decora o próximo pedaço.
 * 3. **O bloco da fita também é cinco**, para que o pedaço decorado na revisão
 *    seja exatamente uma linha do que ele vai ver na tentativa seguinte. Não há
 *    divisão histórica que caiba nisso — treze não se divide em blocos
 *    redondos —, então o critério é esse, e não uma falsa marcação de época.
 *
 * O recorte de **quem entra** (titulares sim, juntas e interinos de poucos dias
 * não) está justificado em `@/data/presidentes`. O que importa aqui é que a
 * regra apareça no `comoJogar`: um jogador que digita "Nereu Ramos" no lugar
 * certo e morre por isso perdeu para o regulamento, não para a história, e esse
 * é o pior jeito de perder.
 *
 * **Contrato com a engine.** Os itens são texto, e `useSequence` hoje deriva a
 * especificação da resposta só de `entrada`: 'caractere' vira `digito` e
 * 'termo' vira `inteiroGrande`. Enquanto não houver um ramo de texto lá —
 * `{ tipo: 'texto', canonica, aceitas }`, que é o mesmo validador que o resto
 * do app já usa —, este jogo e o de períodos não têm como aceitar resposta. É
 * mudança de uma linha na engine, e é dela que os dois dependem; o dataset já
 * carrega as formas aceitas para que o ramo nasça pronto.
 */

const ITENS: readonly string[] = PRESIDENTES.map((p) => p.nome)

/** Cinco. Ver as decisões 2 e 3 do comentário acima: os dois são o mesmo número. */
const BLOCO = 5

export const presidentes: JogoSequencia = {
  id: 'presidentes',
  mecanica: 'sequencia',
  nome: 'Presidentes do Brasil',
  icone: '🎖',
  resumo: 'De Deodoro até hoje, um a um e na ordem. Errou, acabou.',
  categoria: 'humanas',
  unidade: { singular: 'presidente', plural: 'presidentes' },
  comoJogar: [
    'Digite os presidentes em ordem, de Deodoro da Fonseca (1889) até hoje, confirmando cada um com Enter.',
    'O sobrenome basta: Floriano, Campos Sales, Dutra, JK, Jango, FHC, Lula. Acento e maiúscula não importam.',
    'Quem assumiu por sucessão conta: Floriano, Nilo Peçanha, Delfim Moreira, Café Filho, Sarney, Itamar e Temer estão na lista.',
    'Ficam de fora as juntas governativas (1930 e 1969) e quem substituiu por poucos dias: nada de José Linhares, Carlos Luz, Nereu Ramos ou Mazzilli. Vargas e Lula aparecem duas vezes — cada passagem pelo cargo é um item.',
  ],
  config: () => ({
    itens: ITENS,
    total: ITENS.length,
    // O ramo de texto que o dataset já esperava. `respostaEm` entrou em
    // `ConfigSequencia` justamente para isto: sem ele a engine manda "Deodoro da
    // Fonseca" para o limpador de inteiro e a partida morre no primeiro item —
    // foi o que o dono do app encontrou testando. É daqui que saem "JK",
    // "Jango" e "FHC", que o `comoJogar` promete.
    respostaEm: (i) => {
      const p = PRESIDENTES[i]
      return { tipo: 'texto', canonica: p?.nome ?? '', aceitas: p?.aceitas ?? [] }
    },
    // 'termo' e não 'caractere': nome é palavra, e julgar tecla a tecla
    // aceitaria "Lu" por Lula e mataria quem hesita no meio de "Kubitschek".
    entrada: 'termo',
    teclado: 'texto',
    separador: ' → ',
    agrupar: BLOCO,
    revisaoPosMorte: BLOCO,
  }),
}
