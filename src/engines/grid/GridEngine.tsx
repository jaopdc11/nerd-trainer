import { useEffect, useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
import { Barra, Botao, Etiqueta, Painel, Placar } from '@/components/ui'
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

/**
 * Teto de altura de uma célula. A largura vem do container (1fr), então a grade
 * nunca passa do espaço disponível e não há rolagem horizontal; este valor só
 * impede que, numa tela larga e baixa, as 10 linhas estourem a altura da janela.
 */
const TETO_LINHA = '4.6vh'

/** Cor por bloco da tabela. Nunca é a única informação: o texto também muda. */
const COR_BLOCO: Record<string, string> = {
  s: 'bg-[oklch(0.36_0.1_25)] text-[oklch(0.94_0.06_25)] border-[oklch(0.48_0.12_25)]',
  p: 'bg-[oklch(0.36_0.09_235)] text-[oklch(0.94_0.06_235)] border-[oklch(0.48_0.11_235)]',
  d: 'bg-[oklch(0.36_0.08_160)] text-[oklch(0.94_0.06_160)] border-[oklch(0.48_0.1_160)]',
  f: 'bg-[oklch(0.36_0.09_300)] text-[oklch(0.94_0.06_300)] border-[oklch(0.48_0.11_300)]',
}

export function GridEngine({ jogo, config, onFinalizar, recorde }: Props) {
  const area = useRef<HTMLDivElement>(null)
  const sessao = useGrid(config, onFinalizar)
  const total = sessao.acertos + sessao.restantes
  const superou = recorde !== null && sessao.acertos > recorde

  return (
    <div ref={area} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-end justify-between gap-4">
          <Placar valor={sessao.acertos} total={total} destacado={superou} />
          {recorde !== null ? (
            <Etiqueta className={superou ? 'mb-1 border-acento text-acento' : 'mb-1 text-tenue'}>
              {superou ? 'recorde batido' : `recorde ${recorde}`}
            </Etiqueta>
          ) : (
            <span className="pb-1 text-sm text-tenue">sem recorde ainda</span>
          )}
        </div>
        <Barra fracao={sessao.acertos / total} />
      </div>

      <Grade sessao={sessao} config={config} />

      {sessao.estado === 'pronto' && (
        <Botao onClick={sessao.iniciar} className="self-start">
          Começar
        </Botao>
      )}

      {sessao.estado === 'jogando' && (
        <div className="sticky bottom-0 flex flex-col gap-2 bg-fundo/90 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
          {sessao.alvo && (
            <p className="text-center text-suave">
              Número atômico{' '}
              <strong className="font-mono text-xl text-acento">{sessao.alvo.rotulo}</strong>?
            </p>
          )}
          <AnswerInput
            modo="linha"
            teclado={config.teclado}
            onEnviar={sessao.responder}
            autoCommit={sessao.podeAutoCommitar}
            placeholder="digite o que lembrar"
            rotuloAria="Resposta"
            ancora={area}
          />
          <button
            type="button"
            onClick={sessao.encerrar}
            className="self-center text-xs text-tenue transition-colors hover:text-suave"
          >
            desistir e ver o gabarito
          </button>
        </div>
      )}

      {sessao.estado === 'fim' && <Fim sessao={sessao} jogo={jogo} recorde={recorde} />}
    </div>
  )
}

/**
 * A grade só exibe — ninguém digita dentro da célula.
 *
 * É o que permite a célula ser pequena: ela é visor, e toda a digitação
 * acontece na barra fixa do rodapé.
 */
function Grade({ sessao, config }: { sessao: SessaoGrade; config: ConfigGrade }) {
  const refUltima = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (sessao.ultima) {
      refUltima.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [sessao.ultima])

  return (
    // No desktop a grade cabe inteira e não há rolagem. No celular, 18 colunas
    // sem rolagem deixariam a fonte ilegível, então ali ela volta — é o único
    // lugar onde vale a troca.
    <div className="max-sm:-mx-4 max-sm:overflow-x-auto max-sm:px-4">
      <ul
        className="mx-auto grid gap-[clamp(1px,0.2vw,4px)] max-sm:min-w-[34rem]"
        style={{
          // `minmax(0, 1fr)` é o que elimina a rolagem: a célula nunca pede mais
          // largura do que o container tem. O `maxWidth` limita o outro eixo —
          // 18 colunas de células quadradas altas demais estourariam a altura da
          // tela, e foi isso que criou a barra de rolagem antes.
          gridTemplateColumns: `repeat(${config.colunas}, minmax(0, 1fr))`,
          maxWidth: `calc(${config.colunas} * ${TETO_LINHA})`,
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
  // O tooltip só existe depois que a célula foi revelada — mostrá-lo numa
  // célula vazia durante a partida seria entregar a resposta.
  const revelado = preenchida || revelar

  const classe = preenchida
    ? (COR_BLOCO[celula.grupo ?? ''] ?? 'border-borda-forte bg-superficie-alta text-texto')
    : revelar
      ? 'border-erro/40 bg-erro-fundo/50 text-erro'
      : alvo
        ? 'border-acento bg-acento-fundo'
        : 'border-borda/60 bg-superficie/40 text-tenue'

  return (
    <li
      ref={ref}
      // `inline-size` liga as unidades cqw: assim o texto escala com a célula,
      // e não com a viewport.
      style={{ gridColumn: celula.coluna, gridRow: celula.linha, containerType: 'inline-size' }}
      className={`group relative flex aspect-square flex-col items-center justify-center rounded-md border text-center transition-colors duration-200 hover:z-50 ${classe} ${
        recemAcertada ? 'motion-safe:animate-brilho' : ''
      }`}
    >
      {mostrarRotulo && celula.rotulo && (
        <span className="text-[min(0.6rem,18cqw)] leading-none opacity-60">{celula.rotulo}</span>
      )}
      <span className="font-mono text-[min(1rem,30cqw)] leading-tight font-bold">
        {preenchida ? valor : revelar ? celula.gabarito : ''}
      </span>

      {revelado && celula.detalhe && (
        <span
          // `pointer-events-none` para o card não roubar o hover da célula
          // vizinha; `invisible` em vez de `hidden` para a transição valer.
          className="pointer-events-none invisible absolute bottom-[calc(100%+6px)] left-1/2 z-50 -translate-x-1/2 rounded-lg border border-borda-forte bg-fundo-alt px-2.5 py-1.5 whitespace-nowrap opacity-0 shadow-xl transition-opacity duration-150 group-hover:visible group-hover:opacity-100"
        >
          <span className="block font-mono text-[0.65rem] text-tenue">{celula.rotulo}</span>
          <span className="block text-sm font-semibold text-texto">{celula.detalhe}</span>
        </span>
      )}
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
    <Painel className="motion-safe:animate-surgir flex flex-col items-start gap-5 p-5">
      <h2 className="fonte-display text-2xl font-bold">
        {completou ? (
          <span className="text-acento">Tabela inteira!</span>
        ) : bateu ? (
          <span className="text-acento">Recorde novo</span>
        ) : (
          'Fim da partida'
        )}
      </h2>

      <p className="font-mono text-sm text-tenue">
        {comUnidade(sessao.acertos, jogo.unidade)} de {total} · {duracao(sessao.duracaoMs)}
      </p>

      {sessao.faltaram.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          <p className="text-sm text-suave">
            Faltaram {sessao.faltaram.length} — em vermelho na grade acima:
          </p>
          <p className="max-h-32 overflow-y-auto rounded-xl border border-erro/25 bg-erro-fundo/20 p-3 font-mono text-sm leading-relaxed text-erro">
            {sessao.faltaram.map((c) => c.gabarito).join(' · ')}
          </p>
        </div>
      )}

      <Botao onClick={sessao.iniciar}>De novo</Botao>
    </Painel>
  )
}
