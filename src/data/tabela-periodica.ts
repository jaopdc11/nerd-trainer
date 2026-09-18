// GERADO POR scripts/gen-elementos.mjs — não edite à mão.
//
// Nomes em português do Brasil conferidos contra SBQ e VOLP. Ver o script para
// a convenção do grupo 3 (La e Ac nas faixas de baixo) e para a armadilha do
// português europeu. Os invariantes estão em `tabela-periodica.test.ts`.

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
  { z: 1, simbolo: 'H', nome: 'Hidrogênio', sinonimos: [], grupo: 1, periodo: 1, bloco: 's', linha: 1, coluna: 1 },
  { z: 2, simbolo: 'He', nome: 'Hélio', sinonimos: [], grupo: 18, periodo: 1, bloco: 's', linha: 1, coluna: 18 },
  { z: 3, simbolo: 'Li', nome: 'Lítio', sinonimos: [], grupo: 1, periodo: 2, bloco: 's', linha: 2, coluna: 1 },
  { z: 4, simbolo: 'Be', nome: 'Berílio', sinonimos: [], grupo: 2, periodo: 2, bloco: 's', linha: 2, coluna: 2 },
  { z: 5, simbolo: 'B', nome: 'Boro', sinonimos: [], grupo: 13, periodo: 2, bloco: 'p', linha: 2, coluna: 13 },
  { z: 6, simbolo: 'C', nome: 'Carbono', sinonimos: [], grupo: 14, periodo: 2, bloco: 'p', linha: 2, coluna: 14 },
  { z: 7, simbolo: 'N', nome: 'Nitrogênio', sinonimos: ['Azoto'], grupo: 15, periodo: 2, bloco: 'p', linha: 2, coluna: 15 },
  { z: 8, simbolo: 'O', nome: 'Oxigênio', sinonimos: [], grupo: 16, periodo: 2, bloco: 'p', linha: 2, coluna: 16 },
  { z: 9, simbolo: 'F', nome: 'Flúor', sinonimos: [], grupo: 17, periodo: 2, bloco: 'p', linha: 2, coluna: 17 },
  { z: 10, simbolo: 'Ne', nome: 'Neônio', sinonimos: [], grupo: 18, periodo: 2, bloco: 'p', linha: 2, coluna: 18 },
  { z: 11, simbolo: 'Na', nome: 'Sódio', sinonimos: ['Natrium'], grupo: 1, periodo: 3, bloco: 's', linha: 3, coluna: 1 },
  { z: 12, simbolo: 'Mg', nome: 'Magnésio', sinonimos: [], grupo: 2, periodo: 3, bloco: 's', linha: 3, coluna: 2 },
  { z: 13, simbolo: 'Al', nome: 'Alumínio', sinonimos: [], grupo: 13, periodo: 3, bloco: 'p', linha: 3, coluna: 13 },
  { z: 14, simbolo: 'Si', nome: 'Silício', sinonimos: [], grupo: 14, periodo: 3, bloco: 'p', linha: 3, coluna: 14 },
  { z: 15, simbolo: 'P', nome: 'Fósforo', sinonimos: [], grupo: 15, periodo: 3, bloco: 'p', linha: 3, coluna: 15 },
  { z: 16, simbolo: 'S', nome: 'Enxofre', sinonimos: ['Sulfur'], grupo: 16, periodo: 3, bloco: 'p', linha: 3, coluna: 16 },
  { z: 17, simbolo: 'Cl', nome: 'Cloro', sinonimos: [], grupo: 17, periodo: 3, bloco: 'p', linha: 3, coluna: 17 },
  { z: 18, simbolo: 'Ar', nome: 'Argônio', sinonimos: [], grupo: 18, periodo: 3, bloco: 'p', linha: 3, coluna: 18 },
  { z: 19, simbolo: 'K', nome: 'Potássio', sinonimos: ['Kalium'], grupo: 1, periodo: 4, bloco: 's', linha: 4, coluna: 1 },
  { z: 20, simbolo: 'Ca', nome: 'Cálcio', sinonimos: [], grupo: 2, periodo: 4, bloco: 's', linha: 4, coluna: 2 },
  { z: 21, simbolo: 'Sc', nome: 'Escândio', sinonimos: [], grupo: 3, periodo: 4, bloco: 'd', linha: 4, coluna: 3 },
  { z: 22, simbolo: 'Ti', nome: 'Titânio', sinonimos: [], grupo: 4, periodo: 4, bloco: 'd', linha: 4, coluna: 4 },
  { z: 23, simbolo: 'V', nome: 'Vanádio', sinonimos: [], grupo: 5, periodo: 4, bloco: 'd', linha: 4, coluna: 5 },
  { z: 24, simbolo: 'Cr', nome: 'Cromo', sinonimos: [], grupo: 6, periodo: 4, bloco: 'd', linha: 4, coluna: 6 },
  { z: 25, simbolo: 'Mn', nome: 'Manganês', sinonimos: [], grupo: 7, periodo: 4, bloco: 'd', linha: 4, coluna: 7 },
  { z: 26, simbolo: 'Fe', nome: 'Ferro', sinonimos: ['Ferrum'], grupo: 8, periodo: 4, bloco: 'd', linha: 4, coluna: 8 },
  { z: 27, simbolo: 'Co', nome: 'Cobalto', sinonimos: [], grupo: 9, periodo: 4, bloco: 'd', linha: 4, coluna: 9 },
  { z: 28, simbolo: 'Ni', nome: 'Níquel', sinonimos: [], grupo: 10, periodo: 4, bloco: 'd', linha: 4, coluna: 10 },
  { z: 29, simbolo: 'Cu', nome: 'Cobre', sinonimos: ['Cuprum'], grupo: 11, periodo: 4, bloco: 'd', linha: 4, coluna: 11 },
  { z: 30, simbolo: 'Zn', nome: 'Zinco', sinonimos: [], grupo: 12, periodo: 4, bloco: 'd', linha: 4, coluna: 12 },
  { z: 31, simbolo: 'Ga', nome: 'Gálio', sinonimos: [], grupo: 13, periodo: 4, bloco: 'p', linha: 4, coluna: 13 },
  { z: 32, simbolo: 'Ge', nome: 'Germânio', sinonimos: [], grupo: 14, periodo: 4, bloco: 'p', linha: 4, coluna: 14 },
  { z: 33, simbolo: 'As', nome: 'Arsênio', sinonimos: ['Arsênico'], grupo: 15, periodo: 4, bloco: 'p', linha: 4, coluna: 15 },
  { z: 34, simbolo: 'Se', nome: 'Selênio', sinonimos: [], grupo: 16, periodo: 4, bloco: 'p', linha: 4, coluna: 16 },
  { z: 35, simbolo: 'Br', nome: 'Bromo', sinonimos: [], grupo: 17, periodo: 4, bloco: 'p', linha: 4, coluna: 17 },
  { z: 36, simbolo: 'Kr', nome: 'Criptônio', sinonimos: [], grupo: 18, periodo: 4, bloco: 'p', linha: 4, coluna: 18 },
  { z: 37, simbolo: 'Rb', nome: 'Rubídio', sinonimos: [], grupo: 1, periodo: 5, bloco: 's', linha: 5, coluna: 1 },
  { z: 38, simbolo: 'Sr', nome: 'Estrôncio', sinonimos: [], grupo: 2, periodo: 5, bloco: 's', linha: 5, coluna: 2 },
  { z: 39, simbolo: 'Y', nome: 'Ítrio', sinonimos: [], grupo: 3, periodo: 5, bloco: 'd', linha: 5, coluna: 3 },
  { z: 40, simbolo: 'Zr', nome: 'Zircônio', sinonimos: [], grupo: 4, periodo: 5, bloco: 'd', linha: 5, coluna: 4 },
  { z: 41, simbolo: 'Nb', nome: 'Nióbio', sinonimos: [], grupo: 5, periodo: 5, bloco: 'd', linha: 5, coluna: 5 },
  { z: 42, simbolo: 'Mo', nome: 'Molibdênio', sinonimos: [], grupo: 6, periodo: 5, bloco: 'd', linha: 5, coluna: 6 },
  { z: 43, simbolo: 'Tc', nome: 'Tecnécio', sinonimos: [], grupo: 7, periodo: 5, bloco: 'd', linha: 5, coluna: 7 },
  { z: 44, simbolo: 'Ru', nome: 'Rutênio', sinonimos: [], grupo: 8, periodo: 5, bloco: 'd', linha: 5, coluna: 8 },
  { z: 45, simbolo: 'Rh', nome: 'Ródio', sinonimos: [], grupo: 9, periodo: 5, bloco: 'd', linha: 5, coluna: 9 },
  { z: 46, simbolo: 'Pd', nome: 'Paládio', sinonimos: [], grupo: 10, periodo: 5, bloco: 'd', linha: 5, coluna: 10 },
  { z: 47, simbolo: 'Ag', nome: 'Prata', sinonimos: ['Argentum'], grupo: 11, periodo: 5, bloco: 'd', linha: 5, coluna: 11 },
  { z: 48, simbolo: 'Cd', nome: 'Cádmio', sinonimos: [], grupo: 12, periodo: 5, bloco: 'd', linha: 5, coluna: 12 },
  { z: 49, simbolo: 'In', nome: 'Índio', sinonimos: [], grupo: 13, periodo: 5, bloco: 'p', linha: 5, coluna: 13 },
  { z: 50, simbolo: 'Sn', nome: 'Estanho', sinonimos: ['Stannum'], grupo: 14, periodo: 5, bloco: 'p', linha: 5, coluna: 14 },
  { z: 51, simbolo: 'Sb', nome: 'Antimônio', sinonimos: ['Stibium'], grupo: 15, periodo: 5, bloco: 'p', linha: 5, coluna: 15 },
  { z: 52, simbolo: 'Te', nome: 'Telúrio', sinonimos: [], grupo: 16, periodo: 5, bloco: 'p', linha: 5, coluna: 16 },
  { z: 53, simbolo: 'I', nome: 'Iodo', sinonimos: [], grupo: 17, periodo: 5, bloco: 'p', linha: 5, coluna: 17 },
  { z: 54, simbolo: 'Xe', nome: 'Xenônio', sinonimos: [], grupo: 18, periodo: 5, bloco: 'p', linha: 5, coluna: 18 },
  { z: 55, simbolo: 'Cs', nome: 'Césio', sinonimos: [], grupo: 1, periodo: 6, bloco: 's', linha: 6, coluna: 1 },
  { z: 56, simbolo: 'Ba', nome: 'Bário', sinonimos: [], grupo: 2, periodo: 6, bloco: 's', linha: 6, coluna: 2 },
  { z: 57, simbolo: 'La', nome: 'Lantânio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 3 },
  { z: 58, simbolo: 'Ce', nome: 'Cério', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 4 },
  { z: 59, simbolo: 'Pr', nome: 'Praseodímio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 5 },
  { z: 60, simbolo: 'Nd', nome: 'Neodímio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 6 },
  { z: 61, simbolo: 'Pm', nome: 'Promécio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 7 },
  { z: 62, simbolo: 'Sm', nome: 'Samário', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 8 },
  { z: 63, simbolo: 'Eu', nome: 'Európio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 9 },
  { z: 64, simbolo: 'Gd', nome: 'Gadolínio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 10 },
  { z: 65, simbolo: 'Tb', nome: 'Térbio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 11 },
  { z: 66, simbolo: 'Dy', nome: 'Disprósio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 12 },
  { z: 67, simbolo: 'Ho', nome: 'Hólmio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 13 },
  { z: 68, simbolo: 'Er', nome: 'Érbio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 14 },
  { z: 69, simbolo: 'Tm', nome: 'Túlio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 15 },
  { z: 70, simbolo: 'Yb', nome: 'Itérbio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 16 },
  { z: 71, simbolo: 'Lu', nome: 'Lutécio', sinonimos: [], grupo: null, periodo: 6, bloco: 'f', linha: 9, coluna: 17 },
  { z: 72, simbolo: 'Hf', nome: 'Háfnio', sinonimos: [], grupo: 4, periodo: 6, bloco: 'd', linha: 6, coluna: 4 },
  { z: 73, simbolo: 'Ta', nome: 'Tântalo', sinonimos: [], grupo: 5, periodo: 6, bloco: 'd', linha: 6, coluna: 5 },
  { z: 74, simbolo: 'W', nome: 'Tungstênio', sinonimos: ['Wolfrâmio', 'Wolfram'], grupo: 6, periodo: 6, bloco: 'd', linha: 6, coluna: 6 },
  { z: 75, simbolo: 'Re', nome: 'Rênio', sinonimos: [], grupo: 7, periodo: 6, bloco: 'd', linha: 6, coluna: 7 },
  { z: 76, simbolo: 'Os', nome: 'Ósmio', sinonimos: [], grupo: 8, periodo: 6, bloco: 'd', linha: 6, coluna: 8 },
  { z: 77, simbolo: 'Ir', nome: 'Irídio', sinonimos: [], grupo: 9, periodo: 6, bloco: 'd', linha: 6, coluna: 9 },
  { z: 78, simbolo: 'Pt', nome: 'Platina', sinonimos: [], grupo: 10, periodo: 6, bloco: 'd', linha: 6, coluna: 10 },
  { z: 79, simbolo: 'Au', nome: 'Ouro', sinonimos: ['Aurum'], grupo: 11, periodo: 6, bloco: 'd', linha: 6, coluna: 11 },
  { z: 80, simbolo: 'Hg', nome: 'Mercúrio', sinonimos: ['Hydrargyrum'], grupo: 12, periodo: 6, bloco: 'd', linha: 6, coluna: 12 },
  { z: 81, simbolo: 'Tl', nome: 'Tálio', sinonimos: [], grupo: 13, periodo: 6, bloco: 'p', linha: 6, coluna: 13 },
  { z: 82, simbolo: 'Pb', nome: 'Chumbo', sinonimos: ['Plumbum'], grupo: 14, periodo: 6, bloco: 'p', linha: 6, coluna: 14 },
  { z: 83, simbolo: 'Bi', nome: 'Bismuto', sinonimos: [], grupo: 15, periodo: 6, bloco: 'p', linha: 6, coluna: 15 },
  { z: 84, simbolo: 'Po', nome: 'Polônio', sinonimos: [], grupo: 16, periodo: 6, bloco: 'p', linha: 6, coluna: 16 },
  { z: 85, simbolo: 'At', nome: 'Astato', sinonimos: ['Ástato'], grupo: 17, periodo: 6, bloco: 'p', linha: 6, coluna: 17 },
  { z: 86, simbolo: 'Rn', nome: 'Radônio', sinonimos: [], grupo: 18, periodo: 6, bloco: 'p', linha: 6, coluna: 18 },
  { z: 87, simbolo: 'Fr', nome: 'Frâncio', sinonimos: [], grupo: 1, periodo: 7, bloco: 's', linha: 7, coluna: 1 },
  { z: 88, simbolo: 'Ra', nome: 'Rádio', sinonimos: [], grupo: 2, periodo: 7, bloco: 's', linha: 7, coluna: 2 },
  { z: 89, simbolo: 'Ac', nome: 'Actínio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 3 },
  { z: 90, simbolo: 'Th', nome: 'Tório', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 4 },
  { z: 91, simbolo: 'Pa', nome: 'Protactínio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 5 },
  { z: 92, simbolo: 'U', nome: 'Urânio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 6 },
  { z: 93, simbolo: 'Np', nome: 'Netúnio', sinonimos: ['Neptúnio'], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 7 },
  { z: 94, simbolo: 'Pu', nome: 'Plutônio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 8 },
  { z: 95, simbolo: 'Am', nome: 'Amerício', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 9 },
  { z: 96, simbolo: 'Cm', nome: 'Cúrio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 10 },
  { z: 97, simbolo: 'Bk', nome: 'Berquélio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 11 },
  { z: 98, simbolo: 'Cf', nome: 'Califórnio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 12 },
  { z: 99, simbolo: 'Es', nome: 'Einstênio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 13 },
  { z: 100, simbolo: 'Fm', nome: 'Férmio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 14 },
  { z: 101, simbolo: 'Md', nome: 'Mendelévio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 15 },
  { z: 102, simbolo: 'No', nome: 'Nobélio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 16 },
  { z: 103, simbolo: 'Lr', nome: 'Laurêncio', sinonimos: [], grupo: null, periodo: 7, bloco: 'f', linha: 10, coluna: 17 },
  { z: 104, simbolo: 'Rf', nome: 'Rutherfórdio', sinonimos: [], grupo: 4, periodo: 7, bloco: 'd', linha: 7, coluna: 4 },
  { z: 105, simbolo: 'Db', nome: 'Dúbnio', sinonimos: [], grupo: 5, periodo: 7, bloco: 'd', linha: 7, coluna: 5 },
  { z: 106, simbolo: 'Sg', nome: 'Seabórgio', sinonimos: [], grupo: 6, periodo: 7, bloco: 'd', linha: 7, coluna: 6 },
  { z: 107, simbolo: 'Bh', nome: 'Bóhrio', sinonimos: [], grupo: 7, periodo: 7, bloco: 'd', linha: 7, coluna: 7 },
  { z: 108, simbolo: 'Hs', nome: 'Hássio', sinonimos: [], grupo: 8, periodo: 7, bloco: 'd', linha: 7, coluna: 8 },
  { z: 109, simbolo: 'Mt', nome: 'Meitnério', sinonimos: [], grupo: 9, periodo: 7, bloco: 'd', linha: 7, coluna: 9 },
  { z: 110, simbolo: 'Ds', nome: 'Darmstácio', sinonimos: [], grupo: 10, periodo: 7, bloco: 'd', linha: 7, coluna: 10 },
  { z: 111, simbolo: 'Rg', nome: 'Roentgênio', sinonimos: [], grupo: 11, periodo: 7, bloco: 'd', linha: 7, coluna: 11 },
  { z: 112, simbolo: 'Cn', nome: 'Copernício', sinonimos: [], grupo: 12, periodo: 7, bloco: 'd', linha: 7, coluna: 12 },
  { z: 113, simbolo: 'Nh', nome: 'Nihônio', sinonimos: [], grupo: 13, periodo: 7, bloco: 'p', linha: 7, coluna: 13 },
  { z: 114, simbolo: 'Fl', nome: 'Fleróvio', sinonimos: [], grupo: 14, periodo: 7, bloco: 'p', linha: 7, coluna: 14 },
  { z: 115, simbolo: 'Mc', nome: 'Moscóvio', sinonimos: [], grupo: 15, periodo: 7, bloco: 'p', linha: 7, coluna: 15 },
  { z: 116, simbolo: 'Lv', nome: 'Livermório', sinonimos: [], grupo: 16, periodo: 7, bloco: 'p', linha: 7, coluna: 16 },
  { z: 117, simbolo: 'Ts', nome: 'Tenesso', sinonimos: [], grupo: 17, periodo: 7, bloco: 'p', linha: 7, coluna: 17 },
  { z: 118, simbolo: 'Og', nome: 'Oganessônio', sinonimos: [], grupo: 18, periodo: 7, bloco: 'p', linha: 7, coluna: 18 },
]
