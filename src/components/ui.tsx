import { useEffect, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { useContagem } from '@/core/useContagem'
import type { Categoria } from '@/core/types'

/**
 * Primitivas visuais compartilhadas.
 *
 * Existem para que botão e cartão tenham o mesmo comportamento em toda tela —
 * sem isso, cada engine reinventa o seu e o app deixa de parecer uma coisa só.
 */

/** Paleta por categoria. Texto, fundo e borda saem sempre do mesmo par. */
export const CORES_CATEGORIA: Record<Categoria, { texto: string; fundo: string; borda: string }> = {
  matematica: { texto: 'text-mat', fundo: 'bg-mat-fundo', borda: 'group-hover:border-mat' },
  fisica: { texto: 'text-fis', fundo: 'bg-fis-fundo', borda: 'group-hover:border-fis' },
  quimica: { texto: 'text-qui', fundo: 'bg-qui-fundo', borda: 'group-hover:border-qui' },
  biologicas: { texto: 'text-bio', fundo: 'bg-bio-fundo', borda: 'group-hover:border-bio' },
  geografia: { texto: 'text-geo', fundo: 'bg-geo-fundo', borda: 'group-hover:border-geo' },
  humanas: { texto: 'text-hum', fundo: 'bg-hum-fundo', borda: 'group-hover:border-hum' },
}

type Variante = 'primario' | 'perigo' | 'voltar' | 'secundario' | 'discreto'
type Tamanho = 'md' | 'lg'

const VARIANTE: Record<Variante, string> = {
  primario:
    'bg-acento text-fundo font-semibold shadow-[0_0_24px_-6px_var(--color-acento)] hover:bg-acento-forte',
  // Irmã da primária, em vermelho: mesmo peso visual, sentido oposto. Para
  // ação que termina alguma coisa e o jogador precisa achar sem procurar.
  perigo:
    'bg-erro text-fundo font-semibold shadow-[0_0_24px_-6px_var(--color-erro)] hover:brightness-110',
  // Navegação, não ação do jogo: azul para não disputar com o neon do acerto
  // nem com o vermelho do que termina a partida.
  voltar:
    'bg-mat-fundo text-mat font-semibold border border-mat/40 hover:bg-mat/25 hover:border-mat',
  secundario: 'border border-borda bg-superficie text-texto hover:border-borda-forte hover:bg-superficie-alta',
  discreto: 'text-tenue hover:text-suave',
}

const TAMANHO: Record<Tamanho, string> = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

/**
 * As classes, separadas do elemento.
 *
 * Existe porque "voltar ao menu" é navegação de verdade — precisa ser `<a>`
 * para abrir em nova aba, ser copiável e ser lido como link —, e ainda assim
 * tem que parecer o mesmo botão. Duplicar a string de classe entre os dois era
 * garantir que um dia só um deles mudaria.
 */
export function classesBotao(variante: Variante, tamanho: Tamanho, extra = ''): string {
  // `active:scale` dá o retorno tátil que faz o clique parecer registrado.
  return `inline-flex items-center justify-center rounded-xl transition-all duration-150 motion-safe:active:scale-[0.97] ${VARIANTE[variante]} ${TAMANHO[tamanho]} ${extra}`
}

export function Botao({
  variante = 'primario',
  tamanho = 'lg',
  className = '',
  ...props
}: ComponentProps<'button'> & { variante?: Variante; tamanho?: Tamanho }) {
  return <button type="button" className={classesBotao(variante, tamanho, className)} {...props} />
}

/** O mesmo botão, mas é um link de verdade. */
export function BotaoLink({
  variante = 'secundario',
  tamanho = 'lg',
  className = '',
  ...props
}: ComponentProps<'a'> & { variante?: Variante; tamanho?: Tamanho }) {
  return <a className={classesBotao(variante, tamanho, className)} {...props} />
}

/** Painel padrão: a superfície de que quase tudo no app é feito. */
export function Painel({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`rounded-2xl border border-borda bg-superficie/80 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

/** Rótulo pequeno em caixa alta, para metadados. */
export function Etiqueta({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      style={style}
      className={`rounded-md border border-borda px-2 py-0.5 font-mono text-[0.7rem] tracking-wide uppercase ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * O selo do jogo, num quadrado de tamanho fixo.
 *
 * O tamanho da fonte cai conforme o ícone é mais largo: ícones como "2·3·5" e
 * "n·μ·M" vazavam do quadrado quando todos usavam a mesma medida. Escalar pelo
 * comprimento resolve sem precisar escolher ícones curtos demais e perder o que
 * eles dizem sobre o jogo.
 */
export function IconeJogo({
  icone,
  categoria,
  tamanho = 'md',
  className = '',
}: {
  icone: string
  categoria: Categoria
  tamanho?: 'sm' | 'md'
  className?: string
}) {
  const cor = CORES_CATEGORIA[categoria]
  const caixa = tamanho === 'sm' ? 'size-8 rounded-lg' : 'size-11 rounded-xl'

  const fonte =
    icone.length <= 1
      ? tamanho === 'sm'
        ? 'text-sm'
        : 'text-lg'
      : icone.length <= 2
        ? tamanho === 'sm'
          ? 'text-xs'
          : 'text-base'
        : icone.length <= 3
          ? 'text-[0.62rem]'
          : 'text-[0.52rem]'

  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center overflow-hidden px-0.5 font-mono font-bold ${caixa} ${fonte} ${cor.fundo} ${cor.texto} ${className}`}
    >
      {icone}
    </span>
  )
}

/**
 * Número grande do placar. Mono e tabular para não dançar a cada mudança.
 *
 * O acerto **aparece**: o número dá um pulo curto e um "+1" sobe e some ao
 * lado. A animação já existia no CSS desde o começo e nunca tinha sido ligada em
 * lugar nenhum — o placar trocava de número em silêncio, que é o mesmo que
 * pontuar sem ninguém avisar. Como todos os quatro motores usam este componente,
 * ligar aqui acende o app inteiro de uma vez.
 *
 * `contar` é para o fim de partida, onde o número sobe de zero até o placar
 * final: no meio do jogo isso seria ridículo, então ali ele fica desligado.
 */
export function Placar({
  valor,
  sufixo,
  total,
  destacado = false,
  contar = false,
}: {
  valor: number
  sufixo?: string
  total?: number
  destacado?: boolean
  contar?: boolean
}) {
  const exibido = useContagem(valor, { ativo: contar })
  const ganho = useGanho(contar ? 0 : valor)

  return (
    <p className="flex items-baseline gap-2">
      <span className="relative">
        <span
          className={`inline-block font-mono text-5xl tabular font-bold transition-colors duration-300 ${
            destacado ? 'text-acento motion-safe:animate-halo' : 'text-texto'
          } ${ganho ? 'motion-safe:animate-pulo' : ''}`}
          style={destacado ? { textShadow: '0 0 28px var(--color-acento)' } : undefined}
        >
          {exibido}
        </span>

        {/* Some sozinho depois de 700 ms, e não no fim da animação: com
            `prefers-reduced-motion` a animação nunca termina porque nunca
            começa, e o "+1" ficaria pendurado na tela para sempre. */}
        {ganho && (
          <span
            aria-hidden
            key={ganho.id}
            className="motion-safe:animate-subir-ponto pointer-events-none absolute -top-2 left-full ml-1.5 font-mono text-xl font-bold text-acento motion-reduce:hidden"
          >
            +{ganho.delta}
          </span>
        )}
      </span>
      {total !== undefined && <span className="font-mono text-xl text-tenue">/{total}</span>}
      {sufixo && <span className="text-sm text-suave">{sufixo}</span>}
    </p>
  )
}

/** O quanto o placar acabou de subir, por 700 ms. `null` quando não subiu. */
function useGanho(valor: number): { delta: number; id: number } | null {
  const anterior = useRef(valor)
  const [ganho, setGanho] = useState<{ delta: number; id: number } | null>(null)

  useEffect(() => {
    const delta = valor - anterior.current
    anterior.current = valor
    // Só para cima: reiniciar a partida zera o placar, e "−37" subindo em
    // vermelho seria o app comemorando o recomeço.
    if (delta <= 0) return

    const id = Date.now()
    setGanho({ delta, id })
    const relogio = setTimeout(() => setGanho((g) => (g?.id === id ? null : g)), 700)
    return () => clearTimeout(relogio)
  }, [valor])

  return ganho
}

/**
 * Barra fina. A variante importa: 'tempo' acende em neon e vira vermelha no
 * fim, 'progresso' fica discreta. Usar a mesma barra para as duas coisas fazia
 * o avanço do baralho parecer contagem regressiva.
 */
export function Barra({
  fracao,
  variante = 'tempo',
  alerta = false,
}: {
  fracao: number
  variante?: 'tempo' | 'progresso'
  alerta?: boolean
}) {
  const tempo = variante === 'tempo'
  return (
    <div className={`overflow-hidden rounded-full bg-superficie-alta ${tempo ? 'h-1.5' : 'h-1'}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-150 ${
          alerta ? 'bg-erro' : tempo ? 'bg-acento' : 'bg-borda-forte'
        }`}
        style={{
          width: `${Math.max(0, Math.min(1, fracao)) * 100}%`,
          boxShadow: tempo && !alerta ? '0 0 12px var(--color-acento)' : undefined,
        }}
      />
    </div>
  )
}
