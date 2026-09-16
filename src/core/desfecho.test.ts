import { describe, expect, it } from 'vitest'
import { desfecho, faltaParaRecorde, marcaAnterior } from './desfecho'
import type { ResultadoDaRun } from './desfecho'

const run = (recordeAnterior: number | null, superou: boolean): ResultadoDaRun => ({
  runId: 'r1',
  recordeAnterior,
  superou,
})

/**
 * O caso que a tela errava, e o motivo de tudo isto existir.
 *
 * Quando o fim é desenhado, a partida já foi gravada — `recordeAtual` vale o
 * que você acabou de fazer. Todo teste aqui passa esse valor contaminado de
 * propósito, porque é o que o componente recebe de verdade.
 */
describe('o recorde que a tela recebe já é o desta partida', () => {
  it('59 casas batendo um recorde de 58 é recorde novo, não empate', () => {
    expect(desfecho(59, run(58, true), 59)).toBe('superou')
  })

  it('e não inventa distância nenhuma', () => {
    expect(faltaParaRecorde(59, run(58, true), 59)).toBeNull()
  })

  it('21 acertos criando o recorde de 21 não "faltou 1"', () => {
    // O print original: "faltaram 1 para o seu recorde de 21", com 21 na tela.
    expect(desfecho(21, run(18, true), 21)).toBe('superou')
    expect(faltaParaRecorde(21, run(18, true), 21)).toBeNull()
  })

  it('a tela cita o recorde anterior, não o que acabou de nascer', () => {
    expect(marcaAnterior(run(18, true), 21)).toBe(18)
  })
})

describe('quem decide é a storage', () => {
  it('empate de pontos ainda pode ser recorde: o desempate é por tempo', () => {
    // 59 casas em 1:12 supera 59 casas em 2:00. Só `registrar` sabe disso, e
    // uma comparação refeita na tela diria "empatou".
    expect(desfecho(59, run(59, true), 59)).toBe('superou')
  })

  it('empate de verdade continua sendo empate', () => {
    expect(desfecho(59, run(59, false), 59)).toBe('empatou')
    expect(faltaParaRecorde(59, run(59, false), 59)).toBeNull()
  })

  it('ficar aquém mostra a distância até alcançar, sem o +1', () => {
    expect(desfecho(18, run(21, false), 21)).toBe('aquem')
    expect(faltaParaRecorde(18, run(21, false), 21)).toBe(3)
  })

  it('primeira partida com pontos é recorde', () => {
    expect(desfecho(7, run(null, true), 7)).toBe('superou')
  })

  it('zero nunca é recorde, mesmo sem recorde anterior', () => {
    expect(desfecho(0, run(null, false), 0)).toBe('aquem')
    expect(faltaParaRecorde(0, run(null, false), null)).toBeNull()
  })
})

describe('a mesma partida gravada mais de uma vez', () => {
  /*
   * Regressão do "141 países empatou o recorde". Desde que trocar de aba passou
   * a gravar o parcial, uma partida é gravada duas ou mais vezes. A segunda
   * gravação não pode refazer a foto do recorde, porque leria o que a primeira
   * acabou de criar.
   */
  it('o recorde anterior é o de antes da PARTIDA, não o de antes da gravação', () => {
    // Parcial de 141 já criou o recorde; o desfecho vem depois com os mesmos 141.
    const depoisDoParcial = run(43, true)
    expect(desfecho(141, depoisDoParcial, 141)).toBe('superou')
    expect(faltaParaRecorde(141, depoisDoParcial, 141)).toBeNull()
    expect(marcaAnterior(depoisDoParcial, 141)).toBe(43)
  })

  it('superou acumula: o parcial bateu, a gravação final devolve false', () => {
    // `registrar` diz false na segunda porque o recorde já é desta run — e a
    // partida bateu o recorde do mesmo jeito.
    const acumulado: ResultadoDaRun = { runId: 'r1', recordeAnterior: 43, superou: true }
    expect(desfecho(141, acumulado, 141)).toBe('superou')
  })
})

describe('sem run gravada ainda', () => {
  // Só acontece antes da primeira partida da sessão; aí o recorde atual ainda
  // não foi tocado por ela e a comparação ingênua é válida.
  it('cai na comparação com o recorde atual', () => {
    expect(desfecho(30, null, 20)).toBe('superou')
    expect(desfecho(20, null, 20)).toBe('empatou')
    expect(desfecho(10, null, 20)).toBe('aquem')
    expect(faltaParaRecorde(10, null, 20)).toBe(10)
    expect(marcaAnterior(null, 20)).toBe(20)
  })
})
