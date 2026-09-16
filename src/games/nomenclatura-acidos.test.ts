import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import type { EspecResposta } from '@/core/answer/types'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { ACIDOS, formulaDoAcido } from '@/data/acidos'
import { nomenclaturaAcidos } from './nomenclatura-acidos'

const cartas: readonly Carta[] = nomenclaturaAcidos.config().montarBaralho(mulberry32(7))

function carta(formula: string) {
  const c = cartas.find((k) => k.id === `acido-${formula}`)
  if (c?.tipo !== 'digitada') throw new Error(`carta de ${formula} não encontrada`)
  return c
}

function responder(formula: string, texto: string) {
  const alvo = carta(formula)
  const vizinhanca = new Set(
    cartas.flatMap((c) =>
      c.id !== alvo.id && c.tipo === 'digitada' && c.resposta.tipo === 'texto'
        ? c.resposta.aceitas
        : [],
    ),
  )
  return validar(texto, alvo.resposta, { rigor: 'estrito', vizinhanca }).veredito
}

describe('baralho', () => {
  it('tem uma carta por ácido, digitada, com a fórmula na pergunta', () => {
    expect(cartas).toHaveLength(ACIDOS.length)
    for (const c of cartas) {
      expect(c.tipo, c.id).toBe('digitada')
      expect(c.pergunta.kind, c.id).toBe('texto')
    }
  })

  it('cobre as séries inteiras — o baralho é a régua da regra', () => {
    for (const formula of ['HClO', 'HClO₂', 'HClO₃', 'HClO₄', 'H₃PO₂', 'HBrO₄', 'HIO₂']) {
      expect(cartas.map((c) => c.id), formula).toContain(`acido-${formula}`)
    }
    expect(new Set(cartas.map((c) => c.id)).size).toBe(cartas.length)
  })

  it('o gabarito é o nome inteiro, com "ácido"', () => {
    expect(carta('HClO').gabarito).toBe('ácido hipocloroso')
    expect(carta('H₃PO₂').gabarito).toBe('ácido hipofosforoso')
  })
})

describe('respostas', () => {
  it('aceita com e sem a palavra "ácido", e sem acento', () => {
    expect(responder('HClO', 'ácido hipocloroso')).toBe('certo')
    expect(responder('HClO', 'hipocloroso')).toBe('certo')
    expect(responder('HClO₃', 'clorico')).toBe('certo')
    expect(responder('HClO₃', 'ÁCIDO CLÓRICO')).toBe('certo')
    expect(responder('HCl', 'clorídrico')).toBe('certo')
  })

  it('a série inteira do cloro responde certo, cada uma na sua', () => {
    expect(responder('HClO', 'hipocloroso')).toBe('certo')
    expect(responder('HClO₂', 'cloroso')).toBe('certo')
    expect(responder('HClO₃', 'clórico')).toBe('certo')
    expect(responder('HClO₄', 'perclórico')).toBe('certo')
  })

  it('não troca um degrau pelo vizinho', () => {
    expect(responder('HClO₂', 'clórico')).toBe('errado')
    expect(responder('HClO₃', 'cloroso')).toBe('errado')
    expect(responder('HClO₄', 'clórico')).toBe('errado')
    expect(responder('HClO', 'cloroso')).toBe('errado')
    // E não confunde o hidrácido com o oxiácido de mesma raiz.
    expect(responder('HCl', 'hipocloroso')).toBe('errado')
    expect(responder('HClO', 'clorídrico')).toBe('errado')
  })

  /**
   * A medição que decidiu `tolerarTypo: false`, fixada em teste.
   *
   * Com a régua padrão, "ácido sulfuroso" passaria como quase-acerto no H₂SO₄:
   * as duas chaves têm 14 caracteres, o que vale 2 de tolerância, e a distância
   * entre elas é exatamente 2. Quem barraria seria só a trava de vizinhança, que
   * depende de o irmão estar no baralho. Desligada a tolerância, a resposta é
   * errada por mérito próprio — e é isso que este par de expectativas guarda.
   */
  it('a tolerância padrão engoliria -oso × -ico, e é por isso que ela está desligada', () => {
    const comTolerancia: EspecResposta = {
      tipo: 'texto',
      canonica: 'ácido sulfúrico',
      aceitas: ['ácido sulfúrico'],
    }
    expect(validar('ácido sulfuroso', comTolerancia, { rigor: 'estrito' }).veredito).toBe('quase')

    expect(responder('H₂SO₄', 'ácido sulfuroso')).toBe('errado')
    expect(responder('H₂SO₃', 'ácido sulfúrico')).toBe('errado')
  })

  it('cobra o prefixo: hipo- e per- não são enfeite', () => {
    expect(responder('HBrO', 'bromoso')).toBe('errado')
    expect(responder('HBrO₄', 'brômico')).toBe('errado')
    expect(responder('H₃PO₂', 'fosforoso')).toBe('errado')
    expect(responder('H₃PO₃', 'hipofosforoso')).toBe('errado')
  })
})

describe('coerência com o dataset', () => {
  it('toda carta aceita exatamente as formas que o dataset declara', () => {
    for (const a of ACIDOS) {
      const c = carta(formulaDoAcido(a))
      expect(c.resposta.tipo).toBe('texto')
      if (c.resposta.tipo !== 'texto') continue
      expect(c.resposta.opcoes?.tolerarTypo, formulaDoAcido(a)).toBe(false)
    }
  })
})
