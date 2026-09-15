import { describe, expect, it } from 'vitest'
import { normalizarTexto, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import { FORMULAS } from '@/data/formulas'
import { escolherDistratores, formulas } from './formulas'

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

describe('escolha de distratores', () => {
  it('sempre devolve três, e nenhum é o próprio alvo', () => {
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
        const d = escolherDistratores(alvo, mulberry32(seed))
        for (const x of d) {
          expect(alvo.equivalentes, `${alvo.id} × ${x.id}`).not.toContain(x.mathml)
        }
      }
    }
  })

  it('costuma incluir a confusão clássica curada à mão', () => {
    const comConfusao = FORMULAS.filter((f) => f.confundeCom.length > 0)
    for (const alvo of comConfusao) {
      const d = escolherDistratores(alvo, mulberry32(42))
      const temCurado = d.some((x) => alvo.confundeCom.includes(x.id))
      expect(temCurado, `${alvo.id} não recebeu distrator curado`).toBe(true)
    }
  })

  it('mistura domínios: nem todos os distratores são do mesmo assunto', () => {
    // Se os três fossem do mesmo domínio, daria para eliminar por assunto.
    let misturados = 0
    for (const alvo of FORMULAS) {
      const d = escolherDistratores(alvo, mulberry32(7))
      if (d.some((x) => x.dominio !== alvo.dominio)) misturados++
    }
    expect(misturados).toBe(FORMULAS.length)
  })
})

describe('baralho', () => {
  it('no modo escolha, a alternativa correta é a do alvo', () => {
    const baralho = formulas.config('escolha').montarBaralho(mulberry32(3))
    expect(baralho.length).toBe(FORMULAS.length)

    for (const carta of baralho) {
      if (carta.tipo !== 'escolha') throw new Error('esperava carta de escolha')
      expect(carta.alternativas).toHaveLength(4)
      expect(carta.indiceCorreto).toBeGreaterThanOrEqual(0)

      const alvo = FORMULAS.find((f) => f.nome === carta.gabarito)
      expect(carta.alternativas[carta.indiceCorreto]?.valor).toBe(alvo?.mathml)
    }
  })

  it('no modo escolha, nunca há duas alternativas iguais', () => {
    const baralho = formulas.config('escolha').montarBaralho(mulberry32(11))
    for (const carta of baralho) {
      if (carta.tipo !== 'escolha') continue
      const valores = carta.alternativas.map((a) => a.valor)
      expect(new Set(valores).size, carta.id).toBe(4)
    }
  })

  it('no modo nome, aceita os sinônimos declarados', () => {
    const baralho = formulas.config('nome').montarBaralho(mulberry32(5))
    const newton = baralho.find((c) => c.id === 'formula-nome-newton-2')
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

  it('o modo misto produz os dois tipos de carta', () => {
    const baralho = formulas.config('misto').montarBaralho(mulberry32(9))
    expect(baralho.some((c) => c.tipo === 'digitada')).toBe(true)
    expect(baralho.some((c) => c.tipo === 'escolha')).toBe(true)
  })
})
