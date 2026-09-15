import { useState } from 'react'
import { href } from '@/core/route'
import type { JogoModule } from '@/core/types'

/** Cabeçalho, instruções e navegação — o que toda mecânica precisa em volta. */
export function GameShell({
  jogo,
  children,
}: {
  jogo: JogoModule
  children: React.ReactNode
}) {
  const [abertas, setAbertas] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <a
          href={href({ nome: 'menu' })}
          className="text-sm text-suave transition-colors hover:text-texto"
        >
          ← jogos
        </a>
        <h1 className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="font-mono text-acento">
            {jogo.icone}
          </span>
          {jogo.nome}
        </h1>
        <button
          type="button"
          onClick={() => setAbertas((v) => !v)}
          aria-expanded={abertas}
          className="rounded-lg border border-borda px-2.5 py-1 text-sm text-suave transition-colors hover:text-texto"
        >
          ?
        </button>
      </header>

      {abertas && (
        <ul className="motion-safe:animate-surgir list-disc rounded-xl border border-borda bg-superficie py-3 pr-4 pl-9 text-sm text-suave">
          {jogo.comoJogar.map((linha) => (
            <li key={linha}>{linha}</li>
          ))}
        </ul>
      )}

      {children}
    </div>
  )
}
