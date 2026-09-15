import { comUnidade, quando } from '@/core/format'
import { porCategoria } from '@/core/registry'
import { href } from '@/core/route'
import { persistenciaIndisponivel } from '@/core/storage'
import { ROTULO_CATEGORIA } from '@/core/types'
import type { JogoModule } from '@/core/types'
import { useRecordes } from '@/core/useRecords'

export function Menu() {
  const { recordeDe } = useRecordes()
  const grupos = porCategoria()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Nerd Trainer</h1>
          <p className="text-suave">Um pouco por dia, tentando bater o recorde de ontem.</p>
        </div>
        <a
          href={href({ nome: 'recordes' })}
          className="shrink-0 rounded-lg border border-borda px-3 py-2 text-sm text-suave transition-colors hover:border-acento hover:text-texto"
        >
          recordes
        </a>
      </header>

      {persistenciaIndisponivel() && (
        <p className="rounded-lg border border-quase bg-quase-fundo px-4 py-2 text-sm text-quase">
          Este navegador não está guardando dados: os recordes valem só para esta sessão.
        </p>
      )}

      {grupos.map(({ categoria, jogos }) => (
        <section key={categoria} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-tenue uppercase">
            {ROTULO_CATEGORIA[categoria]}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {jogos.map((jogo) => (
              <li key={jogo.id}>
                <CartaoJogo jogo={jogo} entrada={recordeDe(jogo.id)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function CartaoJogo({
  jogo,
  entrada,
}: {
  jogo: JogoModule
  entrada: ReturnType<ReturnType<typeof useRecordes>['recordeDe']>
}) {
  return (
    <a
      href={href({ nome: 'jogo', jogoId: jogo.id })}
      className="flex h-full flex-col gap-2 rounded-xl border border-borda bg-superficie p-4 transition-colors hover:border-acento hover:bg-superficie-alta"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="font-mono text-2xl text-acento">
          {jogo.icone}
        </span>
        <h3 className="font-semibold">{jogo.nome}</h3>
      </div>
      <p className="text-sm text-suave">{jogo.resumo}</p>
      <p className="mt-auto pt-1 text-sm text-tenue">
        {entrada
          ? `recorde: ${comUnidade(entrada.recorde.pontuacao, jogo.unidade)} · ${quando(entrada.recorde.emISO)}`
          : 'ainda sem recorde'}
      </p>
    </a>
  )
}
