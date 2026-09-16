import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import { DISTRATORES_FIXOS, LUAS, NOME_PLANETA, distratores } from '@/data/luas'
import type { Carta } from '@/core/types'
import { luas, montarBaralhoLuas } from './luas'

/**
 * O baralho, medido em muitas sementes.
 *
 * Um terço de cada carta é sorteado, então uma rodada só não prova nada: o
 * defeito que interessa pegar — a alternativa duplicada, o distrator fixo que
 * sumiu — apareceria em uma semente e passaria batido em outra.
 */
const SEMENTES = Array.from({ length: 40 }, (_, i) => i * 7919 + 13)
const BARALHOS = SEMENTES.map((s) => montarBaralhoLuas(mulberry32(s)))
const PRIMEIRO = BARALHOS[0] as readonly Carta[]

const nomesDePlaneta = new Set(Object.values(NOME_PLANETA))
const opcoes = (c: Carta): readonly string[] =>
  c.tipo === 'escolha' ? c.alternativas.map((a) => (a.kind === 'texto' ? a.valor : '')) : []

describe('baralho', () => {
  it('é uma carta por lua, todas de escolha, com id único', () => {
    expect(PRIMEIRO).toHaveLength(LUAS.length)
    for (const c of PRIMEIRO) {
      expect(c.tipo, c.id).toBe('escolha')
      expect(c.id).toMatch(/^lua-[a-z]+$/)
    }
    expect(new Set(PRIMEIRO.map((c) => c.id)).size).toBe(LUAS.length)
  })

  it('a pergunta é só o nome da lua', () => {
    // Qualquer complemento seria dica: "a lua marciana Fobos" responde sozinha.
    for (const l of LUAS) {
      const c = PRIMEIRO.find((x) => x.id === `lua-${l.id}`)
      expect(c?.pergunta).toEqual({ kind: 'texto', valor: l.nome })
    }
  })

  it('quatro alternativas distintas, todas planetas, com a certa entre elas', () => {
    for (const baralho of BARALHOS) {
      for (const c of baralho) {
        if (c.tipo !== 'escolha') continue
        const alts = opcoes(c)
        expect(alts, c.id).toHaveLength(4)
        expect(new Set(alts).size, `${c.id}: ${alts.join(' | ')}`).toBe(4)
        for (const a of alts) expect(nomesDePlaneta.has(a), `${c.id}: ${a}`).toBe(true)
        const lua = LUAS.find((l) => `lua-${l.id}` === c.id)
        if (!lua) throw new Error(`${c.id} não tem lua correspondente`)
        expect(alts[c.indiceCorreto], c.id).toBe(NOME_PLANETA[lua.planeta])
      }
    }
  })

  it('nunca oferece Mercúrio nem Vênus', () => {
    // Os dois não têm lua: quem sabe disso eliminaria a opção sem ler a
    // pergunta, e a carta de quatro viraria de três.
    for (const baralho of BARALHOS) {
      for (const c of baralho) {
        expect(opcoes(c)).not.toContain('Mercúrio')
        expect(opcoes(c)).not.toContain('Vênus')
      }
    }
  })
})

describe('distratores na carta', () => {
  it('os dois que confundem de verdade estão sempre na tela', () => {
    // É o contrato do jogo: a carta de Reia tem de mostrar Júpiter, senão não
    // pergunta nada. Um sorteio que substituísse um fixo esvaziaria a carta.
    for (const baralho of BARALHOS) {
      for (const c of baralho) {
        const lua = LUAS.find((l) => `lua-${l.id}` === c.id)
        if (!lua) throw new Error(`${c.id} não tem lua correspondente`)
        const fixos = distratores(lua.planeta).slice(0, DISTRATORES_FIXOS)
        for (const f of fixos) {
          expect(opcoes(c), `${c.id} perdeu ${f}`).toContain(NOME_PLANETA[f])
        }
      }
    }
  })

  it('o terceiro gira entre as sementes — o cardápio não vira a resposta', () => {
    // Com os três fixos, toda carta de Júpiter mostraria o mesmo trio e a
    // pessoa aprenderia a reconhecer o conjunto de opções em vez das luas.
    const conjuntos = new Set(
      BARALHOS.map((b) => {
        const c = b.find((x) => x.id === 'lua-ganimedes') as Carta
        return [...opcoes(c)].sort().join('|')
      }),
    )
    expect(conjuntos.size, 'o terceiro distrator não está girando').toBeGreaterThan(1)
  })

  it('a carta de lua de Saturno mostra Júpiter, e a de Júpiter mostra Saturno', () => {
    for (const id of ['lua-tita', 'lua-encelado', 'lua-reia', 'lua-japeto']) {
      expect(opcoes(PRIMEIRO.find((c) => c.id === id) as Carta)).toContain('Júpiter')
    }
    for (const id of ['lua-io', 'lua-europa', 'lua-ganimedes', 'lua-calisto']) {
      expect(opcoes(PRIMEIRO.find((c) => c.id === id) as Carta)).toContain('Saturno')
    }
  })
})

describe('gabarito', () => {
  it('abre pelo planeta e leva o fato junto', () => {
    for (const l of LUAS) {
      const c = PRIMEIRO.find((x) => x.id === `lua-${l.id}`) as Carta
      expect(c.gabarito.startsWith(NOME_PLANETA[l.planeta]), l.nome).toBe(true)
      expect(c.gabarito, l.nome).toContain(l.nota)
    }
  })
})

describe('declaração do jogo', () => {
  it('é flashcard de baralho completo, em física', () => {
    expect(luas.id).toBe('luas')
    expect(luas.mecanica).toBe('flashcard')
    expect(luas.categoria).toBe('fisica')
    const config = luas.config()
    expect(config.fim).toBe('baralho')
    expect(config.montarBaralho(mulberry32(3))).toHaveLength(22)
  })
})
