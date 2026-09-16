import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { ROTULO_FAMILIA, VIZINHAS, familiaDe } from '@/data/familias-periodicas'
import type { Familia } from '@/data/familias-periodicas'
import { ELEMENTOS } from '@/data/tabela-periodica'
import { familiasPeriodicas } from './familias-periodicas'

const montar = (seed: number) => familiasPeriodicas.config().montarBaralho(mulberry32(seed))

const BARALHO = montar(11).filter(
  (c): c is Extract<Carta, { tipo: 'escolha' }> => c.tipo === 'escolha',
)

const POR_ROTULO = new Map<string, Familia>(
  (Object.keys(ROTULO_FAMILIA) as Familia[]).map((f) => [ROTULO_FAMILIA[f], f]),
)

/** As alternativas da carta, já de volta em famílias. */
function familiasDaCarta(c: Extract<Carta, { tipo: 'escolha' }>): readonly Familia[] {
  return c.alternativas.map((a) => {
    const rotulo = a.kind === 'texto' ? a.valor : ''
    const familia = POR_ROTULO.get(rotulo)
    expect(familia, `alternativa "${rotulo}" não é família nenhuma`).toBeDefined()
    return familia as Familia
  })
}

const cartaDe = (simbolo: string) => {
  const z = ELEMENTOS.find((e) => e.simbolo === simbolo)?.z
  return BARALHO.find((c) => c.id === `familia-z${z}`) as Extract<Carta, { tipo: 'escolha' }>
}

describe('baralho', () => {
  it('é o dataset inteiro, uma carta de escolha por elemento', () => {
    expect(BARALHO).toHaveLength(118)
    expect(new Set(BARALHO.map((c) => c.id)).size).toBe(118)
  })

  it('é morte súbita — a decisão que faz este jogo caber em 118 cartas', () => {
    expect(familiasPeriodicas.config().fim).toBe('morte-subita')
    expect(familiasPeriodicas.mecanica).toBe('flashcard')
    expect(familiasPeriodicas.categoria).toBe('quimica')
  })

  it('pergunta o símbolo e o nome juntos', () => {
    // Sem o nome, a carta viraria duas perguntas empilhadas — "que elemento é
    // Sb" mais "de que família ele é" — e um erro não diria qual das duas.
    for (const e of ELEMENTOS) {
      const c = BARALHO.find((x) => x.id === `familia-z${e.z}`)
      expect(c?.pergunta.kind === 'texto' && c.pergunta.valor, `Z=${e.z}`).toBe(
        `${e.simbolo} — ${e.nome}`,
      )
    }
  })
})

describe('alternativas', () => {
  it('são sempre quatro, distintas, e a certa é a que o dataset diz', () => {
    for (const e of ELEMENTOS) {
      const c = cartaDe(e.simbolo)
      const opcoes = familiasDaCarta(c)
      expect(opcoes, e.simbolo).toHaveLength(4)
      expect(new Set(opcoes).size, `${e.simbolo}: alternativa repetida`).toBe(4)
      expect(opcoes[c.indiceCorreto], e.simbolo).toBe(familiaDe(e))
    }
  })

  it('as três erradas são sempre famílias vizinhas — nunca um distrator aleatório', () => {
    // A trava contra a carta que não mede nada. Se um dia entrar uma família que
    // não faz fronteira com a certa, é aqui que se vê.
    for (const e of ELEMENTOS) {
      const c = cartaDe(e.simbolo)
      const certa = familiaDe(e)
      for (const f of familiasDaCarta(c)) {
        if (f === certa) continue
        expect(VIZINHAS[certa], `${e.simbolo}: ${f} não é vizinha de ${certa}`).toContain(f)
      }
    }
  })

  it('o índice correto não fica preso numa posição', () => {
    // Sem embaralhar, a resposta certa seria sempre a primeira e o jogo mediria
    // paciência para clicar, não química.
    const posicoes = new Set(BARALHO.map((c) => c.indiceCorreto))
    expect(posicoes).toEqual(new Set([0, 1, 2, 3]))
  })

  it('"nenhuma — é caso à parte" só aparece na carta do hidrogênio', () => {
    for (const c of BARALHO) {
      const temCasoAParte = familiasDaCarta(c).includes('hidrogenio')
      expect(temCasoAParte, c.id).toBe(c.id === 'familia-z1')
    }
  })

  it('o gabarito diz de onde veio a resposta, não só qual é', () => {
    expect(cartaDe('Sb').gabarito).toBe('pnictogênios — grupo 15, período 5')
    expect(cartaDe('Ce').gabarito).toBe('lantanídeos — bloco f, período 6')
    expect(cartaDe('U').gabarito).toBe('actinídeos — bloco f, período 7')
    expect(cartaDe('He').gabarito).toBe('gases nobres — grupo 18, período 1')
    expect(cartaDe('H').gabarito).toContain('mora sobre o lítio')
  })
})

describe('o hidrogênio', () => {
  /*
   * A carta mais importante do baralho, e a única em que o jogo tem posição
   * própria: o H está no grupo 1 e não é alcalino. Ela existe em vez de o
   * elemento simplesmente sair do baralho — tirar o H seria fingir que a
   * pergunta mais difícil da tabela não existe.
   */
  it('não aceita "metais alcalinos" como resposta certa', () => {
    const c = cartaDe('H')
    expect(familiasDaCarta(c)[c.indiceCorreto]).toBe('hidrogenio')
  })

  it('mas oferece alcalinos na tela, que é o erro que se quer pegar', () => {
    expect(familiasDaCarta(cartaDe('H'))).toContain('alcalinos')
  })

  it('e as outras duas são as leituras que também têm defesa', () => {
    const opcoes = new Set(familiasDaCarta(cartaDe('H')))
    expect(opcoes).toEqual(new Set(['hidrogenio', 'alcalinos', 'halogenios', 'nobres']))
  })
})

describe('sorteio', () => {
  it('é determinístico pela semente — "esse sorteio caiu mal" tem de ser reproduzível', () => {
    const a = montar(99)
    const b = montar(99)
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id))
    expect(a.map((c) => (c.tipo === 'escolha' ? c.indiceCorreto : -1))).toEqual(
      b.map((c) => (c.tipo === 'escolha' ? c.indiceCorreto : -1)),
    )
  })

  it('e sementes diferentes dão ordens diferentes', () => {
    expect(montar(1).map((c) => c.id)).not.toEqual(montar(2).map((c) => c.id))
  })

  it('toda família cai no baralho, e a distribuição é a da tabela', () => {
    const conta = new Map<Familia, number>()
    for (const e of ELEMENTOS) {
      const f = familiaDe(e)
      conta.set(f, (conta.get(f) ?? 0) + 1)
    }
    // O jogo é desequilibrado por natureza: 38 das 118 cartas são metal de
    // transição. Registrado de propósito — é a tabela que é assim, e mexer nisso
    // seria falsificar o dataset para fazer o jogo parecer mais justo.
    expect(conta.get('transicao')).toBe(38)
    expect(conta.get('lantanideos')).toBe(15)
    expect(conta.get('hidrogenio')).toBe(1)
    expect([...conta.values()].reduce((s, n) => s + n, 0)).toBe(118)
  })
})
