import { useState } from 'react'
import { calcular } from '@/core/nerdometro'
import type { LinhaNerdometro } from '@/core/nerdometro'
import { href } from '@/core/route'
import type { Banco } from '@/core/storage'
import { Etiqueta } from './ui'

/** Faixa de cor do medidor. Verde só no topo, para o topo significar algo. */
function cor(nota: number): string {
  if (nota >= 70) return 'text-acento'
  if (nota >= 40) return 'text-mat'
  if (nota >= 15) return 'text-qui'
  return 'text-tenue'
}

export function Nerdometro({ banco }: { banco: Banco }) {
  const [aberto, setAberto] = useState(false)
  const m = calcular(banco)

  if (m.nota === 0 && m.jogados === 0) return null

  // Arco de 240°, começando embaixo à esquerda. O raio e o comprimento do
  // traço saem daí; `strokeDasharray` desenha a fração preenchida.
  const raio = 52
  const arco = (240 / 360) * 2 * Math.PI * raio

  return (
    <section className="rounded-2xl border border-borda bg-superficie/70 p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative shrink-0">
          <svg viewBox="0 0 128 128" className="size-32" role="img" aria-label={`Nota ${m.nota} de 100`}>
            <title>Nerdômetro</title>
            {/* trilho */}
            <circle
              cx="64"
              cy="64"
              r={raio}
              fill="none"
              stroke="var(--color-superficie-alta)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${arco} 999`}
              transform="rotate(150 64 64)"
            />
            {/* preenchido */}
            <circle
              cx="64"
              cy="64"
              r={raio}
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${(arco * m.nota) / 100} 999`}
              transform="rotate(150 64 64)"
              className={`${cor(m.nota)} transition-all duration-700`}
              style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono text-4xl tabular font-bold ${cor(m.nota)}`}>{m.nota}</span>
            <span className="text-[0.65rem] text-tenue">de 100</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs tracking-[0.2em] text-tenue uppercase">Nerdômetro</p>
          <p className={`fonte-display text-2xl leading-tight font-bold ${cor(m.nota)}`}>
            {m.titulo}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Etiqueta className="text-suave">
              {m.jogados} de {m.total} jogos
            </Etiqueta>
            {m.proximoPasso && m.proximoPasso.potencial > 0.5 && (
              <Etiqueta className="text-tenue">
                +{m.proximoPasso.potencial.toFixed(1)} em {m.proximoPasso.nome}
              </Etiqueta>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="shrink-0 rounded-xl border border-borda px-3 py-2 text-sm text-tenue transition-colors hover:border-borda-forte hover:text-suave"
        >
          {aberto ? 'fechar' : 'detalhar'}
        </button>
      </div>

      {aberto && (
        <ul className="motion-safe:animate-surgir mt-5 flex flex-col gap-2 border-t border-borda pt-4">
          {[...m.linhas]
            .sort((a, b) => b.fracao - a.fracao)
            .map((l) => (
              <li key={l.jogoId}>
                <Linha linha={l} />
              </li>
            ))}
        </ul>
      )}
    </section>
  )
}

function Linha({ linha }: { linha: LinhaNerdometro }) {
  const pct = Math.round(linha.fracao * 100)

  return (
    <a
      href={href({ nome: 'jogo', jogoId: linha.jogoId })}
      className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-superficie-alta"
    >
      <span className="w-44 shrink-0 truncate text-sm">{linha.nome}</span>

      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-superficie-alta">
        <span
          className={`block h-full rounded-full ${pct === 100 ? 'bg-acento' : 'bg-borda-forte'}`}
          style={{ width: `${pct}%` }}
        />
      </span>

      <span className="w-24 shrink-0 text-right font-mono text-xs text-tenue">
        {linha.recorde}/{linha.meta}
      </span>
      <span
        className={`w-10 shrink-0 text-right font-mono text-xs ${
          pct === 100 ? 'text-acento' : 'text-suave'
        }`}
      >
        {pct}%
      </span>
    </a>
  )
}
