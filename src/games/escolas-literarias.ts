import { AUTORES, ESCOLAS, INDICE_DA_ESCOLA, exibirPeriodo, infoDaEscola } from '@/data/escolas-literarias'
import type { AutorLiterario, Escola } from '@/data/escolas-literarias'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Autor → escola literária, em quatro alternativas.
 *
 * **Por que a pergunta é o autor.** As três opções eram autor, obra e
 * característica, e as duas descartadas caem por motivos diferentes.
 *
 * *Obra → escola* seria o mesmo enunciado do baralho de obras com outra resposta:
 * "Vidas Secas" já está na tela de lá perguntando o autor, e quem responde
 * "Graciliano" responde "segunda fase" no mesmo fôlego — o card viraria a mesma
 * pergunta com outra roupa, que é exatamente o que a convivência com `obras.ts`
 * existe para evitar. Do jeito que está, os dois se encaixam em vez de se
 * repetirem: obra → autor lá, autor → escola aqui, e quem joga os dois percorre a
 * cadeia inteira sem responder nada duas vezes.
 *
 * *Característica → escola* é a mais tentadora e a mais frágil. Subjetivismo é
 * romântico e é simbolista; crítica social é naturalista, é de 30 e é
 * contemporânea. Para a carta ter uma resposta só, a característica teria de ser
 * escrita por mim com o cuidado de não caber em duas escolas — ou seja, o
 * gabarito seria a minha redação, e não um fato que alguém possa conferir. Num
 * dataset cuja regra é "gabarito conferido à mão", isso é o pior tipo de item:
 * parece checável e não é.
 *
 * Sobra o autor, que é fato de história literária e é o que a prova cobra. E onde
 * o autor não basta — Machado, romântico em 1876 e realista em 1881 — a obra
 * entra entre parênteses e decide. Nesses casos a carta ainda diz, no aviso, por
 * que os parênteses estão ali.
 *
 * **Por que escolha e não digitação.** Aqui a régua aponta para o lado oposto ao
 * do baralho de obras. Lá a resposta é um nome próprio que a pessoa tem de
 * recuperar da memória, e uma lista entregaria tudo. Aqui a resposta vem de um
 * conjunto fechado de doze nomes que estão impressos na contracapa de qualquer
 * apostila: digitar "Parnasianismo" não prova que alguém sabe mais do que marcar
 * "Parnasianismo" — prova que sabe escrever a palavra. O que separa quem sabe de
 * quem não sabe não é lembrar o nome da escola, é **decidir entre duas escolas
 * vizinhas**, e isso só existe com as duas na tela.
 *
 * **Os distratores são as três escolas mais próximas na linha do tempo**, e nunca
 * uma escola qualquer. Oferecer Barroco para Drummond não mede nada, porque
 * ninguém erra assim; oferecer Naturalismo para Machado mede a coisa inteira. A
 * lista sai mecanicamente da ordem de `ESCOLAS` — é por isso que ela mora aqui, e
 * não no dataset, seguindo o mesmo critério das formas irmãs da geometria
 * molecular: lá a irmandade sai da contagem de domínios e é detalhe de montagem;
 * no baralho de funções orgânicas, onde a irmandade é julgamento, ela é dado. A
 * vizinhança temporal é contagem, não julgamento.
 */

/**
 * As três escolas mais próximas desta, na linha do tempo.
 *
 * O embaralhamento vem **antes** da ordenação de propósito: `sort` é estável no
 * JavaScript desde a ES2019, então empates — e quase tudo aqui empata, já que a
 * escola anterior e a seguinte estão à mesma distância — saem na ordem sorteada.
 * Sem isso, um mesmo card ofereceria sempre o mesmo trio e o jogador decoraria a
 * posição em vez do conteúdo.
 */
function vizinhas(escola: Escola, rng: Rng): readonly Escola[] {
  const alvo = INDICE_DA_ESCOLA.get(escola)
  if (alvo === undefined) throw new Error(`escola fora da linha do tempo: ${escola}`)

  return rng
    .shuffle(ESCOLAS.map((e, i) => ({ nome: e.nome, distancia: Math.abs(i - alvo) })))
    .filter((c) => c.distancia > 0)
    .sort((a, b) => a.distancia - b.distancia)
    .slice(0, 3)
    .map((c) => c.nome)
}

function cartaEscola(a: AutorLiterario, rng: Rng): Carta {
  const info = infoDaEscola(a.escola)
  const opcoes = rng.shuffle([a.escola, ...vizinhas(a.escola, rng)])
  const quando = a.ano === undefined ? '' : `, ${a.ano}`

  return {
    tipo: 'escolha',
    id: `escola-${a.id}`,
    pergunta: {
      kind: 'texto',
      valor: a.precisaDaObra ? `${a.nome} (${a.obra})` : a.nome,
    },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(a.escola),
    // O gabarito traz o período e a marca da escola porque repetir o nome que a
    // pessoa acabou de errar não ensina nada: o que faltava era saber *quando* e
    // *por quê*. É o mesmo raciocínio do "-CHO na ponta da cadeia" das funções
    // orgânicas.
    gabarito: `${a.escola} (${exibirPeriodo(info)}) — ${a.obra}${quando}: ${info.marca}`,
    ...(a.precisaDaObra
      ? {
          aviso: `A escola é da obra, não da pessoa: ${a.nome} atravessou mais de uma, e é o que está entre parênteses que decide.`,
        }
      : {}),
  }
}

export const escolasLiterarias: JogoFlashcard = {
  id: 'escolas-literarias',
  mecanica: 'flashcard',
  nome: 'Escolas literárias',
  icone: '🖋',
  resumo: 'Do Barroco ao contemporâneo: aparece o autor, você diz a escola.',
  categoria: 'humanas',
  unidade: { singular: 'autor', plural: 'autores' },
  comoJogar: [
    'Escolha a escola do autor entre as quatro opções.',
    'As erradas são sempre as escolas vizinhas no tempo: Realismo aparece ao lado de Naturalismo, Parnasianismo ao lado de Simbolismo. É ali que a confusão mora.',
    'Quando o autor atravessou escolas, a obra vem entre parênteses e é ela que decide — Machado é romântico em Helena e realista em Brás Cubas.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(AUTORES).map((a) => cartaEscola(a, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
