/**
 * Os vinte maiores países do mundo em **área**, do maior para o menor.
 *
 * ## Por que área, e não população
 *
 * O pedido original admitia os dois critérios, e até dois modos no mesmo jogo,
 * como o grego faz com a direção da carta. Ficou só a área, por duas razões que
 * não são de gosto.
 *
 * A primeira é a mecânica. O grego só consegue alternar direção porque
 * `montarBaralho(rng)` existe e é chamado a cada partida; `config()` de sequência
 * não recebe modo nem sorteio — devolve uma lista e pronto. "Dois modos" na
 * sequência viraria ou dois ids no registry (e o pedido era um jogo só) ou uma
 * sequência de quarenta itens com os vinte de população escondidos atrás de vinte
 * acertos perfeitos de área. Numa mecânica de morte súbita isso não é conteúdo
 * extra: é conteúdo que quase ninguém alcança.
 *
 * A segunda, e a que pesa mais: **a ordem por população não se sustenta**. Pelas
 * estimativas da ONU (World Population Prospects, revisão de 2024, ano de
 * referência 2024) as casas de baixo do top 20 estão dentro do erro da própria
 * estimativa — Etiópia e México separadas por ~2 milhões em ~131, Egito e
 * Filipinas por ~1 milhão em ~116 —, e a virada de Índia sobre China, em 2023,
 * mudou quem é o primeiro. Um jogo de morte súbita com gabarito instável não
 * ensina geografia, ensina qual revisão do WPP o autor tinha aberta. Área é
 * medida cadastral: muda quando muda fronteira, não quando muda o ano.
 *
 * ## A fonte e a convenção
 *
 * Área **total** (terras firmes mais águas interiores), em km², na convenção do
 * CIA World Factbook, que é a mesma da divisão estatística da ONU. Uma fonte só,
 * de propósito: misturar tabelas é o jeito mais fácil de produzir uma ordem que
 * nenhuma delas endossa.
 *
 * Duas notas de quem conferiu à mão:
 *
 * - O Brasil aparece com 8.515.767 km², e não com os 8.510.345,538 km² que o
 *   IBGE publica. O número do IBGE é mais preciso — é o nosso cadastro —, mas
 *   trocar só o Brasil por ele seria exatamente a mistura de réguas que o
 *   parágrafo acima recusa. A posição não muda: da Austrália separa 800 mil km².
 * - As casas 19 e 20 (Peru e Chade) estão a 1.216 km² uma da outra, menos de
 *   0,1%. Sobrevivem à troca de convenção: medindo só terra firme, Peru
 *   1.279.996 contra 1.259.200 do Chade, e a ordem se mantém. O primeiro de fora
 *   é o Níger, 17 mil km² abaixo do Chade — ver `PRIMEIRO_DE_FORA`.
 *
 * ## O par que troca de lugar
 *
 * China e Estados Unidos, 3º e 4º, são o caso disputado desta lista, e é o mesmo
 * problema do Nilo contra o Amazonas em `rios-montanhas.ts`: não é que alguém
 * mediu errado, é que se mede coisas diferentes. Os 9.525.067 km² dos EUA são
 * terra mais água interior; somando águas costeiras e a parte americana dos
 * Grandes Lagos o Factbook chega a 9.833.517 km² e os EUA passam a China. Do
 * lado chinês, 9.596.961 km² exclui Taiwan e as áreas em disputa com a Índia;
 * incluindo-as passa de 9,7 milhões.
 *
 * Adotei a convenção estreita para os dois (é a que mantém a régua única) e
 * declarei o par como trocável: na sequência, tanto "China, Estados Unidos"
 * quanto "Estados Unidos, China" passam. Ver `trocaCom`.
 */

export interface PaisPorArea {
  /**
   * ISO 3166-1 alfa-2 minúsculo — a mesma chave de `paises.ts`, e o teste de
   * referência cruzada garante que nenhum id daqui deixou de existir lá. O nome
   * exibido e os sinônimos aceitos vêm de lá também: repetir "Estados Unidos" e
   * "EUA" aqui seria criar uma segunda fonte de verdade para o mesmo país.
   */
  readonly id: string
  /** Área total (terra + águas interiores) em km². */
  readonly areaKm2: number
  /**
   * Id do país que pode ocupar esta posição sem erro, quando a ordem depende da
   * convenção de medida e não do fato. É sempre recíproco — o teste cobra isso —,
   * porque uma troca declarada de um lado só seria uma armadilha do outro.
   */
  readonly trocaCom?: string
}

/**
 * Escrita à mão, na ordem em que o jogo pede, e conferida contra os números da
 * coluna ao lado. A ordem é dado, não comentário: `maiores-paises.test.ts`
 * reordena a lista pelo `areaKm2` e exige que dê exatamente esta sequência. Uma
 * linha movida de lugar sem o número correspondente quebra o teste.
 */
export const MAIORES_POR_AREA: readonly PaisPorArea[] = [
  { id: 'ru', areaKm2: 17_098_246 },
  { id: 'ca', areaKm2: 9_984_670 },
  { id: 'cn', areaKm2: 9_596_961, trocaCom: 'us' },
  { id: 'us', areaKm2: 9_525_067, trocaCom: 'cn' },
  { id: 'br', areaKm2: 8_515_767 },
  { id: 'au', areaKm2: 7_692_024 },
  { id: 'in', areaKm2: 3_287_263 },
  { id: 'ar', areaKm2: 2_780_400 },
  { id: 'kz', areaKm2: 2_724_900 },
  { id: 'dz', areaKm2: 2_381_741 },
  { id: 'cd', areaKm2: 2_344_858 },
  { id: 'sa', areaKm2: 2_149_690 },
  { id: 'mx', areaKm2: 1_964_375 },
  { id: 'id', areaKm2: 1_904_569 },
  { id: 'sd', areaKm2: 1_861_484 },
  { id: 'ly', areaKm2: 1_759_540 },
  { id: 'ir', areaKm2: 1_648_195 },
  { id: 'mn', areaKm2: 1_564_110 },
  { id: 'pe', areaKm2: 1_285_216 },
  { id: 'td', areaKm2: 1_284_000 },
]

/**
 * O 21º, que fica de fora por 17 mil km².
 *
 * Existe para o teste poder afirmar que o corte é uma fronteira e não um
 * arredondamento: se algum dia alguém corrigir a área do Chade para baixo, é
 * aqui que a lista passa a estar errada, e o teste avisa antes do jogador.
 */
export const PRIMEIRO_DE_FORA = { id: 'ne', areaKm2: 1_267_000 } as const

/** Quantos itens o jogo tem. Uma só definição: o jogo e o teste leem daqui. */
export const TOTAL_MAIORES = MAIORES_POR_AREA.length

/** Área em português do Brasil: "17.098.246 km²". */
export const exibirArea = (km2: number): string => `${km2.toLocaleString('pt-BR')} km²`
