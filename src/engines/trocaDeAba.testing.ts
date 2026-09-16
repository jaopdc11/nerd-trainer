import { act } from '@testing-library/react'

/**
 * Simula o jogador trocando de aba, para os testes das quatro mecânicas.
 *
 * Não é arquivo de teste (o nome não casa com `*.test.ts`), é utilitário: as
 * quatro engines precisam do mesmo gesto, e copiar `Object.defineProperty` em
 * quatro lugares é o tipo de coisa que envelhece mal.
 *
 * `document.visibilityState` é somente-leitura no jsdom, então é preciso
 * redefini-la antes de disparar o evento — o hook só grava quando a página
 * está de fato escondida.
 */

function definirVisibilidade(valor: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { value: valor, configurable: true })
}

/** Esconde a página e dispara `visibilitychange`, como o navegador faria. */
export function esconderAba(): void {
  definirVisibilidade('hidden')
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

/** Volta para a aba do jogo. */
export function voltarParaAba(): void {
  definirVisibilidade('visible')
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}
