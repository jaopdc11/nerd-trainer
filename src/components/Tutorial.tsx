import { useEffect, useId, useRef, useState } from 'react'
import {
  BONUS_DE_LIMPEZA,
  CRITERIOS,
  DIAS_DE_GRACA,
  FAIXAS,
  NOTA_MAXIMA,
  PARTIDAS_NA_JANELA,
  PARTIDAS_PARA_ENTRAR,
  PISO_DA_FERRUGEM,
  TETO_DO_JOGO,
} from '@/core/nerdometro'
import { JOGOS, porCategoria } from '@/core/registry'
import { FormulaNerdometro } from './FormulaNerdometro'
import { Botao } from './ui'

/**
 * A primeira vez.
 *
 * Sem isto o jogador caía num menu de dezenas de jogos e seis matérias e tinha
 * de descobrir sozinho o que era meta, o que era o Nerdômetro, por que a nota
 * não mexia depois de uma partida e o que era morte súbita. As regras de cada
 * jogo já estavam no `?` da tela dele e a conta já estava aberta no medidor — o
 * que faltava era alguém dizer que essas coisas existem, e dizer **antes**.
 *
 * Quatro passos e não uma página só: a página só seria lida na diagonal, e a
 * carência de estreia — a coisa que mais faz alguém achar que o app está
 * quebrado — é justamente a que se perderia no meio.
 *
 * Números vindos do código, nunca digitados: um tutorial que diz "72 jogos"
 * depois que o catálogo virou 80 é pior que tutorial nenhum.
 */

const META_PI = CRITERIOS.find((c) => c.jogoId === 'pi')?.meta ?? 0

interface Passo {
  readonly titulo: string
  readonly corpo: React.ReactNode
  /** Só o passo da nota abre a fórmula. */
  readonly comFormula?: boolean
}

function passos(): readonly Passo[] {
  const materias = porCategoria().length

  return [
    {
      titulo: 'O que é isto',
      corpo: (
        <>
          <p>
            <strong className="text-texto">{JOGOS.length} jogos</strong> em {materias} matérias,
            cada um sobre uma coisa que dá para decorar de verdade: os países da ONU, a tabela
            periódica, as casas de π, o código genético, os deuses gregos.
          </p>
          <p>
            Cada partida é curta e tem placar. Não existe conta, login nem servidor — o que você
            faz aqui fica neste navegador e em mais lugar nenhum.
          </p>
        </>
      ),
    },
    {
      titulo: 'Uma partida',
      corpo: (
        <>
          <p>
            Você digita e dá <Tecla>Enter</Tecla>. Quando o que foi digitado só pode ser uma
            resposta, ela entra sozinha, sem Enter. Erro de digitação é perdoado enquanto não der
            para confundir com outra resposta do mesmo baralho.
          </p>
          <p>
            Não sabe? <Tecla>Esc</Tecla> pula a carta, mostra a resposta e conta como erro — não
            saber é a hora de aprender, não de ficar travado.
          </p>
          <p>
            Cada jogo tem as regras dele: relógio, baralho inteiro, morte súbita (um erro e
            acabou). Elas ficam no <Tecla>?</Tecla> no alto da tela do jogo, junto do nome.
          </p>
        </>
      ),
    },
    {
      titulo: 'O Nerdômetro e o ranking',
      comFormula: true,
      corpo: (
        <>
          <p>
            A nota de <strong className="text-texto">0 a 100</strong> no alto do menu. É a média
            ponderada de como você vai em cada jogo — e <em>só</em> nos jogos que você jogou: jogo
            que você nunca abriu fica fora da conta, então lançar jogo novo nunca derruba a sua
            nota.
          </p>
          <p>
            Essa nota te põe num dos <strong className="text-texto">{FAIXAS.length} elos</strong> do
            ranking, de {FAIXAS[0]?.titulo} a {FAIXAS[FAIXAS.length - 1]?.titulo}. O medidor mostra
            o elo, e o arco em volta dele é o quanto falta para o próximo.
          </p>
          <p>
            Cada jogo tem uma <strong className="text-texto">meta</strong>, que não é o dataset
            inteiro: π pede {META_PI} casas, e o dataset tem milhares. A sua fração naquele jogo é o{' '}
            <strong className="text-texto">melhor das suas {PARTIDAS_NA_JANELA} últimas partidas</strong>{' '}
            dividido pela meta — o recorde de sempre fica guardado na tela de recordes, mas quem
            manda na nota é o que você anda fazendo.
          </p>
          <p>
            E a meta não é o fim: dá para passar dela e a nota vai até{' '}
            <strong className="text-texto">{NOTA_MAXIMA}</strong>. Onde o baralho é maior que a
            meta, superá-la rende até {Math.round((TETO_DO_JOGO - 1) * 100)}% a mais; e em qualquer
            jogo, bater a meta <strong className="text-texto">sem errar nada</strong> vale +
            {Math.round(BONUS_DE_LIMPEZA * 100)}%.
          </p>
          <p>
            O medidor também conta os <strong className="text-texto">dias seguidos</strong> que você
            aparece. A ofensiva não vale nota — ela é sobre hábito, e a nota é sobre repertório —,
            mas é ela que segura a ferrugem longe.
          </p>
          <p>
            E o que você não joga <strong className="text-texto">enferruja</strong>: depois de{' '}
            {DIAS_DE_GRACA} dias parado, o jogo começa a valer menos na nota, até um piso de{' '}
            {Math.round(PISO_DA_FERRUGEM * 100)}%. Quer dizer que dá para{' '}
            <em>cair</em> de elo sumindo — e que uma partida devolve o valor cheio na hora. Os jogos
            nessa situação aparecem na etiqueta{' '}
            <span className="text-erro">“enferrujando”</span>, que abre e diz quais são.
          </p>
          <p>
            E a <strong className="text-texto">estreia não conta</strong>: um jogo só entra na nota
            na {PARTIDAS_PARA_ENTRAR}ª partida — ou já na primeira, se ela bateu a meta. É por isso
            que a nota pode não se mexer depois de jogar; os jogos nessa espera aparecem na
            etiqueta <span className="text-quase">“em experiência”</span>, que abre e diz quais
            são.
          </p>
        </>
      ),
    },
    {
      titulo: 'Seus dados',
      corpo: (
        <>
          <p>
            Recordes, histórico e evolução ficam em <strong className="text-texto">Recordes</strong>
            , no canto do menu. Lá também dá para exportar tudo num arquivo e importar em outro
            aparelho.
          </p>
          <p>
            Como não há servidor, limpar os dados do site apaga os seus recordes junto — se eles
            importam, exporte antes.
          </p>
          <p className="text-tenue">
            Isto aqui volta quando você quiser, no <strong className="text-suave">como funciona</strong>{' '}
            do menu.
          </p>
        </>
      ),
    },
  ]
}

function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-borda-forte px-1.5 py-0.5 font-mono text-[0.7rem] text-suave">
      {children}
    </kbd>
  )
}

export function Tutorial({ onFechar }: { onFechar: () => void }) {
  const [i, setI] = useState(0)
  const [conta, setConta] = useState(false)
  const tituloId = useId()
  const painel = useRef<HTMLDivElement>(null)
  const lista = passos()
  const passo = lista[i] as Passo
  const ultimo = i === lista.length - 1

  // Esc fecha, como em qualquer diálogo. `keydown` na janela e não no painel:
  // o foco pode estar no botão de fechar, que é filho, mas também pode ter
  // escapado para o corpo se o navegador restaurou o scroll.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  // O menu tem 72 cartões: sem travar o corpo, rolar dentro do tutorial rola o
  // catálogo atrás dele e a pessoa fecha o diálogo perdida no meio da página.
  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = antes
    }
  }, [])

  // O foco entra no diálogo, senão o Tab seguinte cai nos links do menu que
  // está coberto — e quem usa teclado fica navegando uma página invisível.
  useEffect(() => {
    painel.current?.focus()
  }, [])

  return (
    // `overflow-y-auto` no fundo e `my-auto` no painel: com a fórmula aberta o
    // painel passa da altura da tela, e é a margem automática que impede o topo
    // dele de ser cortado enquanto ele continua centralizado quando cabe.
    <div className="motion-safe:animate-surgir fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-fundo/80 p-4 backdrop-blur-sm sm:p-6">
      {/* O fundo é um botão de verdade, e não uma `div` com `onClick`, para o
          clique fora fechar sem inventar um alvo de clique que nenhum leitor de
          tela entende. Fica fora da árvore de acessibilidade de propósito: para
          teclado e leitor de tela a saída é o Esc e o ✕ do cabeçalho, e um
          segundo botão "Fechar" só duplicaria o mesmo comando. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onFechar}
        className="absolute inset-0 cursor-default"
      />

      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className="relative my-auto flex w-full max-w-2xl flex-col gap-5 rounded-2xl border border-borda bg-superficie p-5 shadow-2xl outline-none sm:p-6"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs tracking-[0.25em] text-tenue uppercase">
              como funciona · {i + 1} de {lista.length}
            </p>
            <h2 id={tituloId} className="fonte-display text-2xl leading-none font-bold">
              {passo.titulo}
            </h2>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-borda text-tenue transition-colors hover:border-borda-forte hover:text-suave"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-3 text-sm leading-relaxed text-suave">{passo.corpo}</div>

        {/* A conta inteira, dentro do passo que fala dela: quem quer ver a
            fórmula quer ver agora, e quem não quer não pode ser obrigado a
            rolar por ela para chegar ao botão de fechar. */}
        {passo.comFormula && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setConta((v) => !v)}
              aria-expanded={conta}
              className="self-start text-xs text-tenue underline decoration-borda-forte underline-offset-4 transition-colors hover:text-suave"
            >
              {conta ? 'esconder a conta' : 'ver a conta inteira'}
            </button>
            {conta && <FormulaNerdometro />}
          </div>
        )}

        <footer className="flex items-center justify-between gap-3 border-t border-borda pt-4">
          <div aria-hidden className="flex gap-1.5">
            {lista.map((p, j) => (
              <span
                key={p.titulo}
                className={`size-1.5 rounded-full transition-colors ${
                  j === i ? 'bg-acento' : 'bg-borda-forte'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {i > 0 && (
              <Botao variante="discreto" tamanho="md" onClick={() => setI((v) => v - 1)}>
                voltar
              </Botao>
            )}
            {ultimo ? (
              <Botao tamanho="md" onClick={onFechar}>
                jogar
              </Botao>
            ) : (
              <Botao tamanho="md" onClick={() => setI((v) => v + 1)}>
                próximo
              </Botao>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
