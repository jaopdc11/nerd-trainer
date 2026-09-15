import { describe, expect, it } from 'vitest'
import { registrar } from './storage'
import type { Banco } from './storage'

const VAZIO: Banco = { versao: 1, entradas: {} }

/**
 * Regressão de um bug que congelava recordes.
 *
 * O `useSaveOnExit` grava a partida em andamento quando o jogador troca de aba
 * ou volta ao menu. Como ele usa o runId da partida, e a idempotência
 * descartava qualquer regravação daquele runId, uma partida salva pela metade e
 * depois terminada tinha o desfecho real jogado fora — o recorde ficava preso
 * no parcial.
 */
describe('partida salva no meio e depois terminada', () => {
  it('atualiza o recorde quando a mesma run termina com pontuação maior', () => {
    const runId = 'mesma-partida'

    // 1. Ele está jogando e chega em 20 casas. Troca de aba: useSaveOnExit
    //    grava o parcial com o runId da partida em andamento.
    const parcial = registrar(VAZIO, {
      jogoId: 'pi', pontuacao: 20, duracaoMs: 10_000, erros: 0, completou: false, runId,
    })
    expect(parcial.entrada.recorde.pontuacao).toBe(20)

    // 2. Volta, continua a MESMA partida, chega em 58 e erra.
    const fim = registrar(parcial.banco, {
      jogoId: 'pi', pontuacao: 58, duracaoMs: 40_000, erros: 1, completou: false, runId,
    })

    expect(fim.entrada.recorde.pontuacao, 'o recorde tem que virar 58').toBe(58)
    expect(fim.entrada.partidas, 'continua sendo UMA partida').toBe(1)
    expect(fim.entrada.historico).toHaveLength(1)
  })

  it('continua ignorando a mesma gravação repetida', () => {
    const runId = 'repetida'
    const um = registrar(VAZIO, {
      jogoId: 'pi', pontuacao: 30, duracaoMs: 9000, erros: 1, completou: false, runId,
    })
    const dois = registrar(um.banco, {
      jogoId: 'pi', pontuacao: 30, duracaoMs: 9000, erros: 1, completou: false, runId,
    })
    expect(dois.entrada.partidas).toBe(1)
    expect(dois.banco).toBe(um.banco)
  })
})
