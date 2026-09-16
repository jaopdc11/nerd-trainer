import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { DIVINDADES, NOMES_RECUSADOS, ROTULO_PANTEAO } from '@/data/mitologia'
import { mitologia } from './mitologia'

const baralho = (seed: number): readonly Carta[] =>
  mitologia.config().montarBaralho(mulberry32(seed))

const digitadas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'digitada') throw new Error(`${c.id} devia ser digitada`)
    return c
  })

/** Responde como a engine: rigor estrito e a vizinhança das outras cartas. */
function responder(id: string, texto: string): string {
  const cartas = digitadas(7)
  const alvo = cartas.find((c) => c.id === `mito-${id}`)
  if (!alvo) throw new Error(`carta ${id} não encontrada`)

  const vizinhanca = new Set(
    cartas.flatMap((c) =>
      c.id !== alvo.id && c.resposta.tipo === 'texto' ? c.resposta.aceitas : [],
    ),
  )
  return validar(texto, alvo.resposta, { rigor: 'estrito', vizinhanca }).veredito
}

describe('baralho', () => {
  it('tem uma carta por divindade, todas digitadas', () => {
    const cartas = baralho(7)
    expect(cartas).toHaveLength(DIVINDADES.length)
    expect(cartas.map((c) => c.id.replace('mito-', '')).sort()).toEqual(
      DIVINDADES.map((d) => d.id).sort(),
    )
    for (const c of digitadas(7)) {
      expect(c.pergunta.kind, c.id).toBe('texto')
      expect(c.resposta.tipo, c.id).toBe('texto')
    }
  })

  /**
   * O teste que o dono do projeto pediu: **nenhuma carta chega à tela sem
   * dizer o panteão**.
   *
   * O teste do dataset garante que `enunciado()` põe o prefixo; este garante
   * que o jogo usa `enunciado()` e não uma concatenação própria. São coisas
   * diferentes, e é a segunda que quebraria em silêncio — a carta continuaria
   * renderizando, só que sem resposta única.
   */
  it('toda carta traz o panteão no enunciado', () => {
    for (const c of digitadas(7)) {
      const divindade = DIVINDADES.find((d) => `mito-${d.id}` === c.id)
      if (!divindade) throw new Error(`${c.id} sem divindade`)
      const texto = c.pergunta.kind === 'texto' ? c.pergunta.valor : ''
      expect(texto.startsWith(`${ROTULO_PANTEAO[divindade.panteao]}: `), `${c.id}: "${texto}"`).toBe(
        true,
      )
    }
  })

  it('a dica repete o panteão, que é a informação que desfaz a ambiguidade', () => {
    for (const c of digitadas(7)) {
      const divindade = DIVINDADES.find((d) => `mito-${d.id}` === c.id)
      expect(c.dica, c.id).toBe(divindade?.panteao === 'grego' ? 'nome grego' : 'nome egípcio')
    }
  })

  it('o gabarito diz os outros domínios de quem acumula', () => {
    for (const c of digitadas(7)) {
      const divindade = DIVINDADES.find((d) => `mito-${d.id}` === c.id)
      if (!divindade) throw new Error(`${c.id} sem divindade`)
      expect(c.gabarito, c.id).toContain(divindade.nome)
      if (divindade.acumula) expect(c.gabarito, c.id).toContain(divindade.acumula)
    }
  })

  it('não tolera erro de digitação — os nomes são curtos demais', () => {
    for (const c of digitadas(7)) {
      if (c.resposta.tipo !== 'texto') continue
      expect(c.resposta.opcoes?.tolerarTypo, c.id).toBe(false)
    }
    // Consequência prática: uma letra a menos já não vale nada.
    expect(responder('poseidon', 'Poseidon')).toBe('certo')
    expect(responder('poseidon', 'Poseidom')).toBe('errado')
    expect(responder('sekhmet', 'Sekmet')).toBe('errado')
  })
})

/**
 * O par que existe para provar que o prefixo funciona.
 *
 * "Deus do Sol" sem panteão teria duas respostas certas. Com panteão, cada uma
 * das duas cartas aceita exatamente um nome e recusa o outro — que é o
 * comportamento que o jogo inteiro depende.
 */
describe('Hélios e Rá, o par que motivou a regra', () => {
  it('a carta grega aceita Hélios e recusa Rá', () => {
    expect(responder('helios', 'Hélios')).toBe('certo')
    expect(responder('helios', 'helios')).toBe('certo')
    expect(responder('helios', 'Rá')).toBe('errado')
  })

  it('a carta egípcia aceita Rá e recusa Hélios', () => {
    expect(responder('ra', 'Rá')).toBe('certo')
    expect(responder('ra', 'ra')).toBe('certo')
    expect(responder('ra', 'Rê')).toBe('certo')
    expect(responder('ra', 'Hélios')).toBe('errado')
  })

  it('o mesmo vale para os mortos: Hades não é Osíris', () => {
    expect(responder('hades', 'Hades')).toBe('certo')
    expect(responder('hades', 'Osíris')).toBe('errado')
    expect(responder('osiris', 'Osiris')).toBe('certo')
    expect(responder('osiris', 'Hades')).toBe('errado')
  })
})

describe('nomes romanos não valem', () => {
  it('Netuno não responde por Poseidon, nem Júpiter por Zeus', () => {
    expect(responder('poseidon', 'Netuno')).toBe('errado')
    expect(responder('zeus', 'Júpiter')).toBe('errado')
    expect(responder('afrodite', 'Vênus')).toBe('errado')
    expect(responder('atena', 'Minerva')).toBe('errado')
  })

  it('nenhum nome da lista de recusados passa em nenhuma carta', () => {
    // Varredura completa: 16 recusados contra 33 cartas roda em milissegundos e
    // pega o caso em que alguém acrescentar um sinônimo distraído.
    for (const c of digitadas(7)) {
      for (const romano of NOMES_RECUSADOS) {
        expect(
          validar(romano, c.resposta, { rigor: 'estrito' }).veredito,
          `${c.id} aceitou "${romano}"`,
        ).toBe('errado')
      }
    }
  })
})

describe('declaração do jogo', () => {
  it('se declara como o registry espera', () => {
    expect(mitologia.id).toBe('mitologia')
    expect(mitologia.mecanica).toBe('flashcard')
    expect(mitologia.categoria).toBe('humanas')
    expect(mitologia.config().fim).toBe('baralho')
    expect(mitologia.config().teclado).toBe('texto')
  })

  it('o comoJogar explica a regra do panteão', () => {
    // Se o texto não disser isso, o jogador vai achar que "grego:" é enfeite e
    // errar Hélios achando que errou de deus.
    const texto = [mitologia.resumo, ...mitologia.comoJogar].join(' ')
    expect(texto).toMatch(/pante[ãa]o/i)
    expect(texto).toMatch(/grego/i)
    expect(texto).toMatch(/egípcio/i)
  })

  it('a mesma semente dá o mesmo baralho', () => {
    const ordem = (seed: number) => baralho(seed).map((c) => c.id)
    expect(ordem(11)).toEqual(ordem(11))
    expect(ordem(11)).not.toEqual(ordem(12))
  })
})
