import { INTERVALOS, TAMANHO_DOS_TRECHOS, exibirIntervalo } from '@/data/eras-geologicas'
import type { Intervalo } from '@/data/eras-geologicas'
import type { EspecResposta } from '@/core/answer'
import type { JogoSequencia } from '@/core/types'

/**
 * A escala de tempo geológico recitada de baixo para cima: os quatro éons, os
 * doze períodos do Fanerozoico e as duas épocas do Quaternário.
 *
 * ## Por que sequência
 *
 * Porque um período **é** a sua posição entre dois outros. Saber que existe uma
 * coisa chamada Siluriano sem saber que ela fica entre o Ordoviciano e o
 * Devoniano é saber uma palavra, não um período — o mesmo argumento que fez
 * `periodos-brasil.ts` virar sequência em vez de flashcard. Uma carta
 * "419–359 Ma → ?" testaria o número; a sequência testa a costura, que é o que
 * uma escala de tempo tem para ensinar.
 *
 * E o jogo **não pergunta número nenhum**. Os limites em Ma existem no dataset
 * para o gabarito e para o teste de continuidade; cobrá-los por Enter mediria
 * decoreba de decimal — quem digita "486,85" não sabe mais geologia do que quem
 * digita "Ordoviciano", só tem mais paciência.
 *
 * ## A granularidade, que é a decisão de verdade
 *
 * A escala é uma hierarquia, e uma lista plana precisa escolher um nível.
 * Nenhum dos três sobrevive sozinho: quatro éons não é jogo; só os períodos
 * apaga quatro bilhões de anos; só as épocas é uma lista que ninguém cobra.
 * A saída está em `data/eras-geologicas.ts` e é a da própria escala — **três
 * trechos, um por nível, cada trecho abrindo o último item do anterior**:
 * éons até o Fanerozoico, períodos do Fanerozoico até o Quaternário, épocas do
 * Quaternário até o Holoceno.
 *
 * A alternativa tentadora era fechar com as sete épocas do Cenozoico, os sete
 * "-cenos". Caiu porque faria o tempo andar para trás no meio da fita: depois de
 * "Quaternário" o jogador teria de voltar 66 milhões de anos até o Paleoceno. É
 * mais conteúdo e é pior jogo — erra-se pelo regulamento, não pela geologia.
 *
 * ## Como o jogador sabe o nível que está sendo pedido
 *
 * Esta é a parte que mais podia dar errado, porque "Paleozoico" é uma resposta
 * perfeitamente correta que o jogo recusa: era não é nível desta lista. Três
 * coisas seguram isso, e nenhuma delas está dentro da engine:
 *
 * 1. o `comoJogar` diz os três trechos na ordem, com o item que abre cada um;
 * 2. os cortes caem em fronteira de bloco da fita (`agrupar: 4` contra trechos
 *    de 4, 12 e 2), então a virada é visível sem rótulo novo;
 * 3. a revisão pós-morte mostra as próximas casas — quem parar no Fanerozoico vê
 *    "Cambriano" e entende a regra de uma vez.
 *
 * ## A tolerância a erro de digitação fica desligada
 *
 * Não por emergência: `data/eras-geologicas.test.ts` varre os pares e não acha
 * ninguém perto demais — "paleogeno" e "neogeno" diferem no tamanho o bastante
 * para o corte por comprimento resolver. Fica desligada por argumento, o mesmo
 * de `maiores-paises.ts`: nesta mecânica **não existe "quase"**, porque
 * `useSequence` só segue com veredito 'certo'. Ligada, a tolerância gastaria
 * distância de edição para chegar ao mesmo lugar — e, sem a trava de vizinhança
 * (a sequência não passa `vizinhanca` ao validador), gastaria correndo o risco
 * de perdoar na direção de outro intervalo assim que alguém acrescentar um
 * sinônimo.
 */

const ITENS: readonly string[] = INTERVALOS.map((i) => i.nome)

/**
 * Onde cada trecho começa, 0-based. Exposto porque é o que o teste usa para
 * conferir que os cortes caem em fronteira de bloco da fita — se o dataset
 * mudar de tamanho, é aqui que a conta do `agrupar` quebra.
 */
export const INICIO_DOS_TRECHOS = {
  eons: 0,
  periodos: TAMANHO_DOS_TRECHOS['éon'],
  epocas: TAMANHO_DOS_TRECHOS['éon'] + TAMANHO_DOS_TRECHOS['período'],
} as const

/**
 * Uma espec por casa, montada numa função só para não existirem duas descrições
 * da mesma resposta — a que o jogo julga e a que o teste confere.
 *
 * `respostaEm` é o que faz isto funcionar: sem ele `useSequence` deriva a espec
 * de `entrada` ('termo' → `inteiroGrande`), manda "Hadeano" para o limpador de
 * inteiro e a partida morre na primeira casa.
 */
const especDeIntervalo = (i: Intervalo): EspecResposta => ({
  tipo: 'texto',
  canonica: i.nome,
  aceitas: i.aceitas,
  opcoes: { tolerarTypo: false },
})

const RESPOSTAS: readonly EspecResposta[] = INTERVALOS.map(especDeIntervalo)

/** Exposto para o teste conferir as especs sem reconstruí-las. */
export const RESPOSTAS_ERAS_GEOLOGICAS = RESPOSTAS

/**
 * "10ª Permiano — período do Paleozoico · 298,9–251,902 Ma · a Pangeia montada…".
 *
 * Exposto para o teste: é o único lugar em que posição, nível, era e limites se
 * encontram, e é o que denuncia um intervalo colado no trecho errado.
 */
export const linhaDoGabarito = (posicao: number): string => {
  const i = INTERVALOS[posicao]
  if (!i) throw new Error(`eras-geologicas: não há casa ${posicao + 1}`)
  const onde = i.era === null ? i.nivel : `${i.nivel} do ${i.era}`
  return `${posicao + 1}ª ${i.nome} — ${onde} · ${exibirIntervalo(i)} · ${i.marco}`
}

export const erasGeologicas: JogoSequencia = {
  id: 'eras-geologicas',
  mecanica: 'sequencia',
  nome: 'Eras geológicas',
  icone: '🦕',
  resumo: 'Do Hadeano ao Holoceno: os quatro éons, os doze períodos e o zoom final do Quaternário.',
  categoria: 'biologicas',
  unidade: { singular: 'intervalo', plural: 'intervalos' },
  comoJogar: [
    'A escala vem do mais antigo para o mais recente, em três trechos, um por Enter.',
    'Primeiro os quatro éons: Hadeano, Arqueano, Proterozoico, Fanerozoico.',
    'Aberto o Fanerozoico, o jogo desce para os doze períodos dele, do Cambriano ao Quaternário — e não para as eras: "Paleozoico" não é resposta de casa nenhuma.',
    'Aberto o Quaternário, desce mais uma vez: Pleistoceno e Holoceno fecham a lista. Grafia de sala de aula vale — "Silúrico", "Pérmico", "Cretácico".',
  ],
  config: () => ({
    itens: ITENS,
    total: ITENS.length,
    // 'termo', nunca 'caractere': "Cambriano" é palavra, e julgar tecla a tecla
    // mataria quem hesita no meio de "Carbonífero". `respostaEm` é o ramo de
    // texto — ver a nota do topo.
    entrada: 'termo',
    teclado: 'texto',
    respostaEm: (i) => RESPOSTAS[i] as EspecResposta,
    separador: ' → ',
    // Quatro por bloco, e não cinco: os trechos têm 4, 12 e 2 itens, então com 4
    // as duas viradas de nível — na casa 5 e na casa 17 — caem sempre em
    // fronteira de bloco da fita, e o jogador enxerga o zoom sem que a engine
    // precise de um rótulo novo. É a mesma conta de `rios-montanhas.ts`.
    agrupar: 4,
    // Três: as próximas casas depois da morte são para decorar o pedaço
    // seguinte, e é a revisão que ensina a regra de granularidade a quem parou
    // no Fanerozoico sem entender por que "Paleozoico" não valeu.
    revisaoPosMorte: 3,
  }),
}
