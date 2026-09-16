/**
 * Os idiomas oficiais de cada um dos 195 países soberanos de `paises.ts`, em
 * português do Brasil.
 *
 * ## Por que 195 e não os 204
 *
 * O mesmo recorte de `moedas.ts`, e pela mesma razão: idioma oficial é atributo
 * de Estado, e sete dos nove territórios responderiam com a língua de quem os
 * administra. O caso que decide é o Saara Ocidental — a resposta depende
 * inteiramente de a quem se pergunta, e pôr no jogo uma carta cuja correção é
 * tomar partido numa ocupação não é rigor, é descuido. Os 204 ficam para os
 * baralhos em que território tem resposta própria: bandeira, capital, contorno no
 * mapa.
 *
 * ## O critério, que aqui é mais difícil que nas capitais
 *
 * `capitais.ts` tem uns quinze países com mais de uma sede. Aqui é pior: **69 dos
 * 195 têm mais de um idioma oficial**, e três deles têm mais de quatro. Então a estrutura muda em vez de forçar a barra — cada país tem uma
 * *lista ordenada*, não um valor com sinônimos pendurados. A alternativa
 * descartada era o molde de `CAPITAIS` (uma canônica e o resto como "sinônimo"):
 * chamar o francês do Canadá de sinônimo do inglês é mentira sobre o que a coisa
 * é, e a mentira vazaria para a tela — o gabarito mostraria uma língua só.
 *
 * **Toda língua oficial conta como acerto**, exatamente como qualquer uma das
 * três sedes da África do Sul vale nas capitais. A carta pergunta *um* idioma
 * oficial, não "o" idioma oficial, e o gabarito mostra a lista inteira, que é onde
 * o jogo ensina: quem respondeu "francês" para a Suíça descobre ali que são
 * quatro.
 *
 * **A ordem da lista (o primeiro é o que o gabarito destaca) segue, nesta ordem:**
 *
 * 1. a precedência que o próprio Estado estabelece, quando estabelece — a
 *    Constituição irlandesa diz que o irlandês é a primeira língua oficial e o
 *    inglês a segunda, e não cabe ao jogo discordar;
 * 2. quando o Estado não ordena, a mais falada como **primeira língua** — é por
 *    isso que a África do Sul abre com zulu e não com inglês;
 * 3. na dúvida, **aceitar mais**. A lista de aceitas erra para o lado de quem
 *    joga: uma língua a mais na lista, no máximo, dá um ponto a quem sabia mais
 *    que o gabarito; uma a menos corrige errado quem estava certo.
 *
 * ## Os casos difíceis, um a um
 *
 * - **África do Sul** — onze até 2023, **doze** desde a emenda que oficializou a
 *   língua de sinais sul-africana. Abre com **zulu**, a mais falada como primeira
 *   língua (uns 23%); o inglês, que é a língua de fato do governo, é a quarta em
 *   número de falantes nativos (uns 9%) e vale igual. A Constituição lista as
 *   línguas sem ordem de precedência, então o critério 1 não decide e vale o 2.
 * - **Suíça** — alemão, francês, italiano e romanche, nessa ordem, que é a da
 *   Constituição e também a de número de falantes. O romanche é oficial só para o
 *   trato com quem fala romanche, e mesmo assim entra: é oficial.
 * - **Bélgica** — neerlandês, francês e alemão. Abre com o neerlandês, falado por
 *   uns 60% do país. "flamengo" vale, porque é como se chama o neerlandês ali.
 * - **Canadá** — inglês e francês, iguais perante a Lei das Línguas Oficiais.
 *   Abre com inglês pelo critério 2.
 * - **Índia** — **não tem língua nacional**, e é o erro que o jogo mais quer
 *   desfazer. Hindi e inglês são as línguas oficiais *da União*; o Oitavo Anexo
 *   da Constituição reconhece 22 línguas, que são oficiais nos estados, não no
 *   país. A lista traz as duas da União.
 * - **Irlanda** — **irlandês** primeiro, pelo critério 1: a Constituição o chama
 *   de primeira língua oficial e o inglês de segunda. Que quase ninguém fale
 *   irlandês em casa é verdade e não muda o que está escrito lá; o inglês vale.
 * - **Singapura** — quatro oficiais (inglês, malaio, mandarim e tâmil) e o malaio
 *   é a língua *nacional*, por razões históricas. Abre com **inglês**: é a língua
 *   da administração, do ensino e a mais falada em casa desde 2020. É o caso em
 *   que os critérios 1 e 2 apontam para lados diferentes, e o 2 ganhou.
 * - **Haiti** — **crioulo haitiano** primeiro, e os dois critérios concordam: a
 *   Constituição de 1987 chama o crioulo de língua que une todos os haitianos e
 *   só então declara os dois oficiais, e o francês é falado por uma minoria.
 * - **Israel** — só **hebraico**. O árabe era co-oficial e perdeu o estatuto na
 *   Lei do Estado-Nação, de 2018, ficando com "estatuto especial". É o único
 *   lugar em que o critério 3 perde: como a lista *é* o gabarito, pôr o árabe
 *   nela para ser generoso faria a tela afirmar que Israel tem duas línguas
 *   oficiais, o que deixou de ser verdade. Quem responder "árabe" erra a carta de
 *   Israel e acerta a da Palestina, que fica na mesma tela.
 * - **Bolívia** — espanhol e mais 36 línguas indígenas, todas oficiais pela
 *   Constituição de 2009. A lista traz o espanhol e as três de maior peso
 *   (quéchua, aimará, guarani); as outras 33 são de povos de poucos milhares de
 *   falantes e cobrá-las seria outro jogo.
 * - **Timor-Leste** — tétum e **português**. O indonésio e o inglês são línguas
 *   de trabalho pela Constituição, não oficiais, e ficam fora.
 * - **Guiné Equatorial** — espanhol, francês e português, este desde 2010. É o
 *   único país africano de língua oficial espanhola.
 * - **Zimbábue** — dezesseis línguas oficiais, recorde mundial. A lista traz as
 *   três de uso real (chona, ndebele, inglês); listar as dezesseis encheria a
 *   tela sem ensinar nada.
 * - **Moldávia** — a língua oficial passou a se chamar **romeno** em 2023; antes
 *   era "moldavo", que é a mesma língua com outro nome. Os dois valem.
 * - **Mali, Burkina Faso e Níger** — os textos constitucionais recentes (2023 no
 *   Mali e em Burkina, a carta de refundação de 2025 no Níger) rebaixaram o
 *   francês a "língua de trabalho" e oficializaram as línguas nacionais. A lista abre com **francês**, que continua sendo a língua da
 *   administração e do ensino nos três, e traz também as nacionais. É decisão
 *   discutível e está aqui escrita para poder ser discutida.
 * - **Etiópia** — a Constituição não nomeia língua "oficial": o **amárico** é a
 *   língua de trabalho do governo federal, e em 2020 somaram-se oromo, somali,
 *   afar e tigrínia. Todas valem.
 * - **Eritreia** — não tem língua oficial de jure. Tigrínia, árabe e inglês são
 *   as de trabalho, e é o que a lista traz.
 * - **Estados Unidos, Reino Unido e Austrália** — nenhum dos três tem o inglês
 *   como oficial por lei ordinária; é de fato. Nos EUA uma ordem executiva de
 *   2025 o designou língua oficial, o que não é o mesmo que uma lei federal. A
 *   lista traz inglês, que é a resposta que qualquer um daria e que não está
 *   errada.
 * - **Nova Zelândia** — o maori (1987) e a língua de sinais neozelandesa (2006)
 *   são oficiais **por lei**; o inglês, que todo mundo fala, nunca foi
 *   declarado. Abre com inglês pelo critério 2, e o maori vale.
 * - **Maurício** — a Constituição só diz que o inglês é a língua do Parlamento.
 *   Na prática convivem inglês, francês e o crioulo mauriciano, que é o que se
 *   fala em casa. Os três valem.
 * - **Vaticano** — o **italiano** é a língua de trabalho do Estado; o latim é a
 *   língua oficial da Santa Sé e dos documentos. Os dois valem.
 * - **Belarus** — bielorrusso e russo são co-oficiais, o bielorrusso primeiro na
 *   Constituição, o russo dominante no uso. Critério 1, então abre com
 *   bielorrusso.
 * - **Ruanda** — quatro: kinyarwanda, inglês, francês e suaíli (este desde 2017).
 * - **Luxemburgo** — luxemburguês (a nacional), francês (a da legislação) e
 *   alemão.
 * - **Papua Nova Guiné** — tok pisin, inglês e hiri motu, num país com mais de
 *   800 línguas vivas. O tok pisin é o crioulo que serve de língua franca.
 */

export interface Idioma {
  /** A forma que o gabarito mostra. */
  readonly nome: string
  /** Grafias alternativas e os outros nomes da mesma língua. */
  readonly sinonimos: readonly string[]
}

/**
 * Catálogo de idiomas, chaveado por um slug sem acento.
 *
 * Uma linha por língua, e não por país, pelo mesmo motivo de `MOEDAS`: o inglês
 * é oficial em uns quarenta países desta lista e escrever suas grafias quarenta
 * vezes garantiria que elas divergissem.
 *
 * Formas aceitas **podem se repetir entre línguas diferentes** — "crioulo" vale
 * no Haiti, nas Seicheles e em Maurício. Isso não cria ambiguidade nenhuma: a
 * carta é de um país só, e o validador casa a forma exata antes de cogitar
 * tolerância a erro de digitação.
 */
export const IDIOMAS: Readonly<Record<string, Idioma>> = {
  afar: { nome: 'afar', sinonimos: [] },
  africaner: { nome: 'africâner', sinonimos: ['afrikaans', 'africânder'] },
  aimara: { nome: 'aimará', sinonimos: ['aymara', 'aimara'] },
  albanes: { nome: 'albanês', sinonimos: [] },
  alemao: { nome: 'alemão', sinonimos: [] },
  amarico: { nome: 'amárico', sinonimos: ['amarinya'] },
  amazigue: { nome: 'amazigue', sinonimos: ['berbere', 'tamazight', 'tamazir'] },
  arabe: { nome: 'árabe', sinonimos: [] },
  armenio: { nome: 'armênio', sinonimos: [] },
  azeri: { nome: 'azeri', sinonimos: ['azerbaijano', 'azerbaidjano'] },
  bambara: { nome: 'bambara', sinonimos: ['bamanancã'] },
  bengali: { nome: 'bengali', sinonimos: ['bengalês'] },
  bielorrusso: { nome: 'bielorrusso', sinonimos: ['bielorusso', 'belarusso'] },
  birmanes: { nome: 'birmanês', sinonimos: ['mianmarês'] },
  bislama: { nome: 'bislamá', sinonimos: ['bislama'] },
  bosnio: { nome: 'bósnio', sinonimos: [] },
  bulgaro: { nome: 'búlgaro', sinonimos: [] },
  catalao: { nome: 'catalão', sinonimos: [] },
  cazaque: { nome: 'cazaque', sinonimos: ['casaque'] },
  chichewa: { nome: 'chichewa', sinonimos: ['chinyanja', 'nianja'] },
  chona: { nome: 'chona', sinonimos: ['shona'] },
  cingales: { nome: 'cingalês', sinonimos: ['singalês', 'sinhala', 'sinhalês'] },
  comorense: { nome: 'comorense', sinonimos: ['comoriano', 'shikomor'] },
  coreano: { nome: 'coreano', sinonimos: [] },
  crioulo_haitiano: { nome: 'crioulo haitiano', sinonimos: ['crioulo', 'haitiano', 'kreyòl'] },
  crioulo_mauriciano: { nome: 'crioulo mauriciano', sinonimos: ['crioulo', 'morisyen'] },
  crioulo_seichelense: { nome: 'crioulo seichelense', sinonimos: ['crioulo', 'seselwa'] },
  croata: { nome: 'croata', sinonimos: [] },
  curdo: { nome: 'curdo', sinonimos: [] },
  dari: { nome: 'dari', sinonimos: ['persa dari'] },
  dinamarques: { nome: 'dinamarquês', sinonimos: [] },
  diula: { nome: 'diúla', sinonimos: ['dioula', 'jula'] },
  divehi: { nome: 'divehi', sinonimos: ['dhivehi', 'maldivo'] },
  dzongkha: { nome: 'dzongkha', sinonimos: ['dzonga', 'butanês'] },
  eslovaco: { nome: 'eslovaco', sinonimos: [] },
  esloveno: { nome: 'esloveno', sinonimos: [] },
  espanhol: { nome: 'espanhol', sinonimos: ['castelhano'] },
  estoniano: { nome: 'estoniano', sinonimos: ['estônio'] },
  fijiano: { nome: 'fijiano', sinonimos: ['fidjiano', 'itaukei'] },
  filipino: { nome: 'filipino', sinonimos: ['tagalo', 'tagalog'] },
  finlandes: { nome: 'finlandês', sinonimos: [] },
  frances: { nome: 'francês', sinonimos: [] },
  fula: { nome: 'fula', sinonimos: ['fulfulde', 'peul', 'fulani'] },
  georgiano: { nome: 'georgiano', sinonimos: [] },
  gilbertes: { nome: 'gilbertês', sinonimos: ['kiribati', 'gilbertino'] },
  grego: { nome: 'grego', sinonimos: [] },
  guarani: { nome: 'guarani', sinonimos: [] },
  hausa: { nome: 'hauçá', sinonimos: ['hausa', 'haussa'] },
  hebraico: { nome: 'hebraico', sinonimos: ['hebreu'] },
  hindi: { nome: 'hindi', sinonimos: ['híndi'] },
  hindustani_fiji: { nome: 'hindustâni de Fiji', sinonimos: ['hindi de Fiji', 'hindustâni'] },
  hirimotu: { nome: 'hiri motu', sinonimos: ['motu'] },
  hungaro: { nome: 'húngaro', sinonimos: ['magiar'] },
  indonesio: { nome: 'indonésio', sinonimos: ['bahasa indonésia'] },
  ingles: { nome: 'inglês', sinonimos: [] },
  irlandes: { nome: 'irlandês', sinonimos: ['gaélico', 'gaélico irlandês', 'gaeilge'] },
  islandes: { nome: 'islandês', sinonimos: [] },
  italiano: { nome: 'italiano', sinonimos: [] },
  japones: { nome: 'japonês', sinonimos: [] },
  khmer: { nome: 'khmer', sinonimos: ['cambojano', 'camerano'] },
  kikongo: { nome: 'kikongo', sinonimos: ['congo'] },
  kinyarwanda: { nome: 'kinyarwanda', sinonimos: ['ruandês', 'quiniaruanda'] },
  kirundi: { nome: 'kirundi', sinonimos: ['rundi', 'quirundi'] },
  laosiano: { nome: 'laosiano', sinonimos: ['lao', 'laociano'] },
  latim: { nome: 'latim', sinonimos: [] },
  letao: { nome: 'letão', sinonimos: ['letônio'] },
  lingala: { nome: 'lingala', sinonimos: [] },
  lituano: { nome: 'lituano', sinonimos: [] },
  luxemburgues: { nome: 'luxemburguês', sinonimos: ['letzeburguês'] },
  macedonio: { nome: 'macedônio', sinonimos: [] },
  malaio: { nome: 'malaio', sinonimos: ['bahasa melayu', 'malaísio'] },
  malgaxe: { nome: 'malgaxe', sinonimos: ['malgache', 'malagasy'] },
  maltes: { nome: 'maltês', sinonimos: [] },
  mandarim: { nome: 'mandarim', sinonimos: ['chinês', 'chinês mandarim'] },
  maori: { nome: 'maori', sinonimos: ['máori'] },
  marshalles: { nome: 'marshallês', sinonimos: ['marshalês', 'ebon'] },
  mongol: { nome: 'mongol', sinonimos: ['mongol khalkha'] },
  montenegrino: { nome: 'montenegrino', sinonimos: [] },
  more: { nome: 'moré', sinonimos: ['mooré', 'mossi'] },
  nauruano: { nome: 'nauruano', sinonimos: ['nauru'] },
  ndebele: { nome: 'ndebele', sinonimos: ['isindebele'] },
  neerlandes: { nome: 'neerlandês', sinonimos: ['holandês', 'flamengo'] },
  nepali: { nome: 'nepali', sinonimos: ['nepalês'] },
  noruegues: { nome: 'norueguês', sinonimos: [] },
  oromo: { nome: 'oromo', sinonimos: ['oromó'] },
  palauano: { nome: 'palauano', sinonimos: ['palau'] },
  pashto: { nome: 'pashto', sinonimos: ['pastó', 'pachto', 'pashtun'] },
  persa: { nome: 'persa', sinonimos: ['farsi', 'fársi'] },
  polones: { nome: 'polonês', sinonimos: ['polaco'] },
  portugues: { nome: 'português', sinonimos: [] },
  quechua: { nome: 'quéchua', sinonimos: ['quíchua', 'quechua', 'runassimi'] },
  quirguiz: { nome: 'quirguiz', sinonimos: ['quirguize', 'kirghiz'] },
  romanche: { nome: 'romanche', sinonimos: ['romanxe'] },
  romeno: { nome: 'romeno', sinonimos: ['moldavo', 'rumeno'] },
  russo: { nome: 'russo', sinonimos: [] },
  samoano: { nome: 'samoano', sinonimos: [] },
  sami: { nome: 'sami', sinonimos: ['sámi', 'lapão'] },
  sango: { nome: 'sango', sinonimos: ['sangô'] },
  sepedi: { nome: 'sepedi', sinonimos: ['sesotho do norte', 'sotho do norte', 'pedi'] },
  servio: { nome: 'sérvio', sinonimos: [] },
  sesotho: { nome: 'sesotho', sinonimos: ['sotho', 'sesoto'] },
  sinais_za: { nome: 'língua de sinais sul-africana', sinonimos: ['língua de sinais'] },
  somali: { nome: 'somali', sinonimos: ['somalí'] },
  suaili: { nome: 'suaíli', sinonimos: ['swahili', 'kiswahili', 'suaile'] },
  suazi: { nome: 'suázi', sinonimos: ['siswati', 'swati', 'suáti'] },
  sueco: { nome: 'sueco', sinonimos: [] },
  tadjique: { nome: 'tadjique', sinonimos: ['tajique', 'tadjiquistanês'] },
  tailandes: { nome: 'tailandês', sinonimos: ['tai', 'siamês'] },
  tamil: { nome: 'tâmil', sinonimos: ['tamil', 'tâmul'] },
  tcheco: { nome: 'tcheco', sinonimos: ['checo'] },
  tetum: { nome: 'tétum', sinonimos: ['tetun'] },
  tigrinia: { nome: 'tigrínia', sinonimos: ['tigrínio', 'tigrinya'] },
  tokpisin: { nome: 'tok pisin', sinonimos: ['tokpisin', 'neomelanésio'] },
  tonganes: { nome: 'tonganês', sinonimos: ['tongano', 'tonga'] },
  tshiluba: { nome: 'tshiluba', sinonimos: ['luba', 'ciluba'] },
  tsonga: { nome: 'tsonga', sinonimos: ['xitsonga'] },
  tsuana: { nome: 'tsuana', sinonimos: ['setsuana', 'setswana', 'tswana'] },
  turco: { nome: 'turco', sinonimos: [] },
  turcomeno: { nome: 'turcomeno', sinonimos: ['turcomano'] },
  tuvaluano: { nome: 'tuvaluano', sinonimos: ['tuvalu'] },
  ucraniano: { nome: 'ucraniano', sinonimos: [] },
  urdu: { nome: 'urdu', sinonimos: [] },
  uzbeque: { nome: 'uzbeque', sinonimos: ['usbeque', 'uzbequistanês'] },
  venda: { nome: 'venda', sinonimos: ['tshivenda'] },
  vietnamita: { nome: 'vietnamita', sinonimos: [] },
  xhosa: { nome: 'xhosa', sinonimos: ['isixhosa'] },
  zulu: { nome: 'zulu', sinonimos: ['isizulu'] },
}

/** Tudo que conta como acerto para uma língua, com a canônica na frente. */
export const formasDoIdioma = (i: Idioma): readonly string[] => [i.nome, ...i.sinonimos]

/**
 * País → idiomas oficiais, chaveado pelo id de `PAISES`.
 *
 * **Lista ordenada, não valor único**: o primeiro é o que o gabarito destaca, e
 * todos contam como acerto. A ordem segue os critérios do cabeçalho.
 */
export const IDIOMAS_DE_PAIS: Readonly<Record<string, readonly string[]>> = {
  ad: ['catalao'], // o único país do mundo de língua oficial catalã
  ae: ['arabe'],
  af: ['pashto', 'dari'],
  ag: ['ingles'],
  al: ['albanes'],
  am: ['armenio'],
  ao: ['portugues'],
  ar: ['espanhol'],
  at: ['alemao'],
  au: ['ingles'], // de fato: não há lei que o declare. Ver o cabeçalho.
  az: ['azeri'],
  ba: ['bosnio', 'croata', 'servio'],
  bb: ['ingles'],
  bd: ['bengali'],
  be: ['neerlandes', 'frances', 'alemao'],
  bf: ['frances', 'more', 'diula', 'fula'], // revisão de 2023. Ver o cabeçalho.
  bg: ['bulgaro'],
  bh: ['arabe'],
  bi: ['kirundi', 'frances', 'ingles'],
  bj: ['frances'],
  bn: ['malaio'],
  bo: ['espanhol', 'quechua', 'aimara', 'guarani'], // e mais 33. Ver o cabeçalho.
  br: ['portugues'],
  bs: ['ingles'],
  bt: ['dzongkha'],
  bw: ['ingles', 'tsuana'], // inglês é o oficial; o setsuana é a língua nacional
  by: ['bielorrusso', 'russo'],
  bz: ['ingles'],
  ca: ['ingles', 'frances'],
  cd: ['frances', 'lingala', 'kikongo', 'suaili', 'tshiluba'],
  cf: ['frances', 'sango'],
  cg: ['frances'],
  ch: ['alemao', 'frances', 'italiano', 'romanche'],
  ci: ['frances'],
  cl: ['espanhol'],
  cm: ['frances', 'ingles'],
  cn: ['mandarim'],
  co: ['espanhol'],
  cr: ['espanhol'],
  cu: ['espanhol'],
  cv: ['portugues'],
  cy: ['grego', 'turco'],
  cz: ['tcheco'],
  de: ['alemao'],
  dj: ['frances', 'arabe'],
  dk: ['dinamarques'],
  dm: ['ingles'],
  do: ['espanhol'],
  dz: ['arabe', 'amazigue'], // o amazigue virou oficial em 2016
  ec: ['espanhol', 'quechua'],
  ee: ['estoniano'],
  eg: ['arabe'],
  er: ['tigrinia', 'arabe', 'ingles'], // nenhuma é oficial de jure. Ver o cabeçalho.
  es: ['espanhol'],
  et: ['amarico', 'oromo', 'somali', 'afar', 'tigrinia'], // ver o cabeçalho
  fi: ['finlandes', 'sueco'],
  fj: ['ingles', 'fijiano', 'hindustani_fiji'],
  fm: ['ingles'],
  fr: ['frances'],
  ga: ['frances'],
  gb: ['ingles'], // de fato: não há lei que o declare. Ver o cabeçalho.
  gd: ['ingles'],
  ge: ['georgiano'],
  gh: ['ingles'],
  gm: ['ingles'],
  gn: ['frances'],
  gq: ['espanhol', 'frances', 'portugues'], // ver o cabeçalho
  gr: ['grego'],
  gt: ['espanhol'],
  gw: ['portugues'],
  gy: ['ingles'],
  hn: ['espanhol'],
  hr: ['croata'],
  ht: ['crioulo_haitiano', 'frances'], // ver o cabeçalho
  hu: ['hungaro'],
  id: ['indonesio'],
  ie: ['irlandes', 'ingles'], // a Constituição ordena assim. Ver o cabeçalho.
  il: ['hebraico'], // o árabe perdeu a co-oficialidade em 2018. Ver o cabeçalho.
  in: ['hindi', 'ingles'], // as duas da União; não há língua nacional.
  iq: ['arabe', 'curdo'],
  ir: ['persa'],
  is: ['islandes'],
  it: ['italiano'],
  jm: ['ingles'],
  jo: ['arabe'],
  jp: ['japones'],
  ke: ['suaili', 'ingles'], // o suaíli é a nacional e as duas são oficiais
  kg: ['quirguiz', 'russo'],
  kh: ['khmer'],
  ki: ['gilbertes', 'ingles'],
  km: ['comorense', 'arabe', 'frances'],
  kn: ['ingles'],
  kp: ['coreano'],
  kr: ['coreano'],
  kw: ['arabe'],
  kz: ['cazaque', 'russo'], // o cazaque é a língua do Estado, o russo é oficial
  la: ['laosiano'],
  lb: ['arabe'],
  lc: ['ingles'],
  li: ['alemao'],
  lk: ['cingales', 'tamil'],
  lr: ['ingles'],
  ls: ['sesotho', 'ingles'],
  lt: ['lituano'],
  lu: ['luxemburgues', 'frances', 'alemao'],
  lv: ['letao'],
  ly: ['arabe'],
  ma: ['arabe', 'amazigue'], // o amazigue virou oficial em 2011
  mc: ['frances'],
  md: ['romeno'], // rebatizada de "moldavo" para "romeno" em 2023
  me: ['montenegrino'],
  mg: ['malgaxe', 'frances'],
  mh: ['marshalles', 'ingles'],
  mk: ['macedonio', 'albanes'],
  ml: ['frances', 'bambara'], // Constituição de 2023. Ver o cabeçalho.
  mm: ['birmanes'],
  mn: ['mongol'],
  mr: ['arabe'],
  mt: ['maltes', 'ingles'],
  mu: ['ingles', 'frances', 'crioulo_mauriciano'], // ver o cabeçalho
  mv: ['divehi'],
  mw: ['ingles', 'chichewa'],
  mx: ['espanhol'], // de fato; a lei de 2003 pôs 68 indígenas como nacionais
  my: ['malaio'],
  mz: ['portugues'],
  na: ['ingles'], // único oficial, num país onde quase ninguém o tem como materna
  ne: ['frances', 'hausa'], // carta de refundação de 2025. Ver o cabeçalho.
  ng: ['ingles'],
  ni: ['espanhol'],
  nl: ['neerlandes'],
  no: ['noruegues', 'sami'],
  np: ['nepali'],
  nr: ['nauruano', 'ingles'],
  nz: ['ingles', 'maori'], // ver o cabeçalho
  om: ['arabe'],
  pa: ['espanhol'],
  pe: ['espanhol', 'quechua', 'aimara'],
  pg: ['tokpisin', 'ingles', 'hirimotu'],
  ph: ['filipino', 'ingles'],
  pk: ['urdu', 'ingles'], // o urdu é a nacional, os dois são oficiais
  pl: ['polones'],
  ps: ['arabe'],
  pt: ['portugues'],
  pw: ['palauano', 'ingles'],
  py: ['espanhol', 'guarani'],
  qa: ['arabe'],
  ro: ['romeno'],
  rs: ['servio'],
  ru: ['russo'],
  rw: ['kinyarwanda', 'ingles', 'frances', 'suaili'],
  sa: ['arabe'],
  sb: ['ingles'],
  sc: ['crioulo_seichelense', 'ingles', 'frances'],
  sd: ['arabe', 'ingles'],
  se: ['sueco'],
  sg: ['ingles', 'malaio', 'mandarim', 'tamil'], // ver o cabeçalho
  si: ['esloveno'],
  sk: ['eslovaco'],
  sl: ['ingles'],
  sm: ['italiano'],
  sn: ['frances'],
  so: ['somali', 'arabe'],
  sr: ['neerlandes'], // o único país das Américas de língua oficial neerlandesa
  ss: ['ingles'],
  st: ['portugues'],
  sv: ['espanhol'],
  sy: ['arabe'],
  sz: ['suazi', 'ingles'],
  td: ['frances', 'arabe'],
  tg: ['frances'],
  th: ['tailandes'],
  tj: ['tadjique'],
  tl: ['tetum', 'portugues'], // ver o cabeçalho
  tm: ['turcomeno'],
  tn: ['arabe'],
  to: ['tonganes', 'ingles'],
  tr: ['turco'],
  tt: ['ingles'],
  tv: ['tuvaluano', 'ingles'],
  tz: ['suaili', 'ingles'],
  ua: ['ucraniano'],
  ug: ['ingles', 'suaili'],
  us: ['ingles'], // por ordem executiva de 2025, não por lei. Ver o cabeçalho.
  uy: ['espanhol'],
  uz: ['uzbeque'],
  va: ['italiano', 'latim'], // ver o cabeçalho
  vc: ['ingles'],
  ve: ['espanhol'],
  vn: ['vietnamita'],
  vu: ['bislama', 'ingles', 'frances'],
  ws: ['samoano', 'ingles'],
  ye: ['arabe'],
  za: [
    // Doze desde 2023, sem precedência entre si na Constituição; a ordem aqui é
    // por número de falantes nativos. Ver o cabeçalho.
    'zulu', 'xhosa', 'africaner', 'ingles', 'sepedi', 'tsuana',
    'sesotho', 'tsonga', 'suazi', 'venda', 'ndebele', 'sinais_za',
  ],
  zm: ['ingles'],
  zw: ['chona', 'ndebele', 'ingles'], // três das dezesseis. Ver o cabeçalho.
}

/** Os idiomas de um país, já resolvidos; vazio se ele não está na cobertura. */
export const idiomasDoPais = (paisId: string): readonly Idioma[] =>
  (IDIOMAS_DE_PAIS[paisId] ?? []).flatMap((chave) => {
    const i = IDIOMAS[chave]
    return i === undefined ? [] : [i]
  })

/**
 * Tudo que conta como acerto na carta de um país: a união das formas de todas as
 * línguas oficiais, sem repetição.
 *
 * O `Set` não é zelo à toa — "crioulo" é forma aceita de três línguas, e um país
 * com duas delas na lista traria a forma duas vezes.
 */
export const formasAceitas = (idiomas: readonly Idioma[]): readonly string[] => [
  ...new Set(idiomas.flatMap((i) => formasDoIdioma(i))),
]

/** Os países desta lista em que a língua é oficial. */
export const paisesDoIdioma = (chave: string): readonly string[] =>
  Object.keys(IDIOMAS_DE_PAIS).filter((id) => IDIOMAS_DE_PAIS[id]?.includes(chave) ?? false)
