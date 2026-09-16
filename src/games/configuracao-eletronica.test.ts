import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Exercicio } from '@/core/types'
import { EXCECOES, PRIMEIRO_PREVISTO, configuracao, exibir } from '@/data/configuracao-eletronica'
import {
  JOGAVEIS,
  NIVEL_MAX,
  configuracaoEletronica,
  exercicioDe,
  gerarConfiguracao,
  nivelDe,
} from './configuracao-eletronica'

const rng = () => mulberry32(7)

function amostra(nivel: number, quantos = 300): Exercicio[] {
  return Array.from({ length: quantos }, (_, i) => gerarConfiguracao(mulberry32(i + 1), nivel))
}

/**
 * O teste que importa é o exaustivo: o sorteio é aleatório, e "nenhum elemento
 * produz opção repetida" só vale se for conferido nos 103 jogáveis. A amostra
 * por nível vem depois, e cobre a escada, não os itens.
 */
describe('todo elemento jogável vira um item legítimo', () => {
  it('quatro alternativas distintas, com a certa entre elas', () => {
    for (const e of JOGAVEIS) {
      const item = exercicioDe(rng(), e.z)
      if (item.tipo !== 'escolha') throw new Error(`${e.simbolo} devia ser de escolha`)
      expect(item.alternativas, `${e.simbolo} (Z=${e.z})`).toHaveLength(4)
      const valores = item.alternativas.map((a) => a.valor)
      expect(new Set(valores).size, `${e.simbolo}: ${valores.join(' | ')}`).toBe(4)
      expect(item.alternativas[item.indiceCorreto]?.valor, `${e.simbolo}`).toBe(item.gabarito)
    }
  })

  it('o gabarito é a configuração do dataset, na forma que o item mostra', () => {
    // Se o item mostrasse a forma abreviada e guardasse a completa no gabarito,
    // a tela pós-erro contradiria a alternativa que estava certa.
    for (const e of JOGAVEIS) {
      const item = exercicioDe(rng(), e.z)
      const forma = e.z <= 20 ? 'completa' : 'abreviada'
      expect(item.gabarito, `${e.simbolo}`).toBe(exibir(configuracao(e.z), forma))
    }
  })

  it('o enunciado traz símbolo e Z', () => {
    // O Z é de propósito: sem ele o item viraria duas perguntas empilhadas, e
    // quem não decorou o número atômico erraria sem errar química.
    const item = exercicioDe(rng(), 26)
    expect(item.enunciado.valor).toBe('configuração do Fe (Z = 26)')
  })

  it('a chave de anti-repetição é o Z, e é única', () => {
    const chaves = JOGAVEIS.map((e) => exercicioDe(rng(), e.z).chave)
    expect(new Set(chaves).size).toBe(chaves.length)
  })

  it('nunca oferece elemento de configuração só prevista', () => {
    // Do rutherfórdio em diante ninguém mediu; perguntar seria cobrar palpite.
    for (const e of JOGAVEIS) expect(e.z).toBeLessThan(PRIMEIRO_PREVISTO)
    expect(JOGAVEIS).toHaveLength(103)
  })
})

describe('as exceções são o nível de cima', () => {
  it('toda exceção cai no último nível, e só elas', () => {
    for (const e of JOGAVEIS) {
      expect(nivelDe(e.z) === NIVEL_MAX, `${e.simbolo} (Z=${e.z})`).toBe(EXCECOES[e.z] !== undefined)
    }
  })

  it('explicam o porquê, e só elas', () => {
    // "O cromo é 4s¹ 3d⁵" sem o motivo não sobrevive à próxima partida; nos
    // outros níveis a resposta certa já é a regra inteira.
    for (const e of JOGAVEIS) {
      const item = exercicioDe(rng(), e.z)
      expect(item.porque !== undefined, `${e.simbolo}`).toBe(EXCECOES[e.z] !== undefined)
    }
  })

  it('põem o Aufbau ingênuo na tela como alternativa errada', () => {
    // É o item inteiro: quem aplicou a regra sem saber da exceção encontra a
    // própria resposta lá, e ela está errada.
    const item = exercicioDe(rng(), 24)
    if (item.tipo !== 'escolha') throw new Error('devia ser de escolha')
    const valores = item.alternativas.map((a) => a.valor)
    expect(valores).toContain('[Ar] 4s¹ 3d⁵')
    expect(valores).toContain('[Ar] 4s² 3d⁴')
    expect(item.gabarito).toBe('[Ar] 4s¹ 3d⁵')
  })
})

describe('escada de níveis', () => {
  it('produz quatro alternativas distintas em todo nível', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(nivel)) {
        if (e.tipo !== 'escolha') throw new Error(`${e.chave} devia ser de escolha`)
        expect(e.alternativas, e.chave).toHaveLength(4)
        expect(new Set(e.alternativas.map((a) => a.valor)).size, e.chave).toBe(4)
        expect(e.alternativas[e.indiceCorreto]?.valor, e.chave).toBe(e.gabarito)
      }
    }
  })

  it('o nível 0 é todo leve e escrito por extenso', () => {
    for (const e of amostra(0, 200)) {
      const z = Number(e.chave.split(':')[1])
      expect(z, e.chave).toBeLessThanOrEqual(20)
      // Nos vinte primeiros o caroço *é* a resposta: "[Ne] 3s² 3p⁵" esconderia
      // o exercício do cloro inteiro.
      expect(e.gabarito, e.chave).not.toMatch(/^\[/)
      expect(e.gabarito, e.chave).toMatch(/^1s/)
    }
  })

  it('do nível 1 em diante tudo é abreviado', () => {
    for (let nivel = 1; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(nivel, 200)) {
        const z = Number(e.chave.split(':')[1])
        if (z <= 20) continue
        expect(e.gabarito, e.chave).toMatch(/^\[\w+\] /)
      }
    }
  })

  it('acumula os níveis em vez de substituí-los', () => {
    // No topo da escada ainda tem que cair elemento comportado de vez em
    // quando: o jogo não vira um quiz de vinte exceções decoradas.
    const zs = amostra(NIVEL_MAX, 400).map((e) => Number(e.chave.split(':')[1]))
    expect(zs.some((z) => EXCECOES[z] !== undefined)).toBe(true)
    expect(zs.some((z) => EXCECOES[z] === undefined)).toBe(true)
    expect(zs.some((z) => z <= 20)).toBe(true)
  })

  it('cada nível estreia conteúdo novo', () => {
    const ate = (n: number) => new Set(amostra(n, 400).map((e) => Number(e.chave.split(':')[1])))
    const n0 = ate(0)
    const n1 = ate(1)
    const n2 = ate(2)
    expect([...n1].some((z) => z > 20 && z <= 56 && !n0.has(z))).toBe(true)
    expect([...n2].some((z) => z > 56 && !n1.has(z))).toBe(true)
  })

  it('a escala clampa nas pontas', () => {
    const { escala } = configuracaoEletronica.config()
    expect(escala(0)).toBe(0)
    expect(escala(-3)).toBeLessThanOrEqual(0)
    expect(escala(9999)).toBe(NIVEL_MAX)
  })
})

describe('metadados do jogo', () => {
  it('declara id, categoria e mecânica estáveis', () => {
    expect(configuracaoEletronica.id).toBe('configuracao-eletronica')
    expect(configuracaoEletronica.mecanica).toBe('gerador')
    expect(configuracaoEletronica.categoria).toBe('quimica')
    expect(configuracaoEletronica.unidade).toEqual({ singular: 'acerto', plural: 'acertos' })
    expect(configuracaoEletronica.comoJogar.length).toBeGreaterThanOrEqual(3)
  })

  it('o relógio é mais folgado que o dos outros geradores, e tem teto', () => {
    // Aqui se lê quatro cadeias de orbitais antes de decidir, e tempo de leitura
    // não é o que o jogo quer medir; sem teto, quem é bom joga para sempre.
    const c = configuracaoEletronica.config()
    expect(c.segundosIniciais).toBeGreaterThan(60)
    expect(c.tetoSegundos).toBeGreaterThan(c.segundosIniciais)
  })

  it('não pede Z que não existe', () => {
    expect(() => exercicioDe(rng(), 119)).toThrow(/não há elemento/)
  })
})
