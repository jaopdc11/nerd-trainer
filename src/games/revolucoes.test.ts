import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { MARCOS } from '@/data/revolucoes'
import { revolucoes } from './revolucoes'

const cartas: readonly Carta[] = revolucoes.config().montarBaralho(mulberry32(7))

function carta(id: string) {
  const c = cartas.find((k) => k.id === `marco-${id}`)
  if (c?.tipo !== 'digitada') throw new Error(`carta de ${id} não encontrada`)
  return c
}

/**
 * Responde como a engine responde: a vizinhança é montada do mesmo jeito que em
 * `useFlashcard`, com as formas cruas das outras cartas do baralho. Aqui ela
 * decide de verdade — é ela que segura o único par medido como perigoso.
 */
function responder(id: string, texto: string) {
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

describe('metadados', () => {
  it('é flashcard de humanas, com id estável', () => {
    expect(revolucoes.id).toBe('revolucoes')
    expect(revolucoes.mecanica).toBe('flashcard')
    expect(revolucoes.categoria).toBe('humanas')
  })

  /**
   * O contrato que separa este jogo do "Qual veio antes?": aqui não se pergunta
   * data. Se um dia alguém puser uma carta de ano, esta linha do `comoJogar`
   * passa a mentir — e é mais fácil apagar a linha do que a carta, então a
   * linha é testada.
   */
  it('o comoJogar promete que não se pergunta o ano', () => {
    expect(revolucoes.comoJogar.join(' ').toLowerCase()).toContain('não se pergunta o ano')
  })
})

describe('baralho', () => {
  it('tem uma carta por marco, toda digitada e com o fato na pergunta', () => {
    expect(cartas).toHaveLength(MARCOS.length)
    expect(cartas).toHaveLength(32)
    for (const c of cartas) {
      expect(c.tipo, c.id).toBe('digitada')
      expect(c.pergunta.kind, c.id).toBe('texto')
    }
  })

  it('a dica diz o gênero, que é o que o enunciado esconde', () => {
    expect(carta('vestfalia').dica).toBe('tratado, pacto ou congresso')
    expect(carta('francesa').dica).toBe('revolução')
  })

  it('o ano aparece no gabarito e em lugar nenhum antes dele', () => {
    expect(carta('vestfalia').gabarito).toBe('Paz de Vestfália (1648)')
    expect(carta('haitiana').gabarito).toBe('Revolução Haitiana (1791–1804)')
    for (const c of cartas) {
      if (c.pergunta.kind !== 'texto') continue
      expect(c.pergunta.valor, c.id).not.toMatch(/\b1[0-9]{3}\b/)
    }
  })

  it('o baralho vai até o fim: errar custa o ponto, não a partida', () => {
    expect(revolucoes.config().fim).toBe('baralho')
    expect(revolucoes.config().teclado).toBe('texto')
  })

  it('é embaralhado, e o embaralhamento depende do rng', () => {
    const outro = revolucoes.config().montarBaralho(mulberry32(99))
    expect(outro.map((c) => c.id)).not.toEqual(cartas.map((c) => c.id))
    expect(new Set(outro.map((c) => c.id))).toEqual(new Set(cartas.map((c) => c.id)))
  })
})

describe('respostas', () => {
  it('aceita a forma curta e o nome inteiro', () => {
    expect(responder('vestfalia', 'Vestfália')).toBe('certo')
    expect(responder('vestfalia', 'paz de vestfalia')).toBe('certo')
    expect(responder('versalhes', 'Tratado de Versalhes')).toBe('certo')
    expect(responder('cravos', '25 de abril')).toBe('certo')
    expect(responder('americana', 'Revolução Americana')).toBe('certo')
  })

  it('perdoa o dedo escorregado onde o nome é longo', () => {
    // 'quase', e não 'certo': a engine conta como acerto e mostra a grafia
    // certa ao lado. É por isso que a tolerância fica ligada — ninguém deveria
    // perder a carta por um "y" no lugar do "i" em Brest-Litovski.
    expect(responder('brest-litovski', 'Brest-Litovsky')).toBe('quase')
    expect(responder('tordesilhas', 'Tratado de Tordesilias')).toBe('quase')
  })

  /**
   * O par medido no teste do dataset, visto pelo lado do jogador.
   *
   * "Revolução Americana" fica a dois caracteres de "Revolução Mexicana", e o
   * limite de uma resposta desse tamanho é dois. Sem a trava de vizinhança, o
   * nome de uma carta valeria ponto na outra — que é o pior defeito que um jogo
   * de memorização pode ter, porque ensina o erro. Com a trava, a entrada
   * ambígua é recusada, e a resposta exata de cada uma continua passando,
   * porque o casamento exato é decidido antes da tolerância.
   */
  it('não dá a resposta da carta vizinha: Americana não vale por Mexicana', () => {
    expect(responder('mexicana', 'Revolução Americana')).toBe('errado')
    expect(responder('americana', 'Revolução Mexicana')).toBe('errado')
    expect(responder('mexicana', 'Revolução Mexicana')).toBe('certo')
  })

  it('não aceita o gênero no lugar do nome', () => {
    // "Um tratado" não é resposta, e a dica já disse isso de graça.
    expect(responder('vestfalia', 'tratado')).toBe('errado')
    expect(responder('francesa', 'revolução')).toBe('errado')
  })
})
