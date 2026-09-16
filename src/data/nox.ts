/**
 * Número de oxidação.
 *
 * O nox **não** está gravado em lugar nenhum: cada composto declara só a
 * composição e a carga, e `nox()` resolve a equação. Guardar a resposta junto
 * seria pedir para um dedo errado ensinar química errada — do mesmo jeito que
 * `String(2**64)` ensinaria o dígito errado no jogo de potências.
 *
 * O efeito bonito é que as armadilhas saem de graça. Em `H₂O₂` o oxigênio vale
 * −1 e não −2; em `NaH` o hidrogênio vale −1 e não +1; em `OF₂` o oxigênio vale
 * +2, porque o flúor é o único elemento mais eletronegativo que ele. Nenhum
 * desses casos precisa de exceção escrita — basta que o átomo perguntado seja
 * justamente o que foge da regra, e a conta cospe o valor surpreendente
 * sozinha. É por isso que o nível 2 existe.
 */

/**
 * Nox que um elemento assume quando *não* é o que está sendo perguntado.
 *
 * Só entram elementos de nox praticamente fixo. Nada de enfiar aqui metal de
 * transição ou halogênio ligado a oxigênio: nesses o valor depende do composto,
 * e é exatamente isso que o jogo pergunta.
 */
const FIXOS: Readonly<Record<string, number>> = {
  F: -1,
  Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Ag: 1,
  Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Zn: 2,
  Al: 3,
  H: 1,
  O: -2,
  Cl: -1, Br: -1, I: -1,
}

export interface Composto {
  readonly formula: string
  readonly nome: string
  /** Símbolo do átomo cujo nox se pergunta. */
  readonly alvo: string
  /** Composição na ordem da fórmula: [símbolo, quantidade]. */
  readonly atomos: readonly (readonly [string, number])[]
  /** Carga total. 0 para composto neutro. */
  readonly carga: number
  /** Por que a resposta surpreende. Só nas armadilhas. */
  readonly porque?: string
  readonly nivel: 0 | 1 | 2
}

/**
 * Resolve o nox do átomo alvo pela soma dos nox = carga total.
 *
 * Lança quando algum acompanhante não tem nox fixo conhecido: um composto mal
 * cadastrado precisa quebrar na hora, não devolver um número plausível e
 * errado.
 */
export function nox(c: Composto): number {
  let conhecidos = 0
  let quantidadeAlvo = 0

  for (const [simbolo, n] of c.atomos) {
    if (simbolo === c.alvo) {
      quantidadeAlvo += n
      continue
    }
    const fixo = FIXOS[simbolo]
    if (fixo === undefined) {
      throw new Error(`${c.formula}: ${simbolo} não tem nox fixo, não dá para resolver`)
    }
    conhecidos += fixo * n
  }

  if (quantidadeAlvo === 0) {
    throw new Error(`${c.formula}: o alvo ${c.alvo} não aparece na composição`)
  }

  const valor = (c.carga - conhecidos) / quantidadeAlvo
  if (!Number.isInteger(valor)) {
    // Superóxido daria −1/2. Fora do escopo: a resposta tem de ser um inteiro.
    throw new Error(`${c.formula}: nox de ${c.alvo} não é inteiro (${valor})`)
  }
  return valor
}

/** "+6", "−2", "0" — o menos é o tipográfico, como no resto do app. */
export function exibirNox(valor: number): string {
  if (valor === 0) return '0'
  return valor > 0 ? `+${valor}` : `−${Math.abs(valor)}`
}

/** Fora desta faixa não existe nox de verdade, e a opção se eliminaria sozinha. */
const FAIXA_MIN = -4
const FAIXA_MAX = 7

/** `nox()` sem explodir: devolve null onde o composto hipotético não fecha. */
function tentar(c: Composto): number | null {
  try {
    return nox(c)
  } catch {
    return null
  }
}

/**
 * As respostas erradas que um humano de fato marca, em ordem de prioridade.
 *
 * Distrator aleatório não mede nada: quem sabe a regra elimina "+9" sem pensar,
 * e quem não sabe chuta igual. Os três primeiros da lista são erros com nome:
 *
 * 1. **a regra decorada** — "oxigênio é −2", "hidrogênio é +1", "halogênio é
 *    −1". É o nível 2 inteiro: em `H₂O₂`, `NaH` e `OF₂` a resposta certa é
 *    justamente a que contradiz isso, e a opção errada é o que o livro diria.
 * 2. **a carga esquecida** — resolve o íon como se fosse neutro. É o erro do
 *    nível 1, onde a soma fecha em −2 e não em zero.
 * 3. **o sinal trocado** — acertou o módulo e errou de que lado ele está.
 *
 * Depois deles vêm os vizinhos, que só existem para completar as quatro opções
 * quando os erros com nome não se aplicam ou caem em cima da resposta certa.
 * Fica no dataset, e não no jogo, porque a lista é química: quem mexer nos
 * compostos tem de ver os distratores na mesma tela.
 */
export function distratores(c: Composto): readonly number[] {
  const certo = nox(c)
  const decorada = FIXOS[c.alvo]
  const semCarga = c.carga === 0 ? null : tentar({ ...c, carga: 0 })

  const candidatos = [
    ...(decorada === undefined ? [] : [decorada]),
    ...(semCarga === null ? [] : [semCarga]),
    -certo,
    certo - 1,
    certo + 1,
    certo - 2,
    certo + 2,
    certo - 3,
    certo + 3,
  ]

  const vistos = new Set<number>([certo])
  const saida: number[] = []
  for (const v of candidatos) {
    if (v < FAIXA_MIN || v > FAIXA_MAX || vistos.has(v)) continue
    vistos.add(v)
    saida.push(v)
  }
  return saida
}

export const COMPOSTOS: readonly Composto[] = [
  // --- nível 0: óxidos e oxiácidos, a regra pura -----------------------------
  { formula: 'H₂SO₄', nome: 'ácido sulfúrico', alvo: 'S', atomos: [['H', 2], ['S', 1], ['O', 4]], carga: 0, nivel: 0 },
  { formula: 'HNO₃', nome: 'ácido nítrico', alvo: 'N', atomos: [['H', 1], ['N', 1], ['O', 3]], carga: 0, nivel: 0 },
  { formula: 'H₃PO₄', nome: 'ácido fosfórico', alvo: 'P', atomos: [['H', 3], ['P', 1], ['O', 4]], carga: 0, nivel: 0 },
  { formula: 'H₂CO₃', nome: 'ácido carbônico', alvo: 'C', atomos: [['H', 2], ['C', 1], ['O', 3]], carga: 0, nivel: 0 },
  { formula: 'HClO₄', nome: 'ácido perclórico', alvo: 'Cl', atomos: [['H', 1], ['Cl', 1], ['O', 4]], carga: 0, nivel: 0 },
  { formula: 'HClO', nome: 'ácido hipocloroso', alvo: 'Cl', atomos: [['H', 1], ['Cl', 1], ['O', 1]], carga: 0, nivel: 0 },
  { formula: 'H₂SO₃', nome: 'ácido sulfuroso', alvo: 'S', atomos: [['H', 2], ['S', 1], ['O', 3]], carga: 0, nivel: 0 },
  { formula: 'SO₂', nome: 'dióxido de enxofre', alvo: 'S', atomos: [['S', 1], ['O', 2]], carga: 0, nivel: 0 },
  { formula: 'SO₃', nome: 'trióxido de enxofre', alvo: 'S', atomos: [['S', 1], ['O', 3]], carga: 0, nivel: 0 },
  { formula: 'N₂O₅', nome: 'pentóxido de dinitrogênio', alvo: 'N', atomos: [['N', 2], ['O', 5]], carga: 0, nivel: 0 },
  { formula: 'N₂O', nome: 'óxido nitroso', alvo: 'N', atomos: [['N', 2], ['O', 1]], carga: 0, nivel: 0 },
  { formula: 'Fe₂O₃', nome: 'óxido de ferro(III)', alvo: 'Fe', atomos: [['Fe', 2], ['O', 3]], carga: 0, nivel: 0 },
  { formula: 'MnO₂', nome: 'dióxido de manganês', alvo: 'Mn', atomos: [['Mn', 1], ['O', 2]], carga: 0, nivel: 0 },
  { formula: 'Cu₂O', nome: 'óxido de cobre(I)', alvo: 'Cu', atomos: [['Cu', 2], ['O', 1]], carga: 0, nivel: 0 },
  { formula: 'FeCl₃', nome: 'cloreto de ferro(III)', alvo: 'Fe', atomos: [['Fe', 1], ['Cl', 3]], carga: 0, nivel: 0 },
  { formula: 'NH₃', nome: 'amônia', alvo: 'N', atomos: [['N', 1], ['H', 3]], carga: 0, nivel: 0 },
  { formula: 'CH₄', nome: 'metano', alvo: 'C', atomos: [['C', 1], ['H', 4]], carga: 0, nivel: 0 },

  // --- nível 1: íons, onde a soma fecha na carga e não em zero ---------------
  { formula: 'SO₄²⁻', nome: 'sulfato', alvo: 'S', atomos: [['S', 1], ['O', 4]], carga: -2, nivel: 1 },
  { formula: 'SO₃²⁻', nome: 'sulfito', alvo: 'S', atomos: [['S', 1], ['O', 3]], carga: -2, nivel: 1 },
  { formula: 'NO₃⁻', nome: 'nitrato', alvo: 'N', atomos: [['N', 1], ['O', 3]], carga: -1, nivel: 1 },
  { formula: 'NO₂⁻', nome: 'nitrito', alvo: 'N', atomos: [['N', 1], ['O', 2]], carga: -1, nivel: 1 },
  { formula: 'MnO₄⁻', nome: 'permanganato', alvo: 'Mn', atomos: [['Mn', 1], ['O', 4]], carga: -1, nivel: 1 },
  { formula: 'Cr₂O₇²⁻', nome: 'dicromato', alvo: 'Cr', atomos: [['Cr', 2], ['O', 7]], carga: -2, nivel: 1 },
  { formula: 'CrO₄²⁻', nome: 'cromato', alvo: 'Cr', atomos: [['Cr', 1], ['O', 4]], carga: -2, nivel: 1 },
  { formula: 'PO₄³⁻', nome: 'fosfato', alvo: 'P', atomos: [['P', 1], ['O', 4]], carga: -3, nivel: 1 },
  { formula: 'CO₃²⁻', nome: 'carbonato', alvo: 'C', atomos: [['C', 1], ['O', 3]], carga: -2, nivel: 1 },
  { formula: 'ClO₃⁻', nome: 'clorato', alvo: 'Cl', atomos: [['Cl', 1], ['O', 3]], carga: -1, nivel: 1 },
  { formula: 'ClO₂⁻', nome: 'clorito', alvo: 'Cl', atomos: [['Cl', 1], ['O', 2]], carga: -1, nivel: 1 },
  { formula: 'NH₄⁺', nome: 'amônio', alvo: 'N', atomos: [['N', 1], ['H', 4]], carga: 1, nivel: 1 },
  { formula: 'S₂O₃²⁻', nome: 'tiossulfato', alvo: 'S', atomos: [['S', 2], ['O', 3]], carga: -2, nivel: 1 },

  // --- nível 2: onde a regra decorada trai -----------------------------------
  {
    formula: 'H₂O₂', nome: 'peróxido de hidrogênio', alvo: 'O',
    atomos: [['H', 2], ['O', 2]], carga: 0, nivel: 2,
    porque: 'peróxido: os dois oxigênios estão ligados entre si, então dividem −2',
  },
  {
    formula: 'Na₂O₂', nome: 'peróxido de sódio', alvo: 'O',
    atomos: [['Na', 2], ['O', 2]], carga: 0, nivel: 2,
    porque: 'peróxido de novo — o sódio é +1 e não tem como ser outra coisa',
  },
  {
    formula: 'OF₂', nome: 'difluoreto de oxigênio', alvo: 'O',
    atomos: [['O', 1], ['F', 2]], carga: 0, nivel: 2,
    porque: 'o flúor é o único elemento mais eletronegativo que o oxigênio',
  },
  {
    formula: 'NaH', nome: 'hidreto de sódio', alvo: 'H',
    atomos: [['Na', 1], ['H', 1]], carga: 0, nivel: 2,
    porque: 'hidreto metálico: ligado a metal, o hidrogênio é quem recebe elétron',
  },
  {
    formula: 'CaH₂', nome: 'hidreto de cálcio', alvo: 'H',
    atomos: [['Ca', 1], ['H', 2]], carga: 0, nivel: 2,
    porque: 'hidreto de novo — o cálcio é +2, sobra −1 para cada hidrogênio',
  },
  {
    formula: 'LiAlH₄', nome: 'hidreto de lítio e alumínio', alvo: 'H',
    atomos: [['Li', 1], ['Al', 1], ['H', 4]], carga: 0, nivel: 2,
    porque: 'dois metais antes dele: sobra −1 para cada hidrogênio',
  },
]
