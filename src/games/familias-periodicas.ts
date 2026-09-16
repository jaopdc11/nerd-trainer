import { ROTULO_FAMILIA, distratores, familiaDe } from '@/data/familias-periodicas'
import type { Familia } from '@/data/familias-periodicas'
import { ELEMENTOS } from '@/data/tabela-periodica'
import type { Elemento } from '@/data/tabela-periodica'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Elemento → família.
 *
 * De escolha, e não digitado, pela régua do projeto: o que se cobra aqui é
 * classificar, não lembrar de um nome. Digitar "alcalinoterrosos" com acento e
 * tudo mediria teclado, do mesmo jeito que digitar "36x⁵" mediria teclado no
 * jogo de derivadas. E há uma razão a mais, específica desta matéria: a resposta
 * certa e a errada quase sempre são vizinhas de coluna, então é vendo as quatro
 * lado a lado que a pergunta fica de pé — "grupo 15 ou 16?" é a dúvida real, e
 * ela não existe num campo de texto vazio.
 *
 * As três alternativas erradas saem de `VIZINHAS`, no dataset, e nunca de um
 * sorteio entre as doze famílias. Distrator absurdo se elimina sozinho: oferecer
 * "gases nobres" para o ferro transforma quatro opções em três e a carta deixa
 * de medir qualquer coisa.
 */
function cartaFamilia(e: Elemento, rng: Rng): Carta {
  const certa = familiaDe(e)

  // Os três primeiros da lista já são vizinhos — o dataset garante ao menos três
  // para cada família, e o teste dele trava isso. Embaralhar antes de cortar
  // seria trocar a ordem de plausibilidade por nada: a lista já vem do mais
  // tentador para o menos.
  const errados = distratores(certa).slice(0, 3)
  const opcoes = rng.shuffle([certa, ...errados])

  return {
    tipo: 'escolha',
    id: `familia-z${e.z}`,
    // O nome vai junto do símbolo porque a pergunta não é "que elemento é Sb":
    // isso é outro jogo, e fazer as duas de uma vez só faria a carta medir duas
    // coisas e não saber dizer qual das duas a pessoa errou.
    pergunta: { kind: 'texto', valor: `${e.simbolo} — ${e.nome}` },
    alternativas: opcoes.map((f) => ({ kind: 'texto' as const, valor: ROTULO_FAMILIA[f] })),
    indiceCorreto: opcoes.indexOf(certa),
    // Quem errou precisa ver de onde vem a resposta, não só qual é ela: a
    // família é a coluna, e dizer a coluna é ensinar a achar a próxima sozinho.
    gabarito: `${ROTULO_FAMILIA[certa]} — ${ondeFica(e, certa)}`,
  }
}

/** O endereço que justifica a família, na linguagem de quem olha a tabela. */
function ondeFica(e: Elemento, familia: Familia): string {
  if (familia === 'hidrogenio') {
    // O H mora no grupo 1 e não é alcalino: o gabarito tem de dizer as duas
    // coisas, senão parece erro de cadastro.
    return 'mora sobre o lítio, mas é um ametal gasoso e não entra na família'
  }
  if (e.bloco === 'f') return `bloco f, período ${e.periodo}`
  return `grupo ${e.grupo}, período ${e.periodo}`
}

export const familiasPeriodicas: JogoFlashcard = {
  id: 'familias-periodicas',
  mecanica: 'flashcard',
  nome: 'Famílias da tabela',
  // As colunas da tabela, que é do que o jogo trata. O '⚛' já é da grade.
  icone: '▥',
  resumo: 'Alcalino, calcogênio ou actinídeo? Um erro e a partida acaba.',
  categoria: 'quimica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Aparece "Sb — Antimônio" e você marca pnictogênios.',
    'As opções erradas são sempre famílias vizinhas na tabela: não dá para eliminar no olho.',
    'Morte súbita: um erro e a partida acaba. O placar é a sequência.',
    'O hidrogênio é caso à parte, e cai no baralho como qualquer outro.',
  ],
  /**
   * Morte súbita, e não baralho completo — a exceção entre os flashcards deste
   * projeto.
   *
   * O baralho tem 118 cartas e a resposta é um clique. Levá-lo até o fim seriam
   * 118 cliques por partida, e a partir do trigésimo eles já não perguntam nada
   * de novo: quem sabe que o grupo 15 é dos pnictogênios acertou Nitrogênio,
   * Fósforo, Arsênio, Antimônio, Bismuto e Moscóvio com o mesmo conhecimento.
   * Isso é cansaço, não desafio, e cansaço piora a medição — o erro que aparece
   * no card 90 é tédio, não ignorância.
   *
   * Com morte súbita o placar vira "até onde você vai sem tropeçar", e o sorteio
   * cobra as doze famílias misturadas o tempo todo. A partida dura o que a
   * pessoa souber, e uma sequência longa é informação de verdade: para chegar
   * aos 40 é preciso ter passado por lantanídeo, actinídeo e pelo hidrogênio
   * sem errar nenhum.
   *
   * O custo honesto: a ordem das cartas influi, e uma partida pode morrer no
   * segundo card. É o mesmo preço que o jogo de sequências paga, e ele se paga
   * porque recomeçar custa um clique — o que não seria verdade se cada partida
   * durasse 118.
   */
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(ELEMENTOS).map((e) => cartaFamilia(e, rng)),
    fim: 'morte-subita',
    teclado: 'texto',
  }),
}
