import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { CODONS, codonsDe, rotulo, traduzir, vizinhos } from '@/data/codigo-genetico'
import { codigoGenetico } from './codigo-genetico'

type Escolha = Extract<Carta, { tipo: 'escolha' }>

const montar = (seed: number) => codigoGenetico.config().montarBaralho(mulberry32(seed))

const BARALHO = montar(7).filter((c): c is Escolha => c.tipo === 'escolha')

const cartaDe = (codon: string) => BARALHO.find((c) => c.id === `codon-${codon}`) as Escolha

/** As alternativas da carta, como texto. */
const textosDe = (c: Escolha): readonly string[] =>
  c.alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))

describe('baralho', () => {
  it('é a tabela inteira, uma carta de escolha por códon', () => {
    expect(BARALHO).toHaveLength(64)
    expect(new Set(BARALHO.map((c) => c.id)).size).toBe(64)
    expect(codigoGenetico.mecanica).toBe('flashcard')
    expect(codigoGenetico.categoria).toBe('biologicas')
  })

  it('é morte súbita — a decisão que faz 64 cartas caberem numa partida', () => {
    // 32 das 64 cartas são oito fatos. Baralho completo pediria 64 respostas
    // para perguntar 16 coisas.
    expect(codigoGenetico.config().fim).toBe('morte-subita')
  })

  it('pergunta o códon sozinho, sem pista nenhuma', () => {
    for (const codon of CODONS) {
      const c = cartaDe(codon)
      expect(c.pergunta.kind === 'texto' && c.pergunta.valor, codon).toBe(codon)
    }
  })
})

describe('alternativas', () => {
  it('são sempre quatro, distintas, e a certa é a que a tabela diz', () => {
    for (const codon of CODONS) {
      const c = cartaDe(codon)
      const textos = textosDe(c)
      expect(textos, codon).toHaveLength(4)
      expect(new Set(textos).size, `${codon}: alternativa repetida`).toBe(4)
      expect(textos[c.indiceCorreto], codon).toBe(rotulo(traduzir(codon)))
    }
  })

  it('as três erradas são sempre vizinhas de um nucleotídeo — nunca sorteio entre os 20', () => {
    // A trava contra a carta que não mede nada. "Prolina" como opção para UGG se
    // elimina sozinha e transforma quatro alternativas em três.
    for (const codon of CODONS) {
      const c = cartaDe(codon)
      const certo = rotulo(traduzir(codon))
      const possiveis = new Set(vizinhos(codon).map((v) => rotulo(traduzir(v))))
      for (const texto of textosDe(c)) {
        if (texto === certo) continue
        expect(possiveis, `${codon}: "${texto}" não é vizinho de um nucleotídeo`).toContain(texto)
      }
    }
  })

  it('o índice correto não fica preso numa posição', () => {
    // Sem embaralhar, a resposta certa seria sempre a primeira e o jogo mediria
    // paciência para clicar, não biologia.
    expect(new Set(BARALHO.map((c) => c.indiceCorreto))).toEqual(new Set([0, 1, 2, 3]))
  })

  it('a parada aparece como opção do triptofano, e vice-versa', () => {
    // O par mais caro do código: um nucleotídeo separa UGG de UGA, e um dos dois
    // termina a proteína. Se isto sumir, o bloco UG parou de ensinar.
    expect(textosDe(cartaDe('UGG'))).toContain('parada')
    expect(textosDe(cartaDe('UGA'))).toContain('triptofano')
  })

  it('e a metionina como opção da isoleucina, que é a outra armadilha', () => {
    expect(textosDe(cartaDe('AUA'))).toContain('metionina')
    expect(textosDe(cartaDe('AUG'))).toContain('isoleucina')
  })

  it('nas três paradas, as opções erradas são aminoácidos de verdade', () => {
    for (const parada of ['UAA', 'UAG', 'UGA']) {
      const c = cartaDe(parada)
      const errados = textosDe(c).filter((t) => t !== 'parada')
      expect(errados, parada).toHaveLength(3)
      for (const t of errados) {
        expect(CODONS.some((x) => rotulo(traduzir(x)) === t), `${parada}: "${t}"`).toBe(true)
      }
    }
  })
})

describe('gabarito', () => {
  it('mostra os irmãos do aminoácido, que é a redundância do código', () => {
    expect(cartaDe('UUA').gabarito).toBe('leucina — 6 códons: UUA, UUG, CUU, CUC, CUA, CUG')
    expect(cartaDe('AGC').gabarito).toBe('serina — 6 códons: UCU, UCC, UCA, UCG, AGU, AGC')
    expect(cartaDe('GCA').gabarito).toBe('alanina — 4 códons: GCU, GCC, GCA, GCG')
    expect(cartaDe('UAG').gabarito).toBe('parada — 3 códons: UAA, UAG, UGA')
  })

  it('e diz "códon único" nos dois que não têm irmão nenhum', () => {
    expect(cartaDe('AUG').gabarito).toBe('metionina — códon único: AUG, e não há outro no código')
    expect(cartaDe('UGG').gabarito).toBe('triptofano — códon único: UGG, e não há outro no código')
  })

  it('a contagem do gabarito bate com a tabela em todas as 64 cartas', () => {
    // O gabarito é derivado, e este teste é o que garante que ele continua
    // derivado: uma lista escrita à mão passaria a mentir no primeiro dia em que
    // alguém corrigisse um bloco.
    for (const codon of CODONS) {
      const quantos = codonsDe(traduzir(codon)).length
      const texto = cartaDe(codon).gabarito
      expect(texto, codon).toContain(quantos === 1 ? 'códon único' : `${quantos} códons`)
      expect(texto.startsWith(rotulo(traduzir(codon))), codon).toBe(true)
    }
  })
})

describe('aviso', () => {
  it('só o AUG tem, porque só ele esconde uma segunda função', () => {
    for (const c of BARALHO) {
      expect(c.aviso !== undefined, c.id).toBe(c.id === 'codon-AUG')
    }
    expect(cartaDe('AUG').aviso).toContain('códon de início')
  })
})

describe('sorteio', () => {
  it('é determinístico pela semente — "esse sorteio caiu mal" tem de ser reproduzível', () => {
    const a = montar(42)
    const b = montar(42)
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id))
    expect(a.map((c) => (c.tipo === 'escolha' ? c.indiceCorreto : -1))).toEqual(
      b.map((c) => (c.tipo === 'escolha' ? c.indiceCorreto : -1)),
    )
  })

  it('e sementes diferentes dão ordens diferentes', () => {
    expect(montar(1).map((c) => c.id)).not.toEqual(montar(2).map((c) => c.id))
  })

  it('a distribuição é a do código, e é desequilibrada de propósito', () => {
    // Seis das 64 cartas respondem leucina, seis serina, seis arginina, e uma só
    // responde triptofano. É o código que é assim; equilibrar o baralho seria
    // falsificar a redundância, que é o fato que o jogo existe para ensinar.
    const conta = new Map<string, number>()
    for (const codon of CODONS) {
      const nome = rotulo(traduzir(codon))
      conta.set(nome, (conta.get(nome) ?? 0) + 1)
    }
    expect(conta.get('leucina')).toBe(6)
    expect(conta.get('triptofano')).toBe(1)
    expect(conta.get('parada')).toBe(3)
    expect([...conta.values()].reduce((s, n) => s + n, 0)).toBe(64)
  })
})
