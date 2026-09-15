import { useEffect, useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
import { comUnidade, duracao } from '@/core/format'
import type { CelulaGrade, ConfigGrade, JogoGrade, ResultadoRun } from '@/core/types'
import { useGrid } from './useGrid'
import type { SessaoGrade } from './useGrid'

interface Props {
  readonly jogo: JogoGrade
  readonly config: ConfigGrade
  readonly onFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void
  readonly recorde: number | null
}

/** Cor por bloco da tabela. Nunca é a única informação: o texto também muda. */
const COR_GRUPO: Record<string, string> = {
  s: 'bg-[oklch(0.35_0.09_25)] text-[oklch(0.93_0.05_25)]',
  p: 'bg-[oklch(0.35_0.08_230)] text-[oklch(0.93_0.05_230)]',
  d: 'bg-[oklch(0.35_0.07_150)] text-[oklch(0.93_0.05_150)]',
  f: 'bg-[oklch(0.35_0.08_300)] text-[oklch(0.93_0.05_300)]',
}

export function GridEngine({ jogo, config, onFinalizar, recorde }: Props) {
  const area = useRef<HTMLDivElement>(null)
  const sessao = useGrid(config, onFinalizar)

  return (
    <div ref={area} className="flex flex-col gap-4">
      <Cabecalho sessao={sessao} jogo={jogo} recorde={recorde} />

      <Grade sessao={sessao} config={config} />

      {sessao.estado === 'pronto' && (
        <button
          type="button"
          onClick={sessao.iniciar}
          className="self-start rounded-lg bg-acento px-6 py-3 text-lg font-semibold text-fundo transition-opacity hover:opacity-90"
        >
          Começar
        </button>
      )}

      {sessao.estado === 'jogando' && (
        <div className="sticky bottom-0 flex flex-col gap-2 bg-fundo pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {sessao.alvo && (
            <p className="text-center text-suave">
              Qual é o elemento de número atômico{' '}
              <strong className="font-mono text-xl text-acento">{sessao.alvo.rotulo}</strong>?
            </p>
          )}
          <AnswerInput
            modo="linha"
            teclado={config.teclado}
            onEnviar={sessao.responder}
            placeholder={config.ordem === 'livre' ? 'digite o que lembrar' : 'resposta e Enter'}
            rotuloAria="Resposta"
            ancora={area}
          />
          <button
            type="button"
            onClick={sessao.encerrar}
            className="self-center text-sm text-tenue transition-colors hover:text-suave"
          >
            desistir e ver o gabarito
          </button>
        </div>
      )}

      {sessao.estado === 'fim' && <Fim sessao={sessao} jogo={jogo} recorde={recorde} />}
    </div>
  )
}

function Cabecalho({
  sessao,
  jogo,
  recorde,
}: {
  sessao: SessaoGrade
  jogo: JogoGrade
  recorde: number | null
}) {
  const superou = recorde !== null && sessao.acertos > recorde

  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="font-mono text-4xl tabular font-bold">
        {sessao.acertos}
        <span className="text-xl text-tenue">/{sessao.restantes + sessao.acertos}</span>
      </p>
      <p className={`text-sm ${superou ? 'text-acento' : 'text-tenue'}`}>
        {superou
          ? 'recorde batido!'
          : recorde !== null
            ? `recorde: ${comUnidade(recorde, jogo.unidade)}`
            : 'sem recorde ainda'}
      </p>
    </div>
  )
}

/**
 * A grade só exibe — ninguém digita dentro da célula.
 *
 * Essa decisão resolve de uma vez o problema de 18 colunas num celular de
 * 360px: a célula pode ser um quadrado de 2rem, porque é visor, e toda a
 * digitação acontece na barra fixa do rodapé.
 */
function Grade({ sessao, config }: { sessao: SessaoGrade; config: ConfigGrade }) {
  const refUltima = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (sessao.ultima) {
      refUltima.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [sessao.ultima])

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <ul
        className="grid gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${config.colunas}, minmax(2rem, 1fr))`,
          gridTemplateRows: `repeat(${config.linhas}, auto)`,
          minWidth: `${config.colunas * 2.25}rem`,
        }}
      >
        {config.celulas.map((celula) => (
          <Celula
            key={celula.id}
            celula={celula}
            valor={sessao.preenchidas.get(celula.id)}
            alvo={sessao.alvo?.id === celula.id}
            recemAcertada={sessao.ultima === celula.id}
            revelar={sessao.estado === 'fim'}
            mostrarRotulo={config.mostrarRotulos ?? true}
            ref={sessao.ultima === celula.id ? refUltima : undefined}
          />
        ))}
      </ul>
    </div>
  )
}

function Celula({
  celula,
  valor,
  alvo,
  recemAcertada,
  revelar,
  mostrarRotulo,
  ref,
}: {
  celula: CelulaGrade
  valor: string | undefined
  alvo: boolean
  recemAcertada: boolean
  revelar: boolean
  mostrarRotulo: boolean
  ref?: React.Ref<HTMLLIElement>
}) {
  const preenchida = valor !== undefined
  const cor = COR_GRUPO[celula.grupo ?? ''] ?? 'bg-superficie-alta text-texto'

  const classe = preenchida
    ? cor
    : revelar
      ? 'bg-erro-fundo text-erro'
      : alvo
        ? 'bg-acento-fundo ring-2 ring-acento'
        : 'bg-superficie text-tenue'

  return (
    <li
      ref={ref}
      style={{ gridColumn: celula.coluna, gridRow: celula.linha }}
      className={`flex aspect-square flex-col items-center justify-center overflow-hidden rounded border border-borda text-center ${classe} ${
        recemAcertada ? 'motion-safe:animate-surgir' : ''
      }`}
      title={preenchida || revelar ? celula.gabarito : undefined}
    >
      {mostrarRotulo && celula.rotulo && (
        <span className="text-[0.5rem] leading-none opacity-70">{celula.rotulo}</span>
      )}
      <span className="font-mono text-[0.7rem] leading-tight font-semibold">
        {preenchida ? valor : revelar ? celula.gabarito : ''}
      </span>
    </li>
  )
}

function Fim({
  sessao,
  jogo,
  recorde,
}: {
  sessao: SessaoGrade
  jogo: JogoGrade
  recorde: number | null
}) {
  const total = sessao.acertos + sessao.restantes
  const completou = sessao.acertos === total
  const bateu = recorde === null || sessao.acertos > recorde

  return (
    <section className="motion-safe:animate-surgir flex flex-col items-start gap-4 rounded-xl border border-borda bg-superficie p-5">
      <h2 className="text-2xl font-bold">
        {completou ? 'Tabela inteira!' : bateu ? 'Recorde novo' : 'Fim da partida'}
      </h2>
      <p className="text-suave">
        {comUnidade(sessao.acertos, jogo.unidade)} de {total} · {duracao(sessao.duracaoMs)}
      </p>

      {sessao.faltaram.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-suave">
            Faltaram {sessao.faltaram.length} — em vermelho na grade acima:
          </p>
          <p className="font-mono text-sm leading-relaxed text-erro">
            {sessao.faltaram.map((c) => c.gabarito).join(' · ')}
          </p>
        </div>
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
