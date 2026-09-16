import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { ELEMENTOS } from '@/data/tabela-periodica'
import { origemDoSimbolo, simbolosElementos } from './simbolos-elementos'

const BARALHO = simbolosElementos.config().montarBaralho(mulberry32(7))

const DIGITADAS = BARALHO.filter(
  (c): c is Extract<Carta, { tipo: 'digitada' }> => c.tipo === 'digitada',
)

/**
 * A regra do jogo inteira, não a da função isolada.
 *
 * `useFlashcard` julga a resposta passando como vizinhança **todas as formas
 * aceitas das outras cartas do baralho** — é essa trava, e não o limite de
 * distância, que segura a tolerância a erro de digitação em pé. Testar `validar`
 * sozinho mediria outra coisa, e seria justamente a coisa errada: é a vizinhança
 * que decide se ligar a tolerância foi seguro.
 */
function responde(texto: string, carta: Extract<Carta, { tipo: 'digitada' }>): boolean {
  const vizinhanca = new Set(
    DIGITADAS.filter((c) => c.id !== carta.id).flatMap((c) =>
      c.resposta.tipo === 'texto' ? c.resposta.aceitas : [],
    ),
  )
  return validar(texto, carta.resposta, { rigor: 'estrito', vizinhanca }).veredito !== 'errado'
}

const cartaDe = (simbolo: string) => {
  const z = ELEMENTOS.find((e) => e.simbolo === simbolo)?.z
  return DIGITADAS.find((c) => c.id === `simbolo-z${z}`) as Extract<Carta, { tipo: 'digitada' }>
}

/** Onde o texto pontua: a carta, ou nenhuma. Serve para provar exclusividade. */
function ondePontua(texto: string): readonly string[] {
  return DIGITADAS.filter((c) => responde(texto, c)).map((c) => c.id)
}

describe('baralho', () => {
  it('é o dataset inteiro, uma carta por elemento', () => {
    expect(BARALHO).toHaveLength(118)
    expect(DIGITADAS).toHaveLength(118)
    expect(new Set(BARALHO.map((c) => c.id)).size).toBe(118)
  })

  it('pergunta o símbolo e nada mais', () => {
    // Nem o número atômico, nem o período: com o Z na tela isto viraria a grade
    // outra vez, e a grade já existe.
    const simbolos = ELEMENTOS.map((e) => e.simbolo).sort()
    const perguntas = BARALHO.map((c) =>
      c.pergunta.kind === 'texto' ? c.pergunta.valor : '',
    ).sort()
    expect(perguntas).toEqual(simbolos)
  })

  it('vai até a última carta, sem relógio e sem morte súbita', () => {
    expect(simbolosElementos.config().fim).toBe('baralho')
    expect(simbolosElementos.mecanica).toBe('flashcard')
    expect(simbolosElementos.categoria).toBe('quimica')
  })

  it('embaralha — a ordem não é a do número atômico', () => {
    const emOrdem = ELEMENTOS.map((e) => `simbolo-z${e.z}`)
    expect(BARALHO.map((c) => c.id)).not.toEqual(emOrdem)
  })
})

describe('o que pontua', () => {
  it('cada nome pontua na sua carta e em nenhuma outra', () => {
    for (const e of ELEMENTOS) {
      expect(ondePontua(e.nome), e.nome).toEqual([`simbolo-z${e.z}`])
    }
  })

  it('e continua pontuando sem acento e sem caixa', () => {
    for (const e of ELEMENTOS) {
      const cru = chaveDeTexto(e.nome, false).toUpperCase()
      expect(ondePontua(cru), `${e.nome} → ${cru}`).toEqual([`simbolo-z${e.z}`])
    }
  })

  it('todo sinônimo do dataset pontua na carta que o declarou', () => {
    for (const e of ELEMENTOS) {
      for (const s of e.sinonimos) {
        expect(ondePontua(s), `${s} (de ${e.nome})`).toEqual([`simbolo-z${e.z}`])
      }
    }
  })

  it('o latim vale: Natrium para Na, Plumbum para Pb, Wolfram para W', () => {
    expect(responde('natrium', cartaDe('Na'))).toBe(true)
    expect(responde('plumbum', cartaDe('Pb'))).toBe(true)
    expect(responde('wolfram', cartaDe('W'))).toBe(true)
    expect(responde('hydrargyrum', cartaDe('Hg'))).toBe(true)
  })

  it('não pontua o que não é elemento', () => {
    // "antimonia" e "oxigenia" ficam de fora desta lista de propósito: são erros
    // de digitação de um caractere em nomes longos, e pontuar é exatamente o que
    // a tolerância existe para fazer. Lixo aqui é lixo mesmo.
    for (const lixo of ['asdfghjkl', 'tabela', 'quimica', 'elemento']) {
      expect(ondePontua(lixo), lixo).toEqual([])
    }
  })
})

/**
 * A medição que decide `tolerarTypo`.
 *
 * Existe porque "os nomes são curtos e parecidos" é uma impressão, e impressão
 * já custou caro neste projeto: a das bandeiras estava errada e manteve a
 * tolerância desligada sem motivo. Aqui os números são dois, e eles não dizem a
 * mesma coisa.
 */
describe('tolerância a erro de digitação: a medição', () => {
  const FORMAS = ELEMENTOS.map((e) => ({
    e,
    chaves: [...new Set([e.nome, ...e.sinonimos].map((n) => chaveDeTexto(n, false)))],
  }))

  /** Pares de elementos cujas formas ficam a `<= limite` um do outro. */
  function paresAte(limite: (a: string, b: string) => number): readonly string[] {
    const pares: string[] = []
    for (let i = 0; i < FORMAS.length; i++) {
      for (let j = i + 1; j < FORMAS.length; j++) {
        const a = FORMAS[i] as (typeof FORMAS)[number]
        const b = FORMAS[j] as (typeof FORMAS)[number]
        const encosta = a.chaves.some((x) =>
          b.chaves.some((y) => {
            const l = limite(x, y)
            return l > 0 && distancia(x, y, l) <= l
          }),
        )
        if (encosta) pares.push(`${a.e.nome}×${b.e.nome}`)
      }
    }
    return pares
  }

  it('nove pares de nomes estão a um único caractere de distância', () => {
    // O motivo do medo, e ele é real: esta é a lista que faria qualquer um
    // desligar a tolerância sem medir, como o grego e os prefixos SI fizeram.
    expect(paresAte(() => 1)).toEqual([
      'Sódio×Ródio',
      'Cromo×Bromo',
      'Gálio×Tálio',
      'Ródio×Rádio',
      'Césio×Cério',
      'Cério×Cúrio',
      'Térbio×Érbio',
      'Térbio×Itérbio',
      'Túlio×Tálio',
    ])
  })

  it('mas com a régua que o jogo usa de fato, sobra um', () => {
    // `limiteDeErro` é um erro a cada sete caracteres, com piso em zero: os
    // nomes de cinco e seis letras — que são justamente os nove pares acima —
    // não perdoam nada. Sobra Térbio × Itérbio, porque "iterbio" tem sete.
    const pela = (a: string, b: string) => Math.max(limiteDeErro(a.length), limiteDeErro(b.length))
    expect(paresAte(pela)).toEqual(['Térbio×Itérbio'])
  })

  it('e o único que sobra morre na trava de vizinhança', () => {
    // O que a trava faz: "terbio" encosta em Itérbio pela tolerância, mas
    // encosta *exatamente* em Térbio, então é ambíguo e não vale em lugar
    // nenhum. Ambiguidade nunca é resolvida a favor do jogador.
    expect(responde('terbio', cartaDe('Yb'))).toBe(false)
    expect(ondePontua('terbio')).toEqual([`simbolo-z${65}`])
    expect(ondePontua('iterbio')).toEqual([`simbolo-z${70}`])
  })

  it('os nomes curtos não perdoam nada — nenhum dos nove pares troca de dono', () => {
    const trocas: [string, string][] = [
      ['sodio', 'Ródio'], ['rodio', 'Sódio'], ['cromo', 'Bromo'], ['bromo', 'Cromo'],
      ['galio', 'Tálio'], ['talio', 'Gálio'], ['radio', 'Ródio'], ['cesio', 'Cério'],
      ['cerio', 'Césio'], ['curio', 'Cério'], ['erbio', 'Térbio'], ['tulio', 'Tálio'],
      ['boro', 'Bromo'], ['osmio', 'Sódio'],
    ]
    for (const [texto, alheia] of trocas) {
      expect(responde(texto, cartaDe(nomeParaSimbolo(alheia))), `${texto} na carta de ${alheia}`)
        .toBe(false)
    }
  })

  it('e perdoa o dedo errado onde o nome é longo, que é o ponto', () => {
    // Onze e doze caracteres: aqui a pessoa sabe a resposta e perde o ponto por
    // uma letra. É esta faixa, e só ela, que a tolerância existe para cobrir.
    expect(responde('prasedimio', cartaDe('Pr'))).toBe(true)
    expect(responde('ruterfordio', cartaDe('Rf'))).toBe(true)
    expect(responde('oganesonio', cartaDe('Og'))).toBe(true)
    expect(responde('protactinio', cartaDe('Pa'))).toBe(true)
    expect(responde('darmstacio', cartaDe('Ds'))).toBe(true)
  })
})

function nomeParaSimbolo(nome: string): string {
  return ELEMENTOS.find((e) => e.nome === nome)?.simbolo as string
}

describe('gabarito', () => {
  /**
   * O gabarito mostra a origem do símbolo só onde ela explica alguma coisa.
   *
   * Esta lista é o gabarito conferido à mão da regra de `origemDoSimbolo`: se
   * ela mudar — ou se alguém acrescentar um sinônimo no dataset — é aqui que se
   * vê o efeito, em vez de descobrir na tela do jogo.
   */
  const COM_ORIGEM: Readonly<Record<string, string>> = {
    Na: 'Natrium', K: 'Kalium', Cu: 'Cuprum', Ag: 'Argentum', Sn: 'Stannum',
    Sb: 'Stibium', W: 'Wolfrâmio', Au: 'Aurum', Hg: 'Hydrargyrum', Pb: 'Plumbum',
    S: 'Sulfur',
    // O único que não é latim: o símbolo Np guarda o "p" de Neptúnio, que o
    // "Netúnio" do pt-BR perdeu. A regra o pega sozinha, e está certa em pegar.
    Np: 'Neptúnio',
  }

  it('mostra a origem exatamente nestes doze', () => {
    const achados = Object.fromEntries(
      ELEMENTOS.map((e) => [e.simbolo, origemDoSimbolo(e)]).filter(([, o]) => o !== null),
    )
    expect(achados).toEqual(COM_ORIGEM)
  })

  it('não mostra origem onde o próprio nome já explica o símbolo', () => {
    // Ferro→Fe e Nitrogênio→N não precisam de latim; Arsênio e Astato têm
    // sinônimo no dataset e mesmo assim não precisam, porque o nome em português
    // já contém o símbolo.
    for (const s of ['Fe', 'N', 'I', 'As', 'At', 'C', 'O']) {
      const e = ELEMENTOS.find((x) => x.simbolo === s)
      expect(origemDoSimbolo(e as never), s).toBeNull()
    }
  })

  it('o gabarito da carta traz a origem entre parênteses', () => {
    expect(cartaDe('Pb').gabarito).toBe('Chumbo (Plumbum)')
    expect(cartaDe('Hg').gabarito).toBe('Mercúrio (Hydrargyrum)')
    expect(cartaDe('Fe').gabarito).toBe('Ferro')
  })
})
