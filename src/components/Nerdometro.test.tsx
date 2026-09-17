import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { calcular } from '@/core/nerdometro'
import { VERSAO_ATUAL } from '@/core/storage'
import type { Banco, Entrada } from '@/core/storage'
import { Nerdometro } from './Nerdometro'

/**
 * O que se protege aqui é a promessa da etiqueta: **"N em experiência" tem de
 * poder dizer quais N**.
 *
 * Como em `MetaNerdometro.test`, os dados saem de `calcular()` sobre um banco de
 * verdade — a lista da tela e o número da etiqueta têm de ser a mesma coisa
 * contada duas vezes, e um literal escrito na mão esconderia justamente a
 * divergência que o teste existe para pegar.
 *
 * O projeto não usa jest-dom, então as asserções são sobre `textContent` cru.
 */

afterEach(cleanup)

const EM_EXPERIENCIA = ['ordem-de-grandeza', 'formulas']
const NA_NOTA = 'alfabeto-grego'

function entrada(pontuacao: number, partidas: number): Entrada {
  const emISO = '2026-09-01T10:00:00.000Z'
  return {
    recorde: { pontuacao, duracaoMs: 60_000, erros: 0, completou: false, emISO },
    partidas,
    ultimaPontuacao: pontuacao,
    ultimaEmISO: emISO,
    historico: [],
    ultimosRuns: [],
  }
}

const BANCO: Banco = {
  versao: VERSAO_ATUAL,
  entradas: {
    [NA_NOTA]: entrada(10, 3),
    // Uma partida só e longe da meta: é a definição de "em experiência".
    [EM_EXPERIENCIA[0] as string]: entrada(3, 1),
    [EM_EXPERIENCIA[1] as string]: entrada(4, 1),
  },
}

const nomeDe = (jogoId: string) =>
  calcular(BANCO).linhas.find((l) => l.jogoId === jogoId)?.nome as string

describe('a etiqueta "em experiência"', () => {
  it('conta os mesmos jogos que a regra pôs em experiência', () => {
    expect(calcular(BANCO).emExperiencia.map((l) => l.jogoId).sort()).toEqual(
      [...EM_EXPERIENCIA].sort(),
    )
  })

  it('começa fechada, dizendo só quantos são', () => {
    render(<Nerdometro banco={BANCO} />)

    const botao = screen.getByRole('button', { name: /em experiência/ })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('region', { name: 'Jogos em experiência' })).toBeNull()
  })

  it('aberta, diz quais são e leva a cada um deles', () => {
    render(<Nerdometro banco={BANCO} />)
    fireEvent.click(screen.getByRole('button', { name: /em experiência/ }))

    const lista = within(screen.getByRole('region', { name: 'Jogos em experiência' }))
    for (const jogoId of EM_EXPERIENCIA) {
      const link = lista.getByRole('link', { name: new RegExp(nomeDe(jogoId)) })
      expect(link.getAttribute('href')).toContain(jogoId)
    }
  })

  it('não lista o jogo que já pesa na nota', () => {
    render(<Nerdometro banco={BANCO} />)
    fireEvent.click(screen.getByRole('button', { name: /em experiência/ }))

    const lista = within(screen.getByRole('region', { name: 'Jogos em experiência' }))
    expect(lista.queryByRole('link', { name: new RegExp(nomeDe(NA_NOTA)) })).toBeNull()
    expect(lista.getAllByRole('link')).toHaveLength(EM_EXPERIENCIA.length)
  })

  it('sem nenhum em experiência, a etiqueta não existe', () => {
    render(
      <Nerdometro banco={{ versao: VERSAO_ATUAL, entradas: { [NA_NOTA]: entrada(10, 3) } }} />,
    )
    expect(screen.queryByRole('button', { name: /em experiência/ })).toBeNull()
  })
})
