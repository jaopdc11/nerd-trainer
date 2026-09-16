/**
 * O esqueleto humano, desenhado à mão em SVG.
 *
 * ## A régua deste arquivo, que não é a do mapa
 *
 * `paises-mapa.ts` e `estados-mapa.ts` não têm uma linha de geometria escrita
 * por gente: saem de `gen-paises.mjs` e `gen-estados.mjs`, que projetam malha do
 * Natural Earth e do IBGE. E quando o pedido foi um jogo de oceanos, ele não foi
 * feito — o cabeçalho de `estreitos.ts` explica por quê: contorno de oceano é
 * linha de costa mais **limite convencional**, e desenhar um retângulo à mão e
 * chamá-lo de Atlântico seria pôr no app um mapa que ensina cartografia errada.
 *
 * Aqui a régua é outra, e é preciso dizer qual é antes da primeira coordenada.
 * **Um esqueleto didático é um esquema, não um levantamento.** Não existe pacote
 * npm de contorno anatômico como existe para fronteira política, e não deveria
 * existir: todo livro de anatomia escolar desenha o esqueleto estilizado, e
 * ninguém mede coordenada em cima de um. A prancha do Netter e o boneco da
 * parede da sala de aula são os dois esquemas — mudam o traço, não mudam o que
 * afirmam. Um mapa afirma "a fronteira passa aqui, e dá para conferir"; este
 * desenho afirma "o fêmur é o osso longo entre o quadril e o joelho", que é
 * verdade em qualquer corpo e não depende de nenhum dígito abaixo.
 *
 * O que o desenho **promete**, e o que `esqueleto.test.ts` mede:
 *
 * - posição relativa certa: crânio acima do tórax, tórax acima da pelve, pelve
 *   acima dos membros inferiores; cervicais → torácicas → lombares → sacro →
 *   cóccix nessa ordem; clavícula acima das costelas; patela sobre o joelho,
 *   entre a ponta do fêmur e a da tíbia;
 * - proporção grosseira certa: o fêmur é o osso mais longo do desenho, como é no
 *   corpo; a tíbia vem depois; nenhum osso sai da caixa;
 * - simetria: osso par é desenhado uma vez e **espelhado por código** no eixo do
 *   corpo, então a simetria não é conferida no olho, é consequência de
 *   `doisLados`; osso ímpar de linha média tem o centro da caixa no eixo.
 *
 * O que o desenho **não** promete, e é melhor estar escrito: nenhuma medida daqui
 * vale para nada. A espessura do úmero é o que ficou legível a 360 px de
 * largura, não 1/9 da altura do corpo. Quem quiser antropometria não vai achar
 * neste arquivo — vai achar um esqueleto reconhecível, que é o que o jogo pede.
 *
 * ## Duas vistas no mesmo boneco, e por quê
 *
 * O corpo está de **frente**; a cabeça está de **perfil**, virada para a
 * esquerda de quem olha. Não é descuido: numa vista frontal do crânio o
 * occipital simplesmente **não existe** (fica atrás) e o parietal aparece como
 * uma lasca no canto superior. Das saídas possíveis, todas ruins, esta é a menos:
 * desenhar só o que a vista frontal mostra custaria occipital e parietal, que
 * são dois dos seis ossos do crânio que a escola cobra; inventar um occipital
 * visível de frente seria mentir sobre anatomia, que é o que a régua acima
 * proíbe; e pôr o crânio num quadro separado no canto viraria duas figuras em
 * vez de uma. Cabeça virada de lado com o corpo de frente é uma pessoa olhando
 * para o lado — é postura, não é impossibilidade anatômica. O `comoJogar` do
 * jogo repete isso para o jogador.
 *
 * ## Por que a geometria é construída, e não uma lista de `d`
 *
 * Os contornos abaixo saem de meia dúzia de construtores — `fita`, `ossoLongo`,
 * `pilhaDeVertebras`, `oval`, `poligono` — e não de strings `d` escritas à mão.
 * A alternativa (colar `d` pronto de um editor de SVG) foi descartada porque
 * `d` colado é ilegível em revisão e impossível de ajustar: mover o cotovelo
 * 4 px viraria uma caçada a números soltos. Com construtor, o que está no
 * arquivo são as pontas do osso e a espessura dele — que é a informação
 * anatômica — e o resto é conta.
 */

// ---------------------------------------------------------------------------
// A caixa
// ---------------------------------------------------------------------------

/**
 * Caixa do desenho. 360 × 1000 porque é a proporção de gente em pé: os pontos
 * mais largos são as mãos, e sobram ~20 px de folga de cada lado.
 *
 * A altura é 1000 para que as frações antropométricas conhecidas (joelho a 28,5%
 * da altura, cotovelo a 63%, ombro a 82%) virem coordenada sem conta de cabeça —
 * é a mesma ideia da caixa 1000 × 500 do mapa-múndi.
 */
export const LARGURA_CORPO = 360
export const ALTURA_CORPO = 1000

/** Eixo de simetria do corpo. Todo osso par é espelhado aqui. */
export const EIXO = LARGURA_CORPO / 2

// ---------------------------------------------------------------------------
// Geometria: os construtores
// ---------------------------------------------------------------------------

/** Ponto na caixa do corpo, em pixels da viewBox. */
export type Ponto = readonly [number, number]

/**
 * Uma casa decimal, como nos arquivos gerados dos mapas — mas com o empate indo
 * para o par, e não para cima.
 *
 * Não é preciosismo: `Math.round` empata sempre na direção do +∞, e isso **quebra
 * a simetria do boneco**. A segunda vértebra lombar cai em EIXO ± 20,75; com
 * empate para cima, os dois lados viram 200,8 e 159,3, que não são espelho um do
 * outro por um décimo, e o teste de simetria acusa — corretamente. Arredondar
 * para o par é o único critério que comuta com `x ↦ 2·EIXO − x`, que é
 * exatamente a operação que `espelhar` faz.
 */
function arredondar(n: number): number {
  const escalado = n * 10
  const acima = Math.round(escalado)
  const empate = Math.abs(escalado % 1) === 0.5
  // `Math.round` devolve sempre o vizinho de cima no empate; se ele for ímpar, o
  // par é o de baixo.
  return (empate && acima % 2 !== 0 ? acima - 1 : acima) / 10
}

const par = ([x, y]: Ponto): string => `${arredondar(x)},${arredondar(y)}`

/** Polígono fechado. `M p L p L p … Z` — um par por comando, que é o que `espelhar` exige. */
function poligono(pontos: readonly Ponto[]): string {
  if (pontos.length < 3) throw new Error('polígono com menos de três pontos')
  return `M${pontos.map(par).join('L')}Z`
}

/**
 * Elipse em quatro cúbicas, e não o comando `A` do SVG.
 *
 * `A` carregaria `rx ry rotação arco varredura x y` — sete números em que só os
 * dois últimos são coordenada, e `espelhar` teria de conhecer a gramática de
 * cada comando para saber quais inverter (e ainda trocar o bit de varredura).
 * Com cúbicas, todo número é coordenada e o espelho é uma linha de código.
 */
const KAPPA = 0.5522847498307936

function oval(cx: number, cy: number, rx: number, ry: number): string {
  const kx = rx * KAPPA
  const ky = ry * KAPPA
  return (
    `M${par([cx, cy - ry])}` +
    `C${par([cx + kx, cy - ry])} ${par([cx + rx, cy - ky])} ${par([cx + rx, cy])}` +
    `C${par([cx + rx, cy + ky])} ${par([cx + kx, cy + ry])} ${par([cx, cy + ry])}` +
    `C${par([cx - kx, cy + ry])} ${par([cx - rx, cy + ky])} ${par([cx - rx, cy])}` +
    `C${par([cx - rx, cy - ky])} ${par([cx - kx, cy - ry])} ${par([cx, cy - ry])}Z`
  )
}

/** Amostra uma cúbica em `n` pontos. Serve de linha de centro para `fita`. */
function amostrarCubica(p0: Ponto, p1: Ponto, p2: Ponto, p3: Ponto, n: number): readonly Ponto[] {
  const pontos: Ponto[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const u = 1 - t
    const a = u * u * u
    const b = 3 * u * u * t
    const c = 3 * u * t * t
    const d = t * t * t
    pontos.push([
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ])
  }
  return pontos
}

/**
 * Engrossa uma linha de centro numa faixa fechada, com espessura variável.
 *
 * É o construtor que carrega o arquivo: costela, clavícula e todo osso longo são
 * uma linha com espessura. A normal é calculada por diferença central, o que
 * basta num traço sem dobra fechada — offset exato de curva é problema de
 * CAD, e aqui produziria o mesmo desenho com dez vezes mais código.
 */
function fita(centro: readonly Ponto[], espessura: (t: number) => number): string {
  const n = centro.length
  if (n < 3) throw new Error('fita com menos de três pontos')
  const fora: Ponto[] = []
  const dentro: Ponto[] = []

  for (let i = 0; i < n; i++) {
    const anterior = centro[Math.max(0, i - 1)] as Ponto
    const seguinte = centro[Math.min(n - 1, i + 1)] as Ponto
    const tx = seguinte[0] - anterior[0]
    const ty = seguinte[1] - anterior[1]
    const comprimento = Math.hypot(tx, ty) || 1
    // Normal à esquerda do sentido de percurso.
    const nx = -ty / comprimento
    const ny = tx / comprimento
    const meia = espessura(i / (n - 1)) / 2
    const p = centro[i] as Ponto
    fora.push([p[0] + nx * meia, p[1] + ny * meia])
    dentro.push([p[0] - nx * meia, p[1] - ny * meia])
  }

  return poligono([...fora, ...dentro.reverse()])
}

/**
 * Espessura de osso longo: diáfise reta no meio, epífises alargadas nas pontas.
 *
 * A primeira versão era um Bézier quadrático entre as três larguras, e estava
 * errada de um jeito que só o desenho mostrou: a curva começa a estreitar já no
 * primeiro pixel, e a tíbia — 34 de largura no platô, 13 na canela — saía um
 * funil, não um osso. Osso longo não afina assim; ele tem um tubo no meio e
 * alarga só nos últimos centímetros, onde estão as cartilagens da articulação.
 *
 * `ABERTURA` é a fração do comprimento que cada ponta leva para alargar. 0,22
 * é o que dá silhueta de fêmur; mais que isso vira ampulheta.
 */
const ABERTURA = 0.22

function perfilDeEspessura(inicio: number, meio: number, fim: number): (t: number) => number {
  // Rampa suave: 1 na ponta, 0 a partir de ABERTURA, sem bico no meio.
  const rampa = (u: number): number => (u >= 1 ? 0 : (1 - u) * (1 - u))
  return (t) =>
    meio + (inicio - meio) * rampa(t / ABERTURA) + (fim - meio) * rampa((1 - t) / ABERTURA)
}

/**
 * Osso longo entre duas pontas, com uma leve barriga lateral.
 *
 * `desvio` é o quanto a diáfise foge da reta que liga as pontas: úmero e fêmur
 * são arqueados de verdade, e a reta perfeita é que pareceria errada.
 */
function ossoLongo(
  topo: Ponto,
  base: Ponto,
  larguras: readonly [number, number, number],
  desvio = 0,
): string {
  const dx = base[0] - topo[0]
  const dy = base[1] - topo[1]
  const comprimento = Math.hypot(dx, dy) || 1
  const nx = -dy / comprimento
  const ny = dx / comprimento
  const controle = (f: number): Ponto => [
    topo[0] + dx * f + nx * desvio,
    topo[1] + dy * f + ny * desvio,
  ]
  const centro = amostrarCubica(topo, controle(0.3), controle(0.7), base, 13)
  return fita(centro, perfilDeEspessura(larguras[0], larguras[1], larguras[2]))
}

/**
 * Uma pilha de vértebras entre dois níveis.
 *
 * Desenhar a coluna como um retângulo só seria mais simples e diria menos: o
 * jogador precisa ver que "vértebras cervicais" são **sete** peças e que elas
 * engrossam para baixo. Cada peça é um hexágono — corpo estreito em cima e
 * embaixo, processos transversos no meio —, que é a silhueta que a vértebra tem
 * de frente.
 */
function pilhaDeVertebras(
  yTopo: number,
  yBase: number,
  quantidade: number,
  larguraTopo: number,
  larguraBase: number,
): string {
  const passo = (yBase - yTopo) / quantidade
  const folga = Math.min(2, passo * 0.18)
  const pecas: string[] = []
  for (let i = 0; i < quantidade; i++) {
    const t = quantidade === 1 ? 0 : i / (quantidade - 1)
    const largura = larguraTopo + (larguraBase - larguraTopo) * t
    const y = yTopo + i * passo
    const h = passo - folga
    const meia = largura / 2
    const ombro = Math.max(2, meia - 4)
    pecas.push(
      poligono([
        [EIXO - ombro, y],
        [EIXO + ombro, y],
        [EIXO + meia, y + h / 2],
        [EIXO + ombro, y + h],
        [EIXO - ombro, y + h],
        [EIXO - meia, y + h / 2],
      ]),
    )
  }
  return pecas.join('')
}

/**
 * Espelha um `d` no eixo do corpo.
 *
 * Só entende `M`, `L`, `C`, `Q` e `Z` absolutos, e **explode** em qualquer outra
 * coisa. É proposital: num `d` com `A`, `H`, `V` ou comando relativo, inverter
 * todo número de índice par produziria um desenho errado em silêncio — meio osso
 * no lugar certo e meio do lado de fora. Melhor quebrar na carga do módulo, onde
 * o teste pega, do que acender a coisa errada no meio de uma partida.
 */
const COMANDOS_ACEITOS = new Set(['M', 'L', 'C', 'Q', 'Z'])

export function espelhar(d: string): string {
  return d.replace(/[A-Za-z][^A-Za-z]*/g, (trecho) => {
    const comando = trecho[0] as string
    if (!COMANDOS_ACEITOS.has(comando)) {
      throw new Error(`comando "${comando}" não é espelhável: use M, L, C, Q ou Z`)
    }
    const numeros = trecho.slice(1).match(/-?\d+(?:\.\d+)?/g) ?? []
    if (numeros.length % 2 !== 0) throw new Error(`"${comando}" com número ímpar de coordenadas`)
    const pontos: Ponto[] = []
    for (let i = 0; i < numeros.length; i += 2) {
      pontos.push([2 * EIXO - Number(numeros[i]), Number(numeros[i + 1])])
    }
    return comando + pontos.map(par).join(' ')
  })
}

/**
 * O osso par: desenhado de um lado, espelhado no outro.
 *
 * Os dois lados vão no **mesmo** `d`, e não em duas células, porque "fêmur" é
 * uma resposta só: quem sabe o fêmur sabe os dois. Como subcaminhos de um `path`
 * único, os dois acendem juntos e o motor não precisa saber de nada disso.
 */
function doisLados(d: string): string {
  return `${d}${espelhar(d)}`
}

/**
 * Atalho de leitura para o corpo: **distância** do eixo, do lado esquerdo de
 * quem olha. Todo osso par é escrito assim e espelhado depois, então `dx(50)`
 * quer dizer "a 50 do meio", e não "no pixel 130".
 */
const dx = (distancia: number): number => EIXO - distancia

/**
 * Atalho de leitura para a cabeça: deslocamento **com sinal** a partir do eixo,
 * positivo para trás (o occipital) e negativo para a frente (o rosto).
 *
 * É outro atalho e não o mesmo porque o crânio está de perfil: ali não existe
 * "os dois lados", existe frente e nuca, e escrever a nuca como `dx(-62)` — uma
 * distância negativa — seria mentir sobre o que a função mede.
 */
const px = (deslocamento: number): number => EIXO + deslocamento

// ---------------------------------------------------------------------------
// O dado
// ---------------------------------------------------------------------------

export const REGIOES = [
  'Crânio',
  'Coluna vertebral',
  'Tórax',
  'Membros superiores',
  'Pelve',
  'Membros inferiores',
] as const
export type Regiao = (typeof REGIOES)[number]

/**
 * Como o osso se relaciona com o eixo do corpo. É o que o teste de simetria usa
 * para saber o que cobrar de cada um.
 *
 * - `par`: existe dos dois lados e foi espelhado por código;
 * - `mediana`: um só, em cima do eixo;
 * - `perfil`: par no corpo, mas desenhado uma vez porque a **cabeça está de
 *   lado**. Não é exceção à simetria do corpo, é consequência da vista — e por
 *   isso mora num valor próprio em vez de virar um `boolean` frouxo que
 *   confundiria "ímpar" com "não desenhado dos dois lados".
 */
export type Simetria = 'par' | 'mediana' | 'perfil'

export interface Osso {
  /** kebab-case, estável: é a chave da célula. */
  readonly id: string
  readonly nome: string
  /** Nomes que a escola brasileira ainda usa: rótula, omoplata, perônio, cúbito. */
  readonly sinonimos: readonly string[]
  readonly regiao: Regiao
  readonly simetria: Simetria
  /** Quantos ossos deste nome o corpo tem. Entra na conta dos 206, no teste. */
  readonly quantidade: number
  /** O que se lê depois de errar. Tem de ensinar algo além do nome. */
  readonly detalhe: string
  readonly forma: { readonly d: string }
}

// --- Crânio, de perfil -----------------------------------------------------
//
// As sete peças são recortadas sobre os mesmos pontos de referência que um atlas
// usa para descrever um crânio de lado, e é isso que as mantém tilando a mesma
// cabeça sem buraco nem sobreposição grossa:
//
//   bregma   px(-6),  13   encontro da sutura coronal com o topo
//   glabela  px(-53), 62   a saliência entre as sobrancelhas
//   ptério   px(-30), 72   onde frontal, parietal, temporal e esfenoide se tocam
//   lambda   px(46),  40   topo da sutura lambdoide, atrás
//   astério  px(40),  94   pé da lambdoide, logo acima da mastoide
//   meato    px(14),  92   o buraco do ouvido; o arco zigomático sai daí para a frente
//   gônio    px(4),  142   o canto da mandíbula
//
// A sutura coronal desce do bregma ao ptério; a lambdoide, do lambda ao astério;
// a escamosa liga ptério e astério passando por cima do ouvido. Frontal,
// parietal, occipital e temporal são os quatro pedaços que essas três linhas
// recortam — nessa ordem, da frente para trás.

const CRANIO_FRONTAL = poligono([
  [px(-6), 13],
  [px(-26), 16],
  [px(-40), 30],
  [px(-50), 46],
  [px(-53), 62],
  [px(-46), 70],
  [px(-30), 72],
  [px(-18), 42],
])

const CRANIO_PARIETAL = poligono([
  [px(-6), 13],
  [px(16), 14],
  [px(34), 22],
  [px(44), 34],
  [px(46), 40],
  [px(44), 68],
  [px(40), 94],
  [px(30), 86],
  [px(14), 74],
  [px(-8), 72],
  [px(-30), 74],
  [px(-18), 42],
])

const CRANIO_OCCIPITAL = poligono([
  [px(46), 40],
  [px(56), 52],
  [px(60), 68],
  [px(56), 88],
  [px(48), 104],
  [px(38), 114],
  [px(30), 106],
  [px(40), 94],
  [px(44), 68],
])

const CRANIO_TEMPORAL = poligono([
  [px(-30), 78],
  [px(-8), 76],
  [px(14), 78],
  [px(30), 90],
  [px(38), 101],
  [px(34), 112],
  [px(23), 113],
  [px(20), 98],
  [px(4), 92],
  [px(-14), 88],
  [px(-30), 86],
])

const CRANIO_ZIGOMATICO = poligono([
  [px(-52), 68],
  [px(-30), 78],
  [px(-28), 89],
  [px(-40), 96],
  [px(-54), 92],
  [px(-58), 78],
])

const CRANIO_MAXILA = poligono([
  [px(-58), 82],
  [px(-42), 96],
  [px(-20), 100],
  [px(-18), 114],
  [px(-34), 120],
  [px(-54), 118],
  [px(-66), 100],
  [px(-66), 88],
])

const CRANIO_MANDIBULA = poligono([
  [px(-62), 120],
  [px(-64), 132],
  [px(-48), 140],
  [px(-20), 144],
  [px(4), 142],
  [px(14), 134],
  [px(20), 114],
  [px(22), 100],
  [px(12), 98],
  [px(8), 120],
  [px(-2), 128],
  [px(-30), 130],
  [px(-54), 126],
])

// --- Tórax -----------------------------------------------------------------
//
// Doze pares de costelas. A largura pedida em `ALCANCE` é a largura **medida** —
// o ponto de controle da cúbica é resolvido a partir dela, porque um Bézier não
// passa pelos próprios controles e escrever o controle direto daria uma caixa
// torácica 25% mais estreita do que a escrita no arquivo.

/** Meia-largura máxima de cada costela, da 1ª à 12ª. */
const ALCANCE = [40, 52, 62, 70, 76, 79, 80, 78, 74, 67, 55, 42] as const

/** Ponta anterior de cada costela: as sete primeiras no esterno, as três seguintes
 *  na margem costal, e as duas últimas em lugar nenhum — são as flutuantes. */
const PONTA_ANTERIOR: readonly Ponto[] = [
  [dx(12), 218],
  [dx(12), 231],
  [dx(12), 244],
  [dx(12), 257],
  [dx(12), 270],
  [dx(12), 283],
  [dx(12), 296],
  [dx(26), 318],
  [dx(40), 334],
  [dx(54), 350],
  [dx(52), 352],
  [dx(42), 356],
]

function costela(i: number): string {
  const inicio: Ponto = [dx(14), 212 + i * 10.5]
  const fim = PONTA_ANTERIOR[i] as Ponto
  const alcance = ALCANCE[i] as number
  // x(0,5) de uma cúbica = (x0 + 3x1 + 3x2 + x3)/8; com os dois controles no
  // mesmo x, isso resolve para o x de controle que dá a largura pedida.
  const recuo = (8 * alcance - (EIXO - inicio[0]) - (EIXO - fim[0])) / 6
  const controle = dx(recuo)
  const centro = amostrarCubica(inicio, [controle, inicio[1] + 2], [controle, fim[1] - 6], fim, 16)
  return fita(centro, () => 6)
}

const COSTELAS = doisLados(Array.from({ length: 12 }, (_, i) => costela(i)).join(''))

/**
 * Manúbrio largo em cima, corpo estreito embaixo, processo xifoide na ponta.
 *
 * O corpo do esterno tem 20 px de largura aqui, contra os 46 a 54 da coluna
 * torácica desenhada atrás dele — e é de propósito. É essa diferença que deixa
 * as vértebras torácicas aparecendo dos dois lados, em vez de a coluna sumir
 * inteira: de frente, num corpo de verdade, é exatamente o que se vê dela.
 */
const ESTERNO = poligono([
  [dx(15), 203],
  [dx(-15), 203],
  [dx(-15), 220],
  [dx(-10), 232],
  [dx(-10), 288],
  [dx(-5), 298],
  [dx(0), 306],
  [dx(5), 298],
  [dx(10), 288],
  [dx(10), 232],
  [dx(15), 220],
])

// --- Membros superiores ----------------------------------------------------

const CLAVICULA = doisLados(
  fita(
    amostrarCubica([dx(8), 212], [dx(42), 220], [dx(80), 202], [dx(106), 212], 11),
    perfilDeEspessura(8, 6, 9),
  ),
)

const ESCAPULA = doisLados(
  poligono([
    [dx(76), 216],
    [dx(116), 213],
    [dx(112), 246],
    [dx(96), 300],
    [dx(80), 246],
  ]),
)

const UMERO = doisLados(
  oval(dx(108), 228, 13, 12) + ossoLongo([dx(108), 230], [dx(102), 394], [22, 12, 24], 3),
)

/** O rádio é o lateral — o do lado do polegar —, então fica mais longe do eixo. */
const RADIO = doisLados(ossoLongo([dx(120), 402], [dx(122), 532], [9, 8, 15], -2))

/** A ulna é a medial, e a ponta grossa dela é o olécrano, no cotovelo. */
const ULNA = doisLados(ossoLongo([dx(100), 396], [dx(96), 532], [16, 8, 10], 2))

/** Os oito ossos do carpo, em duas fileiras de quatro — que é como eles estão. */
const CARPO = doisLados(
  [
    ...[124, 115, 106, 98].map((d, i) => oval(dx(d), 540 + i * 0.8, 5, 4.6)),
    ...[122, 113, 104, 96].map((d, i) => oval(dx(d), 552 + i * 0.8, 5, 4.6)),
  ].join(''),
)

/**
 * Um dedo por linha, do polegar ao mínimo: distância da base do metacarpo,
 * distância da ponta dele, altura dessa ponta, quantas falanges e o quanto cada
 * falange se afasta da anterior.
 *
 * O polegar tem **duas** falanges e os outros quatro têm três — é a única
 * irregularidade da mão, e é justamente o que a carta "falanges" ensina. Ele
 * também é o mais curto e o que mais abre, que é o que dá silhueta de mão ao
 * conjunto; sem isso, cinco bastões paralelos pareceriam um pente.
 */
const DEDOS: readonly (readonly [number, number, number, number, number])[] = [
  [124, 138, 586, 2, 5],
  [116, 122, 598, 3, 2],
  [108, 109, 602, 3, 1],
  [100, 97, 598, 3, -2],
  [93, 86, 590, 3, -4],
]

const METACARPO = doisLados(
  DEDOS.map(([base, ponta, y]) => ossoLongo([dx(base), 562], [dx(ponta), y], [6, 4, 6])).join(''),
)

/** Catorze falanges por mão: três por dedo, duas no polegar. */
const FALANGES_MAO = doisLados(
  DEDOS.flatMap(([, ponta, y, segmentos, deriva]) => {
    const pecas: string[] = []
    let topo = y + 3
    for (let s = 0; s < segmentos; s++) {
      const altura = 15 - s * 3.5
      pecas.push(
        ossoLongo(
          [dx(ponta + deriva * s), topo],
          [dx(ponta + deriva * (s + 1)), topo + altura],
          [5.5 - s * 0.7, 4 - s * 0.5, 5 - s * 0.7],
        ),
      )
      topo += altura + 2
    }
    return pecas
  }).join(''),
)

// --- Coluna ----------------------------------------------------------------

const CERVICAIS = pilhaDeVertebras(148, 208, 7, 28, 34)
const TORACICAS = pilhaDeVertebras(210, 336, 12, 46, 54)
const LOMBARES = pilhaDeVertebras(338, 432, 5, 48, 54)

const SACRO = poligono([
  [dx(31), 434],
  [dx(-31), 434],
  [dx(-24), 462],
  [dx(-13), 484],
  [dx(-9), 500],
  [dx(9), 500],
  [dx(13), 484],
  [dx(24), 462],
])

const COCCIX = poligono([
  [dx(8), 506],
  [dx(-8), 506],
  [dx(-6), 518],
  [dx(-2), 530],
  [dx(2), 530],
  [dx(6), 518],
])

// --- Pelve -----------------------------------------------------------------
//
// O acetábulo — o encaixe da cabeça do fêmur — fica em (dx(48), 478), e é o
// ponto em que as três peças se encontram: ílio por cima, ísquio por baixo e
// atrás, púbis à frente. Os três polígonos foram fechados em volta dele, e é por
// isso que a cabeça do fêmur, desenhada depois, cai exatamente na junção.
//
// A asa do ílio é um leque e não um disco: a borda de cima é a crista ilíaca,
// que sobe de trás (junto do sacro) até o alto e desce à frente para a espinha
// ilíaca ântero-superior — aquele osso que se apalpa na cintura. Desenhá-la
// redonda, como saiu da primeira tentativa, dava duas bolhas grudadas na coluna
// e nenhuma pelve.

const ILIO = doisLados(
  poligono([
    [dx(28), 400],
    [dx(46), 384],
    [dx(66), 382],
    [dx(80), 392],
    [dx(84), 412],
    [dx(74), 430],
    [dx(62), 452],
    [dx(52), 466],
    [dx(38), 462],
    [dx(26), 440],
  ]),
)

const ISQUIO = doisLados(
  poligono([
    [dx(56), 480],
    [dx(60), 500],
    [dx(54), 520],
    [dx(40), 528],
    [dx(28), 514],
    [dx(36), 496],
    [dx(46), 482],
  ]),
)

/** Os dois púbis não se encostam: entre eles fica a sínfise, que é cartilagem. */
const PUBIS = doisLados(
  poligono([
    [dx(44), 476],
    [dx(24), 484],
    [dx(4), 488],
    [dx(4), 504],
    [dx(22), 502],
    [dx(34), 494],
  ]),
)

// --- Membros inferiores ----------------------------------------------------

const FEMUR = doisLados(
  oval(dx(48), 478, 13, 12) + ossoLongo([dx(47), 482], [dx(32), 714], [26, 15, 36], 4),
)

const PATELA = doisLados(oval(dx(32), 720, 11, 13))

const TIBIA = doisLados(ossoLongo([dx(30), 726], [dx(26), 936], [34, 13, 24], -2))

/** A fíbula é a lateral, mais fina, e não chega ao joelho: começa abaixo dele. */
const FIBULA = doisLados(ossoLongo([dx(48), 740], [dx(44), 942], [11, 6, 12], 2))

/** Sete ossos do tarso; o graúdo de trás é o calcâneo. */
const TARSO = doisLados(
  [
    oval(dx(34), 942, 17, 12),
    oval(dx(45), 958, 7, 6),
    oval(dx(33), 959, 7, 6),
    oval(dx(23), 958, 7, 6),
  ].join(''),
)

/** Do hálux para fora: distância da base do metatarso e distância da ponta. */
const DEDOS_DO_PE: readonly (readonly [number, number])[] = [
  [22, 14],
  [27, 23],
  [33, 33],
  [40, 44],
  [48, 56],
]

const METATARSO = doisLados(
  DEDOS_DO_PE.map(([base, ponta]) =>
    ossoLongo([dx(base), 966], [dx(ponta), 980], [5.5, 4, 5.5]),
  ).join(''),
)

const FALANGES_PE = doisLados(
  DEDOS_DO_PE.flatMap(([, ponta], dedo) =>
    dedo === 0
      ? [oval(dx(ponta - 2), 984, 5, 4), oval(dx(ponta - 4), 991, 4.5, 3.5)]
      : [oval(dx(ponta + 1), 984, 4, 3.4), oval(dx(ponta + 2), 990, 3.4, 3)],
  ).join(''),
)

// ---------------------------------------------------------------------------
// A lista
// ---------------------------------------------------------------------------

/**
 * Os 32 ossos nomeáveis.
 *
 * A ordem importa duas vezes: é a ordem de pintura no SVG (quem vem depois cobre
 * quem veio antes) e é a ordem do gabarito por região. Daí o esterno vir **depois**
 * das costelas e das vértebras torácicas — de frente, é ele que fica por cima
 * das duas coisas, e é exatamente por isso que a coluna torácica quase não
 * aparece num esqueleto visto de frente. E a patela vem depois do fêmur, que é
 * onde ela está: sobre o joelho, dentro do tendão do quadríceps.
 */
export const OSSOS: readonly Osso[] = [
  // --- Crânio ---
  {
    id: 'frontal',
    nome: 'Frontal',
    sinonimos: ['Osso frontal'],
    regiao: 'Crânio',
    simetria: 'perfil',
    quantidade: 1,
    detalhe: 'A testa e o teto das órbitas. Nasce em duas metades, que se fundem na infância.',
    forma: { d: CRANIO_FRONTAL },
  },
  {
    id: 'parietal',
    nome: 'Parietal',
    sinonimos: ['Osso parietal', 'Parietais'],
    regiao: 'Crânio',
    simetria: 'perfil',
    quantidade: 2,
    detalhe: 'O par que forma a maior parte da abóbada craniana — o teto da cabeça.',
    forma: { d: CRANIO_PARIETAL },
  },
  {
    id: 'temporal',
    nome: 'Temporal',
    sinonimos: ['Osso temporal', 'Temporais'],
    regiao: 'Crânio',
    simetria: 'perfil',
    quantidade: 2,
    detalhe: 'Guarda o ouvido médio e o interno. A saliência atrás da orelha é o processo mastoide.',
    forma: { d: CRANIO_TEMPORAL },
  },
  {
    id: 'occipital',
    nome: 'Occipital',
    sinonimos: ['Osso occipital'],
    regiao: 'Crânio',
    simetria: 'perfil',
    quantidade: 1,
    detalhe: 'Fecha o crânio por trás. É dele o forame magno, por onde a medula sai.',
    forma: { d: CRANIO_OCCIPITAL },
  },
  {
    id: 'zigomatico',
    nome: 'Zigomático',
    sinonimos: ['Osso zigomático', 'Malar', 'Maçã do rosto'],
    regiao: 'Crânio',
    simetria: 'perfil',
    quantidade: 2,
    detalhe: 'A maçã do rosto. Com o temporal, forma o arco zigomático.',
    forma: { d: CRANIO_ZIGOMATICO },
  },
  {
    id: 'maxila',
    nome: 'Maxila',
    sinonimos: ['Maxilar superior', 'Maxilas'],
    regiao: 'Crânio',
    simetria: 'perfil',
    quantidade: 2,
    detalhe: 'Sustenta os dentes de cima e forma quase todo o palato duro.',
    forma: { d: CRANIO_MAXILA },
  },
  {
    id: 'mandibula',
    nome: 'Mandíbula',
    sinonimos: ['Maxilar inferior', 'Queixo'],
    regiao: 'Crânio',
    simetria: 'perfil',
    quantidade: 1,
    detalhe: 'O único osso móvel do crânio, e o mais forte da cabeça.',
    forma: { d: CRANIO_MANDIBULA },
  },

  // --- Coluna vertebral ---
  {
    id: 'vertebras-cervicais',
    nome: 'Vértebras cervicais',
    sinonimos: ['Cervicais', 'Coluna cervical', 'Vértebras do pescoço'],
    regiao: 'Coluna vertebral',
    simetria: 'mediana',
    quantidade: 7,
    detalhe: 'Sete, do atlas ao C7 — e são sete em quase todo mamífero, girafa inclusive.',
    forma: { d: CERVICAIS },
  },
  {
    id: 'vertebras-toracicas',
    nome: 'Vértebras torácicas',
    sinonimos: ['Torácicas', 'Vértebras dorsais', 'Dorsais', 'Coluna torácica'],
    regiao: 'Coluna vertebral',
    simetria: 'mediana',
    quantidade: 12,
    detalhe: 'Doze, uma para cada par de costelas. De frente, o esterno esconde quase todas.',
    forma: { d: TORACICAS },
  },
  {
    id: 'vertebras-lombares',
    nome: 'Vértebras lombares',
    sinonimos: ['Lombares', 'Coluna lombar'],
    regiao: 'Coluna vertebral',
    simetria: 'mediana',
    quantidade: 5,
    detalhe: 'Cinco, as maiores da coluna: são elas que carregam o peso do tronco.',
    forma: { d: LOMBARES },
  },
  {
    id: 'sacro',
    nome: 'Sacro',
    sinonimos: ['Osso sacro'],
    regiao: 'Coluna vertebral',
    simetria: 'mediana',
    quantidade: 1,
    detalhe: 'Cinco vértebras fundidas num osso só. Fecha a pelve por trás.',
    forma: { d: SACRO },
  },
  {
    id: 'coccix',
    nome: 'Cóccix',
    sinonimos: ['Coccix', 'Osso cóccix'],
    regiao: 'Coluna vertebral',
    simetria: 'mediana',
    quantidade: 1,
    detalhe: 'Três a cinco vértebras fundidas: o que sobrou da cauda.',
    forma: { d: COCCIX },
  },

  // --- Tórax ---
  {
    id: 'costelas',
    nome: 'Costelas',
    sinonimos: ['Costela', 'Arcos costais', 'Caixa torácica'],
    regiao: 'Tórax',
    simetria: 'par',
    quantidade: 24,
    detalhe: 'Doze pares: sete verdadeiras, três falsas e duas flutuantes, que não chegam à frente.',
    forma: { d: COSTELAS },
  },
  {
    id: 'esterno',
    nome: 'Esterno',
    sinonimos: ['Osso esterno'],
    regiao: 'Tórax',
    simetria: 'mediana',
    quantidade: 1,
    detalhe: 'Manúbrio, corpo e processo xifoide. É nele que se punciona medula óssea.',
    forma: { d: ESTERNO },
  },

  // --- Membros superiores ---
  {
    id: 'clavicula',
    nome: 'Clavícula',
    sinonimos: ['Clavículas'],
    regiao: 'Membros superiores',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'O único elo ósseo entre o braço e o tronco — e o osso que mais quebra em queda.',
    forma: { d: CLAVICULA },
  },
  {
    id: 'escapula',
    nome: 'Escápula',
    sinonimos: ['Omoplata', 'Escápulas'],
    regiao: 'Membros superiores',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'Não se prende ao esqueleto do tronco por articulação nenhuma: só por músculo.',
    forma: { d: ESCAPULA },
  },
  {
    id: 'umero',
    nome: 'Úmero',
    sinonimos: ['Osso do braço'],
    regiao: 'Membros superiores',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'O osso do braço. O nervo radial passa colado nele — por isso a fratura dá mão caída.',
    forma: { d: UMERO },
  },
  {
    id: 'radio',
    nome: 'Rádio',
    sinonimos: ['Radio'],
    regiao: 'Membros superiores',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'O do lado do polegar. É ele que gira por cima da ulna quando a mão vira.',
    forma: { d: RADIO },
  },
  {
    id: 'ulna',
    nome: 'Ulna',
    sinonimos: ['Cúbito'],
    regiao: 'Membros superiores',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'O do lado do dedo mínimo. O olécrano, a ponta do cotovelo, é dela.',
    forma: { d: ULNA },
  },
  {
    id: 'carpo',
    nome: 'Carpo',
    sinonimos: ['Carpos', 'Ossos do carpo'],
    regiao: 'Membros superiores',
    simetria: 'par',
    quantidade: 16,
    detalhe: 'Oito ossinhos por punho, em duas fileiras. O escafoide é o que mais fratura.',
    forma: { d: CARPO },
  },
  {
    id: 'metacarpo',
    nome: 'Metacarpo',
    sinonimos: ['Metacarpos', 'Metacarpianos'],
    regiao: 'Membros superiores',
    simetria: 'par',
    quantidade: 10,
    detalhe: 'Cinco por mão, um para cada dedo. O do polegar é o mais curto e o mais móvel.',
    forma: { d: METACARPO },
  },
  {
    id: 'falanges-mao',
    nome: 'Falanges da mão',
    sinonimos: ['Falanges', 'Falanges dos dedos', 'Ossos dos dedos'],
    regiao: 'Membros superiores',
    simetria: 'par',
    quantidade: 28,
    detalhe: 'Catorze por mão: três em cada dedo e duas no polegar.',
    forma: { d: FALANGES_MAO },
  },

  // --- Pelve ---
  {
    id: 'ilio',
    nome: 'Ílio',
    sinonimos: ['Ilio', 'Osso ilíaco'],
    regiao: 'Pelve',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'A asa larga que se apalpa na cintura. A crista ilíaca é a borda de cima.',
    forma: { d: ILIO },
  },
  {
    id: 'isquio',
    nome: 'Ísquio',
    sinonimos: ['Isquio'],
    regiao: 'Pelve',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'O osso em que a gente senta: a tuberosidade isquiática apoia o corpo na cadeira.',
    forma: { d: ISQUIO },
  },
  {
    id: 'pubis',
    nome: 'Púbis',
    sinonimos: ['Pubis', 'Osso púbico'],
    regiao: 'Pelve',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'Os dois se encontram na frente, na sínfise púbica, presos por cartilagem.',
    forma: { d: PUBIS },
  },

  // --- Membros inferiores ---
  {
    id: 'femur',
    nome: 'Fêmur',
    sinonimos: ['Femur', 'Osso da coxa'],
    regiao: 'Membros inferiores',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'O osso mais longo e mais forte do corpo: cerca de um quarto da altura da pessoa.',
    forma: { d: FEMUR },
  },
  {
    id: 'patela',
    nome: 'Patela',
    sinonimos: ['Rótula'],
    regiao: 'Membros inferiores',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'O maior osso sesamoide: cresce dentro do tendão do quadríceps, sobre o joelho.',
    forma: { d: PATELA },
  },
  {
    id: 'tibia',
    nome: 'Tíbia',
    sinonimos: ['Tibia', 'Canela'],
    regiao: 'Membros inferiores',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'A canela. É ela que sustenta o peso da perna; a fíbula quase não sustenta nada.',
    forma: { d: TIBIA },
  },
  {
    id: 'fibula',
    nome: 'Fíbula',
    sinonimos: ['Fibula', 'Perônio', 'Peronio'],
    regiao: 'Membros inferiores',
    simetria: 'par',
    quantidade: 2,
    detalhe: 'Não entra na articulação do joelho. O maléolo lateral do tornozelo é a ponta dela.',
    forma: { d: FIBULA },
  },
  {
    id: 'tarso',
    nome: 'Tarso',
    sinonimos: ['Tarsos', 'Ossos do tarso'],
    regiao: 'Membros inferiores',
    simetria: 'par',
    quantidade: 14,
    detalhe: 'Sete por pé. O calcâneo, o do calcanhar, é o maior deles.',
    forma: { d: TARSO },
  },
  {
    id: 'metatarso',
    nome: 'Metatarso',
    sinonimos: ['Metatarsos', 'Metatarsianos'],
    regiao: 'Membros inferiores',
    simetria: 'par',
    quantidade: 10,
    detalhe: 'Cinco por pé. O quinto é o que mais fratura quando o pé torce.',
    forma: { d: METATARSO },
  },
  {
    id: 'falanges-pe',
    nome: 'Falanges do pé',
    sinonimos: ['Falanges dos dedos do pé', 'Ossos dos dedos do pé'],
    regiao: 'Membros inferiores',
    simetria: 'par',
    quantidade: 28,
    detalhe: 'Catorze por pé, como na mão: três em cada dedo e duas no hálux.',
    forma: { d: FALANGES_PE },
  },
]

// ---------------------------------------------------------------------------
// O corpo ao fundo
// ---------------------------------------------------------------------------

/**
 * Fecha um contorno simétrico a partir da metade esquerda.
 *
 * A metade vai do alto ao entrepernas; a outra é ela espelhada e percorrida ao
 * contrário, senão o polígono se cruzaria em oito. É o mesmo truque de
 * `doisLados`, mas para um caminho **aberto** que precisa fechar no eixo.
 */
function contornoSimetrico(metade: readonly Ponto[]): string {
  const espelhada = [...metade].reverse().map(([x, y]): Ponto => [2 * EIXO - x, y])
  return poligono([...metade, ...espelhada])
}

/**
 * A silhueta do corpo, em cinza e sem valer ponto.
 *
 * Existe pelo mesmo motivo que a Groenlândia inerte no mapa-múndi: sem ela o
 * tabuleiro vazio é um punhado de manchas soltas, e o jogador não sabe se está
 * olhando um corpo ou um borrão. Com ela, o desenho é reconhecível antes da
 * primeira resposta — e nenhuma peça dela é respondível, então não há como
 * ganhar ponto pela pele.
 *
 * São duas peças e não uma porque a cabeça está de perfil e o corpo de frente:
 * um contorno só teria de ser assimétrico inteiro, e aí a metade simétrica do
 * tronco — que é o que garante que braço esquerdo e direito sejam iguais —
 * viraria trabalho manual.
 */
const SILHUETA_CABECA = poligono([
  [px(2), 5],
  [px(26), 10],
  [px(46), 24],
  [px(60), 44],
  [px(68), 68],
  [px(66), 90],
  [px(58), 108],
  [px(48), 124],
  [px(36), 136],
  [px(28), 152],
  [px(26), 176],
  [px(24), 202],
  [px(-22), 202],
  [px(-20), 176],
  [px(-18), 152],
  [px(-42), 150],
  [px(-60), 144],
  [px(-70), 132],
  [px(-74), 116],
  [px(-68), 108],
  [px(-82), 96],
  [px(-70), 86],
  [px(-66), 72],
  [px(-62), 56],
  [px(-54), 34],
  [px(-34), 14],
])

const SILHUETA_CORPO = contornoSimetrico([
  [EIXO, 182],
  [dx(36), 186],
  [dx(70), 193],
  [dx(102), 203],
  [dx(126), 220],
  [dx(138), 252],
  [dx(138), 300],
  [dx(136), 350],
  [dx(134), 396],
  [dx(138), 450],
  [dx(137), 510],
  [dx(142), 542],
  [dx(152), 574],
  [dx(153), 612],
  [dx(140), 648],
  [dx(112), 658],
  [dx(84), 648],
  [dx(74), 618],
  [dx(80), 578],
  [dx(90), 540],
  [dx(90), 500],
  [dx(88), 450],
  [dx(86), 400],
  [dx(86), 340],
  [dx(88), 280],
  [dx(84), 252],
  [dx(80), 282],
  [dx(74), 330],
  [dx(68), 372],
  [dx(76), 412],
  [dx(88), 448],
  [dx(94), 478],
  [dx(94), 508],
  [dx(88), 552],
  [dx(78), 620],
  [dx(66), 686],
  [dx(58), 728],
  [dx(60), 782],
  [dx(56), 840],
  [dx(52), 906],
  [dx(56), 942],
  [dx(60), 970],
  [dx(66), 990],
  [dx(58), 996],
  [dx(6), 996],
  [dx(8), 968],
  [dx(16), 940],
  [dx(20), 880],
  [dx(22), 800],
  [dx(12), 724],
  [dx(14), 644],
  [dx(12), 570],
  [dx(6), 528],
  [dx(0), 522],
])

/** Desenhado e inerte, no formato que o layout de mapa da mecânica B espera. */
export const SILHUETA: readonly { readonly id: string; readonly d: string }[] = [
  { id: 'silhueta-corpo', d: SILHUETA_CORPO },
  { id: 'silhueta-cabeca', d: SILHUETA_CABECA },
]

/**
 * Ossos do corpo humano adulto, contagem de manual.
 *
 * Fica aqui porque `esqueleto.test.ts` fecha a conta com ele: os 32 nomes do
 * jogo cobrem 188 dos 206, e os 18 que faltam são nomeáveis um a um (onze ossos
 * do crânio que a escola não cobra, os seis ossículos do ouvido e o hioide).
 * Sem essa conta, "faltou algum osso?" seria opinião.
 */
export const OSSOS_DO_CORPO = 206
