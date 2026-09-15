import { comUnidade, quando } from '@/core/format'
import { JOGOS, porCategoria } from '@/core/registry'
import { href } from '@/core/route'
import { persistenciaIndisponivel } from '@/core/storage'
import type { Entrada } from '@/core/storage'
import { ROTULO_CATEGORIA } from '@/core/types'
import type { JogoModule } from '@/core/types'
import { useRecordes } from '@/core/useRecords'
import { Nerdometro } from './Nerdometro'
import { CORES_CATEGORIA, Etiqueta } from './ui'

export function Menu() {
  const { banco, recordeDe } = useRecordes()
  const grupos = porCategoria()

  const partidas = Object.values(banco.entradas).reduce((s, e) => s + e.partidas, 0)
  const jogados = Object.keys(banco.entradas).length

  return (
    <div className="flex flex-col gap-10">
      <Capa partidas={partidas} jogados={jogados} />

      <Nerdometro banco={banco} />

      {persistenciaIndisponivel() && (
        <p className="rounded-xl border border-quase/40 bg-quase-fundo/60 px-4 py-3 text-sm text-quase">
          Este navegador não está guardando dados: os recordes valem só para esta sessão.
        </p>
      )}

      {grupos.map(({ categoria, jogos }) => (
        <section key={categoria} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2
              className={`fonte-display text-sm font-semibold tracking-[0.2em] uppercase ${CORES_CATEGORIA[categoria].texto}`}
            >
              {ROTULO_CATEGORIA[categoria]}
            </h2>
            <span className="h-px flex-1 bg-borda" />
            <span className="font-mono text-xs text-tenue">{jogos.length}</span>
          </div>

          <ul className="escalonar grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {jogos.map((jogo, i) => (
              <li key={jogo.id} style={{ '--i': i } as React.CSSProperties}>
                <CartaoJogo jogo={jogo} entrada={recordeDe(jogo.id)} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="border-t border-borda pt-6 pb-2 text-center text-xs text-tenue">
        {JOGOS.length} jogos · tudo guardado só neste navegador
      </footer>
    </div>
  )
}

function Capa({ partidas, jogados }: { partidas: number; jogados: number }) {
  return (
    <header className="flex flex-col gap-5 pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="fonte-display text-5xl leading-none font-bold sm:text-6xl">
            Nerd<span className="text-acento">Trainer</span>
          </h1>
        </div>

        <a
          href={href({ nome: 'recordes' })}
          className="shrink-0 rounded-xl border border-borda bg-superficie/70 px-4 py-2.5 text-sm text-suave transition-colors hover:border-acento hover:text-texto"
        >
          recordes
        </a>
      </div>

      {partidas > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Etiqueta className="text-acento">
            {partidas} partida{partidas > 1 ? 's' : ''}
          </Etiqueta>
          <Etiqueta className="text-suave">
            {jogados} de {JOGOS.length} jogos
          </Etiqueta>
        </div>
      )}
    </header>
  )
}

function CartaoJogo({ jogo, entrada }: { jogo: JogoModule; entrada: Entrada | null }) {
  const cor = CORES_CATEGORIA[jogo.categoria]

  return (
    <a
      href={href({ nome: 'jogo', jogoId: jogo.id })}
      // `group` para o ícone e a borda reagirem juntos; o translate dá a
      // sensação de o cartão levantar sob o cursor.
      className={`group flex h-full flex-col gap-3 rounded-2xl border border-borda bg-superficie/70 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-superficie-alta motion-safe:hover:-translate-y-0.5 ${cor.borda}`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`grid size-11 shrink-0 place-items-center rounded-xl font-mono text-lg font-bold transition-transform duration-200 motion-safe:group-hover:scale-110 ${cor.fundo} ${cor.texto}`}
        >
          {jogo.icone}
        </span>
        <h3 className="fonte-display leading-tight font-semibold">{jogo.nome}</h3>
      </div>

      <p className="text-sm leading-snug text-suave">{jogo.resumo}</p>

      <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
        {entrada ? (
          <>
            <span className="font-mono text-sm text-acento">
              {comUnidade(entrada.recorde.pontuacao, jogo.unidade)}
            </span>
            <span className="text-xs text-tenue">{quando(entrada.recorde.emISO)}</span>
          </>
        ) : (
          <span className="text-xs text-tenue">nunca jogado</span>
        )}
      </div>
    </a>
  )
}
