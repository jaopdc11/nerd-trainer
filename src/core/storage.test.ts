import { beforeEach, describe, expect, it } from 'vitest'
import {
  carregar,
  CHAVE,
  chaveRecorde,
  entradaDe,
  LIMITE_HISTORICO,
  registrar,
  VERSAO_ATUAL,
} from './storage'
import type { Banco } from './storage'
import type { ResultadoRun } from './types'

const VAZIO: Banco = { versao: VERSAO_ATUAL, entradas: {} }

function run(over: Partial<ResultadoRun> = {}): ResultadoRun {
  return {
    jogoId: 'pi',
    pontuacao: 100,
    duracaoMs: 60_000,
    erros: 1,
    completou: false,
    runId: crypto.randomUUID(),
    ...over,
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('chaveRecorde', () => {
  it('separa modos do mesmo jogo', () => {
    expect(chaveRecorde('pi')).toBe('pi')
    expect(chaveRecorde('tabela-periodica', 'simbolo')).toBe('tabela-periodica::simbolo')
  })
})

describe('registrar', () => {
  it('grava a primeira partida como recorde', () => {
    const { banco, recordeNovo } = registrar(VAZIO, run({ pontuacao: 42 }))
    expect(recordeNovo).toBe(true)
    expect(entradaDe(banco, 'pi')?.recorde.pontuacao).toBe(42)
  })

  it('só troca o recorde quando a pontuação supera', () => {
    let banco = registrar(VAZIO, run({ pontuacao: 42 })).banco
    const pior = registrar(banco, run({ pontuacao: 30 }))
    expect(pior.recordeNovo).toBe(false)
    expect(pior.entrada.recorde.pontuacao).toBe(42)
    expect(pior.entrada.ultimaPontuacao).toBe(30)

    banco = pior.banco
    const melhor = registrar(banco, run({ pontuacao: 50 }))
    expect(melhor.recordeNovo).toBe(true)
    expect(melhor.entrada.recorde.pontuacao).toBe(50)
  })

  it('desempata pontuação igual pelo menor tempo', () => {
    const banco = registrar(VAZIO, run({ pontuacao: 118, duracaoMs: 90_000 })).banco
    const rapido = registrar(banco, run({ pontuacao: 118, duracaoMs: 70_000 }))
    expect(rapido.recordeNovo).toBe(true)
    expect(rapido.entrada.recorde.duracaoMs).toBe(70_000)

    const lento = registrar(rapido.banco, run({ pontuacao: 118, duracaoMs: 80_000 }))
    expect(lento.recordeNovo).toBe(false)
    expect(lento.entrada.recorde.duracaoMs).toBe(70_000)
  })

  it('conta cada partida uma vez só, mesmo se gravada duas vezes', () => {
    const r = run({ pontuacao: 10 })
    const uma = registrar(VAZIO, r)
    const outra = registrar(uma.banco, r)
    expect(outra.entrada.partidas).toBe(1)
    expect(outra.banco).toBe(uma.banco)
  })

  it('mantém recordes de modos diferentes separados', () => {
    let banco = registrar(VAZIO, run({ jogoId: 'tp', modoId: 'nome', pontuacao: 50 })).banco
    banco = registrar(banco, run({ jogoId: 'tp', modoId: 'simbolo', pontuacao: 20 })).banco
    expect(entradaDe(banco, 'tp', 'nome')?.recorde.pontuacao).toBe(50)
    expect(entradaDe(banco, 'tp', 'simbolo')?.recorde.pontuacao).toBe(20)
  })
})

describe('histórico', () => {
  it('guarda toda partida, da mais recente para a mais antiga', () => {
    let banco = registrar(VAZIO, run({ pontuacao: 10 })).banco
    banco = registrar(banco, run({ pontuacao: 40 })).banco
    banco = registrar(banco, run({ pontuacao: 25 })).banco

    const historico = entradaDe(banco, 'pi')?.historico ?? []
    expect(historico.map((p) => p.pontuacao)).toEqual([25, 40, 10])
    expect(entradaDe(banco, 'pi')?.recorde.pontuacao).toBe(40)
  })

  it('não repete a partida quando o mesmo runId é gravado de novo', () => {
    const r = run({ pontuacao: 10 })
    const banco = registrar(registrar(VAZIO, r).banco, r).banco
    expect(entradaDe(banco, 'pi')?.historico).toHaveLength(1)
  })

  it('corta no teto, descartando as mais antigas', () => {
    let banco = VAZIO
    for (let i = 0; i < LIMITE_HISTORICO + 20; i++) {
      banco = registrar(banco, run({ pontuacao: i })).banco
    }
    const historico = entradaDe(banco, 'pi')?.historico ?? []
    expect(historico).toHaveLength(LIMITE_HISTORICO)
    // A mais recente é a última jogada; as primeiras caíram.
    expect(historico[0]?.pontuacao).toBe(LIMITE_HISTORICO + 19)
  })

  it('descarta partida corrompida sem perder o recorde', () => {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify({
        versao: VERSAO_ATUAL,
        entradas: {
          pi: {
            recorde: {
              pontuacao: 87,
              duracaoMs: 42_000,
              erros: 1,
              completou: false,
              emISO: '2026-09-15T00:00:00.000Z',
            },
            partidas: 2,
            ultimaPontuacao: 60,
            ultimaEmISO: '2026-09-15T00:00:00.000Z',
            historico: [
              { pontuacao: 60, duracaoMs: 30_000, erros: 1, emISO: '2026-09-15T00:00:00.000Z' },
              { pontuacao: 'lixo' },
            ],
            ultimosRuns: [],
          },
        },
      }),
    )

    const entrada = entradaDe(carregar(), 'pi')
    expect(entrada?.recorde.pontuacao).toBe(87)
    expect(entrada?.historico).toHaveLength(1)
  })
})

describe('carregar', () => {
  it('devolve banco vazio quando não há nada salvo', () => {
    expect(carregar().entradas).toEqual({})
  })

  it('descarta só a entrada corrompida, preservando as boas', () => {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify({
        versao: VERSAO_ATUAL,
        entradas: {
          pi: {
            recorde: {
              pontuacao: 87,
              duracaoMs: 42_000,
              erros: 1,
              completou: false,
              emISO: '2026-09-15T00:00:00.000Z',
            },
            partidas: 3,
            ultimaPontuacao: 60,
            ultimaEmISO: '2026-09-15T00:00:00.000Z',
            ultimosRuns: [],
          },
          quebrado: { recorde: { pontuacao: 'muitos' } },
        },
      }),
    )

    const banco = carregar()
    expect(banco.entradas.pi?.recorde.pontuacao).toBe(87)
    expect(banco.entradas.quebrado).toBeUndefined()
  })

  it('não explode com JSON inválido', () => {
    window.localStorage.setItem(CHAVE, '{ isso não é json')
    expect(carregar().entradas).toEqual({})
  })
})
