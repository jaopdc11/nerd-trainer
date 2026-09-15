import { useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
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
              bloqueado={sessao.correcao !== null}
              placeholder={sessao.carta.dica ?? 'resposta e Enter'}
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
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-borda bg-superficie p-6">
      <p className="text-suave">
        {config.fim === 'morte-subita'
          ? 'Um erro encerra a partida.'
          : 'O baralho vai até o fim — errar custa o ponto, não a partida.'}
      </p>
      <p className="text-sm text-tenue">
        {recorde === null
          ? 'ainda sem recorde'
          : `seu recorde: ${comUnidade(recorde, jogo.unidade)}`}
      </p>
      <button
        type="button"
        onClick={onIniciar}
        className="rounded-lg bg-acento px-6 py-3 text-lg font-semibold text-fundo transition-opacity hover:opacity-90"
      >
        Começar
      </button>
    </div>
  )
}

function Progresso({ sessao, recorde }: { sessao: SessaoFlashcard; recorde: number | null }) {
  const superou = recorde !== null && sessao.acertos > recorde

  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="font-mono text-4xl tabular font-bold">
        {sessao.acertos}
        {sessao.total > 0 && <span className="text-xl text-tenue">/{sessao.total}</span>}
      </p>
      <p className={`text-sm ${superou ? 'text-acento' : 'text-tenue'}`}>
        {superou ? 'recorde batido!' : recorde !== null ? `recorde: ${recorde}` : ''}
      </p>
    </div>
  )
}

function Pergunta({ sessao }: { sessao: SessaoFlashcard }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-borda bg-superficie p-6 text-center">
      {sessao.carta && <Render conteudo={sessao.carta.pergunta} />}
      {sessao.correcao !== null && (
        <p className="motion-safe:animate-surgir text-lg text-erro">
          era <strong className="text-acento">{sessao.correcao}</strong>
        </p>
      )}
    </div>
  )
}

export function Render({ conteudo, classe }: { conteudo: Conteudo; classe?: string }) {
  if (conteudo.kind === 'mathml') {
    // MathML pré-renderizado no build a partir do LaTeX do dataset. Nunca vem de
    // entrada do jogador, por isso é seguro injetar.
    // biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle
    return <div className={classe ?? 'text-3xl'} dangerouslySetInnerHTML={{ __html: conteudo.valor }} />
  }
  return <p className={classe ?? 'text-3xl font-semibold'}>{conteudo.valor}</p>
}

function Alternativas({ sessao }: { sessao: SessaoFlashcard }) {
  if (sessao.carta?.tipo !== 'escolha') return null

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sessao.carta.alternativas.map((alt, i) => (
        <li key={`${sessao.carta?.id}-${i}`}>
          <button
            type="button"
            disabled={sessao.correcao !== null}
            onClick={() => sessao.escolher(i)}
            className="flex h-full w-full items-center justify-center rounded-xl border border-borda bg-superficie p-4 transition-colors hover:border-acento hover:bg-superficie-alta disabled:opacity-50"
          >
            <Render conteudo={alt} classe="text-xl" />
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
    <section className="motion-safe:animate-surgir flex flex-col items-start gap-4 rounded-xl border border-borda bg-superficie p-6">
      <h2 className="text-2xl font-bold">
        {zerou ? 'Baralho inteiro!' : bateu ? 'Recorde novo' : 'Fim da partida'}
      </h2>
      <p className="text-suave">
        {comUnidade(sessao.acertos, jogo.unidade)}
        {sessao.total > 0 && ` de ${sessao.total}`} · {duracao(sessao.duracaoMs)}
        {sessao.erros > 0 && ` · ${sessao.erros} erro${sessao.erros > 1 ? 's' : ''}`}
      </p>
      {sessao.correcao !== null && (
        <p className="text-lg">
          a resposta era <strong className="text-acento">{sessao.correcao}</strong>
        </p>
      )}
      <button
        type="button"
        onClick={sessao.iniciar}
        className="rounded-lg bg-acento px-6 py-3 font-semibold text-fundo transition-opacity hover:opacity-90"
      >
        De novo
      </button>
    </section>
  )
}
