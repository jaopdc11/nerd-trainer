import {
  BONUS_DE_LIMPEZA,
  CRITERIOS,
  CURVA,
  DIAS_ATE_O_PISO,
  DIAS_DE_GRACA,
  NOTA_MAXIMA,
  PARTIDAS_NA_JANELA,
  PISO_DA_FERRUGEM,
  TETO_DO_JOGO,
} from '@/core/nerdometro'
import { PI_DECIMAIS } from '@/data/constantes-matematicas'
import {
  FORMULA_CONJUNTO,
  FORMULA_FERRUGEM,
  FORMULA_LIMPEZA,
  FORMULA_FRACAO,
  FORMULA_NOTA,
  LEGENDA,
  PARTIDAS_NA_FORMULA,
} from '@/data/formula-nerdometro'
import { PAISES } from '@/data/paises'

/** 0.65 → "0,65". Os números do texto saem do código; a vírgula é nossa. */
const br = (n: number) => String(n).replace('.', ',')

const metaDe = (jogoId: string) => CRITERIOS.find((c) => c.jogoId === jogoId)?.meta ?? 0

/**
 * A conta do Nerdômetro, aberta.
 *
 * Vive em arquivo próprio porque aparece em dois lugares: no detalhe do medidor,
 * no menu, e no fim da tela de recordes — que é onde a pessoa vai justamente
 * para entender os próprios números.
 */
export function FormulaNerdometro() {
  const pesos = [...new Set(CRITERIOS.map((c) => c.peso))].sort((a, b) => b - a)
  const maior = pesos[0] as number
  const menor = pesos[pesos.length - 1] as number

  return (
    /*
      Grid de uma coluna `minmax(0, 1fr)`, e não uma coluna flex.

      A fórmula é a coisa mais larga do app: o MathML do somatório pede uns
      340px e não quebra em lugar nenhum. O `overflow-x-auto` abaixo existe para
      isso e não funcionava — um item de flex nasce com `min-width: auto`, que é
      o min-content do conteúdo, e o bloco se recusava a encolher. Em 320px o
      efeito era visível: a linha do conjunto J terminava em "∧ (nᵢ ≥ 2" e o
      resto ficava fora da tela, sem rolagem que o alcançasse.

      `min-w-0` no bloco não basta porque cada ancestral flex repõe o
      `min-width: auto`; `minmax(0, 1fr)` resolve aqui dentro, sem depender de
      ninguém lembrar de `min-w-0` no próximo painel que hospedar isto.
    */
    <div className="grid grid-cols-[minmax(0,1fr)] gap-2 border-t border-borda pt-3 text-xs leading-relaxed text-tenue">
      {/* MathML pré-renderizado no build, como as fórmulas de física: zero
          KaTeX em runtime. Fórmula escrita em ASCII numa página que se propõe a
          explicar a conta é o mesmo que não explicar. */}
      {/* `mx-auto` em cada fórmula no lugar de `items-center` no pai: com
          `align-items: center`, a fórmula que não cabe transborda dos DOIS
          lados e o começo dela fica inalcançável por rolagem. Margem automática
          centraliza quando sobra espaço e vira zero quando não sobra, que é
          exatamente o que uma caixa rolável precisa. */}
      <div className="formula flex min-w-0 flex-col gap-5 overflow-x-auto py-4 text-texto">
        {/* Gerado por scripts/gen-formula-nerdometro.mjs a partir do código. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle */}
        <div className="mx-auto" dangerouslySetInnerHTML={{ __html: FORMULA_NOTA }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle */}
        <div className="mx-auto text-suave" dangerouslySetInnerHTML={{ __html: FORMULA_FRACAO }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle */}
        <div className="mx-auto text-suave" dangerouslySetInnerHTML={{ __html: FORMULA_LIMPEZA }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle */}
        <div className="mx-auto text-suave" dangerouslySetInnerHTML={{ __html: FORMULA_FERRUGEM }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle */}
        <div className="mx-auto text-suave" dangerouslySetInnerHTML={{ __html: FORMULA_CONJUNTO }} />
      </div>

      {/* Fórmula sem legenda é charada. */}
      <dl className="grid grid-cols-[2.2rem_1fr] items-baseline gap-x-2 gap-y-2 rounded-xl border border-borda bg-fundo-alt/50 p-4 text-sm sm:grid-cols-[2.2rem_1fr_2.2rem_1fr] sm:gap-x-4">
        {LEGENDA.map((l) => (
          <div key={l.oQueE} className="contents">
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle */}
            <dt className="simbolo text-texto" dangerouslySetInnerHTML={{ __html: l.simbolo }} />
            {/* `min-w-0`: a coluna é `1fr`, e `1fr` não encolhe abaixo do
                min-content da própria descrição sem isto. */}
            <dd className="min-w-0 text-suave">{l.oQueE}</dd>
          </div>
        ))}
      </dl>

      <p>
        A nota <strong className="text-suave">não para em 100</strong>. A meta de cada jogo é onde
        ele começa a valer cheio, não onde acaba: dali para cima ainda há{' '}
        {Math.round((TETO_DO_JOGO - 1) * 100)}% de sobra, por duas portas. Uma é{' '}
        <strong className="text-suave">superar a meta</strong>, que vale onde o baralho é maior que
        ela — π pede {metaDe('pi')} casas de milhares. A outra é a{' '}
        <strong className="text-suave">partida limpa</strong>: bater a meta sem errar uma carta vale{' '}
        +{Math.round(BONUS_DE_LIMPEZA * 100)}%, e é a porta dos jogos em que a meta já é o baralho
        inteiro. Com tudo no teto, a nota máxima é {NOTA_MAXIMA}.
      </p>

      <p>
        O que entra na conta é o{' '}
        <strong className="text-suave">melhor das suas {PARTIDAS_NA_JANELA} últimas partidas</strong>{' '}
        em cada jogo, não o recorde de sempre. O recorde continua sendo seu e continua na tela de
        recordes — ele só deixou de ser a régua. A razão é simples: recorde não desce, e uma nota
        que só sobe não mede o que você sabe hoje, mede o que você já soube um dia. Uma sessão ruim
        entre boas não muda nada; {PARTIDAS_NA_JANELA} seguidas, sim.
      </p>

      <p>
        E o que você não joga <strong className="text-suave">enferruja</strong>: passados{' '}
        {DIAS_DE_GRACA} dias sem aparecer, o jogo vai perdendo valor na nota até sobrar{' '}
        {Math.round(PISO_DA_FERRUGEM * 100)}% dele, em {DIAS_ATE_O_PISO} dias. Uma partida devolve o
        valor cheio na hora. O piso existe porque quem sumiu por um ano ainda sabe a tabela
        periódica — o que a ferrugem mede é revisão, não presença.
      </p>

      <p>
        A soma corre só sobre os <strong className="text-suave">jogos jogados</strong>. Jogo
        intocado fica fora do numerador <em>e</em> do denominador — é por isso que lançar jogo novo
        não derruba a nota de ninguém. A trava contra tirar 100 maxando um jogo só não está na
        fórmula, está na etiqueta “em N de M jogos” ali em cima.
      </p>

      <p>
        E a <strong className="text-suave">estreia não conta</strong>: um jogo entra na soma a
        partir da {PARTIDAS_NA_FORMULA}ª partida, ou já na primeira se ela bateu a meta. Uma
        partida é amostra, não desempenho — sem isso, abrir um jogo para ver como é seria o ato
        que derruba a sua nota, e o catálogo só cresce. Quem chegou à meta de primeira não precisa
        provar de novo.
      </p>

      <p>
        A <strong className="text-suave">meta</strong> de cada jogo é o que dá para decorar de
        verdade, não o tamanho do dataset: π pede {metaDe('pi')} casas e o dataset tem{' '}
        {PI_DECIMAIS.length.toLocaleString('pt-BR')}; países pede {metaDe('paises')}, a lista da
        ONU, num tabuleiro de {PAISES.length} territórios.
      </p>

      <p>
        O expoente <span className="font-mono text-suave">{br(CURVA)}</span> é retorno
        decrescente. Ir de 0 a 40 países leva uma tarde; de 140 a 150 leva semanas. Tratar os dois
        trechos como iguais puniria exatamente quem faz o que o app pede, que é saber de tudo um
        pouco.
      </p>

      <p>
        O <strong className="text-suave">peso</strong> vai de {br(maior)} (repertório grande) a{' '}
        {br(menor)} (cálculo rápido), passando por {pesos.slice(1, -1).map(br).join(' e ')}. E
        cuidado:{' '}
        <strong className="text-suave">peso não soma ponto, ele amplifica a sua fração</strong> —
        peso alto num jogo em que você vai mal derruba a nota mais rápido do que um jogo leve
        levanta.
      </p>
    </div>
  )
}
