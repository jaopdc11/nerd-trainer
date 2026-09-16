import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Exercicio } from '@/core/types'
import { NIVEL_MAX, gametas, gerarGenetica, genetica } from './genetica'

function amostra(nivel: number, quantos = 400): Exercicio[] {
  return Array.from({ length: quantos }, (_, i) => gerarGenetica(mulberry32(i + 1), nivel))
}

const todos = (quantos = 400): Exercicio[] =>
  Array.from({ length: NIVEL_MAX + 1 }, (_, n) => amostra(n, quantos)).flat()

const alternativas = (e: Exercicio): readonly string[] => {
  if (e.tipo !== 'escolha') throw new Error(`${e.chave} devia ser de escolha`)
  return e.alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))
}

/**
 * O gabarito, conferido à mão, item a item.
 *
 * O jogo calcula tudo — os gametas, o quadro, a contagem —, e é exatamente por
 * isso que ele não pode se autoaprovar: uma lista de gametas errada devolve uma
 * fração perfeitamente plausível, e "3/8" na tela não parece defeito nenhum.
 * Estes números vieram do quadro desenhado no papel, não da função.
 *
 * A chave não carrega as letras sorteadas (ver `LETRAS` no jogo), então cada
 * item tem uma resposta só — 'Aa × Aa' e 'Vv × Vv' são a mesma pergunta.
 */
const GABARITO: Readonly<Record<string, string>> = {
  // monoibridismo: o quadro de quatro casas
  'gen:mono:fen': '3:1',
  'gen:mono:gen': '1:2:1',
  'gen:mono:p-rec': '1/4',
  'gen:mono:p-dom': '3/4',
  'gen:mono:p-het': '1/2',
  'gen:mono:p-homo': '1/4',
  // cruzamento com o duplo recessivo: as duas proporções coincidem em 1:1
  'gen:mono:teste-fen': '1:1',
  'gen:mono:teste-gen': '1:1',
  'gen:mono:retro': '1/2',
  // AA × Aa: nenhum recessivo, metade heterozigota
  'gen:mono:puro-het': '1/2',

  // diibridismo: 16 casas
  'gen:di:fen': '9:3:3:1',
  'gen:di:p-rec': '1/16',
  'gen:di:p-dom': '9/16',
  'gen:di:p-misto': '3/16',
  'gen:di:teste': '1:1:1:1',

  // ABO e Rh
  'gen:abo:p-o': '1/4',
  'gen:abo:p-ab': '1/4',
  'gen:abo:com-o': '1/2',
  'gen:abo:ab-x-o': '1:1',
  'gen:rh:p-neg': '1/4',

  // genes no X — o par que separa "da prole" de "dos meninos"
  'gen:x:dalt-prole': '1/4',
  'gen:x:dalt-meninos': '1/2',
  'gen:x:dalt-meninas': '1/2',
  'gen:x:hemo-prole': '1/2',
  'gen:x:hemo-menina': '1/4',
}

describe('gametas', () => {
  it('um loco dá dois gametas; dois locos dão quatro', () => {
    expect(gametas('Aa')).toEqual(['A', 'a'])
    expect(gametas('AA')).toEqual(['A', 'A'])
    // A segunda lei: os locos se combinam livremente entre si.
    expect(gametas('AaBb')).toEqual(['AB', 'Ab', 'aB', 'ab'])
  })

  it('o homozigoto repete o gameta em vez de encurtar a lista', () => {
    // Normalizar para um gameta só daria a proporção certa e a probabilidade
    // errada: o denominador do quadro de AaBb × aabb tem de continuar 16.
    expect(gametas('aabb')).toEqual(['ab', 'ab', 'ab', 'ab'])
  })

  it('recusa genótipo com número ímpar de alelos', () => {
    expect(() => gametas('Aab')).toThrow(/pares de alelos/)
    expect(() => gametas('')).toThrow(/pares de alelos/)
  })

  it('recusa dois locos escritos no mesmo par', () => {
    // 'AB' seria um par com um alelo de cada loco: o quadro sairia sem sentido e
    // a fração, plausível.
    expect(() => gametas('AB')).toThrow(/dois locos no mesmo par/)
  })
})

describe('gabarito', () => {
  it('bate com o quadro conferido à mão, item a item', () => {
    for (const e of todos()) {
      const esperado = GABARITO[e.chave]
      expect(esperado, `${e.chave} não está no gabarito do teste`).toBeDefined()
      expect(e.gabarito, `${e.chave}: ${e.enunciado.valor}`).toBe(esperado)
    }
  })

  it('o gabarito não tem sobra — todo item do teste é gerado de verdade', () => {
    const vistas = new Set(todos().map((e) => e.chave))
    expect([...vistas].sort()).toEqual(Object.keys(GABARITO).sort())
  })

  it('o índice correto aponta para o gabarito', () => {
    for (const e of todos(200)) {
      if (e.tipo !== 'escolha') throw new Error(`${e.chave} devia ser de escolha`)
      expect(alternativas(e)[e.indiceCorreto], e.chave).toBe(e.gabarito)
    }
  })
})

/**
 * A decisão que organiza o jogo: "3:1", "1/4" e "25%" são a mesma coisa escrita
 * de três formas, e a resposta nunca é digitada por causa disso.
 *
 * Estes testes são o contrato: nenhum item é de digitação, cada carta pede uma
 * forma só, e as quatro opções estão todas nela. Uma carta com "1/4" ao lado de
 * "25%" teria duas alternativas certas sem que nada explodisse.
 */
describe('a forma da resposta', () => {
  it('nenhum item é digitado', () => {
    for (const e of todos(200)) {
      expect(e.tipo, `${e.chave} digitado: a grafia da resposta viraria a pergunta`).toBe('escolha')
    }
  })

  it('cada carta é toda de fração ou toda de proporção, nunca metade de cada', () => {
    for (const e of todos(200)) {
      const opcoes = alternativas(e)
      const fracoes = opcoes.filter((v) => /^\d+\/\d+$/.test(v))
      const proporcoes = opcoes.filter((v) => /^\d+(?::\d+)+$/.test(v))
      expect(
        fracoes.length === opcoes.length || proporcoes.length === opcoes.length,
        `${e.chave}: ${opcoes.join(' | ')}`,
      ).toBe(true)
    }
  })

  it('porcentagem e decimal nunca aparecem', () => {
    for (const e of todos(200)) {
      for (const texto of [e.enunciado.valor, e.gabarito, e.porque ?? '', ...alternativas(e)]) {
        expect(texto, `${e.chave}: ${texto}`).not.toMatch(/%/)
        expect(texto, `${e.chave}: ${texto}`).not.toMatch(/\d,\d/)
      }
    }
  })

  it('a fração é sempre irredutível: 2/4 e 1/2 não podem estar na mesma carta', () => {
    for (const e of todos(200)) {
      for (const v of alternativas(e)) {
        const m = v.match(/^(\d+)\/(\d+)$/)
        if (!m) continue
        const n = Number(m[1])
        const d = Number(m[2])
        const mdc = (a: number, b: number): number => (b === 0 ? a : mdc(b, a % b))
        expect(mdc(n, d), `${e.chave}: ${v}`).toBe(1)
        // "1/1" e "0/1" seriam itens sem pergunta: probabilidade certa ou nula.
        expect(d, `${e.chave}: ${v}`).toBeGreaterThan(1)
      }
    }
  })

  it('o enunciado avisa qual forma está pedindo', () => {
    for (const e of todos(200)) {
      const proporcao = alternativas(e).every((v) => /^\d+(?::\d+)+$/.test(v))
      expect(
        e.enunciado.valor.includes('proporção'),
        `${e.chave}: ${e.enunciado.valor}`,
      ).toBe(proporcao)
      if (!proporcao) {
        expect(
          /probabilidade|fração/.test(e.enunciado.valor),
          `${e.chave}: ${e.enunciado.valor}`,
        ).toBe(true)
      }
    }
  })
})

describe('alternativas', () => {
  it('são sempre quatro, distintas, com a certa entre elas', () => {
    for (const e of todos(200)) {
      const opcoes = alternativas(e)
      expect(opcoes, e.chave).toHaveLength(4)
      expect(new Set(opcoes).size, `${e.chave}: ${opcoes.join(' | ')}`).toBe(4)
      expect(opcoes, e.chave).toContain(e.gabarito)
    }
  })

  it('a posição da certa varia', () => {
    const posicoes = new Set(
      todos(200).map((e) => (e.tipo === 'escolha' ? e.indiceCorreto : -1)),
    )
    expect(posicoes).toEqual(new Set([0, 1, 2, 3]))
  })

  /**
   * Distrator aleatório não mede nada: quem sabe elimina "7/13" sem pensar e
   * quem não sabe chuta igual. Cada um destes é um erro com nome, e é o erro que
   * a carta existe para pegar.
   */
  it('oferecem o erro com nome de cada item', () => {
    const opcoesDe = (chave: string): readonly string[] => {
      const e = todos(200).find((x) => x.chave === chave)
      if (!e) throw new Error(`${chave} não caiu na amostra`)
      return alternativas(e)
    }

    // A proporção genotípica no lugar da fenotípica, e vice-versa.
    expect(opcoesDe('gen:mono:fen')).toContain('1:2:1')
    expect(opcoesDe('gen:mono:gen')).toContain('3:1')
    // O segundo loco esquecido: quem resolve o diibridismo como se fosse mono.
    expect(opcoesDe('gen:di:p-rec')).toContain('1/4')
    expect(opcoesDe('gen:di:p-dom')).toContain('3/4')
    // A condicional trocada pela simples: 1/3 é P(Aa | fenótipo dominante).
    expect(opcoesDe('gen:mono:p-het')).toContain('1/3')
    // A pegadinha mais antiga do daltonismo: a fração entre os meninos oferecida
    // para a pergunta sobre a prole inteira, e ao contrário.
    expect(opcoesDe('gen:x:dalt-prole')).toContain('1/2')
    expect(opcoesDe('gen:x:dalt-meninos')).toContain('1/4')
    // O cruzamento-teste confundido com o diibridismo completo.
    expect(opcoesDe('gen:di:teste')).toContain('9:3:3:1')
  })
})

describe('porque', () => {
  it('explica onde a resposta sozinha não ensina', () => {
    const explicados = new Set(todos(200).filter((e) => e.porque !== undefined).map((e) => e.chave))
    // Os dois lugares em que ver "1/4" não faz ninguém entender nada: o produto
    // das probabilidades no diibridismo e o recorte da prole no gene ligado ao X.
    for (const chave of [
      'gen:di:p-rec',
      'gen:di:fen',
      'gen:x:dalt-prole',
      'gen:x:dalt-meninos',
      'gen:abo:p-o',
      'gen:mono:p-het',
    ]) {
      expect(explicados, chave).toContain(chave)
    }
  })

  it('não explica o que se explica sozinho', () => {
    // "Aa × Aa → probabilidade de recessivo" com resposta 1/4 não precisa de
    // rodapé: a pausa de 2,4 s da explicação é tempo de relógio, e gastá-la no
    // óbvio é castigo.
    const semRodape = todos(200).filter((e) => e.porque === undefined).map((e) => e.chave)
    for (const chave of ['gen:mono:p-rec', 'gen:mono:p-dom', 'gen:mono:p-homo']) {
      expect(semRodape, chave).toContain(chave)
    }
  })
})

describe('escada', () => {
  it('o nível 0 é só monoibridismo', () => {
    for (const e of amostra(0)) {
      expect(e.chave, e.chave).toMatch(/^gen:mono:/)
    }
  })

  it('o nível 1 traz diibridismo e retrocruzamento', () => {
    const chaves = amostra(1).map((e) => e.chave)
    expect(chaves.some((c) => c.startsWith('gen:di:'))).toBe(true)
    expect(chaves).toContain('gen:mono:retro')
    expect(chaves.some((c) => c.startsWith('gen:abo:') || c.startsWith('gen:x:'))).toBe(false)
  })

  it('o nível 2 traz grupos sanguíneos e genes no X', () => {
    const chaves = amostra(NIVEL_MAX).map((e) => e.chave)
    expect(chaves.some((c) => c.startsWith('gen:abo:'))).toBe(true)
    expect(chaves.some((c) => c.startsWith('gen:x:'))).toBe(true)
    expect(chaves).toContain('gen:rh:p-neg')
  })

  it('acumula os níveis em vez de substituí-los', () => {
    const chaves = amostra(NIVEL_MAX).map((e) => e.chave)
    expect(chaves.some((c) => c.startsWith('gen:mono:'))).toBe(true)
    expect(chaves.some((c) => c.startsWith('gen:di:'))).toBe(true)
  })

  it('a escala chega ao último degrau e para lá', () => {
    const { escala } = genetica.config()
    expect(escala(0)).toBe(0)
    expect(escala(1000)).toBe(NIVEL_MAX)
  })

  it('nível fora da faixa não quebra', () => {
    expect(() => gerarGenetica(mulberry32(1), -3)).not.toThrow()
    expect(() => gerarGenetica(mulberry32(1), 99)).not.toThrow()
  })
})

describe('jogo', () => {
  it('é de biológicas e tem id estável', () => {
    expect(genetica.id).toBe('genetica')
    expect(genetica.categoria).toBe('biologicas')
  })

  it('o relógio fica entre o do nox e o do balanceamento', () => {
    const { segundosIniciais, bonusPorAcertoS, tetoSegundos } = genetica.config()
    expect(segundosIniciais).toBeGreaterThanOrEqual(60)
    expect(segundosIniciais).toBeLessThanOrEqual(75)
    expect(bonusPorAcertoS).toBe(6)
    expect(tetoSegundos).toBe(2 * segundosIniciais)
  })
})
