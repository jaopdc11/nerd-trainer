import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { CONFUNDEM, EXPRESSOES } from '@/data/latim'
import { latim } from './latim'

const baralho = (seed: number): readonly Carta[] => latim.config().montarBaralho(mulberry32(seed))

/** Trinta sementes: uma carta só é conferida de verdade sob vários sorteios. */
const SEMENTES = Array.from({ length: 30 }, (_, i) => i + 1)

const escolhas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'escolha') throw new Error(`${c.id} devia ser de escolha`)
    return c
  })

const texto = (c: { kind: string; valor?: string }) => (c.kind === 'texto' ? (c.valor ?? '') : '')
const expressaoDe = (id: string) => {
  const e = EXPRESSOES.find((x) => `latim-${x.id}` === id)
  if (!e) throw new Error(`${id} sem expressão`)
  return e
}

describe('baralho', () => {
  it('tem uma carta por expressão, e a pergunta é a expressão em latim', () => {
    const cartas = baralho(7)
    expect(cartas).toHaveLength(EXPRESSOES.length)
    expect(cartas.map((c) => texto(c.pergunta)).sort()).toEqual(
      EXPRESSOES.map((e) => e.expressao).sort(),
    )
  })

  it('a pergunta é a expressão e a resposta é o significado, nunca o contrário', () => {
    // A direção é decisão explícita — ver o cabeçalho do módulo. O uso real é
    // receptivo: ninguém precisa produzir latim, precisa entender o que leu.
    for (const c of escolhas(4)) {
      const e = expressaoDe(c.id)
      expect(texto(c.pergunta), c.id).toBe(e.expressao)
      expect(texto(c.alternativas[c.indiceCorreto] ?? { kind: 'texto', valor: '' }), c.id).toBe(
        e.significado,
      )
    }
  })

  it('monta quatro opções distintas, com a certa entre elas', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        expect(c.alternativas, `${c.id} @${seed}`).toHaveLength(4)
        const valores = c.alternativas.map(texto)
        expect(new Set(valores).size, `${c.id} @${seed}`).toBe(4)
        expect(valores[c.indiceCorreto], `${c.id} @${seed}`).toBe(expressaoDe(c.id).significado)
      }
    }
  })

  /**
   * O teste que justifica o jogo existir.
   *
   * Duas exigências de uma vez. A primeira: toda opção errada é o significado
   * **verdadeiro** de outra expressão, nunca uma frase que eu inventei — frase
   * inventada se denuncia pelo estilo e a carta passa a medir prosa. A segunda:
   * essa outra expressão é a que se confunde com esta ou é do mesmo domínio;
   * senão a carta se resolve pelo tom, com três frases de citação acadêmica e uma
   * de processo penal na tela.
   */
  it('todo distrator é significado verdadeiro de uma expressão irmã', () => {
    const porSignificado = new Map(EXPRESSOES.map((e) => [e.significado, e]))

    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        const certa = expressaoDe(c.id)
        const declarados = CONFUNDEM[certa.id] ?? []

        for (const [i, alt] of c.alternativas.entries()) {
          if (i === c.indiceCorreto) continue
          const outra = porSignificado.get(texto(alt))
          expect(outra, `${c.id} @${seed}: "${texto(alt)}" não é significado de ninguém`).toBeDefined()
          if (!outra) continue
          expect(
            declarados.includes(outra.id) || outra.dominio === certa.dominio,
            `${c.id} @${seed}: "${outra.expressao}" não se confunde com "${certa.expressao}"`,
          ).toBe(true)
        }
      }
    }
  })

  it('oferece o par opositivo, que é a opção que a pessoa marca', () => {
    // Quem sabe que existe o par e trocou a metade é exatamente quem este jogo
    // quer pegar. Se o par nunca aparecer na tela, a carta vira enfeite.
    const pares: readonly (readonly [string, string])[] = [
      ['ex-nunc', 'ex-tunc'],
      ['ex-tunc', 'ex-nunc'],
      ['a-priori', 'a-posteriori'],
      ['de-facto', 'de-jure'],
      ['stricto-sensu', 'lato-sensu'],
      ['erga-omnes', 'inter-partes'],
      ['rebus-sic-stantibus', 'pacta-sunt-servanda'],
      ['ibidem', 'idem'],
    ]

    for (const [id, irma] of pares) {
      const alvo = EXPRESSOES.find((e) => e.id === irma)
      const apareceu = SEMENTES.some((seed) =>
        escolhas(seed)
          .find((c) => c.id === `latim-${id}`)
          ?.alternativas.some((a) => texto(a) === alvo?.significado),
      )
      expect(apareceu, `${id} nunca ofereceu "${irma}" em ${SEMENTES.length} sorteios`).toBe(true)
    }
  })

  it('nunca põe a tradução literal entre as alternativas', () => {
    // O literal é meia-resposta: "sem a qual não" ao lado de "a condição sem a
    // qual a coisa não acontece" seriam duas opções certas na mesma tela.
    const literais = new Set(EXPRESSOES.map((e) => e.literal))
    for (const seed of [1, 2, 3]) {
      for (const c of escolhas(seed)) {
        for (const a of c.alternativas) expect(literais, c.id).not.toContain(texto(a))
      }
    }
  })

  it('o gabarito traz a expressão, o significado e o pé da letra', () => {
    const c = escolhas(5).find((k) => k.id === 'latim-habeas-corpus')
    expect(c?.gabarito).toContain('habeas corpus')
    expect(c?.gabarito).toContain('apresentado ao juiz')
    expect(c?.gabarito).toContain('que tenhas o corpo')
  })

  it('não deixa a resposta certa parada na mesma posição', () => {
    const posicoes = new Set(SEMENTES.flatMap((s) => escolhas(s).map((c) => c.indiceCorreto)))
    expect(posicoes).toEqual(new Set([0, 1, 2, 3]))
  })

  it('varia os distratores entre sementes', () => {
    // Fora do par declarado, o trio vem do domínio e é sorteado: um card que
    // mostrasse sempre as mesmas quatro frases seria decorado por posição.
    const trios = new Set(
      SEMENTES.map(
        (seed) =>
          escolhas(seed)
            .find((c) => c.id === 'latim-ad-hoc')
            ?.alternativas.map(texto)
            .sort()
            .join('|') ?? '',
      ),
    )
    expect(trios.size).toBeGreaterThan(1)
  })

  it('a mesma semente dá o mesmo baralho', () => {
    // Regra do núcleo: nenhum jogo chama Math.random().
    const resumo = (seed: number) =>
      escolhas(seed).map((c) => `${c.id}:${c.alternativas.map(texto).join('~')}`)
    expect(resumo(11)).toEqual(resumo(11))
    expect(resumo(11)).not.toEqual(resumo(12))
  })
})

describe('declaração do jogo', () => {
  it('se declara como o registry espera', () => {
    expect(latim.id).toBe('latim')
    expect(latim.mecanica).toBe('flashcard')
    expect(latim.categoria).toBe('humanas')
    expect(latim.config().fim).toBe('baralho')
  })

  it('o resumo e o comoJogar não prometem digitação', () => {
    const t = [latim.resumo, ...latim.comoJogar].join(' ')
    expect(t).not.toMatch(/escreva|digite/i)
  })
})
