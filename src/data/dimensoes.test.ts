import { describe, expect, it } from 'vitest'
import { GRANDEZAS, emUnidadesBase } from './grandezas'
import type { Grandeza } from './grandezas'
import { distratoresDimensionais, notacaoDimensional } from './dimensoes'

/**
 * O gabarito dimensional, escrito à mão.
 *
 * `notacaoDimensional()` resolve a partir dos expoentes, e por isso não pode se
 * autoaprovar: com `s: -3` no lugar de `-2` sai `ML²T⁻³`, que é uma notação
 * impecável e a dimensão de outra grandeza. Estes valores foram escritos um a
 * um a partir da definição de cada grandeza, não rodando a função.
 */
const GABARITO: Readonly<Record<string, string>> = {
  massa: 'M',
  comprimento: 'L',
  tempo: 'T',
  'corrente-eletrica': 'I',
  temperatura: 'Θ',
  'quantidade-de-materia': 'N',
  'intensidade-luminosa': 'J',

  frequencia: 'T⁻¹',
  forca: 'MLT⁻²',
  pressao: 'ML⁻¹T⁻²',
  energia: 'ML²T⁻²',
  potencia: 'ML²T⁻³',
  'carga-eletrica': 'TI',
  'tensao-eletrica': 'ML²T⁻³I⁻¹',
  'resistencia-eletrica': 'ML²T⁻³I⁻²',
  capacitancia: 'M⁻¹L⁻²T⁴I²',
  'condutancia-eletrica': 'M⁻¹L⁻²T³I²',
  'fluxo-magnetico': 'ML²T⁻²I⁻¹',
  'inducao-magnetica': 'MT⁻²I⁻¹',
  indutancia: 'ML²T⁻²I⁻²',
  'fluxo-luminoso': 'J',
  iluminancia: 'L⁻²J',
  'atividade-radioativa': 'T⁻¹',
  'dose-absorvida': 'L²T⁻²',
  'dose-equivalente': 'L²T⁻²',
  'atividade-catalitica': 'T⁻¹N',

  velocidade: 'LT⁻¹',
  aceleracao: 'LT⁻²',
  'quantidade-de-movimento': 'MLT⁻¹',
  impulso: 'MLT⁻¹',
  torque: 'ML²T⁻²',
  'momento-de-inercia': 'ML²',
  densidade: 'ML⁻³',
  vazao: 'L³T⁻¹',
  viscosidade: 'ML⁻¹T⁻¹',
  'tensao-superficial': 'MT⁻²',
  'constante-elastica': 'MT⁻²',
  'campo-eletrico': 'MLT⁻³I⁻¹',
  entropia: 'ML²T⁻²Θ⁻¹',
  'calor-especifico': 'L²T⁻²Θ⁻¹',
  'constante-dos-gases': 'ML²T⁻²Θ⁻¹N⁻¹',
  'constante-de-planck': 'ML²T⁻¹',
  'constante-gravitacional': 'M⁻¹L³T⁻²',
}

/**
 * Os grupos de grandezas que compartilham dimensão.
 *
 * Não são acidente nem erro de cadastro: são física, e cada um deles é uma aula.
 * O teste fixa a lista porque um grupo novo aparecendo sozinho é sinal de
 * expoente errado — e porque um destes sumindo também é.
 */
const MESMA_DIMENSAO: readonly (readonly string[])[] = [
  // ciclo por segundo e desintegração por segundo: unidades diferentes de
  // propósito, dimensão igual.
  ['frequencia', 'atividade-radioativa'],
  // N·m não é joule, e essa é a lição inteira.
  ['energia', 'torque'],
  // o teorema do impulso, escrito em dimensões.
  ['quantidade-de-movimento', 'impulso'],
  // o peso biológico do sievert é adimensional.
  ['dose-absorvida', 'dose-equivalente'],
  // as duas são newton por metro.
  ['tensao-superficial', 'constante-elastica'],
  // o esterradiano do lúmen é adimensional.
  ['intensidade-luminosa', 'fluxo-luminoso'],
]

/** A tradução unidade → dimensão, reescrita à mão para o teste de divergência. */
const LETRA_DE: Readonly<Record<string, string>> = {
  kg: 'M',
  m: 'L',
  s: 'T',
  A: 'I',
  K: 'Θ',
  mol: 'N',
  cd: 'J',
}

const acha = (id: string): Grandeza => {
  const g = GRANDEZAS.find((x) => x.id === id)
  if (!g) throw new Error(`${id} não está no dataset`)
  return g
}

const dimensaoDe = (id: string): string => notacaoDimensional(acha(id))

describe('notação dimensional', () => {
  it('bate com o gabarito conferido à mão, grandeza a grandeza', () => {
    for (const g of GRANDEZAS) {
      const esperado = GABARITO[g.id]
      expect(esperado, `${g.id} não está no gabarito do teste`).toBeDefined()
      expect(notacaoDimensional(g), g.nome).toBe(esperado)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual(GRANDEZAS.map((g) => g.id).sort())
  })

  it('usa a ordem de ISO 80000 e nada além das sete letras', () => {
    for (const g of GRANDEZAS) {
      expect(notacaoDimensional(g), g.id).toMatch(/^(?:[MLTIΘNJ](?:⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?)+$/u)
    }
    // Se `BASES_SI` mudar de ordem, esta sai como "T⁻²ML" e ninguém mais
    // reconhece a dimensão de força numa prova.
    expect(dimensaoDe('forca')).toBe('MLT⁻²')
    expect(dimensaoDe('constante-dos-gases')).toBe('ML²T⁻²Θ⁻¹N⁻¹')
  })
})

describe('a unidade e a dimensão não podem divergir', () => {
  /**
   * O teste que justifica os dois jogos compartilharem um dataset só.
   *
   * Ele refaz a tradução por fora: pega `kg·m·s⁻²`, troca cada símbolo de base
   * pela letra dimensional e tira os pontos. Tem de dar exatamente a notação que
   * o jogo de análise dimensional mostra. Enquanto isso valer, um expoente
   * corrigido num jogo está corrigido no outro por construção — e se algum dia
   * alguém inventar de guardar a dimensão à parte, é aqui que a segunda verdade
   * aparece.
   */
  it('a dimensão é a unidade de base com as letras trocadas, fator a fator', () => {
    for (const g of GRANDEZAS) {
      const traduzida = emUnidadesBase(g)
        .split('·')
        .map((fator) => {
          const casa = /^([A-Za-z]+)(.*)$/u.exec(fator)
          expect(casa, `${g.id}: fator ilegível "${fator}"`).not.toBeNull()
          const simbolo = casa?.[1] ?? ''
          const expoente = casa?.[2] ?? ''
          const letra = LETRA_DE[simbolo]
          expect(letra, `${g.id}: ${simbolo} não tem letra dimensional`).toBeDefined()
          return `${letra}${expoente}`
        })
        .join('')

      expect(traduzida, g.nome).toBe(notacaoDimensional(g))
    }
  })

  it('os grupos de dimensão repetida são exatamente os conhecidos', () => {
    const porNotacao = new Map<string, string[]>()
    for (const g of GRANDEZAS) {
      const chave = notacaoDimensional(g)
      porNotacao.set(chave, [...(porNotacao.get(chave) ?? []), g.id])
    }

    const grupos = [...porNotacao.values()]
      .filter((ids) => ids.length > 1)
      .map((ids) => [...ids].sort())
      .sort((a, b) => (a[0] ?? '').localeCompare(b[0] ?? ''))

    const esperados = MESMA_DIMENSAO.map((ids) => [...ids].sort()).sort((a, b) =>
      (a[0] ?? '').localeCompare(b[0] ?? ''),
    )

    expect(grupos).toEqual(esperados)
  })
})

describe('distratores', () => {
  it('dão sempre pelo menos três opções, distintas e nunca a resposta certa', () => {
    for (const g of GRANDEZAS) {
      const errados = distratoresDimensionais(g)
      expect(errados.length, g.id).toBeGreaterThanOrEqual(3)
      expect(new Set(errados).size, g.id).toBe(errados.length)
      for (const d of errados) {
        expect(d, `${g.id}: ${d} é a resposta certa`).not.toBe(notacaoDimensional(g))
        expect(d, `${g.id}: ${d}`).toMatch(/^(?:[MLTIΘNJ](?:⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?)+$/u)
      }
    }
  })

  it('o primeiro é sempre o sinal trocado, que é o erro mais colável', () => {
    expect(distratoresDimensionais(acha('forca'))[0]).toBe('MLT²')
    expect(distratoresDimensionais(acha('energia'))[0]).toBe('ML²T²')
    expect(distratoresDimensionais(acha('pressao'))[0]).toBe('ML⁻¹T²')
    // Sem tempo na cadeia, troca-se o sinal da última base que existe.
    expect(distratoresDimensionais(acha('massa'))[0]).toBe('M⁻¹')
  })

  it('oferecem a grandeza vizinha — energia × potência, pressão × força', () => {
    // A dupla que o enunciado do jogo existe para separar: um T de diferença.
    expect(distratoresDimensionais(acha('energia'))).toContain(dimensaoDe('potencia'))
    expect(distratoresDimensionais(acha('potencia'))).toContain(dimensaoDe('energia'))
    // Força e pressão, a dois L de distância.
    expect(distratoresDimensionais(acha('pressao'))).toContain(dimensaoDe('forca'))
    expect(distratoresDimensionais(acha('forca'))).toContain(dimensaoDe('pressao'))
    // E a dupla de cinemática, que é a mesma armadilha no primeiro ano.
    expect(distratoresDimensionais(acha('velocidade'))).toContain(dimensaoDe('aceleracao'))
    expect(distratoresDimensionais(acha('aceleracao'))).toContain(dimensaoDe('velocidade'))
  })

  it('não oferecem a grandeza de dimensão idêntica como se fosse outra opção', () => {
    // Torque tem os expoentes da energia. Se o filtro de repetidos fosse por
    // expoente e não pela notação na tela, a carta do torque teria duas opções
    // certas — e a do gray teria a do sievert.
    for (const grupo of MESMA_DIMENSAO) {
      for (const id of grupo) {
        const errados = distratoresDimensionais(acha(id))
        for (const irmao of grupo) {
          if (irmao === id) continue
          expect(errados, `${id} × ${irmao}`).not.toContain(dimensaoDe(irmao))
        }
      }
    }
  })

  it('os três primeiros bastam: é o que o jogo usa', () => {
    // O jogo faz `slice(0, 3)`. Se a ordem de prioridade mudar, o que sobra na
    // tela muda junto — então a ordem é parte do dado, não detalhe.
    for (const g of GRANDEZAS) {
      const tres = distratoresDimensionais(g).slice(0, 3)
      expect(tres.length, g.id).toBe(3)
      expect(new Set([...tres, notacaoDimensional(g)]).size, g.id).toBe(4)
    }
  })
})
