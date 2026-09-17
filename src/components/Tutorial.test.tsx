import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { marcarTutorialVisto, tutorialVisto } from '@/core/tutorial'
import { Menu } from './Menu'
import { Tutorial } from './Tutorial'

/**
 * O tutorial é a primeira coisa que alguém vê no app, e a única que aparece sem
 * ser pedida. O que se protege aqui é isso: **aparece uma vez, some quando
 * fechado e volta quando chamado** — nessa ordem, porque errar qualquer uma das
 * três é pior que não ter tutorial.
 *
 * O projeto não usa jest-dom; as asserções são sobre o DOM cru.
 */

afterEach(cleanup)

beforeEach(() => {
  window.localStorage.clear()
})

const abrirTutorial = () => screen.getByRole('button', { name: /como funciona/i })
const dialogo = () => screen.queryByRole('dialog')

describe('o tutorial por dentro', () => {
  it('anda pelos passos e volta', () => {
    render(<Tutorial onFechar={() => {}} />)

    expect(screen.getByRole('dialog').textContent).toContain('1 de 4')
    fireEvent.click(screen.getByRole('button', { name: 'próximo' }))
    expect(screen.getByRole('dialog').textContent).toContain('2 de 4')

    fireEvent.click(screen.getByRole('button', { name: 'voltar' }))
    expect(screen.getByRole('dialog').textContent).toContain('1 de 4')
    // No primeiro passo não há para onde voltar.
    expect(screen.queryByRole('button', { name: 'voltar' })).toBeNull()
  })

  it('o último passo fecha em vez de avançar', () => {
    const fechar = vi.fn()
    render(<Tutorial onFechar={fechar} />)

    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'próximo' }))
    }
    expect(screen.queryByRole('button', { name: 'próximo' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'jogar' }))
    expect(fechar).toHaveBeenCalledOnce()
  })

  it('Esc fecha, como em qualquer diálogo', () => {
    const fechar = vi.fn()
    render(<Tutorial onFechar={fechar} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(fechar).toHaveBeenCalledOnce()
  })

  it('a conta do Nerdômetro fica atrás de um clique, e só no passo dela', () => {
    render(<Tutorial onFechar={() => {}} />)
    expect(screen.queryByRole('button', { name: /ver a conta/ })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'próximo' }))
    fireEvent.click(screen.getByRole('button', { name: 'próximo' }))

    const ver = screen.getByRole('button', { name: 'ver a conta inteira' })
    expect(ver.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(ver)
    expect(screen.getByRole('button', { name: 'esconder a conta' })).toBeTruthy()
  })
})

describe('quando o tutorial aparece', () => {
  it('sozinho, no primeiro acesso', () => {
    render(<Menu />)
    expect(dialogo()).toBeTruthy()
  })

  it('nunca mais depois de fechado — e a marca fica gravada', () => {
    render(<Menu />)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(dialogo()).toBeNull()
    expect(tutorialVisto()).toBe(true)

    cleanup()
    render(<Menu />)
    expect(dialogo()).toBeNull()
  })

  it('volta pelo botão da capa, sem desmarcar nada', () => {
    marcarTutorialVisto()
    render(<Menu />)
    expect(dialogo()).toBeNull()

    fireEvent.click(abrirTutorial())
    expect(dialogo()).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(dialogo()).toBeNull()
    expect(tutorialVisto()).toBe(true)
  })

  it('o corpo volta a rolar quando o diálogo sai', () => {
    // Sem isto o menu de 72 cartões fica travado depois que a pessoa fecha.
    render(<Menu />)
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
