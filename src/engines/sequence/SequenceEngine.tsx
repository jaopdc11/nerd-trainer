import { useEffect, useMemo, useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
import { comUnidade, duracao, taxa } from '@/core/format'
import type { ConfigSequencia, JogoSequencia, ResultadoRun } from '@/core/types'
import { useSequence } from './useSequence'
import type { Sessao } from './useSequence'

interface Props {
  readonly jogo: JogoSequencia
  readonly config: ConfigSequencia
  readonly onFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void
  readonly recorde: number | null
}

export function SequenceEngine({ jogo, config, onFinalizar, recorde }: Props) {
  const area = useRef<HTMLDivElement>(null)
  const sessao = useSequence(config, onFinalizar)
  const acabou = sessao.estado === 'morto' || sessao.estado === 'completo'

  return (
    <div ref={area} className="flex flex-col gap-5">
      <Placar sessao={sessao} jogo={jogo} recorde={recorde} />

      <Fita sessao={sessao} config={config} />

      <AnswerInput
        modo={config.entrada === 'caractere' ? 'caractere' : 'linha'}
        teclado={config.teclado}
        onCaractere={sessao.digitar}
        onEnviar={sessao.enviar}
        bloqueado={acabou}
        placeholder={config.entrada === 'caractere' ? 'digite…' : 'digite e tecle Enter'}
        rotuloAria={`Próximo item de ${jogo.nome}`}
        ancora={area}
      />

      {acabou && <Revisao sessao={sessao} jogo={jogo} config={config} recorde={recorde} />}
    </div>
  )
}

function Placar({
  sessao,
  jogo,
  recorde,
}: {
  sessao: Sessao
  jogo: JogoSequencia
  recorde: number | null
}) {
  const superou = recorde !== null && sessao.indice > recorde

  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="font-mono text-5xl tabular font-bold text-texto">
        {sessao.indice}
        <span className="ml-2 text-base font-normal text-suave">
          {sessao.indice === 1 ? jogo.unidade.singular : jogo.unidade.plural}
        </span>
      </p>
      <p className={`text-sm ${superou ? 'text-acento' : 'text-tenue'}`}>
        {recorde === null
          ? 'sem recorde ainda'
          : superou
            ? `recorde batido! era ${recorde}`
            : `recorde: ${recorde}`}
      </p>
    </div>
  )
}

/**
 * A fita mostra só os últimos itens acertados, e não a sequência inteira.
 *
 * Renderizar 1000 dígitos como 1000 elementos faz o re-render por tecla
 * engasgar no celular lá pela casa 400 — e ninguém lê mais do que as últimas
 * duas linhas mesmo. A contagem cheia fica no placar.
 */
function Fita({ sessao, config }: { sessao: Sessao; config: ConfigSequencia }) {
  const primeiroIndice = sessao.indice - sessao.acertados.length

  const blocos = useMemo(() => {
    const agrupar = config.agrupar ?? 0
    if (agrupar <= 0) return [sessao.acertados.join(config.separador ?? '')]

    const saida: string[] = []
    let atual: string[] = []
    sessao.acertados.forEach((item, i) => {
      atual.push(item)
      if ((primeiroIndice + i + 1) % agrupar === 0) {
        saida.push(atual.join(config.separador ?? ''))
        atual = []
      }
    })
    if (atual.length > 0) saida.push(atual.join(config.separador ?? ''))
    return saida
  }, [sessao.acertados, primeiroIndice, config.agrupar, config.separador])

  const fim = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'nearest', inline: 'end' })
  }, [])

  return (
    <div className="min-h-28 rounded-xl border border-borda bg-superficie p-4">
      <p className="font-mono text-xl tabular leading-relaxed break-all text-texto">
        {primeiroIndice === 0 && config.prefixo && (
          <span className="text-suave">{config.prefixo}</span>
        )}
        {primeiroIndice > 0 && <span className="text-tenue">… </span>}
        {blocos.map((bloco, i) => (
          // A posição no bloco é estável durante a partida: a fita só cresce.
          // eslint-disable-next-line react-x/no-array-index-key
          <span key={i} className="mr-2 inline-block">
            {bloco}
          </span>
        ))}
        <span ref={fim} className="motion-safe:animate-pulse text-acento">
          ▍
        </span>
      </p>
    </div>
  )
}

function Revisao({
  sessao,
  jogo,
  config,
  recorde,
}: {
  sessao: Sessao
  jogo: JogoSequencia
  config: ConfigSequencia
  recorde: number | null
}) {
  const completou = sessao.estado === 'completo'
  const velocidade = taxa(sessao.indice, sessao.duracaoMs, jogo.unidade)
  const bateuRecorde = recorde === null || sessao.indice > recorde
  const sep = config.separador ?? ''

  return (
    <section className="motion-safe:animate-surgir flex flex-col gap-4 rounded-xl border border-borda bg-superficie p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">
          {completou ? 'Sequência inteira!' : bateuRecorde ? 'Recorde novo' : 'Fim da partida'}
        </h2>
        <p className="text-sm text-suave">
          {comUnidade(sessao.indice, jogo.unidade)} · {duracao(sessao.duracaoMs)}
          {velocidade && ` · ${velocidade}`}
        </p>
      </header>

      {sessao.erro && (
        <p className="font-mono text-lg">
          <span className="text-suave">na casa {sessao.erro.indice + 1} você digitou </span>
          <span className="rounded bg-erro-fundo px-1.5 py-0.5 text-erro">
            {sessao.erro.digitado}
          </span>
          <span className="text-suave">, mas era </span>
          <span className="rounded bg-acento-fundo px-1.5 py-0.5 text-acento">
            {sessao.erro.esperado}
          </span>
        </p>
      )}

      {sessao.proximos.length > 0 && (
        <div>
          <p className="mb-1 text-sm text-suave">O que vinha a seguir — decore antes de repetir:</p>
          <p className="font-mono text-2xl tabular tracking-wide break-all text-acento">
            {sessao.proximos.join(sep)}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={sessao.reiniciar}
        className="self-start rounded-lg bg-acento px-5 py-2.5 font-semibold text-fundo transition-opacity hover:opacity-90"
      >
        Tentar de novo
      </button>
    </section>
  )
}
