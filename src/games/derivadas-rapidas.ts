import type { Rng } from '@/core/rng'
import type { Exercicio, JogoGerador } from '@/core/types'

/**
 * Derivadas geradas na hora — distinto do baralho de identidades.
 *
 * Aqui as respostas são simples de propósito (monômios e somas curtas), o que
 * permite enumerar as formas aceitas na geração e dispensar por completo o
 * parser de expressão. É a mesma razão pela qual este modo existe antes do
 * baralho de integrais: entrega treino de derivada sem pagar o custo do parser.
 */

type Gerador = (rng: Rng) => Exercicio

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const
const potenciaBonita = (n: number): string =>
  [...String(n)].map((d) => SUP[Number(d)] ?? '').join('')

/** Todas as grafias de um monômio `c·x^p` que o jogador pode digitar. */
function formasDoMonomio(c: number, p: number): string[] {
  if (p === 0) return [String(c)]

  const coef = c === 1 ? '' : String(c)
  const base = [`${coef}x`]
  if (p > 1) {
    base.length = 0
    base.push(`${coef}x^${p}`, `${coef}x${potenciaBonita(p)}`, `${coef}x**${p}`)
  }

  // Variantes com o sinal de multiplicação explícito, que muita gente digita.
  const comAsterisco = c === 1 ? [] : base.map((f) => f.replace(/^(\d+)/, '$1*'))
  const comPonto = c === 1 ? [] : base.map((f) => f.replace(/^(\d+)/, '$1·'))
  return [...base, ...comAsterisco, ...comPonto]
}

function exercicio(chave: string, enunciado: string, formas: string[]): Exercicio {
  const canonica = formas[0] as string
  return {
    chave,
    enunciado: { kind: 'texto', valor: enunciado },
    resposta: {
      tipo: 'texto',
      canonica,
      aceitas: formas,
      // Sem tolerância a typo: num monômio, um caractere trocado é outra
      // resposta, não um deslize de digitação.
      opcoes: { ignorarArtigos: false, tolerarTypo: false },
    },
    gabarito: canonica,
    teclado: 'texto',
  }
}

/** d/dx (c·xⁿ) = c·n·xⁿ⁻¹ */
const monomio: Gerador = (rng) => {
  const c = rng.int(2, 9)
  const n = rng.int(2, 6)
  return exercicio(
    `mono:${c}x${n}`,
    `d/dx ( ${c}x${potenciaBonita(n)} )`,
    formasDoMonomio(c * n, n - 1),
  )
}

/** d/dx (c·xⁿ + b·x) = c·n·xⁿ⁻¹ + b */
const binomio: Gerador = (rng) => {
  const c = rng.int(2, 6)
  const n = rng.int(2, 4)
  const b = rng.int(2, 9)

  const primeiro = formasDoMonomio(c * n, n - 1)
  const formas = primeiro.map((f) => `${f} + ${b}`)
  // A soma pode vir sem espaços ou na ordem trocada.
  const compactas = primeiro.map((f) => `${f}+${b}`)
  const invertidas = primeiro.map((f) => `${b} + ${f}`)

  return exercicio(
    `bin:${c}x${n}+${b}x`,
    `d/dx ( ${c}x${potenciaBonita(n)} + ${b}x )`,
    [...formas, ...compactas, ...invertidas],
  )
}

/** Derivadas das trigonométricas e da exponencial, com coeficiente. */
const elementar: Gerador = (rng) => {
  const c = rng.int(2, 9)
  const casos = [
    { f: `sen(x)`, d: [`${c}cos(x)`, `${c}cos x`, `${c}*cos(x)`, `${c}·cos(x)`], id: 'sen' },
    { f: `cos(x)`, d: [`-${c}sen(x)`, `-${c}sen x`, `-${c}sin(x)`, `−${c}sen(x)`], id: 'cos' },
    { f: `e^x`, d: [`${c}e^x`, `${c}*e^x`, `${c}·e^x`, `${c}e^(x)`], id: 'exp' },
    { f: `ln(x)`, d: [`${c}/x`, `${c}x^-1`, `${c}/(x)`], id: 'ln' },
  ] as const

  const caso = rng.pick(casos)
  return exercicio(`elem:${caso.id}:${c}`, `d/dx ( ${c}·${caso.f} )`, [...caso.d])
}

const DEGRAUS: readonly (readonly Gerador[])[] = [[monomio], [elementar], [binomio]]

export function gerarDerivada(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), DEGRAUS.length - 1)
  const atuais = DEGRAUS[n] ?? []
  return rng.pick([...DEGRAUS.slice(0, n).flat(), ...atuais, ...atuais])(rng)
}

export const derivadasRapidas: JogoGerador = {
  id: 'derivadas-rapidas',
  mecanica: 'gerador',
  nome: 'Derivadas rápidas',
  icone: 'd/dx',
  resumo: 'Polinômios e elementares geradas na hora, contra o relógio.',
  categoria: 'matematica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Escreva a derivada: "12x^3", "12x³" ou "12*x^3" valem igual.',
    'Use "sen" ou "sin", tanto faz.',
    'Cada acerto devolve 5 segundos ao relógio.',
  ],
  config: () => ({
    gerar: gerarDerivada,
    segundosIniciais: 60,
    bonusPorAcertoS: 5,
    tetoSegundos: 120,
    escala: (acertos) => Math.min(2, Math.floor(acertos / 6)),
    teclado: 'texto',
  }),
}
