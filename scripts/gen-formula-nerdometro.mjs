/**
 * Gera `src/data/formula-nerdometro.ts`: a fórmula do Nerdômetro em MathML.
 *
 * Mesma decisão de `gen-formulas.mjs` e pelo mesmo motivo — o KaTeX custa
 * ~270 KB de runtime e aqui ele só precisa rodar uma vez, no build.
 *
 * **Notação de verdade, não fórmula ilustrativa.** A primeira versão escrevia
 * `Σ(fração^0,65 × peso) / Σ(peso)`, e isso não é matemática: somatório sem
 * índice não soma coisa nenhuma, e palavra por extenso dentro do operando é
 * legenda disfarçada de variável. Num app que cobra a tabela periódica do
 * jogador, escrever fórmula errada na tela que explica a própria nota é o
 * defeito mais constrangedor possível. Agora tem índice, conjunto de
 * somatório e uma legenda dizendo o que cada símbolo é.
 *
 * Os limites do somatório vão ao LADO do sigma, não embaixo: com
 * limites embaixo o KaTeX emite `<munder>`, e o MathML nativo do navegador
 * empilha o `i ∈ J` colado no próprio sigma — ilegível. `\nolimits` força
 * `<msub>`, que é a mesma matemática e cabe na linha. Tirar o `\displaystyle`
 * não bastou: `\dfrac` reimpõe display style nos dois lados da fração. O teste
 * confere `munder = 0` no MathML gerado, porque é a única parte disso que dá
 * para verificar sem olhar a tela.
 *
 * O expoente **é lido de `src/core/nerdometro.ts`** em vez de digitado aqui.
 * Uma página que explica a conta e mostra um número diferente do que o código
 * usa mente com autoridade. Se alguém mudar `CURVA` e esquecer de rodar o
 * script, o teste em `formula-nerdometro.test.ts` quebra.
 *
 * Uso: node scripts/gen-formula-nerdometro.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..')

/** Lê a constante da fonte da verdade, sem importar TypeScript. */
function lerConstante(nome) {
  const fonte = readFileSync(join(RAIZ, 'src/core/nerdometro.ts'), 'utf8')
  const casa = fonte.match(new RegExp(`const ${nome} = ([\\d.]+)`))
  if (!casa) throw new Error(`não achei "const ${nome}" em src/core/nerdometro.ts`)
  return Number(casa[1])
}

const CURVA = lerConstante('CURVA')
/** A carência de estreia, lida da mesma fonte da verdade que o expoente. */
const PARTIDAS = lerConstante('PARTIDAS_PARA_ENTRAR')
/** A janela e a ferrugem, pela mesma razão: a tela não pode inventar número. */
const JANELA = lerConstante('PARTIDAS_NA_JANELA')
const GRACA = lerConstante('DIAS_DE_GRACA')
const PRAZO = lerConstante('DIAS_ATE_O_PISO')
const PISO = lerConstante('PISO_DA_FERRUGEM')
/** O teto por jogo e o bônus de partida limpa, da mesma fonte da verdade. */
const TETO = lerConstante('TETO_DO_JOGO')
const BONUS = lerConstante('BONUS_DE_LIMPEZA')
// Vírgula decimal: é português. `{,}` para o KaTeX não tratar como separador.
const br = (n) => String(n).replace('.', '{,}')
const gama = br(CURVA)
const piso = br(PISO)
/** A queda total e o trecho em que ela acontece, como aparecem na fórmula. */
const queda = br(Math.round((1 - PISO) * 100) / 100)
const teto = br(TETO)
const bonus = br(BONUS)
const trecho = PRAZO - GRACA

/**
 * `J` é o conjunto dos jogos que entram na conta — o detalhe que a versão
 * anterior escondia e que é justamente a decisão de desenho mais importante da
 * nota. Ele ganhou linha própria quando a carência de estreia entrou: dizer
 * "jogos jogados" na legenda e aplicar outra regra no código seria a mesma
 * mentira que este arquivo existe para evitar.
 */
const FORMULAS = {
  nota: String.raw`
    N \;=\; \dfrac{\sum\nolimits_{i \in J} \, p_i \, (f_i \, \rho_i)^{\,\gamma}}
                  {\sum\nolimits_{i \in J} \, p_i}
  `,
  fracao: String.raw`
    f_i \;=\; \min\!\left(${teto},\; \frac{v_i}{m_i} + ${bonus}\,\ell_i\right)
    \qquad
    v_i \;=\; \max\{\, s_{i,1},\, \ldots,\, s_{i,${JANELA}} \}
    \qquad
    \gamma = ${gama}
  `,
  ferrugem: String.raw`
    \rho_i \;=\;
    \begin{cases}
      1, & d_i \le ${GRACA} \\[2pt]
      \max\!\left(${piso},\; 1 - ${queda}\,\dfrac{d_i - ${GRACA}}{${trecho}}\right), & d_i > ${GRACA}
    \end{cases}
  `,
  limpeza: String.raw`
    \ell_i \;=\;
    \begin{cases}
      1, & \text{alguma das } ${JANELA} \text{ últimas bateu } m_i \text{ sem erro} \\[2pt]
      0, & \text{caso contrário}
    \end{cases}
  `,
  conjunto: String.raw`
    J \;=\; \left\{\, i \;:\; v_i > 0 \;\wedge\; \left(n_i \geq ${PARTIDAS} \;\vee\; f_i = 1\right) \right\}
  `,
}

/** Símbolo, e o que ele é. A fórmula sem isto é charada. */
const LEGENDA = [
  ['N', 'a nota, de 0 a 100 (× 100 na exibição)'],
  ['J', 'os jogos que entram na conta'],
  ['s_{i,j}', `a pontuação da j-ésima partida mais recente do jogo i`],
  ['v_i', `seu placar vigente: o melhor das ${JANELA} últimas partidas`],
  ['m_i', 'a meta do jogo i'],
  ['f_i', `sua fração da meta, no máximo ${br(TETO).replace('{,}', ',')}`],
  ['\\ell_i', 'vale 1 se você bateu a meta sem errar nada'],
  ['d_i', 'dias desde a última vez que você jogou o jogo i'],
  ['\\rho_i', 'a ferrugem: quanto daquilo ainda vale hoje'],
  ['p_i', 'o peso do jogo i'],
  ['n_i', 'quantas partidas você jogou do jogo i'],
  ['\\gamma', 'o expoente do retorno decrescente'],
]

function paraMathML(latex, bloco = true) {
  const html = katex.renderToString(latex, { output: 'mathml', throwOnError: true })
  const casa = html.match(/<math[\s\S]*<\/math>/)
  if (!casa) throw new Error(`não consegui extrair o MathML de: ${latex}`)
  return bloco ? casa[0].replace('<math', '<math display="block"') : casa[0]
}

const legenda = LEGENDA.map(
  ([simbolo, oQueE]) =>
    `  { simbolo: ${JSON.stringify(paraMathML(simbolo, false))}, oQueE: ${JSON.stringify(oQueE)} },`,
).join('\n')

const saida = `// GERADO POR scripts/gen-formula-nerdometro.mjs — não edite à mão.
//
// MathML pré-renderizado: zero KaTeX em runtime. O expoente vem de \`CURVA\`, em
// \`src/core/nerdometro.ts\` — rode o script de novo se mudar a constante, e o
// teste avisa se você esquecer.

/** O valor de \`CURVA\` no momento em que este arquivo foi gerado. */
export const CURVA_NA_FORMULA = ${CURVA}

/** O valor de \`PARTIDAS_PARA_ENTRAR\` no momento em que este arquivo foi gerado. */
export const PARTIDAS_NA_FORMULA = ${PARTIDAS}

/** Os valores da janela e da ferrugem no momento em que este arquivo foi gerado. */
export const JANELA_NA_FORMULA = ${JANELA}
export const GRACA_NA_FORMULA = ${GRACA}
export const PRAZO_NA_FORMULA = ${PRAZO}
export const PISO_NA_FORMULA = ${PISO}

/** O teto por jogo e o bônus de limpeza no momento da geração. */
export const TETO_NA_FORMULA = ${TETO}
export const BONUS_NA_FORMULA = ${BONUS}

/** A nota: média dos pesos, com a fração passada pela curva. */
export const FORMULA_NOTA = ${JSON.stringify(paraMathML(FORMULAS.nota))}

/** A fração de cada jogo, o placar vigente e o valor do expoente. */
export const FORMULA_FRACAO = ${JSON.stringify(paraMathML(FORMULAS.fracao))}

/** A ferrugem: o que o tempo parado faz com a fração. */
export const FORMULA_FERRUGEM = ${JSON.stringify(paraMathML(FORMULAS.ferrugem))}

/** A partida limpa, que é a outra porta para passar de 100. */
export const FORMULA_LIMPEZA = ${JSON.stringify(paraMathML(FORMULAS.limpeza))}

/** Quem entra na soma: a carência de estreia, escrita como conjunto. */
export const FORMULA_CONJUNTO = ${JSON.stringify(paraMathML(FORMULAS.conjunto))}

/** O que cada símbolo quer dizer. Fórmula sem legenda é charada. */
export const LEGENDA: readonly { readonly simbolo: string; readonly oQueE: string }[] = [
${legenda}
]
`

writeFileSync(join(RAIZ, 'src/data/formula-nerdometro.ts'), saida)
console.log(
  `formula-nerdometro.ts gerado com CURVA = ${CURVA}, carência ${PARTIDAS}, janela ${JANELA}, ` +
    `ferrugem ${GRACA}→${PRAZO} dias até ${PISO}, ${LEGENDA.length} símbolos`,
)
