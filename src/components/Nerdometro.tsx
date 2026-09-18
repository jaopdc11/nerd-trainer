import { useState } from 'react'
import { corDaNota, gradienteDaNota } from '@/core/escala'
import {
  calcular,
  CRITERIOS,
  DESCRICAO_AREA,
  DIAS_DE_GRACA,
  FAIXAS,
  NOTA_MAXIMA,
  PATENTES,
  ROTULO_AREA,
  TETO_DO_JOGO,
} from '@/core/nerdometro'
import type {
  Faixa,
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
import { Certificado } from './Certificado'
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
  const [mofados, setMofados] = useState(false)
  const [diploma, setDiploma] = useState(false)
  const m = calcular(banco)
  const animada = useContagem(m.nota)
  const animadoNoDegrau = useContagem(m.progressoNoDegrau)

  if (m.jogados === 0) return null

  const tom = corDaNota(m.nota)

  return (
    <section className="overflow-hidden rounded-2xl border border-borda bg-superficie/70 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-6 p-5">
        <Medidor nota={m.nota} animada={animada} faixa={m.faixa} progresso={animadoNoDegrau} />

        {/*
          `min-w-56` é o que faz o `flex-wrap` acima servir para alguma coisa.

          Com `min-w-0`, esta coluna aceitava encolher até o fim, então nunca
          havia "não coube" e a linha nunca quebrava: em 320px o medidor ficava
          com 144px e sobrava uma faixa de ~100px para o texto, e a etiqueta
          saía cortada no meio. Declarar a largura mínima em que o texto ainda se
          lê transforma o aperto em quebra de linha, que é o que o `flex-wrap`
          estava ali para fazer.

          O ranking encurtou os títulos — o mais longo virou "Ultra Virgem" —,
          mas não dispensa a trava: a etiqueta agora carrega o "· elo 14 de 21" e
          a trilha das cinco patentes mora nesta mesma coluna.
        */}
        <div className="flex min-w-56 flex-1 flex-col gap-2.5">
          <p className="text-xs tracking-[0.25em] text-tenue uppercase">
            Nerdômetro · elo {m.faixa.indice + 1} de {FAIXAS.length}
          </p>

          <div>
            <p className="fonte-display text-3xl leading-none font-bold" style={textoEmGradiente(m.nota)}>
              {m.faixa.titulo}
            </p>
            <p className="mt-1 text-sm text-suave">{m.faixa.lema}</p>
          </div>

          <Trilha atual={m.faixa} nota={m.nota} />

          {/* O diploma só existe do `Nerd V` para cima, e o botão não aparece
              antes disso — anunciar uma recompensa travada, com cadeado, é
              propaganda; a trilha logo acima já mostra o caminho inteiro. */}
          {m.podeCertificar && (
            <div>
              <BotaoCertificado nota={m.nota} onAbrir={() => setDiploma(true)} />
            </div>
          )}

          {m.proximaFaixa ? (
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
          ) : (
            /* No topo da escada o número continua subindo: a escala vai até
               `NOTA_MAXIMA`, que é todo mundo no teto de 130%. Sem esta linha, o
               medidor diria "chegou" para quem ainda tem vinte pontos pela
               frente. */
            <p className="text-sm text-tenue">
              no topo da escada ·{' '}
              <strong className="font-mono text-texto">{m.nota}</strong> de {NOTA_MAXIMA} pontos
              possíveis
            </p>
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
              {/* A ferrugem tem de aparecer pelo mesmo motivo que a carência:
                  uma nota que cai sozinha e um mostrador calado viram "bug" na
                  cabeça de quem olha. A etiqueta diz quantos e quanto custa; a
                  lista diz quais e o que fazer. */}
              {m.enferrujados.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMofados((v) => !v)}
                  aria-expanded={mofados}
                  className="group rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erro"
                >
                  <Etiqueta className="flex items-center gap-1.5 border-erro/40 text-erro transition-colors group-hover:border-erro/60 group-hover:bg-erro-fundo/20">
                    {m.enferrujados.length} enferrujando
                    {m.custoDaFerrugem > 0 && (
                      <span className="font-mono tabular">−{m.custoDaFerrugem}</span>
                    )}
                    <span
                      aria-hidden
                      className={`transition-transform duration-200 ${mofados ? 'rotate-180' : ''}`}
                    >
                      ⌄
                    </span>
                  </Etiqueta>
                </button>
              )}
              {/* A ofensiva vem antes das contagens frias: ela é a única
                  etiqueta que pede uma ação hoje. */}
              {m.ofensiva.dias > 0 && (
                <Etiqueta
                  className={m.ofensiva.hoje ? 'border-quase/40 text-quase' : 'text-tenue'}
                  title={
                    m.ofensiva.recorde > m.ofensiva.dias
                      ? `sua maior ofensiva: ${m.ofensiva.recorde} dias`
                      : 'é a sua maior ofensiva até hoje'
                  }
                >
                  <span aria-hidden>🔥</span> {m.ofensiva.dias}{' '}
                  {m.ofensiva.dias === 1 ? 'dia' : 'dias'}
                  {/* Sem partida hoje, a sequência morre à meia-noite — e é
                      exatamente isso que a etiqueta tem de dizer, enquanto ainda
                      dá tempo. */}
                  {!m.ofensiva.hoje && <span className="text-erro"> · jogue hoje</span>}
                </Etiqueta>
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
            {mofados && <Enferrujados linhas={m.enferrujados} />}
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

      {diploma && <Certificado m={m} onFechar={() => setDiploma(false)} />}
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

/**
 * O botão do diploma.
 *
 * Não usa o `Botao` genérico de propósito. Ele tem cinco variantes, todas
 * pensadas para ação de tela — começar partida, desistir, voltar —, e com
 * qualquer uma delas o diploma leria como "mais um botão", perdido entre a
 * trilha do ranking e as etiquetas. Aqui ele é uma recompensa, e o que diz isso
 * é a cor: tudo sai de `corDaNota`, a mesma escala do arco e do título, então o
 * botão de quem está em `Nerd V` é alaranjado e o de quem chegou ao topo é
 * dourado e brilha mais. Um verde de "ação primária" no meio disso brigaria com
 * o medidor inteiro.
 */
function BotaoCertificado({ nota, onAbrir }: { nota: number; onAbrir: () => void }) {
  const tom = corDaNota(nota)

  return (
    <button
      type="button"
      onClick={onAbrir}
      style={{
        color: tom,
        borderColor: corDaNota(nota, -0.28),
        // `color-mix` com transparente em vez de uma cor fixa: o fundo do painel
        // muda de tom conforme a seção, e um preenchimento opaco criaria uma
        // mancha retangular em volta do botão.
        backgroundColor: `color-mix(in oklch, ${tom} 10%, transparent)`,
        boxShadow: `0 0 20px -10px ${tom}`,
      }}
      className="group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[0.7rem] font-semibold tracking-[0.14em] uppercase transition-all duration-150 hover:brightness-115 motion-safe:active:scale-[0.97]"
    >
      {/* Selo desenhado, e não o emoji 🎓: emoji vira bitmap colorido do
          sistema, com aparência diferente em cada plataforma e sem relação
          nenhuma com a cor do elo. */}
      <svg viewBox="0 0 24 24" aria-hidden className="size-4 shrink-0">
        <circle cx="12" cy="9" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 5.6l1.3 2.7 2.9.4-2.1 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.1-2.1 2.9-.4z"
          fill="currentColor"
        />
        <path
          d="M8.6 15.2l-1.4 6 4.8-2.4 4.8 2.4-1.4-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>

      certificado de nerdice

      <span
        aria-hidden
        className="opacity-50 transition-transform duration-150 group-hover:translate-x-0.5"
      >
        →
      </span>
    </button>
  )
}

/**
 * A escada inteira, num rodapé de dois centímetros: cinco patentes, um ponto por
 * elo.
 *
 * Existe porque o ranking não se explica com o nome do elo atual. "Nerd IV" não
 * diz se são quatro elos ou quarenta, nem quanto do caminho já foi — e são vinte
 * e um. Aqui a pessoa vê a escada inteira de relance, onde está nela, e que a
 * próxima patente tem nome.
 *
 * Pontos e não texto porque o texto não cabe: vinte e um títulos por extenso
 * são quatro linhas de lista mesmo no desktop, e o medidor tem de continuar
 * cabendo acima da dobra no telefone. Cada ponto leva o nome no `title`, e a
 * lista inteira tem rótulo de região para quem lê por leitor de tela.
 */
/**
 * Os jogos que estão perdendo valor por tempo parado.
 *
 * Irmã da lista de "em experiência", e pela mesma razão: a nota se move sozinha
 * e o mostrador tem de dizer por quê, com nome e endereço. A diferença é que
 * aqui a lista é uma dívida — cada linha diz quanto aquele jogo vale hoje e há
 * quanto tempo você não aparece.
 *
 * A ordem vem pronta de `calcular`: fração perdida vezes peso, ou seja, o
 * prejuízo de verdade. Revisitar o primeiro da lista é o que mais devolve nota.
 */
function Enferrujados({ linhas }: { linhas: readonly LinhaNerdometro[] }) {
  return (
    <section
      aria-label="Jogos enferrujando"
      className="motion-safe:animate-surgir flex flex-col gap-1.5 rounded-xl border border-erro/30 bg-erro-fundo/10 p-3"
    >
      <p className="text-xs text-suave">
        parados há mais de {DIAS_DE_GRACA} dias — cada um vale menos do que você fez nele. jogar de
        novo devolve o valor cheio:
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
              <span className="ml-auto shrink-0 font-mono text-xs tabular text-tenue">
                {l.diasParado}d
              </span>
              {/* O quanto sobrou, que é o número que a nota está usando. */}
              <span className="w-10 shrink-0 text-right font-mono text-xs tabular text-erro">
                {Math.round(l.ferrugem * 100)}%
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Trilha({ atual, nota }: { atual: Faixa; nota: number }) {
  const tom = corDaNota(nota)

  return (
    <ol aria-label="Ranking" className="flex flex-wrap items-end gap-x-3 gap-y-2">
      {PATENTES.map((p) => {
        const elos = FAIXAS.filter((f) => f.patente === p.nome)
        const aqui = atual.patente === p.nome

        return (
          <li key={p.nome} className="flex flex-col gap-1">
            <span
              className={`text-[0.6rem] leading-none tracking-[0.14em] uppercase ${
                aqui ? 'font-semibold' : 'text-tenue'
              }`}
              style={aqui ? { color: tom } : undefined}
            >
              {p.curto}
            </span>

            {/* `items-center` porque o ponto do elo atual é maior que os
                outros: sem isso a fileira fica com um dente. */}
            <span className="flex items-center gap-1">
              {elos.map((f) => {
                const conquistado = f.indice <= atual.indice
                const eOAtual = f.indice === atual.indice

                return (
                  <span
                    key={f.indice}
                    title={`${f.titulo} · ${f.minimo} pontos`}
                    className={`block rounded-full ${eOAtual ? 'size-2.5' : 'size-1.5'} ${
                      conquistado ? '' : 'bg-superficie-alta'
                    }`}
                    style={
                      conquistado
                        ? {
                            backgroundColor: tom,
                            // O brilho é o que diz "você está aqui" sem precisar
                            // de um anel, que numa fileira desta densidade
                                // encostaria no ponto vizinho.
                            boxShadow: eOAtual ? `0 0 7px ${tom}` : undefined,
                          }
                        : undefined
                    }
                  />
                )
              })}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * O arco mostra o **elo**, não a nota.
 *
 * Com a nota crua, o arco andava 3 pontos de 100 quando alguém subia um elo de
 * `Curioso` — a conquista acontecia e o desenho ficava parado. Em progresso
 * dentro do elo, cada subida enche a volta e recomeça, que é o que um medidor de
 * ranking faz. A nota continua no centro, miúda: ela é a régua, e some daqui
 * seria esconder de onde o elo saiu.
 */
function Medidor({
  nota,
  animada,
  faixa,
  progresso,
}: {
  nota: number
  animada: number
  faixa: Faixa
  progresso: number
}) {
  const tom = corDaNota(nota)

  return (
    <div className="relative shrink-0">
      <svg
        viewBox="0 0 132 132"
        className="size-36"
        role="img"
        aria-label={`${faixa.titulo}, elo ${faixa.indice + 1} de ${FAIXAS.length}, nota ${nota} de ${NOTA_MAXIMA}`}
      >
        <title>Ranking</title>

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

        {/* Os quartos do elo. Antes as marcas eram o início de cada faixa na
            escala de 0 a 100 — não servem mais: o arco agora é uma volta por
            elo, e as marcas da escala velha cairiam em lugares sem sentido
            dentro dele. Quatro marcas dizem só "quanto falta para virar", que é
            o que este arco mede. */}
        {[0.25, 0.5, 0.75].map((fatia) => {
          const ang = ((GIRO + fatia * GRAUS) * Math.PI) / 180
          return (
            <circle
              key={fatia}
              cx={66 + Math.cos(ang) * RAIO}
              cy={66 + Math.sin(ang) * RAIO}
              r="1.6"
              fill={progresso >= fatia * 100 ? 'var(--color-fundo)' : 'var(--color-borda-forte)'}
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
          strokeDasharray={`${(ARCO * progresso) / 100} 999`}
          transform={`rotate(${GIRO} 66 66)`}
          stroke="url(#nerd-arco)"
          style={{ filter: `drop-shadow(0 0 7px ${tom})` }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-[0.6rem] leading-none tracking-[0.16em] text-tenue uppercase">
          {faixa.curto}
        </span>
        {/* O grau em romano é o que muda quando se sobe, então é ele que ocupa o
            miolo. No topo não há grau: a estrela é a mesma que marca jogo no
            máximo na lista dos critérios. */}
        <span
          className="fonte-display text-4xl leading-none font-bold"
          style={textoEmGradiente(nota)}
        >
          {faixa.romano ?? '★'}
        </span>
        {/* "de 100" enquanto o 100 é o alvo; acima dele o número vira pontos,
            porque "112/100" leria como defeito. */}
        <span className="font-mono text-[0.7rem] tabular leading-none text-tenue">
          {animada}
          <span className="text-[0.6rem]">{nota > 100 ? ' pts' : '/100'}</span>
        </span>
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
  // O que a nota realmente usa, depois da ferrugem. A barra mostra os dois: o
  // que você fez, apagado, e o que vale hoje, aceso.
  const valendo = Math.round(linha.fracao * linha.ferrugem * 100)
  const enferrujado = linha.ferrugem < 1 && linha.fracao > 0

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
          <span aria-label={linha.superado ? 'acima da meta' : 'na meta'} className="text-acento">
            {linha.superado ? '★+' : '★'}
          </span>
        )}
        {/* O bônus de limpeza é invisível na pontuação — sem esta marca, quem
            zerou sem errar veria a porcentagem subir sem saber por quê. */}
        {linha.limpa && (
          <span title="bateu a meta sem errar nada" className="text-quase">
            ✓
          </span>
        )}
      </span>

      {/* Duas barras sobrepostas: a de baixo é o que você fez, a de cima é o
          que isso vale hoje. Com uma só, a ferrugem seria um número perdido no
          meio da lista; com as duas, a diferença é a própria dívida, desenhada.

          A régua vai até `TETO_DO_JOGO` e não até a meta: desde que a escala
          abriu, a meta é uma marca no meio do caminho, e uma barra que enche em
          100% esconderia justamente os 30% que existem acima dela. O tracinho
          marca onde fica a meta. */}
      <span
        title={
          enferrujado
            ? `parado há ${linha.diasParado} dias: vale ${Math.round(linha.ferrugem * 100)}% do que você fez`
            : undefined
        }
        className="relative order-last h-2 w-full overflow-hidden rounded-full bg-superficie-alta sm:order-none sm:w-auto sm:flex-1"
      >
        <span
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ${
            enferrujado ? 'bg-erro/30' : ''
          }`}
          style={{ width: `${Math.min(100, pct / TETO_DO_JOGO)}%` }}
        />
        <span
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ${
            linha.dominado ? 'bg-acento' : valendo > 0 ? 'bg-borda-forte' : ''
          }`}
          style={{ width: `${Math.min(100, valendo / TETO_DO_JOGO)}%` }}
        />
        <span
          aria-hidden
          title="a meta"
          className="absolute inset-y-0 w-px bg-fundo/70"
          style={{ left: `${100 / TETO_DO_JOGO}%` }}
        />
      </span>

      {/* O placar vigente, não o recorde: é ele que está na conta. O recorde de
          sempre continua na tela de recordes, e aqui aparece no `title` de quem
          já fez mais do que anda fazendo. */}
      <span
        title={
          linha.recorde > linha.vigente ? `seu recorde de sempre: ${linha.recorde}` : undefined
        }
        className="shrink-0 text-right font-mono text-xs text-tenue tabular sm:w-20"
      >
        {linha.vigente}/{linha.meta}
      </span>

      <span
        className={`w-10 shrink-0 text-right font-mono text-xs tabular ${
          linha.dominado ? 'text-acento' : enferrujado ? 'text-erro' : 'text-suave'
        }`}
      >
        {enferrujado ? valendo : pct}%
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
