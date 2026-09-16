import { useEffect, useState } from 'react'

/**
 * Conta de 0 até o valor, uma vez.
 *
 * O número subindo é o que faz um placar parecer que mediu alguma coisa, em vez
 * de só exibir um campo. Nasceu no Nerdômetro e mudou para cá quando a tela de
 * fim de partida passou a querer o mesmo efeito: eram dois lugares mostrando o
 * resultado de uma coisa que acabou, e duas cópias do mesmo `requestAnimationFrame`
 * divergiriam na primeira vez que alguém mexesse na curva.
 *
 * `ativo: false` devolve o valor direto e não agenda quadro nenhum — é o que o
 * placar do meio da partida usa, onde contar de 0 a cada acerto seria ridículo.
 * `prefers-reduced-motion` cai no mesmo caminho.
 */
export function useContagem(
  alvo: number,
  { duracaoMs = 900, ativo = true }: { duracaoMs?: number; ativo?: boolean } = {},
): number {
  const [n, setN] = useState(ativo ? 0 : alvo)

  useEffect(() => {
    const reduzido =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!ativo || reduzido || alvo === 0) {
      setN(alvo)
      return
    }

    let quadro = 0
    const inicio = performance.now()

    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs)
      // easeOutCubic: começa rápido e assenta, que é como um ponteiro se comporta.
      setN(Math.round(alvo * (1 - (1 - t) ** 3)))
      if (t < 1) quadro = requestAnimationFrame(passo)
    }

    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo, duracaoMs, ativo])

  return n
}
