import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell } from '@/components/GameShell'
import { Menu } from '@/components/Menu'
import { Records } from '@/components/Records'
import { FlashcardEngine } from '@/engines/flashcard/FlashcardEngine'
import { GeneratorEngine } from '@/engines/generator/GeneratorEngine'
import { GridEngine } from '@/engines/grid/GridEngine'
import { SequenceEngine } from '@/engines/sequence/SequenceEngine'
import type { ResultadoDaRun } from '@/core/desfecho'
import { buscarJogo } from '@/core/registry'
import { navegar, useRota } from '@/core/route'
import type { JogoModule, ResultadoRun } from '@/core/types'
import { useRecordes } from '@/core/useRecords'

export function App() {
  const rota = useRota()

  // A tabela periódica se autolimita pela altura, então ali o container pode ser
  // apertado; o resto usa a largura da tela. Só os textos longos ganham um
  // limite próprio lá dentro, porque linha larga demais cansa de ler.
  const mecanica = rota.nome === 'jogo' ? buscarJogo(rota.jogoId)?.mecanica : undefined

  const largura =
    mecanica === 'grade'
      ? 'max-w-[72rem]'
      : mecanica === 'flashcard' || mecanica === 'gerador'
        ? 'max-w-4xl'
        : mecanica === 'sequencia'
          ? 'max-w-6xl'
          : 'max-w-7xl'

  return (
    <div className={`mx-auto min-h-dvh w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${largura}`}>
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
  const [ultimaRun, setUltimaRun] = useState<ResultadoDaRun | null>(null)
  // Ref porque `aoFinalizar` precisa enxergar a gravação anterior da MESMA run
  // sem se recriar a cada uma delas.
  const runRef = useRef<ResultadoDaRun | null>(null)

  /*
   * Fotografa o recorde de antes da partida e o veredito da `registrar`.
   *
   * A sutileza está em "de antes da PARTIDA", não "de antes desta gravação".
   * Uma partida é gravada mais de uma vez: o `useSaveOnExit` salva o parcial a
   * cada troca de aba, e o desfecho vem depois. Se cada gravação refizesse a
   * foto, a segunda leria o recorde que a PRIMEIRA acabou de criar — foi assim
   * que 141 países viraram "Empatou o recorde", comparando a partida com ela
   * mesma. Por isso a foto é tirada uma vez por `runId` e reaproveitada.
   *
   * `superou` acumula pelo mesmo motivo: se o parcial já bateu o recorde, a
   * gravação final devolve `false` (o recorde já é dela), e a partida bateu o
   * recorde mesmo assim.
   */
  const aoFinalizar = useCallback(
    (parcial: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => {
      const anterior = runRef.current
      const mesmaRun = anterior?.runId === parcial.runId

      const recordeAnterior = mesmaRun
        ? anterior.recordeAnterior
        : (recordeDe(jogoId, modoId)?.recorde.pontuacao ?? null)

      const agora = registrarRun({ ...parcial, jogoId, ...(modoId ? { modoId } : {}) })
      const resultado: ResultadoDaRun = {
        runId: parcial.runId,
        recordeAnterior,
        superou: (mesmaRun && anterior.superou) || agora,
      }

      runRef.current = resultado
      setUltimaRun(resultado)
    },
    [recordeDe, registrarRun, jogoId, modoId],
  )

  // Trocar de jogo não pode herdar o desfecho do jogo anterior.
  useEffect(() => setUltimaRun(null), [])

  if (!jogo) {
    // Link velho ou digitado errado: volta ao menu sem sujar o histórico.
    navegar({ nome: 'menu' }, true)
    return null
  }

  const recorde = recordeDe(jogo.id, modoId)?.recorde.pontuacao ?? null

  return (
    <GameShell jogo={jogo}>
      <Mecanica jogo={jogo} onFinalizar={aoFinalizar} recorde={recorde} run={ultimaRun} />
    </GameShell>
  )
}

function Mecanica({
  jogo,
  onFinalizar,
  recorde,
  run,
}: {
  jogo: JogoModule
  onFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void
  recorde: number | null
  run: ResultadoDaRun | null
}) {
  switch (jogo.mecanica) {
    case 'sequencia':
      return (
        <SequenceEngine
          jogo={jogo}
          config={jogo.config()}
          onFinalizar={onFinalizar}
          recorde={recorde}
          run={run}
        />
      )
    case 'gerador':
      return (
        <GeneratorEngine
          jogo={jogo}
          config={jogo.config()}
          onFinalizar={onFinalizar}
          recorde={recorde}
          run={run}
        />
      )
    case 'flashcard':
      return (
        <FlashcardEngine
          jogo={jogo}
          config={jogo.config()}
          onFinalizar={onFinalizar}
          recorde={recorde}
          run={run}
        />
      )
    case 'grade':
      return (
        <GridEngine
          jogo={jogo}
          config={jogo.config()}
          onFinalizar={onFinalizar}
          recorde={recorde}
          run={run}
        />
      )
  }
}
