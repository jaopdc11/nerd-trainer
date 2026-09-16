import { PARTIDAS_PARA_ENTRAR } from '@/core/nerdometro'
import type { LinhaNerdometro } from '@/core/nerdometro'
import { Etiqueta } from './ui'

/**
 * A meta do jogo no Nerdômetro, dita **antes** da partida.
 *
 * Duas regras de `core/nerdometro.ts` o jogador sente na pele e não enxergava:
 *
 * 1. **A meta quase nunca é o baralho inteiro** (`CRITERIOS`). π vale nota cheia
 *    em 100 casas, países em 195 de um tabuleiro de 197. Quem não sabe disso
 *    joga sem alvo, e o medidor do menu só conta a história depois, quando a
 *    partida já acabou.
 * 2. **A estreia não conta** (`PARTIDAS_PARA_ENTRAR`), salvo se já bateu a meta.
 *    Isto só aparecia como a etiqueta "N em experiência" no medidor — ou seja,
 *    *depois* do fato. Jogar e ver a nota parada é exatamente o que faz alguém
 *    procurar bug onde não tem.
 *
 * **Nada é recalculado aqui.** Tudo vem da `LinhaNerdometro` que `calcular()`
 * devolve: `naNota` e `dominado` já são o veredito da mesma função que soma a
 * nota. A alternativa — reler `CRITERIOS` e refazer o `partidas >= 2 || fração
 * >= 1` neste arquivo — foi descartada porque no primeiro ajuste de regra a tela
 * passaria a prometer uma coisa e o medidor a fazer outra, que é pior do que não
 * dizer nada.
 *
 * Um componente só para as quatro mecânicas, e não um bloco copiado dentro de
 * cada `Abertura`: este é texto sobre uma regra que já mudou uma vez e vai mudar
 * de novo. Quatro cópias divergem na primeira mudança.
 *
 * Tamanho é requisito, não capricho: a abertura já tem etiquetas, explicação e
 * recorde acima do botão Começar. Por isso o bloco é uma linha de etiquetas mais
 * uma frase curta — a explicação longa da fórmula continua sendo trabalho da
 * `FormulaNerdometro`, no menu, onde há espaço.
 */
export function MetaNerdometro({ linha }: { linha: LinhaNerdometro | null }) {
  // Jogo fora de `CRITERIOS` — jogo novo que ainda não entrou no balanceamento,
  // ou partida num modo, que grava em chave própria e não alimenta a nota. Não
  // ter meta é informação nenhuma a dar; inventar uma seria mentir.
  if (!linha) return null

  const { estado, frase } = ler(linha)

  return (
    <section
      aria-label="Meta no Nerdômetro"
      className="flex w-full max-w-md flex-col items-center gap-1.5 rounded-xl border border-borda/70 bg-fundo-alt/40 px-4 py-2.5 text-center"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Etiqueta className={estado === 'dominado' ? 'border-acento/40 text-acento' : 'text-suave'}>
          nerdômetro · meta {linha.meta}
          {estado === 'dominado' ? ' batida' : ''}
        </Etiqueta>

        {/* O mesmo rótulo do medidor do menu, de propósito: quem vê "em
            experiência" aqui e depois lá tem de saber que é a mesma coisa. */}
        {estado === 'experiencia' && (
          <Etiqueta className="border-quase/40 text-quase">em experiência</Etiqueta>
        )}
        {estado === 'zerado' && <Etiqueta className="text-tenue">fora da nota</Etiqueta>}
      </div>

      <p className="text-xs leading-snug text-tenue">{frase}</p>
    </section>
  )
}

type Estado = 'nunca' | 'zerado' | 'experiencia' | 'naNota' | 'dominado'

/**
 * O estado e a frase, derivados só do que a linha já traz.
 *
 * A ordem dos testes segue a de `entraNaNota`: primeiro o teto (bateu a meta),
 * depois quem já pesa, e por último os dois jeitos de estar fora — sem
 * pontuação e em carência. `zerado` existe porque `entraNaNota` exige
 * `recorde > 0`: quem jogou duas vezes e fez zero está fora da nota sem estar
 * "em experiência", e chamar isso de estreia seria falso.
 *
 * Os números da regra saem das constantes, nunca do texto: com
 * `PARTIDAS_PARA_ENTRAR` em 2 a frase fala da próxima partida, e se um dia ela
 * virar 3 a frase se corrige sozinha em vez de virar mentira bem escrita.
 */
function ler(l: LinhaNerdometro): { estado: Estado; frase: string } {
  if (l.dominado) {
    return {
      estado: 'dominado',
      frase:
        'você já tira nota cheia aqui — daqui para cima o nerdômetro não sobe mais neste jogo.',
    }
  }

  if (l.naNota) {
    return {
      estado: 'naNota',
      frase: `já pesa na nota, com recorde de ${l.recorde}: faltam ${l.meta - l.recorde} para a nota cheia deste jogo.`,
    }
  }

  if (l.recorde <= 0) {
    // Sem ponto nenhum e com partida no histórico: o jogo não está em carência,
    // está zerado. E como as partidas já foram jogadas, o primeiro ponto basta
    // para ele entrar — dizer "jogue de novo" aqui mandaria fazer o que já foi
    // feito.
    if (l.partidas > 0) {
      return {
        estado: 'zerado',
        frase: 'zero não entra na nota: do primeiro ponto em diante, este jogo passa a pesar.',
      }
    }

    return {
      estado: 'nunca',
      frase: `nunca jogado: a estreia só entra na nota se já bater a meta — senão, o jogo entra na ${PARTIDAS_PARA_ENTRAR}ª partida.`,
    }
  }

  const faltam = PARTIDAS_PARA_ENTRAR - l.partidas
  const quantas = l.partidas === 1 ? 'uma partida só' : `${l.partidas} partidas`

  return {
    estado: 'experiencia',
    frase:
      faltam <= 1
        ? `${quantas}, e abaixo da meta — ainda não pesa na nota. a próxima matricula o jogo, seja qual for o placar.`
        : `${quantas}, e abaixo da meta — faltam ${faltam} partidas para o jogo entrar na nota.`,
  }
}
