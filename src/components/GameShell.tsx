import { useState } from 'react'
import { href } from '@/core/route'
import type { JogoModule } from '@/core/types'
import { CORES_CATEGORIA, IconeJogo } from './ui'

/** Cabeçalho, instruções e navegação — o que toda mecânica precisa em volta. */
export function GameShell({ jogo, children }: { jogo: JogoModule; children: React.ReactNode }) {
  const [abertas, setAbertas] = useState(false)
  const cor = CORES_CATEGORIA[jogo.categoria]

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <a
          href={href({ nome: 'menu' })}
          className="flex items-center gap-1.5 text-sm text-tenue transition-colors hover:text-texto"
        >
          <span aria-hidden>←</span> jogos
        </a>

        <h1 className="flex min-w-0 items-center gap-2.5">
          <IconeJogo icone={jogo.icone} categoria={jogo.categoria} tamanho="sm" />
          <span className="fonte-display truncate font-semibold">{jogo.nome}</span>
        </h1>

        <button
          type="button"
          onClick={() => setAbertas((v) => !v)}
          aria-expanded={abertas}
          aria-label="Como jogar"
          className={`grid size-8 shrink-0 place-items-center rounded-lg border text-sm transition-colors ${
            abertas
              ? 'border-acento bg-acento-fundo text-acento'
              : 'border-borda text-tenue hover:border-borda-forte hover:text-suave'
          }`}
        >
          ?
        </button>
      </header>

      {abertas && (
        <ul className="motion-safe:animate-surgir flex flex-col gap-2 rounded-2xl border border-borda bg-superficie/70 p-4 text-sm text-suave backdrop-blur-sm">
          {jogo.comoJogar.map((linha) => (
            <li key={linha} className="flex gap-2.5">
              <span aria-hidden className={`select-none ${cor.texto}`}>
                ▸
              </span>
              {linha}
            </li>
          ))}
        </ul>
      )}

      {children}
    </div>
  )
}
