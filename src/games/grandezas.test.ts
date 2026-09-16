import { describe, expect, it } from 'vitest'
import { completaSemAmbiguidade, formasDeAutoCommit, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { GRANDEZAS_COM_UNIDADE } from '@/data/grandezas'
import { grandezas } from './grandezas'

const cartas: readonly Carta[] = grandezas.config().montarBaralho(mulberry32(11))

function carta(id: string) {
  const c = cartas.find((k) => k.id === `unidade-${id}`)
  if (c?.tipo !== 'digitada') throw new Error(`carta de ${id} não encontrada`)
  return c
}

/** Responde como a engine responde: flashcard valida sempre em modo estrito. */
function responder(id: string, texto: string) {
  return validar(texto, carta(id).resposta, { rigor: 'estrito' })
}

describe('baralho', () => {
  it('tem uma carta por grandeza com unidade, digitada e pedindo símbolo', () => {
    expect(cartas).toHaveLength(GRANDEZAS_COM_UNIDADE.length)
    expect(cartas).toHaveLength(26)
    for (const c of cartas) {
      expect(c.tipo, c.id).toBe('digitada')
      if (c.tipo !== 'digitada') continue
      expect(c.pergunta.kind, c.id).toBe('texto')
      // É `simbolo` e não `texto`: a caixa é a informação, e é disso que
      // depende metade dos testes abaixo.
      expect(c.resposta.tipo, c.id).toBe('simbolo')
      expect(c.dica, c.id).toBe('símbolo')
    }
  })

  it('não entra grandeza sem unidade com nome — torque e velocidade ficam de fora', () => {
    const ids = new Set(cartas.map((c) => c.id))
    expect(ids.size).toBe(cartas.length)
    expect(ids.has('unidade-torque')).toBe(false)
    expect(ids.has('unidade-velocidade')).toBe(false)
    expect(ids.has('unidade-forca')).toBe(true)
  })

  it('o gabarito traz nome, símbolo e a cadeia de unidades de base', () => {
    // Os três juntos de propósito: "N" sozinho não ensina que newton é
    // quilograma-metro por segundo ao quadrado.
    expect(carta('forca').gabarito).toBe('newton (N) = kg·m·s⁻²')
    expect(carta('capacitancia').gabarito).toBe('farad (F) = kg⁻¹·m⁻²·s⁴·A²')
    expect(carta('atividade-radioativa').gabarito).toBe('becquerel (Bq) = s⁻¹')
  })
})

describe('a caixa é a resposta', () => {
  it('aceita o símbolo exato', () => {
    expect(responder('pressao', 'Pa').veredito).toBe('certo')
    expect(responder('fluxo-magnetico', 'Wb').veredito).toBe('certo')
    expect(responder('atividade-catalitica', 'kat').veredito).toBe('certo')
    // Espaço em volta não é erro de física.
    expect(responder('forca', ' N ').veredito).toBe('certo')
  })

  it('recusa a caixa errada, e diz por quê', () => {
    // O par que justifica o jogo inteiro: S é siemens, s é segundo. Em modo
    // estrito — o único que o flashcard usa — isso é erro, não "quase".
    const siemens = responder('condutancia-eletrica', 's')
    expect(siemens.veredito).toBe('errado')
    expect(siemens.motivo).toBe('caixa-errada')
    expect(siemens.explicacao).toContain('caixa')

    expect(responder('pressao', 'pa').motivo).toBe('caixa-errada')
    expect(responder('iluminancia', 'LX').motivo).toBe('caixa-errada')
    expect(responder('massa', 'KG').motivo).toBe('caixa-errada')
  })

  it('recusa o nome por extenso: a pergunta é o símbolo', () => {
    expect(responder('pressao', 'pascal').veredito).toBe('errado')
    expect(responder('forca', 'newton').veredito).toBe('errado')
  })

  it('recusa o símbolo de outra unidade, mesmo parecido', () => {
    // W é watt e Wb é weber; T é tesla e s é segundo.
    expect(responder('fluxo-magnetico', 'W').veredito).toBe('errado')
    expect(responder('potencia', 'Wb').veredito).toBe('errado')
    expect(responder('inducao-magnetica', 'K').veredito).toBe('errado')
  })

  it('o ohm aceita as grafias que o teclado permite', () => {
    // Nenhum teclado tem ômega, então esta é a única carta com grafia extra.
    expect(responder('resistencia-eletrica', '\u03A9').veredito).toBe('certo') // ômega grego
    expect(responder('resistencia-eletrica', '\u2126').veredito).toBe('certo') // OHM SIGN
    expect(responder('resistencia-eletrica', 'ohm').veredito).toBe('certo')
    expect(responder('resistencia-eletrica', 'Ohm').veredito).toBe('certo')
    expect(responder('resistencia-eletrica', 'O').veredito).toBe('errado')
  })
})

describe('auto-commit', () => {
  const commita = (id: string, texto: string): boolean => {
    const auto = formasDeAutoCommit(carta(id).resposta)
    if (!auto) throw new Error(`${id}: símbolo devia ter auto-commit`)
    return completaSemAmbiguidade(auto.normalizar(texto), auto.formas)
  }

  it('resposta de uma letra fecha na própria tecla', () => {
    // É o que dá ritmo ao baralho: 26 cartas de um a três caracteres, sem Enter.
    expect(commita('forca', 'N')).toBe(true)
    expect(commita('potencia', 'W')).toBe(true)
  })

  it('não fecha cedo em símbolo de duas letras nem com a caixa errada', () => {
    // Se "W" fechasse a carta do weber, seria impossível digitar "Wb".
    expect(commita('fluxo-magnetico', 'W')).toBe(false)
    expect(commita('fluxo-magnetico', 'Wb')).toBe(true)
    expect(commita('massa', 'k')).toBe(false)
    // Caixa errada nunca fecha sozinha: quem digitou "pa" merece ver o erro.
    expect(commita('pressao', 'pa')).toBe(false)
  })

  it('nenhum símbolo é prefixo de outra grafia da própria carta', () => {
    // A condição que faz o auto-commit ser seguro carta a carta. Se alguém
    // cadastrar um aceito que comece pelo canônico, a resposta certa passaria a
    // fechar antes de a pessoa terminar de escrever a outra.
    for (const c of cartas) {
      if (c.tipo !== 'digitada' || c.resposta.tipo !== 'simbolo') continue
      for (const alt of c.resposta.aceitas ?? []) {
        expect(alt.startsWith(c.resposta.canonica), `${c.id}: ${alt}`).toBe(false)
      }
    }
  })
})

describe('metadados', () => {
  it('é o que o registry espera', () => {
    expect(grandezas.id).toBe('grandezas')
    expect(grandezas.mecanica).toBe('flashcard')
    expect(grandezas.categoria).toBe('fisica')
    expect(grandezas.config().fim).toBe('baralho')
    expect(grandezas.comoJogar.length).toBeGreaterThanOrEqual(3)
  })
})
