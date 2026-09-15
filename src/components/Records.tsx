import { useState } from 'react'
import { duracao, quando } from '@/core/format'
import { JOGOS } from '@/core/registry'
import { href } from '@/core/route'
import type { Entrada, Partida } from '@/core/storage'
import type { JogoModule, ModoJogo } from '@/core/types'
import { useRecordes } from '@/core/useRecords'

/**
 * Tela de recordes: uma linha por jogo (ou por modo), com a evolução.
 *
 * O gráfico é a razão de guardar o histórico inteiro em vez de só o recorde
 * atual — dá para ver se você está melhorando ou só repetindo o mesmo número.
 */
export function Records() {
  const { banco, recordeDe, limparTudo } = useRecordes()
  const temAlgo = Object.keys(banco.entradas).length > 0

  // Uma linha por modo, porque cada modo tem recorde próprio. O tipo é
  // explícito: o `flatMap` sobre dois formatos diferentes infere mal sozinho.
  interface Linha {
    jogo: JogoModule
    modo?: ModoJogo
    entrada: Entrada | null
  }

  // A anotação preserva o refinamento do `filter`: com `Linha[]` o TypeScript
  // esqueceria que `entrada` já não pode ser nula.
  const linhas: (Linha & { entrada: Entrada })[] = JOGOS.flatMap((jogo): Linha[] =>
    jogo.modos
      ? jogo.modos.map((modo) => ({ jogo, modo, entrada: recordeDe(jogo.id, modo.id) }))
      : [{ jogo, entrada: recordeDe(jogo.id) }],
  ).filter((l): l is Linha & { entrada: Entrada } => l.entrada !== null)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <a href={href({ nome: 'menu' })} className="text-sm text-suave hover:text-texto">
          ← jogos
        </a>
        <h1 className="font-semibold">Recordes</h1>
        <span className="w-12" />
      </header>

      {!temAlgo || linhas.length === 0 ? (
        <p className="text-suave">
          Nenhuma partida ainda. Jogue qualquer coisa e o histórico começa a aparecer aqui.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {linhas.map(({ jogo, modo, entrada }) => (
              <li key={`${jogo.id}-${modo?.id ?? ''}`}>
                <LinhaRecorde jogo={jogo} modo={modo} entrada={entrada} />
              </li>
            ))}
          </ul>

          <Ferramentas onLimpar={limparTudo} />
        </>
      )}
    </div>
  )
}

function LinhaRecorde({
  jogo,
  modo,
  entrada,
}: {
  jogo: JogoModule
  modo: ModoJogo | undefined
  entrada: Entrada
}) {
  const [aberta, setAberta] = useState(false)
  const historico = entrada.historico

  const media =
    historico.length > 0
      ? historico.reduce((s, p) => s + p.pontuacao, 0) / historico.length
      : entrada.recorde.pontuacao

  return (
    <div className="rounded-xl border border-borda bg-superficie">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span aria-hidden className="font-mono text-xl text-acento">
          {jogo.icone}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">
            {jogo.nome}
            {modo && <span className="font-normal text-suave"> · {modo.nome}</span>}
          </span>
          <span className="block text-sm text-tenue">
            {entrada.partidas} partida{entrada.partidas > 1 ? 's' : ''} ·{' '}
            {quando(entrada.ultimaEmISO)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-xl tabular font-bold">
            {entrada.recorde.pontuacao}
          </span>
          <span className="block text-xs text-tenue">{jogo.unidade.plural}</span>
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

          <p className="text-xs text-tenue">
            recorde feito {quando(entrada.recorde.emISO)}
            {entrada.recorde.completou && ' · completou tudo'}
          </p>

          <a
            href={href({ nome: 'jogo', jogoId: jogo.id, ...(modo ? { modoId: modo.id } : {}) })}
            className="self-start rounded-lg bg-acento px-4 py-2 text-sm font-semibold text-fundo"
          >
            Jogar
          </a>
        </div>
      )}
    </div>
  )
}

function Estatistica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-superficie-alta px-2 py-3">
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

function Ferramentas({ onLimpar }: { onLimpar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="flex flex-col gap-3 border-t border-borda pt-4">
      {confirmando ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-erro">Apagar todos os recordes? Não dá para desfazer.</p>
          <button
            type="button"
            onClick={() => {
              onLimpar()
              setConfirmando(false)
            }}
            className="rounded-lg bg-erro px-4 py-2 text-sm font-semibold text-fundo"
          >
            Apagar
          </button>
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
