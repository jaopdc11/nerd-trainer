import { describe, expect, it } from 'vitest'
import { completaSemAmbiguidade, formasDeAutoCommit, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Exercicio } from '@/core/types'
import { gerarCircuitos, NIVEL_MAX } from './circuitos'

const ESTRITO = { rigor: 'estrito' } as const

/**
 * Uma corrida longa de um RNG só, e não um RNG novo por item.
 *
 * O padrão dos outros testes semeia `mulberry32(i + 1)` a cada amostra, o que é
 * reprodutível mas depende do primeiro valor de sementes consecutivas — e num
 * gerador de 32 bits esses primeiros valores não são independentes. Aqui há
 * pares de paralelo que aparecem em menos de 1% dos sorteios, então a cobertura
 * importa: uma corrida só, de uma semente só, cobre melhor e continua
 * determinística.
 */
function amostra(nivel: number, quantos = 4000): readonly Exercicio[] {
  const rng = mulberry32(20240917)
  return Array.from({ length: quantos }, () => gerarCircuitos(rng, nivel))
}

const TODOS: readonly Exercicio[] = [0, 1, 2].flatMap((n) => amostra(n))

/** "cir:i-par:6:3:4" → "cir:i-par". */
const familia = (chave: string) => chave.split(':').slice(0, 2).join(':')

/** Os números que o jogador lê na tela, na ordem em que aparecem. */
function numeros(e: Exercicio): readonly number[] {
  return [...e.enunciado.valor.matchAll(/\d+/g)].map((m) => Number(m[0]))
}

const valorDoGabarito = (e: Exercicio): number => Number(e.gabarito.split(' ')[0])

/**
 * A conferência do gabarito, família por família, **refeita à mão a partir do
 * enunciado**.
 *
 * Conferir o gerador contra ele mesmo não pega o erro que de fato acontece
 * aqui: o enunciado dizer uma coisa e a resposta responder outra. A corrente é
 * montada a partir de `U = Ri` para dividir exato e o paralelo vem da fatoração
 * de `p²` — duas construções que dão a resposta antes de escrever a pergunta, e
 * é exatamente aí que dá para trocar `R₁` por `R₂` sem que nada exploda. Cada
 * linha abaixo é a fórmula escrita de novo, do zero, lendo só os números da
 * tela.
 *
 * O texto vem junto dos números porque a quantidade de resistores iguais está
 * escrita por extenso ("três de 12 Ω"), de propósito — conferir o item exige ler
 * a palavra, que é exatamente o que o jogador faz.
 */
type Confere = (n: readonly number[], texto: string) => number

const CONFERE: Readonly<Record<string, Confere>> = {
  // U = R·i
  'cir:u': (n) => {
    const [r = NaN, i = NaN] = n
    return r * i
  },
  // i = U/R
  'cir:i': (n) => {
    const [u = NaN, r = NaN] = n
    return u / r
  },
  // R = U/i
  'cir:r': (n) => {
    const [u = NaN, i = NaN] = n
    return u / i
  },
  // P = U·i
  'cir:p-ui': (n) => {
    const [u = NaN, i = NaN] = n
    return u * i
  },
  // P = R·i²
  'cir:p-ri2': (n) => {
    const [r = NaN, i = NaN] = n
    return r * i * i
  },
  // P = U²/R
  'cir:p-u2r': (n) => {
    const [u = NaN, r = NaN] = n
    return (u * u) / r
  },
  // Série: a soma, sejam dois ou três.
  'cir:serie': (n) => n.reduce((s, r) => s + r, 0),
  // i = U/(R₁ + R₂)
  'cir:i-serie': (n) => {
    const [r1 = NaN, r2 = NaN, u = NaN] = n
    return u / (r1 + r2)
  },
  // Paralelo: produto sobre soma.
  'cir:par': (n) => {
    const [r1 = NaN, r2 = NaN] = n
    return (r1 * r2) / (r1 + r2)
  },
  // n iguais: R/n, com o n escrito por extenso.
  'cir:par-iguais': (n, texto) => {
    const [r = NaN] = n
    const quantos = texto.startsWith('três ') ? 3 : texto.startsWith('quatro ') ? 4 : NaN
    return r / quantos
  },
  // Corrente total: U dividido pela equivalente do paralelo.
  'cir:i-par': (n) => {
    const [r1 = NaN, r2 = NaN, u = NaN] = n
    return u / ((r1 * r2) / (r1 + r2))
  },
  // Divisor: a mesma corrente nos dois, e U₁ = R₁·i. O quarto número do
  // enunciado é o próprio R₁ repetido ("a tensão sobre o de 4 Ω").
  'cir:divisor': (n) => {
    const [r1 = NaN, r2 = NaN, u = NaN, repetido = NaN] = n
    expect(repetido).toBe(r1)
    return (u * r1) / (r1 + r2)
  },
}

describe('circuitos: o gabarito refeito à mão a partir do enunciado', () => {
  it('bate com o gerador em toda família e todo sorteio', () => {
    for (const e of TODOS) {
      const confere = CONFERE[familia(e.chave)]
      expect(confere, `família sem conferência: ${e.chave}`).toBeDefined()
      expect(
        confere?.(numeros(e), e.enunciado.valor),
        `${e.chave} — "${e.enunciado.valor}" → ${e.gabarito}`,
      ).toBe(valorDoGabarito(e))
    }
  })

  it('cobre todas as famílias declaradas, e nenhuma a mais', () => {
    const vistas = new Set(TODOS.map((e) => familia(e.chave)))
    expect([...vistas].sort()).toEqual(Object.keys(CONFERE).sort())
  })
})

describe('circuitos: gabaritos conferidos à mão', () => {
  // Os pares clássicos, com a conta feita no papel. O texto é o mesmo que
  // aparece na tela — se o gerador deixar de produzi-lo, o teste fala.
  const MAO: readonly (readonly [string, string])[] = [
    ['6 Ω e 3 Ω em paralelo → Req', '2 Ω'],
    ['10 Ω e 15 Ω em paralelo → Req', '6 Ω'],
    ['20 Ω e 20 Ω em paralelo → Req', '10 Ω'],
    ['12 Ω e 12 Ω em paralelo → Req', '6 Ω'],
    ['três de 12 Ω em paralelo → Req', '4 Ω'],
    ['quatro de 20 Ω em paralelo → Req', '5 Ω'],
  ]

  const porEnunciado = new Map(TODOS.map((e) => [e.enunciado.valor, e.gabarito]))

  for (const [enunciado, gabarito] of MAO) {
    it(`"${enunciado}" → ${gabarito}`, () => {
      expect(porEnunciado.has(enunciado), 'o enunciado nem chegou a ser sorteado').toBe(true)
      expect(porEnunciado.get(enunciado)).toBe(gabarito)
    })
  }
})

describe('circuitos: o que a associação tem de contraintuitivo', () => {
  it('no paralelo a equivalente fica abaixo da menor das resistências', () => {
    // É o item inteiro. Se algum sorteio produzir uma equivalente maior ou
    // igual à menor das duas, o gerador quebrou a física, não o arredondamento.
    const paralelos = TODOS.filter((e) => familia(e.chave) === 'cir:par')
    expect(paralelos.length).toBeGreaterThan(0)

    for (const e of paralelos) {
      const [r1 = NaN, r2 = NaN] = numeros(e)
      expect(valorDoGabarito(e), e.enunciado.valor).toBeLessThan(Math.min(r1, r2))
    }
  })

  it('na série a equivalente fica acima da maior', () => {
    const series = TODOS.filter((e) => familia(e.chave) === 'cir:serie')
    expect(series.length).toBeGreaterThan(0)

    for (const e of series) {
      expect(valorDoGabarito(e), e.enunciado.valor).toBeGreaterThan(Math.max(...numeros(e)))
    }
  })

  it('no divisor, a tensão parcial é menor que a da fonte', () => {
    const divisores = TODOS.filter((e) => familia(e.chave) === 'cir:divisor')
    expect(divisores.length).toBeGreaterThan(0)

    for (const e of divisores) {
      const [, , u = NaN] = numeros(e)
      expect(valorDoGabarito(e), e.enunciado.valor).toBeLessThan(u)
    }
  })
})

describe('circuitos: a resposta cabe no teclado numérico', () => {
  it('é sempre inteiro positivo, e o gabarito passa no próprio validador', () => {
    for (const e of TODOS) {
      if (e.tipo !== 'digitado') throw new Error(`${e.chave} devia ser digitado`)
      expect(e.teclado, e.chave).toBe('numerico')
      expect(e.resposta.tipo, e.chave).toBe('inteiroGrande')

      const valor = valorDoGabarito(e)
      expect(Number.isInteger(valor), `${e.chave} → ${e.gabarito}`).toBe(true)
      expect(valor, `${e.chave} → ${e.gabarito}`).toBeGreaterThan(0)
      expect(validar(String(valor), e.resposta, ESTRITO).veredito, e.chave).toBe('certo')
    }
  })

  it('nunca pede vírgula nem sinal no que se digita', () => {
    for (const e of TODOS) {
      expect(e.gabarito, e.chave).toMatch(/^\d+ [^\d]+$/)
      expect(e.gabarito, e.chave).not.toMatch(/[,.−-]/)
    }
  })

  it('aceita sem Enter: o número digitado já commita sozinho', () => {
    // É o argumento que justificou o digitado em vez da escolha. Se o
    // auto-commit deixar de valer, o jogo passa a cobrar um Enter por item e a
    // decisão precisa ser reaberta.
    for (const e of TODOS.slice(0, 200)) {
      if (e.tipo !== 'digitado') continue
      const auto = formasDeAutoCommit(e.resposta)
      expect(auto, e.chave).not.toBeNull()
      const texto = String(valorDoGabarito(e))
      expect(
        auto ? completaSemAmbiguidade(auto.normalizar(texto), auto.formas) : false,
        `${e.chave}: ${texto}`,
      ).toBe(true)
    }
  })

  it('só usa as quatro unidades do circuito', () => {
    const unidades = new Set(TODOS.map((e) => e.gabarito.split(' ')[1]))
    expect([...unidades].sort()).toEqual(['A', 'V', 'W', 'Ω'])
  })
})

describe('circuitos: a escada', () => {
  it('acumula os níveis em vez de substituí-los', () => {
    const familias = new Set(amostra(NIVEL_MAX).map((e) => familia(e.chave)))
    expect(familias.has('cir:u'), 'o nível 0 sumiu do topo da escada').toBe(true)
    expect(familias.has('cir:par')).toBe(true)
  })

  it('não deixa vazar item de nível acima do sorteado', () => {
    const doNivel0 = new Set(amostra(0).map((e) => familia(e.chave)))
    expect([...doNivel0].sort()).toEqual(['cir:i', 'cir:r', 'cir:u'])
  })

  it('explica a resposta onde o modelo é contraintuitivo, e não na lei direta', () => {
    // A explicação segura a tela por 2,4 s em vez de 0,9 s. Ela se paga onde o
    // erro é de modelo — o paralelo que "devia" somar —, não onde é substituir.
    for (const e of amostra(0)) expect(e.porque, e.chave).toBeUndefined()
    for (const e of TODOS.filter((x) => familia(x.chave) === 'cir:par')) {
      expect(e.porque, e.chave).toBeDefined()
    }
  })
})
