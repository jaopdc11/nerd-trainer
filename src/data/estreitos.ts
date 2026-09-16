/**
 * Estreitos, canais e passagens: os gargalos do mapa-múndi.
 *
 * ## Por que este arquivo existe no lugar de um de oceanos
 *
 * O pedido era um jogo de oceanos e mares sobre o mapa-múndi, e ele não dá para
 * ser feito com honestidade cartográfica a partir do que o projeto tem.
 *
 * Um oceano é uma **área**, e desenhar área exige contorno. O contorno de um
 * oceano é feito de duas coisas: a linha de costa de todos os continentes que o
 * cercam — que `paises-mapa.ts` tem, mas do lado de dentro, como polígono de
 * terra — e os **limites convencionais** entre um oceano e o vizinho, que não
 * são acidente geográfico nenhum: são linhas de acordo (o meridiano do Cabo
 * Agulhas separando Atlântico de Índico, o paralelo 60°S recortando o Austral).
 * Um retângulo escrito à mão em coordenadas da projeção não é nada disso: ou
 * invade a África e o Brasil, ou é um borrão no meio da água que o jogador lê
 * como "o oceano é assim" — e aí o mapa passou a ensinar geografia errada. Não
 * há meio-termo: ou se gera o contorno a partir de uma fonte (as camadas de
 * oceano do Natural Earth, num `gen-oceanos.mjs`), ou não se desenha oceano.
 *
 * ## Por que estreito é diferente
 *
 * Na escala de um mapa-múndi de 1000 px, **um estreito é um ponto**. Gibraltar
 * tem 14 km de largura, que nesta projeção dão 0,35 px; o Bósforo tem 700 m.
 * Representá-los por um marcador não é simplificação nem aproximação: é a forma
 * certa do objeto nesta escala, e não faz afirmação nenhuma sobre extensão —
 * que era exatamente o problema do oceano. A coordenada de cada um é um fato
 * publicado, e a conversão dela para a tela é a mesma projeção do mapa, feita
 * pela mesma conta.
 *
 * Fica dito o que o mapa **não** consegue mostrar: seis das trinta passagens
 * são mais estreitas que a resolução do próprio Natural Earth 110m, a costa se
 * fecha por cima delas e o marcador acaba sobre terra cinza — Suez, Panamá,
 * Kiel, Corinto, Öresund e Dardanelos. `estreitos.test.ts` mede e congela
 * exatamente essa lista: é limitação de resolução, conferida e nomeada, não
 * coordenada errada. O `comoJogar` do jogo repete isso para o jogador.
 */

/**
 * Projeção Natural Earth I, os mesmos parâmetros de `paises-mapa.ts`.
 *
 * Os contornos do mapa-múndi saem de `scripts/gen-paises.mjs`, que faz
 * `geoNaturalEarth1().fitSize([1000, 500], mundo)`. `fitSize` resolve para uma
 * escala e uma translação, e são estas — copiadas com todos os dígitos que o
 * d3 devolve, não arredondadas "porque não se vê a diferença".
 *
 * Reimplementar a projeção aqui, em vez de guardar `x` e `y` prontos no
 * dataset, é o que torna o dado conferível: uma coordenada de estreito é
 * verificável em qualquer atlas, um par de pixels não é verificável em lugar
 * nenhum. O preço são as quinze linhas abaixo, e `estreitos.test.ts` confere
 * que elas reproduzem, ponto a ponto, os micro-estados que o gerador já
 * produziu com o d3 de verdade.
 */
const ESCALA = 178.49946527778042
const DESLOCAMENTO_X = 500
const DESLOCAMENTO_Y = 246.10405513239746
const RADIANO = Math.PI / 180

/**
 * O polinômio de Natural Earth I, de Tom Patterson. Não tem forma fechada
 * inversa nem interpretação geométrica: é um ajuste numérico, e os coeficientes
 * são o que são — copiados de `d3-geo`, que é a mesma fonte que gerou o mapa.
 */
function bruta(lon: number, lat: number): readonly [number, number] {
  const l = lon * RADIANO
  const f = lat * RADIANO
  const f2 = f * f
  const f4 = f2 * f2
  return [
    l * (0.8707 - 0.131979 * f2 + f4 * (-0.013791 + f4 * (0.003971 * f2 - 0.001529 * f4))),
    f * (1.007226 + f2 * (0.015085 + f4 * (-0.044475 + 0.028874 * f2 - 0.005916 * f4))),
  ]
}

/** Longitude/latitude em graus → pixel na caixa 1000×500 do mapa-múndi. */
export function projetar(lon: number, lat: number): { readonly x: number; readonly y: number } {
  const [bx, by] = bruta(lon, lat)
  // O y é invertido porque a latitude cresce para o norte e o pixel cresce para
  // baixo. É o que o `scaleTranslate` do d3 faz, e omiti-lo põe o hemisfério
  // sul no lugar do norte.
  return { x: ESCALA * bx + DESLOCAMENTO_X, y: DESLOCAMENTO_Y - ESCALA * by }
}

/**
 * Acidente geográfico, ou obra de engenharia.
 *
 * A distinção é por origem e **não pela palavra no nome**, que engana: o Canal
 * de Moçambique e o Canal de Yucatán são acidentes naturais que por acaso se
 * chamam canal, e a Passagem de Drake é um estreito de 800 km. Escavados são
 * quatro, todos com data de inauguração: Suez, Panamá, Kiel e Corinto.
 */
export type TipoDePassagem = 'natural' | 'escavado'

export type Bacia =
  | 'Europa e Mediterrâneo'
  | 'África e Oriente Médio'
  | 'Ásia'
  | 'Oceania'
  | 'Américas e Ártico'

export interface Passagem {
  /** kebab-case, estável: é a chave da célula no mapa. */
  readonly id: string
  readonly nome: string
  /** Formas curtas e nomes alternativos. "Gibraltar" tem de valer. */
  readonly sinonimos: readonly string[]
  readonly tipo: TipoDePassagem
  /** Graus decimais, leste e norte positivos. */
  readonly lon: number
  readonly lat: number
  /** As duas águas que ele une. */
  readonly liga: string
  /** As duas terras que ele separa. */
  readonly separa: string
  readonly bacia: Bacia
}

/**
 * Trinta passagens, escolhidas por importância e não por obscuridade.
 *
 * O corte: entra o que aparece em notícia, em rota comercial ou em fronteira
 * disputada — Ormuz, Malaca, Bósforo, Taiwan, Kerch —, mais os que são
 * acidente geográfico de primeira grandeza (Bering, Drake, Magalhães). Ficou de
 * fora a cauda de estreitos regionais (Lombok, Otranto, La Pérouse, Beagle):
 * num tabuleiro de ordem livre, a cauda longa não aumenta a dificuldade, só
 * diminui o percentual de quem sabe geografia de verdade.
 *
 * As coordenadas apontam o **ponto mais estreito** de cada passagem, que é onde
 * um atlas a marca. Nos canais escavados, o meio da obra.
 */
export const PASSAGENS: readonly Passagem[] = [
  // --- Europa e Mediterrâneo ---
  {
    id: 'gibraltar',
    nome: 'Estreito de Gibraltar',
    sinonimos: ['Gibraltar'],
    tipo: 'natural',
    lon: -5.6,
    lat: 35.95,
    liga: 'Atlântico ↔ Mediterrâneo',
    separa: 'Espanha ↔ Marrocos',
    bacia: 'Europa e Mediterrâneo',
  },
  {
    id: 'mancha',
    nome: 'Canal da Mancha',
    sinonimos: ['Mancha', 'La Manche', 'Estreito de Dover', 'Pas de Calais'],
    tipo: 'natural',
    lon: -0.6,
    lat: 50.2,
    liga: 'Atlântico ↔ Mar do Norte',
    separa: 'Inglaterra ↔ França',
    bacia: 'Europa e Mediterrâneo',
  },
  {
    id: 'oresund',
    nome: 'Estreito de Öresund',
    sinonimos: ['Öresund', 'Oresund', 'Sund'],
    tipo: 'natural',
    lon: 12.85,
    lat: 55.75,
    liga: 'Kattegat ↔ Mar Báltico',
    separa: 'Dinamarca ↔ Suécia',
    bacia: 'Europa e Mediterrâneo',
  },
  {
    id: 'kiel',
    nome: 'Canal de Kiel',
    sinonimos: ['Kiel'],
    tipo: 'escavado',
    lon: 9.65,
    lat: 54.3,
    liga: 'Mar do Norte ↔ Mar Báltico',
    separa: 'corta a península da Jutlândia, na Alemanha',
    bacia: 'Europa e Mediterrâneo',
  },
  {
    id: 'messina',
    nome: 'Estreito de Messina',
    sinonimos: ['Messina'],
    tipo: 'natural',
    lon: 15.63,
    lat: 38.25,
    liga: 'Mar Tirreno ↔ Mar Jônico',
    separa: 'Itália ↔ Sicília',
    bacia: 'Europa e Mediterrâneo',
  },
  {
    id: 'corinto',
    nome: 'Canal de Corinto',
    sinonimos: ['Corinto'],
    tipo: 'escavado',
    lon: 22.98,
    lat: 37.93,
    liga: 'Golfo de Corinto ↔ Mar Egeu',
    separa: 'Peloponeso ↔ Grécia continental',
    bacia: 'Europa e Mediterrâneo',
  },
  {
    id: 'dardanelos',
    nome: 'Estreito de Dardanelos',
    sinonimos: ['Dardanelos', 'Helesponto'],
    tipo: 'natural',
    lon: 26.4,
    lat: 40.22,
    liga: 'Mar Egeu ↔ Mar de Mármara',
    separa: 'Europa ↔ Ásia',
    bacia: 'Europa e Mediterrâneo',
  },
  {
    id: 'bosforo',
    nome: 'Estreito de Bósforo',
    sinonimos: ['Bósforo', 'Bosforo'],
    tipo: 'natural',
    lon: 29.07,
    lat: 41.1,
    liga: 'Mar de Mármara ↔ Mar Negro',
    separa: 'Europa ↔ Ásia, dentro de Istambul',
    bacia: 'Europa e Mediterrâneo',
  },
  {
    id: 'kerch',
    nome: 'Estreito de Kerch',
    sinonimos: ['Kerch', 'Querche'],
    tipo: 'natural',
    lon: 36.55,
    lat: 45.3,
    liga: 'Mar Negro ↔ Mar de Azov',
    separa: 'Crimeia ↔ península de Taman',
    bacia: 'Europa e Mediterrâneo',
  },

  // --- África e Oriente Médio ---
  {
    id: 'suez',
    nome: 'Canal de Suez',
    sinonimos: ['Suez'],
    tipo: 'escavado',
    lon: 32.35,
    lat: 30.6,
    liga: 'Mediterrâneo ↔ Mar Vermelho',
    separa: 'África ↔ Ásia',
    bacia: 'África e Oriente Médio',
  },
  {
    id: 'bab-el-mandeb',
    nome: 'Estreito de Bab-el-Mandeb',
    sinonimos: ['Bab-el-Mandeb', 'Bab el Mandeb', 'Babelmândebe', 'Mandeb'],
    tipo: 'natural',
    lon: 43.33,
    lat: 12.58,
    liga: 'Mar Vermelho ↔ Golfo de Áden',
    separa: 'Djibuti ↔ Iêmen',
    bacia: 'África e Oriente Médio',
  },
  {
    id: 'ormuz',
    nome: 'Estreito de Ormuz',
    sinonimos: ['Ormuz', 'Hormuz'],
    tipo: 'natural',
    lon: 56.25,
    lat: 26.57,
    liga: 'Golfo Pérsico ↔ Golfo de Omã',
    separa: 'Irã ↔ Omã',
    bacia: 'África e Oriente Médio',
  },
  {
    id: 'mocambique',
    nome: 'Canal de Moçambique',
    sinonimos: ['Moçambique'],
    tipo: 'natural',
    lon: 41.5,
    lat: -18,
    liga: 'braço do Índico entre dois litorais',
    separa: 'Moçambique ↔ Madagascar',
    bacia: 'África e Oriente Médio',
  },

  // --- Ásia ---
  {
    id: 'palk',
    nome: 'Estreito de Palk',
    sinonimos: ['Palk'],
    tipo: 'natural',
    lon: 79.6,
    lat: 9.8,
    liga: 'Golfo de Mannar ↔ Baía de Bengala',
    separa: 'Índia ↔ Sri Lanka',
    bacia: 'Ásia',
  },
  {
    id: 'malaca',
    nome: 'Estreito de Malaca',
    sinonimos: ['Malaca', 'Málaca', 'Malaka'],
    tipo: 'natural',
    lon: 100,
    lat: 3,
    liga: 'Mar de Andamão ↔ Mar da China Meridional',
    separa: 'Sumatra ↔ península Malaia',
    bacia: 'Ásia',
  },
  {
    id: 'sunda',
    nome: 'Estreito de Sunda',
    sinonimos: ['Sunda'],
    tipo: 'natural',
    lon: 105.7,
    lat: -6,
    liga: 'Mar de Java ↔ Índico',
    separa: 'Java ↔ Sumatra',
    bacia: 'Ásia',
  },
  {
    id: 'taiwan',
    nome: 'Estreito de Taiwan',
    sinonimos: ['Taiwan', 'Formosa', 'Estreito de Formosa'],
    tipo: 'natural',
    lon: 119.6,
    lat: 24.5,
    liga: 'Mar da China Oriental ↔ Mar da China Meridional',
    separa: 'China ↔ Taiwan',
    bacia: 'Ásia',
  },
  {
    id: 'coreia',
    nome: 'Estreito da Coreia',
    sinonimos: ['Coreia', 'Tsushima', 'Estreito de Tsushima'],
    tipo: 'natural',
    lon: 129.2,
    lat: 34.4,
    liga: 'Mar da China Oriental ↔ Mar do Japão',
    separa: 'Coreia do Sul ↔ Japão',
    bacia: 'Ásia',
  },

  // --- Oceania ---
  {
    id: 'torres',
    nome: 'Estreito de Torres',
    sinonimos: ['Torres'],
    tipo: 'natural',
    lon: 142.5,
    lat: -10,
    liga: 'Mar de Arafura ↔ Mar de Coral',
    separa: 'Austrália ↔ Nova Guiné',
    bacia: 'Oceania',
  },
  {
    id: 'bass',
    nome: 'Estreito de Bass',
    sinonimos: ['Bass'],
    tipo: 'natural',
    lon: 145.5,
    lat: -39.5,
    liga: 'Índico ↔ Mar da Tasmânia',
    separa: 'Austrália ↔ Tasmânia',
    bacia: 'Oceania',
  },
  {
    id: 'cook',
    nome: 'Estreito de Cook',
    sinonimos: ['Cook'],
    tipo: 'natural',
    lon: 174.4,
    lat: -41.3,
    liga: 'Mar da Tasmânia ↔ Pacífico Sul',
    separa: 'Ilha do Norte ↔ Ilha do Sul, na Nova Zelândia',
    bacia: 'Oceania',
  },

  // --- Américas e Ártico ---
  {
    id: 'bering',
    nome: 'Estreito de Bering',
    sinonimos: ['Bering', 'Behring'],
    tipo: 'natural',
    lon: -168.9,
    lat: 65.75,
    liga: 'Pacífico ↔ Oceano Ártico',
    separa: 'Rússia ↔ Alasca',
    bacia: 'Américas e Ártico',
  },
  {
    id: 'dinamarca',
    nome: 'Estreito da Dinamarca',
    sinonimos: ['Dinamarca'],
    tipo: 'natural',
    lon: -25,
    lat: 67,
    liga: 'Mar da Groenlândia ↔ Atlântico Norte',
    separa: 'Groenlândia ↔ Islândia',
    bacia: 'Américas e Ártico',
  },
  {
    id: 'davis',
    nome: 'Estreito de Davis',
    sinonimos: ['Davis'],
    tipo: 'natural',
    lon: -58,
    lat: 66.5,
    liga: 'Mar do Labrador ↔ Baía de Baffin',
    separa: 'Groenlândia ↔ ilha de Baffin',
    bacia: 'Américas e Ártico',
  },
  {
    id: 'hudson',
    nome: 'Estreito de Hudson',
    sinonimos: ['Hudson'],
    tipo: 'natural',
    lon: -70.5,
    lat: 61.5,
    liga: 'Baía de Hudson ↔ Atlântico',
    separa: 'Labrador ↔ ilha de Baffin',
    bacia: 'Américas e Ártico',
  },
  {
    id: 'florida',
    nome: 'Estreito da Flórida',
    sinonimos: ['Flórida', 'Florida'],
    tipo: 'natural',
    lon: -80.5,
    lat: 24.3,
    liga: 'Golfo do México ↔ Atlântico',
    separa: 'Flórida ↔ Cuba',
    bacia: 'Américas e Ártico',
  },
  {
    id: 'yucatan',
    nome: 'Canal de Yucatán',
    sinonimos: ['Yucatán', 'Yucatan', 'Iucatã', 'Estreito de Yucatán'],
    tipo: 'natural',
    lon: -85.9,
    lat: 21.6,
    liga: 'Golfo do México ↔ Mar do Caribe',
    separa: 'México ↔ Cuba',
    bacia: 'Américas e Ártico',
  },
  {
    id: 'panama',
    nome: 'Canal do Panamá',
    sinonimos: ['Panamá', 'Panama'],
    tipo: 'escavado',
    lon: -79.68,
    lat: 9.1,
    liga: 'Mar do Caribe ↔ Pacífico',
    separa: 'corta o istmo do Panamá',
    bacia: 'Américas e Ártico',
  },
  {
    id: 'magalhaes',
    nome: 'Estreito de Magalhães',
    sinonimos: ['Magalhães', 'Magalhaes'],
    tipo: 'natural',
    lon: -70.5,
    lat: -53.3,
    liga: 'Atlântico ↔ Pacífico',
    separa: 'Patagônia ↔ Terra do Fogo',
    bacia: 'Américas e Ártico',
  },
  {
    id: 'drake',
    nome: 'Passagem de Drake',
    sinonimos: ['Drake', 'Mar de Hoces', 'Estreito de Drake'],
    tipo: 'natural',
    lon: -63,
    lat: -58,
    liga: 'Atlântico ↔ Pacífico, por baixo de tudo',
    separa: 'Cabo Horn ↔ Antártida',
    bacia: 'Américas e Ártico',
  },
]

/** O ponto de uma passagem na caixa do mapa-múndi. */
export function pontoDe(p: Passagem): { readonly x: number; readonly y: number } {
  return projetar(p.lon, p.lat)
}
