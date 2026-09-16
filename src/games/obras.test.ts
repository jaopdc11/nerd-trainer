import { describe, expect, it } from 'vitest'
import { normalizarTexto, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { OBRAS } from '@/data/obras'
import { obras } from './obras'

const baralho = (seed: number): readonly Carta[] => obras.config().montarBaralho(mulberry32(seed))

const digitadas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'digitada') throw new Error(`${c.id} devia ser digitada`)
    return c
  })

const cartas = digitadas(7)
const carta = (id: string) => {
  const c = cartas.find((k) => k.id === `obra-${id}`)
  if (!c) throw new Error(`carta ${id} não encontrada`)
  return c
}

/**
 * Responder como a engine responde: a vizinhança são as formas cruas das outras
 * cartas do baralho, **menos** as que também respondem por esta. É ela, e não o
 * limite de erro, que impede o ponto pelo autor errado quando a tolerância a typo
 * está ligada.
 *
 * A subtração importa muito neste baralho: Machado tem quatro cartas, Alencar
 * três, Kafka, Tolstói, Dostoiévski e Guimarães Rosa duas. Sem ela a resposta
 * certa entraria na própria vizinhança, qualquer texto a um caractere do nome
 * encostaria em duas cartas ao mesmo tempo, e a tolerância morreria justamente
 * para os autores mais presentes. Ver `useFlashcard.responder`, que faz esta
 * mesma conta.
 */
const responder = (id: string, texto: string) => {
  const alvo = carta(id)
  const vizinhanca = new Set(
    cartas.flatMap((c) =>
      c.id !== alvo.id && c.resposta.tipo === 'texto' ? c.resposta.aceitas : [],
    ),
  )
  if (alvo.resposta.tipo === 'texto') {
    const minhas = new Set(alvo.resposta.aceitas.map((a) => normalizarTexto(a)))
    for (const forma of vizinhanca) {
      if (minhas.has(normalizarTexto(forma))) vizinhanca.delete(forma)
    }
  }
  return validar(texto, alvo.resposta, { rigor: 'estrito', vizinhanca }).veredito
}

describe('baralho', () => {
  it('tem uma carta por obra, e a pergunta é o título', () => {
    expect(cartas).toHaveLength(OBRAS.length)
    const titulos = OBRAS.map((o) => o.titulo).sort()
    expect(
      cartas.map((c) => (c.pergunta.kind === 'texto' ? c.pergunta.valor : '')).sort(),
    ).toEqual(titulos)
  })

  it('é digitada, nunca de escolha', () => {
    // A decisão está no cabeçalho do módulo: com quatro opções na tela, "Dom
    // Casmurro" se resolve sozinho e a carta passa a medir reconhecimento.
    for (const c of baralho(3)) expect(c.tipo, c.id).toBe('digitada')
  })

  it('a pergunta não entrega o ano nem o autor', () => {
    for (const c of cartas) {
      const texto = c.pergunta.kind === 'texto' ? c.pergunta.valor : ''
      const obra = OBRAS.find((o) => `obra-${o.id}` === c.id)
      if (!obra) throw new Error(`${c.id} sem obra`)
      // "1984" é título, e é a única razão de este teste não procurar dígitos.
      expect(texto, c.id).not.toContain(obra.autor)
      expect(c.dica, c.id).toBe(obra.genero)
    }
  })

  it('o gabarito diz o autor e situa a obra no tempo', () => {
    expect(carta('dom-casmurro').gabarito).toBe('Machado de Assis, 1899')
    expect(carta('vidas-secas').gabarito).toBe('Graciliano Ramos, 1938')
    expect(carta('odisseia').gabarito).toBe('Homero, séc. VIII a.C.')
  })

  it('a mesma semente dá o mesmo baralho, e sementes diferentes não', () => {
    // Regra do núcleo: nenhum jogo chama Math.random().
    const ordem = (seed: number) => baralho(seed).map((c) => c.id)
    expect(ordem(11)).toEqual(ordem(11))
    expect(ordem(11)).not.toEqual(ordem(12))
  })
})

describe('validação', () => {
  it('aceita só o sobrenome quando ele identifica', () => {
    expect(responder('dom-casmurro', 'Machado')).toBe('certo')
    expect(responder('dom-casmurro', 'machado de assis')).toBe('certo')
    expect(responder('cem-anos', 'garcia marquez')).toBe('certo')
    expect(responder('crime-castigo', 'dostoievski')).toBe('certo')
  })

  it('recusa o sobrenome que não identifica ninguém', () => {
    // Três Andrades no baralho: Mário, Oswald e Drummond.
    expect(responder('macunaima', 'Andrade')).toBe('errado')
    expect(responder('joao-miramar', 'Andrade')).toBe('errado')
    expect(responder('alguma-poesia', 'Andrade')).toBe('errado')
  })

  it('perdoa o dedo escorregado em nome longo', () => {
    expect(responder('memorial-convento', 'saramagu')).toBe('quase')
    expect(responder('velho-e-o-mar', 'hemmingway')).toBe('quase')
    expect(responder('policarpo', 'lima barretto')).toBe('quase')
  })

  /**
   * E perdoa também quem tem várias cartas, que é o caso da metade do baralho.
   *
   * Este é o teste que quebra se a subtração da própria resposta sair da engine:
   * sem ela, "dostoievsky" encosta na outra carta de Dostoiévski, vira ambíguo e
   * é recusado — a tolerância morreria exatamente para Machado, Alencar, Kafka e
   * Tolstói, que são quem mais aparece aqui.
   */
  it('perdoa typo mesmo em autor que tem mais de uma obra no baralho', () => {
    expect(responder('crime-castigo', 'dostoievsky')).toBe('quase')
    expect(responder('grande-sertao', 'guimaraens rosa')).toBe('quase')
    // E o nome escrito certo continua valendo cheio, que é o que importa.
    expect(responder('crime-castigo', 'dostoievski')).toBe('certo')
    expect(responder('grande-sertao', 'guimaraes rosa')).toBe('certo')
  })

  it('não dá o ponto do autor vizinho', () => {
    expect(responder('macunaima', 'Oswald de Andrade')).toBe('errado')
    expect(responder('dom-casmurro', 'José de Alencar')).toBe('errado')
    expect(responder('metamorfose', 'Joyce')).toBe('errado')
  })
})

describe('declaração do jogo', () => {
  it('se declara como o registry espera', () => {
    expect(obras.id).toBe('obras')
    expect(obras.mecanica).toBe('flashcard')
    expect(obras.categoria).toBe('humanas')
    expect(obras.config().fim).toBe('baralho')
    expect(obras.config().teclado).toBe('texto')
  })

  it('o resumo e o comoJogar mandam escrever, não escolher', () => {
    const texto = [obras.resumo, ...obras.comoJogar].join(' ')
    expect(texto).toMatch(/escreve|escreva/i)
    expect(texto).not.toMatch(/alternativa|entre as quatro/i)
  })
})
