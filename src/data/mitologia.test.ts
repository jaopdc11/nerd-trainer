import { describe, expect, it } from 'vitest'
import { chaveDeTexto, normalizarTexto } from '@/core/answer'
import { CRITERIOS } from '@/core/nerdometro'
import {
  DIVINDADES,
  EGITO,
  NOMES_RECUSADOS,
  OLIMPO,
  PANTEOES,
  ROTULO_PANTEAO,
  enunciado,
} from './mitologia'
import type { Divindade } from './mitologia'

describe('dataset', () => {
  it('não tem id repetido', () => {
    const ids = DIVINDADES.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('não tem dois deuses com o mesmo nome', () => {
    const nomes = DIVINDADES.map((d) => d.nome)
    expect(new Set(nomes).size).toBe(nomes.length)
  })

  it('o nome canônico está entre as formas aceitas', () => {
    for (const d of DIVINDADES) {
      expect(d.aceitas, d.id).toContain(d.nome)
    }
  })

  it('nenhuma forma aceita é compartilhada por dois deuses', () => {
    // Com a tolerância a typo desligada, a colisão exata é o único jeito de
    // duas cartas aceitarem o mesmo texto — e é o que tornaria uma delas
    // impossível de acertar.
    const dono = new Map<string, string>()
    for (const d of DIVINDADES) {
      for (const forma of new Set(d.aceitas.map((a) => chaveDeTexto(a)))) {
        const anterior = dono.get(forma)
        expect(anterior, `"${forma}" serve para ${anterior} e para ${d.id}`).toBeUndefined()
        dono.set(forma, d.id)
      }
    }
  })

  it('cobre os dois panteões com profundidade parecida', () => {
    // Um baralho com quinze gregos e quatro egípcios seria um jogo de mitologia
    // grega com apêndice, e o campo `panteao` viraria enfeite.
    expect(OLIMPO.length).toBeGreaterThanOrEqual(15)
    expect(EGITO.length).toBeGreaterThanOrEqual(15)
    expect(Math.abs(OLIMPO.length - EGITO.length)).toBeLessThanOrEqual(3)
    expect(DIVINDADES).toHaveLength(OLIMPO.length + EGITO.length)
  })

  it('cada deus está no panteão da sua lista', () => {
    for (const d of OLIMPO) expect(d.panteao, d.id).toBe('grego')
    for (const d of EGITO) expect(d.panteao, d.id).toBe('egipcio')
    for (const d of DIVINDADES) expect(PANTEOES as readonly string[]).toContain(d.panteao)
  })
})

/**
 * A regra inegociável do baralho, em forma de teste.
 *
 * Se uma carta chegar à tela sem dizer o panteão, o jogo quebra em silêncio: a
 * pergunta continua bonita e passa a ter duas respostas certas. Por isso são
 * três travas e não uma — o prefixo tem de estar lá, tem de estar no começo, e
 * o `dominio` cru não pode já tentar dizer o panteão por fora (o que faria o
 * enunciado repetir "grego: deus grego do mar").
 */
describe('o panteão no enunciado', () => {
  it('todo enunciado começa pelo panteão', () => {
    for (const d of DIVINDADES) {
      const texto = enunciado(d)
      expect(texto, d.id).toBe(`${ROTULO_PANTEAO[d.panteao]}: ${d.dominio}`)
      expect(texto.startsWith(`${ROTULO_PANTEAO[d.panteao]}: `), d.id).toBe(true)
    }
  })

  it('o enunciado nomeia o panteão certo e não o outro', () => {
    for (const d of DIVINDADES) {
      const texto = normalizarTexto(enunciado(d))
      const outro = d.panteao === 'grego' ? 'egipcio' : 'grego'
      expect(texto, d.id).toContain(normalizarTexto(ROTULO_PANTEAO[d.panteao]))
      expect(texto, d.id).not.toContain(normalizarTexto(ROTULO_PANTEAO[outro]))
    }
  })

  it('o domínio cru não repete o panteão — quem o diz é o prefixo', () => {
    for (const d of DIVINDADES) {
      expect(normalizarTexto(d.dominio), d.id).not.toMatch(/\b(grego|grega|egipcio|egipcia)\b/)
    }
  })

  it('o enunciado nunca entrega o nome do deus', () => {
    // "egípcio: deus do Sol, chamado Rá" seria uma carta que se lê e se
    // responde. O `dominio` de Geb cita Nut, e isso é permitido — Nut é outra
    // carta —, então a checagem é só contra o próprio nome.
    for (const d of DIVINDADES) {
      const texto = normalizarTexto(enunciado(d))
      expect(texto, d.id).not.toMatch(new RegExp(`\\b${normalizarTexto(d.nome)}\\b`))
    }
  })
})

/**
 * Sem colisão entre panteões, o campo `panteao` seria burocracia.
 *
 * Este teste existe para o dia em que alguém "arrumar" o dataset tirando Hélios
 * ou Hathor: nesse dia o prefixo deixa de ser necessário, alguém o remove, e
 * quando as cartas voltarem o jogo estará quebrado sem que nada acuse. Enquanto
 * os pares abaixo existirem, o prefixo está justificado por escrito e por
 * teste.
 */
describe('os pares que justificam o prefixo', () => {
  const temNoPanteao = (panteao: Divindade['panteao'], palavra: string): boolean =>
    DIVINDADES.some(
      (d) => d.panteao === panteao && normalizarTexto(d.dominio).includes(normalizarTexto(palavra)),
    )

  it.each([['sol'], ['mortos'], ['amor'], ['sabedoria'], ['guerra'], ['ceu']])(
    'os dois panteões disputam "%s"',
    (palavra) => {
      expect(temNoPanteao('grego', palavra), `nenhum grego fala de ${palavra}`).toBe(true)
      expect(temNoPanteao('egipcio', palavra), `nenhum egípcio fala de ${palavra}`).toBe(true)
    },
  )

  it('os nomes que disputam o mesmo domínio continuam todos no baralho', () => {
    const nomes = new Set(DIVINDADES.map((d) => d.nome))
    for (const quem of ['Hélios', 'Rá', 'Hades', 'Osíris', 'Afrodite', 'Hathor', 'Atena', 'Tot']) {
      expect(nomes.has(quem), `${quem} saiu, e com ele a razão de ser do campo panteao`).toBe(true)
    }
  })
})

describe('deuses que acumulam domínios', () => {
  it('quem acumula lista mais de um domínio', () => {
    // `acumula: 'mar'` não acrescenta nada a uma carta que já perguntou o mar.
    for (const d of DIVINDADES) {
      if (d.acumula === undefined) continue
      expect(d.acumula.trim(), d.id).not.toBe('')
      const partes = d.acumula.split(/,| e /).filter((p) => p.trim() !== '')
      expect(partes.length, `${d.id}: "${d.acumula}"`).toBeGreaterThan(1)
    }
  })

  it('os acumuladores clássicos estão marcados', () => {
    // Não é a maioria por acaso: quase todo deus grande é deus de várias
    // coisas, e esconder isso faria o assunto parecer mais simples do que é.
    for (const id of ['hermes', 'artemis', 'apolo', 'atena', 'ra', 'tot', 'hathor', 'sekhmet']) {
      const d = DIVINDADES.find((x) => x.id === id)
      expect(d?.acumula, `${id} deveria declarar os outros domínios`).toBeTruthy()
    }
    expect(DIVINDADES.filter((d) => d.acumula).length).toBeGreaterThan(DIVINDADES.length / 2)
  })
})

describe('nomes romanos', () => {
  it('nenhum nome recusado aparece entre as formas aceitas', () => {
    // A carta pediu o deus grego. "Netuno" não é um erro de digitação, é outro
    // panteão — aceitar seria apagar a única regra do jogo.
    const aceitas = new Set(DIVINDADES.flatMap((d) => d.aceitas.map((a) => chaveDeTexto(a))))
    for (const romano of NOMES_RECUSADOS) {
      expect(aceitas.has(chaveDeTexto(romano)), `${romano} não pode valer ponto`).toBe(false)
    }
  })

  it('a lista de recusados não está vazia nem virou sinônimo de nada', () => {
    expect(NOMES_RECUSADOS.length).toBeGreaterThan(10)
    for (const romano of NOMES_RECUSADOS) {
      expect(DIVINDADES.some((d) => d.nome === romano), romano).toBe(false)
    }
  })
})

describe('nerdômetro', () => {
  it('a meta cabe no baralho e não é frouxa, se já houver critério', () => {
    // O critério entra em `nerdometro.ts`, que este jogo não edita. Enquanto a
    // integração não chega, não há o que checar.
    const criterio = CRITERIOS.find((c) => c.jogoId === 'mitologia')
    if (!criterio) return
    expect(criterio.meta).toBeGreaterThan(DIVINDADES.length * 0.6)
    expect(criterio.meta).toBeLessThanOrEqual(DIVINDADES.length)
  })
})
