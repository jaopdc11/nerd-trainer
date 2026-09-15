import { describe, expect, it } from 'vitest'
import { E_DECIMAIS, PHI_DECIMAIS, PI_DECIMAIS, RAIZ2_DECIMAIS } from './constantes-matematicas'

/**
 * Recomputa as constantes e confere contra o arquivo gerado.
 *
 * O ponto todo é usar caminhos DIFERENTES dos de `scripts/gen-constants.mjs`:
 * lá pi sai de Machin, aqui sai de Euler; lá √2 e φ saem de Newton, aqui são
 * conferidos pelas identidades x²=2 e φ²=φ+1, que não dependem de nenhuma
 * implementação de raiz. Um teste que rodasse o mesmo código do gerador só
 * provaria que o gerador é determinístico.
 *
 * Isto existe porque um dígito trocado no meio de pi ensinaria errado por meses
 * sem ninguém perceber — ninguém joga até a casa 600 tão cedo.
 */

const GUARDA = 25

function arctanInverso(x: number, unidade: bigint): bigint {
  const x2 = BigInt(x) * BigInt(x)
  let termo = unidade / BigInt(x)
  let soma = 0n
  let k = 0n
  while (termo !== 0n) {
    const parcela = termo / (2n * k + 1n)
    soma += k % 2n === 0n ? parcela : -parcela
    termo /= x2
    k += 1n
  }
  return soma
}

/** Euler: pi/4 = arctan(1/2) + arctan(1/3). O gerador usa Machin. */
function piPorEuler(unidade: bigint): bigint {
  return 4n * (arctanInverso(2, unidade) + arctanInverso(3, unidade))
}

function ePorTaylor(unidade: bigint): bigint {
  let termo = unidade
  let soma = 0n
  let k = 1n
  while (termo !== 0n) {
    soma += termo
    termo /= k
    k += 1n
  }
  return soma
}

const decimaisDe = (valor: bigint, casas: number): string => valor.toString().slice(1, 1 + casas)

/** Reconstrói o inteiro escalado a partir das casas decimais do arquivo. */
const escalado = (parteInteira: string, decimais: string): bigint =>
  BigInt(parteInteira + decimais)

describe('π', () => {
  it('bate com a série de Euler, dígito a dígito', () => {
    const casas = PI_DECIMAIS.length
    const unidade = 10n ** BigInt(casas + GUARDA)
    expect(decimaisDe(piPorEuler(unidade), casas)).toBe(PI_DECIMAIS)
  })

  it('tem as 50 primeiras casas conhecidas', () => {
    expect(PI_DECIMAIS.slice(0, 50)).toBe(
      '14159265358979323846264338327950288419716939937510',
    )
  })

  it('tem o ponto de Feynman nas casas 762 a 767', () => {
    // Seis noves seguidos. É a âncora humana clássica: se esta passar, o meio
    // do arquivo não foi mexido.
    expect(PI_DECIMAIS.slice(761, 767)).toBe('999999')
  })

  it('começa como Math.PI', () => {
    expect(`3.${PI_DECIMAIS}`.slice(0, 16)).toBe(Math.PI.toString().slice(0, 16))
  })

  it('tem exatamente 10 mil casas, todas dígitos', () => {
    expect(PI_DECIMAIS).toHaveLength(10_000)
    expect(PI_DECIMAIS).toMatch(/^\d+$/)
  })
})

describe('e', () => {
  it('bate com a série de Taylor', () => {
    const casas = E_DECIMAIS.length
    const unidade = 10n ** BigInt(casas + GUARDA)
    expect(decimaisDe(ePorTaylor(unidade), casas)).toBe(E_DECIMAIS)
  })

  it('tem as 30 primeiras casas conhecidas e casa com Math.E', () => {
    expect(E_DECIMAIS.slice(0, 30)).toBe('718281828459045235360287471352')
    expect(`2.${E_DECIMAIS}`.slice(0, 16)).toBe(Math.E.toString().slice(0, 16))
  })
})

describe('√2', () => {
  it('satisfaz x² = 2 — verificação independente de qualquer algoritmo de raiz', () => {
    const casas = RAIZ2_DECIMAIS.length
    const unidade = 10n ** BigInt(casas)
    const x = escalado('1', RAIZ2_DECIMAIS)

    // x é o truncamento de √2·unidade, então x² ≤ 2·unidade² < (x+1)².
    expect(x * x).toBeLessThanOrEqual(2n * unidade * unidade)
    expect((x + 1n) * (x + 1n)).toBeGreaterThan(2n * unidade * unidade)
  })

  it('tem as 30 primeiras casas conhecidas', () => {
    expect(RAIZ2_DECIMAIS.slice(0, 30)).toBe('414213562373095048801688724209')
  })
})

describe('φ', () => {
  it('satisfaz φ² = φ + 1 dentro do erro de truncamento', () => {
    const casas = PHI_DECIMAIS.length
    const unidade = 10n ** BigInt(casas)
    const x = escalado('1', PHI_DECIMAIS)

    // φ² − φ − 1 = 0. Com x truncado, x²/unidade fica a no máximo poucas
    // unidades da última casa de (x + unidade).
    const erro = (x * x) / unidade - (x + unidade)
    expect(erro >= -3n && erro <= 3n).toBe(true)
  })

  it('tem as 30 primeiras casas conhecidas', () => {
    expect(PHI_DECIMAIS.slice(0, 30)).toBe('618033988749894848204586834365')
  })
})

describe('todas as constantes', () => {
  it('têm só dígitos e o comprimento declarado', () => {
    for (const [nome, d, esperado] of [
      ['e', E_DECIMAIS, 2_000],
      ['phi', PHI_DECIMAIS, 2_000],
      ['raiz2', RAIZ2_DECIMAIS, 2_000],
    ] as const) {
      expect(d, nome).toMatch(/^\d+$/)
      expect(d.length, nome).toBe(esperado)
    }
  })
})
