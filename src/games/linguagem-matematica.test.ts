import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { PROPOSICOES } from '@/data/linguagem-matematica'
import { escolherDistratores, linguagemMatematica } from './linguagem-matematica'

function baralho(seed: number): readonly Carta[] {
  return linguagemMatematica.config().montarBaralho(mulberry32(seed))
}

/** Várias sementes: um sorteio só não diz nada sobre um baralho sorteado. */
const SEMENTES = [1, 7, 42, 99, 1234, 2026]

describe('baralho', () => {
  it('tem uma carta por proposição, todas de escolha', () => {
    const cartas = baralho(7)
    expect(cartas).toHaveLength(PROPOSICOES.length)
    for (const c of cartas) {
      expect(c.tipo, c.id).toBe('escolha')
    }
  })

  it('cada proposição aparece exatamente uma vez', () => {
    const ids = baralho(7).map((c) => c.id).sort()
    expect(ids).toEqual(PROPOSICOES.map((p) => `linguagem-${p.id}`).sort())
  })

  it('monta quatro alternativas, com a certa entre elas e igual ao gabarito', () => {
    for (const seed of SEMENTES) {
      for (const c of baralho(seed)) {
        if (c.tipo !== 'escolha') throw new Error(`${c.id} devia ser de escolha`)
        expect(c.alternativas, `${c.id} @${seed}`).toHaveLength(4)
        expect(c.alternativas[c.indiceCorreto]?.valor, `${c.id} @${seed}`).toBe(c.gabarito)
      }
    }
  })

  it('nunca repete uma alternativa dentro da mesma carta', () => {
    for (const seed of SEMENTES) {
      for (const c of baralho(seed)) {
        if (c.tipo !== 'escolha') continue
        const valores = c.alternativas.map((a) => a.valor)
        expect(new Set(valores).size, `${c.id} @${seed}: ${valores.join(' | ')}`).toBe(4)
      }
    }
  })

  it('a pergunta é a notação crua, sem MathML e sem imagem', () => {
    const porNotacao = new Set(PROPOSICOES.map((p) => p.notacao))
    for (const c of baralho(7)) {
      expect(c.pergunta.kind, c.id).toBe('texto')
      expect(c.pergunta.kind === 'texto' && porNotacao.has(c.pergunta.valor), c.id).toBe(true)
    }
  })

  it('a posição da resposta certa não é sempre a mesma', () => {
    // Bobo de escrever e barato de rodar: um `shuffle` aplicado à lista errada
    // deixaria a certa sempre em A, e o jogo inteiro viraria clicar no primeiro.
    const posicoes = new Set(
      SEMENTES.flatMap((s) =>
        baralho(s).map((c) => (c.tipo === 'escolha' ? c.indiceCorreto : -1)),
      ),
    )
    expect([...posicoes].sort()).toEqual([0, 1, 2, 3])
  })

  it('a mesma semente dá o mesmo baralho', () => {
    expect(JSON.stringify(baralho(42))).toBe(JSON.stringify(baralho(42)))
  })
})

/**
 * O que faz o jogo valer alguma coisa: as três opções erradas.
 *
 * Um distrator que é só "outra frase de matemática" não mede nada — quem não
 * sabe elimina pelo assunto e quem sabe acerta sem ler. Por isso todo distrator
 * do dataset é uma leitura errada da *mesma* notação, e por isso o sorteio
 * prefere três armadilhas diferentes por carta.
 */
describe('os distratores', () => {
  it('toda alternativa errada veio do bolso de distratores da própria carta', () => {
    for (const seed of SEMENTES) {
      const cartas = baralho(seed)
      for (const p of PROPOSICOES) {
        const c = cartas.find((k) => k.id === `linguagem-${p.id}`)
        if (c?.tipo !== 'escolha') throw new Error(`${p.id} não veio`)
        const permitidos = new Set([p.leitura, ...p.distratores.map((d) => d.texto)])
        for (const alt of c.alternativas) {
          expect(permitidos.has(alt.valor), `${p.id} @${seed}: "${alt.valor}" é intruso`).toBe(true)
        }
      }
    }
  })

  it('prefere três classes de erro diferentes sempre que a carta tem três', () => {
    for (const seed of SEMENTES) {
      const rng = mulberry32(seed)
      for (const p of PROPOSICOES) {
        const escolhidos = escolherDistratores(p, rng)
        expect(escolhidos, `${p.id} @${seed}`).toHaveLength(3)

        const disponiveis = new Set(p.distratores.map((d) => d.erro)).size
        const distintos = new Set(escolhidos.map((d) => d.erro)).size
        expect(distintos, `${p.id} @${seed}: armadilhas repetidas à toa`).toBe(
          Math.min(3, disponiveis),
        )
      }
    }
  })

  it('e nunca oferece o mesmo distrator duas vezes', () => {
    for (const seed of SEMENTES) {
      const rng = mulberry32(seed)
      for (const p of PROPOSICOES) {
        const textos = escolherDistratores(p, rng).map((d) => d.texto)
        expect(new Set(textos).size, `${p.id} @${seed}`).toBe(3)
      }
    }
  })

  it('cartas com mais de três distratores de fato variam entre partidas', () => {
    // Se o sorteio não variasse, sobrar distrator seria desperdício de curadoria.
    const comSobra = PROPOSICOES.filter((p) => p.distratores.length > 3)
    expect(comSobra.length, 'ninguém tem distrator sobrando').toBeGreaterThan(5)

    const variou = comSobra.some((p) => {
      const conjuntos = SEMENTES.map((s) =>
        escolherDistratores(p, mulberry32(s))
          .map((d) => d.texto)
          .sort()
          .join('|'),
      )
      return new Set(conjuntos).size > 1
    })
    expect(variou).toBe(true)
  })

  it('a carta de ∃y∀x oferece a leitura com a ordem invertida — sempre', () => {
    /*
     * A carta mais importante do baralho, e o motivo de o jogo existir: a única
     * diferença entre `∀x ∃y : y > x` e `∃y ∀x : y > x` é a ordem dos dois
     * quantificadores, e uma é banalmente verdadeira enquanto a outra é falsa.
     * Se essa leitura não estiver na tela, o item não mede nada.
     */
    const p = PROPOSICOES.find((x) => x.id === 'maximo-dos-reais')
    if (!p) throw new Error('a carta sumiu do dataset')

    for (const seed of SEMENTES) {
      const escolhidos = escolherDistratores(p, mulberry32(seed))
      expect(
        escolhidos.some((d) => d.erro === 'ordem-dos-quantificadores'),
        `@${seed}: saiu sem a armadilha da ordem`,
      ).toBe(true)
    }
  })
})
