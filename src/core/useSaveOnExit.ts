import { useEffect, useRef } from 'react'

/**
 * Grava a partida em andamento quando o jogador some.
 *
 * Sem isso, só contava a run que chegava ao fim "certo" — relógio zerado, morte
 * súbita, baralho completo. Quem fizesse 50 acertos e fechasse a aba perdia os
 * 50, o que é exatamente o contrário do que um jogo de recorde deve fazer.
 *
 * São três saídas possíveis, e todas precisam ser cobertas:
 * - trocar de tela dentro do app → cleanup do efeito
 * - trocar de aba ou minimizar no celular → `visibilitychange`
 * - fechar a aba de vez → `pagehide`
 *
 * `beforeunload` não entra: o Safari no iOS costuma não disparar, e `pagehide`
 * cobre o mesmo caso de forma confiável.
 *
 * Gravar demais não é problema: `registrar` é idempotente por `runId`, então a
 * mesma partida salva duas vezes continua contando uma.
 */
export function useSaveOnExit(emAndamento: () => boolean, salvar: () => void): void {
  // Refs para o efeito rodar uma vez só e ainda assim enxergar o estado atual.
  const emAndamentoRef = useRef(emAndamento)
  const salvarRef = useRef(salvar)
  emAndamentoRef.current = emAndamento
  salvarRef.current = salvar

  useEffect(() => {
    const gravarSePreciso = () => {
      if (emAndamentoRef.current()) salvarRef.current()
    }

    const aoEsconder = () => {
      if (document.visibilityState === 'hidden') gravarSePreciso()
    }

    window.addEventListener('pagehide', gravarSePreciso)
    document.addEventListener('visibilitychange', aoEsconder)

    return () => {
      window.removeEventListener('pagehide', gravarSePreciso)
      document.removeEventListener('visibilitychange', aoEsconder)
      gravarSePreciso()
    }
  }, [])
}
