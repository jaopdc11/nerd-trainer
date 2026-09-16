import { MAIORES_POR_AREA, TOTAL_MAIORES, exibirArea } from '@/data/maiores-paises'
import type { PaisPorArea } from '@/data/maiores-paises'
import { PAISES } from '@/data/paises'
import type { Pais } from '@/data/paises'
import type { EspecResposta } from '@/core/answer'
import type { JogoSequencia } from '@/core/types'

/**
 * Os vinte maiores países em área, recitados do maior para o menor.
 *
 * É o primeiro jogo de sequência cuja resposta não é número, e isso não é
 * detalhe de implementação: a mecânica de morte súbita sempre foi sobre recitar
 * uma ordem que você sabe de cor, e uma ordem de ranking é tão recitável quanto
 * as casas de π. O que faltava era a engine aceitar texto — hoje aceita, por
 * `ConfigSequencia.respostaEm`.
 *
 * **Por que sequência e não grade.** A alternativa óbvia era o tabuleiro de
 * ordem livre, como o mapa de países: vinte caixas para preencher em qualquer
 * ordem. Foi descartada porque jogaria fora exatamente o conteúdo — em ordem
 * livre, saber *quais* são os vinte vale ponto igual a saber *em que ordem*
 * eles vêm, e a ordem é a coisa difícil aqui. Quase todo mundo sabe que o Brasil
 * está entre os cinco; quase ninguém sabe que ele é o quinto, atrás da
 * Austrália.
 *
 * **As respostas vêm de `paises.ts`, não daqui.** O dataset local só guarda id e
 * área; nome e sinônimos são lidos do dataset de países na montagem do jogo.
 * Repetir "Estados Unidos" aqui criaria uma segunda fonte de verdade para o
 * mesmo país, e as duas divergiriam na primeira correção de grafia. De brinde,
 * o jogador ganha de graça os sinônimos que o outro dataset já tinha: "EUA",
 * "Holanda", "RDC" — morrer no item 11 porque "República Democrática do Congo"
 * é comprido demais para digitar seria medir datilografia, não geografia.
 */

const POR_ID = new Map(PAISES.map((p) => [p.id, p]))

/**
 * Nome e sinônimos de um país, ou erro na carga do módulo.
 *
 * Falhar barulhento e cedo, como o registry faz com id duplicado: um id que não
 * existe em `paises.ts` viraria um item da sequência sem resposta possível, e a
 * partida morreria ali para sempre sem ninguém entender por quê. O teste de
 * referência cruzada cobre o mesmo caso antes, mas a guarda fica porque quem
 * edita o dataset nem sempre roda o teste.
 */
function pais(id: string): Pais {
  const p = POR_ID.get(id)
  if (!p) throw new Error(`maiores-paises: o id "${id}" não existe em paises.ts`)
  return p
}

const formas = (id: string): readonly string[] => {
  const p = pais(id)
  return [p.nome, ...p.sinonimos]
}

/** Os nomes canônicos, na ordem do dataset. É o que a fita mostra. */
const ITENS: readonly string[] = MAIORES_POR_AREA.map((p) => pais(p.id).nome)

/**
 * Uma espec por posição, montada numa função só para não existirem duas
 * descrições da mesma resposta — a que o jogo julga e a que o teste confere.
 *
 * `trocaCom` entra como forma aceita: nas casas 3 e 4, China e Estados Unidos
 * valem nas duas ordens, porque qual vem primeiro depende da convenção de medida
 * e não do fato (ver o cabeçalho de `maiores-paises.ts`). Isso tem um vazamento
 * conhecido: quem responder "China" duas vezes passa nas duas casas, já que a
 * mecânica não guarda o que já foi digitado. O vazamento é preferível ao
 * contrário — matar a partida de quem aprendeu a outra convenção, que é a
 * publicada pelo próprio Factbook na linha dos EUA.
 *
 * `tolerarTypo: false` porque nesta mecânica **não existe "quase"**: a engine só
 * segue com veredito 'certo', então um typo perdoado devolveria 'quase' e mataria
 * a partida do mesmo jeito. Ligada, a tolerância só gastaria distância de edição
 * para chegar ao mesmo lugar — e, sem a trava de vizinhança (a sequência não
 * passa `vizinhanca` ao validador), gastaria correndo o risco de perdoar na
 * direção de outro país da lista.
 */
const RESPOSTAS: readonly EspecResposta[] = MAIORES_POR_AREA.map(
  (p: PaisPorArea): EspecResposta => ({
    tipo: 'texto',
    canonica: pais(p.id).nome,
    aceitas: [...formas(p.id), ...(p.trocaCom ? formas(p.trocaCom) : [])],
    opcoes: { tolerarTypo: false },
  }),
)

/** Exposto para o teste conferir as especs sem reconstruí-las. */
export const RESPOSTAS_MAIORES_PAISES = RESPOSTAS

/**
 * "5º Brasil — 8.515.767 km²".
 *
 * Exposto para o teste conferir que a junção com `paises.ts` continua alinhada:
 * é aqui que posição, nome e área se encontram num lugar só.
 */
export const linhaDoGabarito = (posicao: number): string => {
  const p = MAIORES_POR_AREA[posicao] as PaisPorArea
  return `${posicao + 1}º ${pais(p.id).nome} — ${exibirArea(p.areaKm2)}`
}

export const maioresPaises: JogoSequencia = {
  id: 'maiores-paises',
  mecanica: 'sequencia',
  nome: 'Maiores países',
  icone: '🗺',
  resumo: 'Os vinte maiores em área, do maior para o menor. O Brasil é o quinto.',
  categoria: 'geografia',
  unidade: { singular: 'país', plural: 'países' },
  comoJogar: [
    'Digite os vinte maiores países em área, do maior para o menor, e tecle Enter em cada um.',
    'Rússia, Canadá, China… e o Brasil em quinto, atrás da Austrália.',
    'Sinônimo vale: "EUA", "RDC", "Holanda". Acento e maiúscula não importam.',
    'Um erro encerra a partida — e o gabarito mostra quem vinha em seguida.',
  ],
  config: () => ({
    itens: ITENS,
    total: TOTAL_MAIORES,
    // 'termo' e não 'caractere': nome de país só pode ser julgado depois do
    // Enter. "China" é prefixo de nada aqui, mas "Congo" é de "Congo-Kinshasa",
    // e julgar na tecla aceitaria cedo demais.
    entrada: 'termo',
    teclado: 'texto',
    respostaEm: (i) => RESPOSTAS[i] as EspecResposta,
    separador: ', ',
    // Cinco por bloco: a fita fica em quatro linhas de nomes longos, e o jogador
    // enxerga em que dezena está sem contar item por item.
    agrupar: 5,
    revisaoPosMorte: 4,
  }),
}
