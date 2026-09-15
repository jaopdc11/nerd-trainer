import { useState } from 'react'
import { duracao, quando, taxa } from '@/core/format'
import { JOGOS } from '@/core/registry'
import { href } from '@/core/route'
import type { Entrada, Partida } from '@/core/storage'
import { ROTULO_CATEGORIA } from '@/core/types'
import type { JogoModule } from '@/core/types'
import { useRecordes } from '@/core/useRecords'
import { Botao, CORES_CATEGORIA, Etiqueta, IconeJogo, Painel } from './ui'

interface Linha {
  readonly jogo: JogoModule
  readonly entrada: Entrada
}

/**
 * Tela de recordes: um resumo no topo e uma linha por jogo, que abre com a
 * evolução.
 *
 * O gráfico é a razão de guardar o histórico inteiro em vez de só o recorde —
 * dá para ver se você está melhorando ou repetindo o mesmo número, e a linha
 * tracejada do recorde mostra o teto que você mesmo estabeleceu.
 */
export function Records() {
  const { recordeDe, limparTudo, exportar, importar } = useRecordes()

  const linhas: Linha[] = JOGOS.map((jogo) => ({ jogo, entrada: recordeDe(jogo.id) })).filter(
    (l): l is Linha => l.entrada !== null,
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3 pt-4">
        <a
          href={href({ nome: 'menu' })}
          className="flex items-center gap-1.5 text-sm text-tenue transition-colors hover:text-texto"
        >
          <span aria-hidden>←</span> jogos
        </a>
        <h1 className="fonte-display text-xl font-bold">Recordes</h1>
        <span className="w-14" />
      </header>

      {linhas.length === 0 ? (
        <Painel className="flex flex-col items-center gap-3 p-12 text-center">
          <span aria-hidden className="font-mono text-5xl text-tenue">
            ∅
          </span>
          <p className="text-suave">Nenhuma partida ainda.</p>
          <p className="text-sm text-tenue">
            Jogue qualquer coisa e o histórico começa a aparecer aqui.
          </p>
        </Painel>
      ) : (
        <>
          <Resumo linhas={linhas} />

          <ul className="escalonar flex flex-col gap-3">
            {linhas.map((l, i) => (
              <li key={l.jogo.id} style={{ '--i': i } as React.CSSProperties}>
                <LinhaRecorde jogo={l.jogo} entrada={l.entrada} />
              </li>
            ))}
          </ul>

          <Ferramentas onLimpar={limparTudo} exportar={exportar} importar={importar} />
        </>
      )}
    </div>
  )
}

/** Números somados de tudo, para a tela abrir dizendo alguma coisa. */
function Resumo({ linhas }: { linhas: readonly Linha[] }) {
  const partidas = linhas.reduce((s, l) => s + l.entrada.partidas, 0)
  const tempo = linhas.reduce(
    (s, l) => s + l.entrada.historico.reduce((t, p) => t + p.duracaoMs, 0),
    0,
  )
  const zerados = linhas.filter((l) => l.entrada.recorde.completou).length
  const dias = new Set(linhas.flatMap((l) => l.entrada.historico.map((p) => p.emISO.slice(0, 10))))

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Numero rotulo="jogos tocados" valor={`${linhas.length}/${JOGOS.length}`} />
      <Numero rotulo="partidas" valor={String(partidas)} />
      <Numero rotulo="tempo total" valor={duracao(tempo)} />
      <Numero
        rotulo={zerados > 0 ? 'zerados' : dias.size === 1 ? 'dia jogando' : 'dias jogando'}
        valor={zerados > 0 ? String(zerados) : String(dias.size)}
        destaque={zerados > 0}
      />
    </dl>
  )
}

function Numero({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string
  valor: string
  destaque?: boolean
}) {
  return (
    <div className="rounded-xl border border-borda bg-superficie/60 px-3 py-3 backdrop-blur-sm">
      <dt className="text-xs text-tenue">{rotulo}</dt>
      <dd
        className={`font-mono text-xl tabular font-bold ${destaque ? 'text-acento' : 'text-texto'}`}
      >
        {valor}
      </dd>
    </div>
  )
}

function LinhaRecorde({ jogo, entrada }: { jogo: JogoModule; entrada: Entrada }) {
  const [aberta, setAberta] = useState(false)
  const cor = CORES_CATEGORIA[jogo.categoria]
  const historico = entrada.historico

  const media =
    historico.length > 0
      ? historico.reduce((s, p) => s + p.pontuacao, 0) / historico.length
      : entrada.recorde.pontuacao

  const tendencia = calcularTendencia(historico)
  const velocidade = taxa(entrada.recorde.pontuacao, entrada.recorde.duracaoMs, jogo.unidade)

  return (
    <Painel className="overflow-hidden transition-colors hover:border-borda-forte">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <IconeJogo icone={jogo.icone} categoria={jogo.categoria} />

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-semibold">{jogo.nome}</span>
            {entrada.recorde.completou && (
              <span aria-label="completou tudo" className="text-acento">
                ★
              </span>
            )}
          </span>
          <span className="block truncate text-sm text-tenue">
            <span className={cor.texto}>{ROTULO_CATEGORIA[jogo.categoria]}</span>
            {' · '}
            {entrada.partidas} partida{entrada.partidas > 1 ? 's' : ''} ·{' '}
            {quando(entrada.ultimaEmISO)}
          </span>
        </span>

        {historico.length > 1 && <Mini historico={historico} />}

        <span className="shrink-0 text-right">
          <span className="block font-mono text-2xl tabular font-bold text-acento">
            {entrada.recorde.pontuacao}
          </span>
          <span className="block text-xs text-tenue">{jogo.unidade.plural}</span>
        </span>

        <span
          aria-hidden
          className={`shrink-0 text-tenue transition-transform duration-200 ${
            aberta ? 'rotate-180' : ''
          }`}
        >
          ⌄
        </span>
      </button>

      {aberta && (
        <div className="motion-safe:animate-surgir flex flex-col gap-4 border-t border-borda p-4">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Numero rotulo="recorde" valor={String(entrada.recorde.pontuacao)} destaque />
            <Numero rotulo="média" valor={media.toFixed(media < 10 ? 1 : 0)} />
            <Numero rotulo="última" valor={String(entrada.ultimaPontuacao)} />
            <Numero rotulo="tempo do recorde" valor={duracao(entrada.recorde.duracaoMs)} />
          </dl>

          {historico.length > 1 ? (
            <Evolucao historico={historico} recorde={entrada.recorde.pontuacao} />
          ) : (
            <p className="text-sm text-tenue">
              Jogue mais uma vez para o gráfico de evolução aparecer.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Etiqueta className="text-tenue">recorde {quando(entrada.recorde.emISO)}</Etiqueta>
            {velocidade && <Etiqueta className="text-tenue">{velocidade}</Etiqueta>}
            {tendencia && (
              <Etiqueta
                className={tendencia.subindo ? 'border-acento/40 text-acento' : 'text-quase'}
              >
                {tendencia.subindo ? '▲' : '▼'} {Math.abs(tendencia.variacao).toFixed(0)}% desde o
                começo
              </Etiqueta>
            )}
          </div>

          <a
            href={href({ nome: 'jogo', jogoId: jogo.id })}
            className="self-start rounded-xl bg-acento px-5 py-2.5 text-sm font-semibold text-fundo shadow-[0_0_24px_-6px_var(--color-acento)] transition-all hover:bg-acento-forte motion-safe:active:scale-[0.97]"
          >
            Jogar {jogo.nome}
          </a>
        </div>
      )}
    </Painel>
  )
}

/**
 * "Está melhorando?" é a pergunta que o histórico existe para responder:
 * compara a média das cinco partidas recentes com as cinco mais antigas.
 */
function calcularTendencia(
  historico: readonly Partida[],
): { subindo: boolean; variacao: number } | null {
  if (historico.length < 6) return null

  const media = (ps: readonly Partida[]) => ps.reduce((s, p) => s + p.pontuacao, 0) / ps.length
  const recentes = media(historico.slice(0, 5))
  const antigas = media(historico.slice(-5))
  if (antigas === 0) return null

  const variacao = ((recentes - antigas) / antigas) * 100
  return { subindo: variacao >= 0, variacao }
}

/** Sparkline minúsculo, para a linha fechada já mostrar o formato da evolução. */
function Mini({ historico }: { historico: readonly Partida[] }) {
  const pontos = [...historico].reverse().slice(-24)
  const maximo = Math.max(...pontos.map((p) => p.pontuacao), 1)
  const passo = pontos.length > 1 ? 60 / (pontos.length - 1) : 0

  const d = pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${i * passo},${20 - (p.pontuacao / maximo) * 18}`)
    .join(' ')

  return (
    <svg
      viewBox="0 0 60 20"
      className="hidden h-6 w-16 shrink-0 sm:block"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={d} fill="none" stroke="var(--color-borda-forte)" strokeWidth="1.5" />
    </svg>
  )
}

/** Evolução das partidas, da mais antiga à mais recente. */
function Evolucao({ historico, recorde }: { historico: readonly Partida[]; recorde: number }) {
  // O histórico é guardado do mais recente para o mais antigo; o gráfico lê ao
  // contrário, porque o tempo anda para a direita.
  const pontos = [...historico].reverse().slice(-60)
  const maximo = Math.max(...pontos.map((p) => p.pontuacao), 1)

  const largura = 300
  const altura = 80
  const passo = pontos.length > 1 ? largura / (pontos.length - 1) : 0
  const y = (v: number) => altura - (v / maximo) * (altura - 8) - 4

  const linha = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * passo},${y(p.pontuacao)}`).join(' ')
  const area = `${linha} L${largura},${altura} L0,${altura} Z`
  const ultimo = pontos[pontos.length - 1]

  return (
    <figure className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="h-20 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Evolução das últimas ${pontos.length} partidas, melhor resultado ${maximo}`}
      >
        {/* Linha do recorde: o teto que ele mesmo estabeleceu. */}
        <line
          x1="0"
          y1={y(recorde)}
          x2={largura}
          y2={y(recorde)}
          stroke="var(--color-acento)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.45"
          vectorEffect="non-scaling-stroke"
        />
        <path d={area} fill="var(--color-acento)" opacity="0.1" />
        <path
          d={linha}
          fill="none"
          stroke="var(--color-acento)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {ultimo && (
          <circle
            cx={(pontos.length - 1) * passo}
            cy={y(ultimo.pontuacao)}
            r="2.5"
            fill="var(--color-acento)"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <figcaption className="flex justify-between text-xs text-tenue">
        <span>{pontos.length} partidas, da mais antiga à mais recente</span>
        <span className="text-acento">— — recorde {recorde}</span>
      </figcaption>
    </figure>
  )
}

function Ferramentas({
  onLimpar,
  exportar,
  importar,
}: {
  onLimpar: () => void
  exportar: () => string
  importar: (texto: string) => boolean
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [json, setJson] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const copiar = async () => {
    const texto = exportar()
    setJson(texto)
    try {
      await navigator.clipboard.writeText(texto)
      setAviso('copiado para a área de transferência')
    } catch {
      // Sem permissão de clipboard: o textarea abaixo serve para copiar à mão.
      setAviso('selecione o texto abaixo e copie')
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-borda pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <Botao variante="secundario" tamanho="md" onClick={copiar}>
          Exportar recordes
        </Botao>
        <Botao
          variante="secundario"
          tamanho="md"
          onClick={() => {
            const texto = window.prompt('Cole aqui o JSON exportado:')
            if (texto === null) return
            setAviso(importar(texto) ? 'recordes importados' : 'JSON inválido — nada mudou')
          }}
        >
          Importar
        </Botao>
        {aviso && <span className="text-sm text-suave">{aviso}</span>}
      </div>

      {json !== null && (
        <textarea
          readOnly
          value={json}
          onFocus={(e) => e.currentTarget.select()}
          className="h-40 w-full rounded-xl border border-borda bg-fundo-alt p-3 font-mono text-xs text-suave"
        />
      )}

      {confirmando ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-erro">Apagar todos os recordes? Não dá para desfazer.</p>
          <Botao
            tamanho="md"
            onClick={() => {
              onLimpar()
              setConfirmando(false)
            }}
            className="bg-erro text-fundo shadow-none hover:bg-erro"
          >
            Apagar
          </Botao>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="text-sm text-suave hover:text-texto"
          >
            cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="self-start text-sm text-tenue transition-colors hover:text-erro"
        >
          apagar todos os recordes
        </button>
      )}
    </div>
  )
}
