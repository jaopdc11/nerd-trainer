import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia } from '@/core/answer'
import {
  exibirKm,
  exibirMetros,
  LIMITE_OITOMIL,
  OITOMIL,
  PRIMEIRO_PICO_DE_FORA,
  PRIMEIRO_RIO_DE_FORA,
  RIOS,
} from './rios-montanhas'
import type { Pico, Rio } from './rios-montanhas'

const FORMAS_DE = (item: { nome: string; sinonimos: readonly string[] }): readonly string[] => [
  item.nome,
  ...item.sinonimos,
]

describe('os rios', () => {
  it('são dez, com id e nome únicos', () => {
    expect(RIOS).toHaveLength(10)
    expect(new Set(RIOS.map((r) => r.id)).size).toBe(10)
    expect(new Set(RIOS.map((r) => r.nome)).size).toBe(10)
  })

  /**
   * O teste que justifica o módulo existir: a ordem é escrita à mão e é ela que
   * o jogo recita. Uma linha movida de lugar sem o número correspondente mata a
   * partida de quem estudou a lista certa — então a ordem declarada é
   * reconstruída a partir dos quilômetros e tem que dar exatamente o mesmo.
   */
  it('a ordem declarada é a ordem dos quilômetros, sem empate', () => {
    expect(RIOS.map((r) => r.id)).toEqual([...RIOS].sort((a, b) => b.km - a.km).map((r) => r.id))
    for (let i = 1; i < RIOS.length; i++) {
      const anterior = RIOS[i - 1] as Rio
      const atual = RIOS[i] as Rio
      expect(atual.km, `${atual.nome} não é menor que ${anterior.nome}`).toBeLessThan(anterior.km)
    }
  })

  it('o décimo é apertado, e o dataset sabe disso', () => {
    const ultimo = RIOS[9] as Rio
    expect(ultimo.nome).toBe('Amur')
    expect(PRIMEIRO_RIO_DE_FORA.km).toBeLessThan(ultimo.km)
    // Menos de 2% de folga: é a posição que mais depende da régua adotada, e o
    // cabeçalho do dataset diz qual é e por quê. Se alguém reescrever a régua,
    // este é o número que muda de sinal primeiro.
    expect((ultimo.km - PRIMEIRO_RIO_DE_FORA.km) / ultimo.km).toBeLessThan(0.02)
  })

  it('as extensões conferidas à mão', () => {
    const km = (id: string) => RIOS.find((r) => r.id === id)?.km
    expect(km('nilo')).toBe(6_650)
    expect(km('amazonas')).toBe(6_400)
    expect(km('yangtze')).toBe(6_300)
    // Sem o sistema Mississippi-Missouri o rio tem 3.766 km e não entra na lista:
    // é o item que denuncia se alguém trocar a régua no meio do caminho.
    expect(km('mississippi')).toBe(6_275)
  })
})

/**
 * O par disputado, tratado como `capitais.ts` trata sede múltipla: canônica
 * escolhida, motivo escrito, alternativa aceita. O teste existe para que mudar
 * a canônica continue sendo uma decisão — legítima, mas tomada aqui também.
 */
describe('Nilo × Amazonas', () => {
  it('o Nilo é a canônica do primeiro lugar, pela medida clássica', () => {
    expect(RIOS[0]?.id).toBe('nilo')
    expect(RIOS[1]?.id).toBe('amazonas')
  })

  it('a troca é declarada dos dois lados, e só entre eles', () => {
    expect(RIOS[0]?.trocaCom).toBe('amazonas')
    expect(RIOS[1]?.trocaCom).toBe('nilo')
    expect(RIOS.filter((r) => r.trocaCom).map((r) => r.id)).toEqual(['nilo', 'amazonas'])
  })

  it('a troca é entre posições vizinhas', () => {
    for (let i = 0; i < RIOS.length; i++) {
      const r = RIOS[i] as Rio
      if (!r.trocaCom) continue
      const j = RIOS.findIndex((o) => o.id === r.trocaCom)
      expect((RIOS[j] as Rio).trocaCom, `${r.nome} declara a troca e não recebe de volta`).toBe(r.id)
      expect(Math.abs(i - j)).toBe(1)
    }
  })
})

describe('os oitomil', () => {
  it('são catorze, com id e nome únicos', () => {
    expect(OITOMIL).toHaveLength(14)
    expect(new Set(OITOMIL.map((p) => p.id)).size).toBe(14)
    expect(new Set(OITOMIL.map((p) => p.nome)).size).toBe(14)
  })

  it('a ordem declarada é a ordem das altitudes, sem empate', () => {
    expect(OITOMIL.map((p) => p.id)).toEqual(
      [...OITOMIL].sort((a, b) => b.metros - a.metros).map((p) => p.id),
    )
    for (let i = 1; i < OITOMIL.length; i++) {
      const anterior = OITOMIL[i - 1] as Pico
      const atual = OITOMIL[i] as Pico
      expect(atual.metros, `${atual.nome} não é menor que ${anterior.nome}`).toBeLessThan(
        anterior.metros,
      )
    }
  })

  /**
   * A diferença entre esta lista e um "top 14" qualquer: o corte não é escolha
   * de autor. Todo item está acima da linha, e o primeiro de fora está abaixo —
   * é isso que faz o conjunto ser fechado.
   */
  it('todos passam dos 8.000 m, e o primeiro de fora não passa', () => {
    for (const p of OITOMIL) expect(p.metros, p.nome).toBeGreaterThan(LIMITE_OITOMIL)
    expect(PRIMEIRO_PICO_DE_FORA.metros).toBeLessThan(LIMITE_OITOMIL)
    expect(OITOMIL.some((p) => p.nome === PRIMEIRO_PICO_DE_FORA.nome)).toBe(false)
    // O último da lista está a 27 m da linha e o primeiro de fora a 48 m dela:
    // a fronteira é estreita dos dois lados, e por isso é medida aqui.
    expect((OITOMIL[13] as Pico).metros - LIMITE_OITOMIL).toBeLessThan(50)
  })

  it('as altitudes conferidas à mão', () => {
    const m = (id: string) => OITOMIL.find((p) => p.id === id)?.metros
    expect(m('everest')).toBe(8_849) // medição conjunta Nepal–China, 2020
    expect(m('k2')).toBe(8_611)
    expect(m('kangchenjunga')).toBe(8_586)
    expect(m('annapurna')).toBe(8_091)
    expect(m('shishapangma')).toBe(8_027)
    // Everest e K2 separados por 238 m: nem a medição de 1955 (8.848 m) mexe no
    // primeiro lugar, e é por isso que a troca de fonte não vira `trocaCom` aqui.
    expect((m('everest') as number) - (m('k2') as number)).toBeGreaterThan(200)
  })
})

describe('todas as formas aceitas', () => {
  const FORMAS = [...RIOS, ...OITOMIL].flatMap((item) =>
    FORMAS_DE(item).map((forma) => ({ id: item.id, texto: chaveDeTexto(forma) })),
  )

  it('nenhuma é vazia e nenhuma serve a dois itens', () => {
    const dono = new Map<string, string>()
    for (const f of FORMAS) {
      expect(f.texto, 'forma vazia depois de normalizar').not.toBe('')
      const anterior = dono.get(f.texto)
      expect(anterior ?? f.id, `"${f.texto}" serve a ${anterior} e a ${f.id}`).toBe(f.id)
      dono.set(f.texto, f.id)
    }
  })

  /**
   * A mesma medição de `capitais.test.ts`, e aqui ela deu o pior resultado
   * possível: **Gasherbrum I e Gasherbrum II estão a um caractere de distância**,
   * e são vizinhos na própria lista (11º e 13º).
   *
   * É o que decide a configuração do jogo. Com a tolerância a typo ligada, o
   * validador diria "quase" para quem nomeou a outra montanha — e, na sequência,
   * 'quase' mata igual, porque a engine só segue com 'certo'. Pior: a sequência
   * não passa `vizinhanca` ao validador, então a trava que segura esse caso no
   * mapa de países não existe aqui. Por isso `rios-montanhas.ts` desliga a
   * tolerância, e este teste é a prova de que a decisão tem base.
   *
   * Se a lista ganhar outro par assim, é aqui que aparece.
   */
  it('só os Gasherbrum ficam a um caractere de distância', () => {
    const perigosos: string[] = []
    for (let i = 0; i < FORMAS.length; i++) {
      for (let j = i + 1; j < FORMAS.length; j++) {
        const a = FORMAS[i] as { id: string; texto: string }
        const b = FORMAS[j] as { id: string; texto: string }
        if (a.id === b.id) continue
        if (a.texto.length < 7 && b.texto.length < 7) continue
        if (distancia(a.texto, b.texto) <= 1) perigosos.push(`${a.texto} / ${b.texto}`)
      }
    }
    expect(perigosos.sort()).toEqual([
      'gasherbrum1 / gasherbrum2',
      'gasherbrumi / gasherbrum2',
      'gasherbrumi / gasherbrumii',
    ])
  })
})

describe('a formatação', () => {
  it('escreve distância e altitude no formato brasileiro', () => {
    expect(exibirKm(6_650)).toBe('6.650 km')
    expect(exibirMetros(8_849)).toBe('8.849 m')
  })
})
