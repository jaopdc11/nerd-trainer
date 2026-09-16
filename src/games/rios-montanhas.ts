import { exibirKm, exibirMetros, OITOMIL, RIOS } from '@/data/rios-montanhas'
import type { Pico, Rio } from '@/data/rios-montanhas'
import type { EspecResposta } from '@/core/answer'
import type { JogoSequencia } from '@/core/types'

/**
 * Os dez maiores rios em extensão e, em seguida, os catorze picos acima de
 * 8.000 metros — tudo numa sequência só, nesta ordem.
 *
 * ## Um jogo com dois trechos, e não duas listas
 *
 * A alternativa era dois jogos, "Maiores rios" e "Os oitomil", cada um com seu
 * id, seu recorde e seu card no menu. Descartada por dois motivos.
 *
 * O primeiro é de tamanho: dez rios não é jogo. Numa mecânica sem relógio, em
 * que o placar é até onde você chegou, um teto de dez itens satura na terceira
 * partida de quem estudou — e um recorde que todo mundo empata não mede mais
 * nada. Vinte e quatro itens dão uma curva.
 *
 * O segundo é que os dois trechos são o **mesmo gesto**: recitar um ranking de
 * superlativo geográfico, do maior para o menor. Não é "duas matérias no mesmo
 * card", é uma matéria só com dois pedaços — e o corte entre eles é fixo,
 * anunciado no `comoJogar` e sempre no mesmo lugar (depois do décimo), então
 * ninguém fica em dúvida sobre o que o jogo espera na casa 11.
 *
 * Rios primeiro porque a lista é mais curta e mais próxima do repertório
 * escolar; começar pelos oitomil seria pedir Gasherbrum I antes do Nilo.
 *
 * O preço está declarado: em morte súbita, o segundo trecho só existe para quem
 * passa dos dez primeiros. É aceitável aqui — dez itens é uma porta baixa — e é
 * exatamente por não ser aceitável com vinte que `maiores-paises.ts` ficou com
 * um trecho só em vez de encaixar população atrás da área.
 *
 * ## A tolerância a typo fica desligada, e há medição para isso
 *
 * `data/rios-montanhas.test.ts` mede a distância de edição entre todas as formas
 * aceitas e encontra Gasherbrum I a **um caractere** de Gasherbrum II. Com a
 * tolerância ligada, digitar um pelo outro devolveria 'quase' — que nesta
 * mecânica mata do mesmo jeito, já que a engine só segue com 'certo' —, e sem a
 * trava de vizinhança (a sequência não passa `vizinhanca` ao validador) não há
 * nada segurando o perdão na direção errada. Aqui não existe "quase": ou é a
 * montanha, ou é a outra.
 */

/** Onde o trecho de rios termina e o de montanhas começa. */
export const TAMANHO_DO_TRECHO_DE_RIOS = RIOS.length

const POR_ID_RIO = new Map(RIOS.map((r) => [r.id, r]))

/**
 * Formas aceitas de um rio, ou erro na carga do módulo — a mesma guarda barulhenta
 * de `maiores-paises.ts`: um `trocaCom` apontando para um id que não existe viraria
 * uma casa sem resposta possível, e a partida morreria ali sem explicação.
 */
function formasDoRio(id: string): readonly string[] {
  const r = POR_ID_RIO.get(id)
  if (!r) throw new Error(`rios-montanhas: o rio "${id}" não existe no dataset`)
  return [r.nome, ...r.sinonimos]
}

/**
 * Uma espec por casa, montada numa função só: a resposta que o jogo julga e a
 * que o teste confere têm de ser literalmente a mesma coisa.
 *
 * Nas casas 1 e 2, `trocaCom` põe Nilo e Amazonas como aceitos nas duas, porque
 * qual vem primeiro depende de onde se marca a nascente e não do fato (ver o
 * cabeçalho de `data/rios-montanhas.ts`). O vazamento conhecido é o mesmo do par
 * China/EUA: quem responder "Nilo" duas vezes passa nas duas, já que a mecânica
 * não guarda o que foi digitado. Preferível a matar a partida de quem aprendeu
 * a medição do INPE na escola.
 */
const especDeRio = (r: Rio): EspecResposta => ({
  tipo: 'texto',
  canonica: r.nome,
  aceitas: [...formasDoRio(r.id), ...(r.trocaCom ? formasDoRio(r.trocaCom) : [])],
  opcoes: { tolerarTypo: false },
})

const especDePico = (p: Pico): EspecResposta => ({
  tipo: 'texto',
  canonica: p.nome,
  aceitas: [p.nome, ...p.sinonimos],
  opcoes: { tolerarTypo: false },
})

const ITENS: readonly string[] = [...RIOS.map((r) => r.nome), ...OITOMIL.map((p) => p.nome)]

const RESPOSTAS: readonly EspecResposta[] = [...RIOS.map(especDeRio), ...OITOMIL.map(especDePico)]

/** Exposto para o teste conferir as especs sem reconstruí-las. */
export const RESPOSTAS_RIOS_MONTANHAS = RESPOSTAS

/**
 * "1º Nilo — 6.650 km", "11º Everest — 8.849 m".
 *
 * Exposto para o teste: é o único lugar em que posição, nome e medida das duas
 * listas aparecem juntos, e é o que denuncia um trecho colado na ordem errada.
 */
export const linhaDoGabarito = (posicao: number): string => {
  const rio = RIOS[posicao]
  if (rio) return `${posicao + 1}º ${rio.nome} — ${exibirKm(rio.km)}`
  const pico = OITOMIL[posicao - TAMANHO_DO_TRECHO_DE_RIOS] as Pico
  return `${posicao + 1}º ${pico.nome} — ${exibirMetros(pico.metros)}`
}

export const riosMontanhas: JogoSequencia = {
  id: 'rios-montanhas',
  mecanica: 'sequencia',
  nome: 'Rios e montanhas',
  icone: '🏔',
  resumo: 'Os dez maiores rios em ordem e, depois, os catorze picos acima de 8.000 m.',
  categoria: 'geografia',
  unidade: { singular: 'acidente', plural: 'acidentes' },
  comoJogar: [
    'Primeiro os dez maiores rios em extensão, do maior para o menor, um por Enter.',
    'Depois de dez rios o jogo vira montanha: os catorze oitomil, do Everest para baixo.',
    'Nilo ou Amazonas em primeiro? As duas ordens valem — a nascente do Amazonas é disputada.',
    'Nome alternativo vale: "Rio Azul", "Huang He", "Chomolungma", "Hidden Peak".',
  ],
  config: () => ({
    itens: ITENS,
    total: ITENS.length,
    // 'termo', nunca 'caractere': "Ob" é prefixo de "Obi", e julgar na tecla
    // aceitaria cedo demais — o mesmo motivo que obriga os inteiros ao Enter.
    entrada: 'termo',
    teclado: 'texto',
    respostaEm: (i) => RESPOSTAS[i] as EspecResposta,
    separador: ', ',
    // Cinco por bloco, e não seis ou sete, porque dez é múltiplo de cinco: assim
    // a passagem de rio para montanha cai sempre numa fronteira de bloco da
    // fita, e a virada fica visível sem precisar de rótulo nenhum na engine.
    agrupar: 5,
    revisaoPosMorte: 4,
  }),
}
