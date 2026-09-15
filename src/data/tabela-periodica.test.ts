import { describe, expect, it } from 'vitest'
import { normalizarTexto } from '@/core/answer'
import { COLUNAS_GRADE, ELEMENTOS, LINHAS_GRADE } from './tabela-periodica'

describe('integridade do dataset', () => {
  it('tem 118 elementos com Z contíguo de 1 a 118', () => {
    expect(ELEMENTOS).toHaveLength(118)
    expect(ELEMENTOS.map((e) => e.z)).toEqual(Array.from({ length: 118 }, (_, i) => i + 1))
  })

  it('tem símbolos válidos e únicos', () => {
    for (const e of ELEMENTOS) {
      // Uma maiúscula seguida de até duas minúsculas. É a regra da IUPAC.
      expect(e.simbolo, `Z=${e.z}`).toMatch(/^[A-Z][a-z]{0,2}$/)
    }
    expect(new Set(ELEMENTOS.map((e) => e.simbolo)).size).toBe(118)
  })

  it('tem nomes únicos', () => {
    expect(new Set(ELEMENTOS.map((e) => e.nome)).size).toBe(118)
  })

  it('não tem duas células no mesmo lugar da grade', () => {
    const ocupadas = new Set<string>()
    for (const e of ELEMENTOS) {
      const chave = `${e.linha}:${e.coluna}`
      expect(ocupadas.has(chave), `${chave} ocupada duas vezes (Z=${e.z})`).toBe(false)
      ocupadas.add(chave)
    }
  })

  it('mantém toda célula dentro da grade declarada', () => {
    for (const e of ELEMENTOS) {
      expect(e.linha, `Z=${e.z}`).toBeGreaterThanOrEqual(1)
      expect(e.linha, `Z=${e.z}`).toBeLessThanOrEqual(LINHAS_GRADE)
      expect(e.coluna, `Z=${e.z}`).toBeGreaterThanOrEqual(1)
      expect(e.coluna, `Z=${e.z}`).toBeLessThanOrEqual(COLUNAS_GRADE)
    }
  })
})

describe('português do Brasil', () => {
  /**
   * A regressão mais provável deste dataset: alguém "corrige" um nome copiando
   * da Wikipédia lusófona ou de tradução automática, e entra pt-PT. A regra
   * mecânica é que o pt-BR usa -ônio/-ênio onde o pt-PT usa -ónio/-énio.
   */
  it('não deixa passar terminação em -ónio ou -énio', () => {
    for (const e of ELEMENTOS) {
      expect(e.nome, `Z=${e.z} (${e.nome})`).not.toMatch(/[óé]nio$/)
    }
  })

  it('usa a grafia brasileira nos casos clássicos', () => {
    const esperado: Record<number, string> = {
      7: 'Nitrogênio', // não Azoto
      8: 'Oxigênio', // não Oxigénio
      10: 'Neônio', // não Néon
      16: 'Enxofre', // não Sulfur
      18: 'Argônio', // não Árgon
      36: 'Criptônio', // não Krípton
      51: 'Antimônio', // não Antimónio
      54: 'Xenônio', // não Xénon
      74: 'Tungstênio', // não Wolfrâmio como primário
      86: 'Radônio', // não Rádon
      113: 'Nihônio',
      115: 'Moscóvio',
      117: 'Tenessino',
      118: 'Oganessônio',
    }
    for (const [z, nome] of Object.entries(esperado)) {
      expect(ELEMENTOS.find((e) => e.z === Number(z))?.nome, `Z=${z}`).toBe(nome)
    }
  })

  it('aceita o latim de onde veio o símbolo, mas não o inglês', () => {
    const sodio = ELEMENTOS.find((e) => e.z === 11)
    expect(sodio?.sinonimos).toContain('Natrium')
    // O jogo é em pt-BR: "Sodium" não conta.
    const todos = ELEMENTOS.flatMap((e) => e.sinonimos.map((s) => s.toLowerCase()))
    for (const ingles of ['sodium', 'potassium', 'iron', 'gold', 'silver', 'lead', 'tin']) {
      expect(todos, ingles).not.toContain(ingles)
    }
  })
})

describe('colisão de nomes', () => {
  /**
   * O par perigoso aqui é Índio (In) × Irídio (Ir), e Ítrio (Y) × Itérbio (Yb).
   * Se duas respostas normalizadas coincidirem, uma digitação passa a valer
   * para dois elementos e a grade preenche a célula errada.
   */
  it('nenhum elemento aceita o nome de outro', () => {
    const dono = new Map<string, number>()
    for (const e of ELEMENTOS) {
      for (const forma of new Set([e.nome, ...e.sinonimos].map((n) => normalizarTexto(n)))) {
        const anterior = dono.get(forma)
        expect(anterior, `"${forma}" serve para Z=${anterior} e Z=${e.z}`).toBeUndefined()
        dono.set(forma, e.z)
      }
    }
  })

  it('mantém Índio e Irídio distinguíveis mesmo sem acento', () => {
    const indio = normalizarTexto('Índio')
    const iridio = normalizarTexto('Irídio')
    expect(indio).not.toBe(iridio)
  })
})

describe('grupos, períodos e blocos', () => {
  it('põe lantanídeos e actinídeos nas faixas de baixo, sem grupo', () => {
    for (const e of ELEMENTOS) {
      const ehFaixa = (e.z >= 57 && e.z <= 71) || (e.z >= 89 && e.z <= 103)
      if (ehFaixa) {
        expect(e.grupo, `Z=${e.z}`).toBeNull()
        expect(e.bloco, `Z=${e.z}`).toBe('f')
        expect([9, 10], `Z=${e.z}`).toContain(e.linha)
      } else {
        expect(e.grupo, `Z=${e.z}`).not.toBeNull()
        expect(e.linha, `Z=${e.z}`).toBeLessThanOrEqual(7)
      }
    }
  })

  it('deixa o grupo 3 dos períodos 6 e 7 vazio — a convenção escolhida', () => {
    // La e Ac vão para as faixas; o grupo 3 fica vago nesses períodos. A IUPAC
    // deixa La vs Lu em aberto, então isto é decisão registrada, não descuido.
    const noGrupo3 = ELEMENTOS.filter((e) => e.grupo === 3 && e.periodo >= 6)
    expect(noGrupo3).toEqual([])
  })

  it('tem os 7 períodos e os 18 grupos ocupados', () => {
    expect(new Set(ELEMENTOS.map((e) => e.periodo))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]))
    const grupos = new Set(ELEMENTOS.map((e) => e.grupo).filter((g) => g !== null))
    expect(grupos.size).toBe(18)
  })

  it('classifica os gases nobres no grupo 18', () => {
    for (const z of [2, 10, 18, 36, 54, 86, 118]) {
      expect(ELEMENTOS.find((e) => e.z === z)?.grupo, `Z=${z}`).toBe(18)
    }
  })

  it('classifica os alcalinos no grupo 1 e os halogênios no 17', () => {
    for (const z of [3, 11, 19, 37, 55, 87]) {
      expect(ELEMENTOS.find((e) => e.z === z)?.grupo, `alcalino Z=${z}`).toBe(1)
    }
    for (const z of [9, 17, 35, 53, 85, 117]) {
      expect(ELEMENTOS.find((e) => e.z === z)?.grupo, `halogênio Z=${z}`).toBe(17)
    }
  })

  it('só marca bloco f nos lantanídeos e actinídeos', () => {
    const f = ELEMENTOS.filter((e) => e.bloco === 'f').map((e) => e.z)
    expect(f).toHaveLength(30)
    expect(Math.min(...f)).toBe(57)
  })
})
