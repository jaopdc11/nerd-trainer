import { describe, expect, it } from 'vitest'
import { normalizarTexto } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import { FORMULAS } from '@/data/formulas'
import { escolherDistratores, formulas } from './formulas'

describe('dataset de fórmulas', () => {
  it('tem ids únicos e MathML em todas', () => {
    expect(new Set(FORMULAS.map((f) => f.id)).size).toBe(FORMULAS.length)
    for (const f of FORMULAS) {
      expect(f.mathml, f.id).toMatch(/^<math[\s\S]*<\/math>$/)
      expect(f.latex.length, f.id).toBeGreaterThan(0)
    }
  })

  it('só aponta confundeCom para ids que existem', () => {
    const ids = new Set(FORMULAS.map((f) => f.id))
    for (const f of FORMULAS) {
      for (const outro of f.confundeCom) {
        expect(ids.has(outro), `${f.id} → ${outro}`).toBe(true)
      }
      expect(f.confundeCom, f.id).not.toContain(f.id)
    }
  })

  it('não tem dois nomes iguais entre as alternativas possíveis', () => {
    // Nomes repetidos apareceriam como duas opções idênticas num mesmo card.
    const vistos = new Map<string, string>()
    for (const f of FORMULAS) {
      const chave = normalizarTexto(f.nome, true)
      expect(vistos.get(chave), `"${f.nome}" repetido`).toBeUndefined()
      vistos.set(chave, f.id)
    }
  })
})

describe('escolha de distratores', () => {
  it('sempre devolve três, distintos e diferentes do alvo', () => {
    for (const alvo of FORMULAS) {
      for (let seed = 1; seed <= 20; seed++) {
        const d = escolherDistratores(alvo, mulberry32(seed))
        expect(d, alvo.id).toHaveLength(3)
        expect(d.map((x) => x.id), alvo.id).not.toContain(alvo.id)
        expect(new Set(d.map((x) => x.id)).size, alvo.id).toBe(3)
      }
    }
  })

  it('nunca oferece uma forma equivalente da mesma lei', () => {
    // F = dp/dt é a segunda lei de Newton escrita de outro jeito: oferecê-la
    // como distrator daria duas alternativas corretas.
    for (const alvo of FORMULAS.filter((f) => f.equivalentes.length > 0)) {
      for (let seed = 1; seed <= 30; seed++) {
        for (const x of escolherDistratores(alvo, mulberry32(seed))) {
          expect(alvo.equivalentes, `${alvo.id} × ${x.id}`).not.toContain(x.mathml)
        }
      }
    }
  })

  it('inclui a confusão clássica curada à mão', () => {
    for (const alvo of FORMULAS.filter((f) => f.confundeCom.length > 0)) {
      const d = escolherDistratores(alvo, mulberry32(42))
      expect(
        d.some((x) => alvo.confundeCom.includes(x.id)),
        `${alvo.id} não recebeu distrator curado`,
      ).toBe(true)
    }
  })

  it('mistura domínios, para não dar para eliminar por assunto', () => {
    for (const alvo of FORMULAS) {
      const d = escolherDistratores(alvo, mulberry32(7))
      expect(d.some((x) => x.dominio !== alvo.dominio), alvo.id).toBe(true)
    }
  })
})

describe('baralho', () => {
  it('monta uma carta de escolha por fórmula, com quatro nomes', () => {
    const baralho = formulas.config().montarBaralho(mulberry32(3))
    expect(baralho).toHaveLength(FORMULAS.length)

    for (const carta of baralho) {
      if (carta.tipo !== 'escolha') throw new Error('esperava carta de escolha')
      expect(carta.pergunta.kind).toBe('mathml')
      expect(carta.alternativas).toHaveLength(4)
      // As opções são nomes, não fórmulas: é o nome que o jogador não sabe.
      for (const alt of carta.alternativas) expect(alt.kind).toBe('texto')
    }
  })

  it('aponta o índice correto para o nome do alvo', () => {
    for (const carta of formulas.config().montarBaralho(mulberry32(11))) {
      if (carta.tipo !== 'escolha') continue
      expect(carta.alternativas[carta.indiceCorreto]?.valor).toBe(carta.gabarito)
    }
  })

  it('nunca repete uma alternativa dentro da mesma carta', () => {
    for (const carta of formulas.config().montarBaralho(mulberry32(5))) {
      if (carta.tipo !== 'escolha') continue
      const valores = carta.alternativas.map((a) => a.valor)
      expect(new Set(valores).size, carta.id).toBe(4)
    }
  })

  it('embaralha: duas seeds dão ordens diferentes', () => {
    const a = formulas.config().montarBaralho(mulberry32(1)).map((c) => c.id)
    const b = formulas.config().montarBaralho(mulberry32(2)).map((c) => c.id)
    expect(a).not.toEqual(b)
    expect([...a].sort()).toEqual([...b].sort())
  })
})
