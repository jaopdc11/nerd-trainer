import { describe, expect, it } from 'vitest'
import { chaveDeTexto, validar } from '@/core/answer'
import type { EspecResposta } from '@/core/answer'
import { INTERVALOS } from '@/data/eras-geologicas'
import { INICIO_DOS_TRECHOS, erasGeologicas, linhaDoGabarito } from './eras-geologicas'

const CONFIG = erasGeologicas.config()
const ITENS = CONFIG.itens as readonly string[]
const ESTRITO = { rigor: 'estrito' } as const

/** A mesma pergunta que a engine faz: `respostaEm` existe e responde a casa `i`? */
const espec = (i: number): EspecResposta => {
  const r = CONFIG.respostaEm?.(i)
  if (!r) throw new Error(`sem espec para a casa ${i + 1}`)
  return r
}

const julgar = (i: number, digitado: string) => validar(digitado, espec(i), ESTRITO).veredito

/** Índice da casa pelo nome canônico — evita contar item a item nos testes. */
const casaDe = (nome: string): number => {
  const i = ITENS.indexOf(nome)
  if (i === -1) throw new Error(`"${nome}" não está na sequência`)
  return i
}

describe('a sequência', () => {
  it('tem dezoito casas, na ordem do dataset, e declara o total', () => {
    expect(ITENS).toHaveLength(18)
    expect(CONFIG.total).toBe(18)
    expect(ITENS[0]).toBe('Hadeano')
    expect(ITENS[3]).toBe('Fanerozoico')
    expect(ITENS[4]).toBe('Cambriano')
    expect(ITENS[17]).toBe('Holoceno')
  })

  /**
   * A engine monta a espec sozinha quando o jogo não passa `respostaEm`, e o
   * padrão dela é `inteiroGrande` — que devolveria 'nao-numerico' para "Hadeano"
   * e mataria a partida na primeira casa. Este teste é a única coisa que separa
   * o jogo desse estado.
   */
  it('cada casa tem espec de texto — sem isso o jogo morre no item 1', () => {
    expect(CONFIG.entrada).toBe('termo')
    expect(CONFIG.teclado).toBe('texto')
    for (let i = 0; i < ITENS.length; i++) {
      const e = espec(i)
      expect(e.tipo, `casa ${i + 1}`).toBe('texto')
      if (e.tipo !== 'texto') continue
      expect(e.canonica, `casa ${i + 1}`).toBe(ITENS[i])
      expect(julgar(i, e.canonica), `a canônica da casa ${i + 1} não passa`).toBe('certo')
    }
  })

  /**
   * As duas viradas de nível têm de cair em fronteira de bloco da fita: é o que
   * torna o zoom visível sem rótulo novo na engine. Se alguém acrescentar um
   * éon ou um período, esta conta quebra antes de o jogador perceber sozinho.
   */
  it('as viradas de nível caem em fronteira de bloco da fita', () => {
    expect(CONFIG.agrupar).toBe(4)
    expect(INICIO_DOS_TRECHOS).toEqual({ eons: 0, periodos: 4, epocas: 16 })
    for (const inicio of Object.values(INICIO_DOS_TRECHOS)) {
      expect(inicio % (CONFIG.agrupar as number), `o trecho que abre em ${inicio}`).toBe(0)
    }
    expect(casaDe('Cambriano')).toBe(INICIO_DOS_TRECHOS.periodos)
    expect(casaDe('Pleistoceno')).toBe(INICIO_DOS_TRECHOS.epocas)
  })

  it('o intervalo errado encerra a partida, seja qual for', () => {
    // O item seguinte, um de outro nível e um que não está na lista.
    expect(julgar(0, 'Arqueano')).toBe('errado')
    expect(julgar(0, 'Paleozoico')).toBe('errado')
    expect(julgar(0, 'Ediacarano')).toBe('errado')
  })

  /**
   * Na sequência não existe 'quase': `useSequence` só segue com 'certo'. Por
   * isso a tolerância a typo está desligada em todas as casas — ligada, ela
   * devolveria 'quase' e mataria igual, só que correndo o risco de perdoar na
   * direção de outro intervalo (a sequência não passa `vizinhanca` ao validador).
   */
  it('nenhuma resposta devolve "quase"', () => {
    for (let i = 0; i < ITENS.length; i++) {
      const e = espec(i)
      if (e.tipo !== 'texto') continue
      expect(e.opcoes?.tolerarTypo, `casa ${i + 1}`).toBe(false)
      // Uma letra a menos na canônica: com tolerância ligada isso seria 'quase'.
      expect(julgar(i, e.canonica.slice(0, -1))).toBe('errado')
    }
  })
})

/**
 * O risco número um deste jogo: "Paleozoico" é uma resposta correta em geologia
 * e errada aqui, porque era não é nível desta lista. Se o jogo passasse a
 * aceitá-la em algum lugar, a régua dos três trechos deixaria de existir e o
 * gabarito passaria a mostrar duas escalas misturadas.
 */
describe('a régua da lista', () => {
  it('as eras não são resposta de casa nenhuma', () => {
    for (const era of ['Paleozoico', 'Mesozoico', 'Cenozoico']) {
      expect(ITENS).not.toContain(era)
      for (let i = 0; i < ITENS.length; i++) {
        expect(julgar(i, era), `"${era}" passou na casa ${i + 1}`).toBe('errado')
      }
    }
  })

  it('o éon que se abre e o primeiro período dele são casas diferentes', () => {
    const fanerozoico = casaDe('Fanerozoico')
    expect(julgar(fanerozoico, 'Cambriano')).toBe('errado')
    expect(julgar(fanerozoico + 1, 'Fanerozoico')).toBe('errado')
    expect(julgar(fanerozoico + 1, 'Cambriano')).toBe('certo')
  })

  it('o Quaternário abre as épocas, e o Pleistoceno não vale no lugar dele', () => {
    const quaternario = casaDe('Quaternário')
    expect(julgar(quaternario, 'Pleistoceno')).toBe('errado')
    expect(julgar(quaternario + 1, 'Pleistoceno')).toBe('certo')
    expect(julgar(quaternario + 2, 'Holoceno')).toBe('certo')
  })
})

describe('as formas aceitas', () => {
  it('são as do dataset, grafia de sala de aula inclusive', () => {
    expect(julgar(casaDe('Siluriano'), 'Silúrico')).toBe('certo')
    expect(julgar(casaDe('Devoniano'), 'Devônico')).toBe('certo')
    expect(julgar(casaDe('Permiano'), 'Pérmico')).toBe('certo')
    expect(julgar(casaDe('Cretáceo'), 'Cretácico')).toBe('certo')
    expect(julgar(casaDe('Arqueano'), 'Arqueozoico')).toBe('certo')
  })

  it('acento, caixa e espaço não fazem parte do conhecimento cobrado', () => {
    expect(julgar(casaDe('Carbonífero'), 'carbonifero')).toBe('certo')
    expect(julgar(casaDe('Triássico'), 'TRIÁSSICO')).toBe('certo')
    expect(julgar(casaDe('Quaternário'), ' quaternario ')).toBe('certo')
    // "Paleógeno" não está no dataset e vale mesmo assim: o acento cai na
    // normalização. Ver a nota em `data/eras-geologicas.ts`.
    expect(julgar(casaDe('Paleogeno'), 'Paleógeno')).toBe('certo')
    expect(julgar(casaDe('Neogeno'), 'Neógeno')).toBe('certo')
  })

  /**
   * Cada forma serve a uma casa só. Colisão silenciosa aqui seria pior que num
   * tabuleiro livre: o jogador acertaria a casa errada e seguiria com a lista
   * desalinhada, sem nada na tela para desconfiar.
   */
  it('nenhuma forma serve a duas casas', () => {
    const dono = new Map<string, number>()
    for (let i = 0; i < ITENS.length; i++) {
      const e = espec(i)
      if (e.tipo !== 'texto') continue
      for (const forma of e.aceitas) {
        const chave = chaveDeTexto(forma)
        const anterior = dono.get(chave)
        const onde = `"${forma}" serve às casas ${(anterior ?? 0) + 1} e ${i + 1}`
        expect(anterior ?? i, onde).toBe(i)
        dono.set(chave, i)
      }
    }
  })
})

describe('a ficha do jogo', () => {
  it('é de biológicas, em sequência, com id estável', () => {
    expect(erasGeologicas.id).toBe('eras-geologicas')
    expect(erasGeologicas.categoria).toBe('biologicas')
    expect(erasGeologicas.mecanica).toBe('sequencia')
    expect(erasGeologicas.comoJogar.length).toBeGreaterThanOrEqual(3)
  })

  /**
   * A regra de granularidade tem de estar dita no `comoJogar`: é ela que separa
   * morrer por não saber geologia de morrer por não saber o regulamento. O jogo
   * recusa "Paleozoico", então tem a obrigação de avisar antes.
   */
  it('o comoJogar anuncia os três trechos e avisa que era não vale', () => {
    const texto = erasGeologicas.comoJogar.join(' ')
    expect(texto).toContain('Hadeano')
    expect(texto).toContain('Fanerozoico')
    expect(texto).toContain('Quaternário')
    expect(texto).toContain('Holoceno')
    expect(texto).toContain('Paleozoico')
  })

  it('a linha do gabarito diz posição, nível, era, limites e marco', () => {
    expect(linhaDoGabarito(0)).toBe(
      '1ª Hadeano — éon · 4.567–4.031 Ma · a Terra se forma e esfria: oceano de magma, o impacto que fez a Lua, sem rocha preservada',
    )
    expect(linhaDoGabarito(casaDe('Permiano'))).toContain(
      'Permiano — período do Paleozoico · 298,9–251,902 Ma',
    )
    expect(linhaDoGabarito(casaDe('Holoceno'))).toContain(
      'Holoceno — época do Cenozoico · 11,7 mil anos até hoje',
    )
  })

  it('a linha do gabarito não inventa casa que não existe', () => {
    expect(() => linhaDoGabarito(INTERVALOS.length)).toThrow(/não há casa/)
  })
})
