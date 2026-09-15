import type { Unidade } from './types'

/** "1 casa" / "12 casas". */
export function comUnidade(n: number, u: Unidade): string {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? u.singular : u.plural}`
}

/** "1:23" para tempos de partida; "12,4 s" abaixo de um minuto. */
export function duracao(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1).replace('.', ',')} s`
  const total = Math.round(ms / 1000)
  const min = Math.floor(total / 60)
  return `${min}:${String(total % 60).padStart(2, '0')}`
}

/** Relógio regressivo do modo cronometrado. */
export function cronometro(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Velocidade derivada, nunca armazenada: "84 casas/min".
 * Devolve `null` quando a partida é curta demais para a conta significar algo.
 */
export function taxa(pontuacao: number, duracaoMs: number, u: Unidade): string | null {
  if (duracaoMs < 3000 || pontuacao === 0) return null
  const porMinuto = (pontuacao / duracaoMs) * 60_000
  return `${porMinuto.toFixed(porMinuto < 10 ? 1 : 0).replace('.', ',')} ${u.plural}/min`
}

/** "hoje", "ontem", "há 3 dias", ou a data curta. */
export function quando(iso: string): string {
  const entao = new Date(iso)
  if (Number.isNaN(entao.getTime())) return ''

  const dia = (d: Date) => Math.floor(new Date(d).setHours(0, 0, 0, 0) / 86_400_000)
  const dias = dia(new Date()) - dia(entao)

  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return entao.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
