import { useState } from 'react'
import { corDaNota, gradienteDaNota } from '@/core/escala'
import {
  calcular,
  CRITERIOS,
  DESCRICAO_AREA,
  FAIXAS,
  ROTULO_AREA,
} from '@/core/nerdometro'
import type {
  LinhaNerdometro,
  NotaArea,
  NotaCategoria,
  PassoParaSubir,
} from '@/core/nerdometro'
import { porCategoria } from '@/core/registry'
import { useContagem } from '@/core/useContagem'
import { href } from '@/core/route'
import type { Banco } from '@/core/storage'
import { ROTULO_CATEGORIA } from '@/core/types'
import type { Categoria } from '@/core/types'
import { FormulaNerdometro } from './FormulaNerdometro'
import { CORES_CATEGORIA, Etiqueta } from './ui'

/**
 * O gradiente sobre o próprio texto.
 *
 * O anterior era o mesmo matiz, `L+0.12` a `L-0.06`, e não lia como gradiente:
 * lia como texto mal iluminado, com a ponta escura afundando no fundo quase
 * preto. Agora o matiz e o croma andam de verdade, porque as pontas vêm de
 * duas notas diferentes. O brilho devolve o neon que o `color: transparent` do
 * recorte tinha matado — sem ele o título é a única coisa da tela que não
 * acende.
 */
const textoEmGradiente = (nota: number): React.CSSProperties => ({
  backgroundImage: gradienteDaNota(nota),
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  textShadow: `0 0 24px color-mix(in oklch, ${corDaNota(nota)} 50%, transparent)`,
})

const RAIO = 54
const GRAUS = 250
const ARCO = (GRAUS / 360) * 2 * Math.PI * RAIO
const GIRO = 90 + (360 - GRAUS) / 2

export function Nerdometro({ banco }: { banco: Banco }) {
  const [aberto, setAberto] = useState(false)
  const [quais, setQuais] = useState(false)
  const m = calcular(banco)
  const animada = useContagem(m.nota)

  if (m.jogados === 0) return null

  const tom = corDaNota(m.nota)

  return (
    <section className="overflow-hidden rounded-2xl border border-borda bg-superficie/70 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-6 p-5">
        <Medidor nota={m.nota} animada={animada} />

        {/*
          `min-w-56` é o que faz o `flex-wrap` acima servir para alguma coisa.

          Com `min-w-0`, esta coluna aceitava encolher até o fim, então nunca
          havia "não coube" e a linha nunca quebrava: em 320px o medidor ficava
          com 144px e sobrava uma faixa de ~100px para o texto, onde
          "Enciclopédia ambulante" quebrava no meio da palavra e a etiqueta
          "NERDÔMETRO" saía cortada. Declarar a largura mínima em que o texto
          ainda se lê transforma o aperto em quebra de linha, que é o que o
          `flex-wrap` estava ali para fazer.
        */}
        <div className="flex min-w-56 flex-1 flex-col gap-2.5">
          <p className="text-xs tracking-[0.25em] text-tenue uppercase">Nerdômetro</p>

          <div>
            <p className="fonte-display text-3xl leading-none font-bold" style={textoEmGradiente(m.nota)}>
              {m.faixa.titulo}
            </p>
            <p className="mt-1 text-sm text-suave">{m.faixa.lema}</p>
          </div>

          {m.proximaFaixa && (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-tenue">
                faltam <strong className="font-mono text-texto">{m.proximaFaixa.falta}</strong> para{' '}
                <span className="text-suave">{m.proximaFaixa.faixa.titulo}</span>
              </p>
              <ComoSubir
                passos={m.comoSubir}
                maisDeUmJogo={m.subirPedeMaisDeUmJogo}
                nota={m.nota}
              />
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* A cobertura vem primeiro e é a trava contra tirar 100 maxando um
                  jogo só: desde que a nota passou a medir só o que foi jogado,
                  ela não significa nada sem o "de quantos". */}
              <Etiqueta className={m.jogados * 2 < m.total ? 'text-quase' : 'text-suave'}>
                em {m.jogados} de {m.total} jogos
              </Etiqueta>
              {/* A carência precisa aparecer: sem isto, quem testou um jogo vê a
                  nota parada e fica procurando o bug. */}
              {m.emExperiencia.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuais((v) => !v)}
                  aria-expanded={quais}
                  className="group rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quase"
                >
                  <Etiqueta className="flex items-center gap-1.5 text-quase transition-colors group-hover:border-quase/60 group-hover:bg-quase-fundo/20">
                    {m.emExperiencia.length === 1
                      ? '1 em experiência'
                      : `${m.emExperiencia.length} em experiência`}
                    <span
                      aria-hidden
                      className={`transition-transform duration-200 ${quais ? 'rotate-180' : ''}`}
                    >
                      ⌄
                    </span>
                  </Etiqueta>
                </button>
              )}
              <Etiqueta className="text-suave">{m.partidas} partidas</Etiqueta>
              <Etiqueta className="text-suave">{formatarTempo(m.tempoMs)} jogados</Etiqueta>
              {m.dominados > 0 && (
                <Etiqueta
                  style={{ color: tom, borderColor: corDaNota(m.nota, -0.18) }}
                >
                  {m.dominados} no máximo
                </Etiqueta>
              )}
            </div>

            {quais && <EmExperiencia linhas={m.emExperiencia} />}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {m.areas.map((a) => (
            <Area key={a.area} area={a} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-center gap-2 border-t border-borda py-2.5 text-sm text-tenue transition-colors hover:bg-superficie-alta hover:text-suave"
      >
        {aberto ? 'esconder detalhes' : `ver os ${CRITERIOS.length} critérios`}
        <span aria-hidden className={`transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}>
          ⌄
        </span>
      </button>

      {aberto && (
        <Detalhe linhas={m.linhas} categorias={m.categorias} proximo={m.proximoPasso} />
      )}
    </section>
  )
}

/**
 * A receita para subir de faixa.
 *
 * "faltam 2 pontos" não é acionável — 2 pontos de quê, feitos onde? Aqui cada
 * linha é uma tarefa fechada: o jogo, a pontuação a bater e o quanto falta. A
 * ordem vem de `comoSubir`, que prioriza o que a pessoa já joga.
 */
function ComoSubir({
  passos,
  maisDeUmJogo,
  nota,
}: {
  passos: readonly PassoParaSubir[]
  maisDeUmJogo: boolean
  nota: number
}) {
  if (passos.length === 0) return null

  const tom = corDaNota(nota)

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-tenue">
        {maisDeUmJogo
          ? 'nenhum jogo sozinho chega lá — o caminho mais curto passa por mais de um:'
          : 'qualquer um destes, sozinho, já te leva:'}
      </p>

      <ul className="flex flex-col gap-0.5">
        {passos.map((p) => (
          <li key={p.jogoId}>
            {/* `flex-wrap` e não `shrink-0` no alvo: "chegue a 118 (faltam
                107)" é o que a linha existe para dizer, então quem cede é o
                nome do jogo — mas em 320px nem os dois juntos cabiam numa
                linha, e o alvo saía da tela. Agora ele desce. */}
            <a
              href={href({ nome: 'jogo', jogoId: p.jogoId })}
              className="-mx-1.5 flex flex-wrap items-baseline gap-x-1.5 rounded-md px-1.5 py-0.5 text-sm text-suave transition-colors hover:bg-superficie-alta hover:text-texto"
            >
              <span aria-hidden className="font-mono text-xs text-tenue">
                {p.icone}
              </span>
              <span className="min-w-0 truncate">{p.nome}:</span>
              <span>
                chegue a{' '}
                <strong className="font-mono tabular font-bold" style={{ color: tom }}>
                  {p.alvo}
                </strong>{' '}
                <span className="text-tenue">(faltam {p.faltam})</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Quais jogos estão esperando a segunda partida.
 *
 * A etiqueta dizia "8 em experiência — jogue de novo" e não dizia de quê: para
 * descobrir, o jogador tinha de abrir os 72 critérios e conferir um por um qual
 * tinha recorde e ainda estava fora da nota. Aqui cada linha é a tarefa inteira
 * — o jogo, quanto ele já fez e o link para jogar de novo.
 *
 * Expansível, e não sempre aberta, pela conta do enunciado do problema: são 8
 * hoje e podem ser 20 amanhã, e 20 nomes empurrariam o medidor para fora da
 * primeira tela justamente de quem está começando. Em duas colunas pela mesma
 * razão.
 */
function EmExperiencia({ linhas }: { linhas: readonly LinhaNerdometro[] }) {
  return (
    <section
      aria-label="Jogos em experiência"
      className="motion-safe:animate-surgir flex flex-col gap-1.5 rounded-xl border border-quase/30 bg-quase-fundo/10 p-3"
    >
      <p className="text-xs text-suave">
        {linhas.length === 1
          ? 'jogado uma vez só — a segunda partida faz ele entrar na nota:'
          : 'jogados uma vez só — a segunda partida faz cada um entrar na nota:'}
      </p>

      <ul className="grid grid-cols-[minmax(0,1fr)] gap-0.5 sm:grid-cols-2">
        {linhas.map((l) => (
          <li key={l.jogoId}>
            <a
              href={href({ nome: 'jogo', jogoId: l.jogoId })}
              className="-mx-1.5 flex items-baseline gap-1.5 rounded-md px-1.5 py-0.5 text-sm text-suave transition-colors hover:bg-superficie-alta hover:text-texto"
            >
              <span aria-hidden className="font-mono text-xs text-tenue">
                {l.icone}
              </span>
              <span className="truncate">{l.nome}</span>
              {/* O recorde junto porque a segunda partida não precisa superá-lo
                  para valer: quem vê "12/20" sabe que já tem meio caminho e que
                  o que falta é repetir, não bater. */}
              <span className="ml-auto shrink-0 font-mono text-xs tabular text-tenue">
                {l.recorde}/{l.meta}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Medidor({ nota, animada }: { nota: number; animada: number }) {
  const tom = corDaNota(nota)

  return (
    <div className="relative shrink-0">
      <svg viewBox="0 0 132 132" className="size-36" role="img" aria-label={`Nota ${nota} de 100`}>
        <title>Nerdômetro</title>

        <defs>
          {/* O arco preenchido percorre a própria escala: sai do azul do zero e
              termina na cor da nota atual. */}
          <linearGradient id="nerd-arco" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={corDaNota(0)} />
            <stop offset="35%" stopColor={corDaNota(nota * 0.35)} />
            <stop offset="70%" stopColor={corDaNota(nota * 0.7)} />
            {/* Sem clarear a ponta: nesta escala o topo já é o ponto mais
                luminoso, e forçar mais só desbota. O destaque vem do brilho. */}
            <stop offset="100%" stopColor={corDaNota(nota)} />
          </linearGradient>
        </defs>

        <circle
          cx="66"
          cy="66"
          r={RAIO}
          fill="none"
          stroke="var(--color-superficie-alta)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${ARCO} 999`}
          transform={`rotate(${GIRO} 66 66)`}
        />

        {/* Marcas onde cada faixa começa: mostram que a escala tem degraus. */}
        {FAIXAS.filter((f) => f.minimo > 0 && f.minimo < 100).map((f) => {
          const ang = ((GIRO + (f.minimo / 100) * GRAUS) * Math.PI) / 180
          return (
            <circle
              key={f.minimo}
              cx={66 + Math.cos(ang) * RAIO}
              cy={66 + Math.sin(ang) * RAIO}
              r="1.6"
              fill={nota >= f.minimo ? 'var(--color-fundo)' : 'var(--color-borda-forte)'}
            />
          )
        })}

        <circle
          cx="66"
          cy="66"
          r={RAIO}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(ARCO * animada) / 100} 999`}
          transform={`rotate(${GIRO} 66 66)`}
          stroke="url(#nerd-arco)"
          style={{ filter: `drop-shadow(0 0 7px ${tom})` }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-5xl tabular leading-none font-bold"
          style={textoEmGradiente(animada)}
        >
          {animada}
        </span>
        <span className="mt-1 text-[0.65rem] tracking-wider text-tenue">DE 100</span>
      </div>
    </div>
  )
}

function Area({ area }: { area: NotaArea }) {
  return (
    <div className="flex items-center gap-2.5" title={DESCRICAO_AREA[area.area]}>
      <span className="w-24 text-right text-xs text-tenue">{ROTULO_AREA[area.area]}</span>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-superficie-alta">
        <span
          className="block h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${area.nota}%`,
            backgroundImage: `linear-gradient(90deg, ${corDaNota(0)}, ${corDaNota(area.nota)})`,
          }}
        />
      </span>
      <span className="w-8 font-mono text-xs text-suave">{area.nota}</span>
    </div>
  )
}

/**
 * O painel aberto: uma seção por matéria, na ordem e nas cores do menu — a mesma
 * divisão da tela de recordes, para as duas lerem igual.
 *
 * Em lista corrida, 26 linhas ordenadas por porcentagem respondem "em que eu vou
 * bem?" e nenhuma outra pergunta. Agrupadas, respondem "vou bem em quê?", que é
 * a que faz alguém decidir o que jogar. Dentro do grupo a ordem por fração
 * continua, porque ali ela volta a ser útil.
 */
function Detalhe({
  linhas,
  categorias,
  proximo,
}: {
  linhas: readonly LinhaNerdometro[]
  categorias: readonly NotaCategoria[]
  proximo: LinhaNerdometro | null
}) {
  const grupos = porCategoria().map(({ categoria }) => ({
    categoria,
    linhas: linhas
      .filter((l) => l.categoria === categoria)
      .sort((a, b) => b.fracao - a.fracao),
    nota: categorias.find((c) => c.categoria === categoria),
  }))

  return (
    <div className="motion-safe:animate-surgir flex flex-col gap-4 border-t border-borda p-4">
      {grupos.map(
        (g) =>
          g.linhas.length > 0 && (
            <section key={g.categoria} className="flex flex-col gap-1">
              <CabecalhoCategoria categoria={g.categoria} nota={g.nota} />

              <ul className="escalonar flex flex-col">
                {g.linhas.map((l, i) => (
                  <li key={l.jogoId} style={{ '--i': i } as React.CSSProperties}>
                    <Linha linha={l} sugerido={proximo?.jogoId === l.jogoId} />
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}

      <FormulaNerdometro />
    </div>
  )
}

/** Mesmo rótulo, mesma cor e mesma nota de matéria da tela de recordes. */
function CabecalhoCategoria({
  categoria,
  nota,
}: {
  categoria: Categoria
  nota: NotaCategoria | undefined
}) {
  const jogada = nota !== undefined && nota.nota !== null

  return (
    <div className="flex items-center gap-2.5 px-2">
      <h3
        className={`fonte-display text-xs font-semibold tracking-[0.2em] uppercase ${CORES_CATEGORIA[categoria].texto}`}
      >
        {ROTULO_CATEGORIA[categoria]}
      </h3>

      {jogada && (
        <span
          className="font-mono text-sm tabular leading-none font-bold"
          style={{ color: corDaNota(nota.nota as number) }}
        >
          {nota.nota}
        </span>
      )}

      <span className="h-px flex-1 bg-borda" />

      {nota !== undefined && (
        <span className="text-[0.7rem] text-tenue">
          {jogada ? `em ${nota.jogados} de ${nota.jogos}` : `nunca jogada · ${nota.jogos} jogos`}
        </span>
      )}
    </div>
  )
}

/**
 * A fórmula, aberta.
 *
 * O site é para nerd: esconder a conta atrás de "média ponderada" é justamente o
 * que faria alguém desconfiar do número. Todas as constantes saem de `CURVA` e
 * de `CRITERIOS` — se o balanceamento mudar, o texto muda junto, senão vira
 * mentira bem formatada.
 */

/**
 * Uma linha do painel dos critérios.
 *
 * Seis colunas de largura fixa somam 452px de conteúdo mínimo, e a `section` do
 * medidor é `overflow-hidden`: em 320px isso não virava rolagem, virava
 * **conteúdo cortado sem aviso** — a porcentagem e o `recorde/meta` ficavam
 * fora da tela e nada indicava que existiam. Medido: 157px de sobra.
 *
 * A saída é a barra descer para a própria linha no telefone (`order-last` +
 * `w-full`, que numa flex-wrap força a quebra) e o nome virar elástico em vez
 * de ter 10rem cravados. Da largura do `sm` em diante o layout de uma linha só
 * volta, porque ali ele cabe e lê melhor.
 */
function Linha({ linha, sugerido }: { linha: LinhaNerdometro; sugerido: boolean }) {
  const pct = Math.round(linha.fracao * 100)

  return (
    <a
      href={href({ nome: 'jogo', jogoId: linha.jogoId })}
      className="group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-2 py-2 transition-colors hover:bg-superficie-alta"
    >
      <span
        aria-hidden
        className={`w-8 shrink-0 text-center font-mono text-sm sm:w-10 ${
          linha.dominado ? 'text-acento' : 'text-tenue'
        }`}
      >
        {linha.icone}
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm sm:w-40 sm:flex-none">
        {linha.nome}
        {linha.dominado && (
          <span aria-label="no máximo" className="text-acento">
            ★
          </span>
        )}
      </span>

      <span className="relative order-last h-2 w-full overflow-hidden rounded-full bg-superficie-alta sm:order-none sm:w-auto sm:flex-1">
        <span
          className={`block h-full rounded-full transition-[width] duration-700 ${
            linha.dominado ? 'bg-acento' : pct > 0 ? 'bg-borda-forte' : ''
          }`}
          style={{ width: `${pct}%` }}
        />
      </span>

      <span className="shrink-0 text-right font-mono text-xs text-tenue tabular sm:w-20">
        {linha.recorde}/{linha.meta}
      </span>

      <span
        className={`w-10 shrink-0 text-right font-mono text-xs tabular ${
          linha.dominado ? 'text-acento' : 'text-suave'
        }`}
      >
        {pct}%
      </span>

      {/* O potencial é uma dica, não um dado da linha: no telefone ele sai para
          o nome do jogo caber, e quem quer saber onde ganhar nota tem o
          "como subir" logo acima, que diz a mesma coisa por extenso. */}
      <span className="hidden w-14 shrink-0 text-right text-[0.7rem] text-tenue sm:block">
        {sugerido ? <span className="text-quase">+{linha.potencial.toFixed(1)}</span> : ''}
      </span>
    </a>
  )
}

function formatarTempo(ms: number): string {
  const min = Math.round(ms / 60_000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  return `${h}h${String(min % 60).padStart(2, '0')}`
}
