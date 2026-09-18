import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { PAISES } from '@/data/paises'
import { moedas } from './moedas'

const cartas: readonly Carta[] = moedas.config().montarBaralho(mulberry32(7))

const carta = (id: string) => {
  const c = cartas.find((k) => k.id === `moeda-${id}`)
  if (c?.tipo !== 'digitada') throw new Error(`carta ${id} não encontrada`)
  return c
}

/**
 * A mesma montagem de vizinhança da engine: as formas cruas de todas as outras
 * cartas. Sem isto o teste mediria um jogo que não existe.
 */
const responder = (id: string, texto: string) => {
  const alvo = carta(id)
  const vizinhanca = new Set(
    cartas.flatMap((c) =>
      c.id !== alvo.id && c.tipo === 'digitada' && c.resposta.tipo === 'texto'
        ? c.resposta.aceitas
        : [],
    ),
  )
  return validar(texto, alvo.resposta, { rigor: 'estrito', vizinhanca }).veredito
}

describe('o baralho', () => {
  it('tem uma carta por país soberano, e nenhuma pelos territórios', () => {
    expect(cartas).toHaveLength(195)
    const ids = new Set(cartas.map((c) => c.id))
    for (const p of PAISES) {
      expect(ids.has(`moeda-${p.id}`), `${p.nome}`).toBe(p.soberano)
    }
  })

  it('toda carta é digitada e pergunta pelo nome do país', () => {
    const nomes = new Set(PAISES.map((p) => p.nome))
    for (const c of cartas) {
      expect(c.tipo, c.id).toBe('digitada')
      expect(c.pergunta.kind, c.id).toBe('texto')
      if (c.pergunta.kind === 'texto') expect(nomes.has(c.pergunta.valor), c.id).toBe(true)
    }
  })

  /**
   * O baralho **viola de propósito** o invariante que `flashcards.test.ts` cobra
   * dos outros decks ("nenhuma forma aceita é compartilhada entre cartas").
   *
   * Lá a colisão é bug: se "xi" vale para duas letras gregas, o jogo vira
   * loteria. Aqui não vira nada, porque a colisão não é entre *respostas
   * parecidas* e sim entre cartas que têm literalmente a mesma resposta — o euro
   * é a moeda de 26 países, e "euro" tem de valer nos 26. O validador casa a
   * forma exata antes de cogitar tolerância, então não há desempate a fazer.
   *
   * Este teste existe para que a violação seja uma decisão registrada, e não uma
   * surpresa de quem for rodar o `semColisao` aqui um dia.
   */
  it('a resposta repetida é esperada, e o euro é o campeão com 26 cartas', () => {
    const contagem = new Map<string, number>()
    for (const c of cartas) {
      if (c.tipo !== 'digitada' || c.resposta.tipo !== 'texto') continue
      const nome = c.resposta.canonica
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1)
    }
    // Desempate por nome: XAF e XCD empatam em 6, e um ranking que depende da
    // ordem de inserção do objeto quebraria sozinho um dia.
    const ranking = [...contagem]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
    expect(ranking).toEqual([
      ['euro', 26],
      ['dólar americano', 8],
      ['franco CFA da África Ocidental', 8],
      ['dólar do Caribe Oriental', 6],
      ['franco CFA da África Central', 6],
    ])
  })

  it('o gabarito avisa quando a moeda é dividida, e cala quando não é', () => {
    expect(carta('pt').gabarito).toBe('euro (EUR) — a moeda de 26 países desta lista')
    expect(carta('sn').gabarito).toBe(
      'franco CFA da África Ocidental (XOF) — a moeda de 8 países desta lista',
    )
    expect(carta('br').gabarito).toBe('real (BRL)')
  })

  it('o recado sobre Israel vale aqui como vale no mapa e nas bandeiras', () => {
    expect(carta('il').aviso).toBeTruthy()
    expect(carta('br').aviso).toBeUndefined()
  })
})

describe('a correção', () => {
  it('o mesmo "euro" pontua em todas as cartas do bloco', () => {
    for (const id of ['pt', 'fr', 'sk', 'bg', 'me', 'va']) {
      expect(responder(id, 'euro'), id).toBe('certo')
    }
  })

  it('a forma curta vale na moeda própria', () => {
    expect(responder('ca', 'dólar')).toBe('certo')
    expect(responder('se', 'coroa')).toBe('certo')
    expect(responder('cl', 'peso')).toBe('certo')
    expect(responder('cd', 'franco')).toBe('certo')
  })

  /**
   * A regra vale aqui também, e é a mudança que mais se sente jogando: eram 34
   * das 195 cartas em que saber a resposta não bastava, porque faltava o
   * qualificador. Quem quiser o nome inteiro tem o gabarito, que vem de graça
   * depois de toda carta e ainda diz o tamanho do bloco.
   */
  it('a forma curta vale também na moeda emprestada e na compartilhada', () => {
    expect(responder('ec', 'dólar')).toBe('certo')
    expect(responder('ec', 'dólar americano')).toBe('certo')
    expect(responder('sn', 'franco')).toBe('certo')
    expect(responder('sn', 'franco CFA')).toBe('certo')
    expect(responder('gd', 'dólar')).toBe('certo')
    expect(responder('gd', 'dólar do Caribe Oriental')).toBe('certo')
    expect(responder('li', 'franco')).toBe('certo')
    expect(responder('li', 'franco suíço')).toBe('certo')
  })

  /**
   * O que a regra **não** afrouxou: família é dedução, moeda de outro bloco não
   * é. "franco CFA" no Djibuti continua errado — lá o franco é o djibutiano.
   */
  it('a família vale, o bloco errado não', () => {
    expect(responder('dj', 'franco')).toBe('certo')
    expect(responder('dj', 'franco CFA')).toBe('errado')
    expect(responder('ec', 'dólar do Caribe Oriental')).toBe('errado')
  })

  it('aceita o nome colado e perdoa o dedo escorregado nos nomes longos', () => {
    expect(responder('tt', 'dolardetrinidadetobago')).toBe('certo')
    expect(responder('tt', 'dolar de trinidad e tobaggo')).toBe('quase')
    expect(responder('cr', 'colon costariquenho')).toBe('quase')
    expect(responder('bt', 'ngultrun')).toBe('quase')
    expect(responder('ua', 'hryvinia')).toBe('quase')
  })

  /**
   * Consequência medida — e aceita — do baralho ter respostas repetidas.
   *
   * A trava de ambiguidade do validador compara a entrada com as formas das
   * *outras* cartas, e as outras sete cartas do bloco CFA carregam exatamente a
   * mesma forma da carta sob prova. Resultado: em moeda compartilhada a entrada
   * com typo sempre encosta num vizinho e é recusada; a tolerância morre ali.
   *
   * Não é bug e não vale contornar: escrever certo continua pontuando (a forma
   * exata casa antes de a tolerância entrar em cena), e essas moedas ainda têm a
   * saída curta — "franco CFA" vale, e tem dez caracteres. O que se perderia
   * mexendo nisso é a única trava que impede uma carta de dar o ponto da outra.
   */
  it('na moeda compartilhada a tolerância morre, e escrever certo continua valendo', () => {
    expect(responder('sn', 'franco CFA da Africa Ocidnetal')).toBe('errado')
    expect(responder('sn', 'franco CFA da África Ocidental')).toBe('certo')
    expect(responder('sn', 'franco CFA')).toBe('certo')
  })

  it('não dá o ponto do vizinho: o rand vale onde tem curso legal, e só', () => {
    // Lesoto, Essuatíni e Namíbia atrelam a moeda ao rand e o aceitam em espécie.
    for (const id of ['za', 'ls', 'sz', 'na']) expect(responder(id, 'rand'), id).toBe('certo')
    expect(responder('bw', 'rand')).toBe('errado')
    expect(responder('zw', 'rand')).toBe('errado')
  })

  it('as duas kwachas e os dois wons não se emprestam', () => {
    expect(responder('zm', 'kwacha')).toBe('certo')
    expect(responder('mw', 'kwacha')).toBe('certo')
    expect(responder('zm', 'kwacha malawiano')).toBe('errado')
    expect(responder('kr', 'won norte-coreano')).toBe('errado')
    expect(responder('kp', 'won')).toBe('certo')
  })
})
