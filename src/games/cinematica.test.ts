import { describe, expect, it } from 'vitest'
import { completaSemAmbiguidade, formasDeAutoCommit, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Exercicio } from '@/core/types'
import { gerarCinematica, NIVEL_MAX } from './cinematica'

const ESTRITO = { rigor: 'estrito' } as const

/**
 * Uma sequência longa de um único RNG, e não um RNG novo por item.
 *
 * O padrão dos outros testes é semear `mulberry32(i + 1)` a cada amostra, o que
 * é reprodutível mas depende do primeiro valor de seeds consecutivas — e num
 * gerador de 32 bits esses primeiros valores não são independentes entre si.
 * Aqui há famílias que aparecem em 10% dos sorteios, então a cobertura importa:
 * uma corrida só, de uma semente só, cobre melhor e continua determinística.
 */
function amostra(nivel: number, quantos = 3000): readonly Exercicio[] {
  const rng = mulberry32(20240917)
  return Array.from({ length: quantos }, () => gerarCinematica(rng, nivel))
}

const TODOS: readonly Exercicio[] = [0, 1, 2].flatMap((n) => amostra(n))

/** "cin:torr-v:10:5:80" → "cin:torr-v". */
const familia = (chave: string) => chave.split(':').slice(0, 2).join(':')

/** Os números que o jogador lê na tela, na ordem em que aparecem. */
function numeros(e: Exercicio): readonly number[] {
  return [...e.enunciado.valor.matchAll(/\d+/g)].map((m) => Number(m[0]))
}

/** O valor do gabarito, sem a unidade. */
function valorDoGabarito(e: Exercicio): number {
  return Number(e.gabarito.split(' ')[0])
}

/**
 * A conferência do gabarito, família por família, **refeita à mão a partir do
 * enunciado**.
 *
 * Esta é a parte que vale do arquivo. Testar o gerador contra ele mesmo — "o
 * gabarito passa no validador do próprio item" — não pega o erro que realmente
 * acontece aqui, que é o enunciado dizer uma coisa e a resposta responder outra:
 * mexer num `rng.pick` e esquecer que `at²/2` só é inteiro com `a` par, ou
 * cadastrar ΔS de uma freada calculando com a velocidade errada. Cada linha
 * abaixo é a fórmula escrita de novo, do zero, lendo só os números que aparecem
 * na tela. Se as duas contas divergirem, uma das duas está errada.
 */
type Confere = (n: readonly number[]) => number

const CONFERE: Readonly<Record<string, Confere>> = {
  // v = v₀ + at
  'cin:v': (n) => {
    const [v0 = NaN, a = NaN, t = NaN] = n
    return v0 + a * t
  },
  // S = S₀ + v₀t + at²/2
  'cin:s': (n) => {
    const [s0 = NaN, v0 = NaN, a = NaN, t = NaN] = n
    return s0 + v0 * t + (a * t * t) / 2
  },
  // h = gt²/2
  'cin:queda-h': (n) => {
    const [t = NaN, g = NaN] = n
    return (g * t * t) / 2
  },
  // v = gt
  'cin:queda-v': (n) => {
    const [t = NaN, g = NaN] = n
    return g * t
  },
  // a = (v − v₀)/t
  'cin:a': (n) => {
    const [v0 = NaN, v = NaN, t = NaN] = n
    return (v - v0) / t
  },
  // módulo de a numa freada: (v₀ − v)/t
  'cin:a-freia': (n) => {
    const [v0 = NaN, v = NaN, t = NaN] = n
    return (v0 - v) / t
  },
  // t = (v − v₀)/a
  'cin:t': (n) => {
    const [v0 = NaN, v = NaN, a = NaN] = n
    return (v - v0) / a
  },
  // Freando: t = (v₀ − v)/|a|. O menos do enunciado é tipográfico e não entra
  // na leitura dos números, então o que chega aqui é o módulo.
  'cin:t-freia': (n) => {
    const [v0 = NaN, v = NaN, a = NaN] = n
    return (v0 - v) / a
  },
  // Torricelli: v = √(v₀² + 2aΔS)
  'cin:torr-v': (n) => {
    const [v0 = NaN, a = NaN, ds = NaN] = n
    return Math.sqrt(v0 * v0 + 2 * a * ds)
  },
  // Torricelli na freada: ΔS = (v₀² − v²)/2|a|
  'cin:torr-s': (n) => {
    const [v0 = NaN, v = NaN, a = NaN] = n
    return (v0 * v0 - v * v) / (2 * a)
  },
  // t = √(2h/g)
  'cin:queda-t': (n) => {
    const [h = NaN, g = NaN] = n
    return Math.sqrt((2 * h) / g)
  },
  // v = √(2gh)
  'cin:solo-v': (n) => {
    const [h = NaN, g = NaN] = n
    return Math.sqrt(2 * g * h)
  },
  // h = v₀²/2g
  'cin:hmax': (n) => {
    const [v0 = NaN, g = NaN] = n
    return (v0 * v0) / (2 * g)
  },
  // t = 2v₀/g
  'cin:voo': (n) => {
    const [v0 = NaN, g = NaN] = n
    return (2 * v0) / g
  },
  // Mesmo sentido: fecha a distância a (vA − vB).
  'cin:perseguicao': (n) => {
    const [vA = NaN, vB = NaN, d = NaN] = n
    return d / (vA - vB)
  },
  // Frontal: fecha a (vA + vB).
  'cin:encontro': (n) => {
    const [vA = NaN, vB = NaN, d = NaN] = n
    return d / (vA + vB)
  },
}

describe('cinemática: o gabarito refeito à mão a partir do enunciado', () => {
  it('bate com o gerador em toda família e todo sorteio', () => {
    for (const e of TODOS) {
      const confere = CONFERE[familia(e.chave)]
      expect(confere, `família sem conferência: ${e.chave}`).toBeDefined()
      expect(confere?.(numeros(e)), `${e.chave} — "${e.enunciado.valor}" → ${e.gabarito}`).toBe(
        valorDoGabarito(e),
      )
    }
  })

  it('cobre todas as famílias declaradas, e nenhuma a mais', () => {
    // Se um gerador novo entrar sem entrada em CONFERE, o teste acima já falha;
    // este pega o contrário — a conferência que sobrou de um gerador removido e
    // passou a não testar nada.
    const vistas = new Set(TODOS.map((e) => familia(e.chave)))
    expect([...vistas].sort()).toEqual(Object.keys(CONFERE).sort())
  })
})

describe('cinemática: gabaritos conferidos à mão', () => {
  // Contas feitas no papel, uma por degrau. O valor vem do enunciado exato, não
  // de uma semente: é o mesmo texto que o jogador lê.
  const MAO: readonly (readonly [string, string])[] = [
    ['queda do repouso, t=4 s, g=10 → h', '80 m'],
    ['queda do repouso, t=6 s, g=10 → v', '60 m/s'],
    ['queda do repouso, h=45 m, g=10 → t', '3 s'],
    ['queda do repouso, h=80 m, g=10 → v', '40 m/s'],
    ['sobe com v₀=30 m/s, g=10 → h máx', '45 m'],
    ['sobe com v₀=40 m/s, g=10 → t de voo', '8 s'],
  ]

  const porEnunciado = new Map(TODOS.map((e) => [e.enunciado.valor, e.gabarito]))

  for (const [enunciado, gabarito] of MAO) {
    it(`"${enunciado}" → ${gabarito}`, () => {
      expect(porEnunciado.has(enunciado), 'o enunciado nem chegou a ser sorteado').toBe(true)
      expect(porEnunciado.get(enunciado)).toBe(gabarito)
    })
  }
})

describe('cinemática: a resposta cabe no teclado numérico', () => {
  it('é sempre inteiro não-negativo, e o gabarito passa no próprio validador', () => {
    for (const e of TODOS) {
      if (e.tipo !== 'digitado') throw new Error(`${e.chave} devia ser digitado`)
      expect(e.teclado, e.chave).toBe('numerico')
      expect(e.resposta.tipo, e.chave).toBe('inteiroGrande')

      const valor = valorDoGabarito(e)
      expect(Number.isInteger(valor), `${e.chave} → ${e.gabarito}`).toBe(true)
      expect(valor, `${e.chave} → ${e.gabarito}`).toBeGreaterThanOrEqual(0)
      expect(validar(String(valor), e.resposta, ESTRITO).veredito, e.chave).toBe('certo')
    }
  })

  it('nunca pede vírgula, sinal ou notação no que se digita', () => {
    // A vírgula e o menos podem aparecer no enunciado — "a = −2 m/s²" é o que
    // ensina o sinal —, mas nunca na resposta: o teclado numérico não os tem.
    for (const e of TODOS) {
      expect(e.gabarito, e.chave).toMatch(/^\d+ [^\d]+$/)
      expect(e.gabarito, e.chave).not.toMatch(/[,−-]/)
    }
  })

  it('usa o menos tipográfico, e não o hífen, quando o enunciado tem sinal', () => {
    const comSinal = TODOS.filter((e) => e.enunciado.valor.includes('−'))
    expect(comSinal.length, 'nenhuma freada com aceleração negativa foi sorteada').toBeGreaterThan(0)
    for (const e of TODOS) expect(e.enunciado.valor, e.chave).not.toMatch(/-\d/)
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

  it('só usa unidades do SI que o enunciado anunciou', () => {
    const unidades = new Set(TODOS.map((e) => e.gabarito.split(' ')[1]))
    expect([...unidades].sort()).toEqual(['m', 'm/s', 'm/s²', 's'])
  })
})

describe('cinemática: a escada', () => {
  it('acumula os níveis em vez de substituí-los', () => {
    // No topo ainda tem que cair substituição direta: o degrau novo entra em
    // dobro, não no lugar.
    const familias = new Set(amostra(NIVEL_MAX).map((e) => familia(e.chave)))
    expect(familias.has('cin:v'), 'o nível 0 sumiu do topo da escada').toBe(true)
    expect(familias.has('cin:encontro')).toBe(true)
  })

  it('não deixa vazar item de nível acima do sorteado', () => {
    const doNivel0 = new Set(amostra(0).map((e) => familia(e.chave)))
    expect([...doNivel0].sort()).toEqual(['cin:queda-h', 'cin:queda-v', 'cin:s', 'cin:v'])
  })

  it('explica a resposta onde a conta tem duas pernas, e não onde é substituir', () => {
    // A explicação segura a tela por 2,4 s em vez de 0,9 s. Ela se paga nos
    // itens em que o dado que falta é o ponto do exercício, e não nos outros.
    for (const e of amostra(0)) expect(e.porque, e.chave).toBeUndefined()
    expect(amostra(2).filter((e) => e.porque !== undefined).length).toBeGreaterThan(0)
  })
})
