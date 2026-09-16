/**
 * O espectro eletromagnético: as sete faixas e as sete cores do visível, cada
 * uma com os dois limites de comprimento de onda.
 *
 * **Tudo em nanômetros, e um número só por fronteira.** A tentação era guardar
 * cada faixa com a sua unidade natural — rádio em metros, micro-ondas em
 * milímetros, visível em nanômetros — porque é assim que o livro escreve. Isso
 * torna o dataset ilegível para a única pergunta que ele precisa responder:
 * *a faixa seguinte começa exatamente onde esta acaba?* Com unidade por faixa,
 * responder isso vira conversão a cada linha, e a conversão é justamente onde o
 * erro entra sem ninguém ver. Uma unidade só para as catorze entradas deixa o
 * teste de contiguidade ser uma comparação de igualdade, e não uma conta.
 *
 * O nanômetro venceu o metro porque é onde ficam os números que alguém de fato
 * decora: 380, 450, 570, 750. Em metros eles virariam 3,8×10⁻⁷ e o dataset
 * passaria a guardar expoentes, que é a forma mais fácil de errar por um fator
 * de dez em silêncio.
 *
 * **380–750 nm, e não 400–700.** As duas convenções circulam. 400–700 é o
 * arredondamento de quem só quer a ordem de grandeza; 380–750 é a faixa em que a
 * resposta do olho ainda é mensurável, e é a que casa com a tabela de cores logo
 * abaixo — as fronteiras das sete cores de Newton são publicadas nessa escala.
 * Misturar as duas (visível de 400 a 700, mas vermelho até 750) criaria uma
 * sobreposição de 50 nm entre o vermelho e o infravermelho, que é exatamente o
 * defeito que `espectro.test.ts` existe para pegar.
 *
 * **A fronteira raios X | raios gama é didática, e está marcada como tal.** X e
 * gama se sobrepõem em comprimento de onda: o que separa os dois é a origem —
 * transição eletrônica atômica contra decaimento nuclear —, não o tamanho da
 * onda. O valor de 0,01 nm entra aqui porque sem ele as faixas não fecham e o
 * teste de contiguidade não teria o que verificar, mas ele é o único da tabela
 * que não é uma medida: é uma linha desenhada no diagrama do livro.
 */

export type IdFaixa =
  | 'radio'
  | 'micro-ondas'
  | 'infravermelho'
  | 'visivel'
  | 'ultravioleta'
  | 'raios-x'
  | 'raios-gama'

export interface Faixa {
  readonly id: IdFaixa
  readonly nome: string
  /** O limite de MAIOR comprimento de onda, em nm. `null` = sem limite (rádio). */
  readonly maiorNm: number | null
  /** O limite de MENOR comprimento de onda, em nm. `null` = sem limite (gama). */
  readonly menorNm: number | null
  /**
   * A fronteira inferior é convenção de diagrama, não medida.
   * Hoje só os raios X: ver a nota sobre X × gama no topo do arquivo.
   */
  readonly fronteiraDidatica?: true
}

/** As sete faixas, do maior comprimento de onda para o menor. A ordem é dado. */
export const FAIXAS: readonly Faixa[] = [
  // 1 m é a fronteira que todo diagrama usa. Acima dela não há teto físico: onda
  // de rádio de 100 km existe e é usada para submarino, então `null` e não um
  // número grande qualquer — inventar um teto seria mentir com aparência de dado.
  { id: 'radio', nome: 'Ondas de rádio', maiorNm: null, menorNm: 1_000_000_000 },
  { id: 'micro-ondas', nome: 'Micro-ondas', maiorNm: 1_000_000_000, menorNm: 1_000_000 },
  { id: 'infravermelho', nome: 'Infravermelho', maiorNm: 1_000_000, menorNm: 750 },
  { id: 'visivel', nome: 'Luz visível', maiorNm: 750, menorNm: 380 },
  { id: 'ultravioleta', nome: 'Ultravioleta', maiorNm: 380, menorNm: 10 },
  { id: 'raios-x', nome: 'Raios X', maiorNm: 10, menorNm: 0.01, fronteiraDidatica: true },
  { id: 'raios-gama', nome: 'Raios gama', maiorNm: 0.01, menorNm: null },
]

export interface Cor {
  readonly nome: string
  readonly maiorNm: number
  readonly menorNm: number
}

/**
 * As sete cores de Newton, do vermelho ao violeta.
 *
 * São sete porque Newton quis sete, não porque o espectro tenha degraus: entre
 * o azul e o violeta ele enfiou o anil para fechar a analogia com as sete notas
 * musicais. Manter o anil é manter a lista que a escola ensina — e é o único
 * lugar deste arquivo onde a divisão é cultural em vez de física. A alternativa
 * era cortá-lo e ficar com seis cores, o que tornaria o dataset mais honesto e o
 * jogo incompatível com todo material didático em que o jogador estudou.
 */
export const CORES_VISIVEL: readonly Cor[] = [
  { nome: 'Vermelho', maiorNm: 750, menorNm: 620 },
  { nome: 'Laranja', maiorNm: 620, menorNm: 590 },
  { nome: 'Amarelo', maiorNm: 590, menorNm: 570 },
  { nome: 'Verde', maiorNm: 570, menorNm: 495 },
  { nome: 'Azul', maiorNm: 495, menorNm: 450 },
  { nome: 'Anil', maiorNm: 450, menorNm: 425 },
  { nome: 'Violeta', maiorNm: 425, menorNm: 380 },
]

/**
 * Toda fronteira do espectro, em nm, do maior comprimento de onda para o menor.
 *
 * É derivada e não escrita à mão de propósito: escrever a escada seria guardar
 * pela terceira vez os mesmos números que já estão em `FAIXAS` e em
 * `CORES_VISIVEL`, e um dia as três cópias discordariam. Aqui, mudar o limite do
 * visível move a escada junto, sem ninguém lembrar de mexer nela.
 *
 * Os `null` das pontas somem sozinhos: rádio não tem teto e gama não tem piso,
 * então o que sobra é fronteira de verdade — lugar onde uma faixa acaba e outra
 * começa.
 */
export const FRONTEIRAS_NM: readonly number[] = [
  ...new Set(
    [
      ...FAIXAS.flatMap((f) => [f.maiorNm, f.menorNm]),
      ...CORES_VISIVEL.flatMap((c) => [c.maiorNm, c.menorNm]),
    ].filter((n): n is number => n !== null),
  ),
].sort((a, b) => b - a)

/**
 * A escada que o jogo cobra: as fronteiras que dá para digitar como inteiro.
 *
 * O corte é imposto pela engine, e não por física — vale dizer isso na cara em
 * vez de disfarçar. A mecânica de sequência julga cada termo com
 * `inteiroGrande`, que existe para Fibonacci e potências de 2 e por isso lê
 * "0,01" como o inteiro 001. Um jogo de morte súbita que mata o jogador num
 * detalhe de digitação, e não no que ele sabe, não vale a pena — então a única
 * fronteira fracionária, a de 0,01 nm entre raios X e gama, fica de fora da
 * escada e permanece no dataset, onde o teste de contiguidade precisa dela.
 *
 * A perda é pequena e quase feliz: essa é justamente a fronteira que o arquivo
 * já marca como didática, porque X e gama não se distinguem por comprimento de
 * onda. A escada acaba em 10 nm, onde o ultravioleta vira raio X, que é a última
 * fronteira do espectro que é de fato uma medida.
 */
export const ESCADA_NM: readonly number[] = FRONTEIRAS_NM.filter((n) => Number.isInteger(n))

/** Os mesmos números como string, que é a forma que a mecânica de sequência lê. */
export const ESCADA: readonly string[] = ESCADA_NM.map(String)
