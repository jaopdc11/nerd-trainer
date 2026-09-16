/**
 * Geometria molecular pela VSEPR.
 *
 * O dado que faz o jogo funcionar não é a resposta, é a **geometria
 * eletrônica** guardada ao lado dela. Ela é o erro clássico: quem estudou pela
 * metade olha a água e responde "tetraédrica", porque o oxigênio tem mesmo
 * quatro domínios ao redor — só que dois são pares isolados, e a *molécula* é
 * angular. Usar a geometria eletrônica como distrator é o mesmo truque das
 * constantes físicas, onde a opção errada carrega a mantissa certa com o
 * expoente trocado: o card só ensina se a opção errada for a que você
 * escolheria.
 *
 * `AXE` é a notação de Gillespie: A é o átomo central, X cada átomo ligado, E
 * cada par isolado. Ela é o que decide a forma, então fica visível no gabarito
 * — quem erra precisa ver *por quê*, e a conta de domínios é a explicação
 * inteira.
 */
export type Geometria =
  | 'linear'
  | 'angular'
  | 'trigonal plana'
  | 'piramidal trigonal'
  | 'tetraédrica'
  | 'bipiramidal trigonal'
  | 'gangorra'
  | 'forma de T'
  | 'quadrada planar'
  | 'piramidal quadrada'
  | 'octaédrica'

export interface Molecula {
  readonly formula: string
  readonly nome: string
  /** Notação AXE: átomos ligados e pares isolados no átomo central. */
  readonly axe: string
  readonly ligados: number
  readonly isolados: number
  /** A resposta: a forma dos núcleos. */
  readonly geometria: Geometria
  /**
   * A forma dos domínios eletrônicos, pares isolados incluídos. Igual à
   * geometria quando não há pares isolados; é o distrator quando há.
   */
  readonly eletronica: Geometria
}

export const MOLECULAS: readonly Molecula[] = [
  // AX2 — dois domínios, sem par isolado.
  { formula: 'CO₂', nome: 'dióxido de carbono', axe: 'AX₂', ligados: 2, isolados: 0, geometria: 'linear', eletronica: 'linear' },
  { formula: 'BeCl₂', nome: 'cloreto de berílio', axe: 'AX₂', ligados: 2, isolados: 0, geometria: 'linear', eletronica: 'linear' },
  { formula: 'HCN', nome: 'cianeto de hidrogênio', axe: 'AX₂', ligados: 2, isolados: 0, geometria: 'linear', eletronica: 'linear' },
  { formula: 'CS₂', nome: 'dissulfeto de carbono', axe: 'AX₂', ligados: 2, isolados: 0, geometria: 'linear', eletronica: 'linear' },

  // AX3 — três domínios.
  { formula: 'BF₃', nome: 'trifluoreto de boro', axe: 'AX₃', ligados: 3, isolados: 0, geometria: 'trigonal plana', eletronica: 'trigonal plana' },
  { formula: 'SO₃', nome: 'trióxido de enxofre', axe: 'AX₃', ligados: 3, isolados: 0, geometria: 'trigonal plana', eletronica: 'trigonal plana' },
  { formula: 'NO₃⁻', nome: 'nitrato', axe: 'AX₃', ligados: 3, isolados: 0, geometria: 'trigonal plana', eletronica: 'trigonal plana' },
  { formula: 'CO₃²⁻', nome: 'carbonato', axe: 'AX₃', ligados: 3, isolados: 0, geometria: 'trigonal plana', eletronica: 'trigonal plana' },

  // AX2E — três domínios, um isolado.
  { formula: 'SO₂', nome: 'dióxido de enxofre', axe: 'AX₂E', ligados: 2, isolados: 1, geometria: 'angular', eletronica: 'trigonal plana' },
  { formula: 'O₃', nome: 'ozônio', axe: 'AX₂E', ligados: 2, isolados: 1, geometria: 'angular', eletronica: 'trigonal plana' },
  { formula: 'NO₂⁻', nome: 'nitrito', axe: 'AX₂E', ligados: 2, isolados: 1, geometria: 'angular', eletronica: 'trigonal plana' },

  // AX4 — quatro domínios.
  { formula: 'CH₄', nome: 'metano', axe: 'AX₄', ligados: 4, isolados: 0, geometria: 'tetraédrica', eletronica: 'tetraédrica' },
  { formula: 'CCl₄', nome: 'tetracloreto de carbono', axe: 'AX₄', ligados: 4, isolados: 0, geometria: 'tetraédrica', eletronica: 'tetraédrica' },
  { formula: 'SO₄²⁻', nome: 'sulfato', axe: 'AX₄', ligados: 4, isolados: 0, geometria: 'tetraédrica', eletronica: 'tetraédrica' },
  { formula: 'NH₄⁺', nome: 'amônio', axe: 'AX₄', ligados: 4, isolados: 0, geometria: 'tetraédrica', eletronica: 'tetraédrica' },

  // AX3E — quatro domínios, um isolado.
  { formula: 'NH₃', nome: 'amônia', axe: 'AX₃E', ligados: 3, isolados: 1, geometria: 'piramidal trigonal', eletronica: 'tetraédrica' },
  { formula: 'PCl₃', nome: 'tricloreto de fósforo', axe: 'AX₃E', ligados: 3, isolados: 1, geometria: 'piramidal trigonal', eletronica: 'tetraédrica' },
  { formula: 'H₃O⁺', nome: 'hidrônio', axe: 'AX₃E', ligados: 3, isolados: 1, geometria: 'piramidal trigonal', eletronica: 'tetraédrica' },
  { formula: 'SO₃²⁻', nome: 'sulfito', axe: 'AX₃E', ligados: 3, isolados: 1, geometria: 'piramidal trigonal', eletronica: 'tetraédrica' },

  // AX2E2 — quatro domínios, dois isolados.
  { formula: 'H₂O', nome: 'água', axe: 'AX₂E₂', ligados: 2, isolados: 2, geometria: 'angular', eletronica: 'tetraédrica' },
  { formula: 'H₂S', nome: 'sulfeto de hidrogênio', axe: 'AX₂E₂', ligados: 2, isolados: 2, geometria: 'angular', eletronica: 'tetraédrica' },
  { formula: 'OF₂', nome: 'difluoreto de oxigênio', axe: 'AX₂E₂', ligados: 2, isolados: 2, geometria: 'angular', eletronica: 'tetraédrica' },

  // Cinco domínios.
  { formula: 'PCl₅', nome: 'pentacloreto de fósforo', axe: 'AX₅', ligados: 5, isolados: 0, geometria: 'bipiramidal trigonal', eletronica: 'bipiramidal trigonal' },
  { formula: 'PF₅', nome: 'pentafluoreto de fósforo', axe: 'AX₅', ligados: 5, isolados: 0, geometria: 'bipiramidal trigonal', eletronica: 'bipiramidal trigonal' },
  { formula: 'SF₄', nome: 'tetrafluoreto de enxofre', axe: 'AX₄E', ligados: 4, isolados: 1, geometria: 'gangorra', eletronica: 'bipiramidal trigonal' },
  { formula: 'ClF₃', nome: 'trifluoreto de cloro', axe: 'AX₃E₂', ligados: 3, isolados: 2, geometria: 'forma de T', eletronica: 'bipiramidal trigonal' },
  { formula: 'BrF₃', nome: 'trifluoreto de bromo', axe: 'AX₃E₂', ligados: 3, isolados: 2, geometria: 'forma de T', eletronica: 'bipiramidal trigonal' },
  { formula: 'XeF₂', nome: 'difluoreto de xenônio', axe: 'AX₂E₃', ligados: 2, isolados: 3, geometria: 'linear', eletronica: 'bipiramidal trigonal' },
  { formula: 'I₃⁻', nome: 'triiodeto', axe: 'AX₂E₃', ligados: 2, isolados: 3, geometria: 'linear', eletronica: 'bipiramidal trigonal' },

  // Seis domínios.
  { formula: 'SF₆', nome: 'hexafluoreto de enxofre', axe: 'AX₆', ligados: 6, isolados: 0, geometria: 'octaédrica', eletronica: 'octaédrica' },
  { formula: 'BrF₅', nome: 'pentafluoreto de bromo', axe: 'AX₅E', ligados: 5, isolados: 1, geometria: 'piramidal quadrada', eletronica: 'octaédrica' },
  { formula: 'XeF₄', nome: 'tetrafluoreto de xenônio', axe: 'AX₄E₂', ligados: 4, isolados: 2, geometria: 'quadrada planar', eletronica: 'octaédrica' },
]

/** A geometria eletrônica depende só do número de domínios. */
export const POR_DOMINIOS: Readonly<Record<number, Geometria>> = {
  2: 'linear',
  3: 'trigonal plana',
  4: 'tetraédrica',
  5: 'bipiramidal trigonal',
  6: 'octaédrica',
}
