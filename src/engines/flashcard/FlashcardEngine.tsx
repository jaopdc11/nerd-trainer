import { useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
import { Barra, Botao, Etiqueta, Painel, Placar } from '@/components/ui'
import { comUnidade, duracao } from '@/core/format'
import type { ConfigFlashcard, Conteudo, JogoFlashcard, ResultadoRun } from '@/core/types'
import { useFlashcard } from './useFlashcard'
import type { SessaoFlashcard } from './useFlashcard'

interface Props {
  readonly jogo: JogoFlashcard
  readonly config: ConfigFlashcard
  readonly onFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void
  readonly recorde: number | null
}

export function FlashcardEngine({ jogo, config, onFinalizar, recorde }: Props) {
  const area = useRef<HTMLDivElement>(null)
  const sessao = useFlashcard(config, onFinalizar)

  return (
    <div ref={area} className="flex flex-col gap-5">
      {sessao.estado === 'pronto' && (
        <Abertura jogo={jogo} config={config} recorde={recorde} onIniciar={sessao.iniciar} />
      )}

      {sessao.estado === 'jogando' && sessao.carta && (
        <>
          <Progresso sessao={sessao} recorde={recorde} />
          <Pergunta sessao={sessao} />

          {sessao.carta.tipo === 'digitada' ? (
            <AnswerInput
              modo="linha"
              teclado={config.teclado}
              onEnviar={sessao.responder}
              autoCommit={sessao.podeAutoCommitar}
              bloqueado={sessao.correcao !== null}
              placeholder={sessao.carta.dica ?? 'resposta'}
              rotuloAria="Resposta"
              ancora={area}
            />
          ) : (
            <Alternativas sessao={sessao} />
          )}
        </>
      )}

      {sessao.estado === 'fim' && <Fim jogo={jogo} sessao={sessao} recorde={recorde} />}
    </div>
  )
}

function Abertura({
  jogo,
  config,
  recorde,
  onIniciar,
}: {
  jogo: JogoFlashcard
  config: ConfigFlashcard
  recorde: number | null
  onIniciar: () => void
}) {
  const morteSubita = config.fim === 'morte-subita'

  return (
    <Painel className="flex flex-col items-start gap-5 p-6">
      <Etiqueta className={morteSubita ? 'border-erro/40 text-erro' : 'text-acento'}>
        {morteSubita ? 'morte súbita' : 'baralho completo'}
      </Etiqueta>

      <p className="text-suave">
        {morteSubita
          ? 'Um erro encerra a partida — o placar é até onde você chegou.'
          : 'O baralho vai até a última carta. Errar custa o ponto, não a partida.'}
      </p>

      {recorde !== null && (
        <p className="font-mono text-sm text-tenue">
          seu recorde: <span className="text-acento">{comUnidade(recorde, jogo.unidade)}</span>
        </p>
      )}

      <Botao onClick={onIniciar}>Começar</Botao>
    </Painel>
  )
}

function Progresso({ sessao, recorde }: { sessao: SessaoFlashcard; recorde: number | null }) {
  const superou = recorde !== null && sessao.acertos > recorde

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-end justify-between gap-4">
        <Placar
          valor={sessao.acertos}
          total={sessao.total > 0 ? sessao.total : undefined}
          destacado={superou}
        />
        {recorde !== null && (
          <Etiqueta
            className={superou ? 'mb-1 border-acento text-acento' : 'mb-1 text-tenue'}
          >
            {superou ? 'recorde batido' : `recorde ${recorde}`}
          </Etiqueta>
        )}
      </div>
      {sessao.total > 0 && (
        <>
          <Barra fracao={sessao.posicao / sessao.total} variante="progresso" />
          <p className="text-xs text-tenue">
            carta {sessao.posicao + 1} de {sessao.total} · sem tempo, vá com calma
          </p>
        </>
      )}
    </div>
  )
}

function Pergunta({ sessao }: { sessao: SessaoFlashcard }) {
  return (
    <Painel className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
      {sessao.carta && (
        <div key={sessao.carta.id} className="motion-safe:animate-surgir">
          <Render conteudo={sessao.carta.pergunta} />
        </div>
      )}
      {sessao.correcao !== null && (
        <p className="motion-safe:animate-surgir text-suave">
          era <strong className="text-acento">{sessao.correcao}</strong>
        </p>
      )}
    </Painel>
  )
}

function Render({ conteudo, classe }: { conteudo: Conteudo; classe?: string }) {
  if (conteudo.kind === 'mathml') {
    // MathML pré-renderizado no build. Nunca vem de entrada do jogador.
    // biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle
    return (
      <div
        className={classe ?? 'text-3xl sm:text-4xl'}
        dangerouslySetInnerHTML={{ __html: conteudo.valor }}
      />
    )
  }
  return (
    <p className={classe ?? 'fonte-display text-3xl font-semibold sm:text-4xl'}>
      {conteudo.valor}
    </p>
  )
}

function Alternativas({ sessao }: { sessao: SessaoFlashcard }) {
  if (sessao.carta?.tipo !== 'escolha') return null

  return (
    <ul className="escalonar grid gap-3 sm:grid-cols-2">
      {sessao.carta.alternativas.map((alt, i) => (
        <li key={`${sessao.carta?.id}-${i}`} style={{ '--i': i } as React.CSSProperties}>
          <button
            type="button"
            disabled={sessao.correcao !== null}
            onClick={() => sessao.escolher(i)}
            className="flex h-full w-full items-center gap-3 rounded-2xl border border-borda bg-superficie/70 p-4 text-left transition-all duration-200 hover:border-acento hover:bg-superficie-alta disabled:opacity-40 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]"
          >
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-lg border border-borda font-mono text-xs text-tenue"
            >
              {'ABCD'[i]}
            </span>
            <Render conteudo={alt} classe="text-base leading-snug font-medium sm:text-lg" />
          </button>
        </li>
      ))}
    </ul>
  )
}

function Fim({
  jogo,
  sessao,
  recorde,
}: {
  jogo: JogoFlashcard
  sessao: SessaoFlashcard
  recorde: number | null
}) {
  const bateu = recorde === null || sessao.acertos > recorde
  const zerou = sessao.total > 0 && sessao.acertos === sessao.total

  return (
    <Painel className="motion-safe:animate-surgir flex flex-col items-start gap-5 p-6">
      <h2 className="fonte-display text-2xl font-bold">
        {zerou ? (
          <span className="text-acento">Baralho inteiro!</span>
        ) : bateu ? (
          <span className="text-acento">Recorde novo</span>
        ) : (
          'Fim da partida'
        )}
      </h2>

      <Placar
        valor={sessao.acertos}
        total={sessao.total > 0 ? sessao.total : undefined}
        sufixo={jogo.unidade.plural}
        destacado={bateu}
      />

      <p className="font-mono text-sm text-tenue">
        {duracao(sessao.duracaoMs)}
        {sessao.erros > 0 && ` · ${sessao.erros} erro${sessao.erros > 1 ? 's' : ''}`}
      </p>

      {sessao.correcao !== null && (
        <p className="text-suave">
          a resposta era <strong className="text-acento">{sessao.correcao}</strong>
        </p>
      )}

      <Botao onClick={sessao.iniciar}>De novo</Botao>
    </Painel>
  )
}
