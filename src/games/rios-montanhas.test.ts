import { describe, expect, it } from 'vitest'
import { chaveDeTexto, validar } from '@/core/answer'
import type { EspecResposta } from '@/core/answer'
import { OITOMIL, RIOS } from '@/data/rios-montanhas'
import { linhaDoGabarito, riosMontanhas, TAMANHO_DO_TRECHO_DE_RIOS } from './rios-montanhas'

const CONFIG = riosMontanhas.config()
const ITENS = CONFIG.itens as readonly string[]
const ESTRITO = { rigor: 'estrito' } as const

const espec = (i: number): EspecResposta => {
  const r = CONFIG.respostaEm?.(i)
  if (!r) throw new Error(`sem espec para a casa ${i + 1}`)
  return r
}

const julgar = (i: number, digitado: string) => validar(digitado, espec(i), ESTRITO).veredito

describe('os dois trechos', () => {
  it('são vinte e quatro itens: dez rios e depois catorze picos', () => {
    expect(ITENS).toHaveLength(RIOS.length + OITOMIL.length)
    expect(ITENS).toHaveLength(24)
    expect(CONFIG.total).toBe(24)
    expect(TAMANHO_DO_TRECHO_DE_RIOS).toBe(10)
  })

  it('o corte é fixo: a casa 10 é rio e a 11 é montanha', () => {
    expect(ITENS.slice(0, 10)).toEqual(RIOS.map((r) => r.nome))
    expect(ITENS.slice(10)).toEqual(OITOMIL.map((p) => p.nome))
    expect(ITENS[0]).toBe('Nilo')
    expect(ITENS[9]).toBe('Amur')
    expect(ITENS[10]).toBe('Everest')
    expect(ITENS[23]).toBe('Shishapangma')
  })

  /**
   * O corte entre os trechos tem de cair numa fronteira de bloco da fita, senão
   * a virada de rio para montanha acontece no meio de uma linha e o jogador não
   * enxerga onde o jogo mudou de assunto.
   */
  it('a virada cai numa fronteira de bloco da fita', () => {
    expect(CONFIG.agrupar).toBeGreaterThan(0)
    expect(TAMANHO_DO_TRECHO_DE_RIOS % (CONFIG.agrupar as number)).toBe(0)
  })
})

describe('o julgamento', () => {
  /**
   * Sem `respostaEm` a engine monta a espec sozinha e o padrão dela é
   * `inteiroGrande`: "Nilo" viraria 'nao-numerico' e a partida morreria na casa
   * 1. Este teste é o que separa o jogo desse estado.
   */
  it('cada casa tem espec de texto, e a canônica passa', () => {
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

  it('os sinônimos do dataset valem', () => {
    expect(julgar(2, 'Rio Azul')).toBe('certo') // Yangtzé
    expect(julgar(3, 'Mississippi-Missouri')).toBe('certo')
    expect(julgar(5, 'Huang He')).toBe('certo') // Rio Amarelo
    expect(julgar(7, 'Rio da Prata')).toBe('certo') // Paraná
    expect(julgar(10, 'Chomolungma')).toBe('certo') // Everest
    expect(julgar(20, 'Hidden Peak')).toBe('certo') // Gasherbrum I
  })

  it('acento e caixa não importam; o nome errado encerra a partida', () => {
    expect(julgar(2, 'yangtze')).toBe('certo')
    expect(julgar(7, 'parana')).toBe('certo')
    expect(julgar(0, 'Yangtzé')).toBe('errado')
    expect(julgar(10, 'K2')).toBe('errado')
  })

  /**
   * O par que o dataset mede a um caractere de distância. Com tolerância ligada,
   * o validador devolveria 'quase' — e 'quase' mata igual nesta mecânica. Aqui a
   * resposta é simplesmente errada, que é o que ela é: outra montanha.
   */
  it('Gasherbrum II não passa por Gasherbrum I, nem o contrário', () => {
    expect(ITENS[20]).toBe('Gasherbrum I')
    expect(ITENS[22]).toBe('Gasherbrum II')
    expect(julgar(20, 'Gasherbrum II')).toBe('errado')
    expect(julgar(22, 'Gasherbrum I')).toBe('errado')
    expect(julgar(20, 'Gasherbrum I')).toBe('certo')
    expect(julgar(22, 'Gasherbrum II')).toBe('certo')
  })

  /**
   * O erro de digitação mais comum que existe é a troca de duas teclas
   * vizinhas, e é justamente o que a distância de Damerau cobra barato: custa 1.
   * Se a tolerância estivesse ligada, todo nome com sete letras ou mais passaria
   * a devolver 'quase' — que mata igual, só que fingindo clemência.
   *
   * A sonda é a transposição das duas últimas letras, e não "a canônica sem a
   * última letra": "Obi" sem a última letra é "Ob", que é sinônimo legítimo do
   * mesmo rio. Sonda que acerta a resposta certa não mede nada.
   */
  it('nenhuma resposta devolve "quase"', () => {
    for (let i = 0; i < ITENS.length; i++) {
      const e = espec(i)
      if (e.tipo !== 'texto') continue
      expect(e.opcoes?.tolerarTypo, `casa ${i + 1}`).toBe(false)

      const n = e.canonica
      const trocado = n.slice(0, -2) + n.slice(-1) + n.slice(-2, -1)
      const aceitas = new Set(e.aceitas.map((f) => chaveDeTexto(f)))
      if (aceitas.has(chaveDeTexto(trocado))) continue

      expect(julgar(i, trocado), `casa ${i + 1}: "${trocado}" passou`).toBe('errado')
    }
  })
})

describe('Nilo × Amazonas', () => {
  it('as duas ordens passam', () => {
    expect(julgar(0, 'Nilo')).toBe('certo')
    expect(julgar(0, 'Amazonas')).toBe('certo')
    expect(julgar(1, 'Amazonas')).toBe('certo')
    expect(julgar(1, 'Nilo')).toBe('certo')
  })

  it('a troca não vaza para a casa seguinte', () => {
    expect(julgar(2, 'Amazonas')).toBe('errado')
    expect(julgar(2, 'Nilo')).toBe('errado')
  })
})

/**
 * Colisão silenciosa entre as formas de duas casas seria pior aqui do que num
 * tabuleiro livre: o jogador acertaria a casa errada e seguiria com a lista
 * desalinhada, sem nada na tela de que desconfiar. As duas listas viraram uma
 * sequência só, então a checagem tem de atravessar os dois trechos.
 */
describe('as formas aceitas', () => {
  it('nenhuma serve a duas casas, salvo a troca declarada', () => {
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

    expect(repetidas.sort()).toEqual(['Amazonas', 'Nilo', 'Rio Amazonas', 'Rio Nilo'])
    expect([...casas]).toEqual(['1/2'])
  })
})

describe('a ficha do jogo', () => {
  it('é geografia, em sequência, com id estável', () => {
    expect(riosMontanhas.id).toBe('rios-montanhas')
    expect(riosMontanhas.categoria).toBe('geografia')
    expect(riosMontanhas.mecanica).toBe('sequencia')
    expect(riosMontanhas.comoJogar.length).toBeGreaterThanOrEqual(3)
  })

  it('o gabarito muda de unidade junto com o trecho', () => {
    expect(linhaDoGabarito(0)).toBe('1º Nilo — 6.650 km')
    expect(linhaDoGabarito(9)).toBe('10º Amur — 4.444 km')
    expect(linhaDoGabarito(10)).toBe('11º Everest — 8.849 m')
    expect(linhaDoGabarito(23)).toBe('24º Shishapangma — 8.027 m')
  })
})
