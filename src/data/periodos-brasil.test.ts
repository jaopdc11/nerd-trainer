import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro } from '@/core/answer'
import { PERIODOS, exibirPeriodo } from './periodos-brasil'

describe('dataset', () => {
  it('tem os onze períodos, sem id nem nome repetido', () => {
    expect(PERIODOS).toHaveLength(11)
    expect(new Set(PERIODOS.map((p) => p.id)).size).toBe(11)
    expect(new Set(PERIODOS.map((p) => p.nome)).size).toBe(11)
  })

  it('a lista é a canônica, na ordem canônica', () => {
    expect(PERIODOS.map((p) => p.id)).toEqual([
      'pre-cabralino',
      'colonia',
      'reino-unido',
      'primeiro-reinado',
      'regencia',
      'segundo-reinado',
      'republica-velha',
      'era-vargas',
      'republica-46',
      'ditadura-militar',
      'nova-republica',
    ])
  })

  /**
   * O teste que dá sentido ao dataset inteiro.
   *
   * Periodização é uma partição do tempo: cada período começa exatamente onde o
   * anterior acabou. Um buraco significaria um intervalo da história do Brasil
   * que não pertence a época nenhuma; uma sobreposição significaria dois nomes
   * para o mesmo ano, e aí a pergunta "qual vem depois" não teria resposta.
   * Ambas as coisas são erros de digitação fáceis de cometer e impossíveis de
   * enxergar lendo a lista.
   */
  it('não há buraco nem sobreposição entre períodos vizinhos', () => {
    for (let i = 0; i < PERIODOS.length - 1; i++) {
      const atual = PERIODOS[i]
      const proximo = PERIODOS[i + 1]
      expect(
        atual?.fim,
        `${atual?.id} termina em ${atual?.fim} e ${proximo?.id} começa em ${proximo?.inicio}`,
      ).toBe(proximo?.inicio)
    }
  })

  it('cada período dura pelo menos um ano e anda para a frente', () => {
    for (const p of PERIODOS) {
      if (p.inicio === null || p.fim === null) continue
      expect(p.fim, p.id).toBeGreaterThan(p.inicio)
    }
  })

  /**
   * As duas pontas abertas são exatamente duas, e são as previstas: sem marco
   * inicial no pré-cabralino, sem fim na Nova República. Qualquer outro `null`
   * seria dado faltando se passando por decisão.
   */
  it('só as duas pontas ficam abertas', () => {
    const semInicio = PERIODOS.filter((p) => p.inicio === null).map((p) => p.id)
    const semFim = PERIODOS.filter((p) => p.fim === null).map((p) => p.id)
    expect(semInicio).toEqual(['pre-cabralino'])
    expect(semFim).toEqual(['nova-republica'])
  })

  it('âncoras conferidas à mão', () => {
    const acha = (id: string) => PERIODOS.find((p) => p.id === id)
    expect(acha('colonia')?.inicio).toBe(1500)
    // A escolha discutível do dataset, fixada aqui para não mudar sem querer.
    expect(acha('colonia')?.fim).toBe(1815)
    expect(acha('primeiro-reinado')?.inicio).toBe(1822)
    expect(acha('regencia')?.inicio).toBe(1831)
    expect(acha('segundo-reinado')?.inicio).toBe(1840)
    expect(acha('republica-velha')?.inicio).toBe(1889)
    expect(acha('era-vargas')?.inicio).toBe(1930)
    expect(acha('republica-46')?.inicio).toBe(1945)
    expect(acha('ditadura-militar')?.inicio).toBe(1964)
    expect(acha('nova-republica')?.inicio).toBe(1985)
  })

  it('a primeira forma aceita é sempre o nome que aparece na fita', () => {
    for (const p of PERIODOS) expect(p.aceitas[0], p.id).toBe(p.nome)
  })

  it('todo período diz qual acontecimento o abre', () => {
    for (const p of PERIODOS) expect(p.marco.length, p.id).toBeGreaterThan(10)
  })

  /**
   * "Estado Novo" não pode valer como Era Vargas: é uma fase de dentro, e
   * aceitá-la ensinaria que o período começa em 1937.
   */
  it('não aceita uma fase interna no lugar do período', () => {
    const vargas = PERIODOS.find((p) => p.id === 'era-vargas')
    expect(vargas?.aceitas.map((a) => chaveDeTexto(a))).not.toContain('estadonovo')
  })

  /**
   * A medição que derrubou três sinônimos, e o motivo de ela ser um teste e não
   * uma nota de rodapé.
   *
   * Na mecânica de sequência não existe trava de vizinhança: a engine compara a
   * resposta com **um** item esperado e mais nada. Então duas respostas a um
   * erro de digitação de distância significam que digitar o nome de um período
   * pontua no lugar do outro. Foi o que aconteceu com "1º Reinado" contra "2º
   * Reinado" (a normalização apaga o indicador de ordinal e sobra "1reinado"
   * contra "2reinado", distância 1) e com "Quarta República" contra "Quinta
   * República", distância 2 num limite de 2. Os três saíram do dataset.
   */
  it('nenhuma forma aceita encosta na de outro período', () => {
    const formas = PERIODOS.flatMap((p) =>
      p.aceitas.map((a) => ({ chave: chaveDeTexto(a), id: p.id })),
    )

    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i]
        const b = formas[j]
        if (!a || !b || a.id === b.id) continue
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
  it('abre as pontas em vez de inventar data', () => {
    expect(exibirPeriodo(PERIODOS[0] as (typeof PERIODOS)[number])).toBe('até 1500')
    expect(exibirPeriodo(PERIODOS.at(-1) as (typeof PERIODOS)[number])).toBe('1985 até hoje')
  })

  it('usa travessão no período fechado', () => {
    expect(exibirPeriodo(PERIODOS[3] as (typeof PERIODOS)[number])).toBe('1822–1831')
  })
})
