import { ESCADA } from '@/data/espectro'
import type { JogoSequencia } from '@/core/types'

/**
 * Descer o espectro eletromagnético dizendo cada fronteira em nanômetros.
 *
 * ---------------------------------------------------------------------------
 * POR QUE A SEQUÊNCIA É NUMÉRICA, E NÃO OS NOMES DAS FAIXAS
 * ---------------------------------------------------------------------------
 *
 * O desenho original era digitar "rádio, micro-ondas, infravermelho…". Ele não
 * existe, e o motivo é a engine, não o gosto: `useSequence` monta a
 * `EspecResposta` sozinho, a partir de um campo só —
 *
 *     config.entrada === 'caractere' ? { tipo: 'digito' } : { tipo: 'inteiroGrande' }
 *
 * — e nenhum dos dois julga texto. `inteiroGrande` passa a resposta por
 * `limparInteiro`, que devolve `null` para "rádio"; o jogo morreria no primeiro
 * termo, sempre. Não existe ponto de extensão em `ConfigSequencia` para trocar
 * isso, e mexer no núcleo não é decisão deste arquivo. Então o jogo se ajusta à
 * mecânica que existe, em vez de fingir que existe outra. (A mudança, se um dia
 * for feita, é pequena: um `resposta?: (i: number) => EspecResposta` opcional em
 * `ConfigSequencia`. Fica registrado aqui para quem for fazê-la.)
 *
 * ---------------------------------------------------------------------------
 * POR QUE ISSO ACABOU SENDO O JOGO MELHOR, E NÃO O CONSOLO
 * ---------------------------------------------------------------------------
 *
 * Sete termos era pouco, e havia duas saídas na mesa:
 *
 * 1. **Emendar as sete cores do visível como segundo trecho.** Catorze termos,
 *    mas catorze termos *fáceis*: a ordem rádio → gama e a ordem vermelho →
 *    violeta são as duas listas que qualquer um recita desde o sexto ano. Um
 *    jogo de morte súbita em que o recorde de todo mundo é 14 não mede nada; e
 *    o Nerd Trainer já tem uma mecânica para lista fechada e fácil, que é o
 *    flashcard — refazê-la em sequência seria duplicar o baralho por outro
 *    ângulo sem cobrar nada novo.
 * 2. **Pedir a ordem por comprimento de onda E o limite de cada faixa.** É esta.
 *    A ordem das faixas continua sendo cobrada — ela é a espinha da sequência,
 *    porque os números só descem se você souber em que faixa está —, mas o que
 *    se digita é a parte que ninguém sabe de cor. "O infravermelho vem antes do
 *    visível" é trivial; "o visível começa em 750 nm" não é.
 *
 * As sete cores entram assim mesmo, e sem ganhar um trecho separado: as
 * fronteiras delas são fronteiras do espectro como qualquer outra, e caem
 * naturalmente entre 750 e 380. A escada continua sendo uma descida só, do rádio
 * ao raio X, e é isso que a torna recitável — cada termo tem que ser menor que o
 * anterior, o que dá ao jogador uma conferência de sanidade a cada Enter. Um
 * segundo trecho com outra unidade teria acabado com essa propriedade.
 *
 * ---------------------------------------------------------------------------
 * DECISÕES MENORES
 * ---------------------------------------------------------------------------
 *
 * **`entrada: 'termo'`, nunca 'caractere'.** Pelo mesmo motivo dos inteiros: "1"
 * é prefixo de "10" e de "1000000", e julgar na tecla aceitaria cedo demais.
 *
 * **`teclado: 'numerico'`.** Todos os onze termos são inteiros positivos — não
 * há sinal nem vírgula para digitar, então o teclado reduzido do celular é
 * ganho puro. Foi também o que descartou guardar a escada em expoentes de dez:
 * "−7" precisa do menos, e `inputMode="numeric"` não o oferece no iOS.
 *
 * **`agrupar: 4` e `separador: ' · '`.** Quatro por bloco porque a escada tem
 * três partes de tamanhos próximos — as duas fronteiras gigantes, as sete cores,
 * a saída para o ultravioleta — e blocos de quatro deixam a fita legível sem
 * sugerir uma divisão que não existe. O ponto médio como separador, e não a
 * vírgula, porque a vírgula é decimal em pt-BR e ali do lado há um "1.000.000".
 */
export const espectro: JogoSequencia = {
  id: 'espectro',
  mecanica: 'sequencia',
  nome: 'Espectro eletromagnético',
  icone: '🌈',
  resumo: 'Desça do rádio ao raio X dizendo cada fronteira em nanômetros.',
  categoria: 'fisica',
  unidade: { singular: 'fronteira', plural: 'fronteiras' },
  comoJogar: [
    'Cada termo é uma fronteira do espectro, em nanômetros, do comprimento de onda maior para o menor.',
    'Começa em 1 m — 1000000000 nm, onde o rádio vira micro-ondas — e acaba em 10 nm, onde o ultravioleta vira raio X.',
    'No meio, o visível se abre nas sete cores: as fronteiras entre elas contam como as outras.',
    'Ponto e espaço de milhar são ignorados: "1.000.000" vale tanto quanto "1000000".',
  ],
  config: () => ({
    itens: ESCADA,
    total: ESCADA.length,
    entrada: 'termo',
    teclado: 'numerico',
    separador: ' · ',
    agrupar: 4,
    // Quatro, como o bloco da fita: a revisão pós-morte mostra o resto do bloco
    // em que ele parou mais um pedaço do próximo, que é o tamanho do que dá para
    // decorar entre uma tentativa e a seguinte.
    revisaoPosMorte: 4,
  }),
}
