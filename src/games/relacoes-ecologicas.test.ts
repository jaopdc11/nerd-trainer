import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { CASOS, RELACOES, escopoDe, fichaDe } from '@/data/relacoes-ecologicas'
import type { Caso, Escopo } from '@/data/relacoes-ecologicas'
import { relacoesEcologicas } from './relacoes-ecologicas'

const baralho = (seed: number): readonly Carta[] =>
  relacoesEcologicas.config().montarBaralho(mulberry32(seed))

/** Trinta sementes: uma carta só é conferida de verdade sob vários sorteios. */
const SEMENTES = Array.from({ length: 30 }, (_, i) => i + 1)

const escolhas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'escolha') throw new Error(`${c.id} devia ser de escolha`)
    return c
  })

const texto = (c: { kind: string; valor?: string }) => (c.kind === 'texto' ? (c.valor ?? '') : '')

const casoDa = (id: string): Caso => {
  const caso = CASOS.find((c) => `rel-${c.id}` === id)
  if (!caso) throw new Error(`${id} sem caso`)
  return caso
}

const duplo = (caso: Caso) => fichaDe(caso.relacao).escopos.length > 1

/** 'Predatismo (dentro da espécie)' → { relacao, escopo }. */
function lerOpcao(rotulo: string): { relacao: string; escopo?: Escopo } {
  const m = rotulo.match(/^(.+?) \((dentro da espécie|entre espécies)\)$/)
  if (!m) return { relacao: rotulo }
  return {
    relacao: m[1] as string,
    escopo: m[2] === 'dentro da espécie' ? 'intraespecífica' : 'interespecífica',
  }
}

describe('baralho', () => {
  it('tem uma carta por caso', () => {
    const cartas = baralho(7)
    expect(cartas).toHaveLength(CASOS.length)
    expect(cartas.map((c) => c.id.replace('rel-', '')).sort()).toEqual(
      CASOS.map((c) => c.id).sort(),
    )
  })

  it('monta quatro opções distintas, com a certa entre elas', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        expect(c.alternativas, `${c.id} @${seed}`).toHaveLength(4)
        const valores = c.alternativas.map(texto)
        expect(new Set(valores).size, `${c.id} @${seed}: ${valores.join(' | ')}`).toBe(4)

        const caso = casoDa(c.id)
        const certa = lerOpcao(valores[c.indiceCorreto] as string)
        expect(certa.relacao, `${c.id} @${seed}`).toBe(caso.relacao)
        if (duplo(caso)) expect(certa.escopo, `${c.id} @${seed}`).toBe(escopoDe(caso))
      }
    }
  })

  it('a posição da certa varia: o baralho não vira decoreba de índice', () => {
    const posicoes = new Set(SEMENTES.flatMap((s) => escolhas(s).map((c) => c.indiceCorreto)))
    expect(posicoes).toEqual(new Set([0, 1, 2, 3]))
  })

  it('toda alternativa é uma relação cadastrada', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        for (const v of c.alternativas.map(texto)) {
          expect(RELACOES, `${c.id} @${seed}: ${v}`).toContain(lerOpcao(v).relacao)
        }
      }
    }
  })
})

/**
 * O teste que justifica o jogo existir.
 *
 * Se o distrator puder ser qualquer relação, a carta se resolve por eliminação:
 * ninguém oferece amensalismo para o carrapato no boi e espera hesitação. As três
 * erradas têm de ser as confusões que o dataset declara — e, nas relações de
 * escopo duplo, o cruzamento dos dois eixos.
 */
describe('distratores', () => {
  it('nas relações de escopo único, saem todos da lista de confusões do dataset', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        const caso = casoDa(c.id)
        if (duplo(caso)) continue

        const permitidas = [...(caso.confundeCom ?? []), ...fichaDe(caso.relacao).confundeCom]
        for (const v of c.alternativas.map(texto)) {
          const { relacao, escopo } = lerOpcao(v)
          // Sem escopo na tela: as quatro são de escopo único, e o parêntese
          // seria ruído — nenhuma delas poderia ser outra coisa.
          expect(escopo, `${c.id} @${seed}: ${v}`).toBeUndefined()
          if (relacao === caso.relacao) continue
          expect(permitidas, `${c.id} @${seed}: ${relacao}`).toContain(relacao)
        }
      }
    }
  })

  it('os três pares vizinhos aparecem juntos na tela', () => {
    // Mutualismo sem protocooperação ao lado é carta de graça: a diferença entre
    // as duas é a única coisa que a carta quer medir.
    const alvos: readonly (readonly [string, string])[] = [
      ['cupim-protozoario', 'Protocooperação'],
      ['anemona-peixe-palhaco', 'Mutualismo'],
      ['remora-tubarao', 'Inquilinismo'],
      ['sapo-bromelia', 'Comensalismo'],
      ['orquidea-arvore', 'Inquilinismo'],
      ['cipo-chumbo', 'Epifitismo'],
    ]
    const cartas = escolhas(11)
    for (const [id, esperada] of alvos) {
      const carta = cartas.find((c) => c.id === `rel-${id}`)
      expect(carta?.alternativas.map(texto), id).toContain(esperada)
    }
  })

  /**
   * A carta do eixo: as duas relações de escopo duplo, cada uma nos dois escopos.
   *
   * O cruzamento tem de ser completo. A montagem óbvia — a certa, o espelho dela
   * no outro escopo e mais duas confusões quaisquer — vazaria a resposta de
   * graça, porque a única relação listada duas vezes seria a certa, e as oito
   * cartas se acertariam sem ler o enunciado.
   */
  it('nas de escopo duplo, a carta é o cruzamento completo dos eixos', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        const caso = casoDa(c.id)
        if (!duplo(caso)) continue

        const lidas = c.alternativas.map((a) => lerOpcao(texto(a)))
        // Toda alternativa traz escopo: sem isso o parêntese marcaria a certa.
        for (const o of lidas) expect(o.escopo, `${c.id} @${seed}`).toBeDefined()

        const relacoes = [...new Set(lidas.map((o) => o.relacao))].sort()
        expect(relacoes.length, `${c.id} @${seed}`).toBe(2)
        expect(relacoes, `${c.id} @${seed}`).toContain(caso.relacao)
        // As duas nos dois escopos, sem sobra: 2 × 2 = 4 alternativas distintas.
        for (const r of relacoes) {
          const escoposDela = lidas.filter((o) => o.relacao === r).map((o) => o.escopo)
          expect(new Set(escoposDela).size, `${c.id} @${seed}: ${r}`).toBe(2)
          expect(fichaDe(r as never).escopos.length, `${r} devia ter escopo duplo`).toBe(2)
        }
        // A parceira é confusão declarada, não um par escrito à mão no jogo.
        const parceira = relacoes.find((r) => r !== caso.relacao) as string
        expect(fichaDe(caso.relacao).confundeCom, `${c.id}`).toContain(parceira)
      }
    }
  })

  it('as oito cartas do eixo não caem todas no mesmo escopo', () => {
    // Se todas fossem interespecíficas, marcar sempre "entre espécies" acertaria
    // metade do eixo sem saber nada.
    const doEixo = CASOS.filter(duplo)
    const escopos = doEixo.map(escopoDe)
    expect(escopos).toContain('intraespecífica')
    expect(escopos).toContain('interespecífica')
  })
})

describe('gabarito e explicações', () => {
  it('o gabarito traz o quadrante e a marca, não só o nome errado de volta', () => {
    for (const c of escolhas(3)) {
      const caso = casoDa(c.id)
      const ficha = fichaDe(caso.relacao)
      expect(c.gabarito, c.id).toContain(ficha.nome)
      expect(c.gabarito, c.id).toContain(ficha.harmonia)
      expect(c.gabarito, c.id).toContain(escopoDe(caso))
      expect(c.gabarito, c.id).toContain(ficha.marca)
    }
  })

  it('o caso disputado leva a disputa para a tela, acertado ou errado', () => {
    for (const c of escolhas(5)) {
      expect(c.explicacao, c.id).toBe(casoDa(c.id).disputa)
    }
    expect(escolhas(5).filter((c) => c.explicacao !== undefined).length).toBeGreaterThanOrEqual(8)
  })
})

describe('jogo', () => {
  it('vai até o fim do baralho: errar custa o ponto, não a partida', () => {
    expect(relacoesEcologicas.config().fim).toBe('baralho')
  })

  it('é de biológicas e tem id estável', () => {
    expect(relacoesEcologicas.id).toBe('relacoes-ecologicas')
    expect(relacoesEcologicas.categoria).toBe('biologicas')
  })
})
