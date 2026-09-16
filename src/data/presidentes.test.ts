import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro } from '@/core/answer'
import { FIM_DA_REPUBLICA_VELHA, PRESIDENTES, anoDe, exibirMandato } from './presidentes'

/**
 * O dataset é a única fonte da ordem do jogo, e num jogo de morte súbita um
 * nome fora de lugar mata o jogador por um erro que é do app. Por isso aqui a
 * checagem é redundante de propósito: a ordem é conferida contra as datas, e as
 * datas são conferidas contra âncoras escritas à mão.
 */
describe('dataset', () => {
  it('não tem id repetido', () => {
    const ids = PRESIDENTES.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('começa na Proclamação e termina em quem está no cargo', () => {
    expect(PRESIDENTES[0]?.id).toBe('deodoro')
    expect(PRESIDENTES[0]?.inicio).toBe('1889-11-15')
    expect(PRESIDENTES.at(-1)?.fim).toBeNull()
  })

  it('são 34 mandatos', () => {
    // Número escrito à mão de propósito: se a lista mudar de tamanho, que seja
    // por decisão, e a decisão passa por aqui e pela meta do Nerdômetro.
    expect(PRESIDENTES).toHaveLength(34)
  })

  it('só o último mandato está em aberto', () => {
    const abertos = PRESIDENTES.filter((p) => p.fim === null)
    expect(abertos).toHaveLength(1)
    expect(abertos[0]?.id).toBe(PRESIDENTES.at(-1)?.id)
  })

  it('toda data é ISO e plausível', () => {
    for (const p of PRESIDENTES) {
      expect(p.inicio, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      if (p.fim !== null) expect(p.fim, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(anoDe(p.inicio), p.id).toBeGreaterThanOrEqual(1889)
      expect(anoDe(p.inicio), p.id).toBeLessThanOrEqual(2026)
    }
  })

  /** A ordem declarada tem de ser a ordem real, e quem manda é a data. */
  it('a ordem da lista é a ordem das posses', () => {
    for (let i = 1; i < PRESIDENTES.length; i++) {
      const anterior = PRESIDENTES[i - 1]
      const atual = PRESIDENTES[i]
      expect(
        atual?.inicio.localeCompare(anterior?.inicio ?? ''),
        `${anterior?.id} deveria vir antes de ${atual?.id}`,
      ).toBeGreaterThan(0)
    }
  })

  it('ninguém sai antes de entrar', () => {
    for (const p of PRESIDENTES) {
      if (p.fim === null) continue
      expect(p.fim.localeCompare(p.inicio), p.id).toBeGreaterThan(0)
    }
  })

  /**
   * Dois mandatos nunca se sobrepõem: quando um sai no mesmo dia em que o outro
   * entra, é sucessão; quando há dias no meio, houve junta ou interino — e ele
   * tem de estar declarado.
   *
   * A equivalência vale nos dois sentidos, e o sentido inverso é o que importa
   * mais: um `noIntervalo` sobrando significa que alguém apagou uma lacuna
   * mexendo numa data, e a lista passaria a mentir em silêncio.
   */
  it('não há sobreposição, e toda lacuna tem interino declarado', () => {
    for (let i = 0; i < PRESIDENTES.length - 1; i++) {
      const atual = PRESIDENTES[i]
      const proximo = PRESIDENTES[i + 1]
      const fim = atual?.fim ?? ''
      const inicio = proximo?.inicio ?? ''
      expect(fim.localeCompare(inicio), `${atual?.id} invade o mandato seguinte`)
        .toBeLessThanOrEqual(0)

      const temLacuna = fim !== inicio
      expect(
        atual?.noIntervalo !== undefined,
        temLacuna
          ? `há dias entre ${atual?.id} e ${proximo?.id} sem interino declarado`
          : `${atual?.id} declara interino, mas entrega o cargo direto a ${proximo?.id}`,
      ).toBe(temLacuna)
    }
  })

  /**
   * As seis lacunas são as seis exclusões declaradas: as duas juntas e os
   * quatro que substituíram por pouco tempo. Esta lista é o contrato do
   * recorte — se ela crescer, entrou buraco novo; se encolher, alguém promoveu
   * um interino a titular sem dizer.
   */
  it('as seis lacunas são as conhecidas', () => {
    const comLacuna = PRESIDENTES.filter((p) => p.noIntervalo !== undefined)
    expect(comLacuna.map((p) => p.id)).toEqual([
      'washington-luis',
      'vargas-1',
      'cafe-filho',
      'janio',
      'jango',
      'costa-e-silva',
    ])
    // As duas juntas estão nomeadas, e não escondidas atrás de "outros".
    const juntas = comLacuna.filter((p) => p.noIntervalo?.includes('Junta'))
    expect(juntas.map((p) => p.id)).toEqual(['washington-luis', 'costa-e-silva'])
  })

  it('nenhum dos excluídos virou item da lista', () => {
    const nomes = PRESIDENTES.map((p) => p.nome)
    for (const fora of ['Carlos Luz', 'Nereu Ramos', 'Ranieri Mazzilli', 'José Linhares', 'Junta']) {
      expect(nomes, fora).not.toContain(fora)
    }
  })

  it('âncoras conferidas à mão', () => {
    const acha = (id: string) => PRESIDENTES.find((p) => p.id === id)
    expect(acha('deodoro')?.fim).toBe('1891-11-23')
    expect(acha('floriano')?.inicio).toBe('1891-11-23')
    expect(acha('afonso-pena')?.fim).toBe('1909-06-14')
    expect(acha('delfim-moreira')?.inicio).toBe('1918-11-15')
    expect(acha('washington-luis')?.fim).toBe('1930-10-24')
    expect(acha('vargas-1')?.inicio).toBe('1930-11-03')
    expect(acha('vargas-2')?.fim).toBe('1954-08-24')
    expect(acha('jk')?.inicio).toBe('1956-01-31')
    expect(acha('jango')?.fim).toBe('1964-04-01')
    expect(acha('figueiredo')?.fim).toBe('1985-03-15')
    expect(acha('sarney')?.inicio).toBe('1985-03-15')
    expect(acha('fhc')?.inicio).toBe('1995-01-01')
    expect(acha('lula-2')?.inicio).toBe('2023-01-01')
  })

  /**
   * A regra declarada no topo: a unidade é o mandato, e só Vargas e Lula voltam.
   * Se um terceiro nome aparecesse duas vezes, ou seria erro de digitação ou
   * seria uma reeleição virando duas linhas — e as duas coisas quebram a
   * sequência. Deodoro e Hermes da Fonseca são dois homens, não uma repetição.
   */
  it('só Vargas e Lula aparecem duas vezes', () => {
    const contagem = new Map<string, number>()
    for (const p of PRESIDENTES) contagem.set(p.nome, (contagem.get(p.nome) ?? 0) + 1)
    const repetidos = [...contagem].filter(([, n]) => n > 1).map(([nome]) => nome)
    expect(repetidos.sort()).toEqual(['Getúlio Vargas', 'Lula'])
  })

  it('nome repetido é sempre a mesma pessoa', () => {
    const completoPorNome = new Map<string, string>()
    for (const p of PRESIDENTES) {
      const anterior = completoPorNome.get(p.nome)
      if (anterior !== undefined) expect(p.completo, p.id).toBe(anterior)
      completoPorNome.set(p.nome, p.completo)
    }
  })

  it('a primeira forma aceita é sempre o nome que aparece na fita', () => {
    for (const p of PRESIDENTES) expect(p.aceitas[0], p.id).toBe(p.nome)
  })

  /**
   * Na sequência não existe trava de vizinhança: a engine compara a resposta
   * com **um** item esperado e mais nada. Então, se dois presidentes ficassem a
   * um erro de digitação de distância, digitar o nome de um poderia valer ponto
   * no lugar do outro — e o jogo estaria ensinando a ordem errada.
   *
   * Com a lista de 1889 o risco deixou de ser teórico: entraram dois marechais
   * Fonseca (Deodoro e Hermes) e um bando de sobrenomes de República Velha.
   * Medido, não temido.
   */
  it('nenhuma forma aceita encosta na de outro presidente', () => {
    const formas = PRESIDENTES.flatMap((p) =>
      p.aceitas.map((a) => ({ chave: chaveDeTexto(a), id: p.id, nome: p.nome })),
    )

    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i]
        const b = formas[j]
        // Vargas contra Vargas e Lula contra Lula não são colisão: é a mesma
        // resposta na mesma lista, de propósito.
        if (!a || !b || a.nome === b.nome) continue
        const limite = Math.max(limiteDeErro(a.chave.length), limiteDeErro(b.chave.length))
        expect(
          distancia(a.chave, b.chave, limite),
          `"${a.chave}" (${a.id}) e "${b.chave}" (${b.id}) estão perto demais`,
        ).toBeGreaterThan(limite)
      }
    }
  })
})

describe('a fronteira da República Velha', () => {
  /**
   * É a conta da meta do Nerdômetro e o argumento do jogo inteiro, então é
   * derivada da lista e testada, nunca escrita à mão.
   */
  it('são treze itens, de Deodoro a Washington Luís', () => {
    expect(FIM_DA_REPUBLICA_VELHA).toBe(13)
    expect(PRESIDENTES[FIM_DA_REPUBLICA_VELHA - 1]?.id).toBe('washington-luis')
    expect(PRESIDENTES[FIM_DA_REPUBLICA_VELHA]?.id).toBe('vargas-1')
  })

  it('e todos eles são anteriores a 1930', () => {
    for (const p of PRESIDENTES.slice(0, FIM_DA_REPUBLICA_VELHA)) {
      expect(anoDe(p.inicio), p.id).toBeLessThan(1930)
    }
  })
})

describe('exibição', () => {
  it('mostra o período com travessão, e em aberto quando é o atual', () => {
    expect(exibirMandato(PRESIDENTES[0] as (typeof PRESIDENTES)[number])).toBe('1889–1891')
    expect(exibirMandato(PRESIDENTES.at(-1) as (typeof PRESIDENTES)[number])).toBe('2023–')
  })

  it('anoDe não depende de fuso: é fatia de string, não Date', () => {
    expect(anoDe('1961-01-31')).toBe(1961)
    expect(anoDe('2003-01-01')).toBe(2003)
  })
})
