/**
 * Os dez maiores rios em extensão e os catorze picos acima de 8.000 metros,
 * cada lista na sua ordem.
 *
 * ## O Nilo contra o Amazonas
 *
 * É o caso disputado desta lista, e o dataset o trata como `capitais.ts` trata a
 * África do Sul: uma canônica escolhida, o motivo escrito, a alternativa aceita.
 *
 * A disputa não é sobre quem mediu melhor — é sobre **onde começa o rio**. A
 * medida clássica, que os atlas publicam e que este dataset adota, dá 6.650 km
 * ao Nilo (nascente no Kagera, em Burundi/Ruanda) contra 6.400 km ao Amazonas
 * (nascente no Apurímac, no Peru). Em 2007 uma expedição brasileira do INPE
 * remontou a nascente do Amazonas para a cabeceira do Mantaro, no sul do Peru, e
 * mediu 6.992 km — o que põe o Amazonas em primeiro. A medição é séria e é a que
 * livro didático brasileiro costuma repetir desde então.
 *
 * Canônica: **Nilo**. Não por desdém à medição brasileira, e sim pela mesma
 * regra que vale para o resto da lista: uma régua só. Se o Amazonas passa a ser
 * medido pelo Mantaro, o Ob e o Ienissei também teriam de ser remedidos pelo
 * formador mais distante que alguém já defendeu, e a ordem inteira vira uma
 * colagem de fontes que nenhuma delas endossa. Trocar um item por simpatia
 * nacional seria exatamente o defeito que o cabeçalho de `maiores-paises.ts`
 * recusa.
 *
 * E o par é declarado trocável (`trocaCom`): na sequência, tanto "Nilo,
 * Amazonas" quanto "Amazonas, Nilo" passam. Quem responde "Amazonas" no primeiro
 * item não errou de geografia — respondeu por outra régua, e matar a partida
 * dele seria transformar uma escolha editorial em gabarito.
 *
 * ## A régua dos rios
 *
 * Extensão do **sistema fluvial completo** (rio principal mais o maior
 * formador), em km, que é a convenção dos atlas e a única que faz o Mississippi
 * aparecer: sozinho ele tem 3.766 km e não entraria nem em décimo. Daí os nomes
 * compostos — Mississippi-Missouri, Ob-Irtich, Ienissei-Angara —, todos aceitos
 * na forma curta também.
 *
 * O décimo é o mais frágil: Amur-Argun (4.444 km) e Lena (4.400 km) estão a 1%
 * de distância, e há fonte para qualquer das duas ordens. O Amur fica porque a
 * régua do sistema completo se aplica a ele (o Argun é formador) e não muda a
 * Lena, que não tem formador maior. É uma decisão, não um fato — e `PRIMEIRO_RIO_DE_FORA`
 * existe para que ela esteja escrita em algum lugar.
 *
 * ## Por que catorze montanhas, e não dez
 *
 * Porque catorze não é um corte: é o conjunto **fechado** dos picos acima de
 * 8.000 metros. Um "top 10" de montanhas seria um número redondo escolhido por
 * um autor; os oitomil são uma lista que a própria montanha define, e é a lista
 * que alpinista decora. O 15º, Gyachung Kang, tem 7.952 m — 48 metros abaixo da
 * linha —, e é ele que torna o corte verificável (ver `PRIMEIRO_PICO_DE_FORA`).
 *
 * Duas notas de altitude:
 *
 * - Everest com **8.849 m**, da medição conjunta Nepal–China de 2020 (8.848,86 m).
 *   Os 8.848 m clássicos, da medição indiana de 1955, seguem em toda parte e não
 *   mudam nada aqui: o segundo colocado está 238 metros abaixo.
 * - A lista é de montanhas, não de cumes. Lhotse Shar (8.382 m) e Broad Peak
 *   Central (8.011 m) passam dos 8.000 e ficam de fora porque são cumes
 *   secundários do mesmo maciço — sem o critério de proeminência, a lista teria
 *   vinte e poucos nomes e nenhum alpinista a reconheceria.
 */

export interface Rio {
  readonly id: string
  /** A forma que o gabarito mostra. */
  readonly nome: string
  /** Grafias e nomes de sistema aceitos além da canônica. */
  readonly sinonimos: readonly string[]
  /** Extensão do sistema completo, em km. */
  readonly km: number
  /**
   * Id do item que pode ocupar esta posição sem erro, quando a ordem depende da
   * régua e não do fato. Sempre recíproco — o teste cobra.
   */
  readonly trocaCom?: string
}

export interface Pico {
  readonly id: string
  readonly nome: string
  readonly sinonimos: readonly string[]
  /** Altitude em metros acima do nível do mar. */
  readonly metros: number
}

/** Ordem escrita à mão e conferida contra a coluna de `km` pelo teste. */
export const RIOS: readonly Rio[] = [
  { id: 'nilo', nome: 'Nilo', sinonimos: ['Rio Nilo'], km: 6_650, trocaCom: 'amazonas' },
  { id: 'amazonas', nome: 'Amazonas', sinonimos: ['Rio Amazonas'], km: 6_400, trocaCom: 'nilo' },
  { id: 'yangtze', nome: 'Yangtzé', sinonimos: ['Yangtze', 'Rio Azul', 'Chang Jiang', 'Changjiang'], km: 6_300 },
  { id: 'mississippi', nome: 'Mississippi', sinonimos: ['Mississipi', 'Mississippi-Missouri', 'Missouri'], km: 6_275 },
  { id: 'ienissei', nome: 'Ienissei', sinonimos: ['Ienisei', 'Yenisei', 'Yenissei', 'Ienissei-Angara'], km: 5_539 },
  { id: 'amarelo', nome: 'Rio Amarelo', sinonimos: ['Amarelo', 'Huang He', 'Huanghe', 'Hwang Ho'], km: 5_464 },
  { id: 'obi', nome: 'Obi', sinonimos: ['Ob', 'Ob-Irtich', 'Obi-Irtich', 'Irtich'], km: 5_410 },
  { id: 'parana', nome: 'Paraná', sinonimos: ['Rio Paraná', 'Prata', 'Rio da Prata', 'Paraná-Prata'], km: 4_880 },
  { id: 'congo', nome: 'Congo', sinonimos: ['Rio Congo', 'Zaire'], km: 4_700 },
  { id: 'amur', nome: 'Amur', sinonimos: ['Rio Amur', 'Amur-Argun', 'Heilongjiang'], km: 4_444 },
]

/** O 11º. Ver a nota sobre a fragilidade do décimo, no cabeçalho. */
export const PRIMEIRO_RIO_DE_FORA = { nome: 'Lena', km: 4_400 } as const

/** Os catorze oitomil, do mais alto para o mais baixo. */
export const OITOMIL: readonly Pico[] = [
  { id: 'everest', nome: 'Everest', sinonimos: ['Monte Everest', 'Chomolungma', 'Sagarmatha'], metros: 8_849 },
  { id: 'k2', nome: 'K2', sinonimos: ['Chogori', 'Godwin-Austen', 'Monte Godwin-Austen'], metros: 8_611 },
  { id: 'kangchenjunga', nome: 'Kangchenjunga', sinonimos: ['Kanchenjunga', 'Kangchendzonga'], metros: 8_586 },
  { id: 'lhotse', nome: 'Lhotse', sinonimos: [], metros: 8_516 },
  { id: 'makalu', nome: 'Makalu', sinonimos: [], metros: 8_485 },
  { id: 'cho-oyu', nome: 'Cho Oyu', sinonimos: ['Chooyu'], metros: 8_188 },
  { id: 'dhaulagiri', nome: 'Dhaulagiri', sinonimos: ['Dhaulagiri I', 'Daulagiri'], metros: 8_167 },
  { id: 'manaslu', nome: 'Manaslu', sinonimos: ['Kutang'], metros: 8_163 },
  { id: 'nanga-parbat', nome: 'Nanga Parbat', sinonimos: ['Diamir'], metros: 8_126 },
  { id: 'annapurna', nome: 'Annapurna', sinonimos: ['Annapurna I', 'Anapurna'], metros: 8_091 },
  { id: 'gasherbrum-1', nome: 'Gasherbrum I', sinonimos: ['Hidden Peak', 'Gasherbrum 1'], metros: 8_080 },
  { id: 'broad-peak', nome: 'Broad Peak', sinonimos: ['Falchan Kangri'], metros: 8_051 },
  { id: 'gasherbrum-2', nome: 'Gasherbrum II', sinonimos: ['Gasherbrum 2'], metros: 8_035 },
  { id: 'shishapangma', nome: 'Shishapangma', sinonimos: ['Xixabangma', 'Shisha Pangma', 'Gosainthan'], metros: 8_027 },
]

/** A linha que define o conjunto. Não é escolha de autor: é o que "oitomil" quer dizer. */
export const LIMITE_OITOMIL = 8_000

/** O 15º pico mais alto, 48 metros abaixo da linha. */
export const PRIMEIRO_PICO_DE_FORA = { nome: 'Gyachung Kang', metros: 7_952 } as const

/** "6.650 km" e "8.849 m", no formato brasileiro. */
export const exibirKm = (km: number): string => `${km.toLocaleString('pt-BR')} km`
export const exibirMetros = (m: number): string => `${m.toLocaleString('pt-BR')} m`
