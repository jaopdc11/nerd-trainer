import {
  CASOS,
  descreverCaso,
  distratoresDe,
  escopoDe,
  fichaDe,
} from '@/data/relacoes-ecologicas'
import type { Caso, Escopo, Relacao } from '@/data/relacoes-ecologicas'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Caso concreto → relação ecológica, em quatro alternativas.
 *
 * **Por que o caso é a pergunta, e não a definição.** A carta fácil de escrever
 * seria "relação em que os dois ganham e nenhum vive sem o outro" → mutualismo,
 * e ela não mede nada: a definição já contém a resposta, e quem decorou a
 * definição responde sem nunca ter olhado para um cupim. O caso concreto obriga
 * a fazer o caminho inteiro — quem ganha, quem perde, dá para viver sozinho — que
 * é o único caminho que a prova cobra e a vida usa. É a mesma recusa que
 * `escolas-literarias.ts` faz a "característica → escola".
 *
 * **Por que escolha e não digitação.** As onze relações estão impressas na
 * contracapa de qualquer apostila: digitar "protocooperação" prova que se sabe
 * escrever a palavra, não que se sabe classificar. O que separa quem sabe de quem
 * não sabe é **decidir entre duas relações vizinhas**, e isso só existe com as
 * duas na tela. Mesma régua das escolas literárias.
 *
 * **Os distratores são só as relações que se confundem de verdade**, e vêm do
 * dataset, não daqui — saber que inquilinismo encosta em epifitismo e não em
 * predatismo é biologia, e biologia mora onde quem mexe em biologia a vê. Ver
 * `confundeCom` em `data/relacoes-ecologicas.ts`. Oferecer "amensalismo" para o
 * carrapato no boi não mede nada, porque ninguém erra assim.
 *
 * ## Os dois eixos, que são o conteúdo
 *
 * Harmônica × desarmônica e intra × interespecífica organizam a matéria inteira,
 * e cada um entra na carta por uma porta diferente — de propósito.
 *
 * **A harmonia não vira pergunta porque ela não é informação independente:** é
 * função da relação. Quem respondeu "parasitismo" já respondeu "desarmônica", e
 * uma segunda carta perguntando isso seria a mesma pergunta cobrando ponto duas
 * vezes. Ela aparece no gabarito de toda carta, onde ensina sem medir duas vezes
 * o mesmo — e às vezes ela *é* medida de graça, porque boa parte dos conjuntos de
 * alternativas atravessa a fronteira (comensalismo × amensalismo, parasitismo ×
 * comensalismo).
 *
 * **O escopo vira pergunta exatamente onde é informação independente:** nas duas
 * relações que existem nos dois escopos. Aí a carta deixa de ser "qual das onze" e
 * passa a ser o cruzamento dos eixos — as duas relações de escopo duplo, cada uma
 * nos dois escopos, quatro alternativas. "Predatismo (dentro da espécie)" é o que
 * a maioria dos livros chama de canibalismo, e a carta do louva-a-deus existe
 * para dizer que a única coisa que muda em relação à onça e à capivara é essa
 * palavra entre parênteses.
 *
 * O cruzamento tem de ser completo: as duas relações nos dois escopos, sempre. A
 * montagem óbvia — a certa, o espelho dela no outro escopo, e mais duas
 * confusões quaisquer — vaza a resposta de graça, porque a única relação listada
 * duas vezes seria a certa. Um jogador que percebesse isso acertaria as oito
 * cartas sem ler o enunciado.
 */

const ESCOPO_NA_TELA: Readonly<Record<Escopo, string>> = {
  'intraespecífica': 'dentro da espécie',
  'interespecífica': 'entre espécies',
}

/** O outro escopo. Existe porque `Escopo` tem dois valores e sempre terá. */
const oposto = (e: Escopo): Escopo =>
  e === 'intraespecífica' ? 'interespecífica' : 'intraespecífica'

/** 'Predatismo' ou 'Predatismo (dentro da espécie)'. */
const rotular = (relacao: Relacao, escopo?: Escopo): string =>
  escopo === undefined ? relacao : `${relacao} (${ESCOPO_NA_TELA[escopo]})`

interface Opcao {
  readonly relacao: Relacao
  /** Ausente nas cartas em que o escopo não é decisão do caso. */
  readonly escopo?: Escopo
}

/**
 * As quatro opções, com a certa na primeira posição — quem embaralha é o chamador.
 *
 * Os dois ramos são desenhos diferentes, não um caso especial do outro: no de
 * cima a pergunta é "qual das onze", no de baixo é "qual dos dois eixos". Ver o
 * cabeçalho.
 */
function opcoes(caso: Caso): readonly Opcao[] {
  const escopos = fichaDe(caso.relacao).escopos
  const escopo = escopoDe(caso)
  const confusoes = distratoresDe(caso)

  if (escopos.length === 1) {
    if (confusoes.length < 3) {
      // Carta de duas ou três alternativas continua jogável, pontua e não parece
      // defeito na tela — ninguém descobre isso jogando. Quebrar aqui põe o
      // estrago no teste, que é onde ele custa barato.
      throw new Error(`${caso.id}: ${caso.relacao} tem menos de três confusões cadastradas`)
    }
    return [{ relacao: caso.relacao }, ...confusoes.slice(0, 3).map((relacao) => ({ relacao }))]
  }

  // A parceira do cruzamento sai da lista de confusões, e não de um par escrito à
  // mão aqui: se um dia uma terceira relação passar a existir nos dois escopos, a
  // escolha continua sendo a confusão que o dataset declara — e não a primeira que
  // eu tiver lembrado de codificar.
  const parceira = confusoes.find((r) => fichaDe(r).escopos.length > 1)
  if (parceira === undefined) {
    throw new Error(
      `${caso.id}: ${caso.relacao} existe nos dois escopos e não se confunde com nenhuma outra que também exista — a carta do eixo não fecha`,
    )
  }

  return [
    { relacao: caso.relacao, escopo },
    { relacao: caso.relacao, escopo: oposto(escopo) },
    { relacao: parceira, escopo },
    { relacao: parceira, escopo: oposto(escopo) },
  ]
}

function cartaCaso(caso: Caso, rng: Rng): Carta {
  const [certa, ...erradas] = opcoes(caso)
  if (certa === undefined) throw new Error(`${caso.id}: sem alternativa correta`)

  const sorteadas = rng.shuffle([certa, ...erradas])
  const certo = rotular(certa.relacao, certa.escopo)

  return {
    tipo: 'escolha',
    id: `rel-${caso.id}`,
    pergunta: { kind: 'texto', valor: caso.enunciado },
    alternativas: sorteadas.map((o) => ({
      kind: 'texto' as const,
      valor: rotular(o.relacao, o.escopo),
    })),
    indiceCorreto: sorteadas.findIndex((o) => rotular(o.relacao, o.escopo) === certo),
    // O gabarito é o quadrante inteiro, e não o nome que a pessoa acabou de
    // errar: repetir "comensalismo" não ensina nada a quem marcou inquilinismo.
    // O que faltava era o par de eixos e a marca da relação.
    gabarito: descreverCaso(caso),
    // A classificação disputada vai para a tela **acertada ou errada**, que é o
    // que a `explicacao` faz: esconder a disputa do jogador seria ensinar uma
    // certeza que a literatura escolar não tem.
    ...(caso.disputa ? { explicacao: caso.disputa } : {}),
  }
}

export const relacoesEcologicas: JogoFlashcard = {
  id: 'relacoes-ecologicas',
  mecanica: 'flashcard',
  nome: 'Relações ecológicas',
  icone: '🐠',
  resumo: 'Do cupim ao carrapato: aparece o caso, você diz que relação é.',
  categoria: 'biologicas',
  unidade: { singular: 'caso', plural: 'casos' },
  comoJogar: [
    'Aparece o caso — a anêmona e o peixe-palhaço, o carrapato no boi — e você escolhe a relação entre quatro.',
    'As erradas são só as que se confundem de verdade: mutualismo ao lado de protocooperação, comensalismo ao lado de inquilinismo, inquilinismo ao lado de epifitismo.',
    'Onde a relação existe dentro e entre espécies, as opções trazem o escopo entre parênteses: aí a pergunta é o eixo, e não o nome.',
    'O gabarito dá o quadrante — harmônica ou desarmônica, intra ou interespecífica —, e nos casos que a literatura escolar disputa diz por que o gabarito é este.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(CASOS).map((c) => cartaCaso(c, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
