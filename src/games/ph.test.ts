import { describe, expect, it } from 'vitest'
import { interpretarNumero, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Exercicio } from '@/core/types'
import { gerarPh, ph } from './ph'

const ESTRITO = { rigor: 'estrito' } as const
const NIVEL_MAX = 2

function amostra(nivel: number, quantos = 300): Exercicio[] {
  return Array.from({ length: quantos }, (_, i) => gerarPh(mulberry32(i + 1), nivel))
}

/** O número que o gabarito representa, lido pelo mesmo interpretador do jogo. */
function valorDe(texto: string): number {
  const lido = interpretarNumero(texto)
  expect(lido, `"${texto}" não é número`).not.toBeNull()
  const { mantissa, expoente } = lido as NonNullable<typeof lido>
  return Number(`${mantissa[0]}.${mantissa.slice(1) || '0'}e${expoente}`)
}

describe('gerador de pH', () => {
  it('produz gabarito que passa no próprio validador, em todo nível', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(nivel)) {
        if (e.tipo !== 'digitado') throw new Error(`${e.chave} devia ser digitado`)
        expect(validar(e.gabarito, e.resposta, ESTRITO).veredito, `${e.chave} → ${e.gabarito}`).toBe(
          'certo',
        )
      }
    }
  })

  it('recusa a resposta vizinha: o meio-passo não é detalhe', () => {
    // pH 9,5 com "9" digitado tem a ordem de grandeza certa e é outra resposta.
    const meios = amostra(1, 400).filter((e) => e.chave.endsWith('m'))
    expect(meios.length).toBeGreaterThan(0)

    for (const e of meios.slice(0, 20)) {
      if (e.tipo !== 'digitado') continue
      const inteiro = e.gabarito.split(',')[0] as string
      expect(validar(inteiro, e.resposta, ESTRITO).veredito, `${e.gabarito} vs ${inteiro}`).not.toBe(
        'certo',
      )
    }
  })

  it('aceita as três grafias da concentração', () => {
    // "1e-5", "10⁻⁵" e "0,00001" são a mesma resposta — é o que o jogo promete
    // no comoJogar, e o que justifica a resposta ser digitada.
    // '10⁻', com o expoente: o gabarito '10' existe e é um pH, não uma potência.
    const conc = amostra(2, 400).filter((e) => e.gabarito.startsWith('10⁻'))
    expect(conc.length).toBeGreaterThan(0)

    for (const e of conc.slice(0, 20)) {
      if (e.tipo !== 'digitado') continue
      const expoente = Math.round(Math.log10(valorDe(e.gabarito)))
      for (const forma of [`1e${expoente}`, `10^${expoente}`, e.gabarito]) {
        expect(validar(forma, e.resposta, ESTRITO).veredito, `${e.chave}: ${forma}`).toBe('certo')
      }
    }
  })

  it('pH e pOH somam 14 em todo item que pede pOH', () => {
    // A relação é a coisa que o jogo mede: se ela quebrar, o jogo virou outro.
    for (const e of amostra(NIVEL_MAX, 400)) {
      const pedido = e.enunciado.valor.match(/^pH = ([\d,]+) → pOH$/)
      if (!pedido) continue
      expect(valorDe(pedido[1] as string) + valorDe(e.gabarito), e.chave).toBeCloseTo(14, 9)
    }
  })

  it('a concentração e o pH são o expoente um do outro', () => {
    for (const e of amostra(0, 400)) {
      const pedido = e.enunciado.valor.match(/^\[H⁺\] = 10⁻(.+) → pH$/)
      if (!pedido) continue
      // O enunciado traz o expoente em sobrescrito; o gabarito, em algarismo.
      const expoente = [...(pedido[1] as string)]
        .map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))
        .join('')
      expect(e.gabarito, e.chave).toBe(expoente)
    }
  })

  it('a diluição nunca atravessa o 7', () => {
    // Diluir ácido não faz base. Um sorteio que passasse do neutro ensinaria
    // química falsa, e é o tipo de coisa que só aparece numa ponta do intervalo.
    const diluicoes = amostra(NIVEL_MAX, 600).filter((e) => e.chave.startsWith('ph:dil:'))
    expect(diluicoes.length).toBeGreaterThan(0)
    for (const e of diluicoes) {
      expect(valorDe(e.gabarito), e.chave).toBeLessThanOrEqual(7)
    }
  })

  it('escreve o menos tipográfico e a vírgula decimal, nunca o hífen e o ponto', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(nivel, 200)) {
        for (const texto of [e.enunciado.valor, e.gabarito, e.porque ?? '']) {
          expect(texto, `${e.chave}: ${texto}`).not.toMatch(/-/)
          expect(texto, `${e.chave}: ${texto}`).not.toMatch(/\d\.\d/)
        }
      }
    }
  })

  it('explica a resposta nos itens de duas pernas, e só neles', () => {
    const comExplicacao = amostra(NIVEL_MAX, 200).filter((e) => e.porque !== undefined)
    expect(comExplicacao.length).toBeGreaterThan(0)
    for (const e of amostra(0, 200)) {
      expect(e.porque, e.chave).toBeUndefined()
    }
  })

  it('acumula os níveis em vez de substituí-los', () => {
    const chaves = amostra(NIVEL_MAX, 400).map((e) => e.chave)
    expect(chaves.some((c) => c.startsWith('ph:dil:') || c.startsWith('ph:de-oh:'))).toBe(true)
    expect(chaves.some((c) => c.startsWith('ph:de-h:') || c.startsWith('ph:poh:'))).toBe(true)
  })

  it('o nível 0 só pede a definição — nada de concentração como resposta', () => {
    for (const e of amostra(0, 200)) {
      expect(e.gabarito, e.chave).toMatch(/^\d+$/)
    }
  })
})

describe('jogo', () => {
  it('pede teclado de texto: metade das respostas precisa de vírgula e expoente', () => {
    expect(ph.config().teclado).toBe('texto')
    for (const e of amostra(NIVEL_MAX, 100)) {
      if (e.tipo !== 'digitado') continue
      expect(e.teclado, e.chave).toBe('texto')
    }
  })

  it('a escala chega ao último degrau e para lá', () => {
    const { escala } = ph.config()
    expect(escala(0)).toBe(0)
    expect(escala(1000)).toBe(NIVEL_MAX)
  })
})
