import { useEffect, useRef } from 'react'
import { AnswerInput } from '@/components/AnswerInput'
import { Barra, Botao, Etiqueta, Painel, Placar } from '@/components/ui'
import { desfecho } from '@/core/desfecho'
import type { ResultadoDaRun } from '@/core/desfecho'
import { comUnidade, cronometro, duracao } from '@/core/format'
import type { CelulaGrade, ConfigGrade, JogoGrade, ResultadoRun } from '@/core/types'
import { useGrid } from './useGrid'
import type { SessaoGrade } from './useGrid'

interface Props {
  readonly jogo: JogoGrade
  readonly config: ConfigGrade
  readonly onFinalizar: (r: Omit<ResultadoRun, 'jogoId' | 'modoId'>) => void
  readonly recorde: number | null
  readonly run: ResultadoDaRun | null
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

export function GridEngine({ jogo, config, onFinalizar, recorde, run }: Props) {
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
        {sessao.restanteMs === null ? (
          <Barra fracao={sessao.acertos / total} />
        ) : (
          <Relogio restanteMs={sessao.restanteMs} limiteS={config.limiteSegundos ?? 0} />
        )}
      </div>

      {config.layout?.tipo === 'mapa' ? (
        <Mapa sessao={sessao} config={config} layout={config.layout} />
      ) : (
        <Grade sessao={sessao} config={config} />
      )}

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
          {/* Recado do jogo, e não retorno sobre a tecla: fica até o fim da
              partida, em painel próprio e em tamanho de quem quer ser lido. */}
          {sessao.nota && (
            <p className="motion-safe:animate-surgir rounded-xl border border-erro/40 bg-erro-fundo/30 px-4 py-2.5 text-center text-base font-semibold text-erro sm:text-lg">
              {sessao.nota}
            </p>
          )}

          {/* Repetir o que você já acertou não é o mesmo que chutar errado, e
              num mapa de 195 células sem este aviso o jogador fica repetindo a
              mesma tentativa sem entender por que nada acende. */}
          {sessao.aviso && (
            <p
              className={`motion-safe:animate-surgir text-center text-sm ${
                sessao.aviso.tipo === 'repetido' ? 'text-quase' : 'text-erro'
              }`}
              role="status"
            >
              {sessao.aviso.texto}
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
          <Botao variante="perigo" onClick={sessao.encerrar} className="self-center">
            Desistir e ver o gabarito
          </Botao>
        </div>
      )}

      {sessao.estado === 'fim' && <Fim sessao={sessao} jogo={jogo} config={config} recorde={recorde} run={run} />}
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

/**
 * O mesmo jogo, desenhado num planeta.
 *
 * Um `path` por país, apagado enquanto não foi dito e aceso na cor do acerto —
 * a única diferença para a tabela periódica é a geometria. Os inertes ficam ao
 * fundo em cinza: sem eles o mapa teria buracos onde há Groenlândia e Antártida,
 * e com eles valendo ponto o jogo estaria tomando partido.
 *
 * Micro-estado vira círculo. Singapura no 110m não chega a um pixel, e um país
 * que não dá para ver não dá para acertar.
 */
function Mapa({
  sessao,
  config,
  layout,
}: {
  sessao: SessaoGrade
  config: ConfigGrade
  layout: Extract<NonNullable<ConfigGrade['layout']>, { tipo: 'mapa' }>
}) {
  const revelar = sessao.estado === 'fim'

  return (
    // O limite é a ALTURA, não a largura: o mapa-múndi é 2:1 e cabe em qualquer
    // tela, mas o do Brasil é quase quadrado — a 100% de largura ele virava uma
    // coluna de altura inteira e empurrava o botão de começar para fora da tela.
    // Travar a largura em `altura × proporção` deixa os dois caberem sem tarja.
    <div
      className="mx-auto w-full overflow-hidden rounded-2xl border border-borda bg-fundo-alt/60"
      style={{ maxWidth: `calc(${(layout.largura / layout.altura).toFixed(3)} * var(--altura-mapa))` }}
    >
      <svg
        viewBox={`0 0 ${layout.largura} ${layout.altura}`}
        className="block w-full"
        role="img"
        aria-label={`Mapa: ${sessao.acertos} de ${config.celulas.length} preenchidos`}
      >
        <title>Mapa</title>

        {layout.inertes.map((t) => (
          <path key={t.id} d={t.d} className="fill-superficie stroke-borda" strokeWidth={0.3} />
        ))}

        {config.celulas.map((celula) => {
          const acertou = sessao.preenchidas.has(celula.id)
          const classe = acertou
            ? 'fill-acento stroke-acento-forte'
            : revelar
              ? 'fill-erro/70 stroke-erro'
              : 'fill-superficie-alta stroke-borda-forte'

          const comum = {
            className: `${classe} transition-[fill] duration-300 ${
              sessao.ultima === celula.id ? 'motion-safe:animate-brilho' : ''
            }`,
            strokeWidth: 0.3,
          }

          // O ponto é maior que o contorno de propósito: ele precisa ser
          // clicável de olho, não fiel à escala.
          return celula.forma && 'd' in celula.forma ? (
            <path key={celula.id} d={celula.forma.d} {...comum}>
              <title>{acertou || revelar ? celula.gabarito : ''}</title>
            </path>
          ) : celula.forma ? (
            <circle key={celula.id} cx={celula.forma.x} cy={celula.forma.y} r={2.6} {...comum}>
              <title>{acertou || revelar ? celula.gabarito : ''}</title>
            </circle>
          ) : null
        })}
      </svg>
    </div>
  )
}

function Relogio({ restanteMs, limiteS }: { restanteMs: number; limiteS: number }) {
  const acabando = restanteMs < 60_000

  return (
    <div className="flex items-center gap-3">
      <Barra fracao={restanteMs / (limiteS * 1000)} alerta={acabando} />
      <span
        className={`font-mono text-sm tabular ${acabando ? 'text-erro motion-safe:animate-respirar' : 'text-tenue'}`}
      >
        {cronometro(restanteMs)}
      </span>
    </div>
  )
}

/**
 * O gabarito agrupado, verde no que saiu e vermelho no que faltou.
 *
 * Uma lista corrida de 195 países não se lê. Por seção — continente aqui,
 * região no mapa do Brasil — ela vira diagnóstico: dá para ver num relance que
 * a Europa saiu inteira e a África não saiu.
 */
function PorSecao({ sessao, config }: { sessao: SessaoGrade; config: ConfigGrade }) {
  const secoes = new Map<string, CelulaGrade[]>()
  for (const c of config.celulas) {
    const chave = c.secao ?? ''
    const lista = secoes.get(chave)
    if (lista) lista.push(c)
    else secoes.set(chave, [c])
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {[...secoes].map(([secao, celulas]) => {
        const acertos = celulas.filter((c) => sessao.preenchidas.has(c.id)).length
        return (
          <div key={secao} className="flex flex-col gap-1.5">
            <p className="flex items-baseline gap-2 text-sm">
              <span className="font-semibold text-texto">{secao}</span>
              <span className="font-mono text-xs text-tenue">
                {acertos}/{celulas.length}
              </span>
            </p>
            <p className="text-sm leading-relaxed">
              {celulas.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && <span className="text-tenue"> · </span>}
                  <span className={sessao.preenchidas.has(c.id) ? 'text-acento' : 'text-erro'}>
                    {c.gabarito}
                  </span>
                </span>
              ))}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function Fim({
  sessao,
  jogo,
  config,
  recorde,
  run,
}: {
  sessao: SessaoGrade
  jogo: JogoGrade
  config: ConfigGrade
  recorde: number | null
  run: ResultadoDaRun | null
}) {
  const temSecoes = config.celulas.some((c) => c.secao !== undefined)
  const total = sessao.acertos + sessao.restantes
  const completou = sessao.acertos === total
  const fim = desfecho(sessao.acertos, run, recorde)

  return (
    <Painel className="motion-safe:animate-surgir flex flex-col items-start gap-5 p-5">
      <h2 className="fonte-display text-2xl font-bold">
        {completou ? (
          <span className="text-acento">Tudo preenchido!</span>
        ) : fim === 'superou' ? (
          <span className="text-acento">Recorde novo</span>
        ) : fim === 'empatou' ? (
          <span className="text-quase">Empatou o recorde</span>
        ) : (
          'Fim da partida'
        )}
      </h2>

      <p className="font-mono text-sm text-tenue">
        {comUnidade(sessao.acertos, jogo.unidade)} de {total} · {duracao(sessao.duracaoMs)}
      </p>

      {temSecoes ? (
        <PorSecao sessao={sessao} config={config} />
      ) : (
        sessao.faltaram.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            <p className="text-sm text-suave">
              Faltaram {sessao.faltaram.length} — em vermelho na grade acima:
            </p>
            <p className="max-h-32 overflow-y-auto rounded-xl border border-erro/25 bg-erro-fundo/20 p-3 font-mono text-sm leading-relaxed text-erro">
              {sessao.faltaram.map((c) => c.gabarito).join(' · ')}
            </p>
          </div>
        )
      )}

      <Botao onClick={sessao.iniciar}>De novo</Botao>
    </Painel>
  )
}
