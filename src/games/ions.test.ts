import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { IONS, formulaDoIon } from '@/data/ions'
import { ions } from './ions'

const cartas: readonly Carta[] = ions.config().montarBaralho(mulberry32(7))

function carta(formula: string) {
  const ion = IONS.find((i) => formulaDoIon(i) === formula)
  if (ion === undefined) throw new Error(`íon ${formula} não está no dataset`)
  const c = cartas.find((k) => k.id === `ion-${ion.nucleo}-${ion.carga}`)
  if (c?.tipo !== 'digitada') throw new Error(`carta de ${formula} não encontrada`)
  return c
}

/**
 * Responde como a engine responde: a vizinhança é montada do mesmo jeito que em
 * `useFlashcard`, com as formas cruas das outras cartas. Aqui ela não deveria
 * decidir nada — a tolerância a erro de digitação está desligada e o validador
 * nem chega na trava —, e é justamente isso que os testes abaixo fixam.
 */
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
  it('tem uma carta por íon, toda ela digitada e com a fórmula na pergunta', () => {
    expect(cartas).toHaveLength(IONS.length)
    for (const c of cartas) {
      expect(c.tipo, c.id).toBe('digitada')
      expect(c.pergunta.kind, c.id).toBe('texto')
    }
  })

  it('separa Fe²⁺ de Fe³⁺ — o núcleo sozinho não identifica a carta', () => {
    expect(carta('Fe²⁺').id).not.toBe(carta('Fe³⁺').id)
    expect(new Set(cartas.map((c) => c.id)).size).toBe(cartas.length)
  })

  it('diz na dica se é cátion ou ânion, que é o que o sobrescrito esconde', () => {
    expect(carta('Ca²⁺').dica).toBe('cátion')
    expect(carta('SO₄²⁻').dica).toBe('ânion')
  })

  it('mostra as duas tradições no gabarito quando elas existem', () => {
    // Quem respondeu "bicarbonato" e errou por outro motivo não pode sair
    // achando que bicarbonato foi recusado.
    expect(carta('HCO₃⁻').gabarito).toBe('hidrogenocarbonato (ou bicarbonato)')
    expect(carta('Fe²⁺').gabarito).toBe('ferro(II) (ou ferroso)')
    expect(carta('SO₄²⁻').gabarito).toBe('sulfato')
  })
})

describe('respostas', () => {
  it('aceita o nome, sem ligar para acento nem caixa', () => {
    expect(responder('Ca²⁺', 'cálcio')).toBe('certo')
    expect(responder('Ca²⁺', 'CALCIO')).toBe('certo')
    expect(responder('MnO₄⁻', 'permanganato')).toBe('certo')
    expect(responder('Cr₂O₇²⁻', 'dicromato')).toBe('certo')
  })

  it('aceita as duas tradições e as grafias que o teclado facilita', () => {
    expect(responder('Fe²⁺', 'ferroso')).toBe('certo')
    expect(responder('Fe²⁺', 'ferro(II)')).toBe('certo')
    expect(responder('Fe²⁺', 'ferro 2')).toBe('certo')
    expect(responder('HCO₃⁻', 'bicarbonato')).toBe('certo')
    expect(responder('HSO₄⁻', 'hidrogenosulfato')).toBe('certo')
  })

  /**
   * O motivo de `tolerarTypo: false` neste baralho, em forma de teste.
   *
   * Três íons de sete letras separados por uma vogal, e a régua padrão perdoa um
   * caractere a cada sete. Com a tolerância ligada, a única coisa entre o ponto
   * e o íon errado seria a trava de vizinhança — que só funciona enquanto o
   * irmão estiver no baralho como carta digitada. Aqui a letra é a resposta.
   */
  it('não perdoa a vogal que separa sulfeto, sulfito e sulfato', () => {
    expect(responder('SO₄²⁻', 'sulfito')).toBe('errado')
    expect(responder('SO₄²⁻', 'sulfeto')).toBe('errado')
    expect(responder('SO₃²⁻', 'sulfato')).toBe('errado')
    expect(responder('S²⁻', 'sulfito')).toBe('errado')
    expect(responder('NO₃⁻', 'nitrito')).toBe('errado')
    expect(responder('Cl⁻', 'clorito')).toBe('errado')
  })

  it('não dá o ponto do vizinho de carga', () => {
    expect(responder('Fe²⁺', 'ferro 3')).toBe('errado')
    expect(responder('Fe³⁺', 'ferroso')).toBe('errado')
    expect(responder('Cu⁺', 'cúprico')).toBe('errado')
  })

  it('não confunde hipoclorito, clorito, clorato e perclorato', () => {
    expect(responder('ClO⁻', 'hipoclorito')).toBe('certo')
    expect(responder('ClO⁻', 'clorito')).toBe('errado')
    expect(responder('ClO₃⁻', 'clorito')).toBe('errado')
    expect(responder('ClO₄⁻', 'clorato')).toBe('errado')
  })
})
