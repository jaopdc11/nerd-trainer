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
 * **`gravar` é só gravar.** Quem chama este hook passa a operação que persiste o
 * parcial, nunca a que encerra a partida: por um tempo as engines passaram o
 * `finalizar`, e trocar de aba no meio de uma run terminava o jogo — voltar para
 * a aba dava de cara com a tela de fim. Trocar de aba salva o progresso e mais
 * nada; a partida continua exatamente onde estava, relógio incluído (o
 * `useClock` não pausa ao perder o foco, e isso é de propósito).
 *
 * No cleanup gravar também é o certo: ali o componente está desmontando de
 * qualquer jeito, e mexer no estado de quem já saiu de cena não serviria a
 * ninguém.
 *
 * Gravar demais não é problema: `registrar` é idempotente por `runId`, então a
 * mesma partida salva duas vezes continua contando uma — e, se ela voltar com
 * pontuação maior, o parcial é atualizado em vez de duplicado.
 */
export function useSaveOnExit(emAndamento: () => boolean, gravar: () => void): void {
  // Refs para o efeito rodar uma vez só e ainda assim enxergar o estado atual.
  const emAndamentoRef = useRef(emAndamento)
  const salvarRef = useRef(gravar)
  emAndamentoRef.current = emAndamento
  salvarRef.current = gravar

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
