/**
 * Massa molar.
 *
 * **Subconjunto, de propósito.** As massas atômicas pertenceriam a `Elemento`,
 * mas `gen-elementos.mjs` teria de ganhar 118 pesos digitados à mão e não há
 * caminho independente barato para conferir cada um. Aqui entram só os treze
 * elementos que os compostos abaixo usam, e o teste confere o conjunto inteiro
 * por dois caminhos que se cruzam. Estender para os 118 é trabalho para o
 * script, não para este arquivo.
 *
 * Valores: pesos atômicos padrão da IUPAC, na forma convencional de quatro a
 * cinco algarismos.
 */
export const MASSAS: Readonly<Record<string, number>> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  S: 32.06,
  K: 39.098,
  Ca: 40.078,
  Cr: 51.996,
  Mn: 54.938,
  Fe: 55.845,
}

/**
 * As massas como as pessoas decoram — inteiras.
 *
 * Não são um atalho de cálculo: são o **segundo caminho** do teste. Se a massa
 * precisa e a massa de cabeça não arredondarem para o mesmo inteiro, o composto
 * não serve para o jogo, porque quem fizer a conta certa vai errar a resposta.
 * É o que tirou o cloro e o cobre daqui: `NaCl` dá 58,44 pelo peso exato e 58,5
 * com Cl = 35,5, e o jogo não pode ter uma resposta que dependa de qual tabela
 * você usou.
 */
export const MASSAS_DE_CABECA: Readonly<Record<string, number>> = {
  H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27,
  S: 32, K: 39, Ca: 40, Cr: 52, Mn: 55, Fe: 56,
}

export interface CompostoMassa {
  readonly formula: string
  readonly nome: string
  /** Composição na ordem da fórmula: [símbolo, quantidade]. */
  readonly atomos: readonly (readonly [string, number])[]
  readonly nivel: 0 | 1 | 2
}

/** Soma das massas atômicas. Lança se faltar um elemento na tabela. */
export function massaMolar(
  c: CompostoMassa,
  tabela: Readonly<Record<string, number>> = MASSAS,
): number {
  let total = 0
  for (const [simbolo, n] of c.atomos) {
    const m = tabela[simbolo]
    if (m === undefined) throw new Error(`${c.formula}: sem massa para ${simbolo}`)
    total += m * n
  }
  return total
}

/** A resposta do jogo: o inteiro mais próximo. */
export const massaArredondada = (c: CompostoMassa): number => Math.round(massaMolar(c))

export const COMPOSTOS_MASSA: readonly CompostoMassa[] = [
  // --- nível 0: dois elementos, contas de uma linha --------------------------
  { formula: 'H₂O', nome: 'água', atomos: [['H', 2], ['O', 1]], nivel: 0 },
  { formula: 'CO₂', nome: 'gás carbônico', atomos: [['C', 1], ['O', 2]], nivel: 0 },
  { formula: 'O₂', nome: 'oxigênio', atomos: [['O', 2]], nivel: 0 },
  { formula: 'N₂', nome: 'nitrogênio', atomos: [['N', 2]], nivel: 0 },
  { formula: 'CH₄', nome: 'metano', atomos: [['C', 1], ['H', 4]], nivel: 0 },
  { formula: 'NH₃', nome: 'amônia', atomos: [['N', 1], ['H', 3]], nivel: 0 },
  { formula: 'CaO', nome: 'cal viva', atomos: [['Ca', 1], ['O', 1]], nivel: 0 },
  { formula: 'MgO', nome: 'óxido de magnésio', atomos: [['Mg', 1], ['O', 1]], nivel: 0 },
  { formula: 'SO₂', nome: 'dióxido de enxofre', atomos: [['S', 1], ['O', 2]], nivel: 0 },
  { formula: 'SO₃', nome: 'trióxido de enxofre', atomos: [['S', 1], ['O', 3]], nivel: 0 },

  // --- nível 1: três elementos, sais e ácidos --------------------------------
  { formula: 'NaOH', nome: 'soda cáustica', atomos: [['Na', 1], ['O', 1], ['H', 1]], nivel: 1 },
  { formula: 'H₂SO₄', nome: 'ácido sulfúrico', atomos: [['H', 2], ['S', 1], ['O', 4]], nivel: 1 },
  { formula: 'HNO₃', nome: 'ácido nítrico', atomos: [['H', 1], ['N', 1], ['O', 3]], nivel: 1 },
  { formula: 'Ca(OH)₂', nome: 'cal hidratada', atomos: [['Ca', 1], ['O', 2], ['H', 2]], nivel: 1 },
  { formula: 'CaCO₃', nome: 'calcário', atomos: [['Ca', 1], ['C', 1], ['O', 3]], nivel: 1 },
  { formula: 'NaHCO₃', nome: 'bicarbonato de sódio', atomos: [['Na', 1], ['H', 1], ['C', 1], ['O', 3]], nivel: 1 },
  { formula: 'Na₂CO₃', nome: 'barrilha', atomos: [['Na', 2], ['C', 1], ['O', 3]], nivel: 1 },
  { formula: 'K₂CO₃', nome: 'carbonato de potássio', atomos: [['K', 2], ['C', 1], ['O', 3]], nivel: 1 },
  { formula: 'Al₂O₃', nome: 'alumina', atomos: [['Al', 2], ['O', 3]], nivel: 1 },
  { formula: 'Fe₂O₃', nome: 'hematita', atomos: [['Fe', 2], ['O', 3]], nivel: 1 },
  { formula: 'KMnO₄', nome: 'permanganato de potássio', atomos: [['K', 1], ['Mn', 1], ['O', 4]], nivel: 1 },

  // --- nível 2: orgânicos e contas compridas ---------------------------------
  { formula: 'C₆H₁₂O₆', nome: 'glicose', atomos: [['C', 6], ['H', 12], ['O', 6]], nivel: 2 },
  { formula: 'C₂H₆O', nome: 'etanol', atomos: [['C', 2], ['H', 6], ['O', 1]], nivel: 2 },
  { formula: 'C₂H₄O₂', nome: 'ácido acético', atomos: [['C', 2], ['H', 4], ['O', 2]], nivel: 2 },
  { formula: 'C₆H₆', nome: 'benzeno', atomos: [['C', 6], ['H', 6]], nivel: 2 },
  { formula: 'C₃H₈', nome: 'propano', atomos: [['C', 3], ['H', 8]], nivel: 2 },
  { formula: 'C₈H₁₈', nome: 'octano', atomos: [['C', 8], ['H', 18]], nivel: 2 },
  { formula: 'C₁₂H₂₂O₁₁', nome: 'sacarose', atomos: [['C', 12], ['H', 22], ['O', 11]], nivel: 2 },
  { formula: 'K₂Cr₂O₇', nome: 'dicromato de potássio', atomos: [['K', 2], ['Cr', 2], ['O', 7]], nivel: 2 },
]
