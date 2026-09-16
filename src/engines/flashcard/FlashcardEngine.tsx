import { useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
import { MetaNerdometro } from '@/components/MetaNerdometro'
import { Barra, Botao, Etiqueta, Painel, Placar } from '@/components/ui'
import { useAtalhoPular } from '@/core/useAtalhoPular'
import { desfecho } from '@/core/desfecho'
import type { ResultadoDaRun } from '@/core/desfecho'
import { comUnidade, duracao } from '@/core/format'
import type { LinhaNerdometro } from '@/core/nerdometro'
import type { ConfigFlashcard, Conteudo, JogoFlashcard, ResultadoRun } from '@/core/types'
import { useFlashcard } from './useFlashcard'
import type { SessaoFlashcard } from './useFlashcard'

interface Props {
  readonly jogo: JogoFlashcard
  readonly config: ConfigFlashcard
  readonly onFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void
  readonly recorde: number | null
  readonly run: ResultadoDaRun | null
  /**
   * A linha deste jogo no Nerdômetro, para a abertura mostrar a meta.
   *
   * Opcional porque os testes montam os motores direto, sem o `App`, e ali não
   * há banco para tirar linha nenhuma — exigir a prop transformaria uma tela
   * nova em erro de compilação em arquivo de outra gente. Ausente e `null`
   * querem dizer a mesma coisa: jogo sem meta, e a abertura não inventa uma.
   */
  readonly nerdometro?: LinhaNerdometro | null
}

export function FlashcardEngine({
  jogo,
  config,
  onFinalizar,
  recorde,
  run,
  nerdometro = null,
}: Props) {
  const area = useRef<HTMLDivElement>(null)
  const sessao = useFlashcard(config, onFinalizar)
  useAtalhoPular(sessao.estado === 'jogando' && sessao.correcao === null, sessao.pular)

  return (
    <div ref={area} className="flex flex-col gap-5">
      {sessao.estado === 'pronto' && (
        <Abertura
          jogo={jogo}
          config={config}
          recorde={recorde}
          nerdometro={nerdometro}
          onIniciar={sessao.iniciar}
        />
      )}

      {sessao.estado === 'jogando' && sessao.carta && (
        <>
          <Progresso sessao={sessao} recorde={recorde} />
          <Pergunta sessao={sessao} />

          {/* Recado do jogo, e não retorno sobre a tecla: fica até o fim da
              partida, em painel próprio e em tamanho de quem quer ser lido. É o
              mesmo visual da grade, de propósito — é a mesma coisa. */}
          {sessao.nota && (
            <p className="motion-safe:animate-surgir rounded-xl border border-erro/40 bg-erro-fundo/30 px-4 py-2.5 text-center text-base font-semibold text-erro sm:text-lg">
              {sessao.nota}
            </p>
          )}

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

          {/* Pular é ação FREQUENTE, não saída de emergência: num baralho de 195
              bandeiras ninguém sabe todas. A primeira versão era um texto cinza
              de 12px e o usuário simplesmente não viu. Botão de verdade, com o
              atalho à vista, porque a mão já está no teclado. */}
          {sessao.correcao === null && (
            <button
              type="button"
              onClick={sessao.pular}
              className="group mx-auto flex items-center gap-2.5 rounded-xl border border-borda bg-superficie px-4 py-2 text-sm text-suave transition-colors hover:border-borda-forte hover:bg-superficie-alta hover:text-texto"
            >
              não sei — pular
              <kbd className="rounded-md border border-borda-forte px-1.5 py-0.5 font-mono text-[0.65rem] text-tenue group-hover:text-suave">
                Esc
              </kbd>
            </button>
          )}
        </>
      )}

      {sessao.estado === 'fim' && <Fim jogo={jogo} sessao={sessao} recorde={recorde} run={run} />}
    </div>
  )
}

function Abertura({
  jogo,
  config,
  recorde,
  nerdometro,
  onIniciar,
}: {
  jogo: JogoFlashcard
  config: ConfigFlashcard
  recorde: number | null
  nerdometro: LinhaNerdometro | null
  onIniciar: () => void
}) {
  const morteSubita = config.fim === 'morte-subita'

  return (
    <Painel className="flex flex-col items-center gap-5 p-6 text-center">
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

      {/* Logo abaixo do recorde, e não no topo: a ordem de leitura vira
          "o que você fez · o alvo · começar". No topo, a meta competiria com a
          etiqueta que diz a regra da mecânica, que é o que decide a partida. */}
      <MetaNerdometro linha={nerdometro} />

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
  if (conteudo.kind === 'imagem') {
    return (
      <img
        src={conteudo.valor}
        alt={conteudo.alt}
        // `contain` porque as proporções variam: a Suíça é quadrada, o Catar é
        // quase 1:2. Esticar deformaria justamente o que se pede para reconhecer.
        //
        // A altura depende do que a figura é. Quadro pede o dobro de bandeira e
        // ainda assim fica limitado pela altura da janela (`vh`), porque a carta
        // divide a tela com o campo de resposta e com o botão de pular.
        className={`w-auto max-w-full rounded-lg border border-borda object-contain shadow-lg ${
          conteudo.tamanho === 'quadro' ? 'h-[38vh] max-h-96 sm:h-[42vh]' : 'h-32 sm:h-44'
        }`}
      />
    )
  }
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
  run,
}: {
  jogo: JogoFlashcard
  sessao: SessaoFlashcard
  recorde: number | null
  run: ResultadoDaRun | null
}) {
  const fim = desfecho(sessao.acertos, run, recorde)
  const zerou = sessao.total > 0 && sessao.acertos === sessao.total

  return (
    <Painel className="cascata flex flex-col items-start gap-5 p-6">
      <h2 className="fonte-display text-2xl font-bold">
        {zerou ? (
          <span className="text-acento">Baralho inteiro!</span>
        ) : fim === 'superou' ? (
          <span className="text-acento">Recorde novo</span>
        ) : fim === 'empatou' ? (
          <span className="text-quase">Empatou o recorde</span>
        ) : (
          'Fim da partida'
        )}
      </h2>

      <Placar
        valor={sessao.acertos}
        total={sessao.total > 0 ? sessao.total : undefined}
        sufixo={jogo.unidade.plural}
        destacado={fim === 'superou'}
        contar
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
