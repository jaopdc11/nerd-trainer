/**
 * Deuses gregos e egípcios, num baralho só.
 *
 * ## Por que existe o campo `panteao`
 *
 * **Sem ele o jogo não funciona, e essa é a razão de ser deste arquivo.** Uma
 * carta que diz apenas "deus do sol" tem duas respostas certas: Hélios, que
 * conduz o carro solar na Grécia, e Rá, que navega o céu no Egito. "Deus do
 * mundo dos mortos" tem Hades e Osíris. "Deusa do amor" tem Afrodite e Hathor.
 * "Deus da sabedoria e da escrita" tem Atena e Tot. Misturar os dois panteões
 * sem dizer qual deles está sendo perguntado transforma metade do baralho numa
 * loteria em que o jogador sabe a resposta e mesmo assim erra.
 *
 * A saída óbvia — separar em dois jogos — foi descartada: os dois panteões
 * juntos são mais interessantes justamente porque se espelham, e o par
 * Hélios/Rá é a melhor pergunta do baralho, não o seu defeito. A outra saída —
 * escolher domínios que não colidem — custaria as cartas mais importantes de
 * cada lado.
 *
 * Então **o panteão faz parte do enunciado, sempre**, e é `enunciado()` que
 * garante isso: nenhuma carta é montada sem o prefixo. `mitologia.test.ts` tem
 * um teste que falha se alguma carta chegar à tela sem ele, e outro que exige
 * que as colisões entre panteões continuem existindo — se um dia alguém
 * "limpar" o dataset tirando Hélios, o campo `panteao` viraria decoração e a
 * próxima pessoa o removeria sem entender o que estava desfazendo.
 *
 * ## Ambiguidade dentro do mesmo panteão
 *
 * O prefixo é necessário e não é suficiente: na Grécia, Hélios e Apolo disputam
 * o Sol, e Ártemis e Selene disputam a Lua. Isso se resolve no texto do
 * `dominio`, que nesses casos não é um rótulo, é uma identificação — "o titã
 * que conduz o carro do Sol" só serve para Hélios. Selene ficou de fora por
 * isso: com Ártemis no baralho, não há enunciado curto que separe as duas sem
 * virar charada.
 *
 * ## Deuses que acumulam domínios
 *
 * Quase todo deus grande é deus de várias coisas ao mesmo tempo, e esconder
 * isso faria a carta parecer mais simples do que o assunto é. O campo `acumula`
 * registra os outros domínios do mesmo deus e vai para o gabarito: quem
 * respondeu "Ártemis" para a caça fica sabendo, ali, que ela também é a Lua e
 * os partos. O `dominio` perguntado é sempre o mais reconhecível; `acumula`
 * carrega o resto.
 *
 * ## Nomes romanos não valem
 *
 * A carta diz "grego:" e "egípcio:". Responder "Netuno" a uma carta que pediu o
 * deus grego do mar não é um erro de digitação, é responder outro panteão — e
 * aceitar isso apagaria a única regra que o jogo tem. Os nomes romanos ficam
 * fora das formas aceitas, de propósito, e há teste para isso.
 */

export const PANTEOES = ['grego', 'egipcio'] as const
export type Panteao = (typeof PANTEOES)[number]

/**
 * Como o panteão aparece na carta. A chave é sem acento porque é identificador;
 * o rótulo é o que o jogador lê, e aí sim é português correto.
 */
export const ROTULO_PANTEAO: Record<Panteao, string> = {
  grego: 'grego',
  egipcio: 'egípcio',
}

export interface Divindade {
  readonly id: string
  readonly panteao: Panteao
  /** O que a carta pergunta, já sem o panteão — ele é acrescentado por `enunciado`. */
  readonly dominio: string
  readonly nome: string
  readonly aceitas: readonly string[]
  /** Os outros domínios do mesmo deus, quando ele acumula. Vai para o gabarito. */
  readonly acumula?: string
}

/**
 * O texto que vai para a carta. **Único ponto em que o enunciado é montado**:
 * se cada jogo concatenasse por conta própria, a regra do panteão duraria até
 * alguém esquecer.
 */
export const enunciado = (d: Divindade): string => `${ROTULO_PANTEAO[d.panteao]}: ${d.dominio}`

export const OLIMPO: readonly Divindade[] = [
  {
    id: 'zeus',
    panteao: 'grego',
    dominio: 'rei dos deuses, senhor do raio',
    nome: 'Zeus',
    aceitas: ['Zeus'],
    acumula: 'céu, raio, hospitalidade e a ordem entre os deuses',
  },
  {
    id: 'poseidon',
    panteao: 'grego',
    dominio: 'deus do mar',
    nome: 'Poseidon',
    aceitas: ['Poseidon', 'Posídon', 'Poseidão'],
    acumula: 'mar, terremotos e cavalos',
  },
  {
    id: 'hades',
    panteao: 'grego',
    dominio: 'deus do mundo dos mortos',
    nome: 'Hades',
    aceitas: ['Hades'],
    acumula: 'os mortos e as riquezas do subsolo',
  },
  {
    id: 'hera',
    panteao: 'grego',
    dominio: 'rainha dos deuses, do casamento',
    nome: 'Hera',
    aceitas: ['Hera'],
  },
  {
    id: 'atena',
    panteao: 'grego',
    dominio: 'deusa da sabedoria e da guerra pensada',
    nome: 'Atena',
    aceitas: ['Atena', 'Athena', 'Palas Atena'],
    acumula: 'sabedoria, estratégia, artesanato e a proteção de Atenas',
  },
  {
    // Ares e Atena dividem a guerra, e é por isso que os dois enunciados dizem
    // *que tipo* de guerra: sem isso, as duas cartas ficariam intercambiáveis
    // dentro do mesmo panteão — o mesmo problema que o prefixo resolve entre
    // panteões.
    id: 'ares',
    panteao: 'grego',
    dominio: 'deus da guerra bruta, do massacre',
    nome: 'Ares',
    aceitas: ['Ares'],
  },
  {
    id: 'afrodite',
    panteao: 'grego',
    dominio: 'deusa do amor e da beleza',
    nome: 'Afrodite',
    aceitas: ['Afrodite'],
  },
  {
    id: 'hefesto',
    panteao: 'grego',
    dominio: 'deus da forja e do fogo dos artesãos',
    nome: 'Hefesto',
    aceitas: ['Hefesto', 'Hefaísto', 'Hefaistos'],
    acumula: 'forja, metalurgia, fogo e a técnica dos artesãos',
  },
  {
    id: 'hermes',
    panteao: 'grego',
    dominio: 'mensageiro dos deuses, de sandálias aladas',
    nome: 'Hermes',
    aceitas: ['Hermes'],
    acumula: 'comércio, viajantes, ladrões, eloquência e a condução das almas',
  },
  {
    // "Deusa da Lua" sozinho seria de Ártemis e de Selene ao mesmo tempo. A
    // caça identifica Ártemis e mais ninguém; a Lua entra no `acumula`.
    id: 'artemis',
    panteao: 'grego',
    dominio: 'deusa da caça e dos animais selvagens',
    nome: 'Ártemis',
    aceitas: ['Ártemis', 'Artemis'],
    acumula: 'caça, Lua, natureza selvagem e os partos',
  },
  {
    // Hélios e Apolo: o par que mais exige o texto longo. Apolo é "deus do Sol"
    // em quase toda aula de escola, e Hélios é quem de fato dirige o carro.
    id: 'apolo',
    panteao: 'grego',
    dominio: 'deus da música e das profecias, senhor do oráculo de Delfos',
    nome: 'Apolo',
    aceitas: ['Apolo', 'Apollo'],
    acumula: 'luz, música, poesia, profecia, arco e medicina',
  },
  {
    id: 'helios',
    panteao: 'grego',
    dominio: 'o titã que conduz o carro do Sol pelo céu',
    nome: 'Hélios',
    aceitas: ['Hélios', 'Helios'],
  },
  {
    id: 'demeter',
    panteao: 'grego',
    dominio: 'deusa da agricultura e das colheitas',
    nome: 'Deméter',
    aceitas: ['Deméter', 'Demeter'],
    acumula: 'agricultura, colheita e o ciclo das estações',
  },
  {
    id: 'dioniso',
    panteao: 'grego',
    dominio: 'deus do vinho e do êxtase',
    nome: 'Dioniso',
    aceitas: ['Dioniso', 'Dionísio', 'Dionisos'],
    acumula: 'vinho, festa, êxtase, teatro e loucura ritual',
  },
  {
    id: 'hestia',
    panteao: 'grego',
    dominio: 'deusa do lar e do fogo sagrado da casa',
    nome: 'Héstia',
    aceitas: ['Héstia', 'Hestia'],
  },
  {
    id: 'prometeu',
    panteao: 'grego',
    dominio: 'o titã que roubou o fogo dos deuses e o deu aos homens',
    nome: 'Prometeu',
    aceitas: ['Prometeu', 'Prometheus'],
  },
  {
    // Cronos, o titã que devora os filhos, não é Chronos, a personificação do
    // tempo. A confusão é antiga e o enunciado evita o assunto: fala do que ele
    // fez, não do que ele representa.
    id: 'cronos',
    panteao: 'grego',
    dominio: 'o titã que devorou os próprios filhos e foi destronado por Zeus',
    nome: 'Cronos',
    aceitas: ['Cronos', 'Crono', 'Kronos'],
  },
]

export const EGITO: readonly Divindade[] = [
  {
    id: 'ra',
    panteao: 'egipcio',
    dominio: 'deus do Sol',
    nome: 'Rá',
    aceitas: ['Rá', 'Ra', 'Rê', 'Re'],
    acumula: 'Sol, criação e a realeza do faraó',
  },
  {
    id: 'osiris',
    panteao: 'egipcio',
    dominio: 'deus do mundo dos mortos, que julga as almas',
    nome: 'Osíris',
    aceitas: ['Osíris', 'Osiris'],
    acumula: 'os mortos, a ressurreição, a agricultura e o julgamento final',
  },
  {
    // Anúbis e Osíris dividem o mundo dos mortos, e a divisão é de função: um
    // julga, o outro embalsama. Os dois enunciados dizem qual é qual.
    id: 'anubis',
    panteao: 'egipcio',
    dominio: 'o embalsamador com cabeça de chacal, guia dos mortos',
    nome: 'Anúbis',
    aceitas: ['Anúbis', 'Anubis'],
  },
  {
    id: 'isis',
    panteao: 'egipcio',
    dominio: 'deusa da magia, que remontou o corpo do marido',
    nome: 'Ísis',
    aceitas: ['Ísis', 'Isis'],
    acumula: 'magia, cura, maternidade e a proteção dos mortos',
  },
  {
    id: 'horus',
    panteao: 'egipcio',
    dominio: 'deus do céu com cabeça de falcão, filho de Ísis e Osíris',
    nome: 'Hórus',
    aceitas: ['Hórus', 'Horus', 'Hór'],
    acumula: 'céu, realeza e a proteção do faraó vivo',
  },
  {
    id: 'set',
    panteao: 'egipcio',
    dominio: 'deus do caos e do deserto, assassino de Osíris',
    nome: 'Set',
    aceitas: ['Set', 'Seth'],
    acumula: 'caos, deserto, tempestade, violência e as terras estrangeiras',
  },
  {
    id: 'tot',
    panteao: 'egipcio',
    dominio: 'deus da escrita e da sabedoria, com cabeça de íbis',
    nome: 'Tot',
    aceitas: ['Tot', 'Thoth', 'Toth', 'Djehuti'],
    acumula: 'escrita, sabedoria, magia, cálculo e a Lua',
  },
  {
    id: 'maat',
    panteao: 'egipcio',
    dominio: 'a deusa da verdade e da ordem, cuja pena pesa o coração na balança',
    nome: 'Maat',
    aceitas: ['Maat', "Ma'at", 'Maát'],
    acumula: 'verdade, justiça, equilíbrio e a ordem cósmica',
  },
  {
    id: 'sekhmet',
    panteao: 'egipcio',
    dominio: 'deusa da guerra com cabeça de leoa',
    nome: 'Sekhmet',
    aceitas: ['Sekhmet', 'Sakhmet', 'Sacmis'],
    acumula: 'guerra, vingança, peste e também a cura',
  },
  {
    id: 'hathor',
    panteao: 'egipcio',
    dominio: 'deusa do amor e da música, com chifres de vaca',
    nome: 'Hathor',
    aceitas: ['Hathor', 'Athor', 'Hator'],
    acumula: 'amor, música, alegria, maternidade e o acolhimento dos mortos',
  },
  {
    id: 'ptah',
    panteao: 'egipcio',
    dominio: 'o deus criador de Mênfis, padroeiro dos artesãos',
    nome: 'Ptah',
    aceitas: ['Ptah', 'Ptá'],
    acumula: 'criação pelo verbo, artesãos, arquitetos e escultores',
  },
  {
    id: 'amon',
    panteao: 'egipcio',
    dominio: 'o deus oculto de Tebas, que virou rei dos deuses ao se fundir ao Sol',
    nome: 'Amon',
    aceitas: ['Amon', 'Amun', 'Amón', 'Ámon'],
    acumula: 'o invisível, o vento, Tebas e — como Amon-Rá — a realeza',
  },
  {
    id: 'nut',
    panteao: 'egipcio',
    dominio: 'deusa do céu, que engole o Sol ao anoitecer e o pare de manhã',
    nome: 'Nut',
    aceitas: ['Nut', 'Nuit'],
  },
  {
    id: 'geb',
    panteao: 'egipcio',
    dominio: 'deus da terra, marido de Nut',
    nome: 'Geb',
    aceitas: ['Geb', 'Gueb', 'Keb'],
  },
  {
    id: 'bastet',
    panteao: 'egipcio',
    dominio: 'a deusa gata, protetora do lar e das casas',
    nome: 'Bastet',
    aceitas: ['Bastet', 'Bast'],
    acumula: 'lar, gatos, fertilidade e a proteção contra doenças',
  },
  {
    id: 'hapi',
    panteao: 'egipcio',
    dominio: 'o deus da cheia do Nilo',
    nome: 'Hapi',
    aceitas: ['Hapi', 'Hapy', 'Hápi'],
  },
]

/** Os dois panteões, na ordem em que o baralho os declara. */
export const DIVINDADES: readonly Divindade[] = [...OLIMPO, ...EGITO]

/**
 * Nomes romanos e outros panteões: **recusados de propósito**.
 *
 * Existe aqui, e não solto no teste, porque é uma regra do dataset e não do
 * teste: se um dia alguém resolver aceitar os nomes romanos, vai ter de apagar
 * esta lista e explicar por quê.
 */
export const NOMES_RECUSADOS: readonly string[] = [
  'Júpiter',
  'Netuno',
  'Plutão',
  'Juno',
  'Minerva',
  'Marte',
  'Vênus',
  'Vulcano',
  'Mercúrio',
  'Diana',
  'Ceres',
  'Baco',
  'Vesta',
  'Saturno',
  'Sol Invictus',
]
