import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Exercicio } from '@/core/types'
import { gerarAritmetica, NIVEL_MAX } from './aritmetica'
import { gerarDerivada } from './derivadas-rapidas'
import { gerarOrdemDeGrandeza, normalizar } from './ordem-grandeza'

const ESTRITO = { rigor: 'estrito' } as const

/** O gabarito de um exercício tem que passar pelo próprio validador dele. */
function gabaritoPassa(e: Exercicio): boolean {
  return validar(e.gabarito, e.resposta, ESTRITO).veredito === 'certo'
}

function amostra(
  gerar: (rng: ReturnType<typeof mulberry32>, nivel: number) => Exercicio,
  nivel: number,
  quantos = 300,
): Exercicio[] {
  return Array.from({ length: quantos }, (_, i) => gerar(mulberry32(i + 1), nivel))
}

describe('normalizar (notação científica)', () => {
  it('põe um dígito antes da vírgula e ajusta o expoente', () => {
    expect(normalizar(42, 3)).toEqual({ mantissa: '42', expoente: 4 })
    expect(normalizar(6, -3)).toEqual({ mantissa: '6', expoente: -3 })
    expect(normalizar(100, 0)).toEqual({ mantissa: '1', expoente: 2 })
    expect(normalizar(9999, -9)).toEqual({ mantissa: '9999', expoente: -6 })
  })
})

describe('gerador de aritmética', () => {
  it('produz gabarito que passa no próprio validador, em todo nível', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(gerarAritmetica, nivel, 200)) {
        expect(gabaritoPassa(e), `${e.chave} → ${e.gabarito}`).toBe(true)
      }
    }
  })

  it('nunca gera divisão inexata nem exercício degenerado', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(gerarAritmetica, nivel, 200)) {
        const texto = e.enunciado.valor

        const divisao = texto.match(/^(\d+) ÷ (\d+)$/)
        if (divisao) {
          expect(Number(divisao[1]) % Number(divisao[2]), texto).toBe(0)
        }

        // Nada de ×1, +0 ou a−a: são jogadas de graça.
        expect(texto, texto).not.toMatch(/(^|\s)[×+−]\s*[01](\s|$)/)
        expect(texto).not.toMatch(/^(\d+) − \1$/)

        // Subtração nunca dá negativo — vira teste de sinal, não de cálculo.
        const sub = texto.match(/^(\d+) − (\d+)$/)
        if (sub) expect(Number(sub[1])).toBeGreaterThan(Number(sub[2]))
      }
    }
  })

  it('acumula os níveis em vez de substituí-los', () => {
    // No topo da escada ainda tem que cair conta básica de vez em quando.
    const chaves = amostra(gerarAritmetica, NIVEL_MAX, 400).map((e) => e.chave)
    expect(chaves.some((c) => c.startsWith('frac:'))).toBe(true)
    expect(chaves.some((c) => c.startsWith('soma:') || c.startsWith('mult:'))).toBe(true)
  })

  it('aceita a resposta certa e recusa a errada', () => {
    const e = amostra(gerarAritmetica, 0, 1)[0] as Exercicio
    expect(validar(e.gabarito, e.resposta, ESTRITO).veredito).toBe('certo')
    expect(validar('999999', e.resposta, ESTRITO).veredito).toBe('errado')
  })
})

describe('gerador de ordem de grandeza', () => {
  it('produz gabarito que passa no próprio validador', () => {
    for (let nivel = 0; nivel <= 2; nivel++) {
      for (const e of amostra(gerarOrdemDeGrandeza, nivel)) {
        expect(gabaritoPassa(e), `${e.chave} → ${e.gabarito}`).toBe(true)
      }
    }
  })

  it('aceita as três grafias equivalentes da mesma resposta', () => {
    const e = amostra(gerarOrdemDeGrandeza, 0, 1)[0] as Exercicio
    if (e.resposta.tipo !== 'numero') throw new Error('esperava resposta numérica')

    const { mantissa, expoente } = e.resposta
    const cabeca = mantissa.length > 1 ? `${mantissa[0]},${mantissa.slice(1)}` : mantissa
    const comPonto = cabeca.replace(',', '.')

    for (const forma of [`${cabeca}e${expoente}`, `${comPonto}e${expoente}`, e.gabarito]) {
      expect(validar(forma, e.resposta, ESTRITO).veredito, forma).toBe('certo')
    }
  })

  it('separa erro de expoente de erro de mantissa', () => {
    const e = amostra(gerarOrdemDeGrandeza, 0, 1)[0] as Exercicio
    if (e.resposta.tipo !== 'numero') throw new Error('esperava resposta numérica')

    const errado = { ...e.resposta, expoente: e.resposta.expoente + 3 }
    expect(validar(e.gabarito, errado, ESTRITO).motivo).toBe('expoente-errado')
  })
})

describe('gerador de derivadas', () => {
  it('produz gabarito que passa no próprio validador', () => {
    for (let nivel = 0; nivel <= 2; nivel++) {
      for (const e of amostra(gerarDerivada, nivel)) {
        expect(gabaritoPassa(e), `${e.chave} → ${e.gabarito}`).toBe(true)
      }
    }
  })

  it('aceita as grafias alternativas que ele declarou', () => {
    for (const e of amostra(gerarDerivada, 2, 100)) {
      if (e.resposta.tipo !== 'texto') continue
      for (const forma of e.resposta.aceitas) {
        expect(validar(forma, e.resposta, ESTRITO).veredito, `${e.chave}: ${forma}`).toBe('certo')
      }
    }
  })
})

describe('chaves de anti-repetição', () => {
  it('tratam 7×8 e 8×7 como o mesmo exercício', () => {
    // A chave normaliza a ordem: sem isso, a janela anti-repetição deixaria a
    // mesma conta voltar invertida e o jogador sentiria a repetição.
    const chaves = amostra(gerarAritmetica, 0, 500)
      .filter((e) => e.chave.startsWith('mult:'))
      .map((e) => e.chave)
    for (const chave of chaves) {
      const [, par] = chave.split(':')
      const [a, b] = (par ?? '').split('x').map(Number)
      expect(a).toBeLessThanOrEqual(b as number)
    }
  })
})
