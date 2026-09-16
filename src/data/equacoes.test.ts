import { describe, expect, it } from 'vitest'
import {
  EQUACOES,
  balancear,
  balanco,
  confere,
  distratores,
  exibirConjunto,
  exibirEquacao,
} from './equacoes'
import type { Equacao } from './equacoes'

/**
 * O gabarito, escrito à mão.
 *
 * `balancear()` resolve o sistema sozinho, e é por isso mesmo que ele não pode
 * se autoaprovar: uma composição errada no dataset (um `O` a menos, uma carga
 * trocada de sinal) devolve um conjunto de inteiros perfeitamente plausível, e o
 * jogo passa a ensinar que a combustão do propano precisa de 6 oxigênios. Estes
 * números foram feitos no papel, equação por equação, não copiados da saída.
 */
const GABARITO: Readonly<Record<string, readonly number[]>> = {
  // nível 0
  agua: [2, 1, 2],
  amonia: [1, 3, 2],
  sal: [2, 1, 2],
  magnesio: [2, 1, 2],
  metano: [1, 2, 1, 2],
  peroxido: [2, 2, 1],
  'trioxido-enxofre': [2, 1, 2],
  'oxido-nitrico': [1, 1, 2],
  'cloreto-aluminio': [2, 3, 2],
  'monoxido-carbono': [2, 1, 2],
  'acido-cloridrico': [1, 1, 2],

  // nível 1
  propano: [1, 5, 3, 4],
  pentano: [1, 8, 5, 6],
  etanol: [1, 3, 2, 3],
  glicose: [1, 6, 6, 6],
  'alto-forno': [1, 3, 2, 3],
  clorato: [2, 2, 3],
  fosforo: [1, 5, 1],
  'nitreto-litio': [6, 1, 2],
  neutralizacao: [2, 1, 1, 2],
  'zinco-acido': [1, 2, 1, 1],
  'prata-cobre': [2, 1, 1, 2],

  // nível 2
  butano: [2, 13, 8, 10],
  etano: [2, 7, 4, 6],
  benzeno: [2, 15, 12, 6],
  octano: [2, 25, 16, 18],
  acetileno: [2, 5, 4, 2],
  ostwald: [4, 5, 4, 6],
  'amonia-queima': [4, 3, 2, 6],
  pirita: [4, 11, 2, 8],
  alumina: [4, 3, 2],
  'aluminio-acido': [2, 6, 2, 3],
}

const de = (id: string): Equacao => EQUACOES.find((q) => q.id === id) as Equacao

// ---------------------------------------------------------------------------
// Leitor de fórmula — a segunda opinião sobre a composição
// ---------------------------------------------------------------------------

/**
 * 'C₂H₅OH' → C₂ H₅ O H; 'Zn²⁺' → carga +2.
 *
 * Mora no teste de propósito. O dataset declara a composição **e** a fórmula, e
 * as duas são a mesma informação escrita de dois jeitos — o que só serve para
 * alguma coisa se alguém confere que elas batem. Se este leitor morasse em
 * `equacoes.ts` e a composição saísse dele, não haveria segunda opinião
 * nenhuma: um erro de digitação na fórmula viraria uma composição errada
 * coerente consigo mesma, exatamente o que o arquivo inteiro tenta evitar.
 */
const SUBSCRITO = '₀₁₂₃₄₅₆₇₈₉'
const SUPERSCRITO = '⁰¹²³⁴⁵⁶⁷⁸⁹'

function digitos(texto: string, tabela: string): number {
  return Number([...texto].map((c) => tabela.indexOf(c)).join(''))
}

function lerFormula(formula: string): { atomos: Map<string, number>; carga: number } {
  const sinal = formula.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/)
  const corpo = sinal ? formula.slice(0, sinal.index) : formula
  const modulo = !sinal ? 0 : sinal[1] === '' ? 1 : digitos(sinal[1] as string, SUPERSCRITO)
  const carga = !sinal ? 0 : sinal[2] === '⁺' ? modulo : -modulo

  const atomos = new Map<string, number>()
  let lido = ''
  for (const m of corpo.matchAll(/([A-Z][a-z]?)([₀₁₂₃₄₅₆₇₈₉]*)/g)) {
    lido += m[0]
    const simbolo = m[1] as string
    const quantos = m[2] === '' ? 1 : digitos(m[2] as string, SUBSCRITO)
    atomos.set(simbolo, (atomos.get(simbolo) ?? 0) + quantos)
  }

  // Sobrou caractere que o leitor não entendeu: parênteses, hidratação, ponto.
  // Melhor falhar do que conferir metade da fórmula e dar tudo certo.
  expect(lido, `${formula}: o leitor do teste não dá conta desta fórmula`).toBe(corpo)
  return { atomos, carga }
}

describe('balancear', () => {
  it('bate com o gabarito conferido à mão, equação por equação', () => {
    for (const eq of EQUACOES) {
      const esperado = GABARITO[eq.id]
      expect(esperado, `${eq.id} não está no gabarito do teste`).toBeDefined()
      expect(balancear(eq), `${eq.id}: ${exibirEquacao(eq)}`).toEqual(esperado)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual(EQUACOES.map((eq) => eq.id).sort())
  })

  it('conserva átomo e carga em todas as equações do dataset', () => {
    for (const eq of EQUACOES) {
      const coeficientes = balancear(eq)
      for (const b of balanco(eq, coeficientes)) {
        expect(
          b.esquerda,
          `${eq.id} (${exibirEquacao(eq)} · ${exibirConjunto(coeficientes)}): ${b.nome} não fecha`,
        ).toBe(b.direita)
      }
    }
  })

  it('devolve o MENOR conjunto: nenhum divisor comum sobrando', () => {
    // Sem isto, 4H₂ + 2O₂ → 4H₂O passaria — e é justamente o distrator nº 2.
    for (const eq of EQUACOES) {
      const coeficientes = balancear(eq)
      for (const d of [2, 3, 5, 7]) {
        expect(
          coeficientes.every((c) => c % d === 0),
          `${eq.id}: dá para dividir tudo por ${d}`,
        ).toBe(false)
      }
    }
  })

  it('a composição declarada bate com a fórmula escrita', () => {
    for (const eq of EQUACOES) {
      for (const especie of [...eq.reagentes, ...eq.produtos]) {
        const lido = lerFormula(especie.formula)

        const declarado = new Map<string, number>()
        for (const [simbolo, n] of especie.atomos) {
          declarado.set(simbolo, (declarado.get(simbolo) ?? 0) + n)
        }

        expect(
          [...declarado.entries()].sort(),
          `${eq.id}/${especie.formula}: composição diferente da fórmula`,
        ).toEqual([...lido.atomos.entries()].sort())
        expect(especie.carga ?? 0, `${eq.id}/${especie.formula}: carga`).toBe(lido.carga)
      }
    }
  })
})

describe('dataset', () => {
  it('nenhum id repetido', () => {
    const ids = EQUACOES.map((eq) => eq.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('fórmulas em Unicode, sem dígito ASCII e sem parêntese', () => {
    // Parêntese é proibido porque o leitor do teste não sabe abrir Ca(OH)₂, e
    // uma fórmula que ele não sabe ler é uma composição que ninguém confere.
    for (const eq of EQUACOES) {
      for (const especie of [...eq.reagentes, ...eq.produtos]) {
        expect(especie.formula, especie.formula).not.toMatch(/[\d()]/)
      }
    }
  })

  it('nenhuma equação tem todos os coeficientes iguais', () => {
    // Se todos forem iguais, "trocar dois de lugar" não produz nada e sobra
    // um distrator a menos. Vale também contra a equação trivial 1, 1, 1, que
    // não pergunta nada.
    for (const eq of EQUACOES) {
      const coeficientes = balancear(eq)
      expect(new Set(coeficientes).size, `${eq.id}: ${exibirConjunto(coeficientes)}`).toBeGreaterThan(1)
    }
  })

  it('os três níveis têm equação', () => {
    for (const n of [0, 1, 2]) {
      expect(EQUACOES.filter((eq) => eq.nivel === n).length, `nível ${n} vazio`).toBeGreaterThan(0)
    }
  })

  it('a dificuldade sobe de nível, e é medida em coeficiente', () => {
    // O nível não é um rótulo solto: no 0 tudo sai de cabeça, e daí para cima o
    // maior coeficiente da equação cresce. Se alguém enfiar a combustão do
    // octano no nível 0, isto quebra.
    const maiores = (n: number) =>
      EQUACOES.filter((eq) => eq.nivel === n).map((eq) => Math.max(...balancear(eq)))

    for (const c of maiores(0)) expect(c, 'nível 0 não passa de 3').toBeLessThanOrEqual(3)

    for (const eq of EQUACOES.filter((q) => q.nivel === 2)) {
      const soma = balancear(eq).reduce((t, c) => t + c, 0)
      expect(soma, `${eq.id}: leve para o nível 1`).toBeGreaterThanOrEqual(8)
    }

    const media = (v: number[]) => v.reduce((t, c) => t + c, 0) / v.length
    expect(media(maiores(1))).toBeGreaterThan(media(maiores(0)))
    expect(media(maiores(2))).toBeGreaterThan(media(maiores(1)))
  })

  it('toda equação do nível 2 explica por que o conjunto sobe, e só ela', () => {
    for (const eq of EQUACOES) {
      expect(eq.porque !== undefined, eq.id).toBe(eq.nivel === 2)
    }
  })
})

describe('distratores', () => {
  it('dão sempre pelo menos três conjuntos errados, distintos e plausíveis', () => {
    for (const eq of EQUACOES) {
      const certo = balancear(eq)
      const errados = distratores(eq)

      expect(errados.length, eq.id).toBeGreaterThanOrEqual(3)
      expect(new Set(errados.map(exibirConjunto)).size, eq.id).toBe(errados.length)

      for (const c of errados) {
        expect(c.length, `${eq.id}: ${exibirConjunto(c)}`).toBe(certo.length)
        expect(exibirConjunto(c), eq.id).not.toBe(exibirConjunto(certo))
        for (const v of c) {
          expect(Number.isInteger(v) && v > 0, `${eq.id}: ${exibirConjunto(c)}`).toBe(true)
        }
      }
    }
  })

  it('oferecem o conjunto dobrado — o único errado que ainda conserva os átomos', () => {
    for (const eq of EQUACOES) {
      const dobrado = balancear(eq).map((c) => c * 2)
      expect(distratores(eq).map(exibirConjunto), eq.id).toContain(exibirConjunto(dobrado))
      // Ele fecha a conta e mesmo assim está errado: a resposta é o menor
      // conjunto. É o ponto pedagógico do jogo inteiro, não um deslize do teste.
      expect(confere(eq, dobrado), eq.id).toBe(true)
    }
  })

  it('oferecem o hidrogênio esquecido onde a água entra na conta', () => {
    // C₃H₈ + 5O₂ → 3CO₂ + 4H₂O: quem usa os 8 hidrogênios do propano direto
    // como coeficiente da água escreve 1, 5, 3, 8.
    expect(distratores(de('propano')).map(exibirConjunto)).toContain('1, 5, 3, 8')
    expect(distratores(de('metano')).map(exibirConjunto)).toContain('1, 2, 1, 4')
    expect(distratores(de('butano')).map(exibirConjunto)).toContain('2, 13, 8, 20')
  })

  it('oferecem a troca de dois coeficientes, e primeiro a dos produtos', () => {
    // 1, 5, 3, 4 → 1, 5, 4, 3: trocar CO₂ com H₂O é o que se erra; trocar o
    // propano com a água não é erro de ninguém.
    expect(distratores(de('propano')).map(exibirConjunto)).toContain('1, 5, 4, 3')
  })

  it('nenhum distrator, tirando o dobrado, sobrevive à conservação', () => {
    for (const eq of EQUACOES) {
      const dobrado = exibirConjunto(balancear(eq).map((c) => c * 2))
      for (const c of distratores(eq).slice(0, 3)) {
        if (exibirConjunto(c) === dobrado) continue
        expect(confere(eq, c), `${eq.id}: ${exibirConjunto(c)} fecha a conta e não devia`).toBe(
          false,
        )
      }
    }
  })
})

describe('guardas', () => {
  it('quebra quando a equação não determina um único conjunto', () => {
    // Sem a linha da carga, Zn + H⁺ → Zn²⁺ + H₂ fica com dois graus de
    // liberdade. Aqui as cargas foram apagadas de propósito: é o que acontece
    // se alguém cadastrar um íon esquecendo a carga.
    expect(() =>
      balancear({
        id: 'sem-carga',
        reagentes: [
          { formula: 'Zn', atomos: [['Zn', 1]] },
          { formula: 'H⁺', atomos: [['H', 1]] },
        ],
        produtos: [
          { formula: 'Zn²⁺', atomos: [['Zn', 1]] },
          { formula: 'H₂', atomos: [['H', 2]] },
        ],
        nivel: 0,
      }),
    ).toThrow(/graus de liberdade/)
  })

  it('quebra quando a equação não fecha de jeito nenhum', () => {
    expect(() =>
      balancear({
        id: 'impossivel',
        reagentes: [{ formula: 'H₂', atomos: [['H', 2]] }],
        produtos: [{ formula: 'O₂', atomos: [['O', 2]] }],
        nivel: 0,
      }),
    ).toThrow(/graus de liberdade/)
  })

  it('quebra quando os coeficientes não correspondem às espécies', () => {
    expect(() => balanco(de('agua'), [1, 1])).toThrow(/espécies/)
  })
})
