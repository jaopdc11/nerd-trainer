import { useState } from 'react'
import { comUnidade, quando } from '@/core/format'
import { JOGOS, porCategoria } from '@/core/registry'
import { href } from '@/core/route'
import { persistenciaIndisponivel } from '@/core/storage'
import type { Entrada } from '@/core/storage'
import { marcarTutorialVisto, tutorialVisto } from '@/core/tutorial'
import { ROTULO_CATEGORIA } from '@/core/types'
import type { JogoModule } from '@/core/types'
import { useRecordes } from '@/core/useRecords'
import { Nerdometro } from './Nerdometro'
import { Tutorial } from './Tutorial'
import { CORES_CATEGORIA, Etiqueta, IconeJogo } from './ui'

export function Menu() {
  const { banco, recordeDe } = useRecordes()
  const grupos = porCategoria()
  // Inicializador preguiçoso: a leitura do `localStorage` acontece uma vez, na
  // montagem, e não a cada render do menu de 72 cartões.
  const [tutorial, setTutorial] = useState(() => !tutorialVisto())

  const partidas = Object.values(banco.entradas).reduce((s, e) => s + e.partidas, 0)
  const jogados = Object.keys(banco.entradas).length

  // Fechar é a única forma de sair do tutorial, então é aqui que ele conta como
  // visto — inclusive quando a pessoa fecha no primeiro passo. Quem não quis a
  // aula não precisa recusá-la toda visita; o botão da capa fica ali.
  const fecharTutorial = () => {
    marcarTutorialVisto()
    setTutorial(false)
  }

  return (
    <div className="flex flex-col gap-10">
      {tutorial && <Tutorial onFechar={fecharTutorial} />}

      <Capa partidas={partidas} jogados={jogados} onTutorial={() => setTutorial(true)} />

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

          <ul className="escalonar grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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

function Capa({
  partidas,
  jogados,
  onTutorial,
}: {
  partidas: number
  jogados: number
  onTutorial: () => void
}) {
  return (
    <header className="flex flex-col gap-5 pt-4">
      {/*
        `flex-wrap` porque o título e os dois cartões não cabem lado a lado em
        tela estreita — e não cabiam nem antes do botão do tutorial: medido em
        320px, a capa vazava 145px da viewport, o que empurrava a página inteira
        para uma rolagem horizontal. Sem o wrap, `justify-between` não tem como
        resolver: ele distribui o espaço que sobra, e aqui não sobrava nenhum.
        Com ele, os cartões descem para a própria linha e a página para de rolar
        de lado.
      */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="fonte-display text-4xl leading-none font-bold min-[400px]:text-5xl sm:text-6xl">
            Nerd<span className="text-acento">Trainer</span>
          </h1>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          {/* O tutorial tem de poder voltar, e a capa é onde se procura por ele.
              No telefone sobra o "?" sozinho: dois cartões lado a lado ao lado
              do título não cabem em 400px. */}
          <button
            type="button"
            onClick={onTutorial}
            className="group flex items-center gap-2.5 rounded-xl border border-borda bg-superficie/70 px-3 py-3 transition-all hover:border-borda-forte hover:bg-superficie-alta sm:px-4 motion-safe:hover:-translate-y-0.5"
          >
            <span aria-hidden className="text-lg text-suave">
              ?
            </span>
            <span className="hidden flex-col text-left leading-tight sm:flex">
              <span className="text-sm font-semibold text-texto">Como funciona</span>
              <span className="text-xs text-tenue">a nota, as metas, a estreia</span>
            </span>
            <span className="sr-only sm:hidden">Como funciona</span>
          </button>

          <a
            href={href({ nome: 'recordes' })}
            className="group flex items-center gap-2.5 rounded-xl border border-borda bg-superficie/70 px-4 py-3 transition-all hover:border-acento hover:bg-superficie-alta motion-safe:hover:-translate-y-0.5"
          >
            <span aria-hidden className="text-lg text-acento">
              ▲
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-texto">Recordes</span>
              <span className="text-xs text-tenue">histórico e evolução</span>
            </span>
          </a>
        </div>
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
        <IconeJogo
          icone={jogo.icone}
          categoria={jogo.categoria}
          className="transition-transform duration-200 motion-safe:group-hover:scale-110"
        />
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
