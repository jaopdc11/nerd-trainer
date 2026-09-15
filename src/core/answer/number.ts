/**
 * Interpretação de entrada numérica na convenção brasileira.
 *
 * O jogador digita "3,14", "2,998×10⁸", "6,02e23" ou "1.024" — e as duas
 * últimas formas provam por que isto não pode ser um `parseFloat` com
 * `replace(',', '.')`: o mesmo ponto é separador decimal numa constante física
 * e separador de milhar num inteiro grande. Quem chama sempre diz qual é o caso.
 */

export interface NumeroInterpretado {
  /** Dígitos significativos em ordem, sem separador: "2998". */
  readonly mantissa: string
  /** Expoente da forma normalizada `d,ddd × 10^expoente`. */
  readonly expoente: number
  readonly negativo: boolean
  /** Quantos algarismos significativos o jogador forneceu. */
  readonly significativos: number
}

const SUPERSCRITO: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁻': '-',
  '⁺': '+',
}

/**
 * "10²³" → "10^23". Uma corrida inteira de superscritos vira um único `^`,
 * senão cada dígito viraria um expoente separado. O teclado do iOS e o
 * copiar-colar de PDF produzem exatamente essa forma.
 */
function expandirSuperscritos(s: string): string {
  return s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (corrida) =>
    `^${[...corrida].map((c) => SUPERSCRITO[c] ?? '').join('')}`,
  )
}

/**
 * Resolve `.` e `,` numa string só de dígitos e separadores.
 * Devolve `null` se a forma for incoerente (dois decimais, separador solto).
 */
function separarDecimal(corpo: string): { inteira: string; decimal: string } | null {
  const temPonto = corpo.includes('.')
  const temVirgula = corpo.includes(',')

  let decimalEm = -1

  if (temPonto && temVirgula) {
    // Os dois presentes: o último a aparecer é o decimal, o outro é milhar.
    decimalEm = Math.max(corpo.lastIndexOf('.'), corpo.lastIndexOf(','))
  } else if (temPonto || temVirgula) {
    const sep = temPonto ? '.' : ','
    const quantos = corpo.split(sep).length - 1
    // Um separador só é decimal ("3,14" e também "1.024" numa constante).
    // Mais de um só pode ser agrupamento de milhar ("1.234.567").
    if (quantos === 1) decimalEm = corpo.indexOf(sep)
  }

  const brutaInteira = decimalEm === -1 ? corpo : corpo.slice(0, decimalEm)
  const decimal = decimalEm === -1 ? '' : corpo.slice(decimalEm + 1)

  // Sobrou separador na parte inteira: só pode ser agrupamento de milhar, e
  // agrupamento tem forma fixa. Sem esta checagem, "3,1,4" passaria como 314.
  if (/[.,]/.test(brutaInteira) && !/^\d{1,3}([.,]\d{3})+$/.test(brutaInteira)) return null

  const inteira = brutaInteira.replace(/[.,]/g, '')

  if (decimal.includes('.') || decimal.includes(',')) return null
  if (!/^\d*$/.test(inteira) || !/^\d*$/.test(decimal)) return null
  if (inteira === '' && decimal === '') return null

  return { inteira, decimal }
}

/** Interpreta uma entrada decimal/científica. `null` se não for número. */
export function interpretarNumero(entrada: string): NumeroInterpretado | null {
  let s = expandirSuperscritos(entrada.trim()).replace(/\s+/g, '')
  if (s === '') return null

  // Unifica os sinais de multiplicação e o menos tipográfico (U+2212). O "x"
  // datilografado entra porque "2,998x10^8" é como se escreve sem teclado de
  // símbolo; não há ambiguidade, já que aqui nunca há variável.
  s = s.replace(/[×·∙*xX]/g, '*').replace(/−/g, '-')

  let expoenteExplicito = 0
  const casaExpoente = s.match(/(?:\*?10\^|[eE])([+-]?\d+)$/)
  if (casaExpoente?.index !== undefined) {
    expoenteExplicito = Number.parseInt(casaExpoente[1] ?? '0', 10)
    s = s.slice(0, casaExpoente.index).replace(/\*$/, '')
    // "10^8" sem mantissa explícita vale 1×10^8.
    if (s === '' || s === '+' || s === '-') s += '1'
  }

  const negativo = s.startsWith('-')
  s = s.replace(/^[+-]/, '')

  const partes = separarDecimal(s)
  if (!partes) return null

  const digitos = partes.inteira + partes.decimal
  const primeiroSignificativo = digitos.search(/[1-9]/)

  // Zero em qualquer grafia: 0, 0,00, 0×10⁵.
  if (primeiroSignificativo === -1) {
    return { mantissa: '0', expoente: 0, negativo, significativos: 1 }
  }

  // Expoente da forma normalizada: quantas casas o primeiro dígito significativo
  // está à esquerda da vírgula (negativo se estiver à direita).
  const expoente = partes.inteira.length - primeiroSignificativo - 1 + expoenteExplicito
  const mantissa = digitos.slice(primeiroSignificativo)

  return { mantissa, expoente, negativo, significativos: mantissa.length }
}

/**
 * Arredonda uma mantissa (string de dígitos) para `n` algarismos.
 * Devolve também o ajuste de expoente, porque 999 → 100 sobe uma casa.
 */
export function arredondarMantissa(
  mantissa: string,
  n: number,
): { mantissa: string; ajusteExpoente: number } {
  if (n >= mantissa.length) return { mantissa: mantissa.padEnd(n, '0'), ajusteExpoente: 0 }
  if (n <= 0) return { mantissa: '', ajusteExpoente: 0 }

  const mantida = mantissa.slice(0, n)
  const proximo = Number.parseInt(mantissa[n] ?? '0', 10)
  if (proximo < 5) return { mantissa: mantida, ajusteExpoente: 0 }

  // Arredonda para cima somando 1 na última casa, como inteiro.
  const somado = (BigInt(mantida) + 1n).toString()
  return somado.length > n
    ? { mantissa: somado.slice(0, n), ajusteExpoente: 1 }
    : { mantissa: somado, ajusteExpoente: 0 }
}

/** Remove todo separador de agrupamento. Para inteiros, nada é decimal. */
export function limparInteiro(entrada: string): string | null {
  const limpo = entrada.trim().replace(/[.,\s_]/g, '').replace(/−/g, '-')
  return /^-?\d+$/.test(limpo) ? limpo : null
}
