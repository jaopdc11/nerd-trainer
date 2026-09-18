/**
 * A moeda de cada um dos 195 países soberanos de `paises.ts`, em português do
 * Brasil.
 *
 * ## Por que 195 e não os 204
 *
 * `capitais.ts` cobre a lista inteira, inclusive os nove territórios, porque
 * sede administrativa é uma coisa que território tem. Moeda não é: sete dos nove
 * usam o dinheiro de quem os administra — a Groenlândia usa a coroa dinamarquesa,
 * Porto Rico o dólar americano, o Chipre do Norte a lira turca, o Kosovo o euro.
 * Perguntar isso não testa moeda, testa saber quem administra o quê, que é outra
 * pergunta e já tem jogo. Pior: dos nove, dois não têm resposta única e honesta —
 * no Saara Ocidental circula o dirham marroquino na zona controlada e outras
 * moedas nos campos de refugiados, e o xelim somalilandês não é conversível nem
 * reconhecido fora da Somalilândia. A alternativa descartada foi cobrir os 204
 * "por simetria com as capitais": simetria não é motivo para pôr no jogo duas
 * cartas cuja resposta eu teria de inventar.
 *
 * ## O problema de desenho: muitos países, uma moeda só
 *
 * Isto não é detalhe. Na lista de 195, **26 países respondem "euro"**, 14
 * respondem "franco CFA", 8 respondem "dólar americano", 6 respondem "dólar do
 * Caribe Oriental" e 4 respondem "dólar australiano". São 141 moedas distintas
 * para 195 países. Três decisões saem daí:
 *
 * 1. **A tabela é dupla: catálogo de moedas + atribuição por país.** `MOEDAS` tem
 *    uma linha por moeda, chaveada pelo código ISO 4217; `MOEDA_DE_PAIS` liga
 *    país → código. A alternativa óbvia, um `Record<paisId, Moeda>` no molde de
 *    `CAPITAIS`, escreveria o euro 26 vezes e o franco CFA 14 — e a primeira vez
 *    que alguém acrescentasse um sinônimo em uma das cópias as outras 25
 *    passariam a recusar o que a primeira aceita. Fato repetido é fato que
 *    diverge.
 * 2. **A carta diz quantos países dividem aquela moeda.** Quem acertou "euro"
 *    pela vigésima vez não está aprendendo nada com a repetição; o gabarito
 *    dizendo "a moeda de 26 países desta lista" transforma a repetição na lição,
 *    que é justamente saber *quem* está na zona do euro e quem não está — Polônia,
 *    Suécia, Tchéquia e Hungria não estão.
 * 3. **A família sempre vale, inclusive na moeda compartilhada.** "dólar" vale
 *    para o Canadá e vale para o Equador; "franco" vale para o Congo e vale para
 *    o Senegal. A regra é uma só e não tem exceção: o país está escrito na carta,
 *    então o qualificador que falta é dedução, não conhecimento — quem sabe que o
 *    Senegal usa franco sabe qual franco é, porque não existe outro candidato.
 *    `moedas.test.ts` cobra o invariante: se a canônica começa com um nome de
 *    família, a família sozinha está entre as aceitas.
 *
 *    Era o contrário, e vale registrar por que virou. `usd`, `xof`, `xaf`, `xcd`,
 *    `aud` e `chf` não carregavam a forma curta, pelo argumento de que "franco"
 *    para o Senegal esconde o CFA e "dólar" para o Equador esconde que o dólar é
 *    o *americano*. O argumento descreve um fato real e mira no alvo errado: o
 *    que ele produzia era o jogador que **sabe** a resposta apanhando da
 *    digitação em 34 das 195 cartas — e logo nas que mais se repetem no baralho,
 *    onde a punição chega em série. O fato que se queria cobrar continua cobrado,
 *    por quem tem competência para isso: o gabarito, que devolve o nome inteiro e
 *    diz quantos países dividem a moeda (decisão 2).
 *
 * Os dois francos CFA aparecem separados — o da BCEAO (XOF, oeste) e o da BEAC
 * (XAF, centro) — porque são duas moedas, com dois bancos emissores, ainda que
 * com a mesma paridade e o mesmo nome corrente. "franco CFA" sem qualificar vale
 * nos dois: o jogo não vai cobrar de ninguém a sigla do banco central.
 *
 * ## Onde o dado é instável, a decisão está registrada
 *
 * - **Bulgária** — entrou na zona do euro em 1º de janeiro de 2026. Canônica
 *   **euro**; "lev" continua valendo, porque a troca é de ontem e metade do que
 *   está impresso ainda diz lev.
 * - **Croácia** — euro desde 2023; "kuna" vale, pelo mesmo motivo.
 * - **Zimbábue** — o caso mais feio da lista. O país abandonou a própria moeda em
 *   2009 depois da hiperinflação, e desde então o dólar americano tem curso legal
 *   e domina as transações; o ZiG, lançado em 2024, é a moeda oficial no papel.
 *   Canônica **dólar americano**, que é com o que se compra pão lá, e "ZiG" e
 *   "dólar zimbabuano" valem. Não dá para fingir que isto é um fato limpo.
 * - **Panamá** — o balboa existe (em moedas metálicas) e é paritário ao dólar
 *   americano, que circula em cédula. Canônica **balboa**; "dólar americano" vale.
 * - **Palestina** — não tem moeda própria: circulam o novo shekel israelense, o
 *   dinar jordaniano e o dólar americano. Canônica **novo shekel israelense**, que
 *   é o que predomina; os outros dois valem.
 * - **Lesoto, Essuatíni e Namíbia** — têm moeda própria (loti, lilangeni, dólar
 *   namibiano), todas atreladas ao rand sul-africano, que também tem curso legal
 *   nos três. Canônica a moeda própria; "rand" vale.
 * - **Butão** — o ngultrum é paritário à rupia indiana, que circula normalmente.
 *   Canônica **ngultrum**; "rupia indiana" vale.
 * - **Zâmbia e Malawi** chamam a moeda de *kwacha*, e são duas moedas diferentes.
 *   As canônicas trazem o gentílico; "kwacha" sozinho vale nas duas, porque o país
 *   está na carta.
 */

export interface Moeda {
  /** ISO 4217, em maiúsculas. Entra no gabarito e é a chave de conferência. */
  readonly codigo: string
  /** A forma que o gabarito mostra. */
  readonly nome: string
  /** Grafias alternativas, a forma curta da família e as moedas que coabitam. */
  readonly sinonimos: readonly string[]
}

/** Tudo que conta como acerto, com a canônica na frente. */
export const formasAceitas = (m: Moeda): readonly string[] => [m.nome, ...m.sinonimos]

/**
 * Catálogo de moedas, chaveado pelo ISO 4217 em minúsculas.
 *
 * Uma linha por moeda — não por país. Ver a decisão 1 do cabeçalho.
 */
export const MOEDAS: Readonly<Record<string, Moeda>> = {
  aed: { codigo: 'AED', nome: 'dirham dos Emirados', sinonimos: ['dirham', 'dirrã'] },
  afn: { codigo: 'AFN', nome: 'afegani', sinonimos: ['afghani', 'afeghani'] },
  all: { codigo: 'ALL', nome: 'lek', sinonimos: ['leque', 'lek albanês'] },
  amd: { codigo: 'AMD', nome: 'dram', sinonimos: ['drama', 'dram armênio'] },
  aoa: { codigo: 'AOA', nome: 'kwanza', sinonimos: ['cuanza'] },
  ars: { codigo: 'ARS', nome: 'peso argentino', sinonimos: ['peso'] },
  // Compartilhado com Kiribati, Nauru e Tuvalu, que não têm moeda própria.
  aud: { codigo: 'AUD', nome: 'dólar australiano', sinonimos: ['dólar', 'dólar da Austrália'] },
  azn: { codigo: 'AZN', nome: 'manat azeri', sinonimos: ['manat', 'manat do Azerbaijão'] },
  bam: { codigo: 'BAM', nome: 'marco conversível', sinonimos: ['marco', 'marco bósnio'] },
  bbd: { codigo: 'BBD', nome: 'dólar de Barbados', sinonimos: ['dólar', 'dólar barbadense'] },
  bdt: { codigo: 'BDT', nome: 'taka', sinonimos: ['taca'] },
  bhd: { codigo: 'BHD', nome: 'dinar bareinita', sinonimos: ['dinar', 'dinar do Bahrein'] },
  bif: { codigo: 'BIF', nome: 'franco burundiano', sinonimos: ['franco', 'franco do Burundi', 'franco burundês'] },
  bnd: { codigo: 'BND', nome: 'dólar de Brunei', sinonimos: ['dólar', 'dólar bruneano'] },
  bob: { codigo: 'BOB', nome: 'boliviano', sinonimos: ['peso boliviano'] },
  brl: { codigo: 'BRL', nome: 'real', sinonimos: ['real brasileiro'] },
  bsd: { codigo: 'BSD', nome: 'dólar das Bahamas', sinonimos: ['dólar', 'dólar bahamense'] },
  // Paritário à rupia indiana, que circula junto. Ver o cabeçalho.
  btn: { codigo: 'BTN', nome: 'ngultrum', sinonimos: ['ngultrão', 'rupia indiana'] },
  bwp: { codigo: 'BWP', nome: 'pula', sinonimos: [] },
  byn: { codigo: 'BYN', nome: 'rublo bielorrusso', sinonimos: ['rublo', 'rublo de Belarus'] },
  bzd: { codigo: 'BZD', nome: 'dólar de Belize', sinonimos: ['dólar', 'dólar belizenho'] },
  cad: { codigo: 'CAD', nome: 'dólar canadense', sinonimos: ['dólar', 'dólar do Canadá'] },
  cdf: { codigo: 'CDF', nome: 'franco congolês', sinonimos: ['franco', 'franco do Congo'] },
  // Compartilhado com Liechtenstein, por união monetária desde 1924.
  chf: { codigo: 'CHF', nome: 'franco suíço', sinonimos: ['franco', 'franco da Suíça'] },
  clp: { codigo: 'CLP', nome: 'peso chileno', sinonimos: ['peso'] },
  cny: { codigo: 'CNY', nome: 'yuan', sinonimos: ['renminbi', 'yuan renminbi', 'iuane', 'yuan chinês'] },
  cop: { codigo: 'COP', nome: 'peso colombiano', sinonimos: ['peso'] },
  crc: { codigo: 'CRC', nome: 'colón costarriquenho', sinonimos: ['colón', 'colon', 'colom'] },
  cup: { codigo: 'CUP', nome: 'peso cubano', sinonimos: ['peso'] },
  cve: { codigo: 'CVE', nome: 'escudo cabo-verdiano', sinonimos: ['escudo', 'escudo de Cabo Verde'] },
  czk: { codigo: 'CZK', nome: 'coroa tcheca', sinonimos: ['coroa', 'coroa checa'] },
  djf: { codigo: 'DJF', nome: 'franco djibutiano', sinonimos: ['franco', 'franco do Djibuti'] },
  dkk: { codigo: 'DKK', nome: 'coroa dinamarquesa', sinonimos: ['coroa'] },
  dop: { codigo: 'DOP', nome: 'peso dominicano', sinonimos: ['peso'] },
  dzd: { codigo: 'DZD', nome: 'dinar argelino', sinonimos: ['dinar'] },
  egp: { codigo: 'EGP', nome: 'libra egípcia', sinonimos: ['libra'] },
  ern: { codigo: 'ERN', nome: 'nakfa', sinonimos: ['nacfa'] },
  etb: { codigo: 'ETB', nome: 'birr', sinonimos: ['bir', 'birr etíope'] },
  eur: { codigo: 'EUR', nome: 'euro', sinonimos: [] },
  fjd: { codigo: 'FJD', nome: 'dólar fijiano', sinonimos: ['dólar', 'dólar de Fiji', 'dólar fidjiano'] },
  gbp: { codigo: 'GBP', nome: 'libra esterlina', sinonimos: ['libra', 'libra britânica'] },
  gel: { codigo: 'GEL', nome: 'lari', sinonimos: ['lári'] },
  ghs: { codigo: 'GHS', nome: 'cedi', sinonimos: ['cedi ganês'] },
  gmd: { codigo: 'GMD', nome: 'dalasi', sinonimos: [] },
  gnf: { codigo: 'GNF', nome: 'franco guineano', sinonimos: ['franco', 'franco da Guiné'] },
  gtq: { codigo: 'GTQ', nome: 'quetzal', sinonimos: ['quetzal guatemalteco'] },
  gyd: { codigo: 'GYD', nome: 'dólar guianense', sinonimos: ['dólar', 'dólar da Guiana'] },
  hnl: { codigo: 'HNL', nome: 'lempira', sinonimos: [] },
  htg: { codigo: 'HTG', nome: 'gourde', sinonimos: ['gurde', 'gourde haitiano'] },
  huf: { codigo: 'HUF', nome: 'forint', sinonimos: ['forinte', 'florim húngaro'] },
  idr: { codigo: 'IDR', nome: 'rupia indonésia', sinonimos: ['rupia', 'rupiah'] },
  // Também é a moeda de fato da Palestina. Ver o cabeçalho.
  ils: { codigo: 'ILS', nome: 'novo shekel israelense', sinonimos: ['shekel', 'novo shekel', 'siclo', 'shekel israelense'] },
  inr: { codigo: 'INR', nome: 'rupia indiana', sinonimos: ['rupia'] },
  iqd: { codigo: 'IQD', nome: 'dinar iraquiano', sinonimos: ['dinar'] },
  irr: { codigo: 'IRR', nome: 'rial iraniano', sinonimos: ['rial', 'riyal', 'toman'] },
  isk: { codigo: 'ISK', nome: 'coroa islandesa', sinonimos: ['coroa'] },
  jmd: { codigo: 'JMD', nome: 'dólar jamaicano', sinonimos: ['dólar', 'dólar da Jamaica'] },
  jod: { codigo: 'JOD', nome: 'dinar jordaniano', sinonimos: ['dinar'] },
  jpy: { codigo: 'JPY', nome: 'iene', sinonimos: ['yen', 'iene japonês'] },
  kes: { codigo: 'KES', nome: 'xelim queniano', sinonimos: ['xelim', 'shilling'] },
  kgs: { codigo: 'KGS', nome: 'som quirguiz', sinonimos: ['som', 'som do Quirguistão'] },
  khr: { codigo: 'KHR', nome: 'riel', sinonimos: ['riel cambojano'] },
  kmf: { codigo: 'KMF', nome: 'franco comorense', sinonimos: ['franco', 'franco das Comores'] },
  kpw: { codigo: 'KPW', nome: 'won norte-coreano', sinonimos: ['won', 'won da Coreia do Norte'] },
  krw: { codigo: 'KRW', nome: 'won sul-coreano', sinonimos: ['won', 'won da Coreia do Sul'] },
  kwd: { codigo: 'KWD', nome: 'dinar kuwaitiano', sinonimos: ['dinar', 'dinar do Kuwait'] },
  kzt: { codigo: 'KZT', nome: 'tenge', sinonimos: ['tengue'] },
  lak: { codigo: 'LAK', nome: 'kip', sinonimos: ['quipe'] },
  lbp: { codigo: 'LBP', nome: 'libra libanesa', sinonimos: ['libra', 'lira libanesa'] },
  lkr: { codigo: 'LKR', nome: 'rupia cingalesa', sinonimos: ['rupia', 'rupia do Sri Lanka'] },
  lrd: { codigo: 'LRD', nome: 'dólar liberiano', sinonimos: ['dólar', 'dólar da Libéria'] },
  // Atrelado ao rand, que também tem curso legal. Ver o cabeçalho.
  lsl: { codigo: 'LSL', nome: 'loti', sinonimos: ['maloti', 'rand'] },
  lyd: { codigo: 'LYD', nome: 'dinar líbio', sinonimos: ['dinar'] },
  mad: { codigo: 'MAD', nome: 'dirham marroquino', sinonimos: ['dirham', 'dirrã'] },
  mdl: { codigo: 'MDL', nome: 'leu moldávio', sinonimos: ['leu', 'leu da Moldávia'] },
  mga: { codigo: 'MGA', nome: 'ariary', sinonimos: ['ariari', 'ariary malgaxe'] },
  mkd: { codigo: 'MKD', nome: 'denar', sinonimos: ['denar macedônio', 'dinar macedônio'] },
  mmk: { codigo: 'MMK', nome: 'kyat', sinonimos: ['quiate'] },
  mnt: { codigo: 'MNT', nome: 'tugrik', sinonimos: ['togrogue', 'tugrik mongol'] },
  mru: { codigo: 'MRU', nome: 'ouguiya', sinonimos: ['uguia', 'ouguia'] },
  mur: { codigo: 'MUR', nome: 'rupia mauriciana', sinonimos: ['rupia', 'rupia de Maurício'] },
  mvr: { codigo: 'MVR', nome: 'rufiyaa', sinonimos: ['rufia', 'rupia das Maldivas'] },
  mwk: { codigo: 'MWK', nome: 'kwacha malawiano', sinonimos: ['kwacha', 'cuacha'] },
  mxn: { codigo: 'MXN', nome: 'peso mexicano', sinonimos: ['peso'] },
  myr: { codigo: 'MYR', nome: 'ringgit', sinonimos: ['ringuite', 'ringgit malaio'] },
  mzn: { codigo: 'MZN', nome: 'metical', sinonimos: ['metical moçambicano'] },
  // O rand também tem curso legal na Namíbia. Ver o cabeçalho.
  nad: { codigo: 'NAD', nome: 'dólar namibiano', sinonimos: ['dólar', 'dólar da Namíbia', 'rand'] },
  ngn: { codigo: 'NGN', nome: 'naira', sinonimos: [] },
  nio: { codigo: 'NIO', nome: 'córdoba', sinonimos: ['cordoba', 'córdoba nicaraguense'] },
  nok: { codigo: 'NOK', nome: 'coroa norueguesa', sinonimos: ['coroa'] },
  npr: { codigo: 'NPR', nome: 'rupia nepalesa', sinonimos: ['rupia'] },
  nzd: { codigo: 'NZD', nome: 'dólar neozelandês', sinonimos: ['dólar', 'dólar da Nova Zelândia'] },
  omr: { codigo: 'OMR', nome: 'rial omanense', sinonimos: ['rial', 'riyal', 'rial de Omã'] },
  // O balboa existe em moeda metálica; a cédula que circula é a do dólar.
  pab: { codigo: 'PAB', nome: 'balboa', sinonimos: ['dólar americano', 'dólar'] },
  pen: { codigo: 'PEN', nome: 'sol', sinonimos: ['novo sol', 'sol peruano'] },
  pgk: { codigo: 'PGK', nome: 'kina', sinonimos: [] },
  php: { codigo: 'PHP', nome: 'peso filipino', sinonimos: ['peso', 'piso'] },
  pkr: { codigo: 'PKR', nome: 'rupia paquistanesa', sinonimos: ['rupia'] },
  pln: { codigo: 'PLN', nome: 'zloty', sinonimos: ['zlóti', 'esloti', 'zloty polonês'] },
  pyg: { codigo: 'PYG', nome: 'guarani', sinonimos: ['guarani paraguaio'] },
  qar: { codigo: 'QAR', nome: 'rial catariano', sinonimos: ['rial', 'riyal', 'rial do Catar'] },
  ron: { codigo: 'RON', nome: 'leu romeno', sinonimos: ['leu'] },
  rsd: { codigo: 'RSD', nome: 'dinar sérvio', sinonimos: ['dinar'] },
  rub: { codigo: 'RUB', nome: 'rublo', sinonimos: ['rublo russo'] },
  rwf: { codigo: 'RWF', nome: 'franco ruandês', sinonimos: ['franco', 'franco de Ruanda'] },
  sar: { codigo: 'SAR', nome: 'rial saudita', sinonimos: ['rial', 'riyal', 'riyal saudita'] },
  sbd: { codigo: 'SBD', nome: 'dólar das Ilhas Salomão', sinonimos: ['dólar', 'dólar salomônico'] },
  scr: { codigo: 'SCR', nome: 'rupia seichelense', sinonimos: ['rupia', 'rupia das Seicheles'] },
  sdg: { codigo: 'SDG', nome: 'libra sudanesa', sinonimos: ['libra'] },
  sek: { codigo: 'SEK', nome: 'coroa sueca', sinonimos: ['coroa'] },
  sgd: { codigo: 'SGD', nome: 'dólar de Singapura', sinonimos: ['dólar', 'dólar singapurense'] },
  sle: { codigo: 'SLE', nome: 'leone', sinonimos: ['leone serra-leonês'] },
  sos: { codigo: 'SOS', nome: 'xelim somali', sinonimos: ['xelim', 'xelim da Somália'] },
  srd: { codigo: 'SRD', nome: 'dólar surinamês', sinonimos: ['dólar', 'dólar do Suriname'] },
  ssp: { codigo: 'SSP', nome: 'libra sul-sudanesa', sinonimos: ['libra', 'libra do Sudão do Sul'] },
  stn: { codigo: 'STN', nome: 'dobra', sinonimos: ['dobra são-tomense'] },
  syp: { codigo: 'SYP', nome: 'libra síria', sinonimos: ['libra', 'lira síria'] },
  // Atrelado ao rand, que também tem curso legal. Ver o cabeçalho.
  szl: { codigo: 'SZL', nome: 'lilangeni', sinonimos: ['emalangeni', 'rand'] },
  thb: { codigo: 'THB', nome: 'baht', sinonimos: ['bate', 'baht tailandês'] },
  tjs: { codigo: 'TJS', nome: 'somoni', sinonimos: ['somoni tadjique'] },
  tmt: { codigo: 'TMT', nome: 'manat turcomeno', sinonimos: ['manat'] },
  tnd: { codigo: 'TND', nome: 'dinar tunisiano', sinonimos: ['dinar'] },
  top: { codigo: 'TOP', nome: 'paanga', sinonimos: ['pa’anga', "pa'anga", 'paʻanga'] },
  try: { codigo: 'TRY', nome: 'lira turca', sinonimos: ['lira'] },
  ttd: { codigo: 'TTD', nome: 'dólar de Trinidad e Tobago', sinonimos: ['dólar', 'dólar trinitário'] },
  tzs: { codigo: 'TZS', nome: 'xelim tanzaniano', sinonimos: ['xelim'] },
  uah: { codigo: 'UAH', nome: 'hryvnia', sinonimos: ['grívnia', 'hryvnya', 'hrivna'] },
  ugx: { codigo: 'UGX', nome: 'xelim ugandense', sinonimos: ['xelim', 'xelim de Uganda'] },
  // Compartilhado por oito países desta lista — seis deles sem moeda própria.
  usd: { codigo: 'USD', nome: 'dólar americano', sinonimos: ['dólar', 'dólar dos Estados Unidos', 'dólar norte-americano', 'dólar estadunidense'] },
  uyu: { codigo: 'UYU', nome: 'peso uruguaio', sinonimos: ['peso'] },
  uzs: { codigo: 'UZS', nome: 'som uzbeque', sinonimos: ['som', 'sum', 'sum uzbeque'] },
  ves: { codigo: 'VES', nome: 'bolívar', sinonimos: ['bolívar soberano', 'bolívar digital', 'bolívar venezuelano'] },
  vnd: { codigo: 'VND', nome: 'dong', sinonimos: ['dongue', 'dong vietnamita'] },
  vuv: { codigo: 'VUV', nome: 'vatu', sinonimos: ['vatu de Vanuatu'] },
  wst: { codigo: 'WST', nome: 'tala', sinonimos: ['tala samoano'] },
  // Os dois CFA e o dólar do Caribe: quem sabe que o Chade usa franco sabe qual,
  // então a família passa igual às outras. Ver a decisão 3 do cabeçalho.
  xaf: { codigo: 'XAF', nome: 'franco CFA da África Central', sinonimos: ['franco CFA', 'franco', 'CFA', 'franco CFA BEAC'] },
  xcd: { codigo: 'XCD', nome: 'dólar do Caribe Oriental', sinonimos: ['dólar', 'dólar caribenho', 'dólar das Caraíbas Orientais'] },
  xof: { codigo: 'XOF', nome: 'franco CFA da África Ocidental', sinonimos: ['franco CFA', 'franco', 'CFA', 'franco CFA BCEAO'] },
  yer: { codigo: 'YER', nome: 'rial iemenita', sinonimos: ['rial', 'riyal', 'rial do Iêmen'] },
  zar: { codigo: 'ZAR', nome: 'rand', sinonimos: ['rand sul-africano'] },
  zmw: { codigo: 'ZMW', nome: 'kwacha zambiano', sinonimos: ['kwacha'] },
}

/**
 * País → moeda, chaveado pelo id de `PAISES` (ISO 3166-1 alfa-2 minúsculo).
 *
 * Cobre exatamente os 195 soberanos; os nove territórios ficam de fora por
 * decisão registrada no cabeçalho, e `moedas.test.ts` garante a bijeção nos dois
 * sentidos — país novo sem moeda, ou moeda de país que não existe, quebra ali.
 */
export const MOEDA_DE_PAIS: Readonly<Record<string, string>> = {
  ad: 'eur', // por acordo monetário com a UE, sem assento no BCE
  ae: 'aed',
  af: 'afn',
  ag: 'xcd',
  al: 'all',
  am: 'amd',
  ao: 'aoa',
  ar: 'ars',
  at: 'eur',
  au: 'aud',
  az: 'azn',
  ba: 'bam',
  bb: 'bbd',
  bd: 'bdt',
  be: 'eur',
  bf: 'xof',
  bg: 'eur', // desde 1º de janeiro de 2026; "lev" ainda vale. Ver o cabeçalho.
  bh: 'bhd',
  bi: 'bif',
  bj: 'xof',
  bn: 'bnd',
  bo: 'bob',
  br: 'brl',
  bs: 'bsd',
  bt: 'btn',
  bw: 'bwp',
  by: 'byn',
  bz: 'bzd',
  ca: 'cad',
  cd: 'cdf',
  cf: 'xaf',
  cg: 'xaf',
  ch: 'chf',
  ci: 'xof',
  cl: 'clp',
  cm: 'xaf',
  cn: 'cny',
  co: 'cop',
  cr: 'crc',
  cu: 'cup',
  cv: 'cve',
  cy: 'eur',
  cz: 'czk',
  de: 'eur',
  dj: 'djf',
  dk: 'dkk',
  dm: 'xcd',
  do: 'dop',
  dz: 'dzd',
  ec: 'usd', // dolarizado desde 2000
  ee: 'eur',
  eg: 'egp',
  er: 'ern',
  es: 'eur',
  et: 'etb',
  fi: 'eur',
  fj: 'fjd',
  fm: 'usd',
  fr: 'eur',
  ga: 'xaf',
  gb: 'gbp',
  gd: 'xcd',
  ge: 'gel',
  gh: 'ghs',
  gm: 'gmd',
  gn: 'gnf',
  gq: 'xaf',
  gr: 'eur',
  gt: 'gtq',
  gw: 'xof', // trocou o peso pelo CFA em 1997, único lusófono no bloco
  gy: 'gyd',
  hn: 'hnl',
  hr: 'eur', // desde 2023; "kuna" ainda vale. Ver o cabeçalho.
  ht: 'htg',
  hu: 'huf',
  id: 'idr',
  ie: 'eur',
  il: 'ils',
  in: 'inr',
  iq: 'iqd',
  ir: 'irr',
  is: 'isk',
  it: 'eur',
  jm: 'jmd',
  jo: 'jod',
  jp: 'jpy',
  ke: 'kes',
  kg: 'kgs',
  kh: 'khr',
  ki: 'aud',
  km: 'kmf',
  kn: 'xcd',
  kp: 'kpw',
  kr: 'krw',
  kw: 'kwd',
  kz: 'kzt',
  la: 'lak',
  lb: 'lbp',
  lc: 'xcd',
  li: 'chf', // por união aduaneira e monetária com a Suíça desde 1924
  lk: 'lkr',
  lr: 'lrd',
  ls: 'lsl',
  lt: 'eur',
  lu: 'eur',
  lv: 'eur',
  ly: 'lyd',
  ma: 'mad',
  mc: 'eur',
  md: 'mdl',
  me: 'eur', // adotado unilateralmente em 2002, sem acordo com a UE
  mg: 'mga',
  mh: 'usd',
  mk: 'mkd',
  ml: 'xof',
  mm: 'mmk',
  mn: 'mnt',
  mr: 'mru',
  mt: 'eur',
  mu: 'mur',
  mv: 'mvr',
  mw: 'mwk',
  mx: 'mxn',
  my: 'myr',
  mz: 'mzn',
  na: 'nad',
  ne: 'xof',
  ng: 'ngn',
  ni: 'nio',
  nl: 'eur',
  no: 'nok',
  np: 'npr',
  nr: 'aud', // nunca emitiu moeda própria
  nz: 'nzd',
  om: 'omr',
  pa: 'pab',
  pe: 'pen',
  pg: 'pgk',
  ph: 'php',
  pk: 'pkr',
  pl: 'pln',
  ps: 'ils', // sem moeda própria. Ver o cabeçalho.
  pt: 'eur',
  pw: 'usd',
  py: 'pyg',
  qa: 'qar',
  ro: 'ron',
  rs: 'rsd',
  ru: 'rub',
  rw: 'rwf',
  sa: 'sar',
  sb: 'sbd',
  sc: 'scr',
  sd: 'sdg',
  se: 'sek',
  sg: 'sgd',
  si: 'eur',
  sk: 'eur',
  sl: 'sle',
  sm: 'eur',
  sn: 'xof',
  so: 'sos',
  sr: 'srd',
  ss: 'ssp',
  st: 'stn',
  sv: 'usd', // dolarizado desde 2001
  sy: 'syp',
  sz: 'szl',
  td: 'xaf',
  tg: 'xof',
  th: 'thb',
  tj: 'tjs',
  tl: 'usd', // adotou o dólar na independência, em 2002
  tm: 'tmt',
  tn: 'tnd',
  to: 'top',
  tr: 'try',
  tt: 'ttd',
  tv: 'aud',
  tz: 'tzs',
  ua: 'uah',
  ug: 'ugx',
  us: 'usd',
  uy: 'uyu',
  uz: 'uzs',
  va: 'eur', // por acordo monetário, e cunha os próprios euros
  vc: 'xcd',
  ve: 'ves',
  vn: 'vnd',
  vu: 'vuv',
  ws: 'wst',
  ye: 'yer',
  za: 'zar',
  zm: 'zmw',
  zw: 'usd', // o ZiG é a oficial no papel; o dólar é o que circula. Ver o cabeçalho.
}

/** A moeda de um país, ou `undefined` se ele não estiver na cobertura dos 195. */
export const moedaDoPais = (paisId: string): Moeda | undefined => {
  const chave = MOEDA_DE_PAIS[paisId]
  return chave === undefined ? undefined : MOEDAS[chave]
}

/**
 * Quantos países desta lista usam a moeda.
 *
 * Existe porque é isso que a carta mostra no gabarito: sem o número, a vigésima
 * carta respondida "euro" é só repetição. Ver a decisão 2 do cabeçalho.
 */
export const paisesDaMoeda = (chave: string): readonly string[] =>
  Object.keys(MOEDA_DE_PAIS).filter((id) => MOEDA_DE_PAIS[id] === chave)
