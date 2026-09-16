/**
 * Gera `src/data/formula-nerdometro.ts`: a fórmula do Nerdômetro em MathML.
 *
 * Mesma decisão de `gen-formulas.mjs` e pelo mesmo motivo — o KaTeX custa
 * ~270 KB de runtime e aqui ele só precisa rodar uma vez, no build. A diferença
 * é que esta fórmula não é dado de jogo: ela descreve o próprio programa.
 *
 * É por isso que o expoente **é lido de `src/core/nerdometro.ts`** em vez de
 * digitado aqui. Uma página que explica a conta e mostra um número diferente do
 * que o código usa é pior que página nenhuma: ela mente com autoridade. Se
 * alguém mudar `CURVA` e esquecer de rodar o script, o teste em
 * `formula-nerdometro.test.ts` quebra.
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
// Vírgula decimal: é português, e a fórmula é texto corrido da página.
const expoente = String(CURVA).replace('.', '{,}')

const FORMULAS = {
  nota: String.raw`\text{nota} = \frac{\sum \left(\text{fração}^{${expoente}} \times \text{peso}\right)}{\sum \text{peso}}`,
  fracao: String.raw`\text{fração} = \min\left(1,\ \frac{\text{recorde}}{\text{meta}}\right)`,
}

function paraMathML(latex) {
  const html = katex.renderToString(latex, { output: 'mathml', throwOnError: true })
  const casa = html.match(/<math[\s\S]*<\/math>/)
  if (!casa) throw new Error(`não consegui extrair o MathML de: ${latex}`)
  // `display="block"` para o navegador centralizar e dar respiro vertical.
  return casa[0].replace('<math', '<math display="block"')
}

const saida = `// GERADO POR scripts/gen-formula-nerdometro.mjs — não edite à mão.
//
// MathML pré-renderizado: zero KaTeX em runtime. O expoente vem de \`CURVA\`, em
// \`src/core/nerdometro.ts\` — rode o script de novo se mudar a constante, e o
// teste avisa se você esquecer.

/** O valor de \`CURVA\` no momento em que este arquivo foi gerado. */
export const CURVA_NA_FORMULA = ${CURVA}

export const FORMULA_NOTA = ${JSON.stringify(paraMathML(FORMULAS.nota))}

export const FORMULA_FRACAO = ${JSON.stringify(paraMathML(FORMULAS.fracao))}
`

writeFileSync(join(RAIZ, 'src/data/formula-nerdometro.ts'), saida)
console.log(`formula-nerdometro.ts gerado com CURVA = ${CURVA}`)
