import { useCallback } from 'react'
import { GameShell } from '@/components/GameShell'
import { Menu } from '@/components/Menu'
import { Records } from '@/components/Records'
import { FlashcardEngine } from '@/engines/flashcard/FlashcardEngine'
import { GeneratorEngine } from '@/engines/generator/GeneratorEngine'
import { GridEngine } from '@/engines/grid/GridEngine'
import { SequenceEngine } from '@/engines/sequence/SequenceEngine'
import { buscarJogo } from '@/core/registry'
import { navegar, useRota } from '@/core/route'
import type { JogoModule, ResultadoRun } from '@/core/types'
import { useRecordes } from '@/core/useRecords'

export function App() {
  const rota = useRota()

  // A tabela periódica tem 18 colunas: espremê-la em `max-w-2xl` era o que
  // deixava as células ilegíveis. As outras telas são de leitura e continuam
  // estreitas, que é onde texto se lê melhor.
  const largo = rota.nome === 'jogo' && buscarJogo(rota.jogoId)?.mecanica === 'grade'

  return (
    <div
      className={`mx-auto min-h-dvh w-full px-4 ${
        largo ? 'max-w-[68rem] py-4' : 'max-w-2xl py-6 sm:py-10'
      }`}
    >
      {rota.nome === 'jogo' ? (
        <Jogo jogoId={rota.jogoId} modoId={rota.modoId} />
      ) : rota.nome === 'recordes' ? (
        <Records />
      ) : (
        <Menu />
      )}
    </div>
  )
}

function Jogo({ jogoId, modoId }: { jogoId: string; modoId?: string }) {
  const jogo = buscarJogo(jogoId)
  const { recordeDe, registrarRun } = useRecordes()

  const aoFinalizar = useCallback(
    (parcial: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => {
      registrarRun({ ...parcial, jogoId, ...(modoId ? { modoId } : {}) })
    },
    [registrarRun, jogoId, modoId],
  )

  if (!jogo) {
    // Link velho ou digitado errado: volta ao menu sem sujar o histórico.
    navegar({ nome: 'menu' }, true)
    return null
  }

  const recorde = recordeDe(jogo.id, modoId)?.recorde.pontuacao ?? null

  return (
    <GameShell jogo={jogo}>
      <Mecanica jogo={jogo} onFinalizar={aoFinalizar} recorde={recorde} />
    </GameShell>
  )
}

function Mecanica({
  jogo,
  onFinalizar,
  recorde,
}: {
  jogo: JogoModule
  onFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void
  recorde: number | null
}) {
  switch (jogo.mecanica) {
    case 'sequencia':
      return (
        <SequenceEngine
          jogo={jogo}
          config={jogo.config()}
          onFinalizar={onFinalizar}
          recorde={recorde}
        />
      )
    case 'gerador':
      return (
        <GeneratorEngine
          jogo={jogo}
          config={jogo.config()}
          onFinalizar={onFinalizar}
          recorde={recorde}
        />
      )
    case 'flashcard':
      return (
        <FlashcardEngine
          jogo={jogo}
          config={jogo.config()}
          onFinalizar={onFinalizar}
          recorde={recorde}
        />
      )
    case 'grade':
      return (
        <GridEngine
          jogo={jogo}
          config={jogo.config()}
          onFinalizar={onFinalizar}
          recorde={recorde}
        />
      )
  }
}
