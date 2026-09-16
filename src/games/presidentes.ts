import { PRESIDENTES } from '@/data/presidentes'
import type { JogoSequencia } from '@/core/types'

/**
 * Presidentes do Brasil, em ordem.
 *
 * Mecânica A, a mesma de pi e dos primos, e pelo mesmo motivo: o conhecimento
 * aqui **é** a ordem. Perguntar "quem governou entre 1967 e 1969" com quatro
 * alternativas mede reconhecimento; recitar a fila de Vargas até hoje sem
 * errar um degrau mede a única coisa que uma lista de presidentes tem para
 * ensinar, que é a costura entre um governo e o seguinte.
 *
 * Por que não flashcard "período → presidente": porque a sequência já contém
 * essa pergunta e mais uma. Quem sabe responder a carta isolada não
 * necessariamente sabe a ordem; quem sabe a ordem responde a carta isolada de
 * graça.
 *
 * O recorte — de 1930 até hoje, só titulares — está justificado em
 * `@/data/presidentes`, com as três razões para não começar em 1889. O que
 * importa aqui é que a regra do recorte apareça no `comoJogar`: um jogador que
 * digita "Nereu Ramos" no lugar certo e morre por isso perdeu para o
 * regulamento, não para a história, e esse é o pior jeito de perder.
 *
 * **Contrato com a engine.** Os itens são texto, e a mecânica A nasceu julgando
 * só número — 'caractere' virava `digito`, 'termo' virava `inteiroGrande`, e
 * "Sarney" morria no limpador de inteiro. O ponto de extensão `respostaEm` foi
 * aberto em `ConfigSequencia` para este caso, e é ele que carrega as formas
 * aceitas do dataset: sem isso o `comoJogar` prometeria "JK" e "FHC" e a engine
 * recusaria os dois.
 */

const ITENS: readonly string[] = PRESIDENTES.map((p) => p.nome)

export const presidentes: JogoSequencia = {
  id: 'presidentes',
  mecanica: 'sequencia',
  nome: 'Presidentes do Brasil',
  icone: '🎖',
  resumo: 'De Getúlio até hoje, um a um e na ordem. Errou, acabou.',
  categoria: 'humanas',
  unidade: { singular: 'presidente', plural: 'presidentes' },
  comoJogar: [
    'Digite os presidentes em ordem, de Getúlio Vargas (1930) até hoje, confirmando cada um com Enter.',
    'O sobrenome basta: Dutra, JK, Jango, FHC, Lula. Acento e maiúscula não importam.',
    'Quem assumiu por sucessão conta: Café Filho, Sarney, Itamar e Temer estão na lista.',
    'Juntas governativas e interinos de poucos dias ficam de fora — nada de Carlos Luz, Nereu Ramos ou Mazzilli. Vargas e Lula aparecem duas vezes: cada passagem pelo cargo é um item.',
  ],
  config: () => ({
    itens: ITENS,
    total: ITENS.length,
    // O ramo de texto que o dataset já esperava: `respostaEm` entrou em
    // `ConfigSequencia` justamente para isto, e é ele que faz "JK", "Jango" e
    // "FHC" valerem. Sem ele a engine mandaria "Sarney" para o limpador de
    // inteiro e a partida morria no primeiro item.
    respostaEm: (i) => {
      const p = PRESIDENTES[i]
      return { tipo: 'texto', canonica: p?.nome ?? '', aceitas: p?.aceitas ?? [] }
    },
    // 'termo' e não 'caractere': nome é palavra, e julgar tecla a tecla
    // aceitaria "Lu" por Lula e mataria quem hesita no meio de "Kubitschek".
    entrada: 'termo',
    teclado: 'texto',
    separador: ' → ',
    // Cinco por linha é o tamanho de um bloco que a gente decora junto: Vargas,
    // Dutra, Vargas, Café Filho, JK é exatamente a República de 46 inteira.
    agrupar: 5,
    // Quatro, e não os dez de pi: aqui cada item é um nome, e a revisão
    // pós-morte é para memorizar o próximo pedaço, não para ler uma lista.
    revisaoPosMorte: 4,
  }),
}
