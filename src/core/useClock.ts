import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Relógio regressivo com bônus por acerto.
 *
 * Nunca acumula ticks: guarda o instante de início e o crédito total concedido,
 * e deriva o restante de `performance.now()` a cada quadro. `setInterval`
 * sofre throttling em aba de fundo e para quando a tela do celular apaga — um
 * relógio somado tique a tique mentiria a favor do jogador.
 *
 * Decisão de design: **não pausa ao perder o foco.** Trocar de aba para pensar
 * numa conta seria exploit óbvio num modo cronometrado.
 */

export interface Relogio {
  readonly restanteMs: number
  readonly rodando: boolean
  iniciar(): void
  /** Soma tempo, respeitando o teto. Devolve o novo restante. */
  creditar(ms: number): void
  parar(): void
  reiniciar(): void
}

export function useClock(inicialMs: number, tetoMs: number): Relogio {
  const [restanteMs, setRestanteMs] = useState(inicialMs)
  const [rodando, setRodando] = useState(false)

  const inicio = useRef(0)
  const credito = useRef(inicialMs)
  const quadro = useRef<number | undefined>(undefined)

  const decorrido = () => performance.now() - inicio.current

  useEffect(() => {
    if (!rodando) return

    const passo = () => {
      const restante = credito.current - decorrido()
      if (restante <= 0) {
        setRestanteMs(0)
        setRodando(false)
        return
      }
      setRestanteMs(restante)
      quadro.current = requestAnimationFrame(passo)
    }

    quadro.current = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro.current ?? 0)
  }, [rodando])

  const iniciar = useCallback(() => {
    inicio.current = performance.now()
    credito.current = inicialMs
    setRestanteMs(inicialMs)
    setRodando(true)
  }, [inicialMs])

  const creditar = useCallback(
    (ms: number) => {
      // O teto é o que impede farming: sem ele, quem é rápido em soma de um
      // dígito joga indefinidamente e a partida deixa de ter fim.
      credito.current = Math.min(credito.current + ms, decorrido() + tetoMs)
    },
    [tetoMs],
  )

  const parar = useCallback(() => setRodando(false), [])

  const reiniciar = useCallback(() => {
    setRodando(false)
    credito.current = inicialMs
    setRestanteMs(inicialMs)
  }, [inicialMs])

  return { restanteMs, rodando, iniciar, creditar, parar, reiniciar }
}
