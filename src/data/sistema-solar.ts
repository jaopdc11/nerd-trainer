/**
 * Os corpos que orbitam o Sol por conta própria: oito planetas e os cinco
 * planetas anões reconhecidos pela IAU.
 *
 * Fonte dos números: NASA Planetary Fact Sheet (NSSDC, revisão de 2024) para os
 * oito planetas; NASA Science / JPL Small-Body Database para Ceres, Plutão,
 * Haumea, Makemake e Éris. Os valores são os **médios** — semieixo maior, raio
 * médio, período sideral — e não os instantâneos: nenhuma pergunta do jogo
 * depende de onde o corpo está hoje, e usar distância atual obrigaria a
 * atualizar o dataset para sempre.
 *
 * Por que o dataset inclui os anões, se o jogo se chama "sistema solar":
 * porque **oito planetas em ordem não sustentam um jogo**. Oito itens é um
 * baralho que acaba antes de a pessoa sentar, e a ordem dos oito é justamente a
 * única coisa que todo mundo já sabe. Com treze corpos, quatro grandezas e as
 * perguntas derivadas de comparação, o mesmo acervo vira um baralho de 39
 * cartas em que a ordem é só a entrada. Ver `games/sistema-solar.ts`.
 *
 * A alternativa descartada foi guardar número de luas, que é o dado mais
 * chamativo que existe aqui. Não entra: a contagem de satélites de Júpiter e
 * Saturno muda **todo ano** — Saturno passou de 82 para 146 e depois para mais
 * de 270 entre 2019 e 2025 —, então qualquer número gravado aqui vira
 * desinformação com data marcada. Um jogo de memorização que ensina um número
 * que já era é pior que um jogo que não pergunta aquilo.
 */

export type TipoCorpo = 'planeta' | 'anao'

export interface Corpo {
  readonly id: string
  readonly nome: string
  readonly tipo: TipoCorpo
  /**
   * Posição a partir do Sol, 1 a 8. Só planeta tem: um anão não ocupa "posição"
   * nenhuma na fila que se decora, e inventar um número para Ceres seria criar
   * um fato que não existe fora deste arquivo.
   */
  readonly ordem?: number
  /** Semieixo maior da órbita, em unidades astronômicas. */
  readonly semieixoUA: number
  /** Raio médio, em km. */
  readonly raioKm: number
  /** Período orbital sideral, em anos julianos. */
  readonly periodoAnos: number
  /**
   * Gravidade na superfície, em m/s². **Só planeta.**
   *
   * Nos anões o valor é mal determinado (depende de massa e forma, e Haumea é
   * um elipsoide girando em quatro horas) e, pior para o jogo, seria um
   * distrator inútil: 0,3 m/s² numa carta entre planetas se elimina sozinho sem
   * que ninguém precise saber nada.
   */
  readonly gravidade?: number
  /** Fato curto que vai no gabarito — o que faz este corpo valer uma carta. */
  readonly nota: string
}

export const CORPOS: readonly Corpo[] = [
  // --- os oito planetas -----------------------------------------------------
  {
    id: 'mercurio', nome: 'Mercúrio', tipo: 'planeta', ordem: 1,
    semieixoUA: 0.387, raioKm: 2439.7, periodoAnos: 0.2408, gravidade: 3.7,
    nota: 'o menor planeta, e o de ano mais curto: 88 dias',
  },
  {
    id: 'venus', nome: 'Vênus', tipo: 'planeta', ordem: 2,
    semieixoUA: 0.723, raioKm: 6051.8, periodoAnos: 0.6152, gravidade: 8.87,
    nota: 'quase do tamanho da Terra, e com a mesma gravidade de Urano',
  },
  {
    id: 'terra', nome: 'Terra', tipo: 'planeta', ordem: 3,
    semieixoUA: 1.0, raioKm: 6371.0, periodoAnos: 1.0, gravidade: 9.81,
    nota: 'o maior dos rochosos, e a régua de todo o resto: 1 UA, 1 ano',
  },
  {
    id: 'marte', nome: 'Marte', tipo: 'planeta', ordem: 4,
    semieixoUA: 1.524, raioKm: 3389.5, periodoAnos: 1.8808, gravidade: 3.71,
    nota: 'metade do raio da Terra, e a mesma gravidade de Mercúrio',
  },
  {
    id: 'jupiter', nome: 'Júpiter', tipo: 'planeta', ordem: 5,
    semieixoUA: 5.204, raioKm: 69911, periodoAnos: 11.862, gravidade: 24.79,
    nota: 'mais massa que todos os outros planetas somados',
  },
  {
    id: 'saturno', nome: 'Saturno', tipo: 'planeta', ordem: 6,
    semieixoUA: 9.583, raioKm: 58232, periodoAnos: 29.457, gravidade: 10.44,
    nota: 'o segundo maior, e o único menos denso que a água',
  },
  {
    id: 'urano', nome: 'Urano', tipo: 'planeta', ordem: 7,
    semieixoUA: 19.191, raioKm: 25362, periodoAnos: 84.011, gravidade: 8.87,
    nota: 'gira deitado, com o eixo a 98° do plano da órbita',
  },
  {
    id: 'netuno', nome: 'Netuno', tipo: 'planeta', ordem: 8,
    semieixoUA: 30.07, raioKm: 24622, periodoAnos: 164.79, gravidade: 11.15,
    nota: 'menor que Urano em raio, e mais maciço mesmo assim',
  },

  // --- os cinco anões reconhecidos pela IAU ---------------------------------
  // Ceres está no cinturão principal; os outros quatro são transnetunianos. A
  // lista é a oficial da IAU e não a "provável": Quaoar, Sedna, Gonggong e
  // Orcus são candidatos fortes e não foram classificados, e o jogo não pode
  // cobrar como fato uma coisa que a IAU ainda não decidiu.
  {
    id: 'ceres', nome: 'Ceres', tipo: 'anao',
    semieixoUA: 2.766, raioKm: 469.7, periodoAnos: 4.6,
    nota: 'o maior corpo do cinturão de asteroides, e o único anão de lá',
  },
  {
    id: 'plutao', nome: 'Plutão', tipo: 'anao',
    semieixoUA: 39.482, raioKm: 1188.3, periodoAnos: 247.94,
    nota: 'planeta até 2006; é o maior anão em raio, mas não em massa',
  },
  {
    id: 'haumea', nome: 'Haumea', tipo: 'anao',
    // Raio médio de um elipsoide de 2100×1680×1074 km: o corpo gira em menos de
    // quatro horas e ficou achatado feito uma bola de rúgbi. Qualquer "raio" de
    // Haumea é uma convenção, e é por isso que o jogo só usa a **ordem** de
    // tamanho dele — que é firme: menor que Plutão e Éris, maior que Makemake.
    semieixoUA: 43.13, raioKm: 780, periodoAnos: 284.1,
    nota: 'gira em menos de 4 horas e por isso é achatada feito uma bola de rúgbi',
  },
  {
    id: 'makemake', nome: 'Makemake', tipo: 'anao',
    semieixoUA: 45.43, raioKm: 715, periodoAnos: 306.2,
    nota: 'o menor dos quatro anões transnetunianos',
  },
  {
    id: 'eris', nome: 'Éris', tipo: 'anao',
    semieixoUA: 67.78, raioKm: 1163, periodoAnos: 558,
    nota: 'mais maciça que Plutão — foi a descoberta dela que rebaixou Plutão',
  },
]

export const PLANETAS: readonly Corpo[] = CORPOS.filter((c) => c.tipo === 'planeta')

/**
 * Ordenações pré-calculadas.
 *
 * Ficam no dataset, e não no jogo, porque são **afirmações sobre o mundo** e o
 * teste deste arquivo confere as duas contra a ordem conhecida. Se alguém
 * trocar um raio por engano, o teste do dataset acusa aqui, e não daqui a três
 * arquivos, na montagem de uma carta.
 */
export const POR_DISTANCIA: readonly Corpo[] = [...CORPOS].sort(
  (a, b) => a.semieixoUA - b.semieixoUA,
)
export const POR_RAIO: readonly Corpo[] = [...CORPOS].sort((a, b) => b.raioKm - a.raioKm)
export const POR_PERIODO: readonly Corpo[] = [...CORPOS].sort(
  (a, b) => a.periodoAnos - b.periodoAnos,
)
export const POR_GRAVIDADE: readonly Corpo[] = [...PLANETAS].sort(
  (a, b) => (a.gravidade ?? 0) - (b.gravidade ?? 0),
)

const ORDINAL = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º'] as const

/** "4º" a partir do número da posição. Lança fora de 1..8: não existe 9º planeta. */
export function ordinal(posicao: number): string {
  const s = ORDINAL[posicao - 1]
  if (s === undefined) throw new Error(`ordinal: posição ${posicao} não existe`)
  return s
}

/**
 * Período no formato em que a pessoa de fato guarda o número.
 *
 * Abaixo de um ano vai em dias, porque "0,24 ano" não é como ninguém sabe o ano
 * de Mercúrio — sabe-se que são 88 dias. A mistura de unidades numa mesma carta
 * não entrega resposta: quando a certa é "88 dias", as vizinhas no ranking são
 * "225 dias" e "1,0 ano", que estão igualmente perto.
 */
export function exibirPeriodo(anos: number): string {
  // "1,0 anos" para a Terra seria só feio: a unidade do dataset É o ano
  // terrestre, e ele se escreve assim.
  if (anos === 1) return '1 ano'
  if (anos < 1) {
    const dias = Math.round(anos * 365.25)
    return `${dias} dias`
  }
  if (anos < 100) return `${umaCasa(anos)} anos`
  return `${Math.round(anos)} anos`
}

/** "3,7 m/s²". Uma casa decimal e não duas de propósito — ver o jogo. */
export function exibirGravidade(g: number): string {
  return `${umaCasa(g)} m/s²`
}

/** "69.911 km", com o ponto de milhar do português. */
export function exibirRaio(km: number): string {
  return `${Math.round(km).toLocaleString('pt-BR')} km`
}

/** "5,204 UA". Três casas porque 0,387 e 0,723 precisam delas. */
export function exibirDistancia(ua: number): string {
  return `${ua.toFixed(3).replace('.', ',')} UA`
}

function umaCasa(v: number): string {
  return v.toFixed(1).replace('.', ',')
}
