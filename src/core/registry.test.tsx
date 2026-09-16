import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlashcardEngine } from '@/engines/flashcard/FlashcardEngine'
import { GeneratorEngine } from '@/engines/generator/GeneratorEngine'
import { GridEngine } from '@/engines/grid/GridEngine'
import { SequenceEngine } from '@/engines/sequence/SequenceEngine'
import { mulberry32 } from './rng'
import { JOGOS } from './registry'

/**
 * Todo jogo do catálogo monta e sai da abertura.
 *
 * Existe porque um jogo pode estar registrado, aparecer no menu, e travar no
 * botão "Começar" sem erro visível — foi o que aconteceu com as bandeiras
 * quando o dataset mudou de forma embaixo de um módulo já carregado. O teste é
 * bobo de propósito: ele só clica. Mas é a diferença entre descobrir isso aqui
 * e descobrir jogando.
 */
// O jsdom não implementa `scrollIntoView`, e a fita da sequência chama isso ao
// montar. É buraco do ambiente, não do produto.
Element.prototype.scrollIntoView = () => {}

const PROPS = { onFinalizar: () => {}, recorde: null, run: null }

describe.each(JOGOS.map((j) => [j.id, j] as const))('%s', (id, jogo) => {
  it('a config monta sem explodir', () => {
    expect(() => jogo.config()).not.toThrow()
  })

  it('tem nome, ícone, resumo e instruções', () => {
    expect(jogo.nome.length, id).toBeGreaterThan(2)
    expect(jogo.icone.length, id).toBeGreaterThan(0)
    expect(jogo.resumo.length, id).toBeGreaterThan(10)
    expect(jogo.comoJogar.length, id).toBeGreaterThan(0)
  })

  it('sai da abertura ao começar', () => {
    // `config()` é chamado dentro de cada ramo para o TypeScript estreitar o
    // tipo pela mecânica — fora do switch ele é a união das quatro.
    if (jogo.mecanica === 'sequencia') {
      render(<SequenceEngine jogo={jogo} config={jogo.config()} {...PROPS} />)
    } else if (jogo.mecanica === 'flashcard') {
      render(<FlashcardEngine jogo={jogo} config={jogo.config()} {...PROPS} />)
    } else if (jogo.mecanica === 'gerador') {
      render(<GeneratorEngine jogo={jogo} config={jogo.config()} {...PROPS} />)
    } else {
      render(<GridEngine jogo={jogo} config={jogo.config()} {...PROPS} />)
    }

    fireEvent.click(screen.getByText('Começar'))
    expect(screen.queryByText('Começar'), `${id} travou na abertura`).toBeNull()
  })
})

describe('o catálogo', () => {
  it('não tem id duplicado', () => {
    const ids = JOGOS.map((j) => j.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todo baralho de flashcard tem carta, e toda carta tem gabarito', () => {
    for (const jogo of JOGOS) {
      if (jogo.mecanica !== 'flashcard') continue
      const cartas = jogo.config().montarBaralho(mulberry32(7))
      expect(cartas.length, jogo.id).toBeGreaterThan(0)
      for (const c of cartas) {
        expect(c.gabarito.length, `${jogo.id}/${c.id}`).toBeGreaterThan(0)
        if (c.tipo === 'escolha') {
          expect(c.indiceCorreto, `${jogo.id}/${c.id}`).toBeGreaterThanOrEqual(0)
          expect(c.indiceCorreto, `${jogo.id}/${c.id}`).toBeLessThan(c.alternativas.length)
        }
      }
    }
  })

  it('todo gerador produz exercício em todos os níveis', () => {
    for (const jogo of JOGOS) {
      if (jogo.mecanica !== 'gerador') continue
      const config = jogo.config()
      const rng = mulberry32(3)
      for (let nivel = 0; nivel < 4; nivel++) {
        for (let i = 0; i < 30; i++) {
          const ex = config.gerar(rng, nivel)
          expect(ex.gabarito.length, `${jogo.id} nível ${nivel}`).toBeGreaterThan(0)
        }
      }
    }
  })
})
