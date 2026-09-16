import { CURVA, CRITERIOS } from '@/core/nerdometro'
import { PI_DECIMAIS } from '@/data/constantes-matematicas'
import { FORMULA_FRACAO, FORMULA_NOTA, LEGENDA } from '@/data/formula-nerdometro'
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
    <div className="flex flex-col gap-2 border-t border-borda pt-3 text-xs leading-relaxed text-tenue">
      {/* MathML pré-renderizado no build, como as fórmulas de física: zero
          KaTeX em runtime. Fórmula escrita em ASCII numa página que se propõe a
          explicar a conta é o mesmo que não explicar. */}
      <div className="flex flex-col items-center gap-3 py-2 text-base text-texto">
        {/* Gerado por scripts/gen-formula-nerdometro.mjs a partir do código. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle */}
        <div className="text-lg" dangerouslySetInnerHTML={{ __html: FORMULA_NOTA }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle */}
        <div className="text-suave" dangerouslySetInnerHTML={{ __html: FORMULA_FRACAO }} />
      </div>

      {/* Fórmula sem legenda é charada. */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_1fr_auto_1fr] sm:gap-x-4">
        {LEGENDA.map((l) => (
          <div key={l.oQueE} className="contents">
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo estático do bundle */}
            <dt className="text-suave" dangerouslySetInnerHTML={{ __html: l.simbolo }} />
            <dd className="text-tenue">{l.oQueE}</dd>
          </div>
        ))}
      </dl>

      <p>
        A soma corre só sobre os <strong className="text-suave">jogos jogados</strong>. Jogo
        intocado fica fora do numerador <em>e</em> do denominador — é por isso que lançar jogo novo
        não derruba a nota de ninguém. A trava contra tirar 100 maxando um jogo só não está na
        fórmula, está na etiqueta “em N de M jogos” ali em cima.
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
