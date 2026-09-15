import { describe, expect, it } from 'vitest'
import { normalizarTexto, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import { FORMULAS } from '@/data/formulas'
import { formulas } from './formulas'

const ESTRITO = { rigor: 'estrito' } as const

describe('dataset de fórmulas', () => {
  it('tem ids únicos e MathML em todas', () => {
    expect(new Set(FORMULAS.map((f) => f.id)).size).toBe(FORMULAS.length)
    for (const f of FORMULAS) {
      expect(f.mathml, f.id).toMatch(/^<math[\s\S]*<\/math>$/)
      expect(f.latex.length, f.id).toBeGreaterThan(0)
    }
  })

  it('só aponta confundeCom para ids que existem', () => {
    // O campo não é usado hoje (a múltipla escolha saiu junto com os modos),
    // mas é curadoria cara de refazer: o teste mantém ele íntegro para quando
    // essa direção voltar.
    const ids = new Set(FORMULAS.map((f) => f.id))
    for (const f of FORMULAS) {
      for (const outro of f.confundeCom) {
        expect(ids.has(outro), `${f.id} → ${outro}`).toBe(true)
      }
      expect(f.confundeCom, f.id).not.toContain(f.id)
    }
  })

  it('não deixa duas fórmulas aceitarem o mesmo nome', () => {
    const dono = new Map<string, string>()
    for (const f of FORMULAS) {
      for (const forma of new Set([f.nome, ...f.sinonimos].map((n) => normalizarTexto(n, true)))) {
        const anterior = dono.get(forma)
        expect(anterior, `"${forma}" serve para ${anterior} e ${f.id}`).toBeUndefined()
        dono.set(forma, f.id)
      }
    }
  })
})

describe('baralho', () => {
  it('tem uma carta digitada por fórmula', () => {
    const baralho = formulas.config().montarBaralho(mulberry32(3))
    expect(baralho).toHaveLength(FORMULAS.length)
    for (const carta of baralho) {
      expect(carta.tipo).toBe('digitada')
      expect(carta.pergunta.kind).toBe('mathml')
    }
  })

  it('aceita os sinônimos declarados e recusa o nome de outra fórmula', () => {
    const baralho = formulas.config().montarBaralho(mulberry32(5))
    const newton = baralho.find((c) => c.id === 'formula-newton-2')
    if (newton?.tipo !== 'digitada') throw new Error('carta não encontrada')

    for (const forma of [
      'Segunda lei de Newton',
      'segunda lei de newton',
      'princípio fundamental da dinâmica',
      'principio fundamental da dinamica',
    ]) {
      expect(validar(forma, newton.resposta, ESTRITO).veredito, forma).toBe('certo')
    }
    expect(validar('lei de hooke', newton.resposta, ESTRITO).veredito).toBe('errado')
  })

  it('embaralha: duas seeds dão ordens diferentes', () => {
    const a = formulas.config().montarBaralho(mulberry32(1)).map((c) => c.id)
    const b = formulas.config().montarBaralho(mulberry32(2)).map((c) => c.id)
    expect(a).not.toEqual(b)
    expect([...a].sort()).toEqual([...b].sort())
  })
})
