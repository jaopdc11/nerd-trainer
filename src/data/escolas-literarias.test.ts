import { describe, expect, it } from 'vitest'
import { normalizarTexto } from '@/core/answer'
import {
  AUTORES,
  ESCOLAS,
  INDICE_DA_ESCOLA,
  exibirPeriodo,
  infoDaEscola,
} from './escolas-literarias'
import type { Escola } from './escolas-literarias'

/**
 * O gabarito, escrito à mão.
 *
 * Filiação de autor é o tipo de dado que se escreve errado sem que nada quebre:
 * trocar "Naturalismo" por "Realismo" em Aluísio produz uma carta bem-formada que
 * ensina o contrário do que deveria, e nenhuma checagem estrutural pega isso —
 * as duas são escolas válidas, vizinhas e do mesmo ano. Esta tabela veio autor a
 * autor, pela obra que fixa a filiação, e não do arquivo.
 */
const GABARITO: Readonly<Record<string, Escola>> = {
  'Bento Teixeira': 'Barroco',
  'Padre Antônio Vieira': 'Barroco',
  'Gregório de Matos': 'Barroco',
  'Manuel Botelho de Oliveira': 'Barroco',

  'Cláudio Manuel da Costa': 'Arcadismo',
  'Basílio da Gama': 'Arcadismo',
  'Santa Rita Durão': 'Arcadismo',
  'Tomás Antônio Gonzaga': 'Arcadismo',

  'Gonçalves de Magalhães': 'Romantismo',
  'Gonçalves Dias': 'Romantismo',
  'Manuel Antônio de Almeida': 'Romantismo',
  'Álvares de Azevedo': 'Romantismo',
  'José de Alencar': 'Romantismo',
  'Castro Alves': 'Romantismo',
  // As duas cartas de Machado, separadas pela obra: é o par que prova que a
  // escola é da obra e não da pessoa.
  'Machado de Assis (Helena)': 'Romantismo',
  'Machado de Assis (Memórias Póstumas de Brás Cubas)': 'Realismo',

  'Júlio Ribeiro': 'Naturalismo',
  'Aluísio Azevedo': 'Naturalismo',
  'Inglês de Sousa': 'Naturalismo',
  'Adolfo Caminha': 'Naturalismo',

  'Raimundo Correia': 'Parnasianismo',
  'Alberto de Oliveira': 'Parnasianismo',
  'Olavo Bilac': 'Parnasianismo',

  'Cruz e Sousa': 'Simbolismo',
  'Alphonsus de Guimaraens': 'Simbolismo',

  'Euclides da Cunha': 'Pré-modernismo',
  'Graça Aranha': 'Pré-modernismo',
  'Augusto dos Anjos': 'Pré-modernismo',
  'Lima Barreto': 'Pré-modernismo',
  'Monteiro Lobato': 'Pré-modernismo',

  'Mário de Andrade': 'Modernismo (1ª fase)',
  'Alcântara Machado': 'Modernismo (1ª fase)',
  'Oswald de Andrade': 'Modernismo (1ª fase)',
  'Manuel Bandeira': 'Modernismo (1ª fase)',

  'Rachel de Queiroz': 'Modernismo (2ª fase)',
  'Carlos Drummond de Andrade': 'Modernismo (2ª fase)',
  'José Lins do Rego': 'Modernismo (2ª fase)',
  'Jorge Amado': 'Modernismo (2ª fase)',
  'Graciliano Ramos': 'Modernismo (2ª fase)',
  'Erico Verissimo': 'Modernismo (2ª fase)',

  'João Cabral de Melo Neto': 'Modernismo (3ª fase)',
  'Ariano Suassuna': 'Modernismo (3ª fase)',
  'Guimarães Rosa': 'Modernismo (3ª fase)',
  'Clarice Lispector': 'Modernismo (3ª fase)',

  'Caio Fernando Abreu': 'Contemporâneo',
  'Rubem Fonseca': 'Contemporâneo',
  'Paulo Lins': 'Contemporâneo',
  'Milton Hatoum': 'Contemporâneo',
  'Conceição Evaristo': 'Contemporâneo',
}

/** A chave do gabarito: o nome, com a obra entre parênteses só onde ela decide. */
const chave = (a: (typeof AUTORES)[number]) => (a.precisaDaObra ? `${a.nome} (${a.obra})` : a.nome)

describe('dataset', () => {
  it('bate com o gabarito conferido à mão, autor a autor', () => {
    for (const a of AUTORES) {
      const esperada = GABARITO[chave(a)]
      expect(esperada, `"${chave(a)}" não está no gabarito do teste`).toBeDefined()
      expect(a.escola, chave(a)).toBe(esperada)
    }
    expect(AUTORES).toHaveLength(Object.keys(GABARITO).length)
  })

  it('não tem id repetido', () => {
    const ids = AUTORES.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('não tem duas cartas com a mesma pergunta', () => {
    // Duas perguntas iguais com escolas diferentes tornariam uma das duas
    // impossível. É a trava que obriga Machado a carregar a obra na pergunta.
    const perguntas = AUTORES.map((a) => normalizarTexto(chave(a), true))
    expect(new Set(perguntas).size).toBe(perguntas.length)
  })

  it('autor que aparece mais de uma vez carrega a obra em todas as cartas', () => {
    // Marcar só a carta realista de Machado deixaria a romântica lendo "Machado
    // de Assis" solto — e aí a pergunta teria duas respostas certas na tela.
    const quantas = new Map<string, number>()
    for (const a of AUTORES) quantas.set(a.nome, (quantas.get(a.nome) ?? 0) + 1)
    for (const a of AUTORES) {
      if ((quantas.get(a.nome) ?? 0) > 1) expect(a.precisaDaObra, a.id).toBe(true)
    }
  })

  it('não põe a obra na pergunta de quem não precisa', () => {
    // A obra entre parênteses é informação extra: dada de graça a um autor que
    // não atravessa escola nenhuma, ela vira meia-resposta.
    const repetidos = new Set(
      AUTORES.filter((a, _, todos) => todos.filter((o) => o.nome === a.nome).length > 1).map(
        (a) => a.nome,
      ),
    )
    for (const a of AUTORES) {
      if (!repetidos.has(a.nome)) expect(a.precisaDaObra, a.id).toBeUndefined()
    }
  })

  it('a obra de cada autor cai dentro do período da escola', () => {
    // O teste que pega classificação errada sem depender do meu gabarito: se
    // alguém marcasse Vidas Secas como primeira fase, 1938 estouraria a janela
    // 1922–1930 e o erro apareceria sozinho.
    for (const a of AUTORES) {
      if (a.ano === undefined) continue
      const info = infoDaEscola(a.escola)
      expect(a.ano, `${a.id}: ${a.obra}`).toBeGreaterThanOrEqual(info.inicio)
      expect(a.ano, `${a.id}: ${a.obra}`).toBeLessThanOrEqual(info.fim ?? new Date().getFullYear())
    }
  })

  it('toda escola tem pelo menos uma carta', () => {
    // Uma escola sem autor viraria um distrator que nunca é resposta — e um
    // jogador atento aprenderia a nunca marcá-la.
    for (const e of ESCOLAS) {
      expect(AUTORES.some((a) => a.escola === e.nome), `${e.nome} não tem autor`).toBe(true)
    }
  })

  it('o Realismo tem uma carta só, e é Machado', () => {
    // Registrado como decisão, não como lacuna: o Realismo brasileiro em prosa é
    // Machado e mais ninguém. Se alguém acrescentar um "realista" aqui, que seja
    // apagando este teste de propósito, e não sem perceber.
    const realistas = AUTORES.filter((a) => a.escola === 'Realismo')
    expect(realistas.map((a) => a.nome)).toEqual(['Machado de Assis'])
  })
})

describe('linha do tempo', () => {
  it('está em ordem cronológica — é dela que saem os distratores', () => {
    for (let i = 1; i < ESCOLAS.length; i++) {
      const anterior = ESCOLAS[i - 1]
      const atual = ESCOLAS[i]
      if (!anterior || !atual) throw new Error('lista furada')
      expect(atual.inicio, `${atual.nome} vem depois de ${anterior.nome}`).toBeGreaterThanOrEqual(
        anterior.inicio,
      )
    }
  })

  it('cada escola termina onde a seguinte começa, ou depois', () => {
    // Realismo, Naturalismo e Parnasianismo convivem: as janelas se sobrepõem de
    // propósito, e é por isso que o teste checa o fim e não a exclusividade.
    for (const e of ESCOLAS) {
      if (e.fim !== undefined) expect(e.fim, e.nome).toBeGreaterThan(e.inicio)
    }
    expect(ESCOLAS.filter((e) => e.fim === undefined).map((e) => e.nome)).toEqual(['Contemporâneo'])
  })

  it('tem as doze escolas, com as três fases do modernismo separadas', () => {
    expect(ESCOLAS.map((e) => e.nome)).toEqual([
      'Barroco',
      'Arcadismo',
      'Romantismo',
      'Realismo',
      'Naturalismo',
      'Parnasianismo',
      'Simbolismo',
      'Pré-modernismo',
      'Modernismo (1ª fase)',
      'Modernismo (2ª fase)',
      'Modernismo (3ª fase)',
      'Contemporâneo',
    ])
  })

  it('põe lado a lado os pares que de fato se confundem', () => {
    // Realismo × Naturalismo e Parnasianismo × Simbolismo são a confusão real, e
    // o jogo só consegue explorá-la se eles forem vizinhos na lista.
    const perto = (a: Escola, b: Escola) =>
      Math.abs((INDICE_DA_ESCOLA.get(a) ?? -99) - (INDICE_DA_ESCOLA.get(b) ?? 99))
    expect(perto('Realismo', 'Naturalismo')).toBe(1)
    expect(perto('Parnasianismo', 'Simbolismo')).toBe(1)
    expect(perto('Modernismo (1ª fase)', 'Modernismo (2ª fase)')).toBe(1)
  })

  it('exibe o período do jeito que o gabarito precisa', () => {
    expect(exibirPeriodo(infoDaEscola('Realismo'))).toBe('1881–1902')
    expect(exibirPeriodo(infoDaEscola('Contemporâneo'))).toBe('1980 em diante')
  })

  it('reclama de escola que não existe', () => {
    expect(() => infoDaEscola('Futurismo' as Escola)).toThrow()
  })
})
