/**
 * Os 24 prefixos do SI.
 *
 * São 24 e não 20: a CGPM de 2022 acrescentou ronna, quetta, ronto e quecto.
 * Incluir é o diferencial nerd; omitir é o dataset nascer datado em 2018.
 *
 * Duas armadilhas de símbolo, ambas cobertas por teste:
 * - **`k` de quilo é minúsculo.** `K` é kelvin. Pelo mesmo motivo `M` é mega e
 *   `m` é mili — por isso a comparação de símbolo é estrita em caixa.
 * - **`µ` (U+00B5, micro sign) não é `μ` (U+03BC, grego mu).** Renderizam igual,
 *   comparam diferente, e o bug é invisível em revisão de código. Aqui o
 *   canônico é o grego, e o micro sign entra como forma aceita.
 */

export interface PrefixoSI {
  readonly nome: string
  readonly sinonimos: readonly string[]
  readonly simbolo: string
  /** Outras grafias do símbolo aceitas na resposta. */
  readonly simbolosAceitos?: readonly string[]
  readonly expoente: number
}

export const PREFIXOS_SI: readonly PrefixoSI[] = [
  { nome: 'quetta', sinonimos: [], simbolo: 'Q', expoente: 30 },
  { nome: 'ronna', sinonimos: [], simbolo: 'R', expoente: 27 },
  { nome: 'yotta', sinonimos: ['iota'], simbolo: 'Y', expoente: 24 },
  { nome: 'zetta', sinonimos: [], simbolo: 'Z', expoente: 21 },
  { nome: 'exa', sinonimos: [], simbolo: 'E', expoente: 18 },
  { nome: 'peta', sinonimos: [], simbolo: 'P', expoente: 15 },
  { nome: 'tera', sinonimos: ['tetra'], simbolo: 'T', expoente: 12 },
  { nome: 'giga', sinonimos: [], simbolo: 'G', expoente: 9 },
  { nome: 'mega', sinonimos: [], simbolo: 'M', expoente: 6 },
  { nome: 'quilo', sinonimos: ['kilo'], simbolo: 'k', expoente: 3 },
  { nome: 'hecto', sinonimos: [], simbolo: 'h', expoente: 2 },
  { nome: 'deca', sinonimos: ['deka'], simbolo: 'da', expoente: 1 },
  { nome: 'deci', sinonimos: [], simbolo: 'd', expoente: -1 },
  { nome: 'centi', sinonimos: [], simbolo: 'c', expoente: -2 },
  { nome: 'mili', sinonimos: ['milli'], simbolo: 'm', expoente: -3 },
  // Canônico é o mu grego; o micro sign do teclado entra como aceito.
  { nome: 'micro', sinonimos: [], simbolo: 'μ', simbolosAceitos: ['µ', 'u'], expoente: -6 },
  { nome: 'nano', sinonimos: [], simbolo: 'n', expoente: -9 },
  { nome: 'pico', sinonimos: [], simbolo: 'p', expoente: -12 },
  { nome: 'femto', sinonimos: [], simbolo: 'f', expoente: -15 },
  { nome: 'atto', sinonimos: ['ato'], simbolo: 'a', expoente: -18 },
  { nome: 'zepto', sinonimos: [], simbolo: 'z', expoente: -21 },
  { nome: 'yocto', sinonimos: ['iocto'], simbolo: 'y', expoente: -24 },
  { nome: 'ronto', sinonimos: [], simbolo: 'r', expoente: -27 },
  { nome: 'quecto', sinonimos: [], simbolo: 'q', expoente: -30 },
]
