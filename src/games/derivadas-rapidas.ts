import type { Rng } from '@/core/rng'
import type { Conteudo, Exercicio, JogoGerador } from '@/core/types'

/**
 * Derivadas geradas na hora, com quatro alternativas.
 *
 * Era digitado, e era ruim: escrever "36x^5" contra o relógio mede velocidade
 * de teclado, não se você sabe derivar. Com alternativas, o item volta a cobrar
 * a regra — e os distratores passam a ser a parte importante, porque são
 * exatamente os três erros que se comete numa derivada de polinômio.
 */

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const
const pot = (n: number): string => [...String(n)].map((d) => SUP[Number(d)] ?? '').join('')

/** `c·x^p` na forma que aparece na tela. */
function monomio(c: number, p: number): string {
  if (p === 0) return String(c)
  const coef = c === 1 ? '' : String(c)
  return p === 1 ? `${coef}x` : `${coef}x${pot(p)}`
}

type Gerador = (rng: Rng) => Exercicio

/** Embaralha as opções e devolve o exercício pronto. */
function montar(
  rng: Rng,
  chave: string,
  enunciado: string,
  certo: string,
  errados: string[],
): Exercicio {
  // Distrator repetido viraria duas opções iguais; completa com variações se
  // algum erro clássico colidir com a resposta certa.
  const unicos = [...new Set(errados.filter((e) => e !== certo))].slice(0, 3)
  let extra = 2
  while (unicos.length < 3) {
    const candidato = `${extra}${certo.replace(/^\d+/, '')}`
    if (candidato !== certo && !unicos.includes(candidato)) unicos.push(candidato)
    extra++
  }

  const opcoes = rng.shuffle([certo, ...unicos])
  return {
    tipo: 'escolha',
    chave,
    enunciado: { kind: 'texto', valor: enunciado },
    alternativas: opcoes.map((v): Conteudo => ({ kind: 'texto', valor: v })),
    indiceCorreto: opcoes.indexOf(certo),
    gabarito: certo,
  }
}

/**
 * d/dx (c·xⁿ) = c·n·xⁿ⁻¹
 *
 * Os três erros clássicos, nesta ordem: não baixar o expoente, não multiplicar
 * pelo expoente, e usar n−1 no lugar de n como fator.
 */
const polinomio: Gerador = (rng) => {
  const c = rng.int(2, 9)
  const n = rng.int(2, 6)

  return montar(
    rng,
    `poli:${c}x${n}`,
    `d/dx ( ${monomio(c, n)} )`,
    monomio(c * n, n - 1),
    [monomio(c * n, n), monomio(c, n - 1), monomio(c * (n - 1), n - 1)],
  )
}

/** d/dx (c·xⁿ + b·x) = c·n·xⁿ⁻¹ + b */
const binomio: Gerador = (rng) => {
  const c = rng.int(2, 6)
  const n = rng.int(2, 4)
  const b = rng.int(2, 9)

  return montar(
    rng,
    `bin:${c}x${n}+${b}x`,
    `d/dx ( ${monomio(c, n)} + ${b}x )`,
    `${monomio(c * n, n - 1)} + ${b}`,
    [
      // Esqueceu de derivar o termo linear.
      `${monomio(c * n, n - 1)} + ${b}x`,
      // Não baixou o expoente.
      `${monomio(c * n, n)} + ${b}`,
      // Derivou a constante junto.
      monomio(c * n, n - 1),
    ],
  )
}

/** Trigonométricas, exponencial e logaritmo, com coeficiente. */
const elementar: Gerador = (rng) => {
  const c = rng.int(2, 9)

  const casos = [
    { id: 'sen', f: 'sen(x)', certo: `${c}cos(x)`, errados: [`${c}sen(x)`, `-${c}cos(x)`, `${c}tg(x)`] },
    { id: 'cos', f: 'cos(x)', certo: `-${c}sen(x)`, errados: [`${c}sen(x)`, `-${c}cos(x)`, `${c}cos(x)`] },
    { id: 'exp', f: 'e^x', certo: `${c}e^x`, errados: [`e^x`, `${c}xe^(x-1)`, `${c}e^(x-1)`] },
    { id: 'ln', f: 'ln(x)', certo: `${c}/x`, errados: [`${c}x`, `1/x`, `${c}ln(x)`] },
    { id: 'tg', f: 'tg(x)', certo: `${c}sec²(x)`, errados: [`${c}cotg(x)`, `${c}sec(x)`, `-${c}sec²(x)`] },
  ] as const

  const caso = rng.pick(casos)
  return montar(rng, `elem:${caso.id}:${c}`, `d/dx ( ${c}·${caso.f} )`, caso.certo, [
    ...caso.errados,
  ])
}

const DEGRAUS: readonly (readonly Gerador[])[] = [[polinomio], [elementar], [binomio]]

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
    'Escolha a derivada certa entre as quatro opções.',
    'As erradas são os deslizes clássicos: não baixar o expoente, esquecer o fator.',
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
