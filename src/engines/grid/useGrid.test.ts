import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { registrar } from '@/core/storage'
import type { Banco } from '@/core/storage'
import type { CelulaGrade, ConfigGrade, ResultadoRun } from '@/core/types'
import { tabelaPeriodica } from '@/games/tabela-periodica'
import { esconderAba, voltarParaAba } from '../trocaDeAba.testing'
import { useGrid } from './useGrid'

type Parcial = Omit<ResultadoRun, 'jogoId' | 'modoId'>

function montar() {
  const aoFinalizar = vi.fn<(r: Parcial) => void>()
  const config = tabelaPeriodica.config()
  const hook = renderHook(() => useGrid(config, aoFinalizar))
  act(() => {
    hook.result.current.iniciar()
  })
  return { hook, aoFinalizar, config }
}

const responder = (hook: ReturnType<typeof montar>['hook'], texto: string) => {
  let veredito = ''
  act(() => {
    veredito = hook.result.current.responder(texto)
  })
  return veredito
}

describe('preenchimento em ordem livre', () => {
  it('faz a resposta cair na célula certa, em qualquer ordem', () => {
    const { hook } = montar()

    responder(hook, 'ouro')
    responder(hook, 'hidrogênio')
    responder(hook, 'OGANESSÔNIO')

    const p = hook.result.current.preenchidas
    expect(p.get('z79')).toBe('Au')
    expect(p.get('z1')).toBe('H')
    expect(p.get('z118')).toBe('Og')
    expect(hook.result.current.acertos).toBe(3)
  })

  it('aceita sem acento e aceita o nome em latim', () => {
    const { hook } = montar()
    expect(responder(hook, 'nitrogenio')).not.toBe('errado')
    expect(responder(hook, 'Natrium')).not.toBe('errado')
    expect(hook.result.current.preenchidas.get('z7')).toBe('N')
    expect(hook.result.current.preenchidas.get('z11')).toBe('Na')
  })

  it('não preenche duas vezes a mesma célula, e não cobra erro por isso', () => {
    // Repetir o que já se acertou não é chutar errado. Num mapa de 195 células
    // com o relógio correndo, cobrar erro por isso pune a memória ruim do
    // jogador sobre o que ele já disse, que não é o que o jogo mede.
    const { hook } = montar()
    responder(hook, 'ferro')
    expect(responder(hook, 'ferro')).toBe('errado')
    expect(hook.result.current.acertos).toBe(1)
    expect(hook.result.current.erros).toBe(0)
    expect(hook.result.current.aviso).toEqual({ tipo: 'repetido', texto: 'Fe você já acertou' })
  })

  it('conta erro quando o nome não existe, e diz que não existe', () => {
    const { hook } = montar()
    expect(responder(hook, 'kriptonita')).toBe('errado')
    expect(hook.result.current.acertos).toBe(0)
    expect(hook.result.current.erros).toBe(1)
    expect(hook.result.current.aviso?.tipo).toBe('desconhecido')
  })

  it('o aviso some na tentativa seguinte', () => {
    const { hook } = montar()
    responder(hook, 'kriptonita')
    expect(hook.result.current.aviso).not.toBeNull()
    responder(hook, 'ferro')
    expect(hook.result.current.aviso).toBeNull()
  })

  it('não deixa um erro de digitação cair na célula de outro elemento', () => {
    const { hook } = montar()
    // "cobra" fica a um caractere de "cobre"; mas é curto demais para a
    // tolerância, e "cobalto" está por perto no baralho.
    expect(responder(hook, 'cobra')).toBe('errado')
    expect(hook.result.current.preenchidas.get('z29')).toBeUndefined()
    expect(hook.result.current.preenchidas.get('z27')).toBeUndefined()
  })
})

describe('encerramento', () => {
  it('desistir grava o parcial e lista o que faltou', () => {
    const { hook, aoFinalizar } = montar()
    responder(hook, 'ouro')
    responder(hook, 'prata')

    act(() => {
      hook.result.current.encerrar()
    })

    expect(hook.result.current.estado).toBe('fim')
    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({
      pontuacao: 2,
      total: 118,
      completou: false,
    })
    expect(hook.result.current.faltaram).toHaveLength(116)
  })

  it('não grava duas vezes se encerrar for chamado de novo', () => {
    const { hook, aoFinalizar } = montar()
    act(() => {
      hook.result.current.encerrar()
    })
    act(() => {
      hook.result.current.encerrar()
    })
    expect(aoFinalizar).toHaveBeenCalledOnce()
  })
})

/** Grade mínima e cronometrada, para o relógio não depender de um jogo real. */
function celula(id: string, nome: string, linha: number): CelulaGrade {
  return {
    id,
    linha,
    coluna: 1,
    resposta: { tipo: 'texto', canonica: nome, aceitas: [nome] },
    gabarito: nome,
  }
}

const CRONOMETRADA: ConfigGrade = {
  linhas: 3,
  colunas: 1,
  celulas: [celula('a', 'alfa', 1), celula('b', 'beta', 2), celula('c', 'gama', 3)],
  teclado: 'texto',
  ordem: 'livre',
  limiteSegundos: 600,
}

describe('trocar de aba no meio da partida', () => {
  it('grava o parcial sem encerrar a partida', () => {
    const { hook, aoFinalizar } = montar()
    responder(hook, 'ouro')
    responder(hook, 'prata')

    esconderAba()

    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 2, completou: false })
    // O ponto do bug: continuava jogando, e não é para a grade congelar.
    expect(hook.result.current.estado).toBe('jogando')
    expect(hook.result.current.acertos).toBe(2)
    expect(hook.result.current.faltaram).toEqual([])

    voltarParaAba()
    expect(responder(hook, 'ferro')).not.toBe('errado')
    expect(hook.result.current.acertos).toBe(3)
  })

  it('não para o relógio da partida cronometrada', () => {
    const aoFinalizar = vi.fn<(r: Parcial) => void>()
    const hook = renderHook(() => useGrid(CRONOMETRADA, aoFinalizar))
    act(() => {
      hook.result.current.iniciar()
    })
    act(() => {
      hook.result.current.responder('alfa')
    })

    esconderAba()

    // O relógio não pausa ao perder o foco — é decisão de design do `useClock`.
    // O que não pode é a partida acabar sozinha.
    expect(hook.result.current.estado).toBe('jogando')
    expect(hook.result.current.restanteMs).toBeGreaterThan(0)
    expect(aoFinalizar).toHaveBeenCalledOnce()
  })

  it('voltar e terminar com pontuação maior grava o desfecho real', () => {
    const { hook, aoFinalizar } = montar()
    responder(hook, 'ouro')
    esconderAba()
    voltarParaAba()

    responder(hook, 'prata')
    responder(hook, 'ferro')
    act(() => {
      hook.result.current.encerrar()
    })

    const [parcial, fim] = aoFinalizar.mock.calls.map((c) => c[0]) as [Parcial, Parcial]
    expect(parcial.pontuacao).toBe(1)
    expect(fim.pontuacao).toBe(3)
    expect(fim.runId).toBe(parcial.runId)

    const vazio: Banco = { versao: 1, entradas: {} }
    const um = registrar(vazio, { ...parcial, jogoId: 'tabela-periodica' })
    const dois = registrar(um.banco, { ...fim, jogoId: 'tabela-periodica' })
    expect(dois.entrada.recorde.pontuacao, 'o desfecho não pode ser engolido').toBe(3)
    expect(dois.entrada.partidas, 'continua sendo UMA partida').toBe(1)
  })

  it('desmontar a tela grava o parcial', () => {
    const { hook, aoFinalizar } = montar()
    responder(hook, 'ouro')
    responder(hook, 'prata')

    hook.unmount()

    expect(aoFinalizar).toHaveBeenCalledOnce()
    expect(aoFinalizar.mock.calls[0]?.[0]).toMatchObject({ pontuacao: 2, completou: false })
  })
})
