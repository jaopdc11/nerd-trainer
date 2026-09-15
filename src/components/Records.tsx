import { useState } from 'react'
import { duracao, quando } from '@/core/format'
import { JOGOS } from '@/core/registry'
import { href } from '@/core/route'
import type { Entrada, Partida } from '@/core/storage'
import type { JogoModule } from '@/core/types'
import { useRecordes } from '@/core/useRecords'
import { Botao, CORES_CATEGORIA, Etiqueta, Painel } from './ui'

/**
 * Tela de recordes: uma linha por jogo (ou por modo), com a evolução.
 *
 * O gráfico é a razão de guardar o histórico inteiro em vez de só o recorde
 * atual — dá para ver se você está melhorando ou só repetindo o mesmo número.
 */
export function Records() {
  const { banco, recordeDe, limparTudo, exportar, importar } = useRecordes()
  const temAlgo = Object.keys(banco.entradas).length > 0

  const linhas = JOGOS.map((jogo) => ({ jogo, entrada: recordeDe(jogo.id) })).filter(
    (l): l is { jogo: JogoModule; entrada: Entrada } => l.entrada !== null,
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

      {!temAlgo || linhas.length === 0 ? (
        <Painel className="flex flex-col items-center gap-3 p-10 text-center">
          <span aria-hidden className="font-mono text-4xl text-tenue">
            ∅
          </span>
          <p className="text-suave">Nenhuma partida ainda.</p>
          <p className="text-sm text-tenue">
            Jogue qualquer coisa e o histórico começa a aparecer aqui.
          </p>
        </Painel>
      ) : (
        <>
          <ul className="escalonar flex flex-col gap-3">
            {linhas.map(({ jogo, entrada }, i) => (
              <li key={jogo.id} style={{ '--i': i } as React.CSSProperties}>
                <LinhaRecorde jogo={jogo} entrada={entrada} />
              </li>
            ))}
          </ul>

          <Ferramentas onLimpar={limparTudo} exportar={exportar} importar={importar} />
        </>
      )}
    </div>
  )
}

function LinhaRecorde({ jogo, entrada }: { jogo: JogoModule; entrada: Entrada }) {
  const [aberta, setAberta] = useState(false)
  const historico = entrada.historico

  const media =
    historico.length > 0
      ? historico.reduce((s, p) => s + p.pontuacao, 0) / historico.length
      : entrada.recorde.pontuacao

  const cor = CORES_CATEGORIA[jogo.categoria]

  return (
    <Painel className="overflow-hidden transition-colors hover:border-borda-forte">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          aria-hidden
          className={`grid size-10 shrink-0 place-items-center rounded-xl font-mono text-base font-bold ${cor.fundo} ${cor.texto}`}
        >
          {jogo.icone}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{jogo.nome}</span>
          <span className="block text-sm text-tenue">
            {entrada.partidas} partida{entrada.partidas > 1 ? 's' : ''} ·{' '}
            {quando(entrada.ultimaEmISO)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-2xl tabular font-bold text-acento">
            {entrada.recorde.pontuacao}
          </span>
          <span className="block text-xs text-tenue">{jogo.unidade.plural}</span>
        </span>
        <span
          aria-hidden
          className={`text-tenue transition-transform duration-200 ${aberta ? 'rotate-180' : ''}`}
        >
          ⌄
        </span>
      </button>

      {aberta && (
        <div className="motion-safe:animate-surgir flex flex-col gap-4 border-t border-borda p-4">
          <dl className="grid grid-cols-3 gap-3 text-center">
            <Estatistica rotulo="recorde" valor={String(entrada.recorde.pontuacao)} />
            <Estatistica rotulo="média" valor={media.toFixed(media < 10 ? 1 : 0)} />
            <Estatistica rotulo="tempo do recorde" valor={duracao(entrada.recorde.duracaoMs)} />
          </dl>

          {historico.length > 1 ? (
            <Evolucao historico={historico} />
          ) : (
            <p className="text-sm text-tenue">
              Jogue mais uma vez para o gráfico de evolução aparecer.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Etiqueta className="text-tenue">recorde {quando(entrada.recorde.emISO)}</Etiqueta>
            {entrada.recorde.completou && (
              <Etiqueta className="border-acento/40 text-acento">completou tudo</Etiqueta>
            )}
          </div>

          <a
            href={href({ nome: 'jogo', jogoId: jogo.id })}
            className="self-start rounded-xl bg-acento px-5 py-2.5 text-sm font-semibold text-fundo shadow-[0_0_24px_-6px_var(--color-acento)] transition-all hover:bg-acento-forte motion-safe:active:scale-[0.97]"
          >
            Jogar
          </a>
        </div>
      )}
    </Painel>
  )
}

function Estatistica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-borda/60 bg-fundo-alt px-2 py-3">
      <dt className="text-xs text-tenue">{rotulo}</dt>
      <dd className="font-mono text-lg tabular font-semibold">{valor}</dd>
    </div>
  )
}

/**
 * Sparkline das partidas, da mais antiga para a mais recente, com a linha do
 * recorde por cima. SVG inline: são poucos pontos e não vale uma biblioteca.
 */
function Evolucao({ historico }: { historico: readonly Partida[] }) {
  // O histórico é guardado do mais recente para o mais antigo; o gráfico lê ao
  // contrário, porque o tempo anda para a direita.
  const pontos = [...historico].reverse().slice(-60)
  const maximo = Math.max(...pontos.map((p) => p.pontuacao), 1)

  const largura = 300
  const altura = 64
  const passo = pontos.length > 1 ? largura / (pontos.length - 1) : 0

  const coordenadas = pontos.map((p, i) => ({
    x: i * passo,
    y: altura - (p.pontuacao / maximo) * (altura - 6) - 3,
  }))

  const linha = coordenadas.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ')
  const area = `${linha} L${largura},${altura} L0,${altura} Z`

  return (
    <figure className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="h-16 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Evolução das últimas ${pontos.length} partidas, melhor resultado ${maximo}`}
      >
        <path d={area} fill="var(--color-acento)" opacity="0.12" />
        <path
          d={linha}
          fill="none"
          stroke="var(--color-acento)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {coordenadas.length > 0 && (
          <circle
            cx={coordenadas[coordenadas.length - 1]?.x}
            cy={coordenadas[coordenadas.length - 1]?.y}
            r="2.5"
            fill="var(--color-acento)"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <figcaption className="flex justify-between text-xs text-tenue">
        <span>{pontos.length} partidas</span>
        <span>melhor: {maximo}</span>
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
      // Sem permissão de clipboard (ou http sem localhost): o textarea abaixo
      // continua servindo para copiar à mão.
      setAviso('selecione o texto abaixo e copie')
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-borda pt-4">
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
