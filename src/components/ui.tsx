import type { ComponentProps, ReactNode } from 'react'
import type { Categoria } from '@/core/types'

/**
 * Primitivas visuais compartilhadas.
 *
 * Existem para que botão e cartão tenham o mesmo comportamento em toda tela —
 * sem isso, cada engine reinventa o seu e o app deixa de parecer uma coisa só.
 */

/** Paleta por categoria. Texto, fundo e borda saem sempre do mesmo par. */
export const CORES_CATEGORIA: Record<Categoria, { texto: string; fundo: string; borda: string }> = {
  matematica: { texto: 'text-mat', fundo: 'bg-mat-fundo', borda: 'group-hover:border-mat' },
  fisica: { texto: 'text-fis', fundo: 'bg-fis-fundo', borda: 'group-hover:border-fis' },
  quimica: { texto: 'text-qui', fundo: 'bg-qui-fundo', borda: 'group-hover:border-qui' },
}

type Variante = 'primario' | 'secundario' | 'discreto'
type Tamanho = 'md' | 'lg'

const VARIANTE: Record<Variante, string> = {
  primario:
    'bg-acento text-fundo font-semibold shadow-[0_0_24px_-6px_var(--color-acento)] hover:bg-acento-forte',
  secundario: 'border border-borda bg-superficie text-texto hover:border-borda-forte hover:bg-superficie-alta',
  discreto: 'text-tenue hover:text-suave',
}

const TAMANHO: Record<Tamanho, string> = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Botao({
  variante = 'primario',
  tamanho = 'lg',
  className = '',
  ...props
}: ComponentProps<'button'> & { variante?: Variante; tamanho?: Tamanho }) {
  return (
    <button
      type="button"
      // `active:scale` dá o retorno tátil que faz o clique parecer registrado.
      className={`rounded-xl transition-all duration-150 motion-safe:active:scale-[0.97] ${VARIANTE[variante]} ${TAMANHO[tamanho]} ${className}`}
      {...props}
    />
  )
}

/** Painel padrão: a superfície de que quase tudo no app é feito. */
export function Painel({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`rounded-2xl border border-borda bg-superficie/80 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

/** Rótulo pequeno em caixa alta, para metadados. */
export function Etiqueta({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`rounded-md border border-borda px-2 py-0.5 font-mono text-[0.7rem] tracking-wide uppercase ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Número grande do placar. Mono e tabular para não dançar a cada mudança, e
 * com um brilho quando o valor vira recorde.
 */
export function Placar({
  valor,
  sufixo,
  total,
  destacado = false,
}: {
  valor: number
  sufixo?: string
  total?: number
  destacado?: boolean
}) {
  return (
    <p className="flex items-baseline gap-2">
      <span
        className={`font-mono text-5xl tabular font-bold transition-colors duration-300 ${
          destacado ? 'text-acento' : 'text-texto'
        }`}
        style={destacado ? { textShadow: '0 0 28px var(--color-acento)' } : undefined}
      >
        {valor}
      </span>
      {total !== undefined && <span className="font-mono text-xl text-tenue">/{total}</span>}
      {sufixo && <span className="text-sm text-suave">{sufixo}</span>}
    </p>
  )
}

/** Barra de progresso fina, usada pelo relógio e pela grade. */
export function Barra({
  fracao,
  alerta = false,
}: {
  fracao: number
  alerta?: boolean
}) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-superficie-alta">
      <div
        className={`h-full rounded-full transition-[width] duration-150 ${
          alerta ? 'bg-erro' : 'bg-acento'
        }`}
        style={{
          width: `${Math.max(0, Math.min(1, fracao)) * 100}%`,
          boxShadow: alerta ? undefined : '0 0 12px var(--color-acento)',
        }}
      />
    </div>
  )
}
