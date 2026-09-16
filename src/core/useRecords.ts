import { useCallback, useSyncExternalStore } from 'react'
import { JOGOS } from './registry'
import {
  apagarTudo,
  carregar,
  chaveRecorde,
  entradaDe,
  exportarJSON,
  juntar,
  persistir,
  registrar,
} from './storage'
import { limparOrfas } from './storage'
import type { Banco, Entrada } from './storage'
import type { ResultadoRun } from './types'

/**
 * Store de módulo lida por `useSyncExternalStore`. Nenhum componente importa
 * `storage.ts` direto — é por aqui que a leitura vira reativa e que duas abas
 * abertas não divergem.
 */

/**
 * Na carga, descarta entradas de jogos e modos que não existem mais — sem isso,
 * um jogo removido segue contando nas estatísticas para sempre. O registry é
 * importado aqui, e não em `storage`, para não criar ciclo.
 */
let banco: Banco = limparOrfas(carregar(), JOGOS.map((j) => j.id))
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

/**
 * Troca o banco inteiro e persiste. O backup pode trazer jogos que não existem
 * mais nesta versão, então passa pela mesma limpeza da carga — senão a
 * importação ressuscita entradas órfãs que a carga já tinha descartado.
 */
function aplicar(novo: Banco): void {
  banco = limparOrfas(novo, JOGOS.map((j) => j.id))
  persistir(banco)
  notificar()
}

// Outra aba gravou: recarrega para não sobrescrever o recorde feito lá.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    banco = limparOrfas(carregar(), JOGOS.map((j) => j.id))
    notificar()
  })
}

export interface ApiRecordes {
  readonly banco: Banco
  recordeDe(jogoId: string, modoId?: string): Entrada | null
  /** Grava a partida e devolve se foi recorde novo. */
  registrarRun(r: ResultadoRun): boolean
  limparTudo(): void
  /** JSON com tudo, para levar os recordes para outra máquina. */
  exportar(): string
  /** Mantém o melhor de cada jogo entre o que existe aqui e o backup. */
  juntarCom(vindo: Banco): void
  /** Troca tudo pelo backup. Destrutivo: a UI confirma antes. */
  substituirPor(vindo: Banco): void
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

  const exportar = useCallback(() => exportarJSON(banco), [])

  const juntarCom = useCallback((vindo: Banco) => aplicar(juntar(banco, vindo)), [])
  const substituirPor = useCallback((vindo: Banco) => aplicar(vindo), [])

  return { banco: atual, recordeDe, registrarRun, limparTudo, exportar, juntarCom, substituirPor }
}

export { chaveRecorde }
