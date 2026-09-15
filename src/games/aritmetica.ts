import type { Rng } from '@/core/rng'
import type { Exercicio, JogoGerador } from '@/core/types'

/**
 * Cálculo mental cronometrado.
 *
 * A escada começa no básico de verdade — soma e subtração de um dígito — e
 * acumula: o nível 4 continua sorteando somas simples, só que agora junto com
 * frações. Se cada nível substituísse o anterior, o jogo esqueceria a base, que
 * é justamente o que se quer manter afiado.
 *
 * Duas regras herdadas do `calculo-rapido` do qi-games, ambas por bom motivo:
 * divisão é montada a partir do produto (para ser sempre exata) e subtração não
 * dá resultado negativo nos níveis baixos (senão vira teste de regra de sinal,
 * não de cálculo).
 */

type Gerador = (rng: Rng) => Exercicio

/** Resposta inteira: aceita qualquer separador de milhar, exato via BigInt. */
function inteiro(chave: string, enunciado: string, resultado: number): Exercicio {
  return {
    tipo: 'digitado',
    chave,
    enunciado: { kind: 'texto', valor: enunciado },
    resposta: { tipo: 'inteiroGrande', valor: String(resultado) },
    gabarito: String(resultado),
    teclado: 'numerico',
  }
}

/** Chave que ignora a ordem dos operandos: 7×8 e 8×7 entediam igual. */
const chaveComutativa = (op: string, a: number, b: number) =>
  `${op}:${Math.min(a, b)}x${Math.max(a, b)}`

// --- nível 0: o básico ------------------------------------------------------

const soma1: Gerador = (rng) => {
  const a = rng.int(2, 9)
  const b = rng.int(2, 9)
  return inteiro(chaveComutativa('soma', a, b), `${a} + ${b}`, a + b)
}

const sub1: Gerador = (rng) => {
  const a = rng.int(5, 20)
  const b = rng.int(2, a - 1)
  return inteiro(`sub:${a}-${b}`, `${a} − ${b}`, a - b)
}

const tabuada: Gerador = (rng) => {
  const a = rng.int(2, 9)
  const b = rng.int(2, 9)
  return inteiro(chaveComutativa('mult', a, b), `${a} × ${b}`, a * b)
}

// --- nível 1: dois dígitos --------------------------------------------------

const soma2: Gerador = (rng) => {
  const a = rng.int(11, 99)
  const b = rng.int(11, 99)
  return inteiro(chaveComutativa('soma2', a, b), `${a} + ${b}`, a + b)
}

const sub2: Gerador = (rng) => {
  const a = rng.int(30, 99)
  const b = rng.int(11, a - 1)
  return inteiro(`sub2:${a}-${b}`, `${a} − ${b}`, a - b)
}

const divisaoExata: Gerador = (rng) => {
  // Montada a partir do produto: o resultado é inteiro por construção.
  const divisor = rng.int(2, 9)
  const quociente = rng.int(2, 12)
  const dividendo = divisor * quociente
  return inteiro(`div:${dividendo}/${divisor}`, `${dividendo} ÷ ${divisor}`, quociente)
}

// --- nível 2: multiplicação larga e quadrados -------------------------------

const mult2por1: Gerador = (rng) => {
  const a = rng.int(12, 99)
  const b = rng.int(3, 9)
  return inteiro(chaveComutativa('mult2', a, b), `${a} × ${b}`, a * b)
}

const quadradoPequeno: Gerador = (rng) => {
  const n = rng.int(11, 20)
  return inteiro(`quad:${n}`, `${n}²`, n * n)
}

// --- nível 3: porcentagem e quadrados grandes -------------------------------

const porcentagem: Gerador = (rng) => {
  const taxa = rng.pick([10, 15, 20, 25, 30, 40, 50, 75] as const)
  // O valor é múltiplo de 20 para a conta sempre fechar em inteiro.
  const valor = rng.int(2, 30) * 20
  return inteiro(`pct:${taxa}de${valor}`, `${taxa}% de ${valor}`, (valor * taxa) / 100)
}

const quadradoGrande: Gerador = (rng) => {
  const n = rng.int(21, 30)
  return inteiro(`quad:${n}`, `${n}²`, n * n)
}

// --- nível 4: frações -------------------------------------------------------

const mdc = (a: number, b: number): number => (b === 0 ? a : mdc(b, a % b))

const fracao: Gerador = (rng) => {
  const d1 = rng.pick([2, 3, 4, 5, 6, 8] as const)
  let d2 = rng.pick([2, 3, 4, 5, 6, 8] as const)
  if (d2 === d1) d2 = d1 === 2 ? 3 : 2

  const n1 = rng.int(1, d1 - 1)
  const n2 = rng.int(1, d2 - 1)

  const numerador = n1 * d2 + n2 * d1
  const denominador = d1 * d2
  const g = mdc(numerador, denominador)
  const num = numerador / g
  const den = denominador / g

  const canonica = den === 1 ? String(num) : `${num}/${den}`

  return {
    tipo: 'digitado',
    chave: `frac:${n1}/${d1}+${n2}/${d2}`,
    enunciado: { kind: 'texto', valor: `${n1}/${d1} + ${n2}/${d2}` },
    resposta: {
      tipo: 'texto',
      canonica,
      // A fração tem que vir simplificada; o que varia é só o espaçamento.
      aceitas: [canonica, canonica.replace('/', ' / ')],
      opcoes: { ignorarArtigos: false, tolerarTypo: false },
    },
    gabarito: canonica,
    teclado: 'texto',
  }
}

/**
 * Cada degrau acrescenta famílias sem tirar as anteriores. As do degrau atual
 * entram com peso triplo, senão a progressão some no meio do sorteio.
 */
const DEGRAUS: readonly (readonly Gerador[])[] = [
  [soma1, sub1, tabuada],
  [soma2, sub2, divisaoExata],
  [mult2por1, quadradoPequeno],
  [porcentagem, quadradoGrande],
  [fracao],
]

export const NIVEL_MAX = DEGRAUS.length - 1

export function gerarAritmetica(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), NIVEL_MAX)
  const antigos = DEGRAUS.slice(0, n).flat()
  const atuais = DEGRAUS[n] ?? []
  const disponiveis = [...antigos, ...atuais, ...atuais, ...atuais]
  return rng.pick(disponiveis)(rng)
}

export const aritmetica: JogoGerador = {
  id: 'aritmetica',
  mecanica: 'gerador',
  nome: 'Cálculo rápido',
  icone: '×',
  resumo: 'Do 7+8 às frações, contra o relógio. Cada acerto compra mais tempo.',
  categoria: 'matematica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Você começa com 60 segundos; cada acerto devolve 5, até o teto de 120.',
    'Errar não encerra a partida — só custa o tempo que passou.',
    'A dificuldade sobe sozinha conforme você acerta, sem abandonar o que é fácil.',
  ],
  config: () => ({
    gerar: gerarAritmetica,
    segundosIniciais: 60,
    bonusPorAcertoS: 5,
    tetoSegundos: 120,
    // Um degrau a cada oito acertos.
    escala: (acertos) => Math.min(NIVEL_MAX, Math.floor(acertos / 8)),
    teclado: 'numerico',
  }),
}
