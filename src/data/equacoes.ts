/**
 * Equações químicas para balancear.
 *
 * Os coeficientes **não** estão gravados em lugar nenhum: o dataset guarda a
 * equação — quais espécies entram, com que composição e com que carga — e
 * `balancear()` resolve o sistema de conservação. É a mesma regra de
 * `data/nox.ts`, pelo mesmo motivo: um dedo errado num número digitado à mão
 * ensinaria química errada em silêncio, e "1, 5, 3, 4" é plausível demais para
 * alguém desconfiar ao reler o arquivo. Aqui, mexer na composição quebra o
 * teste de conservação na hora.
 *
 * O sistema é linear e exato. Cada elemento vira uma equação
 * `Σ coefᵢ · quantidadeᵢ = 0` (reagentes com sinal +, produtos com −), e a
 * carga vira **mais uma linha**, não um caso especial. Essa linha não é enfeite:
 * em `Zn + H⁺ → Zn²⁺ + H₂` as linhas de Zn e de H deixam dois graus de
 * liberdade e o sistema não determina nada — é a carga que fixa o 2 no H⁺. Sem
 * ela, `balancear()` lançaria, que é exatamente o que deve acontecer com uma
 * equação mal posta.
 *
 * A aritmética é em frações, não em ponto flutuante. O caminho do butano passa
 * por 13/2 antes de virar 13, e `0.1 + 0.2` decidindo se um coeficiente é
 * inteiro seria a pior forma possível de errar aqui.
 */

export interface Especie {
  /** Como aparece na tela, em Unicode: 'C₃H₈', 'Zn²⁺'. */
  readonly formula: string
  /**
   * Composição, na ordem da fórmula: [símbolo, quantidade].
   *
   * Repetição é somada, e é de propósito: 'C₂H₅OH' traz o hidrogênio duas vezes
   * porque é assim que a fórmula é escrita, e reescrevê-la como C₂H₆O para
   * caber no formato seria perder a informação que o jogador está lendo.
   */
  readonly atomos: readonly (readonly [string, number])[]
  /** Carga do íon. Ausente = espécie neutra. */
  readonly carga?: number
}

export interface Equacao {
  /** kebab-case, estável: é a chave de anti-repetição do gerador. */
  readonly id: string
  readonly reagentes: readonly Especie[]
  readonly produtos: readonly Especie[]
  /**
   * 0 — síntese e decomposição de cabeça, nenhum coeficiente passa de 3.
   * 1 — combustão de orgânico com o orgânico em 1, e os primeiros íons.
   * 2 — as que pedem fração ou multiplicar o conjunto todo.
   */
  readonly nivel: 0 | 1 | 2
  /** Por que o conjunto não sai por inspeção direta. Só no nível 2. */
  readonly porque?: string
}

// ---------------------------------------------------------------------------
// Aritmética exata: fração reduzida, denominador sempre positivo
// ---------------------------------------------------------------------------

interface Fracao {
  readonly n: number
  readonly d: number
}

function mdc(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const resto = x % y
    x = y
    y = resto
  }
  return x
}

const mmc = (a: number, b: number): number => (a * b) / mdc(a, b)

function fr(n: number, d = 1): Fracao {
  if (d === 0) throw new Error('fração com denominador zero')
  const sinal = d < 0 ? -1 : 1
  const g = mdc(n, d) || 1
  return { n: (sinal * n) / g, d: (sinal * d) / g }
}

const soma = (a: Fracao, b: Fracao): Fracao => fr(a.n * b.d + b.n * a.d, a.d * b.d)
const multi = (a: Fracao, b: Fracao): Fracao => fr(a.n * b.n, a.d * b.d)
const dividir = (a: Fracao, b: Fracao): Fracao => {
  if (b.n === 0) throw new Error('divisão por zero')
  return fr(a.n * b.d, a.d * b.n)
}
const nulo = (f: Fracao): boolean => f.n === 0

const ZERO = fr(0)
const UM = fr(1)

// ---------------------------------------------------------------------------
// O sistema de conservação
// ---------------------------------------------------------------------------

/** Quantos átomos de `elemento` a espécie tem. Soma as aparições repetidas. */
function quantidade(e: Especie, elemento: string): number {
  let total = 0
  for (const [simbolo, n] of e.atomos) {
    if (simbolo === elemento) total += n
  }
  return total
}

/** Elementos na ordem em que aparecem — ordem estável, para o erro ser legível. */
function elementos(especies: readonly Especie[]): readonly string[] {
  const vistos: string[] = []
  for (const e of especies) {
    for (const [simbolo] of e.atomos) {
      if (!vistos.includes(simbolo)) vistos.push(simbolo)
    }
  }
  return vistos
}

function especiesDe(eq: Equacao): readonly Especie[] {
  return [...eq.reagentes, ...eq.produtos]
}

/** Uma linha por elemento, mais a linha da carga. Produto entra com sinal −. */
function sistema(eq: Equacao): Fracao[][] {
  const especies = especiesDe(eq)
  const sinal = (i: number): number => (i < eq.reagentes.length ? 1 : -1)

  const linhas = elementos(especies).map((el) =>
    especies.map((e, i) => fr(sinal(i) * quantidade(e, el))),
  )
  linhas.push(especies.map((e, i) => fr(sinal(i) * (e.carga ?? 0))))
  return linhas
}

/**
 * O menor conjunto de coeficientes inteiros positivos que equilibra a equação.
 *
 * Eliminação de Gauss-Jordan até a forma escalonada reduzida, e a resposta é o
 * núcleo da matriz. Lança quando o núcleo **não** tem dimensão 1: mais de um
 * grau de liberdade significa que a equação admite infinitas proporções
 * diferentes (duas reações independentes escritas como uma), e nenhum grau
 * significa que ela não fecha. Nos dois casos devolver um vetor plausível seria
 * pior do que falhar — é a mesma postura de `nox()`.
 */
export function balancear(eq: Equacao): readonly number[] {
  const n = especiesDe(eq).length
  if (n < 2) throw new Error(`${eq.id}: equação com menos de duas espécies`)

  const a = sistema(eq).map((l) => [...l])
  const linhaEm = (i: number): Fracao[] => a[i] as Fracao[]
  const em = (i: number, j: number): Fracao => linhaEm(i)[j] as Fracao

  const pivos: number[] = []
  let linha = 0

  for (let col = 0; col < n && linha < a.length; col++) {
    let p = linha
    while (p < a.length && nulo(em(p, col))) p++
    if (p === a.length) continue

    const troca = linhaEm(linha)
    a[linha] = linhaEm(p)
    a[p] = troca

    const pivo = em(linha, col)
    a[linha] = linhaEm(linha).map((v) => dividir(v, pivo))

    for (let r = 0; r < a.length; r++) {
      if (r === linha) continue
      const fator = em(r, col)
      if (nulo(fator)) continue
      a[r] = linhaEm(r).map((v, c) => soma(v, multi(fr(-1), multi(fator, em(linha, c)))))
    }

    pivos.push(col)
    linha++
  }

  const livres: number[] = []
  for (let c = 0; c < n; c++) {
    if (!pivos.includes(c)) livres.push(c)
  }
  if (livres.length !== 1) {
    throw new Error(
      `${eq.id}: o sistema tem ${livres.length} graus de liberdade — a equação não determina um único conjunto`,
    )
  }
  const livre = livres[0] as number

  // Com a variável livre em 1, cada pivô vale menos o seu coeficiente na coluna
  // livre: é o núcleo, lido direto da forma reduzida.
  const x: Fracao[] = Array.from({ length: n }, () => ZERO)
  x[livre] = UM
  pivos.forEach((col, i) => {
    x[col] = multi(fr(-1), em(i, livre))
  })

  const denominador = x.reduce((t, f) => mmc(t, f.d), 1)
  const brutos = x.map((f) => (f.n * denominador) / f.d)
  const g = brutos.reduce((t, v) => mdc(t, v), 0) || 1
  // O núcleo é uma reta: o vetor pode sair todo negativo, e aí o que vale é o
  // sentido, não o sinal.
  const orientados = brutos.every((v) => v < 0) ? brutos.map((v) => -v) : brutos
  const inteiros = orientados.map((v) => v / g)

  if (inteiros.some((v) => v <= 0 || !Number.isInteger(v))) {
    throw new Error(`${eq.id}: não há coeficientes inteiros positivos (${inteiros.join(', ')})`)
  }
  return inteiros
}

export interface Balanco {
  /** Símbolo do elemento, ou 'carga'. */
  readonly nome: string
  readonly esquerda: number
  readonly direita: number
}

/**
 * Quanto de cada elemento (e de carga) há de cada lado, com os coeficientes
 * dados. É o que o teste usa para conferir a conservação sem passar de novo
 * pelo solucionador — checar `balancear()` com a matriz que `balancear()` montou
 * seria a função se autoaprovando.
 */
export function balanco(eq: Equacao, coeficientes: readonly number[]): readonly Balanco[] {
  const especies = especiesDe(eq)
  if (coeficientes.length !== especies.length) {
    throw new Error(`${eq.id}: ${coeficientes.length} coeficientes para ${especies.length} espécies`)
  }

  const contar = (quanto: (e: Especie) => number): { esquerda: number; direita: number } => {
    let esquerda = 0
    let direita = 0
    especies.forEach((e, i) => {
      const parcela = (coeficientes[i] as number) * quanto(e)
      if (i < eq.reagentes.length) esquerda += parcela
      else direita += parcela
    })
    return { esquerda, direita }
  }

  return [
    ...elementos(especies).map((el) => ({ nome: el, ...contar((e) => quantidade(e, el)) })),
    { nome: 'carga', ...contar((e) => e.carga ?? 0) },
  ]
}

/** Conserva átomos e carga? Não diz nada sobre ser o *menor* conjunto. */
export function confere(eq: Equacao, coeficientes: readonly number[]): boolean {
  return balanco(eq, coeficientes).every((b) => b.esquerda === b.direita)
}

// ---------------------------------------------------------------------------
// Exibição
// ---------------------------------------------------------------------------

/** 'C₃H₈ + O₂ → CO₂ + H₂O' — sem coeficiente nenhum, que é o que se pergunta. */
export function exibirEquacao(eq: Equacao): string {
  const lado = (es: readonly Especie[]): string => es.map((e) => e.formula).join(' + ')
  return `${lado(eq.reagentes)} → ${lado(eq.produtos)}`
}

/**
 * '1, 5, 3, 4' — os coeficientes na ordem em que as fórmulas aparecem.
 *
 * Escrever a equação inteira já balanceada em cada alternativa seria mais
 * bonito e caberia mal: são quatro botões lado a lado num celular, e a diferença
 * entre duas opções ficaria escondida no meio de vinte caracteres iguais. O que
 * está em jogo são os números, então as opções são só os números — e o 1 é
 * sempre escrito, senão as posições deixam de casar com a equação.
 */
export function exibirConjunto(coeficientes: readonly number[]): string {
  return coeficientes.join(', ')
}

// ---------------------------------------------------------------------------
// Distratores
// ---------------------------------------------------------------------------

/**
 * Esqueceu que a água (ou o H₂) carrega dois hidrogênios.
 *
 * Pega o hidrogênio que entra pelos reagentes e usa esse número direto como
 * coeficiente do produto — em `C₃H₈ + 5O₂ → 3CO₂ + 4H₂O` dá 8 no lugar do 4. É
 * o erro mais comum do assunto inteiro.
 *
 * Só vale para produto com exatamente dois hidrogênios: em NH₃ (três) o mesmo
 * cálculo não corresponde a erro nenhum que alguém cometa, e distrator que
 * ninguém marca é opção desperdiçada.
 */
function hidrogenioEsquecido(eq: Equacao, certo: readonly number[]): readonly number[] | null {
  const alvo = eq.produtos.findIndex((e) => quantidade(e, 'H') === 2)
  if (alvo === -1) return null

  let hidrogenio = 0
  eq.reagentes.forEach((e, i) => {
    hidrogenio += (certo[i] as number) * quantidade(e, 'H')
  })
  if (hidrogenio <= 0) return null

  const saida = [...certo]
  saida[eq.reagentes.length + alvo] = hidrogenio
  return saida
}

/**
 * Trocou dois coeficientes de lugar.
 *
 * Os pares vizinhos vêm primeiro, e a partir da direita: quem erra assim quase
 * sempre trocou os dois produtos entre si (o 3 do CO₂ com o 4 do H₂O), não o
 * primeiro reagente com o último produto. Os pares distantes ficam no fim da
 * lista, só para completar quatro opções quando falta gente.
 */
function trocas(certo: readonly number[]): readonly (readonly number[])[] {
  const vizinhos: [number, number][] = []
  const distantes: [number, number][] = []

  for (let i = certo.length - 2; i >= 0; i--) vizinhos.push([i, i + 1])
  for (let i = 0; i < certo.length; i++) {
    for (let j = i + 2; j < certo.length; j++) distantes.push([i, j])
  }

  return [...vizinhos, ...distantes]
    .filter(([i, j]) => certo[i] !== certo[j])
    .map(([i, j]) => {
      const saida = [...certo]
      saida[i] = certo[j] as number
      saida[j] = certo[i] as number
      return saida
    })
}

/**
 * As respostas erradas que alguém de fato marca, em ordem de prioridade.
 *
 * Mora no dataset, e não no jogo, pela mesma razão dos distratores de nox: a
 * lista é química, e quem mexer nas equações tem de ver os erros na mesma tela.
 *
 * 1. **o hidrogênio esquecido** — ver `hidrogenioEsquecido`.
 * 2. **o conjunto dobrado** — e este é o distrator mais interessante dos três,
 *    porque ele *conserva os átomos*. Está errado por outro motivo: a resposta
 *    é o menor conjunto de inteiros, e `4H₂ + 2O₂ → 4H₂O` é a mesma reação
 *    escrita duas vezes. Quem marca essa balanceou certo e não simplificou, o
 *    que é exatamente o que se quer cobrar.
 * 3. **a troca de dois coeficientes** — acertou os números e errou de quem eram.
 *
 * Depois vem o "errou por um" no maior coeficiente, que não é erro com nome:
 * existe só para fechar quatro opções quando os anteriores não se aplicam ou
 * caem em cima da resposta certa.
 */
export function distratores(eq: Equacao): readonly (readonly number[])[] {
  const certo = balancear(eq)
  const maior = certo.indexOf(Math.max(...certo))

  const porUm = (delta: number): readonly number[] => {
    const saida = [...certo]
    saida[maior] = (certo[maior] as number) + delta
    return saida
  }

  const candidatos = [
    hidrogenioEsquecido(eq, certo),
    certo.map((c) => c * 2),
    ...trocas(certo),
    porUm(1),
    porUm(-1),
  ]

  const vistos = new Set<string>([exibirConjunto(certo)])
  const saida: (readonly number[])[] = []

  for (const c of candidatos) {
    if (c === null || c.some((v) => v <= 0)) continue
    const chave = exibirConjunto(c)
    if (vistos.has(chave)) continue
    vistos.add(chave)
    saida.push(c)
  }
  return saida
}

// ---------------------------------------------------------------------------
// O dataset
// ---------------------------------------------------------------------------

const esp = (
  formula: string,
  atomos: readonly (readonly [string, number])[],
  carga?: number,
): Especie => (carga === undefined ? { formula, atomos } : { formula, atomos, carga })

// Espécies que aparecem em mais de uma equação. Escrever a composição uma vez
// só é menos superfície para um dedo errado do que repeti-la em seis linhas.
const O2 = esp('O₂', [['O', 2]])
const H2 = esp('H₂', [['H', 2]])
const N2 = esp('N₂', [['N', 2]])
const CL2 = esp('Cl₂', [['Cl', 2]])
const H2O = esp('H₂O', [['H', 2], ['O', 1]])
const CO2 = esp('CO₂', [['C', 1], ['O', 2]])
const NH3 = esp('NH₃', [['N', 1], ['H', 3]])
const HMAIS = esp('H⁺', [['H', 1]], 1)

export const EQUACOES: readonly Equacao[] = [
  // --- nível 0: sai por inspeção, nenhum coeficiente passa de 3 --------------
  { id: 'agua', reagentes: [H2, O2], produtos: [H2O], nivel: 0 },
  { id: 'amonia', reagentes: [N2, H2], produtos: [NH3], nivel: 0 },
  {
    id: 'sal',
    reagentes: [esp('Na', [['Na', 1]]), CL2],
    produtos: [esp('NaCl', [['Na', 1], ['Cl', 1]])],
    nivel: 0,
  },
  {
    id: 'magnesio',
    reagentes: [esp('Mg', [['Mg', 1]]), O2],
    produtos: [esp('MgO', [['Mg', 1], ['O', 1]])],
    nivel: 0,
  },
  {
    id: 'metano',
    reagentes: [esp('CH₄', [['C', 1], ['H', 4]]), O2],
    produtos: [CO2, H2O],
    nivel: 0,
  },
  {
    id: 'peroxido',
    reagentes: [esp('H₂O₂', [['H', 2], ['O', 2]])],
    produtos: [H2O, O2],
    nivel: 0,
  },
  {
    id: 'trioxido-enxofre',
    reagentes: [esp('SO₂', [['S', 1], ['O', 2]]), O2],
    produtos: [esp('SO₃', [['S', 1], ['O', 3]])],
    nivel: 0,
  },
  {
    id: 'oxido-nitrico',
    reagentes: [N2, O2],
    produtos: [esp('NO', [['N', 1], ['O', 1]])],
    nivel: 0,
  },
  {
    id: 'cloreto-aluminio',
    reagentes: [esp('Al', [['Al', 1]]), CL2],
    produtos: [esp('AlCl₃', [['Al', 1], ['Cl', 3]])],
    nivel: 0,
  },
  {
    id: 'monoxido-carbono',
    reagentes: [esp('C', [['C', 1]]), O2],
    produtos: [esp('CO', [['C', 1], ['O', 1]])],
    nivel: 0,
  },
  {
    id: 'acido-cloridrico',
    reagentes: [H2, CL2],
    produtos: [esp('HCl', [['H', 1], ['Cl', 1]])],
    nivel: 0,
  },

  // --- nível 1: o orgânico fica em 1, mas os outros coeficientes crescem -----
  {
    id: 'propano',
    reagentes: [esp('C₃H₈', [['C', 3], ['H', 8]]), O2],
    produtos: [CO2, H2O],
    nivel: 1,
  },
  {
    id: 'pentano',
    reagentes: [esp('C₅H₁₂', [['C', 5], ['H', 12]]), O2],
    produtos: [CO2, H2O],
    nivel: 1,
  },
  {
    id: 'etanol',
    // A fórmula é escrita como se lê, com o hidrogênio em dois lugares: é assim
    // que o jogador vê, e `quantidade()` soma as duas aparições.
    reagentes: [esp('C₂H₅OH', [['C', 2], ['H', 5], ['O', 1], ['H', 1]]), O2],
    produtos: [CO2, H2O],
    nivel: 1,
  },
  {
    id: 'glicose',
    reagentes: [esp('C₆H₁₂O₆', [['C', 6], ['H', 12], ['O', 6]]), O2],
    produtos: [CO2, H2O],
    nivel: 1,
  },
  {
    id: 'alto-forno',
    reagentes: [esp('Fe₂O₃', [['Fe', 2], ['O', 3]]), esp('CO', [['C', 1], ['O', 1]])],
    produtos: [esp('Fe', [['Fe', 1]]), CO2],
    nivel: 1,
  },
  {
    id: 'clorato',
    reagentes: [esp('KClO₃', [['K', 1], ['Cl', 1], ['O', 3]])],
    produtos: [esp('KCl', [['K', 1], ['Cl', 1]]), O2],
    nivel: 1,
  },
  {
    id: 'fosforo',
    reagentes: [esp('P₄', [['P', 4]]), O2],
    produtos: [esp('P₄O₁₀', [['P', 4], ['O', 10]])],
    nivel: 1,
  },
  {
    id: 'nitreto-litio',
    reagentes: [esp('Li', [['Li', 1]]), N2],
    produtos: [esp('Li₃N', [['Li', 3], ['N', 1]])],
    nivel: 1,
  },
  {
    id: 'neutralizacao',
    reagentes: [
      esp('NaOH', [['Na', 1], ['O', 1], ['H', 1]]),
      esp('H₂SO₄', [['H', 2], ['S', 1], ['O', 4]]),
    ],
    produtos: [esp('Na₂SO₄', [['Na', 2], ['S', 1], ['O', 4]]), H2O],
    nivel: 1,
  },
  {
    id: 'zinco-acido',
    // A linha da carga é o que torna esta resolvível: só com Zn e H o sistema
    // ficaria indeterminado.
    reagentes: [esp('Zn', [['Zn', 1]]), HMAIS],
    produtos: [esp('Zn²⁺', [['Zn', 1]], 2), H2],
    nivel: 1,
  },
  {
    id: 'prata-cobre',
    reagentes: [esp('Ag⁺', [['Ag', 1]], 1), esp('Cu', [['Cu', 1]])],
    produtos: [esp('Cu²⁺', [['Cu', 1]], 2), esp('Ag', [['Ag', 1]])],
    nivel: 1,
  },

  // --- nível 2: com 1 no primeiro reagente sai fração; o conjunto todo sobe ---
  {
    id: 'butano',
    reagentes: [esp('C₄H₁₀', [['C', 4], ['H', 10]]), O2],
    produtos: [CO2, H2O],
    nivel: 2,
    porque: 'com 1 no butano o oxigênio daria 6,5 — dobrando o conjunto todo, o 13 sai inteiro',
  },
  {
    id: 'etano',
    reagentes: [esp('C₂H₆', [['C', 2], ['H', 6]]), O2],
    produtos: [CO2, H2O],
    nivel: 2,
    porque: 'com 1 no etano o oxigênio daria 3,5; dobrando tudo, aparece o 7',
  },
  {
    id: 'benzeno',
    reagentes: [esp('C₆H₆', [['C', 6], ['H', 6]]), O2],
    produtos: [CO2, H2O],
    nivel: 2,
    porque: 'com 1 no benzeno o oxigênio daria 7,5 — dobra tudo e sai o 15',
  },
  {
    id: 'octano',
    reagentes: [esp('C₈H₁₈', [['C', 8], ['H', 18]]), O2],
    produtos: [CO2, H2O],
    nivel: 2,
    porque: 'o clássico da gasolina: com 1 no octano o oxigênio daria 12,5, e dobrando sai o 25',
  },
  {
    id: 'acetileno',
    reagentes: [esp('C₂H₂', [['C', 2], ['H', 2]]), O2],
    produtos: [CO2, H2O],
    nivel: 2,
    porque: 'com 1 no acetileno o oxigênio daria 2,5 — o conjunto todo dobra',
  },
  {
    id: 'ostwald',
    reagentes: [NH3, O2],
    produtos: [esp('NO', [['N', 1], ['O', 1]]), H2O],
    nivel: 2,
    porque: 'três hidrogênios de um lado e dois do outro: o 6 na água é o que fixa o 4 na amônia',
  },
  {
    id: 'amonia-queima',
    reagentes: [NH3, O2],
    produtos: [N2, H2O],
    nivel: 2,
    porque: 'o N₂ pede nitrogênio em par e a água pede hidrogênio em par: 4 é o primeiro que atende os dois',
  },
  {
    id: 'pirita',
    reagentes: [esp('FeS₂', [['Fe', 1], ['S', 2]]), O2],
    produtos: [esp('Fe₂O₃', [['Fe', 2], ['O', 3]]), esp('SO₂', [['S', 1], ['O', 2]])],
    nivel: 2,
    porque: 'o Fe₂O₃ pede ferro em par e cada FeS₂ traz dois enxofres — o 4 na pirita é o que fecha os dois de uma vez',
  },
  {
    id: 'alumina',
    reagentes: [esp('Al', [['Al', 1]]), O2],
    produtos: [esp('Al₂O₃', [['Al', 2], ['O', 3]])],
    nivel: 2,
    porque: 'com 1 no alumínio o oxigênio daria 3/2 — dobra tudo e sai 4, 3, 2',
  },
  {
    id: 'aluminio-acido',
    reagentes: [esp('Al', [['Al', 1]]), HMAIS],
    produtos: [esp('Al³⁺', [['Al', 1]], 3), H2],
    nivel: 2,
    porque: 'o alumínio cede 3 elétrons e cada H₂ consome 2: a carga só fecha no mínimo múltiplo, 6',
  },
]
