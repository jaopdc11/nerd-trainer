import { describe, expect, it } from 'vitest'
import { completaSemAmbiguidade, formasDeAutoCommit, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { AMINOACIDOS } from '@/data/codigo-genetico'
import { aminoacidos, letraSegueASigla } from './aminoacidos'

type Digitada = Extract<Carta, { tipo: 'digitada' }>

const ESTRITO = { rigor: 'estrito' } as const

const montar = (seed: number) => aminoacidos.config().montarBaralho(mulberry32(seed))

const BARALHO = montar(3).filter((c): c is Digitada => c.tipo === 'digitada')

const cartaDe = (letra: string, qual: 'sigla' | 'letra') =>
  BARALHO.find((c) => c.id === `amino-${qual}-${letra}`) as Digitada

describe('baralho', () => {
  it('são 40 cartas: os 20 aminoácidos em dois códigos cada', () => {
    expect(BARALHO).toHaveLength(40)
    expect(new Set(BARALHO.map((c) => c.id)).size).toBe(40)
    expect(aminoacidos.mecanica).toBe('flashcard')
    expect(aminoacidos.categoria).toBe('biologicas')
  })

  it('vai até o fim do baralho, e não em morte súbita', () => {
    // Nove das 40 cartas pedem uma letra que não se deduz de nada. Cair numa
    // delas no segundo card encerraria a partida sem medir repertório nenhum.
    expect(aminoacidos.config().fim).toBe('baralho')
  })

  it('todas digitadas, e a resposta é sempre símbolo — nunca texto', () => {
    // 'texto' normalizaria a caixa e aceitaria 'trp'. A caixa é a informação:
    // é assim que a sigla aparece no PDB e em toda notação de mutação.
    for (const c of BARALHO) {
      expect(c.tipo, c.id).toBe('digitada')
      expect(c.resposta.tipo, c.id).toBe('simbolo')
    }
  })

  it('pergunta o nome e distingue as duas cartas pela dica', () => {
    // As duas cartas do mesmo aminoácido mostram o mesmo nome. Sem a dica,
    // "triptofano" seria pergunta ambígua e o erro não mediria biologia.
    for (const a of AMINOACIDOS) {
      for (const qual of ['sigla', 'letra'] as const) {
        const c = cartaDe(a.letra, qual)
        expect(c.pergunta.kind === 'texto' && c.pergunta.valor, c.id).toBe(a.nome)
        expect(c.dica, c.id).toBe(qual === 'sigla' ? 'sigla de três letras' : 'letra única')
      }
    }
  })

  it('a resposta canônica é a do dataset, código a código', () => {
    for (const a of AMINOACIDOS) {
      const sigla = cartaDe(a.letra, 'sigla').resposta
      const letra = cartaDe(a.letra, 'letra').resposta
      expect(sigla.tipo === 'simbolo' && sigla.canonica, a.nome).toBe(a.sigla)
      expect(letra.tipo === 'simbolo' && letra.canonica, a.nome).toBe(a.letra)
    }
  })

  it('nenhuma resposta se repete no baralho', () => {
    // Duas cartas com a mesma resposta seriam a mesma pergunta duas vezes, e o
    // placar contaria o mesmo fato em dobro.
    const respostas = BARALHO.map((c) =>
      c.resposta.tipo === 'simbolo' ? c.resposta.canonica : '',
    )
    expect(new Set(respostas).size).toBe(40)
  })
})

describe('a caixa é a informação', () => {
  it('aceita Trp e recusa trp e TRP, em rigor estrito', () => {
    const { resposta } = cartaDe('W', 'sigla')
    expect(validar('Trp', resposta, ESTRITO).veredito).toBe('certo')
    for (const errada of ['trp', 'TRP', 'tRp']) {
      const r = validar(errada, resposta, ESTRITO)
      expect(r.veredito, errada).toBe('errado')
      expect(r.motivo, errada).toBe('caixa-errada')
      // O recado é o que ensina a diferença; sem ele a pessoa acha que errou o
      // aminoácido, e não a grafia.
      expect(r.explicacao, errada).toContain('Trp')
    }
  })

  it('e aceita W e recusa w', () => {
    const { resposta } = cartaDe('W', 'letra')
    expect(validar('W', resposta, ESTRITO).veredito).toBe('certo')
    expect(validar('w', resposta, ESTRITO).motivo).toBe('caixa-errada')
  })

  it('não aceita a sigla no lugar da letra nem o contrário', () => {
    expect(validar('Trp', cartaDe('W', 'letra').resposta, ESTRITO).veredito).toBe('errado')
    expect(validar('W', cartaDe('W', 'sigla').resposta, ESTRITO).veredito).toBe('errado')
  })

  it('recusa a abreviação do português — Gli não é Gly', () => {
    // Aceitar 'Gli' seria ensinar uma grafia que não passa em lugar nenhum fora
    // da prova: a sigla é símbolo da IUPAC-IUB, não abreviação do nome.
    expect(validar('Gli', cartaDe('G', 'sigla').resposta, ESTRITO).veredito).toBe('errado')
    expect(validar('Gly', cartaDe('G', 'sigla').resposta, ESTRITO).veredito).toBe('certo')
    expect(validar('Fen', cartaDe('F', 'sigla').resposta, ESTRITO).veredito).toBe('errado')
    expect(validar('Phe', cartaDe('F', 'sigla').resposta, ESTRITO).veredito).toBe('certo')
  })

  it('toda carta aceita a própria resposta canônica — nenhuma é impossível', () => {
    for (const c of BARALHO) {
      const canonica = c.resposta.tipo === 'simbolo' ? c.resposta.canonica : ''
      expect(validar(canonica, c.resposta, ESTRITO).veredito, c.id).toBe('certo')
    }
  })
})

describe('auto-commit', () => {
  it('a letra única fecha sozinha, sem Enter', () => {
    // O universo de auto-commit é o da própria carta, então 'W' não espera por
    // 'Trp' de outra carta. Uma única tecla com Enter obrigatório seria o dobro
    // do trabalho para a metade do baralho.
    for (const a of AMINOACIDOS) {
      const auto = formasDeAutoCommit(cartaDe(a.letra, 'letra').resposta)
      expect(auto, a.nome).not.toBeNull()
      const { normalizar, formas } = auto as NonNullable<typeof auto>
      expect(completaSemAmbiguidade(normalizar(a.letra), formas), a.nome).toBe(true)
    }
  })

  it('e a sigla também, depois da terceira letra', () => {
    for (const a of AMINOACIDOS) {
      const auto = formasDeAutoCommit(cartaDe(a.letra, 'sigla').resposta)
      const { normalizar, formas } = auto as NonNullable<typeof auto>
      expect(completaSemAmbiguidade(normalizar(a.sigla), formas), a.nome).toBe(true)
      // Duas letras ainda não: 'Tr' é prefixo de 'Trp' e de mais nada nesta
      // carta, mas não casa exato — e casar exato é a condição.
      expect(completaSemAmbiguidade(normalizar(a.sigla.slice(0, 2)), formas), a.nome).toBe(false)
    }
  })
})

describe('gabarito', () => {
  it('mostra os dois códigos, qualquer que seja o perguntado', () => {
    expect(cartaDe('W', 'sigla').gabarito).toBe('triptofano — Trp (W)')
    expect(cartaDe('W', 'letra').gabarito).toBe('triptofano — Trp (W)')
    expect(cartaDe('K', 'letra').gabarito).toBe('lisina — Lys (K)')
  })

  it('e o nome do ânion nos dois ácidos', () => {
    expect(cartaDe('D', 'sigla').gabarito).toBe('ácido aspártico (aspartato) — Asp (D)')
    expect(cartaDe('E', 'letra').gabarito).toBe('ácido glutâmico (glutamato) — Glu (E)')
  })

  it('nenhum gabarito fica sem os dois códigos', () => {
    for (const a of AMINOACIDOS) {
      for (const qual of ['sigla', 'letra'] as const) {
        const texto = cartaDe(a.letra, qual).gabarito
        expect(texto, `${a.nome}/${qual}`).toContain(a.sigla)
        expect(texto, `${a.nome}/${qual}`).toContain(`(${a.letra})`)
        expect(texto, `${a.nome}/${qual}`).toContain(a.nome)
      }
    }
  })
})

describe('a letra que segue a sigla, e a que não segue', () => {
  it('são onze e nove, e é daí que sai a meta do jogo', () => {
    // Quem chuta a inicial da sigla acerta 11 das 20 letras. Somadas às 20
    // siglas, são 31 cartas de 40 acessíveis sem saber o código de uma letra —
    // e é por isso que a meta do Nerdômetro tem de ficar acima disso.
    const seguem = AMINOACIDOS.filter(letraSegueASigla)
    expect(seguem).toHaveLength(11)
    expect(AMINOACIDOS.length - seguem.length).toBe(9)
  })

  it('e são exatamente estes — a lista é calculada, mas o resultado é fixo', () => {
    expect(AMINOACIDOS.filter(letraSegueASigla).map((a) => a.letra)).toEqual([
      'A', 'C', 'G', 'H', 'I', 'L', 'M', 'P', 'S', 'T', 'V',
    ])
    expect(AMINOACIDOS.filter((a) => !letraSegueASigla(a)).map((a) => a.letra)).toEqual([
      'D', 'E', 'F', 'K', 'N', 'Q', 'R', 'W', 'Y',
    ])
  })

  it('as nove arbitrárias são as que perderam a inicial para outro aminoácido', () => {
    // Asp perdeu o A para Ala, Gln perdeu o G para Gly: a letra única foi
    // repartida quando a inicial já estava tomada. Se algum dia um aminoácido
    // arbitrário ficar com uma inicial livre, foi erro de cadastro.
    const iniciais = AMINOACIDOS.filter(letraSegueASigla).map((a) => a.letra)
    for (const a of AMINOACIDOS.filter((x) => !letraSegueASigla(x))) {
      expect(iniciais, `${a.sigla}: a inicial ${a.sigla[0]} estaria livre`)
        .toContain(a.sigla[0])
    }
  })
})

describe('sorteio', () => {
  it('é determinístico pela semente', () => {
    expect(montar(5).map((c) => c.id)).toEqual(montar(5).map((c) => c.id))
  })

  it('e sementes diferentes dão ordens diferentes', () => {
    expect(montar(1).map((c) => c.id)).not.toEqual(montar(2).map((c) => c.id))
  })

  it('embaralha as duas cartas do mesmo aminoácido, em vez de deixá-las em par', () => {
    // Se a sigla e a letra saíssem coladas, a segunda viraria eco da primeira e
    // metade do baralho seria de graça.
    const ids = montar(17).map((c) => c.id)
    const distancias = AMINOACIDOS.map((a) => {
      const i = ids.indexOf(`amino-sigla-${a.letra}`)
      const j = ids.indexOf(`amino-letra-${a.letra}`)
      return Math.abs(i - j)
    })
    const media = distancias.reduce((s, d) => s + d, 0) / distancias.length
    expect(media).toBeGreaterThan(5)
  })
})
