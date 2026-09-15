import { useEffect, useState } from 'react'
import { calcular, DESCRICAO_AREA, FAIXAS, ROTULO_AREA } from '@/core/nerdometro'
import type { LinhaNerdometro, NotaArea } from '@/core/nerdometro'
import { href } from '@/core/route'
import type { Banco } from '@/core/storage'
import { Etiqueta } from './ui'

/** Cor por faixa. Verde só no topo, para o topo significar alguma coisa. */
function cor(nota: number): string {
  if (nota >= 70) return 'text-acento'
  if (nota >= 40) return 'text-mat'
  if (nota >= 15) return 'text-qui'
  return 'text-tenue'
}

/**
 * Conta de 0 até o valor ao montar.
 *
 * O número subindo é o que faz o medidor parecer que mediu alguma coisa, em vez
 * de só exibir um campo. Usa `requestAnimationFrame` com easing de saída, e
 * respeita `prefers-reduced-motion` indo direto ao valor final.
 */
function useContagem(alvo: number, duracaoMs = 900): number {
  const [n, setN] = useState(0)

  useEffect(() => {
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduzido || alvo === 0) {
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
  }, [alvo, duracaoMs])

  return n
}

const RAIO = 54
const GRAUS = 250
const ARCO = (GRAUS / 360) * 2 * Math.PI * RAIO
const GIRO = 90 + (360 - GRAUS) / 2

export function Nerdometro({ banco }: { banco: Banco }) {
  const [aberto, setAberto] = useState(false)
  const m = calcular(banco)
  const animada = useContagem(m.nota)

  if (m.jogados === 0) return null

  return (
    <section className="overflow-hidden rounded-2xl border border-borda bg-superficie/70 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-6 p-5">
        <Medidor nota={m.nota} animada={animada} />

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <p className="text-xs tracking-[0.25em] text-tenue uppercase">Nerdômetro</p>

          <div>
            <p className={`fonte-display text-3xl leading-none font-bold ${cor(m.nota)}`}>
              {m.faixa.titulo}
            </p>
            <p className="mt-1 text-sm text-suave">{m.faixa.lema}</p>
          </div>

          {m.proximaFaixa && (
            <p className="text-sm text-tenue">
              faltam <strong className="font-mono text-texto">{m.proximaFaixa.falta}</strong> para{' '}
              <span className="text-suave">{m.proximaFaixa.faixa.titulo}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Etiqueta className="text-suave">{m.partidas} partidas</Etiqueta>
            <Etiqueta className="text-suave">{formatarTempo(m.tempoMs)} jogados</Etiqueta>
            {m.dominados > 0 && (
              <Etiqueta className="border-acento/40 text-acento">
                {m.dominados} no máximo
              </Etiqueta>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {m.areas.map((a) => (
            <Area key={a.area} area={a} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-center gap-2 border-t border-borda py-2.5 text-sm text-tenue transition-colors hover:bg-superficie-alta hover:text-suave"
      >
        {aberto ? 'esconder detalhes' : 'ver os 15 critérios'}
        <span aria-hidden className={`transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}>
          ⌄
        </span>
      </button>

      {aberto && <Detalhe linhas={m.linhas} proximo={m.proximoPasso} />}
    </section>
  )
}

function Medidor({ nota, animada }: { nota: number; animada: number }) {
  return (
    <div className="relative shrink-0">
      <svg viewBox="0 0 132 132" className="size-36" role="img" aria-label={`Nota ${nota} de 100`}>
        <title>Nerdômetro</title>

        <circle
          cx="66"
          cy="66"
          r={RAIO}
          fill="none"
          stroke="var(--color-superficie-alta)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${ARCO} 999`}
          transform={`rotate(${GIRO} 66 66)`}
        />

        {/* Marcas onde cada faixa começa: mostram que a escala tem degraus. */}
        {FAIXAS.filter((f) => f.minimo > 0 && f.minimo < 100).map((f) => {
          const ang = ((GIRO + (f.minimo / 100) * GRAUS) * Math.PI) / 180
          return (
            <circle
              key={f.minimo}
              cx={66 + Math.cos(ang) * RAIO}
              cy={66 + Math.sin(ang) * RAIO}
              r="1.6"
              fill={nota >= f.minimo ? 'var(--color-fundo)' : 'var(--color-borda-forte)'}
            />
          )
        })}

        <circle
          cx="66"
          cy="66"
          r={RAIO}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(ARCO * animada) / 100} 999`}
          transform={`rotate(${GIRO} 66 66)`}
          className={cor(nota)}
          style={{ filter: 'drop-shadow(0 0 7px currentColor)' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono text-5xl tabular leading-none font-bold ${cor(nota)}`}>
          {animada}
        </span>
        <span className="mt-1 text-[0.65rem] tracking-wider text-tenue">DE 100</span>
      </div>
    </div>
  )
}

function Area({ area }: { area: NotaArea }) {
  return (
    <div className="flex items-center gap-2.5" title={DESCRICAO_AREA[area.area]}>
      <span className="w-24 text-right text-xs text-tenue">{ROTULO_AREA[area.area]}</span>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-superficie-alta">
        <span
          className={`block h-full rounded-full transition-[width] duration-700 ${
            area.nota >= 70 ? 'bg-acento' : 'bg-borda-forte'
          }`}
          style={{ width: `${area.nota}%` }}
        />
      </span>
      <span className="w-8 font-mono text-xs text-suave">{area.nota}</span>
    </div>
  )
}

function Detalhe({
  linhas,
  proximo,
}: {
  linhas: readonly LinhaNerdometro[]
  proximo: LinhaNerdometro | null
}) {
  const ordenadas = [...linhas].sort((a, b) => b.fracao - a.fracao)

  return (
    <div className="motion-safe:animate-surgir border-t border-borda p-4">
      <ul className="escalonar flex flex-col">
        {ordenadas.map((l, i) => (
          <li key={l.jogoId} style={{ '--i': i } as React.CSSProperties}>
            <Linha linha={l} sugerido={proximo?.jogoId === l.jogoId} />
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-borda pt-3 text-xs text-tenue">
        A nota é a média ponderada dos 15 critérios. Repertório pesa o dobro; a meta de
        cada jogo é o que dá para decorar de verdade, não o tamanho do dataset.
      </p>
    </div>
  )
}

function Linha({ linha, sugerido }: { linha: LinhaNerdometro; sugerido: boolean }) {
  const pct = Math.round(linha.fracao * 100)

  return (
    <a
      href={href({ nome: 'jogo', jogoId: linha.jogoId })}
      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-superficie-alta"
    >
      <span
        aria-hidden
        className={`w-10 shrink-0 text-center font-mono text-sm ${
          linha.dominado ? 'text-acento' : 'text-tenue'
        }`}
      >
        {linha.icone}
      </span>

      <span className="flex w-40 shrink-0 items-center gap-1.5 truncate text-sm">
        {linha.nome}
        {linha.dominado && (
          <span aria-label="no máximo" className="text-acento">
            ★
          </span>
        )}
      </span>

      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-superficie-alta">
        <span
          className={`block h-full rounded-full transition-[width] duration-700 ${
            linha.dominado ? 'bg-acento' : pct > 0 ? 'bg-borda-forte' : ''
          }`}
          style={{ width: `${pct}%` }}
        />
      </span>

      <span className="w-20 shrink-0 text-right font-mono text-xs text-tenue tabular">
        {linha.recorde}/{linha.meta}
      </span>

      <span
        className={`w-10 shrink-0 text-right font-mono text-xs tabular ${
          linha.dominado ? 'text-acento' : 'text-suave'
        }`}
      >
        {pct}%
      </span>

      <span className="w-14 shrink-0 text-right text-[0.7rem] text-tenue">
        {sugerido ? <span className="text-quase">+{linha.potencial.toFixed(1)}</span> : ''}
      </span>
    </a>
  )
}

function formatarTempo(ms: number): string {
  const min = Math.round(ms / 60_000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  return `${h}h${String(min % 60).padStart(2, '0')}`
}
