import { describe, expect, it } from 'vitest'
import { normalizarTexto, validar } from '@/core/answer'
import type { CelulaGrade } from '@/core/types'
import { CRITERIOS } from '@/core/nerdometro'
import { PAISES } from '@/data/paises'
import { paises } from './paises'

/**
 * O que este arquivo testa é a regra do jogo inteira, não a da função.
 *
 * A engine de grade percorre as células **ainda vazias** e fica com a primeira
 * que não devolve 'errado', passando como vizinhança todas as formas do
 * tabuleiro menos as da célula em julgamento. Reproduzir isso aqui é o que
 * permite afirmar que religar a tolerância a erro de digitação não dá ponto por
 * país errado — a alternativa seria testar `validar` isolado, que é exatamente o
 * que não estava sendo medido antes.
 */
const CELULAS = paises.config().celulas

const TODAS_AS_FORMAS = new Set(
  CELULAS.flatMap((c) => (c.resposta.tipo === 'texto' ? c.resposta.aceitas : [])).map((a) =>
    normalizarTexto(a),
  ),
)

/** Devolve o id da célula que o texto preencheria, ou null se nenhuma. */
function preenche(texto: string, jaPreenchidas: ReadonlySet<string> = new Set()): string | null {
  for (const celula of CELULAS as readonly CelulaGrade[]) {
    if (jaPreenchidas.has(celula.id)) continue

    const outras = new Set(TODAS_AS_FORMAS)
    if (celula.resposta.tipo === 'texto') {
      for (const a of celula.resposta.aceitas) outras.delete(normalizarTexto(a))
    }

    const r = validar(texto, celula.resposta, { rigor: 'estrito', vizinhanca: outras })
    if (r.veredito !== 'errado') return celula.id
  }
  return null
}

/**
 * A única ambiguidade proposital do dataset: "Congo" é o nome da República do
 * Congo e também forma aceita da República Democrática do Congo, e a grade
 * preenche a primeira vazia. Digitado duas vezes, preenche as duas.
 */
const donoEsperado = (p: (typeof PAISES)[number]) => (p.id === 'cg' ? 'cd' : p.id)

describe('mapa-múndi: o que o texto preenche', () => {
  it('cada um dos 195 nomes preenche exatamente o seu país', () => {
    for (const p of PAISES) {
      expect(preenche(p.nome), p.nome).toBe(donoEsperado(p))
    }
  })

  it('e continua preenchendo o mesmo país sem acento, sem caixa e sem espaço', () => {
    for (const p of PAISES) {
      const colado = p.nome
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^0-9a-zA-Z]/g, '')
        .toUpperCase()
      expect(preenche(colado), `${p.nome} → ${colado}`).toBe(donoEsperado(p))
    }
  })

  it('todo sinônimo declarado preenche o país que o declarou — menos Congo, que é dos dois', () => {
    for (const p of PAISES) {
      for (const s of p.sinonimos) {
        if (normalizarTexto(s) === 'congo') continue
        expect(preenche(s), `${s} (de ${p.nome})`).toBe(p.id)
      }
    }
  })

  it('"congo" preenche qualquer Congo ainda vazio', () => {
    const primeiro = preenche('congo')
    expect(primeiro).not.toBeNull()
    const segundo = preenche('congo', new Set([primeiro as string]))
    expect([primeiro, segundo].sort()).toEqual(['cd', 'cg'])
  })

  it('"sudao" preenche o Sudão mesmo com o Sudão do Sul em jogo', () => {
    expect(preenche('sudao')).toBe('sd')
    expect(preenche('sudao do sul')).toBe('ss')
    expect(preenche('sudaodosul')).toBe('ss')
  })

  it('perdoa o erro de digitação que o jogador reclamou', () => {
    expect(preenche('rebpulicacentroafricana')).toBe('cf')
    expect(preenche('republica centro africana')).toBe('cf')
    expect(preenche('quirguistao')).toBe('kg')
    expect(preenche('quirguistão')).toBe('kg')
    expect(preenche('quirquistao')).toBe('kg')
  })

  it('mas não preenche país nenhum quando o texto encosta em dois', () => {
    // "irlandia" está a um caractere de Irlanda e de Islândia; "austrlia", de
    // Áustria e de Austrália. Ambiguidade nunca é resolvida a favor do jogador.
    expect(preenche('irlandia')).toBeNull()
    expect(preenche('austrlia')).toBeNull()
  })

  it('e continua não preenchendo o que não é país', () => {
    for (const lixo of ['asdfghjkl', 'brasilia', 'europa']) {
      expect(preenche(lixo), lixo).toBeNull()
    }
  })
})

describe('mensagens do autor', () => {
  /*
   * A mensagem sobre Israel é posição política declarada, não dado do mapa: o
   * dataset continua sendo a lista da ONU sem edição, e a resposta pontua
   * normalmente. O teste trava as duas metades — se alguém um dia tirar Israel
   * da lista para "reforçar" o recado, isto quebra, porque aí o jogo passaria a
   * marcar como errada uma resposta certa.
   */
  it('Israel continua na lista e continua pontuando', () => {
    const celula = paises.config().celulas.find((c) => c.id === 'il')
    expect(celula, 'Israel saiu do dataset').toBeDefined()
    expect(celula?.gabarito).toBe('Israel')
  })

  it('e acertá-lo mostra a mensagem', () => {
    const celula = paises.config().celulas.find((c) => c.id === 'il')
    expect(celula?.aviso).toBe('Israel não é um Estado legítimo')
  })

  it('nenhum outro país carrega mensagem', () => {
    const comAviso = paises.config().celulas.filter((c) => c.aviso !== undefined)
    expect(comAviso.map((c) => c.id)).toEqual(['il'])
  })
})

describe('marco da ONU', () => {
  /*
   * A meta do Nerdômetro é 195, a lista da ONU — os 9 territórios são pontos
   * extras em cima disso, não diluição dela. Sem o marco, fechar a lista da ONU
   * passaria despercebido no meio de um tabuleiro de 204 células.
   */
  it('o marco é exatamente o conjunto dos soberanos', () => {
    const marcos = paises.config().marcos ?? []
    expect(marcos).toHaveLength(1)

    const soberanos = PAISES.filter((p) => p.soberano).map((p) => p.id).sort()
    expect([...(marcos[0]?.ids ?? [])].sort()).toEqual(soberanos)
    expect(marcos[0]?.ids).toHaveLength(195)
  })

  it('nenhum território entrou no marco', () => {
    const noMarco = new Set(paises.config().marcos?.[0]?.ids ?? [])
    for (const id of ['tw', 'xk', 'gl', 'eh', 'pr']) {
      expect(noMarco.has(id), `${id} não é membro da ONU`).toBe(false)
    }
  })

  it('a meta do Nerdômetro é a lista da ONU, não o tabuleiro', () => {
    const criterio = CRITERIOS.find((c) => c.jogoId === 'paises')
    expect(criterio?.meta).toBe(195)
    expect(paises.config().celulas.length).toBeGreaterThan(195)
  })
})
