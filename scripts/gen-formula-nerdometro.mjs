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
function lerCurva() {
  const fonte = readFileSync(join(RAIZ, 'src/core/nerdometro.ts'), 'utf8')
  const casa = fonte.match(/export const CURVA = ([\d.]+)/)
  if (!casa) throw new Error('não achei `export const CURVA` em src/core/nerdometro.ts')
  return Number(casa[1])
}

const CURVA = lerCurva()
// Vírgula decimal: é português. `{,}` para o KaTeX não tratar como separador.
const gama = String(CURVA).replace('.', '{,}')

/**
 * `J` é o conjunto dos jogos jogados — o detalhe que a versão anterior escondia
 * e que é justamente a decisão de desenho mais importante da nota.
 */
const FORMULAS = {
  nota: String.raw`
    N \;=\; \frac{\displaystyle\sum_{i \in J} p_i \, f_i^{\,\gamma}}
                 {\displaystyle\sum_{i \in J} p_i}
  `,
  fracao: String.raw`
    f_i \;=\; \min\!\left(1,\; \frac{r_i}{m_i}\right)
    \qquad
    \gamma = ${gama}
  `,
}

/** Símbolo, e o que ele é. A fórmula sem isto é charada. */
const LEGENDA = [
  ['N', 'a nota, de 0 a 100 (× 100 na exibição)'],
  ['J', 'o conjunto dos jogos que você já jogou'],
  ['r_i', 'seu recorde no jogo i'],
  ['m_i', 'a meta do jogo i'],
  ['f_i', 'sua fração da meta, no máximo 1'],
  ['p_i', 'o peso do jogo i'],
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

/** A nota: média dos pesos, com a fração passada pela curva. */
export const FORMULA_NOTA = ${JSON.stringify(paraMathML(FORMULAS.nota))}

/** A fração de cada jogo, e o valor do expoente. */
export const FORMULA_FRACAO = ${JSON.stringify(paraMathML(FORMULAS.fracao))}

/** O que cada símbolo quer dizer. Fórmula sem legenda é charada. */
export const LEGENDA: readonly { readonly simbolo: string; readonly oQueE: string }[] = [
${legenda}
]
`

writeFileSync(join(RAIZ, 'src/data/formula-nerdometro.ts'), saida)
console.log(`formula-nerdometro.ts gerado com CURVA = ${CURVA}, ${LEGENDA.length} símbolos`)
