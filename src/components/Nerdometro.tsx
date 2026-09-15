import { useEffect, useState } from 'react'
import { calcular, DESCRICAO_AREA, FAIXAS, ROTULO_AREA } from '@/core/nerdometro'
import type { LinhaNerdometro, NotaArea } from '@/core/nerdometro'
import { href } from '@/core/route'
import type { Banco } from '@/core/storage'
import { Etiqueta } from './ui'

/**
 * A escala de cor do medidor, do azul calmo à brasa.
 *
 * São stops escolhidos à mão, não um matiz girando. Rodar só o hue com
 * luminosidade e croma fixos dá uma cor chapada — parece `color: purple` —
 * porque cor bonita de interface varia nos três eixos: o começo da escala é
 * dessaturado e frio, e o croma vai subindo até o topo "queimar".
 *
 * O caminho é crescente no círculo (248° → 388°=28°), passando por violeta,
 * roxo e magenta. O atalho pelo outro lado atravessaria a faixa 100°–140°,
 * onde nesta luminosidade só existe verde-limão ácido.
 */
interface Stop {
  readonly em: number
  readonly l: number
  readonly c: number
  readonly h: number
}

const ESCALA: readonly Stop[] = [
  { em: 0, l: 0.72, c: 0.1, h: 248 },
  { em: 20, l: 0.75, c: 0.12, h: 270 },
  { em: 40, l: 0.74, c: 0.15, h: 298 },
  { em: 60, l: 0.72, c: 0.18, h: 328 },
  { em: 80, l: 0.7, c: 0.2, h: 358 },
  { em: 100, l: 0.66, c: 0.22, h: 388 },
]

function interpolar(nota: number): Stop {
  const n = Math.max(0, Math.min(100, nota))
  const fim = ESCALA.findIndex((s) => s.em >= n)
  const b = ESCALA[fim === -1 ? ESCALA.length - 1 : fim] as Stop
  const a = (fim <= 0 ? b : ESCALA[fim - 1]) as Stop

  const t = b.em === a.em ? 0 : (n - a.em) / (b.em - a.em)
  return {
    em: n,
    l: a.l + (b.l - a.l) * t,
    c: a.c + (b.c - a.c) * t,
    h: a.h + (b.h - a.h) * t,
  }
}

function corDaNota(nota: number, ajusteL = 0): string {
  const s = interpolar(nota)
  return `oklch(${(s.l + ajusteL).toFixed(3)} ${s.c.toFixed(3)} ${(s.h % 360).toFixed(1)})`
}

/** Gradiente para texto: o mesmo tom, do mais claro ao mais escuro. */
function gradienteDaNota(nota: number): string {
  return `linear-gradient(135deg, ${corDaNota(nota, 0.12)}, ${corDaNota(nota, -0.06)})`
}

/** Aplica o gradiente sobre o próprio texto. */
const textoEmGradiente = (nota: number): React.CSSProperties => ({
  backgroundImage: gradienteDaNota(nota),
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
})

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

  const tom = corDaNota(m.nota)

  return (
    <section className="overflow-hidden rounded-2xl border border-borda bg-superficie/70 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-6 p-5">
        <Medidor nota={m.nota} animada={animada} />

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <p className="text-xs tracking-[0.25em] text-tenue uppercase">Nerdômetro</p>

          <div>
            <p className="fonte-display text-3xl leading-none font-bold" style={textoEmGradiente(m.nota)}>
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
              <Etiqueta
                style={{ color: tom, borderColor: corDaNota(m.nota, -0.18) }}
              >
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
  const tom = corDaNota(nota)

  return (
    <div className="relative shrink-0">
      <svg viewBox="0 0 132 132" className="size-36" role="img" aria-label={`Nota ${nota} de 100`}>
        <title>Nerdômetro</title>

        <defs>
          {/* O arco preenchido percorre a própria escala: sai do azul do zero e
              termina na cor da nota atual. */}
          <linearGradient id="nerd-arco" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={corDaNota(0)} />
            <stop offset="35%" stopColor={corDaNota(nota * 0.35)} />
            <stop offset="70%" stopColor={corDaNota(nota * 0.7)} />
            <stop offset="100%" stopColor={corDaNota(nota, 0.06)} />
          </linearGradient>
        </defs>

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
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(ARCO * animada) / 100} 999`}
          transform={`rotate(${GIRO} 66 66)`}
          stroke="url(#nerd-arco)"
          style={{ filter: `drop-shadow(0 0 7px ${tom})` }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-5xl tabular leading-none font-bold"
          style={textoEmGradiente(animada)}
        >
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
          className="block h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${area.nota}%`,
            backgroundImage: `linear-gradient(90deg, ${corDaNota(0)}, ${corDaNota(area.nota)})`,
          }}
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
