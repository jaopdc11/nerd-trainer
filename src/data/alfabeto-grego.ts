/**
 * As 24 letras gregas.
 *
 * A nomenclatura brasileira é instável de propósito nos `sinonimos`: "mi" e
 * "mu", "capa" e "kappa", "ni" e "nu", "csi" e "xi". Todas passam.
 *
 * O cuidado que importa: **ξ e χ não podem compartilhar forma aceita.** "xi" é
 * do ξ e "qui/chi" é do χ; se alguém acrescentar "chi" ao ξ por descuido, duas
 * letras passam a aceitar a mesma resposta e o jogo vira loteria. Há um teste
 * que cruza todos os pares e falha se isso acontecer.
 */

export interface LetraGrega {
  readonly ordem: number
  readonly nome: string
  readonly sinonimos: readonly string[]
  readonly maiuscula: string
  readonly minuscula: string
  /** Glifos alternativos da mesma letra, aceitos como resposta de símbolo. */
  readonly variantes?: readonly string[]
}

export const ALFABETO_GREGO: readonly LetraGrega[] = [
  { ordem: 1, nome: 'alfa', sinonimos: ['alpha'], maiuscula: 'Α', minuscula: 'α' },
  { ordem: 2, nome: 'beta', sinonimos: [], maiuscula: 'Β', minuscula: 'β' },
  { ordem: 3, nome: 'gama', sinonimos: ['gamma'], maiuscula: 'Γ', minuscula: 'γ' },
  { ordem: 4, nome: 'delta', sinonimos: [], maiuscula: 'Δ', minuscula: 'δ' },
  {
    ordem: 5,
    nome: 'épsilon',
    sinonimos: [],
    maiuscula: 'Ε',
    minuscula: 'ε',
    variantes: ['ϵ'],
  },
  { ordem: 6, nome: 'zeta', sinonimos: ['dzeta'], maiuscula: 'Ζ', minuscula: 'ζ' },
  { ordem: 7, nome: 'eta', sinonimos: [], maiuscula: 'Η', minuscula: 'η' },
  {
    ordem: 8,
    nome: 'teta',
    sinonimos: ['theta', 'tetha'],
    maiuscula: 'Θ',
    minuscula: 'θ',
    variantes: ['ϑ'],
  },
  { ordem: 9, nome: 'iota', sinonimos: [], maiuscula: 'Ι', minuscula: 'ι' },
  {
    ordem: 10,
    nome: 'capa',
    sinonimos: ['kappa'],
    maiuscula: 'Κ',
    minuscula: 'κ',
    variantes: ['ϰ'],
  },
  { ordem: 11, nome: 'lambda', sinonimos: [], maiuscula: 'Λ', minuscula: 'λ' },
  { ordem: 12, nome: 'mi', sinonimos: ['mu'], maiuscula: 'Μ', minuscula: 'μ' },
  { ordem: 13, nome: 'ni', sinonimos: ['nu'], maiuscula: 'Ν', minuscula: 'ν' },
  { ordem: 14, nome: 'csi', sinonimos: ['xi', 'ksi'], maiuscula: 'Ξ', minuscula: 'ξ' },
  { ordem: 15, nome: 'ômicron', sinonimos: [], maiuscula: 'Ο', minuscula: 'ο' },
  {
    ordem: 16,
    nome: 'pi',
    sinonimos: [],
    maiuscula: 'Π',
    minuscula: 'π',
    variantes: ['ϖ'],
  },
  { ordem: 17, nome: 'rô', sinonimos: ['rho'], maiuscula: 'Ρ', minuscula: 'ρ' },
  {
    ordem: 18,
    nome: 'sigma',
    sinonimos: [],
    maiuscula: 'Σ',
    minuscula: 'σ',
    // ς é o sigma final, usado no fim de palavra.
    variantes: ['ς'],
  },
  { ordem: 19, nome: 'tau', sinonimos: [], maiuscula: 'Τ', minuscula: 'τ' },
  { ordem: 20, nome: 'úpsilon', sinonimos: ['ipsilon'], maiuscula: 'Υ', minuscula: 'υ' },
  {
    ordem: 21,
    nome: 'fi',
    sinonimos: ['phi'],
    maiuscula: 'Φ',
    minuscula: 'φ',
    // ϕ e φ são a mesma letra, só desenhos diferentes.
    variantes: ['ϕ'],
  },
  { ordem: 22, nome: 'qui', sinonimos: ['chi', 'khi'], maiuscula: 'Χ', minuscula: 'χ' },
  { ordem: 23, nome: 'psi', sinonimos: [], maiuscula: 'Ψ', minuscula: 'ψ' },
  { ordem: 24, nome: 'ômega', sinonimos: [], maiuscula: 'Ω', minuscula: 'ω' },
]
