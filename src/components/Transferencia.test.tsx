import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportarJSON, VERSAO_ATUAL } from '@/core/storage'
import type { Banco, Entrada } from '@/core/storage'
import { Transferencia } from './Transferencia'

/**
 * O caminho de colar texto, ponta a ponta.
 *
 * O que este teste protege é a regra da tela: **nada é escrito antes do
 * preview**, e "substituir tudo" precisa de mais um clique que "juntar".
 */

function ent(pontuacao: number): Entrada {
  const emISO = '2026-09-01T10:00:00.000Z'
  return {
    recorde: { pontuacao, duracaoMs: 60_000, erros: 0, completou: false, emISO },
    partidas: 1,
    ultimaPontuacao: pontuacao,
    ultimaEmISO: emISO,
    historico: [],
    ultimosRuns: [],
  }
}

const banco = (entradas: Record<string, Entrada>): Banco => ({ versao: VERSAO_ATUAL, entradas })

// Sem `globals: true` no vitest, a limpeza automática da testing-library não se
// registra sozinha e uma tela fica montada sobre a outra.
afterEach(cleanup)

function renderizar(atual: Banco) {
  const onJuntar = vi.fn()
  const onSubstituir = vi.fn()
  const onLimpar = vi.fn()
  render(
    <Transferencia
      banco={atual}
      exportar={() => exportarJSON(atual)}
      onJuntar={onJuntar}
      onSubstituir={onSubstituir}
      onLimpar={onLimpar}
    />,
  )
  return { onJuntar, onSubstituir, onLimpar }
}

function montar(atual: Banco) {
  const acoes = renderizar(atual)
  fireEvent.click(screen.getByRole('button', { name: 'Importar backup' }))
  return acoes
}

function colar(texto: string) {
  fireEvent.change(screen.getByLabelText('JSON do backup'), { target: { value: texto } })
  fireEvent.click(screen.getByRole('button', { name: 'Analisar texto colado' }))
}

describe('Transferencia', () => {
  it('mostra o preview antes de escrever qualquer coisa', () => {
    const { onJuntar, onSubstituir } = montar(banco({ pi: ent(100) }))
    colar(exportarJSON(banco({ pi: ent(140), flashcards: ent(9) })))

    expect(screen.getByText('2 jogos')).toBeTruthy()
    expect(screen.getByText('▲ 1 sobem')).toBeTruthy()
    expect(screen.getByText('1 novos')).toBeTruthy()
    expect(screen.getAllByText('140').length).toBeGreaterThan(0)
    expect(onJuntar).not.toHaveBeenCalled()
    expect(onSubstituir).not.toHaveBeenCalled()
  })

  it('juntar aplica direto; substituir exige confirmação', () => {
    const { onJuntar, onSubstituir } = montar(banco({ pi: ent(100) }))
    colar(exportarJSON(banco({ pi: ent(140) })))

    fireEvent.click(screen.getByRole('button', { name: 'substituir tudo' }))
    expect(onSubstituir).not.toHaveBeenCalled()
    expect(screen.getByText(/Não dá para desfazer/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Substituir mesmo assim' }))
    expect(onSubstituir).toHaveBeenCalledTimes(1)
    expect(onJuntar).not.toHaveBeenCalled()
  })

  it('juntar entrega o banco lido do texto', () => {
    const { onJuntar } = montar(banco({ pi: ent(100) }))
    colar(exportarJSON(banco({ pi: ent(140) })))

    fireEvent.click(screen.getByRole('button', { name: 'Juntar' }))
    expect(onJuntar).toHaveBeenCalledTimes(1)
    expect(onJuntar.mock.calls[0]?.[0]?.entradas.pi?.recorde.pontuacao).toBe(140)
  })

  it('arquivo inválido explica o que houve e não aplica nada', () => {
    const { onJuntar, onSubstituir } = montar(banco({ pi: ent(100) }))
    colar('{ isso não é json')

    expect(screen.getByText(/JSON válido/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Juntar' })).toBeNull()
    expect(onJuntar).not.toHaveBeenCalled()
    expect(onSubstituir).not.toHaveBeenCalled()
  })

  it('avisa que substituir apaga os jogos que não vêm no arquivo', () => {
    montar(banco({ pi: ent(100), flashcards: ent(9) }))
    colar(exportarJSON(banco({ pi: ent(140) })))

    fireEvent.click(screen.getByRole('button', { name: 'substituir tudo' }))
    expect(screen.getByText(/1 jogo some/)).toBeTruthy()
  })

  it('a zona de perigo só apaga no segundo clique', () => {
    const { onLimpar } = renderizar(banco({ pi: ent(100) }))

    fireEvent.click(screen.getByRole('button', { name: 'Apagar todos os recordes' }))
    expect(onLimpar).not.toHaveBeenCalled()
    expect(screen.getByText(/Não dá para desfazer/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    expect(onLimpar).toHaveBeenCalledTimes(1)
  })

  it('sem nenhum recorde, a zona de perigo nem aparece', () => {
    renderizar(banco({}))
    expect(screen.queryByText('zona de perigo')).toBeNull()
  })
})
