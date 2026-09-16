import { describe, expect, it } from 'vitest'
import { chaveDeTexto, validar } from '@/core/answer'
import type { EspecResposta } from '@/core/answer'
import { MAIORES_POR_AREA } from '@/data/maiores-paises'
import { PAISES } from '@/data/paises'
import { linhaDoGabarito, maioresPaises } from './maiores-paises'

const CONFIG = maioresPaises.config()
const ITENS = CONFIG.itens as readonly string[]
const ESTRITO = { rigor: 'estrito' } as const

/** A mesma pergunta que a engine faz: `respostaEm` existe e responde a casa `i`? */
const espec = (i: number): EspecResposta => {
  const r = CONFIG.respostaEm?.(i)
  if (!r) throw new Error(`sem espec para a casa ${i + 1}`)
  return r
}

const julgar = (i: number, digitado: string) => validar(digitado, espec(i), ESTRITO).veredito

describe('a sequência', () => {
  it('tem vinte itens, na ordem do dataset, e declara o total', () => {
    expect(ITENS).toHaveLength(20)
    expect(CONFIG.total).toBe(20)
    expect(ITENS[0]).toBe('Rússia')
    expect(ITENS[4]).toBe('Brasil')
    expect(ITENS[19]).toBe('Chade')
  })

  /**
   * A engine monta a espec sozinha quando o jogo não passa `respostaEm`, e o
   * padrão dela é `inteiroGrande` — que devolveria 'nao-numerico' para "Rússia"
   * e mataria a partida no primeiro item. Este teste é a única coisa que separa
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

  it('o nome errado encerra a partida, seja qual for', () => {
    // Um vizinho da lista, um país que não está nela e uma letra trocada.
    expect(julgar(0, 'Canadá')).toBe('errado')
    expect(julgar(0, 'Groenlândia')).toBe('errado')
    expect(julgar(0, 'Rússa')).toBe('errado')
  })

  /**
   * Na sequência não existe 'quase': `useSequence` só segue com 'certo'. Por
   * isso a tolerância a typo está desligada em todas as especs — ligada, ela
   * devolveria 'quase' e mataria igual, só que com outra mensagem, e ainda
   * correndo o risco de perdoar na direção de outro país (a sequência não passa
   * `vizinhanca` ao validador).
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

describe('as formas aceitas', () => {
  it('são as de paises.ts, sinônimos inclusive', () => {
    // O jogo não redige nome de país: lê de `paises.ts`. Se um dia alguém
    // reescrever "Estados Unidos" aqui, estes três param de valer.
    expect(julgar(3, 'EUA')).toBe('certo')
    expect(julgar(3, 'Estados Unidos da América')).toBe('certo')
    expect(julgar(10, 'RDC')).toBe('certo')
    expect(julgar(10, 'Congo-Kinshasa')).toBe('certo')
  })

  it('"Congo" vale para a RDC porque o outro Congo não está na lista', () => {
    // Em `paises.ts`, "Congo" é o nome de `cg` e sinônimo de `cd`. Aqui só `cd`
    // joga, então aceitar não é ambiguidade — é o jogador dizendo o que sabe.
    expect(julgar(10, 'Congo')).toBe('certo')
    expect(PAISES.some((p) => p.id === 'cg')).toBe(true)
    expect(MAIORES_POR_AREA.some((p) => p.id === 'cg')).toBe(false)
  })

  it('acento, caixa e espaço não fazem parte do conhecimento cobrado', () => {
    expect(julgar(0, 'russia')).toBe('certo')
    expect(julgar(0, 'RUSSIA')).toBe('certo')
    expect(julgar(6, ' Índia ')).toBe('certo')
    expect(julgar(11, 'arabiasaudita')).toBe('certo')
  })

  /**
   * Fora do par declarado, cada forma serve a uma casa só. Colisão silenciosa
   * aqui seria pior que no tabuleiro livre: o jogador acertaria a casa errada e
   * seguiria com a lista desalinhada, sem nada na tela para desconfiar.
   */
  it('nenhuma forma serve a duas casas, salvo a troca declarada', () => {
    const dono = new Map<string, number>()
    const repetidas: string[] = []
    const casas = new Set<string>()

    for (let i = 0; i < ITENS.length; i++) {
      const e = espec(i)
      if (e.tipo !== 'texto') continue
      for (const forma of e.aceitas) {
        const chave = chaveDeTexto(forma)
        const anterior = dono.get(chave)
        if (anterior !== undefined && anterior !== i) {
          repetidas.push(forma)
          casas.add(`${anterior + 1}/${i + 1}`)
        }
        dono.set(chave, i)
      }
    }

    // Só as formas do par China/EUA se repetem, e só entre as casas 3 e 4.
    expect(repetidas.sort()).toEqual([
      'China',
      'EUA',
      'Estados Unidos',
      'Estados Unidos da América',
    ])
    expect([...casas]).toEqual(['3/4'])
  })

  it('o par China/EUA passa nas duas ordens', () => {
    expect(julgar(2, 'China')).toBe('certo')
    expect(julgar(2, 'Estados Unidos')).toBe('certo')
    expect(julgar(3, 'Estados Unidos')).toBe('certo')
    expect(julgar(3, 'China')).toBe('certo')
    // E a troca não vazou para a vizinhança: o Canadá continua só na casa 2.
    expect(julgar(2, 'Canadá')).toBe('errado')
    expect(julgar(4, 'Estados Unidos')).toBe('errado')
  })
})

describe('a ficha do jogo', () => {
  it('é geografia, em sequência, com id estável', () => {
    expect(maioresPaises.id).toBe('maiores-paises')
    expect(maioresPaises.categoria).toBe('geografia')
    expect(maioresPaises.mecanica).toBe('sequencia')
    expect(maioresPaises.comoJogar.length).toBeGreaterThanOrEqual(3)
  })

  it('a linha do gabarito diz posição, nome e área', () => {
    expect(linhaDoGabarito(0)).toBe('1º Rússia — 17.098.246 km²')
    expect(linhaDoGabarito(4)).toBe('5º Brasil — 8.515.767 km²')
  })
})
