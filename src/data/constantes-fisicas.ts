/**
 * Constantes físicas fundamentais.
 *
 * Fonte: SI (redefinição de 2019) para as exatas, CODATA 2022 para as medidas.
 *
 * A armadilha que quase todo material didático erra: **μ₀ deixou de ser exato em
 * 2019.** `μ₀ = 4π×10⁻⁷` valia até a redefinição; hoje μ₀ e ε₀ são grandezas
 * medidas, com incerteza. Por isso `exato` e `fonte` são campos obrigatórios —
 * eles forçam a decisão a ser consciente item a item, em vez de copiada de um
 * livro de 2015.
 *
 * A mantissa é guardada como string de dígitos porque a comparação é por
 * algarismos significativos: o jogo mede quantos você lembrou, não se você
 * acertou um float.
 */

export interface ConstanteFisica {
  readonly id: string
  readonly nome: string
  readonly sinonimos: readonly string[]
  /** Como aparece na pergunta: "c", "ħ", "ε₀". */
  readonly simbolo: string
  /** Dígitos significativos em ordem, sem vírgula. */
  readonly mantissa: string
  readonly expoente: number
  /** Unidade exibida como chip ao lado do campo — não é digitada. */
  readonly unidade: string
  /** Exata por definição no SI de 2019? */
  readonly exato: boolean
  readonly fonte: 'SI-2019' | 'CODATA-2022'
  /** Algarismos significativos mínimos para contar como acerto. */
  readonly sigMin: number
}

export const CONSTANTES_FISICAS: readonly ConstanteFisica[] = [
  // --- exatas por definição (SI 2019) ---
  {
    id: 'c',
    nome: 'Velocidade da luz no vácuo',
    sinonimos: ['velocidade da luz', 'c'],
    simbolo: 'c',
    mantissa: '299792458',
    expoente: 8,
    unidade: 'm/s',
    exato: true,
    fonte: 'SI-2019',
    sigMin: 3,
  },
  {
    id: 'h',
    nome: 'Constante de Planck',
    sinonimos: ['planck'],
    simbolo: 'h',
    mantissa: '662607015',
    expoente: -34,
    unidade: 'J·s',
    exato: true,
    fonte: 'SI-2019',
    sigMin: 3,
  },
  {
    id: 'e',
    nome: 'Carga elementar',
    sinonimos: ['carga do elétron', 'carga elementar'],
    simbolo: 'e',
    mantissa: '1602176634',
    expoente: -19,
    unidade: 'C',
    exato: true,
    fonte: 'SI-2019',
    sigMin: 3,
  },
  {
    id: 'k-b',
    nome: 'Constante de Boltzmann',
    sinonimos: ['boltzmann'],
    simbolo: 'k_B',
    mantissa: '1380649',
    expoente: -23,
    unidade: 'J/K',
    exato: true,
    fonte: 'SI-2019',
    sigMin: 3,
  },
  {
    id: 'n-a',
    nome: 'Número de Avogadro',
    sinonimos: ['avogadro', 'constante de avogadro'],
    simbolo: 'N_A',
    mantissa: '602214076',
    expoente: 23,
    unidade: 'mol⁻¹',
    exato: true,
    fonte: 'SI-2019',
    sigMin: 3,
  },

  // --- exatas por derivação das definidoras ---
  {
    id: 'h-barra',
    nome: 'Constante de Planck reduzida',
    sinonimos: ['h cortado', 'h barra', 'dirac'],
    simbolo: 'ħ',
    mantissa: '1054571817',
    expoente: -34,
    unidade: 'J·s',
    exato: true,
    fonte: 'SI-2019',
    sigMin: 3,
  },
  {
    id: 'r',
    nome: 'Constante universal dos gases',
    sinonimos: ['constante dos gases', 'r'],
    simbolo: 'R',
    mantissa: '8314462618',
    expoente: 0,
    unidade: 'J/(mol·K)',
    exato: true,
    fonte: 'SI-2019',
    sigMin: 3,
  },
  {
    id: 'sigma',
    nome: 'Constante de Stefan-Boltzmann',
    sinonimos: ['stefan boltzmann', 'stefan'],
    simbolo: 'σ',
    mantissa: '5670374419',
    expoente: -8,
    unidade: 'W/(m²·K⁴)',
    exato: true,
    fonte: 'SI-2019',
    sigMin: 3,
  },

  // --- medidas (CODATA 2022) ---
  {
    id: 'g',
    nome: 'Constante gravitacional',
    sinonimos: ['constante da gravitação universal', 'gravitacional', 'g'],
    simbolo: 'G',
    mantissa: '667430',
    expoente: -11,
    unidade: 'N·m²/kg²',
    exato: false,
    fonte: 'CODATA-2022',
    // A pior medida de todas: incerteza relativa ~2,2×10⁻⁵. Não faz sentido
    // cobrar mais de 6 algarismos de uma constante que só se conhece até aí.
    sigMin: 3,
  },
  {
    id: 'm-e',
    nome: 'Massa do elétron',
    sinonimos: ['massa do eletron'],
    simbolo: 'mₑ',
    mantissa: '91093837139',
    expoente: -31,
    unidade: 'kg',
    exato: false,
    fonte: 'CODATA-2022',
    sigMin: 3,
  },
  {
    id: 'm-p',
    nome: 'Massa do próton',
    sinonimos: ['massa do proton'],
    simbolo: 'm_p',
    mantissa: '167262192595',
    expoente: -27,
    unidade: 'kg',
    exato: false,
    fonte: 'CODATA-2022',
    sigMin: 3,
  },
  {
    id: 'epsilon-0',
    nome: 'Permissividade do vácuo',
    sinonimos: ['constante elétrica', 'epsilon zero', 'permissividade elétrica do vácuo'],
    simbolo: 'ε₀',
    mantissa: '88541878188',
    expoente: -12,
    unidade: 'F/m',
    // Medida desde 2019 — antes era exata, derivada de μ₀ e c.
    exato: false,
    fonte: 'CODATA-2022',
    sigMin: 3,
  },
  {
    id: 'mu-0',
    nome: 'Permeabilidade do vácuo',
    sinonimos: ['constante magnética', 'mu zero', 'permeabilidade magnética do vácuo'],
    simbolo: 'μ₀',
    mantissa: '125663706127',
    expoente: -6,
    unidade: 'N/A²',
    // NÃO é mais 4π×10⁻⁷ exato: a redefinição de 2019 tirou essa definição.
    exato: false,
    fonte: 'CODATA-2022',
    sigMin: 3,
  },
  {
    id: 'g-terra',
    nome: 'Aceleração da gravidade padrão',
    sinonimos: ['gravidade', 'aceleração da gravidade', 'g da terra'],
    simbolo: 'g',
    mantissa: '980665',
    expoente: 0,
    unidade: 'm/s²',
    exato: true,
    fonte: 'SI-2019',
    sigMin: 3,
  },
]
