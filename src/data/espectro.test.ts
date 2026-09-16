import { describe, expect, it } from 'vitest'
import { CORES_VISIVEL, ESCADA, ESCADA_NM, FAIXAS, FRONTEIRAS_NM } from './espectro'

/**
 * O gabarito deste dataset foi conferido número a número contra o diagrama
 * clássico do espectro. Os testes abaixo não conferem de novo — conferir valor
 * contra valor seria copiar o dataset e chamar de teste. O que eles verificam é
 * a estrutura: que as faixas fecham, que a escada desce e que ninguém
 * "corrigiu" um limite sem mexer no vizinho.
 */

describe('as sete faixas', () => {
  it('são sete, na ordem canônica do maior comprimento para o menor', () => {
    expect(FAIXAS.map((f) => f.id)).toEqual([
      'radio',
      'micro-ondas',
      'infravermelho',
      'visivel',
      'ultravioleta',
      'raios-x',
      'raios-gama',
    ])
  })

  /**
   * O invariante central do arquivo: sem buraco e sem sobreposição.
   *
   * É o teste que justifica guardar tudo em nanômetros. Com unidade por faixa
   * esta linha seria uma conversão, e conversão é onde o fator de dez se perde.
   */
  it('não deixa buraco nem sobreposição entre faixas vizinhas', () => {
    for (let i = 0; i < FAIXAS.length - 1; i++) {
      const atual = FAIXAS[i] as (typeof FAIXAS)[number]
      const proxima = FAIXAS[i + 1] as (typeof FAIXAS)[number]
      expect(atual.menorNm, `${atual.nome} → ${proxima.nome}`).toBe(proxima.maiorNm)
      expect(atual.menorNm, `${atual.nome} não tem limite inferior`).not.toBeNull()
    }
  })

  it('só deixa aberta a ponta do rádio e a ponta do gama', () => {
    // Rádio não tem teto (onda de 100 km existe) e gama não tem piso. Qualquer
    // outro `null` seria um limite que alguém esqueceu de preencher.
    const abertos = FAIXAS.flatMap((f) => [
      ...(f.maiorNm === null ? [`${f.id}:maior`] : []),
      ...(f.menorNm === null ? [`${f.id}:menor`] : []),
    ])
    expect(abertos).toEqual(['radio:maior', 'raios-gama:menor'])
  })

  it('mantém cada faixa com o limite maior de fato maior que o menor', () => {
    for (const f of FAIXAS) {
      if (f.maiorNm === null || f.menorNm === null) continue
      expect(f.maiorNm, f.nome).toBeGreaterThan(f.menorNm)
    }
  })

  it('confere à mão os limites que a escola cobra', () => {
    // As quatro linhas que um erro de digitação estragaria sem quebrar nenhum
    // dos testes estruturais acima — porque um par de vizinhos errado *junto*
    // continua contíguo.
    const por = (id: string) => FAIXAS.find((f) => f.id === id)
    expect(por('micro-ondas')?.maiorNm).toBe(1_000_000_000) // 1 m
    expect(por('micro-ondas')?.menorNm).toBe(1_000_000) // 1 mm
    expect(por('visivel')?.maiorNm).toBe(750)
    expect(por('visivel')?.menorNm).toBe(380)
    expect(por('ultravioleta')?.menorNm).toBe(10)
  })

  it('marca como didática só a fronteira entre raios X e gama', () => {
    // X e gama se separam pela origem, não pelo comprimento de onda. Se um dia
    // outra faixa ganhar essa marca, foi decisão de alguém e não descuido.
    expect(FAIXAS.filter((f) => f.fronteiraDidatica).map((f) => f.id)).toEqual(['raios-x'])
  })
})

describe('as sete cores do visível', () => {
  it('são as sete de Newton, do vermelho ao violeta', () => {
    expect(CORES_VISIVEL.map((c) => c.nome)).toEqual([
      'Vermelho',
      'Laranja',
      'Amarelo',
      'Verde',
      'Azul',
      'Anil',
      'Violeta',
    ])
  })

  it('não deixa buraco nem sobreposição entre cores vizinhas', () => {
    for (let i = 0; i < CORES_VISIVEL.length - 1; i++) {
      const atual = CORES_VISIVEL[i] as (typeof CORES_VISIVEL)[number]
      const proxima = CORES_VISIVEL[i + 1] as (typeof CORES_VISIVEL)[number]
      expect(atual.menorNm, `${atual.nome} → ${proxima.nome}`).toBe(proxima.maiorNm)
    }
  })

  /**
   * A armadilha que motivou este teste: adotar 400–700 para o visível e manter
   * a tabela de cores em 380–750 cria 50 nm em que o vermelho e o infravermelho
   * coexistem. Aqui as duas tabelas são obrigadas a concordar.
   */
  it('cobre exatamente a faixa do visível, sem sobrar nem faltar', () => {
    const visivel = FAIXAS.find((f) => f.id === 'visivel')
    expect(CORES_VISIVEL[0]?.maiorNm).toBe(visivel?.maiorNm)
    expect(CORES_VISIVEL[CORES_VISIVEL.length - 1]?.menorNm).toBe(visivel?.menorNm)
  })
})

describe('a escada de fronteiras', () => {
  it('desce sem repetir', () => {
    for (let i = 0; i < FRONTEIRAS_NM.length - 1; i++) {
      expect(FRONTEIRAS_NM[i] as number).toBeGreaterThan(FRONTEIRAS_NM[i + 1] as number)
    }
  })

  it('tem 11 degraus jogáveis e todos são inteiros positivos', () => {
    expect(ESCADA_NM).toHaveLength(11)
    for (const n of ESCADA_NM) {
      expect(Number.isInteger(n), String(n)).toBe(true)
      expect(n).toBeGreaterThan(0)
    }
  })

  it('é exatamente a escada conferida à mão', () => {
    // Único teste que repete o dataset, e de propósito: é o gabarito do jogo.
    // Se esta lista mudar, mudou o que a partida cobra — tem que doer.
    expect(ESCADA).toEqual([
      '1000000000', // 1 m — rádio | micro-ondas
      '1000000', // 1 mm — micro-ondas | infravermelho
      '750', // infravermelho | vermelho
      '620', // vermelho | laranja
      '590', // laranja | amarelo
      '570', // amarelo | verde
      '495', // verde | azul
      '450', // azul | anil
      '425', // anil | violeta
      '380', // violeta | ultravioleta
      '10', // ultravioleta | raios X
    ])
  })

  it('deixa de fora só a fronteira fracionária entre X e gama', () => {
    const fora = FRONTEIRAS_NM.filter((n) => !ESCADA_NM.includes(n))
    expect(fora).toEqual([0.01])
  })

  it('não perde nenhuma fronteira das faixas nem das cores', () => {
    const esperadas = new Set(
      [
        ...FAIXAS.flatMap((f) => [f.maiorNm, f.menorNm]),
        ...CORES_VISIVEL.flatMap((c) => [c.maiorNm, c.menorNm]),
      ].filter((n): n is number => n !== null),
    )
    expect(new Set(FRONTEIRAS_NM)).toEqual(esperadas)
  })
})
