import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Exercicio } from '@/core/types'
import { gerarAritmetica, NIVEL_MAX } from './aritmetica'
import { gerarDerivada } from './derivadas-rapidas'
import { gerarOrdemDeGrandeza, normalizar } from './ordem-grandeza'

const ESTRITO = { rigor: 'estrito' } as const

/**
 * O gabarito tem que passar pelo próprio julgamento do exercício: no digitado,
 * pelo validador; no de escolha, o índice correto tem que apontar para ele.
 */
function gabaritoPassa(e: Exercicio): boolean {
  return e.tipo === 'digitado'
    ? validar(e.gabarito, e.resposta, ESTRITO).veredito === 'certo'
    : e.alternativas[e.indiceCorreto]?.valor === e.gabarito
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
    if (e.tipo !== 'digitado') throw new Error('aritmética é digitada')
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
    if (e.tipo !== 'digitado' || e.resposta.tipo !== 'numero') {
      throw new Error('esperava resposta numérica digitada')
    }

    const { mantissa, expoente } = e.resposta
    const cabeca = mantissa.length > 1 ? `${mantissa[0]},${mantissa.slice(1)}` : mantissa
    const comPonto = cabeca.replace(',', '.')

    for (const forma of [`${cabeca}e${expoente}`, `${comPonto}e${expoente}`, e.gabarito]) {
      expect(validar(forma, e.resposta, ESTRITO).veredito, forma).toBe('certo')
    }
  })

  it('separa erro de expoente de erro de mantissa', () => {
    const e = amostra(gerarOrdemDeGrandeza, 0, 1)[0] as Exercicio
    if (e.tipo !== 'digitado' || e.resposta.tipo !== 'numero') {
      throw new Error('esperava resposta numérica digitada')
    }

    const errado = { ...e.resposta, expoente: e.resposta.expoente + 3 }
    expect(validar(e.gabarito, errado, ESTRITO).motivo).toBe('expoente-errado')
  })
})

describe('gerador de derivadas', () => {
  it('sempre produz quatro alternativas, com a certa entre elas', () => {
    for (let nivel = 0; nivel <= 2; nivel++) {
      for (const e of amostra(gerarDerivada, nivel)) {
        if (e.tipo !== 'escolha') throw new Error(`${e.chave} devia ser de escolha`)
        expect(e.alternativas, e.chave).toHaveLength(4)
        expect(e.alternativas[e.indiceCorreto]?.valor, e.chave).toBe(e.gabarito)
      }
    }
  })

  it('nunca repete uma alternativa dentro do mesmo exercício', () => {
    // Duas opções idênticas dariam duas respostas certas, ou uma pista de graça.
    for (let nivel = 0; nivel <= 2; nivel++) {
      for (const e of amostra(gerarDerivada, nivel)) {
        if (e.tipo !== 'escolha') continue
        const valores = e.alternativas.map((a) => a.valor)
        expect(new Set(valores).size, `${e.chave}: ${valores.join(' | ')}`).toBe(4)
      }
    }
  })

  it('oferece o erro clássico de não baixar o expoente', () => {
    // d/dx(6x⁶) = 36x⁵, e 36x⁶ tem que estar lá — é o deslize que o item cobra.
    const comPolinomio = amostra(gerarDerivada, 0, 100).filter((e) =>
      e.chave.startsWith('poli:'),
    )
    expect(comPolinomio.length).toBeGreaterThan(0)

    let achou = 0
    for (const e of comPolinomio) {
      if (e.tipo !== 'escolha') continue
      const expoenteDoGabarito = e.gabarito.match(/x(.*)$/)?.[1] ?? ''
      const temExpoenteMaior = e.alternativas.some(
        (a) => a.valor !== e.gabarito && a.valor.startsWith(e.gabarito.replace(/x.*$/, 'x')),
      )
      if (temExpoenteMaior || expoenteDoGabarito) achou++
    }
    expect(achou).toBeGreaterThan(0)
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
