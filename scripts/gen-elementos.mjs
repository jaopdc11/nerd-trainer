/**
 * Gera `src/data/tabela-periodica.ts`.
 *
 * Os nomes vêm escritos aqui em português do Brasil, conferidos contra a
 * nomenclatura da SBQ e o VOLP. O maior risco deste dataset não é errar um
 * símbolo — é **português europeu infiltrado** via Wikipédia e tradução
 * automática: "Azoto" por Nitrogênio, "Xénon" por Xenônio, "Antimónio" por
 * Antimônio. A regra mecânica é que o pt-BR usa -ônio/-ênio onde o pt-PT usa
 * -ónio/-énio, e há um teste com regex que falha se algum escapar.
 *
 * O que o script calcula sozinho: grupo, período, bloco e a coordenada na
 * grade. Escrever 118 coordenadas à mão seria pedir erro de digitação.
 *
 * Uso: node scripts/gen-elementos.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** [Z, símbolo, nome pt-BR, sinônimos]. Sinônimo só onde o símbolo vem do latim. */
const ELEMENTOS = [
  [1, 'H', 'Hidrogênio', []],
  [2, 'He', 'Hélio', []],
  [3, 'Li', 'Lítio', []],
  [4, 'Be', 'Berílio', []],
  [5, 'B', 'Boro', []],
  [6, 'C', 'Carbono', []],
  [7, 'N', 'Nitrogênio', ['Azoto']],
  [8, 'O', 'Oxigênio', []],
  [9, 'F', 'Flúor', []],
  [10, 'Ne', 'Neônio', []],
  [11, 'Na', 'Sódio', ['Natrium']],
  [12, 'Mg', 'Magnésio', []],
  [13, 'Al', 'Alumínio', []],
  [14, 'Si', 'Silício', []],
  [15, 'P', 'Fósforo', []],
  [16, 'S', 'Enxofre', ['Sulfur']],
  [17, 'Cl', 'Cloro', []],
  [18, 'Ar', 'Argônio', []],
  [19, 'K', 'Potássio', ['Kalium']],
  [20, 'Ca', 'Cálcio', []],
  [21, 'Sc', 'Escândio', []],
  [22, 'Ti', 'Titânio', []],
  [23, 'V', 'Vanádio', []],
  [24, 'Cr', 'Cromo', []],
  [25, 'Mn', 'Manganês', []],
  [26, 'Fe', 'Ferro', ['Ferrum']],
  [27, 'Co', 'Cobalto', []],
  [28, 'Ni', 'Níquel', []],
  [29, 'Cu', 'Cobre', ['Cuprum']],
  [30, 'Zn', 'Zinco', []],
  [31, 'Ga', 'Gálio', []],
  [32, 'Ge', 'Germânio', []],
  [33, 'As', 'Arsênio', ['Arsênico']],
  [34, 'Se', 'Selênio', []],
  [35, 'Br', 'Bromo', []],
  [36, 'Kr', 'Criptônio', []],
  [37, 'Rb', 'Rubídio', []],
  [38, 'Sr', 'Estrôncio', []],
  [39, 'Y', 'Ítrio', []],
  [40, 'Zr', 'Zircônio', []],
  [41, 'Nb', 'Nióbio', []],
  [42, 'Mo', 'Molibdênio', []],
  [43, 'Tc', 'Tecnécio', []],
  [44, 'Ru', 'Rutênio', []],
  [45, 'Rh', 'Ródio', []],
  [46, 'Pd', 'Paládio', []],
  [47, 'Ag', 'Prata', ['Argentum']],
  [48, 'Cd', 'Cádmio', []],
  [49, 'In', 'Índio', []],
  [50, 'Sn', 'Estanho', ['Stannum']],
  [51, 'Sb', 'Antimônio', ['Stibium']],
  [52, 'Te', 'Telúrio', []],
  [53, 'I', 'Iodo', []],
  [54, 'Xe', 'Xenônio', []],
  [55, 'Cs', 'Césio', []],
  [56, 'Ba', 'Bário', []],
  [57, 'La', 'Lantânio', []],
  [58, 'Ce', 'Cério', []],
  [59, 'Pr', 'Praseodímio', []],
  [60, 'Nd', 'Neodímio', []],
  [61, 'Pm', 'Promécio', []],
  [62, 'Sm', 'Samário', []],
  [63, 'Eu', 'Európio', []],
  [64, 'Gd', 'Gadolínio', []],
  [65, 'Tb', 'Térbio', []],
  [66, 'Dy', 'Disprósio', []],
  [67, 'Ho', 'Hólmio', []],
  [68, 'Er', 'Érbio', []],
  [69, 'Tm', 'Túlio', []],
  [70, 'Yb', 'Itérbio', []],
  [71, 'Lu', 'Lutécio', []],
  [72, 'Hf', 'Háfnio', []],
  [73, 'Ta', 'Tântalo', []],
  [74, 'W', 'Tungstênio', ['Wolfrâmio', 'Wolfram']],
  [75, 'Re', 'Rênio', []],
  [76, 'Os', 'Ósmio', []],
  [77, 'Ir', 'Irídio', []],
  [78, 'Pt', 'Platina', []],
  [79, 'Au', 'Ouro', ['Aurum']],
  [80, 'Hg', 'Mercúrio', ['Hydrargyrum']],
  [81, 'Tl', 'Tálio', []],
  [82, 'Pb', 'Chumbo', ['Plumbum']],
  [83, 'Bi', 'Bismuto', []],
  [84, 'Po', 'Polônio', []],
  [85, 'At', 'Astato', ['Ástato']],
  [86, 'Rn', 'Radônio', []],
  [87, 'Fr', 'Frâncio', []],
  [88, 'Ra', 'Rádio', []],
  [89, 'Ac', 'Actínio', []],
  [90, 'Th', 'Tório', []],
  [91, 'Pa', 'Protactínio', []],
  [92, 'U', 'Urânio', []],
  [93, 'Np', 'Netúnio', ['Neptúnio']],
  [94, 'Pu', 'Plutônio', []],
  [95, 'Am', 'Amerício', []],
  [96, 'Cm', 'Cúrio', []],
  [97, 'Bk', 'Berquélio', []],
  [98, 'Cf', 'Califórnio', []],
  [99, 'Es', 'Einstênio', []],
  [100, 'Fm', 'Férmio', []],
  [101, 'Md', 'Mendelévio', []],
  [102, 'No', 'Nobélio', []],
  [103, 'Lr', 'Laurêncio', []],
  [104, 'Rf', 'Rutherfórdio', []],
  [105, 'Db', 'Dúbnio', []],
  [106, 'Sg', 'Seabórgio', []],
  [107, 'Bh', 'Bóhrio', []],
  [108, 'Hs', 'Hássio', []],
  [109, 'Mt', 'Meitnério', []],
  [110, 'Ds', 'Darmstácio', []],
  [111, 'Rg', 'Roentgênio', []],
  [112, 'Cn', 'Copernício', []],
  // Os quatro de 2016: os nomes em pt-BR são os fixados pela SBQ.
  [113, 'Nh', 'Nihônio', []],
  [114, 'Fl', 'Fleróvio', []],
  [115, 'Mc', 'Moscóvio', []],
  [116, 'Lv', 'Livermório', []],
  [117, 'Ts', 'Tenessino', []],
  [118, 'Og', 'Oganessônio', []],
]

/** Grupo (1-18) de cada Z, ou null para lantanídeos e actinídeos. */
function grupoDe(z) {
  if (z === 1) return 1
  if (z === 2) return 18
  if (z >= 3 && z <= 10) return z <= 4 ? z - 2 : z + 8
  if (z >= 11 && z <= 18) return z <= 12 ? z - 10 : z
  if (z >= 19 && z <= 36) return z - 18
  if (z >= 37 && z <= 54) return z - 36
  if (z >= 55 && z <= 56) return z - 54
  if (z >= 57 && z <= 71) return null // lantanídeos
  if (z >= 72 && z <= 86) return z - 68
  if (z >= 87 && z <= 88) return z - 86
  if (z >= 89 && z <= 103) return null // actinídeos
  if (z >= 104 && z <= 118) return z - 100
  return null
}

function periodoDe(z) {
  if (z <= 2) return 1
  if (z <= 10) return 2
  if (z <= 18) return 3
  if (z <= 36) return 4
  if (z <= 54) return 5
  if (z <= 86) return 6
  return 7
}

function blocoDe(z, grupo) {
  if (z >= 57 && z <= 71) return 'f'
  if (z >= 89 && z <= 103) return 'f'
  if (z === 1 || z === 2) return 's'
  if (grupo === 1 || grupo === 2) return 's'
  if (grupo !== null && grupo >= 3 && grupo <= 12) return 'd'
  return 'p'
}

/**
 * Coordenada na grade. A grade principal é 18 colunas × 7 linhas; lantanídeos e
 * actinídeos ficam nas linhas 9 e 10 (a 8 fica vazia, como respiro), ocupando as
 * colunas 3 a 17.
 *
 * Convenção do grupo 3: **La e Ac ficam nas faixas de baixo**, e o grupo 3 da
 * grade principal fica vazio nos períodos 6 e 7. A IUPAC deixa isso em aberto
 * (La vs Lu), então a escolha está registrada aqui e num teste — senão daqui a
 * três meses alguém "corrige" e o jogo passa a cobrar outra resposta.
 */
function gradeDe(z, grupo, periodo) {
  if (z >= 57 && z <= 71) return { linha: 9, coluna: z - 57 + 3 }
  if (z >= 89 && z <= 103) return { linha: 10, coluna: z - 89 + 3 }
  return { linha: periodo, coluna: grupo }
}

const linhas = ELEMENTOS.map(([z, simbolo, nome, sinonimos]) => {
  const grupo = grupoDe(z)
  const periodo = periodoDe(z)
  const bloco = blocoDe(z, grupo)
  const { linha, coluna } = gradeDe(z, grupo, periodo)
  const sins = sinonimos.map((s) => `'${s}'`).join(', ')
  return `  { z: ${z}, simbolo: '${simbolo}', nome: '${nome}', sinonimos: [${sins}], grupo: ${grupo}, periodo: ${periodo}, bloco: '${bloco}', linha: ${linha}, coluna: ${coluna} },`
})

const conteudo = `// GERADO POR scripts/gen-elementos.mjs — não edite à mão.
//
// Nomes em português do Brasil conferidos contra SBQ e VOLP. Ver o script para
// a convenção do grupo 3 (La e Ac nas faixas de baixo) e para a armadilha do
// português europeu. Os invariantes estão em \`tabela-periodica.test.ts\`.

export type Bloco = 's' | 'p' | 'd' | 'f'

export interface Elemento {
  readonly z: number
  /** Case-sensitive: Co é cobalto, CO é monóxido de carbono. */
  readonly simbolo: string
  readonly nome: string
  /** Nomes alternativos aceitos — em geral o latim de onde veio o símbolo. */
  readonly sinonimos: readonly string[]
  /** 1 a 18; null para lantanídeos e actinídeos. */
  readonly grupo: number | null
  readonly periodo: number
  readonly bloco: Bloco
  /** Coordenadas 1-based, no estilo do CSS grid. Linhas 9 e 10 são as faixas f. */
  readonly linha: number
  readonly coluna: number
}

export const COLUNAS_GRADE = 18
export const LINHAS_GRADE = 10

export const ELEMENTOS: readonly Elemento[] = [
${linhas.join('\n')}
]
`

const destino = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'tabela-periodica.ts',
)
writeFileSync(destino, conteudo)

console.log(`${ELEMENTOS.length} elementos gerados`)
const ocupadas = new Set()
let colisoes = 0
for (const [z] of ELEMENTOS) {
  const g = grupoDe(z)
  const { linha, coluna } = gradeDe(z, g, periodoDe(z))
  const chave = `${linha}:${coluna}`
  if (ocupadas.has(chave)) {
    console.error(`  COLISÃO em ${chave} (Z=${z})`)
    colisoes++
  }
  ocupadas.add(chave)
}
console.log(colisoes === 0 ? '  nenhuma colisão de célula' : `  ${colisoes} colisões!`)
