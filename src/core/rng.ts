/**
 * RNG determinístico do projeto, portado do `qi-games`.
 *
 * Regra do núcleo: nenhum jogo chama `Math.random()`. Sem semente, um gerador
 * de exercício não pode ser testado — e "esse sorteio caiu mal" deixa de ser
 * reproduzível no momento em que você tenta investigar.
 */

export interface Rng {
  /** Float em [0, 1). */
  next(): number
  /** Inteiro em [min, max], inclusive nas duas pontas. */
  int(min: number, max: number): number
  /** Elemento aleatório; lança se o array estiver vazio. */
  pick<T>(items: readonly T[]): T
  /** Cópia embaralhada (Fisher-Yates); não muta a entrada. */
  shuffle<T>(items: readonly T[]): T[]
  /** `true` com probabilidade `p`. */
  chance(p: number): boolean
}

/**
 * mulberry32: gerador de 32 bits, rápido, com estado de um único inteiro —
 * suficiente para sorteio de exercício e trivial de reproduzir a partir da seed.
 */
export function mulberry32(seed: number): Rng {
  // `>>> 0` mantém o estado como inteiro sem sinal de 32 bits, inclusive para
  // seeds negativas ou fracionárias vindas de um hash.
  let state = seed >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number): number => {
    if (max < min) throw new Error(`rng.int: intervalo inválido (${min}..${max})`)
    return min + Math.floor(next() * (max - min + 1))
  }

  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('rng.pick: array vazio')
      return items[int(0, items.length - 1)] as T
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copia = [...items]
      for (let i = copia.length - 1; i > 0; i--) {
        const j = int(0, i)
        ;[copia[i], copia[j]] = [copia[j] as T, copia[i] as T]
      }
      return copia
    },
    chance(p: number): boolean {
      return next() < p
    },
  }
}

/** Seed nova a cada partida — o jogo não tem desafio diário. */
export function seedAleatoria(): number {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0
}
