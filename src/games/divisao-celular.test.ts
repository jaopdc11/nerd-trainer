import { describe, expect, it } from 'vitest'
import { chaveDeTexto, validar } from '@/core/answer'
import type { EspecResposta } from '@/core/answer'
import { FASES, TAMANHO_DO_TRECHO_DE_MITOSE } from '@/data/divisao-celular'
import { divisaoCelular, linhaDoGabarito } from './divisao-celular'

const CONFIG = divisaoCelular.config()
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
  it('tem vinte e três fases, na ordem do dataset, e declara o total', () => {
    expect(ITENS).toHaveLength(23)
    expect(CONFIG.total).toBe(23)
    expect(ITENS[0]).toBe('G1')
    expect(ITENS[7]).toBe('Citocinese')
    expect(ITENS[8]).toBe('Leptóteno')
    expect(ITENS[22]).toBe('Citocinese II')
  })

  /**
   * A engine monta a espec sozinha quando o jogo não passa `respostaEm`, e o
   * padrão dela é `inteiroGrande` — que devolveria 'nao-numerico' para "G1" e
   * mataria a partida na primeira casa. Este teste é a única coisa que separa o
   * jogo desse estado.
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
   * A virada de trecho cai numa fronteira de bloco da fita. Sem isso o corte
   * mitose→meiose ficaria no meio de uma linha e o jogador não teria como
   * enxergar que o jogo mudou de divisão.
   */
  it('o agrupamento da fita bate com o tamanho do trecho de mitose', () => {
    expect(CONFIG.agrupar).toBe(TAMANHO_DO_TRECHO_DE_MITOSE)
    expect(casaDe('Leptóteno')).toBe(TAMANHO_DO_TRECHO_DE_MITOSE)
  })

  it('a fase errada encerra a partida, seja qual for', () => {
    // A fase seguinte, uma fase de outro trecho e uma palavra que não é fase.
    expect(julgar(0, 'S')).toBe('errado')
    expect(julgar(0, 'Prófase')).toBe('errado')
    expect(julgar(0, 'Citocinese')).toBe('errado')
  })

  /**
   * Na sequência não existe 'quase': `useSequence` só segue com 'certo'. Por
   * isso a tolerância a typo está desligada em todas as casas — ligada, ela
   * devolveria 'quase' e mataria igual, só que ainda correndo o risco de perdoar
   * na direção de outra fase (a sequência não passa `vizinhanca` ao validador).
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
 * O par de casas que o jogo existe para separar. Se qualquer uma destas
 * asserções virar 'certo' na casa errada, o jogo passou a dar de graça a
 * distinção entre as duas divisões.
 */
describe('as três prófases não se confundem', () => {
  it('cada uma vale só na sua casa', () => {
    const mitose = casaDe('Prófase')
    const segunda = casaDe('Prófase II')

    expect(julgar(mitose, 'Prófase')).toBe('certo')
    expect(julgar(mitose, 'Prófase II')).toBe('errado')
    expect(julgar(segunda, 'Prófase II')).toBe('certo')
    expect(julgar(segunda, 'Prófase')).toBe('errado')
    expect(julgar(segunda, 'Prófase I')).toBe('errado')
  })

  /**
   * A prófase I não é casa nenhuma: ela entra pelas cinco subfases, e o
   * `comoJogar` diz isso. Aceitá-la em qualquer lugar contradiria a régua do
   * dataset — e o lugar onde o jogador mais tentaria é a casa do leptóteno.
   */
  it('"prófase I" não vale no lugar do leptóteno', () => {
    expect(julgar(casaDe('Leptóteno'), 'Prófase I')).toBe('errado')
    expect(ITENS).not.toContain('Prófase I')
  })

  it('a metáfase I e a metáfase II também ficam cada uma na sua', () => {
    const primeira = casaDe('Metáfase I')
    const segunda = casaDe('Metáfase II')
    expect(julgar(primeira, 'Metáfase II')).toBe('errado')
    expect(julgar(segunda, 'Metáfase I')).toBe('errado')
    expect(julgar(primeira, 'Metáfase 1')).toBe('certo')
    expect(julgar(segunda, 'Metáfase 2')).toBe('certo')
  })
})

describe('as formas aceitas', () => {
  it('são as do dataset, nomenclatura em -nema inclusive', () => {
    expect(julgar(casaDe('Leptóteno'), 'Leptonema')).toBe('certo')
    expect(julgar(casaDe('Zigóteno'), 'Zigonema')).toBe('certo')
    expect(julgar(casaDe('Paquíteno'), 'Paquinema')).toBe('certo')
    expect(julgar(casaDe('Diplóteno'), 'Diplonema')).toBe('certo')
  })

  it('acento, caixa e espaço não fazem parte do conhecimento cobrado', () => {
    expect(julgar(casaDe('Prófase'), 'profase')).toBe('certo')
    expect(julgar(casaDe('Anáfase I'), 'ANÁFASE I')).toBe('certo')
    expect(julgar(casaDe('Citocinese II'), ' citocinese II ')).toBe('certo')
    expect(julgar(0, 'fase g1')).toBe('certo')
  })

  it('a intercinese também atende pelo nome que os livros usam', () => {
    const i = casaDe('Intercinese')
    expect(julgar(i, 'Intercinese')).toBe('certo')
    expect(julgar(i, 'Intérfase II')).toBe('certo')
    // E não vale como intérfase de verdade: G1 continua sendo a casa 1.
    expect(julgar(0, 'Intercinese')).toBe('errado')
  })

  /**
   * Cada forma serve a uma casa só. Colisão silenciosa aqui seria pior que num
   * tabuleiro livre: o jogador acertaria a casa errada e seguiria com a lista
   * desalinhada, sem nada na tela para desconfiar. É a mesma trava do dataset,
   * refeita a partir das especs para pegar também um erro na montagem delas.
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
    expect(divisaoCelular.id).toBe('divisao-celular')
    expect(divisaoCelular.categoria).toBe('biologicas')
    expect(divisaoCelular.mecanica).toBe('sequencia')
    expect(divisaoCelular.comoJogar.length).toBeGreaterThanOrEqual(3)
  })

  /**
   * As duas regras de granularidade e o corte entre os trechos têm de estar
   * ditos no `comoJogar`: são elas que separam morrer por não saber biologia de
   * morrer por não saber o regulamento.
   */
  it('o comoJogar anuncia a régua da lista', () => {
    const texto = divisaoCelular.comoJogar.join(' ').toLowerCase()
    expect(texto).toContain('g1')
    expect(texto).toContain('leptóteno')
    expect(texto).toContain('prófase i')
    expect(texto).toContain('intercinese')
    expect(texto).toContain('não se repete')
  })

  it('a linha do gabarito diz posição, bloco, ploidia e o que acontece', () => {
    expect(linhaDoGabarito(0)).toBe(
      '1ª G1 — intérfase · 2n, 2C · a célula cresce e produz proteínas; cada cromossomo ainda tem uma cromátide só',
    )
    const anafaseI = casaDe('Anáfase I')
    expect(linhaDoGabarito(anafaseI)).toContain('meiose I · n, 2C')
    expect(linhaDoGabarito(casaDe('Anáfase II'))).toContain('meiose II · n, 1C')
  })

  it('a linha do gabarito não inventa casa que não existe', () => {
    expect(() => linhaDoGabarito(FASES.length)).toThrow(/não há casa/)
  })
})
