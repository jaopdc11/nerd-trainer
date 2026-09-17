import {
  CODONS,
  CODON_INICIO,
  codonsDe,
  distratores,
  rotulo,
  traduzir,
} from '@/data/codigo-genetico'
import type { Aminoacido } from '@/data/codigo-genetico'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Códon → aminoácido. Os 64, em morte súbita.
 *
 * **De escolha, e não digitado.** A régua do projeto manda digitar quando o que
 * se cobra é *lembrar* de um nome — é o que separa os símbolos dos elementos
 * (digitado: "de quem é esse símbolo") das famílias da tabela (escolha:
 * "classifique este elemento"). À primeira vista este jogo é do primeiro tipo:
 * UUU → fenilalanina é um fato de tabela, não uma classificação. Foi assim que
 * ele começou, e duas coisas o tiraram de lá.
 *
 * A primeira é que **três das cartas não têm gabarito digitável**. UAA, UAG e
 * UGA não codificam nada, e não existe forma canônica de escrever "nada": é
 * "parada", "stop", "códon de parada", "terminação", "fim", "nenhum", e cada
 * sinônimo que eu esquecesse de listar seria um ponto roubado de quem sabia. É o
 * argumento do latim — não é que digitar dê trabalho, é que não há resposta
 * digitável —, e aqui ele cai justamente sobre as três cartas mais importantes
 * do baralho. Um jogo em que as três perguntas decisivas são as três com
 * validação frouxa não é um jogo, é uma loteria com tema de biologia.
 *
 * A segunda é que a pergunta de verdade deste baralho não é "qual aminoácido",
 * é **onde a degenerescência para**. Oito dos dezesseis blocos são iguais nos
 * quatro códons, então metade do código é ler o bloco; o que separa quem sabe de
 * quem decorou é UGG contra UGA (triptofano contra parada, um nucleotídeo de
 * distância) e AUA contra AUG (isoleucina contra metionina, idem). Essa pergunta
 * só existe com os vizinhos na tela. Num campo de texto vazio, UGG pergunta
 * "você decorou?"; com UGA ao lado, pergunta "você sabe onde o bloco muda?".
 *
 * É por isso que as três alternativas erradas saem de `distratores()`, no
 * dataset, e nunca de um sorteio entre os 20 aminoácidos: elas são sempre os
 * vizinhos de um nucleotídeo, com a terceira posição — a oscilante — primeiro.
 * "Prolina" como opção para UGG se elimina sozinha e transforma quatro
 * alternativas em três.
 *
 * O preço honesto de escolher em vez de digitar é o chute de 25% por carta. Quem
 * paga esse preço é a morte súbita, logo abaixo: chute cego morre em quatro
 * cartas, e é para isso que ela serve aqui.
 */

function cartaCodon(codon: string, rng: Rng): Carta {
  const certo = traduzir(codon)

  // Os três primeiros já são os mais tentadores — o dataset entrega a lista em
  // ordem de plausibilidade e o teste dele trava que os vizinhos bastam para
  // três. Embaralhar antes de cortar trocaria essa ordem por nada.
  const opcoes = rng.shuffle([certo, ...distratores(codon).slice(0, 3)])

  return {
    tipo: 'escolha',
    id: `codon-${codon}`,
    pergunta: { kind: 'texto', valor: codon },
    alternativas: opcoes.map((t) => ({ kind: 'texto' as const, valor: rotulo(t) })),
    indiceCorreto: opcoes.indexOf(certo),
    gabarito: comOsIrmaos(certo),
    // O AUG é a única carta do baralho cuja resposta certa esconde uma segunda
    // função, e por isso é a única que explica algo. Pôr explicação em cada
    // armadilha encheria a tela e nenhuma seria lida — o resto do ensino cabe
    // no gabarito, que aparece quando erra.
    ...(codon === CODON_INICIO
      ? { explicacao: 'AUG é também o códon de início: toda tradução começa por ele.' }
      : {}),
  }
}

/**
 * O gabarito diz quantos códons a resposta tem e quais são — não só qual é ela.
 *
 * Acertar UUA e ver "leucina" não ensina nada que já não estivesse na tela.
 * Ver "leucina — 6 códons: UUA, UUG, CUU, CUC, CUA, CUG" ensina o bloco inteiro
 * de uma vez, e é o que faz uma partida de 64 cartas caber em dezesseis fatos.
 * A lista vem de `codonsDe()`, derivada da tabela: escrevê-la à mão aqui seria
 * criar uma segunda verdade sobre a redundância, que é justamente o fato que
 * este jogo existe para ensinar.
 */
function comOsIrmaos(t: Aminoacido | null): string {
  const irmaos = codonsDe(t)
  const nome = rotulo(t)
  if (irmaos.length === 1) {
    return `${nome} — códon único: ${irmaos[0]}, e não há outro no código`
  }
  return `${nome} — ${irmaos.length} códons: ${irmaos.join(', ')}`
}

export const codigoGenetico: JogoFlashcard = {
  id: 'codigo-genetico',
  mecanica: 'flashcard',
  nome: 'Código genético',
  icone: 'AUG',
  resumo: 'Aparece o códon, você diz o aminoácido. Um erro e a partida acaba.',
  categoria: 'biologicas',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Aparece "UGA" e você marca parada — não triptofano, que é UGG.',
    'As opções erradas são sempre códons a um nucleotídeo de distância, começando pela terceira posição: não dá para eliminar no olho.',
    'Morte súbita: um erro e a partida acaba. O placar é a sequência.',
    'O gabarito mostra todos os irmãos do aminoácido — seis códons dão leucina, e só um dá triptofano.',
  ],
  /**
   * Morte súbita, como as famílias da tabela, e pelo mesmo motivo levado mais a
   * sério.
   *
   * Lá o argumento era que 118 cliques cansam e que, a partir do trigésimo, eles
   * já não perguntam nada de novo. Aqui o baralho é menor — 64 — e ainda assim o
   * argumento é *mais* forte, porque a repetição não é estatística, é estrutural:
   * oito dos dezesseis blocos são degenerados nos quatro códons, então **32 das
   * 64 cartas são oito fatos**. Quem sabe que GC dá alanina acerta GCU, GCC, GCA
   * e GCG com o mesmo conhecimento e mais três cliques que não medem nada. Levar
   * o baralho até o fim seria pedir 64 respostas para perguntar 16 coisas.
   *
   * Com morte súbita o placar vira "até onde você vai sem tropeçar", e o sorteio
   * mistura os 64 o tempo todo — chegar aos 30 exige ter passado por UGA, por
   * AUA e pelas três paradas sem cair em nenhuma. É também o que paga o chute de
   * 25% da múltipla escolha: quem chuta morre na quarta carta, em média.
   *
   * O custo honesto é o mesmo das famílias: a ordem das cartas influi e uma
   * partida pode morrer na segunda. Recomeçar custa um clique, e é esse preço
   * baixo que torna o custo aceitável — o que não seria verdade se cada partida
   * durasse 64.
   */
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(CODONS).map((c) => cartaCodon(c, rng)),
    fim: 'morte-subita',
    teclado: 'texto',
  }),
}
