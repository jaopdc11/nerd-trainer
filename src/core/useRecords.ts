import { useCallback, useSyncExternalStore } from 'react'
import {
  apagarTudo,
  carregar,
  chaveRecorde,
  entradaDe,
  persistir,
  registrar,
} from './storage'
import type { Banco, Entrada } from './storage'
import type { ResultadoRun } from './types'

/**
 * Store de módulo lida por `useSyncExternalStore`. Nenhum componente importa
 * `storage.ts` direto — é por aqui que a leitura vira reativa e que duas abas
 * abertas não divergem.
 */

let banco: Banco = carregar()
const inscritos = new Set<() => void>()

function notificar(): void {
  for (const f of inscritos) f()
}

function inscrever(f: () => void): () => void {
  inscritos.add(f)
  return () => {
    inscritos.delete(f)
  }
}

function ler(): Banco {
  return banco
}

// Outra aba gravou: recarrega para não sobrescrever o recorde feito lá.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    banco = carregar()
    notificar()
  })
}

export interface ApiRecordes {
  readonly banco: Banco
  recordeDe(jogoId: string, modoId?: string): Entrada | null
  /** Grava a partida e devolve se foi recorde novo. */
  registrarRun(r: ResultadoRun): boolean
  limparTudo(): void
}

export function useRecordes(): ApiRecordes {
  const atual = useSyncExternalStore(inscrever, ler, ler)

  const registrarRun = useCallback((r: ResultadoRun) => {
    const { banco: proximo, recordeNovo } = registrar(banco, r)
    if (proximo !== banco) {
      banco = proximo
      persistir(banco)
      notificar()
    }
    return recordeNovo
  }, [])

  const limparTudo = useCallback(() => {
    banco = apagarTudo()
    notificar()
  }, [])

  const recordeDe = useCallback(
    (jogoId: string, modoId?: string) => entradaDe(atual, jogoId, modoId),
    [atual],
  )

  return { banco: atual, recordeDe, registrarRun, limparTudo }
}

export { chaveRecorde }
