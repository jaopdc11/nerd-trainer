import { describe, expect, it } from 'vitest'
import { distancia, normalizarTexto } from '@/core/answer'
import { CRITERIOS } from '@/core/nerdometro'
import { FILOSOFIA, SOCIOLOGIA } from './pensadores'
import type { Item } from './pensadores'

const DECKS: [string, readonly Item[]][] = [
  ['filosofia', FILOSOFIA],
  ['sociologia', SOCIOLOGIA],
]

describe.each(DECKS)('%s', (nome, deck) => {
  it('não tem id repetido', () => {
    const ids = deck.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('não tem duas cartas com a mesma pergunta', () => {
    // Pergunta repetida com autores diferentes tornaria uma delas impossível.
    const perguntas = deck.map((i) => normalizarTexto(i.pergunta, true))
    expect(new Set(perguntas).size).toBe(perguntas.length)
  })

  it('o autor canônico está entre as formas aceitas', () => {
    for (const i of deck) {
      expect(i.aceitas, i.id).toContain(i.autor)
    }
  })

  /**
   * A trava que importa neste baralho.
   *
   * `validar` tolera um caractere de erro em respostas com sete letras ou mais.
   * Se dois autores do *mesmo* deck estiverem a essa distância, digitar um
   * aceitaria o outro — e a partida daria ponto por resposta errada. A mesma
   * armadilha que tirou a tolerância do alfabeto grego, onde "ni" e "mi" são
   * vizinhos.
   */
  it('nenhum par de autores fica a um caractere de distância', () => {
    // Normalizar antes de deduplicar: "Antonio Candido" e "Antônio Cândido"
    // são grafias da mesma pessoa e colapsam na mesma forma. Comparar as duas
    // acusaria distância zero entre um autor e ele mesmo.
    const autores = [...new Set(deck.flatMap((i) => i.aceitas).map((a) => normalizarTexto(a, true)))]
    for (let x = 0; x < autores.length; x++) {
      for (let y = x + 1; y < autores.length; y++) {
        const a = autores[x] as string
        const b = autores[y] as string
        if (a.length < 7 && b.length < 7) continue
        expect(distancia(a, b), `"${a}" e "${b}" são quase iguais`).toBeGreaterThan(1)
      }
    }
  })

  it('só pergunta autoria, nunca interpretação', () => {
    // Um card de memorização não segura "o que Kant pensava". Pergunta aberta
    // aqui viraria uma resposta caricata fingindo ser fato.
    for (const i of deck) {
      expect(i.pergunta, i.id).not.toMatch(/^(o que|por que|qual|como|defina|explique)\b/i)
      expect(['conceito', 'obra']).toContain(i.tipo)
    }
  })

  it('a meta cabe no baralho e não é frouxa', () => {
    // A meta é o que dá para decorar de verdade, não o tamanho do dataset — a
    // mesma regra que dá meta 100 ao π. Mas ela não pode passar do baralho
    // (nota cheia ficaria inalcançável) nem ser tão baixa que não meça nada.
    const meta = CRITERIOS.find((c) => c.jogoId === nome)?.meta ?? 0
    expect(meta, nome).toBeGreaterThan(deck.length * 0.6)
    expect(meta, nome).toBeLessThanOrEqual(deck.length)
  })
})

describe('cobertura', () => {
  it('filosofia cobre os cânones que caem em prova', () => {
    const autores = new Set(FILOSOFIA.map((i) => i.autor))
    for (const quem of ['Platão', 'Aristóteles', 'Descartes', 'Kant', 'Nietzsche', 'Sartre', 'Foucault', 'Arendt', 'Beauvoir']) {
      expect(autores.has(quem), `falta ${quem}`).toBe(true)
    }
  })

  it('sociologia tem os três clássicos e o pensamento social brasileiro', () => {
    const autores = new Set(SOCIOLOGIA.map((i) => i.autor))
    for (const quem of ['Durkheim', 'Weber', 'Marx']) {
      expect(autores.has(quem), `falta ${quem}`).toBe(true)
    }
    const brasileiros = ['Sérgio Buarque de Holanda', 'Gilberto Freyre', 'Florestan Fernandes']
    for (const quem of brasileiros) {
      expect(autores.has(quem), `falta ${quem}`).toBe(true)
    }
  })

  it('cada deck mistura conceito e obra', () => {
    for (const [nome, deck] of DECKS) {
      expect(deck.some((i) => i.tipo === 'conceito'), nome).toBe(true)
      expect(deck.filter((i) => i.tipo === 'obra').length, nome).toBeGreaterThan(3)
    }
  })
})
