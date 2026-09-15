import { useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
import { comUnidade, cronometro, duracao, taxa } from '@/core/format'
import type { ConfigGerador, Conteudo, JogoGerador, ResultadoRun } from '@/core/types'
import { useGenerator } from './useGenerator'
import type { SessaoGerador } from './useGenerator'

interface Props {
  readonly jogo: JogoGerador
  readonly config: ConfigGerador
  readonly onFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void
  readonly recorde: number | null
}

export function GeneratorEngine({ jogo, config, onFinalizar, recorde }: Props) {
  const area = useRef<HTMLDivElement>(null)
  const sessao = useGenerator(config, onFinalizar)

  return (
    <div ref={area} className="flex flex-col gap-5">
      {sessao.estado === 'pronto' && <Abertura jogo={jogo} config={config} sessao={sessao} />}

      {sessao.estado === 'jogando' && (
        <>
          <Barra sessao={sessao} config={config} />
          <Enunciado sessao={sessao} />
          <AnswerInput
            modo="linha"
            teclado={sessao.exercicio?.teclado ?? config.teclado}
            onEnviar={sessao.responder}
            bloqueado={sessao.correcao !== null}
            placeholder="resposta e Enter"
            rotuloAria="Resposta"
            ancora={area}
          />
        </>
      )}

      {sessao.estado === 'fim' && <Fim jogo={jogo} sessao={sessao} recorde={recorde} />}
    </div>
  )
}

function Abertura({
  jogo,
  config,
  sessao,
}: {
  jogo: JogoGerador
  config: ConfigGerador
  sessao: SessaoGerador
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-borda bg-superficie p-6">
      <p className="text-suave">
        {config.segundosIniciais} segundos no relógio. Cada acerto devolve{' '}
        <strong className="text-acento">+{config.bonusPorAcertoS}s</strong>, até o teto de{' '}
        {config.tetoSegundos}s. Errar não encerra — só custa o tempo que passou.
      </p>
      {recordeLinha(jogo, sessao)}
      <button
        type="button"
        onClick={sessao.iniciar}
        className="rounded-lg bg-acento px-6 py-3 text-lg font-semibold text-fundo transition-opacity hover:opacity-90"
      >
        Começar
      </button>
    </div>
  )
}

function recordeLinha(jogo: JogoGerador, _sessao: SessaoGerador) {
  return (
    <p className="text-sm text-tenue">
      Placar é quantos você acerta antes do relógio zerar — {jogo.unidade.plural}.
    </p>
  )
}

function Barra({ sessao, config }: { sessao: SessaoGerador; config: ConfigGerador }) {
  const fracao = Math.min(1, sessao.restanteMs / (config.tetoSegundos * 1000))
  const acabando = sessao.restanteMs < 10_000

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-4xl tabular font-bold">
          {sessao.acertos}
          <span className="ml-2 text-sm font-normal text-suave">acertos</span>
        </p>
        <p
          className={`font-mono text-3xl tabular font-bold ${
            acabando ? 'text-erro motion-safe:animate-pulse' : 'text-texto'
          }`}
        >
          {cronometro(sessao.restanteMs)}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-superficie-alta">
        <div
          className={`h-full transition-[width] duration-100 ${acabando ? 'bg-erro' : 'bg-acento'}`}
          style={{ width: `${fracao * 100}%` }}
        />
      </div>
      <p className="text-xs text-tenue">nível {sessao.nivel + 1}</p>
    </div>
  )
}

function Enunciado({ sessao }: { sessao: SessaoGerador }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-borda bg-superficie p-6">
      {sessao.exercicio && <Render conteudo={sessao.exercicio.enunciado} />}
      {sessao.correcao !== null && (
        <p className="motion-safe:animate-surgir font-mono text-xl text-erro">
          era <strong className="text-acento">{sessao.correcao}</strong>
        </p>
      )}
    </div>
  )
}

function Render({ conteudo }: { conteudo: Conteudo }) {
  if (conteudo.kind === 'mathml') {
    // O MathML vem pré-renderizado no build a partir do LaTeX do dataset, nunca
    // de entrada do jogador — daí ser seguro injetar aqui.
    // biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do próprio bundle
    return <div dangerouslySetInnerHTML={{ __html: conteudo.valor }} className="text-3xl" />
  }
  return <p className="text-center font-mono text-4xl tabular">{conteudo.valor}</p>
}

function Fim({
  jogo,
  sessao,
  recorde,
}: {
  jogo: JogoGerador
  sessao: SessaoGerador
  recorde: number | null
}) {
  const bateu = recorde === null || sessao.acertos > recorde
  const velocidade = taxa(sessao.acertos, sessao.duracaoMs, jogo.unidade)

  return (
    <section className="motion-safe:animate-surgir flex flex-col items-start gap-4 rounded-xl border border-borda bg-superficie p-6">
      <h2 className="text-2xl font-bold">{bateu ? 'Recorde novo' : 'Tempo esgotado'}</h2>
      <p className="text-suave">
        {comUnidade(sessao.acertos, jogo.unidade)} em {duracao(sessao.duracaoMs)}
        {velocidade && ` · ${velocidade}`}
        {sessao.erros > 0 && ` · ${sessao.erros} erro${sessao.erros > 1 ? 's' : ''}`}
      </p>
      {!bateu && recorde !== null && (
        <p className="text-sm text-tenue">
          seu recorde é {comUnidade(recorde, jogo.unidade)} — faltaram {recorde - sessao.acertos + 1}
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
