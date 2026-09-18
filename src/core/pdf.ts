/**
 * Um PDF de uma página, escrito na mão.
 *
 * **Por que não uma biblioteca.** O app tem duas dependências de runtime, React
 * e ReactDOM, e a mais leve das libs de PDF pesa mais que as duas somadas. Pior:
 * o caminho usual delas para desenhar uma tela é rasterizar com `html2canvas`,
 * e o resultado é uma foto de um documento — texto que não se seleciona, que
 * borra no zoom e que ocupa megabytes. O PDF é um formato de texto com um índice
 * de bytes no fim; para uma página com tipografia, linhas e círculos, escrevê-lo
 * direto dá 5 KB, vetorial e selecionável.
 *
 * **As fontes são as base-14.** Times-Roman, Times-Bold e Times-Italic existem
 * em todo leitor de PDF desde 1993 e não precisam ser embarcadas — é o que
 * mantém o arquivo em poucos quilobytes. O preço é o alfabeto: elas usam
 * `WinAnsiEncoding`, que cobre o português inteiro mas não tem estrela, emoji
 * nem travessão tipográfico fora da tabela. Ver `paraWinAnsi`.
 *
 * **Medir texto é problema de quem chama.** Centralizar exige saber a largura da
 * linha, e essa conta depende das métricas da fonte. Em vez de embutir tabelas
 * AFM, o desenho recebe um `medir` — no navegador ele vem do Canvas 2D pedindo
 * "Times New Roman", que é metricamente compatível com a Times-Roman do PDF
 * (foi desenhada para ser), e o erro fica abaixo de um por cento.
 */

export type Fonte = 'normal' | 'negrito' | 'italico'

/** Devolve a largura do texto, em pontos, naquela fonte e tamanho. */
export type Medidor = (texto: string, fonte: Fonte, tamanho: number) => number

/** A4 deitado, em pontos (1 pt = 1/72"). */
export const A4_PAISAGEM = { largura: 841.89, altura: 595.28 } as const

const RECURSO: Record<Fonte, string> = {
  normal: '/F1',
  negrito: '/F2',
  italico: '/F3',
}

const BASE: Record<Fonte, string> = {
  normal: 'Times-Roman',
  negrito: 'Times-Bold',
  italico: 'Times-Italic',
}

/**
 * Os caracteres que o app usa e que não são Latin-1, com o byte deles em
 * `WinAnsiEncoding`.
 *
 * Existe porque a tabela do WinAnsi difere do Latin-1 justamente na faixa
 * 0x80–0x9F, onde a Microsoft pôs a tipografia: aspas curvas, travessões,
 * reticências. Sem este mapa, um lema com aspas tipográficas sairia com dois
 * quadradinhos no meio do diploma.
 */
const WIN_ANSI: Record<string, number> = {
  '–': 0x96, // –
  '—': 0x97, // —
  '‘': 0x91, // '
  '’': 0x92, // '
  '“': 0x93, // "
  '”': 0x94, // "
  '•': 0x95, // •
  '…': 0x85, // …
  '€': 0x80, // €
}

/**
 * Texto para bytes WinAnsi.
 *
 * O que não couber vira `?` em vez de sumir: um buraco silencioso no meio de uma
 * frase é pior que um sinal visível de que ali havia algo. Quem precisa de um
 * símbolo fora da tabela — a estrela do selo, por exemplo — desenha o símbolo em
 * vetor, que é o que `estrela` faz.
 */
export function paraWinAnsi(texto: string): number[] {
  const bytes: number[] = []
  for (const ch of texto) {
    const code = ch.codePointAt(0) as number
    if (code < 0x100 && !(code >= 0x80 && code <= 0x9f)) bytes.push(code)
    else if (WIN_ANSI[ch] !== undefined) bytes.push(WIN_ANSI[ch] as number)
    else bytes.push(0x3f)
  }
  return bytes
}

/** `(`, `)` e `\` são a sintaxe da string literal do PDF e precisam de escape. */
function literal(texto: string): number[] {
  const saida: number[] = [0x28] // (
  for (const b of paraWinAnsi(texto)) {
    if (b === 0x28 || b === 0x29 || b === 0x5c) saida.push(0x5c)
    saida.push(b)
  }
  saida.push(0x29) // )
  return saida
}

/** Número com três casas, sem notação científica e sem `-0`. */
const n = (v: number) => {
  const s = v.toFixed(3).replace(/\.?0+$/, '')
  return s === '-0' || s === '' ? '0' : s
}

/** `#b08d3f` → `0.69 0.553 0.247`, que é como o PDF fala de cor. */
function corPdf(hex: string): string {
  const h = hex.replace('#', '')
  const c = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255)
  return `${n(c[0] as number)} ${n(c[1] as number)} ${n(c[2] as number)}`
}

/**
 * O fluxo de desenho de uma página.
 *
 * A origem do PDF é o canto **inferior** esquerdo e o eixo Y cresce para cima —
 * ao contrário de tudo o mais neste projeto. Em vez de espalhar `altura - y` por
 * cinquenta chamadas, o `y` daqui é medido de cima para baixo, como na tela, e a
 * conversão acontece num lugar só: `cima`.
 */
export class Pagina {
  private readonly partes: number[] = []
  private readonly medir: Medidor
  private readonly altura: number

  // Campos declarados e atribuídos à mão, e não pelos atalhos de parâmetro do
  // TypeScript: o projeto compila com `erasableSyntaxOnly`, que só aceita
  // sintaxe que some ao apagar os tipos.
  // `altura: number` anotado à mão: sem isso o tipo do padrão vem de
  // `A4_PAISAGEM`, que é `as const`, e o parâmetro só aceitaria o literal
  // 595.28 — nenhuma outra altura de página passaria.
  constructor(medir: Medidor, altura: number = A4_PAISAGEM.altura) {
    this.medir = medir
    this.altura = altura
  }

  private cru(s: string) {
    for (let i = 0; i < s.length; i++) this.partes.push(s.charCodeAt(i))
  }

  private cima(y: number) {
    return this.altura - y
  }

  largura(texto: string, fonte: Fonte, tamanho: number, espacamento = 0) {
    return this.medir(texto, fonte, tamanho) + espacamento * Math.max(0, texto.length - 1)
  }

  /** Texto com o canto superior esquerdo em (x, y). */
  texto(
    texto: string,
    x: number,
    y: number,
    { fonte = 'normal' as Fonte, tamanho = 12, cor = '#000000', espacamento = 0 } = {},
  ) {
    this.cru(`BT ${corPdf(cor)} rg ${RECURSO[fonte]} ${n(tamanho)} Tf `)
    if (espacamento !== 0) this.cru(`${n(espacamento)} Tc `)
    // O `y` aponta para o topo da linha; a linha de base fica uma altura de
    // maiúscula abaixo — 0,72 em é a altura de caixa alta da Times.
    this.cru(`1 0 0 1 ${n(x)} ${n(this.cima(y + tamanho * 0.72))} Tm `)
    this.partes.push(...literal(texto))
    this.cru(' Tj ')
    if (espacamento !== 0) this.cru('0 Tc ')
    this.cru('ET\n')
  }

  /** O mesmo texto, centralizado em torno de `centro`. */
  centrado(
    texto: string,
    centro: number,
    y: number,
    opcoes: { fonte?: Fonte; tamanho?: number; cor?: string; espacamento?: number } = {},
  ) {
    const { fonte = 'normal', tamanho = 12, espacamento = 0 } = opcoes
    const largura = this.largura(texto, fonte, tamanho, espacamento)
    this.texto(texto, centro - largura / 2, y, opcoes)
  }

  /** O mesmo texto, terminando em `direita`. */
  aDireita(
    texto: string,
    direita: number,
    y: number,
    opcoes: { fonte?: Fonte; tamanho?: number; cor?: string; espacamento?: number } = {},
  ) {
    const { fonte = 'normal', tamanho = 12, espacamento = 0 } = opcoes
    this.texto(texto, direita - this.largura(texto, fonte, tamanho, espacamento), y, opcoes)
  }

  retangulo(
    x: number,
    y: number,
    largura: number,
    altura: number,
    { preenche = '', traco = '', espessura = 1 } = {},
  ) {
    if (preenche) this.cru(`${corPdf(preenche)} rg `)
    if (traco) this.cru(`${corPdf(traco)} RG ${n(espessura)} w `)
    this.cru(`${n(x)} ${n(this.cima(y + altura))} ${n(largura)} ${n(altura)} re `)
    this.cru(preenche && traco ? 'B\n' : preenche ? 'f\n' : 'S\n')
  }

  linha(x1: number, y1: number, x2: number, y2: number, { cor = '#000000', espessura = 1 } = {}) {
    this.cru(
      `${corPdf(cor)} RG ${n(espessura)} w ${n(x1)} ${n(this.cima(y1))} m ${n(x2)} ${n(this.cima(y2))} l S\n`,
    )
  }

  /**
   * Elipse por quatro curvas de Bézier.
   *
   * `0.5523` é a constante que faz um arco de Bézier cúbica passar por um quarto
   * de círculo com erro de um décimo de milésimo — o PDF não tem primitiva de
   * círculo, e sem ela o selo sairia como um losango arredondado.
   */
  elipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    { preenche = '', traco = '', espessura = 1, giro = 0 } = {},
  ) {
    const k = 0.5523
    const y = this.cima(cy)
    if (preenche) this.cru(`${corPdf(preenche)} rg `)
    if (traco) this.cru(`${corPdf(traco)} RG ${n(espessura)} w `)

    // A rotação entra como matriz para o átomo do selo, que são três elipses
    // giradas. `q`/`Q` isolam a transformação do resto da página.
    if (giro !== 0) {
      const r = (giro * Math.PI) / 180
      const [c, s] = [Math.cos(r), Math.sin(r)]
      this.cru(
        `q 1 0 0 1 ${n(cx)} ${n(y)} cm ${n(c)} ${n(s)} ${n(-s)} ${n(c)} 0 0 cm 1 0 0 1 ${n(-cx)} ${n(-y)} cm `,
      )
    }

    this.cru(`${n(cx + rx)} ${n(y)} m `)
    this.cru(`${n(cx + rx)} ${n(y + ry * k)} ${n(cx + rx * k)} ${n(y + ry)} ${n(cx)} ${n(y + ry)} c `)
    this.cru(`${n(cx - rx * k)} ${n(y + ry)} ${n(cx - rx)} ${n(y + ry * k)} ${n(cx - rx)} ${n(y)} c `)
    this.cru(`${n(cx - rx)} ${n(y - ry * k)} ${n(cx - rx * k)} ${n(y - ry)} ${n(cx)} ${n(y - ry)} c `)
    this.cru(`${n(cx + rx * k)} ${n(y - ry)} ${n(cx + rx)} ${n(y - ry * k)} ${n(cx + rx)} ${n(y)} c `)
    this.cru(preenche && traco ? 'B ' : preenche ? 'f ' : 'S ')
    this.cru(giro !== 0 ? 'Q\n' : '\n')
  }

  /** Polígono fechado por uma lista de vértices — losangos, cantoneiras, fitas. */
  poligono(
    pontos: readonly (readonly [number, number])[],
    { preenche = '', traco = '', espessura = 1 } = {},
  ) {
    if (pontos.length < 2) return
    if (preenche) this.cru(`${corPdf(preenche)} rg `)
    if (traco) this.cru(`${corPdf(traco)} RG ${n(espessura)} w `)
    pontos.forEach(([x, y], i) => this.cru(`${n(x)} ${n(this.cima(y))} ${i === 0 ? 'm' : 'l'} `))
    this.cru(`h ${preenche && traco ? 'B' : preenche ? 'f' : 'S'}\n`)
  }

  /** A estrela de cinco pontas, em vetor: ela não existe no WinAnsi. */
  estrela(cx: number, cy: number, raio: number, { preenche = '#000000' } = {}) {
    const pontos: [number, number][] = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? raio : raio * 0.382
      const ang = (Math.PI / 5) * i - Math.PI / 2
      pontos.push([cx + Math.cos(ang) * r, this.cima(cy + Math.sin(ang) * r)])
    }
    this.cru(`${corPdf(preenche)} rg `)
    pontos.forEach(([x, y], i) => this.cru(`${n(x)} ${n(y)} ${i === 0 ? 'm' : 'l'} `))
    this.cru('h f\n')
  }

  conteudo(): number[] {
    return this.partes
  }
}

/**
 * Fecha o arquivo: catálogo, página, fontes, e a tabela `xref`.
 *
 * O `xref` é o que exige montar tudo em bytes: ele lista o deslocamento **em
 * bytes** de cada objeto desde o início do arquivo, e um leitor estrito recusa o
 * PDF se um deles estiver errado. Com acentos no conteúdo, contar caracteres de
 * string JavaScript daria offsets menores que os reais.
 */
export function montarPdf(pagina: Pagina, { largura, altura } = A4_PAISAGEM): Uint8Array {
  const conteudo = pagina.conteudo()

  const objetos: number[][] = [
    ascii('<< /Type /Catalog /Pages 2 0 R >>'),
    ascii('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(largura)} ${n(altura)}] ` +
        '/Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>',
    ),
    [...ascii(`<< /Length ${conteudo.length} >>\nstream\n`), ...conteudo, ...ascii('\nendstream')],
    ...(['normal', 'negrito', 'italico'] as Fonte[]).map((f) =>
      ascii(`<< /Type /Font /Subtype /Type1 /BaseFont /${BASE[f]} /Encoding /WinAnsiEncoding >>`),
    ),
  ]

  const bytes: number[] = [...ascii('%PDF-1.4\n')]
  const posicoes: number[] = []

  objetos.forEach((corpo, i) => {
    posicoes.push(bytes.length)
    bytes.push(...ascii(`${i + 1} 0 obj\n`), ...corpo, ...ascii('\nendobj\n'))
  })

  const inicioXref = bytes.length
  bytes.push(...ascii(`xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`))
  for (const p of posicoes) bytes.push(...ascii(`${String(p).padStart(10, '0')} 00000 n \n`))
  bytes.push(
    ...ascii(
      `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`,
    ),
  )

  return Uint8Array.from(bytes)
}

function ascii(s: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i))
  return bytes
}
