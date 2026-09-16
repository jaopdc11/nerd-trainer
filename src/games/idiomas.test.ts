import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { PAISES } from '@/data/paises'
import { idiomas } from './idiomas'

const cartas: readonly Carta[] = idiomas.config().montarBaralho(mulberry32(7))

const carta = (id: string) => {
  const c = cartas.find((k) => k.id === `idioma-${id}`)
  if (c?.tipo !== 'digitada') throw new Error(`carta ${id} não encontrada`)
  return c
}

/** A mesma montagem de vizinhança da engine: formas cruas das outras cartas. */
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
      expect(ids.has(`idioma-${p.id}`), p.nome).toBe(p.soberano)
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
   * O gabarito é o melhor do baralho: quem acertou "alemão" para a Suíça leva o
   * ponto e descobre ali que são quatro. Mostrar uma língua só desperdiçaria
   * justamente o dado que deu trabalho de levantar.
   */
  it('o gabarito traz a lista inteira, não só a primeira', () => {
    expect(carta('ch').gabarito).toBe('alemão, francês, italiano, romanche')
    expect(carta('ca').gabarito).toBe('inglês, francês')
    expect(carta('tl').gabarito).toBe('tétum, português')
    expect(carta('br').gabarito).toBe('português')
    expect(carta('za').gabarito.split(', ')).toHaveLength(12)
  })

  it('a dica diz quantas são, e só aparece onde há mais de uma', () => {
    expect(carta('be').dica).toBe('3 oficiais — qualquer uma vale')
    expect(carta('za').dica).toBe('12 oficiais — qualquer uma vale')
    expect(carta('br').dica).toBeUndefined()
  })

  it('o recado sobre Israel vale aqui como vale no mapa e nas bandeiras', () => {
    expect(carta('il').aviso).toBeTruthy()
    expect(carta('br').aviso).toBeUndefined()
  })

  /**
   * Como no baralho de moedas, este deck **viola de propósito** o invariante que
   * `flashcards.test.ts` cobra dos outros ("nenhuma forma aceita é compartilhada
   * entre cartas"): o inglês é oficial em 59 países e tem de valer nos 59. Não é
   * loteria porque não há desempate a fazer — as cartas não têm respostas
   * *parecidas*, têm a mesma resposta, e a forma exata casa antes de qualquer
   * tolerância entrar em cena.
   */
  it('a resposta repetida é esperada, e o inglês lidera com 59 cartas', () => {
    const contagem = new Map<string, number>()
    for (const c of cartas) {
      if (c.tipo !== 'digitada' || c.resposta.tipo !== 'texto') continue
      for (const forma of c.resposta.aceitas) {
        contagem.set(forma, (contagem.get(forma) ?? 0) + 1)
      }
    }
    const ranking = [...contagem]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
    // "castelhano" empata com "espanhol" porque é sinônimo dele nos vinte: a
    // contagem é de formas aceitas, não de línguas.
    expect(ranking).toEqual([
      ['inglês', 59],
      ['francês', 30],
      ['árabe', 24],
      ['castelhano', 20],
      ['espanhol', 20],
    ])
  })
})

describe('a correção', () => {
  /**
   * O ponto do jogo, e a razão de ele não ser "o idioma oficial": recusar
   * "francês" para o Canadá seria corrigir como erro uma resposta certa.
   */
  it('qualquer oficial pontua, em qualquer ordem', () => {
    for (const forma of ['alemão', 'francês', 'italiano', 'romanche']) {
      expect(responder('ch', forma), forma).toBe('certo')
    }
    expect(responder('ca', 'francês')).toBe('certo')
    expect(responder('ca', 'inglês')).toBe('certo')
    expect(responder('in', 'inglês')).toBe('certo')
    expect(responder('in', 'hindi')).toBe('certo')
    expect(responder('za', 'língua de sinais sul-africana')).toBe('certo')
    expect(responder('tl', 'português')).toBe('certo')
    expect(responder('va', 'latim')).toBe('certo')
  })

  it('o nome alternativo da mesma língua vale', () => {
    expect(responder('be', 'flamengo')).toBe('certo')
    expect(responder('nl', 'holandês')).toBe('certo')
    expect(responder('es', 'castelhano')).toBe('certo')
    expect(responder('cn', 'chinês')).toBe('certo')
    expect(responder('ie', 'gaélico')).toBe('certo')
    expect(responder('md', 'moldavo')).toBe('certo')
    expect(responder('ir', 'farsi')).toBe('certo')
  })

  it('"crioulo" vale nos três países de crioulo, cada um com o seu', () => {
    for (const id of ['ht', 'sc', 'mu']) expect(responder(id, 'crioulo'), id).toBe('certo')
    expect(responder('jm', 'crioulo')).toBe('errado')
  })

  it('língua que não é oficial não vale, por mais que se fale', () => {
    // O alemão é a língua mais falada da UE e não é oficial em nenhum destes.
    expect(responder('pl', 'alemão')).toBe('errado')
    expect(responder('br', 'espanhol')).toBe('errado')
    // O árabe perdeu a co-oficialidade em Israel em 2018; ver `data/idiomas.ts`.
    expect(responder('il', 'árabe')).toBe('errado')
    expect(responder('ps', 'árabe')).toBe('certo')
  })

  it('aceita o nome colado e perdoa o dedo escorregado nos nomes longos', () => {
    expect(responder('sc', 'crioulo seichelense')).toBe('certo')
    expect(responder('sc', 'crioulo seichelence')).toBe('quase')
    expect(responder('lu', 'luxemburgues')).toBe('certo')
    expect(responder('by', 'bielorruso')).toBe('quase')
  })

  /**
   * O par medido em `data/idiomas.test.ts`: "islandês" e "irlandês" estão a um
   * caractere de distância, e a Islândia e a Irlanda estão no mesmo baralho. É a
   * trava de vizinhança que segura — o texto que encosta nas duas não vale para
   * nenhuma, porque ambiguidade não se resolve a favor de quem joga.
   */
  it('islandês não dá o ponto da Irlanda, nem o contrário', () => {
    expect(responder('is', 'irlandês')).toBe('errado')
    expect(responder('ie', 'islandês')).toBe('errado')
    expect(responder('is', 'islandês')).toBe('certo')
  })
})
