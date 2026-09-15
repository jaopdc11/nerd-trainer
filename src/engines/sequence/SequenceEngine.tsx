import { useEffect, useMemo, useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
import { Botao, Etiqueta, Painel, Placar } from '@/components/ui'
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
  const superou = recorde !== null && sessao.indice > recorde

  return (
    <div ref={area} className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <Placar
          valor={sessao.indice}
          sufixo={sessao.indice === 1 ? jogo.unidade.singular : jogo.unidade.plural}
          destacado={superou}
        />
        <MarcaDeRecorde recorde={recorde} superou={superou} />
      </div>

      <Fita sessao={sessao} config={config} />

      <AnswerInput
        modo={config.entrada === 'caractere' ? 'caractere' : 'linha'}
        teclado={config.teclado}
        onCaractere={sessao.digitar}
        onEnviar={sessao.enviar}
        bloqueado={acabou}
        placeholder={config.entrada === 'caractere' ? 'digite' : 'digite e tecle Enter'}
        rotuloAria={`Próximo item de ${jogo.nome}`}
        ancora={area}
      />

      {acabou && <Revisao sessao={sessao} jogo={jogo} config={config} recorde={recorde} />}
    </div>
  )
}

function MarcaDeRecorde({ recorde, superou }: { recorde: number | null; superou: boolean }) {
  if (recorde === null) {
    return <span className="pb-1 text-sm text-tenue">sem recorde ainda</span>
  }
  return (
    <Etiqueta
      className={
        superou
          ? 'mb-1 border-acento bg-acento-fundo text-acento motion-safe:animate-respirar'
          : 'mb-1 text-tenue'
      }
    >
      {superou ? `superou ${recorde}` : `recorde ${recorde}`}
    </Etiqueta>
  )
}

/**
 * A fita mostra só os últimos itens acertados, e não a sequência inteira.
 *
 * Renderizar 10 mil dígitos como 10 mil elementos faz o re-render por tecla
 * engasgar no celular já na casa 400 — e ninguém lê mais do que as duas últimas
 * linhas mesmo. A contagem cheia fica no placar.
 */
function Fita({ sessao, config }: { sessao: Sessao; config: ConfigSequencia }) {
  const primeiroIndice = sessao.indice - sessao.acertados.length
  const morreu = sessao.estado === 'morto'

  const blocos = useMemo(() => {
    const agrupar = config.agrupar ?? 0
    const sep = config.separador ?? ''
    if (agrupar <= 0) return [sessao.acertados.join(sep)]

    const saida: string[] = []
    let atual: string[] = []
    sessao.acertados.forEach((item, i) => {
      atual.push(item)
      if ((primeiroIndice + i + 1) % agrupar === 0) {
        saida.push(atual.join(sep))
        atual = []
      }
    })
    if (atual.length > 0) saida.push(atual.join(sep))
    return saida
  }, [sessao.acertados, primeiroIndice, config.agrupar, config.separador])

  const fim = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'nearest', inline: 'end' })
  }, [])

  return (
    <Painel className="min-h-32 p-5">
      <p className="font-mono text-xl leading-relaxed break-all text-texto">
        {primeiroIndice === 0 && config.prefixo && (
          <span className="text-tenue">{config.prefixo}</span>
        )}
        {primeiroIndice > 0 && <span className="text-tenue">… </span>}
        {blocos.map((bloco, i) => (
          // A fita só cresce, então a posição do bloco é estável na partida.
          // biome-ignore lint/suspicious/noArrayIndexKey: índice estável por construção
          <span key={i} className="mr-2.5 inline-block">
            {bloco}
          </span>
        ))}
        {sessao.erro && (
          <span className="rounded bg-erro-fundo px-1 text-erro line-through">
            {sessao.erro.digitado}
          </span>
        )}
        {!morreu && (
          <span ref={fim} className="ml-0.5 text-acento motion-safe:animate-respirar">
            ▍
          </span>
        )}
      </p>
    </Painel>
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
    <Painel className="motion-safe:animate-surgir flex flex-col gap-5 p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="fonte-display text-xl font-bold">
          {completou ? (
            <span className="text-acento">Sequência inteira!</span>
          ) : bateuRecorde ? (
            <span className="text-acento">Recorde novo</span>
          ) : (
            'Fim da partida'
          )}
        </h2>
        <p className="font-mono text-sm text-tenue">
          {comUnidade(sessao.indice, jogo.unidade)} · {duracao(sessao.duracaoMs)}
          {velocidade && ` · ${velocidade}`}
        </p>
      </header>

      {sessao.erro && (
        <p className="font-mono">
          <span className="text-suave">casa {sessao.erro.indice + 1}: você digitou </span>
          <span className="rounded-md bg-erro-fundo px-2 py-1 text-erro">
            {sessao.erro.digitado}
          </span>
          <span className="text-suave">, era </span>
          <span className="rounded-md bg-acento-fundo px-2 py-1 text-acento">
            {sessao.erro.esperado}
          </span>
        </p>
      )}

      {sessao.proximos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-suave">O que vinha a seguir — decore antes de repetir:</p>
          <p className="rounded-xl border border-acento/30 bg-acento-fundo/25 px-4 py-3 font-mono text-2xl tracking-wide break-all text-acento">
            {sessao.proximos.join(sep)}
          </p>
        </div>
      )}

      <Botao onClick={sessao.reiniciar} className="self-start">
        Tentar de novo
      </Botao>
    </Painel>
  )
}
