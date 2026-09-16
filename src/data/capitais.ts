/**
 * A capital de cada um dos 195 países de `paises.ts`, em português do Brasil.
 *
 * **Escrito à mão, e por um motivo.** A lista crua sai do `world-countries`
 * (campo `capital`), mas em inglês: `Moscow`, `Beijing`, `Copenhagen`, `Bern`.
 * Importar aquilo direto colocaria o jogo ensinando "Warsaw" para Varsóvia, que
 * é o mesmo defeito do "Azoto" na tabela periódica — só que pior, porque aqui
 * nem tradução ruim é: é a língua errada. Então cada nome foi traduzido e
 * conferido um a um, e `capitais.test.ts` guarda a regressão com uma lista de
 * âncoras em inglês que não podem reaparecer.
 *
 * O mesmo id ISO 3166-1 alfa-2 minúsculo de `paises.ts` é a chave — o teste
 * garante a bijeção nos dois sentidos, então acrescentar país sem acrescentar
 * capital quebra o build de testes.
 *
 * ## Capital é decisão, não fato
 *
 * Em uns quinze casos "a capital" não é uma coisa só. Como o jogo precisa de
 * **uma** resposta para mostrar no gabarito, cada caso abaixo tem uma canônica
 * escolhida (em geral a capital *oficial/constitucional*, não a maior cidade
 * nem a sede do executivo) e as outras formas entram como aceitas, para não
 * recusar quem sabe mais que o gabarito:
 *
 * - **África do Sul** — três, por desenho constitucional: Pretória (executivo),
 *   Cidade do Cabo (legislativo), Bloemfontein (judiciário). Canônica
 *   **Pretória**, que é a que a ONU e os atlas listam; as outras duas valem.
 * - **Bolívia** — Sucre é a capital constitucional, La Paz é a sede do governo.
 *   Canônica **Sucre**; La Paz vale.
 * - **Israel** — Jerusalém é a capital declarada e a sede de fato de governo,
 *   parlamento e suprema corte; boa parte das embaixadas fica em Tel Aviv e o
 *   reconhecimento internacional é disputado. Canônica **Jerusalém**; Tel Aviv
 *   vale, porque recusá-la seria fingir que a disputa não existe.
 * - **Palestina** — Jerusalém Oriental é a capital declarada, Ramallah é a sede
 *   administrativa real. Canônica **Ramallah**, que é onde o governo despacha;
 *   Jerusalém vale.
 * - **Países Baixos** — Amsterdã é a capital pela Constituição, Haia é a sede
 *   do governo, do parlamento e da corte. Canônica **Amsterdã**; Haia vale.
 * - **Essuatíni** — Mbabane é a capital administrativa, Lobamba é a legislativa
 *   e a residência real (é ela que o `world-countries` traz). Canônica
 *   **Mbabane**, mais usada; Lobamba vale.
 * - **Costa do Marfim** — Yamoussoukro é a capital oficial desde 1983, Abidjã
 *   concentra governo e embaixadas. Canônica **Yamoussoukro**; Abidjã vale.
 * - **Benin** — Porto-Novo é a capital oficial, Cotonu é a sede do governo.
 *   Canônica **Porto-Novo**; Cotonu vale.
 * - **Tanzânia** — Dodoma é a capital desde 1996, Dar es Salaam continua com
 *   boa parte da máquina pública. Canônica **Dodoma**; Dar es Salaam vale.
 * - **Sri Lanka** — Sri Jayawardenepura Kotte é a capital oficial (é onde fica
 *   o parlamento), Colombo é a capital comercial e o que todo mundo responde.
 *   Canônica **Colombo**, aqui abrindo exceção à regra do "oficial primeiro":
 *   exigir "Sri Jayawardenepura Kotte" digitado seria um teste de datilografia.
 * - **Malásia** — Kuala Lumpur é a capital, Putrajaia é a sede administrativa
 *   desde 1999. Canônica **Kuala Lumpur**; Putrajaia vale.
 * - **Burundi** — Gitega é a capital política desde 2019, Bujumbura era a antiga
 *   e segue como capital econômica. Canônica **Gitega**; Bujumbura vale, porque
 *   a troca é recente e metade dos mapas impressos ainda diz Bujumbura.
 * - **Indonésia** — Jacarta é a capital; Nusantara foi designada por lei em 2022
 *   e a transferência ainda está em curso. Canônica **Jacarta**; Nusantara vale.
 * - **Cazaquistão** — Astana, que se chamou Nur-Sultan entre 2019 e 2022.
 *   Canônica **Astana**; Nur-Sultan vale.
 * - **Iêmen** — Sanaa é a capital constitucional, sob controle houthi desde
 *   2014; Áden é a sede provisória do governo reconhecido. Canônica **Sanaa**;
 *   Áden vale.
 * - **Nauru** — não tem capital oficial nenhuma. Yaren é o distrito onde fica o
 *   parlamento e é o que todas as listas registram. Canônica **Yaren**.
 * - **Vaticano** — o Estado *é* a cidade. Canônica **Cidade do Vaticano**, e
 *   "Vaticano" vale, ainda que a pergunta seja o próprio nome do país.
 * - **Estados Unidos** — canônica **Washington**, com "Washington, D.C." como
 *   forma aceita: ninguém digita a vírgula e os pontos contra o relógio.
 *
 * Nos demais casos as formas aceitas são só grafia: o aportuguesamento e o
 * original convivendo ("Cabul"/"Kabul", "Bangkok"/"Banguecoque"), já que acento
 * e caixa o normalizador resolve sozinho.
 */

export interface Capital {
  /** A forma que o gabarito mostra. */
  readonly nome: string
  /** Grafias alternativas e as outras sedes, quando o país tem mais de uma. */
  readonly sinonimos: readonly string[]
}

/** Tudo que conta como acerto, com a canônica na frente. */
export const formasAceitas = (c: Capital): readonly string[] => [c.nome, ...c.sinonimos]

/** Chaveado pelo id de `PAISES` — ISO 3166-1 alfa-2 em minúsculas. */
export const CAPITAIS: Readonly<Record<string, Capital>> = {
  ad: { nome: 'Andorra-a-Velha', sinonimos: ['Andorra la Vella'] },
  ae: { nome: 'Abu Dhabi', sinonimos: ['Abu Dabi'] },
  af: { nome: 'Cabul', sinonimos: ['Kabul'] },
  ag: { nome: "Saint John's", sinonimos: ["St. John's"] },
  al: { nome: 'Tirana', sinonimos: [] },
  am: { nome: 'Erevan', sinonimos: ['Erevã', 'Yerevan', 'Ierevan'] },
  ao: { nome: 'Luanda', sinonimos: [] },
  ar: { nome: 'Buenos Aires', sinonimos: [] },
  at: { nome: 'Viena', sinonimos: [] },
  au: { nome: 'Canberra', sinonimos: ['Camberra'] },
  az: { nome: 'Baku', sinonimos: ['Bacu'] },
  ba: { nome: 'Sarajevo', sinonimos: ['Saraievo'] },
  bb: { nome: 'Bridgetown', sinonimos: [] },
  bd: { nome: 'Daca', sinonimos: ['Dhaka'] },
  be: { nome: 'Bruxelas', sinonimos: [] },
  bf: { nome: 'Uagadugu', sinonimos: ['Ouagadougou'] },
  bg: { nome: 'Sófia', sinonimos: [] },
  bh: { nome: 'Manama', sinonimos: [] },
  // Capital política desde 2019; Bujumbura era a antiga. Ver o cabeçalho.
  bi: { nome: 'Gitega', sinonimos: ['Bujumbura'] },
  // Capital oficial; Cotonu é a sede do governo. Ver o cabeçalho.
  bj: { nome: 'Porto-Novo', sinonimos: ['Cotonu', 'Cotonou'] },
  bn: { nome: 'Bandar Seri Begawan', sinonimos: [] },
  // Capital constitucional; La Paz é a sede do governo. Ver o cabeçalho.
  bo: { nome: 'Sucre', sinonimos: ['La Paz'] },
  br: { nome: 'Brasília', sinonimos: [] },
  bs: { nome: 'Nassau', sinonimos: [] },
  bt: { nome: 'Thimphu', sinonimos: ['Timbu', 'Timphu'] },
  bw: { nome: 'Gaborone', sinonimos: [] },
  by: { nome: 'Minsk', sinonimos: ['Minsque'] },
  bz: { nome: 'Belmopan', sinonimos: [] },
  ca: { nome: 'Ottawa', sinonimos: ['Otava'] },
  cd: { nome: 'Kinshasa', sinonimos: ['Quinxassa'] },
  cf: { nome: 'Bangui', sinonimos: [] },
  cg: { nome: 'Brazzaville', sinonimos: [] },
  ch: { nome: 'Berna', sinonimos: [] },
  // Capital oficial desde 1983; Abidjã é a sede do governo. Ver o cabeçalho.
  ci: { nome: 'Yamoussoukro', sinonimos: ['Iamussucro', 'Abidjã', 'Abidjan'] },
  cl: { nome: 'Santiago', sinonimos: ['Santiago do Chile'] },
  cm: { nome: 'Iaundé', sinonimos: ['Yaoundé', 'Yaunde'] },
  cn: { nome: 'Pequim', sinonimos: ['Beijing'] },
  co: { nome: 'Bogotá', sinonimos: [] },
  cr: { nome: 'San José', sinonimos: ['São José'] },
  cu: { nome: 'Havana', sinonimos: [] },
  cv: { nome: 'Praia', sinonimos: ['Cidade da Praia'] },
  cy: { nome: 'Nicósia', sinonimos: [] },
  cz: { nome: 'Praga', sinonimos: [] },
  de: { nome: 'Berlim', sinonimos: [] },
  dj: { nome: 'Djibuti', sinonimos: ['Djibouti'] },
  dk: { nome: 'Copenhague', sinonimos: ['Copenhaga'] },
  dm: { nome: 'Roseau', sinonimos: [] },
  do: { nome: 'Santo Domingo', sinonimos: ['São Domingos'] },
  dz: { nome: 'Argel', sinonimos: [] },
  ec: { nome: 'Quito', sinonimos: [] },
  ee: { nome: 'Tallinn', sinonimos: ['Talim', 'Talin'] },
  eg: { nome: 'Cairo', sinonimos: [] },
  er: { nome: 'Asmara', sinonimos: [] },
  es: { nome: 'Madri', sinonimos: ['Madrid'] },
  et: { nome: 'Adis Abeba', sinonimos: ['Addis Abeba'] },
  fi: { nome: 'Helsinque', sinonimos: ['Helsinki', 'Helsínquia'] },
  fj: { nome: 'Suva', sinonimos: [] },
  fm: { nome: 'Palikir', sinonimos: [] },
  fr: { nome: 'Paris', sinonimos: [] },
  ga: { nome: 'Libreville', sinonimos: ['Librevile'] },
  gb: { nome: 'Londres', sinonimos: [] },
  gd: { nome: "Saint George's", sinonimos: ["St. George's", 'São Jorge'] },
  ge: { nome: 'Tbilisi', sinonimos: ['Tblisi', 'Tiblíssi'] },
  gh: { nome: 'Acra', sinonimos: ['Accra'] },
  gm: { nome: 'Banjul', sinonimos: [] },
  gn: { nome: 'Conacri', sinonimos: ['Conakry'] },
  gq: { nome: 'Malabo', sinonimos: [] },
  gr: { nome: 'Atenas', sinonimos: [] },
  gt: { nome: 'Cidade da Guatemala', sinonimos: ['Guatemala'] },
  gw: { nome: 'Bissau', sinonimos: [] },
  gy: { nome: 'Georgetown', sinonimos: [] },
  hn: { nome: 'Tegucigalpa', sinonimos: [] },
  hr: { nome: 'Zagreb', sinonimos: ['Zagrebe'] },
  ht: { nome: 'Porto Príncipe', sinonimos: ['Port-au-Prince'] },
  hu: { nome: 'Budapeste', sinonimos: [] },
  // Nusantara foi designada em 2022 e a mudança ainda corre. Ver o cabeçalho.
  id: { nome: 'Jacarta', sinonimos: ['Jakarta', 'Nusantara'] },
  ie: { nome: 'Dublin', sinonimos: ['Dublim'] },
  // Capital declarada e sede de fato; Tel Aviv concentra as embaixadas.
  il: { nome: 'Jerusalém', sinonimos: ['Tel Aviv', 'Tel Aviv-Yafo'] },
  in: { nome: 'Nova Délhi', sinonimos: ['Nova Deli', 'Nova Delhi'] },
  iq: { nome: 'Bagdá', sinonimos: ['Bagdade'] },
  ir: { nome: 'Teerã', sinonimos: ['Teerão', 'Teheran'] },
  is: { nome: 'Reiquiavique', sinonimos: ['Reykjavik'] },
  it: { nome: 'Roma', sinonimos: [] },
  jm: { nome: 'Kingston', sinonimos: [] },
  jo: { nome: 'Amã', sinonimos: ['Amman', 'Aman'] },
  jp: { nome: 'Tóquio', sinonimos: ['Tokyo'] },
  ke: { nome: 'Nairóbi', sinonimos: [] },
  kg: { nome: 'Bishkek', sinonimos: ['Bisqueque', 'Bichkek'] },
  kh: { nome: 'Phnom Penh', sinonimos: ['Pnom Pene', 'Phnom Pene'] },
  ki: { nome: 'Tarawa do Sul', sinonimos: ['Tarawa', 'South Tarawa'] },
  km: { nome: 'Moroni', sinonimos: [] },
  kn: { nome: 'Basseterre', sinonimos: [] },
  kp: { nome: 'Pyongyang', sinonimos: ['Pionguiangue', 'Piongiangue'] },
  kr: { nome: 'Seul', sinonimos: ['Seoul'] },
  kw: { nome: 'Cidade do Kuwait', sinonimos: ['Kuwait', 'Al Kuwait'] },
  // Chamou-se Nur-Sultan entre 2019 e 2022. Ver o cabeçalho.
  kz: { nome: 'Astana', sinonimos: ['Nur-Sultan', 'Nursultan'] },
  la: { nome: 'Vientiane', sinonimos: ['Vienciana'] },
  lb: { nome: 'Beirute', sinonimos: [] },
  lc: { nome: 'Castries', sinonimos: [] },
  li: { nome: 'Vaduz', sinonimos: [] },
  // Capital comercial; a oficial é Sri Jayawardenepura Kotte. Ver o cabeçalho.
  lk: { nome: 'Colombo', sinonimos: ['Sri Jayawardenepura Kotte', 'Kotte'] },
  lr: { nome: 'Monróvia', sinonimos: ['Monrovia'] },
  ls: { nome: 'Maseru', sinonimos: [] },
  lt: { nome: 'Vilnius', sinonimos: ['Vilna'] },
  lu: { nome: 'Luxemburgo', sinonimos: [] },
  lv: { nome: 'Riga', sinonimos: [] },
  ly: { nome: 'Trípoli', sinonimos: [] },
  ma: { nome: 'Rabat', sinonimos: ['Rabate'] },
  mc: { nome: 'Mônaco', sinonimos: ['Monaco-Ville'] },
  md: { nome: 'Chisinau', sinonimos: ['Chișinău', 'Quixinau', 'Kishinev'] },
  me: { nome: 'Podgorica', sinonimos: [] },
  mg: { nome: 'Antananarivo', sinonimos: ['Tananarive'] },
  mh: { nome: 'Majuro', sinonimos: [] },
  mk: { nome: 'Skopje', sinonimos: ['Escópia', 'Escopje'] },
  ml: { nome: 'Bamako', sinonimos: ['Bamaco'] },
  mm: { nome: 'Naypyidaw', sinonimos: ['Nay Pyi Taw', 'Naypidaw'] },
  mn: { nome: 'Ulan Bator', sinonimos: ['Ulaanbaatar', 'Ulã Bator'] },
  mr: { nome: 'Nouakchott', sinonimos: ['Nuaquechote', 'Nuakchott'] },
  mt: { nome: 'Valeta', sinonimos: ['Valletta', 'La Valeta'] },
  mu: { nome: 'Port Louis', sinonimos: ['Porto Luís'] },
  mv: { nome: 'Malé', sinonimos: [] },
  mw: { nome: 'Lilongwe', sinonimos: ['Lilongue'] },
  mx: { nome: 'Cidade do México', sinonimos: ['México', 'Ciudad de México'] },
  // Putrajaia é a sede administrativa desde 1999. Ver o cabeçalho.
  my: { nome: 'Kuala Lumpur', sinonimos: ['Putrajaia', 'Putrajaya'] },
  mz: { nome: 'Maputo', sinonimos: [] },
  na: { nome: 'Windhoek', sinonimos: ['Vinduque'] },
  ne: { nome: 'Niamey', sinonimos: ['Niamei'] },
  ng: { nome: 'Abuja', sinonimos: [] },
  ni: { nome: 'Manágua', sinonimos: [] },
  // Capital pela Constituição; Haia é a sede do governo. Ver o cabeçalho.
  nl: { nome: 'Amsterdã', sinonimos: ['Amsterdão', 'Amesterdão', 'Haia'] },
  no: { nome: 'Oslo', sinonimos: [] },
  np: { nome: 'Katmandu', sinonimos: ['Kathmandu', 'Catmandu'] },
  // O país não tem capital oficial; Yaren é a sede. Ver o cabeçalho.
  nr: { nome: 'Yaren', sinonimos: ['Iaren'] },
  nz: { nome: 'Wellington', sinonimos: [] },
  om: { nome: 'Mascate', sinonimos: ['Muscat'] },
  pa: { nome: 'Cidade do Panamá', sinonimos: ['Panamá'] },
  pe: { nome: 'Lima', sinonimos: [] },
  pg: { nome: 'Port Moresby', sinonimos: ['Porto Moresby'] },
  ph: { nome: 'Manila', sinonimos: ['Manilha'] },
  pk: { nome: 'Islamabad', sinonimos: ['Islamabade'] },
  pl: { nome: 'Varsóvia', sinonimos: [] },
  // Sede administrativa; a capital declarada é Jerusalém Oriental. Ver o cabeçalho.
  ps: { nome: 'Ramallah', sinonimos: ['Ramala', 'Jerusalém Oriental'] },
  pt: { nome: 'Lisboa', sinonimos: [] },
  pw: { nome: 'Ngerulmud', sinonimos: ['Melekeok'] },
  py: { nome: 'Assunção', sinonimos: ['Asunción'] },
  qa: { nome: 'Doha', sinonimos: ['Doa'] },
  ro: { nome: 'Bucareste', sinonimos: [] },
  rs: { nome: 'Belgrado', sinonimos: [] },
  ru: { nome: 'Moscou', sinonimos: ['Moscovo'] },
  rw: { nome: 'Kigali', sinonimos: [] },
  sa: { nome: 'Riade', sinonimos: ['Riyadh', 'Riad'] },
  sb: { nome: 'Honiara', sinonimos: [] },
  sc: { nome: 'Victoria', sinonimos: ['Vitória'] },
  sd: { nome: 'Cartum', sinonimos: ['Khartoum'] },
  se: { nome: 'Estocolmo', sinonimos: [] },
  sg: { nome: 'Singapura', sinonimos: ['Singapore'] },
  si: { nome: 'Liubliana', sinonimos: ['Ljubljana'] },
  sk: { nome: 'Bratislava', sinonimos: ['Bratislávia'] },
  sl: { nome: 'Freetown', sinonimos: [] },
  sm: { nome: 'San Marino', sinonimos: ['Cidade de San Marino', 'São Marinho'] },
  sn: { nome: 'Dacar', sinonimos: ['Dakar'] },
  so: { nome: 'Mogadício', sinonimos: ['Mogadíscio', 'Mogadishu'] },
  sr: { nome: 'Paramaribo', sinonimos: [] },
  ss: { nome: 'Juba', sinonimos: [] },
  st: { nome: 'São Tomé', sinonimos: [] },
  sv: { nome: 'San Salvador', sinonimos: ['São Salvador'] },
  sy: { nome: 'Damasco', sinonimos: [] },
  // Capital administrativa; Lobamba é a legislativa e real. Ver o cabeçalho.
  sz: { nome: 'Mbabane', sinonimos: ['Lobamba'] },
  td: { nome: "N'Djamena", sinonimos: ['Ndjamena', 'Nijamena'] },
  tg: { nome: 'Lomé', sinonimos: [] },
  th: { nome: 'Bangkok', sinonimos: ['Banguecoque', 'Bancoc'] },
  tj: { nome: 'Dushanbe', sinonimos: ['Duchambe', 'Duxambé'] },
  tl: { nome: 'Díli', sinonimos: [] },
  tm: { nome: 'Ashgabat', sinonimos: ['Asgabate', 'Asgabat'] },
  tn: { nome: 'Túnis', sinonimos: [] },
  to: { nome: "Nuku'alofa", sinonimos: ['Nucualofa'] },
  tr: { nome: 'Ancara', sinonimos: ['Ankara'] },
  tt: { nome: 'Port of Spain', sinonimos: ['Porto Espanha', 'Porto de Espanha'] },
  tv: { nome: 'Funafuti', sinonimos: [] },
  // Capital desde 1996; Dar es Salaam ainda abriga boa parte do governo.
  tz: { nome: 'Dodoma', sinonimos: ['Dar es Salaam'] },
  ua: { nome: 'Kiev', sinonimos: ['Kyiv'] },
  ug: { nome: 'Kampala', sinonimos: [] },
  us: { nome: 'Washington', sinonimos: ['Washington, D.C.', 'Washington DC'] },
  uy: { nome: 'Montevidéu', sinonimos: ['Montevideo'] },
  uz: { nome: 'Tashkent', sinonimos: ['Tasquente'] },
  // O Estado é a própria cidade. Ver o cabeçalho.
  va: { nome: 'Cidade do Vaticano', sinonimos: ['Vaticano'] },
  vc: { nome: 'Kingstown', sinonimos: [] },
  ve: { nome: 'Caracas', sinonimos: [] },
  vn: { nome: 'Hanói', sinonimos: ['Hanoi'] },
  vu: { nome: 'Port Vila', sinonimos: ['Porto Vila'] },
  ws: { nome: 'Apia', sinonimos: [] },
  // Capital constitucional; Áden é a sede provisória do governo. Ver o cabeçalho.
  ye: { nome: 'Sanaa', sinonimos: ["Sana'a", 'Saná', 'Áden'] },
  // Executivo em Pretória, legislativo na Cidade do Cabo, judiciário em
  // Bloemfontein. Ver o cabeçalho.
  za: { nome: 'Pretória', sinonimos: ['Cidade do Cabo', 'Bloemfontein'] },
  zm: { nome: 'Lusaka', sinonimos: ['Lusaca'] },
  zw: { nome: 'Harare', sinonimos: [] },

  /*
   * Territórios não soberanos. A "capital" aqui é a sede administrativa, que é
   * o que existe para ser sabido — nenhum deles tem capital no sentido de
   * Estado independente, e fingir que tem seria pior que não ter a carta.
   */
  eh: { nome: 'El Aaiún', sinonimos: ['Laayoune', 'Aaiún'] },
  fk: { nome: 'Stanley', sinonimos: ['Port Stanley', 'Puerto Argentino'] },
  gl: { nome: 'Nuuk', sinonimos: ['Godthab', 'Godthåb'] },
  nc: { nome: 'Numeá', sinonimos: ['Noumea'] },
  pr: { nome: 'San Juan', sinonimos: ['São João'] },
  tw: { nome: 'Taipé', sinonimos: ['Taipei', 'Taipé Chinesa'] },
  // Nicósia é capital dos DOIS Chipres — a cidade é partida por um muro, e é a
  // última capital dividida do mundo. Aceitar "Nicósia" aqui colidiria com o
  // Chipre da ONU, então o lado norte só responde pelo nome que o desambigua.
  xc: { nome: 'Nicósia do Norte', sinonimos: ['Lefkosa', 'Lefkoşa'] },
  xk: { nome: 'Pristina', sinonimos: ['Prishtina'] },
  xs: { nome: 'Hargeisa', sinonimos: ['Hargeysa'] },
}
