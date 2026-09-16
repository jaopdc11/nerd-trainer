import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro } from '@/core/answer'
import { PRESIDENTES, anoDe, exibirMandato } from './presidentes'

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

  it('começa em Vargas e termina em quem está no cargo', () => {
    expect(PRESIDENTES[0]?.id).toBe('vargas-1')
    expect(PRESIDENTES.at(-1)?.fim).toBeNull()
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
      expect(anoDe(p.inicio), p.id).toBeGreaterThanOrEqual(1930)
      expect(anoDe(p.inicio), p.id).toBeLessThanOrEqual(2026)
    }
  })

  /** O teste que o recorte de 1930 pede: a ordem declarada tem de ser a ordem real. */
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
   * entra, é sucessão; quando há dias no meio, houve um interino — e ele tem de
   * estar declarado.
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

  it('as cinco lacunas são as conhecidas', () => {
    const comLacuna = PRESIDENTES.filter((p) => p.noIntervalo !== undefined).map((p) => p.id)
    expect(comLacuna).toEqual(['vargas-1', 'cafe-filho', 'janio', 'jango', 'costa-e-silva'])
  })

  it('âncoras conferidas à mão', () => {
    const acha = (id: string) => PRESIDENTES.find((p) => p.id === id)
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
   * sequência.
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
   * no lugar do outro — e o jogo estaria ensinando a ordem errada. Medido, não
   * temido: a lista passa longe disso, e este teste é o que segura assim.
   */
  it('nenhuma forma aceita encosta na de outro presidente', () => {
    const formas: { chave: string; id: string; nome: string }[] = []
    for (const p of PRESIDENTES) {
      for (const aceita of p.aceitas) formas.push({ chave: chaveDeTexto(aceita), id: p.id, nome: p.nome })
    }

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

describe('exibição', () => {
  it('mostra o período com travessão, e em aberto quando é o atual', () => {
    expect(exibirMandato(PRESIDENTES[0] as (typeof PRESIDENTES)[number])).toBe('1930–1945')
    expect(exibirMandato(PRESIDENTES.at(-1) as (typeof PRESIDENTES)[number])).toBe('2023–')
  })

  it('anoDe não depende de fuso: é fatia de string, não Date', () => {
    expect(anoDe('1961-01-31')).toBe(1961)
    expect(anoDe('2003-01-01')).toBe(2003)
  })
})
