import type { Rng } from '@/core/rng'
import type { Exercicio, JogoGerador } from '@/core/types'

/**
 * Notação científica e ordem de grandeza.
 *
 * A resposta é julgada por algarismos significativos, não por igualdade de
 * string: "6e-3", "6×10⁻³" e "0,006" são a mesma resposta e as três passam.
 * O que o jogo separa é acertar a mantissa e errar o expoente — erro conceitual
 * diferente, e o validador devolve uma mensagem própria para ele.
 *
 * Internamente tudo é um par (inteiro, expoente); a normalização acontece só na
 * borda, ao exibir e ao montar a resposta. Foi a segunda tentativa: fazer a
 * conta já normalizada espalha ±1 no expoente por toda parte e erra em silêncio.
 */

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const

function sobrescrito(n: number): string {
  const corpo = [...Math.abs(n).toString()].map((d) => SUP[Number(d)] ?? '').join('')
  return n < 0 ? `⁻${corpo}` : corpo
}

interface Cientifico {
  /** Dígitos significativos, sem zero à direita: 4200 vira "42". */
  readonly mantissa: string
  readonly expoente: number
}

/** (inteiro, expoente) → forma normalizada d,ddd × 10^e. */
export function normalizar(inteiro: number, expoente: number): Cientifico {
  const digitos = String(inteiro)
  const semZeros = digitos.replace(/0+$/, '') || '0'
  return { mantissa: semZeros, expoente: expoente + digitos.length - 1 }
}

function exibir({ mantissa, expoente }: Cientifico): string {
  const cabeca = mantissa.length > 1 ? `${mantissa[0]},${mantissa.slice(1)}` : mantissa
  return expoente === 0 ? cabeca : `${cabeca}×10${sobrescrito(expoente)}`
}

function exercicio(chave: string, enunciado: string, alvo: Cientifico): Exercicio {
  return {
    chave,
    enunciado: { kind: 'texto', valor: enunciado },
    resposta: {
      tipo: 'numero',
      mantissa: alvo.mantissa,
      expoente: alvo.expoente,
      sigMin: alvo.mantissa.length,
    },
    gabarito: exibir(alvo),
    teclado: 'texto',
  }
}

type Gerador = (rng: Rng) => Exercicio

/** (x×10^px) × (y×10^py) */
const produto: Gerador = (rng) => {
  const x = rng.int(2, 9)
  const y = rng.int(2, 9)
  const px = rng.int(-9, 12)
  const py = rng.int(-9, 12)

  const a = normalizar(x, px)
  const b = normalizar(y, py)
  return exercicio(
    `prod:${x}e${px}x${y}e${py}`,
    `${exibir(a)} × ${exibir(b)}`,
    normalizar(x * y, px + py),
  )
}

/** Montado a partir do produto, para o quociente ser sempre exato. */
const quociente: Gerador = (rng) => {
  const y = rng.int(2, 9)
  const r = rng.int(2, 9)
  const x = y * r
  const px = rng.int(-6, 12)
  const py = rng.int(-6, 12)

  return exercicio(
    `quoc:${x}e${px}/${y}e${py}`,
    `${exibir(normalizar(x, px))} ÷ ${exibir(normalizar(y, py))}`,
    normalizar(r, px - py),
  )
}

/** Dado um número fora da forma normalizada, escrevê-lo normalizado. */
const normalizacao: Gerador = (rng) => {
  const inteiro = rng.int(11, 9999)
  const expoente = rng.int(-9, 9)
  return exercicio(
    `norm:${inteiro}e${expoente}`,
    `${inteiro}×10${sobrescrito(expoente)} em notação científica`,
    normalizar(inteiro, expoente),
  )
}

const DEGRAUS: readonly (readonly Gerador[])[] = [[produto], [normalizacao], [quociente]]

export function gerarOrdemDeGrandeza(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), DEGRAUS.length - 1)
  const atuais = DEGRAUS[n] ?? []
  return rng.pick([...DEGRAUS.slice(0, n).flat(), ...atuais, ...atuais])(rng)
}

export const ordemDeGrandeza: JogoGerador = {
  id: 'ordem-de-grandeza',
  mecanica: 'gerador',
  nome: 'Ordem de grandeza',
  icone: '10ⁿ',
  resumo: 'Notação científica de cabeça: multiplicar, dividir e normalizar expoentes.',
  categoria: 'fisica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Responda em notação científica: "6e-3", "6×10⁻³" ou "0,006" valem igual.',
    'Vírgula ou ponto decimal, tanto faz.',
    'Errar só o expoente conta como erro, mas o jogo diz que foi a ordem de grandeza.',
  ],
  config: () => ({
    gerar: gerarOrdemDeGrandeza,
    segundosIniciais: 60,
    bonusPorAcertoS: 6,
    tetoSegundos: 120,
    escala: (acertos) => Math.min(2, Math.floor(acertos / 6)),
    teclado: 'texto',
  }),
}
