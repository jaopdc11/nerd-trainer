import { useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
import { Barra, Botao, Etiqueta, Painel, Placar } from '@/components/ui'
import { useAtalhoPular } from '@/core/useAtalhoPular'
import { desfecho, faltaParaRecorde, marcaAnterior } from '@/core/desfecho'
import type { ResultadoDaRun } from '@/core/desfecho'
import { comUnidade, cronometro, duracao, taxa } from '@/core/format'
import type { ConfigGerador, Conteudo, JogoGerador, ResultadoRun } from '@/core/types'
import { useGenerator } from './useGenerator'
import type { SessaoGerador } from './useGenerator'

interface Props {
  readonly jogo: JogoGerador
  readonly config: ConfigGerador
  readonly onFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void
  readonly recorde: number | null
  readonly run: ResultadoDaRun | null
}

export function GeneratorEngine({ jogo, config, onFinalizar, recorde, run }: Props) {
  const area = useRef<HTMLDivElement>(null)
  const sessao = useGenerator(config, onFinalizar)
  useAtalhoPular(sessao.estado === 'jogando' && sessao.correcao === null, sessao.pular)

  return (
    <div ref={area} className="flex flex-col gap-5">
      {sessao.estado === 'pronto' && (
        <Abertura jogo={jogo} config={config} recorde={recorde} onIniciar={sessao.iniciar} />
      )}

      {sessao.estado === 'jogando' && (
        <>
          <Cronometro sessao={sessao} config={config} recorde={recorde} />
          <Enunciado sessao={sessao} />

          {sessao.exercicio?.tipo === 'escolha' ? (
            <Alternativas sessao={sessao} />
          ) : (
            <AnswerInput
              modo="linha"
              teclado={
                sessao.exercicio?.tipo === 'digitado'
                  ? (sessao.exercicio.teclado ?? config.teclado)
                  : config.teclado
              }
              onEnviar={sessao.responder}
              autoCommit={sessao.podeAutoCommitar}
              bloqueado={sessao.correcao !== null}
              placeholder="resposta"
              rotuloAria="Resposta"
              ancora={area}
            />
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
  onIniciar,
}: {
  jogo: JogoGerador
  config: ConfigGerador
  recorde: number | null
  onIniciar: () => void
}) {
  return (
    <Painel className="flex flex-col items-center gap-5 p-6 text-center">
      <div className="flex flex-wrap gap-2">
        <Etiqueta className="text-texto">{config.segundosIniciais}s iniciais</Etiqueta>
        <Etiqueta className="border-acento/40 text-acento">
          +{config.bonusPorAcertoS}s por acerto
        </Etiqueta>
        <Etiqueta className="text-tenue">teto {config.tetoSegundos}s</Etiqueta>
      </div>

      <p className="text-suave">
        Errar não encerra a partida — só custa o tempo que passou. Ela acaba quando o relógio
        zera, e o placar é quantos {jogo.unidade.plural} você fez.
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

function Cronometro({
  sessao,
  config,
  recorde,
}: {
  sessao: SessaoGerador
  config: ConfigGerador
  recorde: number | null
}) {
  const acabando = sessao.restanteMs < 10_000
  const superou = recorde !== null && sessao.acertos > recorde

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-end justify-between gap-4">
        <Placar valor={sessao.acertos} sufixo="acertos" destacado={superou} />
        <p
          className={`font-mono text-4xl tabular font-bold transition-colors ${
            acabando ? 'text-erro motion-safe:animate-respirar' : 'text-texto'
          }`}
        >
          {cronometro(sessao.restanteMs)}
        </p>
      </div>

      <Barra fracao={sessao.restanteMs / (config.tetoSegundos * 1000)} alerta={acabando} />

      <div className="flex items-center justify-between">
        <Etiqueta className="text-tenue">nível {sessao.nivel + 1}</Etiqueta>
        {superou && <span className="text-xs text-acento">recorde batido</span>}
      </div>
    </div>
  )
}

function Enunciado({ sessao }: { sessao: SessaoGerador }) {
  return (
    <Painel className="flex min-h-36 flex-col items-center justify-center gap-3 p-6">
      {sessao.exercicio && (
        // A key troca a cada exercício, o que reinicia a animação de entrada e
        // deixa claro que veio uma pergunta nova.
        <div key={sessao.exercicio.chave} className="motion-safe:animate-surgir">
          <Render conteudo={sessao.exercicio.enunciado} />
        </div>
      )}
      {sessao.correcao !== null && (
        <p className="motion-safe:animate-surgir font-mono text-lg text-suave">
          era <strong className="text-acento">{sessao.correcao}</strong>
        </p>
      )}
      {/* Só as armadilhas trazem isto: o valor sozinho não ensina por que a
          regra decorada falhou ali. */}
      {sessao.correcao !== null && sessao.exercicio?.porque && (
        <p className="motion-safe:animate-surgir max-w-prose text-center text-sm text-tenue">
          {sessao.exercicio.porque}
        </p>
      )}
    </Painel>
  )
}

function Alternativas({ sessao }: { sessao: SessaoGerador }) {
  if (sessao.exercicio?.tipo !== 'escolha') return null

  return (
    // Entrada escalonada, como no flashcard: quatro opções aparecendo juntas de
    // supetão é um bloco piscando; uma atrás da outra o olho acompanha a ordem
    // em que vai ler. O `--i` é o índice, e a `.escalonar` cuida do atraso.
    <ul className="escalonar grid gap-3 sm:grid-cols-2">
      {sessao.exercicio.alternativas.map((alt, i) => (
        <li key={`${sessao.exercicio?.chave}-${i}`} style={{ '--i': i } as React.CSSProperties}>
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
            <span className="font-mono text-lg sm:text-xl">{alt.valor}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Render({ conteudo }: { conteudo: Conteudo }) {
  if (conteudo.kind === 'mathml') {
    // MathML pré-renderizado no build a partir do LaTeX do dataset, nunca de
    // entrada do jogador — daí ser seguro injetar.
    // biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle
    return <div dangerouslySetInnerHTML={{ __html: conteudo.valor }} className="text-3xl" />
  }
  return <p className="text-center font-mono text-4xl tabular sm:text-5xl">{conteudo.valor}</p>
}

function Fim({
  jogo,
  sessao,
  recorde,
  run,
}: {
  jogo: JogoGerador
  sessao: SessaoGerador
  recorde: number | null
  run: ResultadoDaRun | null
}) {
  const fim = desfecho(sessao.acertos, run, recorde)
  const falta = faltaParaRecorde(sessao.acertos, run, recorde)
  const velocidade = taxa(sessao.acertos, sessao.duracaoMs, jogo.unidade)

  return (
    <Painel className="cascata flex flex-col items-start gap-5 p-6">
      <h2 className="fonte-display text-2xl font-bold">
        {fim === 'superou' ? (
          <span className="text-acento">Recorde novo</span>
        ) : fim === 'empatou' ? (
          <span className="text-quase">Empatou o recorde</span>
        ) : (
          'Tempo esgotado'
        )}
      </h2>

      <Placar
        valor={sessao.acertos}
        sufixo={jogo.unidade.plural}
        destacado={fim === 'superou'}
        contar
      />

      <p className="font-mono text-sm text-tenue">
        {duracao(sessao.duracaoMs)}
        {velocidade && ` · ${velocidade}`}
        {sessao.erros > 0 && ` · ${sessao.erros} erro${sessao.erros > 1 ? 's' : ''}`}
      </p>

      {falta !== null && (
        <p className="text-sm text-suave">
          faltaram <strong className="text-texto">{falta}</strong> para o seu recorde de{' '}
          {marcaAnterior(run, recorde)}
        </p>
      )}

      {fim === 'empatou' && (
        <p className="text-sm text-suave">
          é o seu recorde na mosca — <strong className="text-texto">1</strong> a mais e ele muda
        </p>
      )}

      <Botao onClick={sessao.iniciar}>De novo</Botao>
    </Painel>
  )
}
