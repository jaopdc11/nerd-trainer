import { useEffect, useRef } from 'react'

/**
 * Esc pula a pergunta atual.
 *
 * O botão sozinho não basta num baralho de 195 cartas: a mão fica no teclado a
 * partida inteira, e tirá-la para clicar a cada carta que não se sabe custa mais
 * que a carta. Esc porque não disputa com nada — Tab é navegação por foco e
 * roubá-lo quebraria o teclado de quem não usa mouse.
 *
 * Só dispara enquanto a pergunta está de pé: com o gabarito na tela, a carta já
 * foi resolvida e um Esc perdido queimaria a seguinte.
 */
export function useAtalhoPular(ativo: boolean, pular: () => void): void {
  const pularRef = useRef(pular)
  pularRef.current = pular

  useEffect(() => {
    if (!ativo) return

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      pularRef.current()
    }

    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [ativo])
}
