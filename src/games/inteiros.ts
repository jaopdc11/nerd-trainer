import type { JogoSequencia } from '@/core/types'

/**
 * Sequências de inteiros, geradas sob demanda.
 *
 * Duas regras valem para as três:
 *
 * 1. **Geração preguiçosa.** O `registry` importa todos os jogos, então calcular
 *    dez mil primos no topo do módulo travaria a abertura do menu inteiro por
 *    causa de um jogo que talvez ninguém abra. O cache cresce conforme o jogador
 *    avança.
 * 2. **BigInt onde o valor passa de 2⁵³.** `Number` não lança erro ao estourar,
 *    ele arredonda em silêncio: `String(2**64)` devolve 18446744073709552000,
 *    quando o certo é ...551616. Um jogo de memorização que ensina o dígito
 *    errado porque ele mesmo calculou errado é o pior defeito possível aqui.
 */

// --- primos ----------------------------------------------------------------

const TOTAL_PRIMOS = 10_000

let limiteCrivo = 1_000
let primos: number[] = crivo(limiteCrivo)

/** Crivo de Eratóstenes até `limite`. Dez mil primos saem em ~8 ms. */
function crivo(limite: number): number[] {
  const composto = new Uint8Array(limite + 1)
  const saida: number[] = []
  for (let n = 2; n <= limite; n++) {
    if (composto[n]) continue
    saida.push(n)
    for (let m = n * n; m <= limite; m += n) composto[m] = 1
  }
  return saida
}

function primoEm(i: number): string | null {
  if (i >= TOTAL_PRIMOS) return null
  while (i >= primos.length) {
    limiteCrivo *= 2
    primos = crivo(limiteCrivo)
  }
  return String(primos[i])
}

// --- Fibonacci --------------------------------------------------------------

const TOTAL_FIBONACCI = 300

// Começa em 1, 1 — é como se recita a sequência, embora a definição formal
// comece em F₀ = 0.
const fibonacci: bigint[] = [1n, 1n]

function fibonacciEm(i: number): string | null {
  if (i >= TOTAL_FIBONACCI) return null
  while (i >= fibonacci.length) {
    const n = fibonacci.length
    // F(79) já passa de 2⁵³: daqui para a frente `Number` mentiria.
    fibonacci.push((fibonacci[n - 1] as bigint) + (fibonacci[n - 2] as bigint))
  }
  return (fibonacci[i] as bigint).toString()
}

// --- potências de 2 ---------------------------------------------------------

const TOTAL_POTENCIAS = 65 // 2⁰ até 2⁶⁴

const potencias: string[] = []

function potenciaEm(i: number): string | null {
  if (i >= TOTAL_POTENCIAS) return null
  return (potencias[i] ??= (2n ** BigInt(i)).toString())
}

// --- os jogos ---------------------------------------------------------------

export const primosJogo: JogoSequencia = {
  id: 'primos',
  mecanica: 'sequencia',
  nome: 'Primos em ordem',
  icone: '2·3·5',
  resumo: 'De 2 em diante, sem pular nenhum. Dez mil deles esperando.',
  categoria: 'matematica',
  unidade: { singular: 'primo', plural: 'primos' },
  comoJogar: [
    'Digite os primos em ordem: 2, 3, 5, 7, 11…',
    'Confirme cada um com Enter.',
    'Um erro encerra a partida.',
  ],
  config: () => ({
    itemEm: primoEm,
    total: TOTAL_PRIMOS,
    entrada: 'termo',
    teclado: 'numerico',
    separador: ', ',
    agrupar: 10,
    revisaoPosMorte: 8,
  }),
}

export const fibonacciJogo: JogoSequencia = {
  id: 'fibonacci',
  mecanica: 'sequencia',
  nome: 'Fibonacci',
  icone: '🌀',
  resumo: 'Cada termo é a soma dos dois anteriores. Vira número gigante rápido.',
  categoria: 'matematica',
  unidade: { singular: 'termo', plural: 'termos' },
  comoJogar: [
    'Comece em 1, 1 e siga somando os dois últimos.',
    'Confirme cada termo com Enter.',
    'Pode usar ponto ou espaço como separador de milhar — ou nenhum.',
  ],
  config: () => ({
    itemEm: fibonacciEm,
    total: TOTAL_FIBONACCI,
    entrada: 'termo',
    teclado: 'numerico',
    separador: ', ',
    agrupar: 6,
    revisaoPosMorte: 6,
  }),
}

export const potencias2Jogo: JogoSequencia = {
  id: 'potencias-2',
  mecanica: 'sequencia',
  nome: 'Potências de 2',
  icone: '2ⁿ',
  resumo: 'De 2⁰ a 2⁶⁴. As oito primeiras são fáceis; depois começa o serviço.',
  categoria: 'matematica',
  unidade: { singular: 'potência', plural: 'potências' },
  comoJogar: [
    'Digite 1, 2, 4, 8, 16… até 2⁶⁴.',
    'Confirme cada uma com Enter.',
    'Separador de milhar é opcional e é ignorado.',
  ],
  config: () => ({
    itemEm: potenciaEm,
    total: TOTAL_POTENCIAS,
    entrada: 'termo',
    teclado: 'numerico',
    separador: ', ',
    agrupar: 5,
    revisaoPosMorte: 5,
  }),
}
