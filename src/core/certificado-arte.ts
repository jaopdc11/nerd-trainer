/**
 * A geometria do diploma, em coordenadas de A4 deitado (842 × 595 pt).
 *
 * Existe porque o documento é desenhado duas vezes: em PDF, para baixar, e em
 * SVG, na folha da tela que a pessoa confere antes. Os dois desenhos são os
 * mesmos traços em sistemas diferentes — e a primeira versão, com as
 * coordenadas escritas de novo de cada lado, já saiu divergente: o selo da tela
 * tinha um texto em arco que o PDF não tinha, e era justamente o pedaço
 * ilegível.
 *
 * Aqui não há desenho, só números: listas de segmentos e de polígonos. Quem
 * pinta é `certificado-pdf.ts` (operadores PDF) e o `<Ornamentos>` da folha
 * (elementos SVG). Manter isto sem dependência de nenhum dos dois é o que
 * garante que os dois vejam a mesma figura.
 */

export const FOLHA = { largura: 841.89, altura: 595.28 } as const

export const CORES = {
  papel: '#fbf6e9',
  tinta: '#1b1710',
  ouro: '#b08d3f',
  ouroEscuro: '#8a6a1f',
  /** O guilhochê: quase o tom do papel, para existir sem disputar com o texto. */
  teia: '#f4ecd8',
  /** As rosetas dos cantos, onde não há texto por cima e cabe mais contraste. */
  teiaForte: '#e7d7b0',
  /** O fundo da faixa do elo e das fitas do selo. */
  faixa: '#f6ecd3',
  /** O microtexto da borda. */
  miudo: '#cbb88a',
  /** Os rótulos da ficha: tinta lavada, para o valor ao lado ficar na frente. */
  rotulo: '#7b6a4e',
} as const

export interface Segmento {
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
  readonly espessura: number
}

export interface Retangulo {
  readonly x: number
  readonly y: number
  readonly largura: number
  readonly altura: number
  readonly espessura: number
}

export type Poligono = readonly (readonly [number, number])[]

/**
 * O guilhochê: a teia que dinheiro e diploma têm no fundo.
 *
 * São 144 cordas ligando o ponto `i` ao ponto `3i` de uma elipse — o truque de
 * linha e prego que faz um cardioide aparecer sem ninguém desenhar a curva. O
 * multiplicador 3 é o que dá duas voltas e produz o laço; com 2 sai um círculo
 * dobrado, com 5 vira uma renda tão densa que o texto por cima some.
 */
export function cordasDoGuilloche(
  cx: number,
  cy: number,
  raio: number,
  cordas = 144,
): readonly Segmento[] {
  const ponto = (i: number): [number, number] => {
    const ang = (i * Math.PI * 2) / cordas - Math.PI / 2
    return [cx + Math.cos(ang) * raio, cy + Math.sin(ang) * raio * 0.62]
  }

  return Array.from({ length: cordas }, (_, i) => {
    const [x1, y1] = ponto(i)
    const [x2, y2] = ponto((i * 3) % cordas)
    return { x1, y1, x2, y2, espessura: 0.25 }
  })
}

/**
 * A moldura: três filetes e uma cantoneira em cada canto.
 *
 * Três e não dois porque dois filetes paralelos leem como "caixa"; o terceiro,
 * fino e afastado, é o que faz a borda parecer gravada. As cantoneiras rendem
 * mais que tudo: são três traços e um losango por canto, e é delas que vem a
 * cara de documento em vez de slide.
 */
export function moldura(): {
  readonly filetes: readonly Retangulo[]
  readonly tracos: readonly Segmento[]
  readonly losangos: readonly Poligono[]
} {
  const { largura: L, altura: A } = FOLHA
  const tracos: Segmento[] = []
  const losangos: Poligono[] = []

  for (const [x, y, sx, sy] of [
    [31, 31, 1, 1],
    [L - 31, 31, -1, 1],
    [31, A - 31, 1, -1],
    [L - 31, A - 31, -1, -1],
  ] as const) {
    tracos.push(
      { x1: x + sx * 4, y1: y + sy * 26, x2: x + sx * 4, y2: y + sy * 4, espessura: 1.2 },
      { x1: x + sx * 4, y1: y + sy * 4, x2: x + sx * 26, y2: y + sy * 4, espessura: 1.2 },
      { x1: x + sx * 10, y1: y + sy * 20, x2: x + sx * 20, y2: y + sy * 10, espessura: 0.5 },
    )
    losangos.push(losango(x + sx * 14, y + sy * 14, 3))
  }

  return {
    filetes: [
      { x: 24, y: 24, largura: L - 48, altura: A - 48, espessura: 2.6 },
      { x: 31, y: 31, largura: L - 62, altura: A - 62, espessura: 0.5 },
      { x: 40, y: 40, largura: L - 80, altura: A - 80, espessura: 0.3 },
    ],
    tracos,
    losangos,
  }
}

/**
 * A corrente que percorre a borda: losango, traço, losango, traço.
 *
 * É o que mais muda a percepção do documento, e é também a razão de a versão
 * anterior parecer um slide com borda: três retângulos concêntricos são uma
 * caixa, por mais finos que sejam os filetes. Um padrão **repetido** ao longo do
 * perímetro é o que o olho lê como gravação.
 *
 * O passo é recalculado por lado para a corrente fechar certinho nos cantos —
 * com um passo fixo, o último elo de cada lado cai a meio caminho e a moldura
 * fica torta justamente onde o olho compara os quatro cantos.
 */
export function correnteDaBorda(): {
  readonly losangos: readonly Poligono[]
  readonly tracos: readonly Segmento[]
} {
  const { largura: L, altura: A } = FOLHA
  const [x0, y0, x1, y1] = [35.5, 35.5, L - 35.5, A - 35.5]
  const losangos: Poligono[] = []
  const tracos: Segmento[] = []

  const correr = (
    inicio: number,
    fim: number,
    ponto: (v: number) => [number, number],
    passoAlvo = 15,
  ) => {
    const total = fim - inicio
    const elos = Math.max(2, Math.round(total / passoAlvo))
    const passo = total / elos

    for (let i = 0; i <= elos; i++) {
      const [cx, cy] = ponto(inicio + i * passo)
      losangos.push(losango(cx, cy, 2.1))
      if (i === elos) continue
      // O traço liga um losango ao próximo, com folga dos dois lados.
      const [ax, ay] = ponto(inicio + i * passo + 3.6)
      const [bx, by] = ponto(inicio + (i + 1) * passo - 3.6)
      tracos.push({ x1: ax, y1: ay, x2: bx, y2: by, espessura: 0.45 })
    }
  }

  correr(x0, x1, (v) => [v, y0])
  correr(x0, x1, (v) => [v, y1])
  correr(y0, y1, (v) => [x0, v])
  correr(y0, y1, (v) => [x1, v])

  return { losangos, tracos }
}

/**
 * A faixa atrás do elo — o retângulo de pontas recortadas onde o nome da patente
 * fica deitado.
 *
 * Diploma bom não escreve a coisa mais importante no vazio: ele a apoia em
 * alguma coisa. A faixa é o que dá peso ao elo sem aumentar o corpo da letra,
 * que já está em 42 pontos.
 */
export function faixa(cx: number, cy: number, largura: number, altura: number): Poligono {
  const [ml, ma] = [largura / 2, altura / 2]
  const ponta = 18
  return [
    [cx - ml, cy - ma],
    [cx + ml, cy - ma],
    [cx + ml + ponta, cy],
    [cx + ml, cy + ma],
    [cx - ml, cy + ma],
    [cx - ml - ponta, cy],
  ]
}

/** As duas fitas que pendem do selo, como num lacre. */
export function fitasDoSelo(cx: number, cy: number, raio: number): readonly Poligono[] {
  const base = cy + raio * 0.72
  const queda = 38
  return [-1, 1].map((lado) => [
    [cx + lado * 6, base],
    [cx + lado * 22, base + 4],
    [cx + lado * 20, base + queda],
    [cx + lado * 11, base + queda - 12],
    [cx + lado * 3, base + queda],
  ])
}

export function losango(cx: number, cy: number, r: number): Poligono {
  return [
    [cx, cy - r],
    [cx + r, cy],
    [cx, cy + r],
    [cx - r, cy],
  ]
}

/** Linha — losango — linha, o separador clássico de diploma. */
export function separador(
  cx: number,
  y: number,
  largura: number,
): { readonly tracos: readonly Segmento[]; readonly losangos: readonly Poligono[] } {
  const meia = largura / 2
  return {
    tracos: [
      { x1: cx - meia, y1: y, x2: cx - 10, y2: y, espessura: 0.8 },
      { x1: cx + 10, y1: y, x2: cx + meia, y2: y, espessura: 0.8 },
    ],
    losangos: [losango(cx, y, 4), losango(cx - meia - 7, y, 2), losango(cx + meia + 7, y, 2)],
  }
}

/**
 * O denteado do selo: 40 traços curtos entre os dois anéis.
 *
 * É o que separa uma medalha de dois círculos concêntricos — e é também o que
 * substituiu o texto em arco da primeira versão, que em qualquer tamanho de tela
 * menor que o desktop virava um borrão ilegível em volta da borda.
 */
export function denteadoDoSelo(cx: number, cy: number, raio: number): readonly Segmento[] {
  return Array.from({ length: 40 }, (_, i) => {
    const ang = (i * Math.PI * 2) / 40
    const [c, s] = [Math.cos(ang), Math.sin(ang)]
    return {
      x1: cx + c * (raio + 1.5),
      y1: cy + s * (raio + 1.5),
      x2: cx + c * (raio + 6),
      y2: cy + s * (raio + 6),
      espessura: 1.1,
    }
  })
}

/**
 * As rosetas dos quatro cantos: o mesmo truque de cordas do guilhochê, em
 * miniatura.
 *
 * Elas resolvem o problema que sobrava depois da corrente na borda — os cantos
 * ficavam sendo o único lugar liso de uma moldura ornamentada, e era exatamente
 * para onde o olho ia. Multiplicador 5 em vez de 3: num raio pequeno, o
 * cardioide do 3 vira um borrão, enquanto a estrela de cinco laços continua
 * legível.
 */
export function rosetasDosCantos(): readonly Segmento[] {
  const { largura: L, altura: A } = FOLHA
  const raio = 23
  const segmentos: Segmento[] = []

  for (const [cx, cy] of [
    [78, 78],
    [L - 78, 78],
    [78, A - 78],
    [L - 78, A - 78],
  ] as const) {
    const cordas = 48
    const ponto = (i: number): [number, number] => {
      const ang = (i * Math.PI * 2) / cordas
      return [cx + Math.cos(ang) * raio, cy + Math.sin(ang) * raio]
    }
    for (let i = 0; i < cordas; i++) {
      const [x1, y1] = ponto(i)
      const [x2, y2] = ponto((i * 5) % cordas)
      segmentos.push({ x1, y1, x2, y2, espessura: 0.22 })
    }
  }

  return segmentos
}

/** Os cinco pontos de uma estrela, para onde o WinAnsi não alcança. */
export function estrela(cx: number, cy: number, raio: number): Poligono {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? raio : raio * 0.382
    const ang = (Math.PI / 5) * i - Math.PI / 2
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r] as const
  })
}

/** A frase do microtexto da borda, repetida até quase encher a largura útil. */
export const FRASE_MIUDA = 'NERD TRAINER · SEM SERVIDOR · SEM CONTA · SEM VALOR LEGAL · '
