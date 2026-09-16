import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro } from '@/core/answer'
import { EVENTOS } from './cronologia'
import { MARCOS, ROTULO_GENERO, exibirData } from './revolucoes'

describe('dataset', () => {
  it('não tem id nem nome repetido', () => {
    expect(new Set(MARCOS.map((m) => m.id)).size).toBe(MARCOS.length)
    expect(new Set(MARCOS.map((m) => m.nome)).size).toBe(MARCOS.length)
  })

  it('tem revolução e tratado em quantidade comparável', () => {
    // Um baralho que fosse 90% revolução venderia como "revoluções e tratados"
    // um jogo de revoluções — e a dica de gênero perderia a serventia.
    const acordos = MARCOS.filter((m) => m.genero === 'acordo').length
    expect(acordos).toBeGreaterThan(MARCOS.length * 0.35)
    expect(MARCOS.length - acordos).toBeGreaterThan(MARCOS.length * 0.35)
  })

  it('anos plausíveis: nada de dígito trocado', () => {
    for (const m of MARCOS) {
      expect(m.ano, m.id).toBeGreaterThan(1400)
      expect(m.ano, m.id).toBeLessThanOrEqual(2026)
    }
  })

  it('o período, quando existe, contém o ano de referência', () => {
    for (const m of MARCOS) {
      if (m.periodo === undefined) continue
      expect(m.periodo, m.id).toContain(String(m.ano))
    }
  })

  /**
   * A fronteira com `cronologia`, escrita como teste porque é a única coisa que
   * impede este baralho de virar aquele jogo.
   *
   * Se o enunciado disser a data, a carta deixa de perguntar "o que foi isso" e
   * passa a perguntar "que ano é este", que é exatamente o que o projeto já
   * decidiu não perguntar. O ano vive no gabarito, depois da resposta.
   */
  it('nenhum enunciado entrega o ano', () => {
    for (const m of MARCOS) {
      expect(m.fato, m.id).not.toMatch(/\b1[0-9]{3}\b|\b20[0-9]{2}\b/)
      expect(m.fato.toLowerCase(), m.id).not.toContain('em que ano')
    }
  })

  it('todo enunciado é uma frase de verdade, não um rótulo', () => {
    for (const m of MARCOS) {
      expect(m.fato.length, m.id).toBeGreaterThan(40)
      expect(m.fato.endsWith('.'), m.id).toBe(true)
    }
  })

  it('a primeira forma aceita é sempre a canônica', () => {
    for (const m of MARCOS) expect(m.aceitas[0], m.id).toBe(m.nome)
  })

  it('nenhuma forma aceita pertence a duas cartas', () => {
    const dono = new Map<string, string>()
    for (const m of MARCOS) {
      for (const forma of new Set(m.aceitas.map((a) => chaveDeTexto(a)))) {
        const anterior = dono.get(forma)
        expect(anterior, `"${forma}" é aceito por ${anterior} e por ${m.id}`).toBeUndefined()
        dono.set(forma, m.id)
      }
    }
  })

  /**
   * A medição que sustenta a decisão de manter a tolerância a erro de digitação
   * **ligada** neste baralho.
   *
   * O limite escala com o tamanho da resposta, e sete das respostas começam com
   * "Revolução " — ou seja, o orçamento de erro é grande justamente por causa
   * do pedaço que todas têm igual. Medindo par a par, sobra exatamente um caso:
   * "revolucaoamericana" contra "revolucaomexicana", distância 2 num limite de
   * 2. Ele não é consertado no dataset porque quem o resolve é a trava de
   * vizinhança da engine — ver o teste de comportamento em `games/revolucoes` —
   * e porque desligar a tolerância por causa dele castigaria "Brest-Litovski" e
   * "Tordesilhas", onde o dedo escorrega de verdade.
   *
   * O teste fixa a lista: um par novo aparecendo aqui é um par novo que ninguém
   * mediu, e aí a decisão tem de ser tomada outra vez.
   */
  it('só um par de formas fica dentro da tolerância, e é o conhecido', () => {
    const formas = MARCOS.flatMap((m) => m.aceitas.map((a) => ({ chave: chaveDeTexto(a), id: m.id })))
    const perto: string[] = []

    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i]
        const b = formas[j]
        if (!a || !b || a.id === b.id) continue
        const limite = Math.max(limiteDeErro(a.chave.length), limiteDeErro(b.chave.length))
        if (distancia(a.chave, b.chave, limite) <= limite) perto.push(`${a.chave} × ${b.chave}`)
      }
    }

    expect(perto).toEqual(['revolucaoamericana × revolucaomexicana'])
  })

  /**
   * O cruzamento com o dataset de cronologia é deliberado, e o teste existe
   * para que ele continue sendo uma decisão.
   *
   * Os dois jogos compartilham móveis — Vestfália, Versalhes, a Revolução
   * Francesa, a Russa — porque perguntam coisas diferentes sobre eles. Se um
   * dia a interseção fosse zero, o cruzamento teria sido desfeito por descuido,
   * e a lição de que o mesmo acervo serve a duas perguntas se perderia.
   */
  it('cruza com o acervo da cronologia, sem ser cópia dele', () => {
    const anosCronologia = new Set(EVENTOS.map((e) => e.ano))
    const comuns = MARCOS.filter((m) => anosCronologia.has(m.ano))
    expect(comuns.length).toBeGreaterThan(3)
    // E não é a mesma lista: a maioria das cartas não tem par lá.
    expect(comuns.length).toBeLessThan(MARCOS.length * 0.6)
  })

  it('âncoras conferidas à mão', () => {
    const ano = (id: string) => MARCOS.find((m) => m.id === id)?.ano
    expect(ano('tordesilhas')).toBe(1494)
    expect(ano('vestfalia')).toBe(1648)
    expect(ano('madri')).toBe(1750)
    expect(ano('americana')).toBe(1776)
    expect(ano('francesa')).toBe(1789)
    expect(ano('viena')).toBe(1815)
    expect(ano('petropolis')).toBe(1903)
    expect(ano('russa')).toBe(1917)
    expect(ano('versalhes')).toBe(1919)
    expect(ano('cravos')).toBe(1974)
    expect(ano('assuncao')).toBe(1991)
  })
})

describe('exibição', () => {
  it('o período manda quando existe', () => {
    const haitiana = MARCOS.find((m) => m.id === 'haitiana')
    const vestfalia = MARCOS.find((m) => m.id === 'vestfalia')
    expect(exibirData(haitiana as (typeof MARCOS)[number])).toBe('1791–1804')
    expect(exibirData(vestfalia as (typeof MARCOS)[number])).toBe('1648')
  })

  it('a dica de acordo é guarda-chuva, e a de revolução é literal', () => {
    expect(ROTULO_GENERO.revolucao).toBe('revolução')
    expect(ROTULO_GENERO.acordo).toContain('tratado')
  })
})
