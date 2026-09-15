/**
 * Gera `src/data/constantes-matematicas.ts` com os dígitos de pi, e, phi e √2.
 *
 * Por que gerar em vez de copiar de um site: um dígito trocado no meio do
 * arquivo ensina errado por meses e é indetectável a olho — ninguém joga até a
 * casa 600 tão cedo. Aqui a fonte de verdade é a matemática, e o teste em
 * `constantes-matematicas.test.ts` reconfere por caminhos DIFERENTES dos usados
 * aqui (Euler em vez de Machin para pi; identidades x²=2 e φ²=φ+1 para as
 * raízes), de modo que o teste não seja este mesmo código se autoaprovando.
 *
 * Uso: node scripts/gen-constants.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// π tem 10x mais porque é o jogo principal e porque é o único que alguém treina
// a sério. Subir estes números é barato: 10.000 casas saem em ~37 ms e pesam
// ~4 KB gzipados. O teto prático é o tempo do teste, que recomputa tudo.
const CASAS_PI = 10_000
const CASAS_OUTRAS = 2_000
/** Casas extras descartadas no fim: absorvem o erro de truncamento da série. */
const GUARDA = 25

/** arctan(1/x) escalado por `unidade`, por série de Gregory. */
function arctanInverso(x, unidade) {
  const x2 = BigInt(x) * BigInt(x)
  let termo = unidade / BigInt(x)
  let soma = 0n
  let k = 0n
  while (termo !== 0n) {
    const parcela = termo / (2n * k + 1n)
    soma += k % 2n === 0n ? parcela : -parcela
    termo /= x2
    k += 1n
  }
  return soma
}

/** Machin: pi/4 = 4·arctan(1/5) − arctan(1/239). */
function calcularPi(unidade) {
  return 4n * (4n * arctanInverso(5, unidade) - arctanInverso(239, unidade))
}

/** e = Σ 1/k!, escalado por `unidade`. */
function calcularE(unidade) {
  let termo = unidade
  let soma = 0n
  let k = 1n
  while (termo !== 0n) {
    soma += termo
    termo /= k
    k += 1n
  }
  return soma
}

/** Raiz inteira por Newton: maior r com r² ≤ n. */
function raizInteira(n) {
  if (n < 2n) return n
  let x = 1n << (BigInt(n.toString(2).length) / 2n + 1n)
  for (;;) {
    const proximo = (x + n / x) >> 1n
    if (proximo >= x) return x
    x = proximo
  }
}

const calcularRaizDe = (m, unidade) => raizInteira(BigInt(m) * unidade * unidade)
const calcularPhi = (unidade) => (unidade + calcularRaizDe(5, unidade)) / 2n

/**
 * Converte o inteiro escalado nas casas decimais, já truncadas.
 * Todas estas constantes têm um único dígito antes da vírgula.
 */
function decimaisDe(valor, casas) {
  const texto = valor.toString()
  return texto.slice(1, 1 + casas)
}

function gerar(casas) {
  const unidade = 10n ** BigInt(casas + GUARDA)
  return {
    pi: decimaisDe(calcularPi(unidade), casas),
    e: decimaisDe(calcularE(unidade), Math.min(casas, CASAS_OUTRAS)),
    phi: decimaisDe(calcularPhi(unidade), Math.min(casas, CASAS_OUTRAS)),
    raiz2: decimaisDe(calcularRaizDe(2, unidade), Math.min(casas, CASAS_OUTRAS)),
  }
}

const inicio = performance.now()
const d = gerar(CASAS_PI)
const ms = Math.round(performance.now() - inicio)

/** Quebra a string em linhas legíveis, para o arquivo não ter uma linha de 1000 chars. */
function emLinhas(digitos, porLinha = 60) {
  const linhas = []
  for (let i = 0; i < digitos.length; i += porLinha) {
    linhas.push(`    '${digitos.slice(i, i + porLinha)}'`)
  }
  return linhas.join(' +\n')
}

const conteudo = `// GERADO POR scripts/gen-constants.mjs — não edite à mão.
//
// Os dígitos abaixo são recomputados e conferidos em
// \`constantes-matematicas.test.ts\`, por caminhos diferentes dos que os geraram.
// Se você precisar de mais casas, mude as constantes no script e rode de novo.

/** Casas decimais de π, sem o "3," inicial. */
export const PI_DECIMAIS =
${emLinhas(d.pi)}

/** Casas decimais de e, sem o "2," inicial. */
export const E_DECIMAIS =
${emLinhas(d.e)}

/** Casas decimais de φ = (1+√5)/2, sem o "1," inicial. */
export const PHI_DECIMAIS =
${emLinhas(d.phi)}

/** Casas decimais de √2, sem o "1," inicial. */
export const RAIZ2_DECIMAIS =
${emLinhas(d.raiz2)}
`

const destino = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'constantes-matematicas.ts',
)
writeFileSync(destino, conteudo)

console.log(`gerado em ${ms} ms`)
console.log(`  pi    ${d.pi.length} casas · começa em ${d.pi.slice(0, 20)}`)
console.log(`  e     ${d.e.length} casas · começa em ${d.e.slice(0, 20)}`)
console.log(`  phi   ${d.phi.length} casas · começa em ${d.phi.slice(0, 20)}`)
console.log(`  raiz2 ${d.raiz2.length} casas · começa em ${d.raiz2.slice(0, 20)}`)
console.log(`  ponto de Feynman (casas 762-767): ${d.pi.slice(761, 767)}`)
