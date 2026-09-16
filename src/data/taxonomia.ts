/**
 * A que grupo pertence cada ser vivo.
 *
 * **O jogo vive das armadilhas, e o dataset é construído em volta disso.** Um
 * baralho de "cachorro → mamífero, formiga → inseto" não mede nada: ninguém
 * erra, e o card com quatro opções vira uma resposta certa e três enfeites. O
 * que de fato separa quem sabe classificar de quem classifica por aparência é
 * sempre o mesmo punhado de casos — golfinho e baleia são mamíferos, morcego é
 * mamífero, pinguim é ave, aranha é aracnídeo e não inseto, caranguejo é
 * crustáceo, minhoca é anelídeo, estrela-do-mar é equinodermo, polvo é molusco,
 * coral é cnidário, cogumelo não é planta. São 44 das 53 cartas, e `confundeCom`
 * marca cada uma delas.
 *
 * É a mesma lógica do nível 2 do nox: lá a graça é `H₂O₂`, onde o oxigênio vale
 * −1 e a regra decorada trai; aqui a graça é o golfinho, onde "vive no mar e
 * nada" trai. Tirar as armadilhas dos dois datasets deixaria dois jogos que
 * ninguém erra.
 *
 * ## `confundeCom` é dado, não enfeite
 *
 * O campo não existe para colorir a carta: **é ele que escolhe o distrator.**
 * Oferecer "porífero" para o golfinho não testa coisa alguma, porque a opção se
 * elimina sozinha e a carta passa a medir se o jogador sabe ler. Oferecer
 * "peixe" testa exatamente a única coisa que a carta quer saber. Por isso o
 * primeiro errado de toda carta-armadilha é o grupo que ela declara aqui, e os
 * outros dois saem de `CONFUNDE_COM` — nunca de sorteio.
 *
 * ## Os grupos não são todos do mesmo nível, e isso é deliberado
 *
 * "Mamífero" é classe, "molusco" é filo, "fungo" é reino. Uma lista homogênea —
 * só filos, digamos — seria mais arrumada e mediria outra coisa: ninguém
 * classifica um morcego pensando "Chordata". O grupo cobrado aqui é o de uso
 * corrente, que é onde o erro mora. Os oito níveis (domínio, reino, filo,
 * classe, ordem, família, gênero, espécie) entram no `comoJogar` como
 * vocabulário e **não** viram jogo próprio: recitar a escada em ordem é uma
 * sequência de oito itens, decorável em dois minutos, e não diz nada sobre saber
 * onde cada bicho entra.
 *
 * ## `protista`, e por que ele fica
 *
 * É o grupo mais frágil da lista: "Protista" do esquema dos cinco reinos é uma
 * gaveta de sobras — ameba, euglena e alga-parda não formam uma linhagem, e a
 * filogenia moderna desmanchou o reino. Fica assim mesmo, por duas razões: é o
 * que a escola brasileira ensina, e sem ele a ameba não teria resposta nenhuma.
 * A carta da alga-parda carrega um `aviso` dizendo isso na cara, no lugar de
 * fingir que o problema não existe — mesmo tratamento que `capitais.ts` dá às
 * capitais disputadas.
 */

export const GRUPOS = [
  'mamífero',
  'ave',
  'réptil',
  'anfíbio',
  'peixe',
  'inseto',
  'aracnídeo',
  'crustáceo',
  'miriápode',
  'molusco',
  'anelídeo',
  'platelminto',
  'nematoide',
  'equinodermo',
  'cnidário',
  'porífero',
  'fungo',
  'planta',
  'bactéria',
  'protista',
] as const
export type Grupo = (typeof GRUPOS)[number]

export interface SerVivo {
  /** Sem acento e em kebab-case: é id, não texto de tela. */
  readonly id: string
  /** Minúsculo, como substantivo comum. Quem capitaliza para exibir é o jogo. */
  readonly nome: string
  /** A resposta. */
  readonly grupo: Grupo
  /**
   * O traço que decide a classificação, e não a repetição da resposta.
   *
   * Vai para o gabarito pela razão do `porque` do nox: quem errou "golfinho" e
   * lê "mamífero" erra igual da próxima vez; quem lê "respira por pulmão e mama"
   * ganhou a régua para o peixe-boi e para a orca.
   */
  readonly pista: string
  /**
   * O grupo com que este ser vivo é confundido. Presente = carta-armadilha.
   *
   * Tem de estar em `CONFUNDE_COM[grupo]`, e o teste do dataset cobra isso: um
   * par que existe aqui e não lá seria um julgamento sobre o que se parece com o
   * quê escrito em dois lugares e só mantido em um.
   */
  readonly confundeCom?: Grupo
  /** Ressalva que a carta tem de dizer mesmo aceitando a resposta. */
  readonly aviso?: string
}

/**
 * Quais grupos se confundem com quais — a lista de onde saem os distratores.
 *
 * Gêmea de `IRMAS` em `funcoes-organicas.ts`, e pelo mesmo motivo: é julgamento
 * sobre o que engana quem, isto é, é dado, e dado tem teste. O critério para um
 * par entrar é um destes:
 *
 * 1. **mesmo ambiente, forma parecida** — golfinho e peixe, enguia e cobra,
 *    lesma e minhoca, estrela-do-mar e anêmona. É a fonte da maioria dos erros:
 *    classificar pelo que o bicho parece e por onde ele vive;
 * 2. **mesmo grande grupo, contagem diferente** — inseto, aracnídeo, crustáceo e
 *    miriápode são todos artrópodes, e o que os separa é contar patas, antenas e
 *    partes do corpo. Quem não conta, chuta "inseto";
 * 3. **parado e verde** — coral, anêmona, esponja e alga levam "planta" porque
 *    não andam. Fungo e planta pelo mesmo motivo, com o agravante de o cogumelo
 *    nascer do chão;
 * 4. **tamanho de célula** — bactéria, protista e levedura só se distinguem pelo
 *    núcleo, que ninguém vê no chute.
 *
 * Os cinco grupos de vertebrados formam clique fechado de propósito: quem erra
 * um vertebrado erra dentro dos vertebrados, e limitar o par a "mamífero ×
 * peixe" deixaria a salamandra sem distrator decente.
 *
 * O mapa é simétrico, e o teste quebra se deixar de ser — "A se confunde com B"
 * e "B se confunde com A" são a mesma afirmação, e uma assimetria aqui seria
 * sempre esquecimento. Toda lista tem três entradas ou mais: é o que garante que
 * os três distratores de qualquer carta saiam daqui, sem nunca cair no sorteio
 * geral.
 */
export const CONFUNDE_COM: Readonly<Record<Grupo, readonly Grupo[]>> = {
  'mamífero': ['ave', 'réptil', 'anfíbio', 'peixe'],
  'ave': ['mamífero', 'réptil', 'anfíbio', 'peixe'],
  'réptil': ['mamífero', 'ave', 'anfíbio', 'peixe'],
  'anfíbio': ['mamífero', 'ave', 'réptil', 'peixe'],
  'peixe': ['mamífero', 'ave', 'réptil', 'anfíbio', 'crustáceo', 'molusco'],
  'inseto': ['aracnídeo', 'crustáceo', 'miriápode', 'nematoide'],
  'aracnídeo': ['inseto', 'crustáceo', 'miriápode'],
  'crustáceo': ['inseto', 'aracnídeo', 'miriápode', 'molusco', 'equinodermo', 'peixe'],
  'miriápode': ['inseto', 'aracnídeo', 'crustáceo', 'anelídeo'],
  'molusco': ['crustáceo', 'equinodermo', 'cnidário', 'anelídeo', 'platelminto', 'peixe'],
  'anelídeo': ['nematoide', 'platelminto', 'molusco', 'miriápode'],
  'platelminto': ['anelídeo', 'nematoide', 'molusco'],
  'nematoide': ['anelídeo', 'platelminto', 'inseto'],
  'equinodermo': ['cnidário', 'crustáceo', 'molusco', 'porífero'],
  'cnidário': ['planta', 'molusco', 'equinodermo', 'porífero'],
  'porífero': ['planta', 'cnidário', 'equinodermo'],
  'planta': ['fungo', 'cnidário', 'porífero', 'protista', 'bactéria'],
  'fungo': ['planta', 'bactéria', 'protista'],
  'bactéria': ['protista', 'fungo', 'planta'],
  'protista': ['bactéria', 'planta', 'fungo'],
}

/**
 * O baralho.
 *
 * A distribuição por grupo é desigual de propósito: aracnídeo tem quatro cartas
 * e nematoide tem uma porque o aracnídeo é confundido com inseto quatro vezes
 * por semana e a lombriga só tem um vizinho. Equilibrar a contagem encheria o
 * baralho de cartas que ninguém erra.
 *
 * Todo grupo da lista aparece pelo menos uma vez como resposta — é testado. Sem
 * isso, uma opção que nunca é a certa vira distrator eterno, e o jogador aprende
 * a eliminá-la por estatística em vez de por biologia.
 */
export const SERES_VIVOS: readonly SerVivo[] = [
  // --- mamíferos: o grupo que mais engana, porque o critério (pelo, leite,
  // pulmão) é invisível debaixo d'água e embaixo de uma asa.
  {
    id: 'golfinho',
    nome: 'golfinho',
    grupo: 'mamífero',
    confundeCom: 'peixe',
    pista: 'respira por pulmão, é de sangue quente e o filhote mama — nadar não faz peixe',
  },
  {
    id: 'baleia-azul',
    nome: 'baleia-azul',
    grupo: 'mamífero',
    confundeCom: 'peixe',
    pista: 'o jato que ela solta é ar quente saindo da narina, não água passando por guelra',
  },
  {
    id: 'morcego',
    nome: 'morcego',
    grupo: 'mamífero',
    confundeCom: 'ave',
    pista: 'a asa é mão: pele esticada entre dedos alongados, sem uma pena sequer',
  },
  {
    id: 'peixe-boi',
    nome: 'peixe-boi',
    grupo: 'mamífero',
    confundeCom: 'peixe',
    pista: 'o nome é a única coisa de peixe que ele tem: mama, sobe para respirar e é parente do elefante',
  },
  {
    id: 'ornitorrinco',
    nome: 'ornitorrinco',
    grupo: 'mamífero',
    confundeCom: 'ave',
    pista: 'põe ovo e tem bico, mas tem pelo e produz leite, que é o que define o grupo',
  },

  // --- aves
  {
    id: 'pinguim',
    nome: 'pinguim',
    grupo: 'ave',
    confundeCom: 'mamífero',
    pista: 'pena, bico e ovo com casca; a asa virou nadadeira, e voar nunca foi requisito',
  },
  {
    id: 'avestruz',
    nome: 'avestruz',
    grupo: 'ave',
    pista: 'pena, bico e ovo — a maior ave viva continua sendo ave sem sair do chão',
  },

  // --- répteis e anfíbios: o par que o português atrapalha, porque "anfíbio"
  // soa a "vive na água e em terra", que é descrição de hábito, não de grupo.
  {
    id: 'tartaruga-marinha',
    nome: 'tartaruga-marinha',
    grupo: 'réptil',
    confundeCom: 'anfíbio',
    pista: 'pele seca e escamosa, pulmão, e ovo de casca enterrado na areia seca',
  },
  {
    id: 'jacare',
    nome: 'jacaré',
    grupo: 'réptil',
    confundeCom: 'anfíbio',
    pista: 'viver dentro da água não é ser anfíbio: a pele é escamosa e o ovo tem casca',
  },
  {
    id: 'cascavel',
    nome: 'cascavel',
    grupo: 'réptil',
    pista: 'escama, pulmão e ovo com casca — perder as patas não mudou o grupo',
  },
  {
    id: 'salamandra',
    nome: 'salamandra',
    grupo: 'anfíbio',
    confundeCom: 'réptil',
    pista: 'tem cara de lagarto, mas a pele é úmida e sem escama, e a vida começa na água',
  },
  {
    id: 'sapo',
    nome: 'sapo',
    grupo: 'anfíbio',
    confundeCom: 'réptil',
    pista: 'pele úmida e permeável, e um girino com brânquia antes de haver pulmão',
  },

  // --- peixes, incluindo a supercorreção: depois de aprender o golfinho, muita
  // gente promove o tubarão a mamífero.
  {
    id: 'tubarao',
    nome: 'tubarão',
    grupo: 'peixe',
    confundeCom: 'mamífero',
    pista: 'guelra e esqueleto de cartilagem: aprender que o golfinho é mamífero não promove o tubarão',
  },
  {
    id: 'cavalo-marinho',
    nome: 'cavalo-marinho',
    grupo: 'peixe',
    confundeCom: 'crustáceo',
    pista: 'a armadura é osso sob a pele, e por baixo dela há guelra, nadadeira e coluna vertebral',
  },
  {
    id: 'enguia',
    nome: 'enguia',
    grupo: 'peixe',
    confundeCom: 'réptil',
    pista: 'corpo de cobra, respiração de peixe: guelra, nadadeira e linha lateral',
  },

  // --- insetos: aqui não há armadilha, e é de propósito. O erro anda na direção
  // contrária — é o não-inseto que apanha o rótulo de inseto.
  {
    id: 'formiga',
    nome: 'formiga',
    grupo: 'inseto',
    pista: 'seis patas, corpo em três partes e um par de antenas: a conta que define inseto',
  },
  {
    id: 'mosquito-da-dengue',
    nome: 'mosquito-da-dengue',
    grupo: 'inseto',
    pista: 'seis patas e um par de asas — o segundo par virou halteres, e ele continua inseto',
  },

  // --- aracnídeos: quatro cartas porque é o erro mais repetido do grupo todo.
  {
    id: 'aranha',
    nome: 'aranha',
    grupo: 'aracnídeo',
    confundeCom: 'inseto',
    pista: 'oito patas, corpo em duas partes e nenhuma antena — inseto tem seis, três e duas',
  },
  {
    id: 'escorpiao',
    nome: 'escorpião',
    grupo: 'aracnídeo',
    confundeCom: 'inseto',
    pista: 'oito patas e nenhuma antena: as pinças são pedipalpos, não um par a mais de pernas',
  },
  {
    id: 'carrapato',
    nome: 'carrapato',
    grupo: 'aracnídeo',
    confundeCom: 'inseto',
    pista: 'oito patas no adulto e nenhuma antena; é parente da aranha, não da pulga',
  },
  {
    id: 'acaro',
    nome: 'ácaro',
    grupo: 'aracnídeo',
    confundeCom: 'inseto',
    pista: 'tamanho de poeira, anatomia de aranha: oito patas e nenhuma antena',
  },

  // --- crustáceos
  {
    id: 'caranguejo',
    nome: 'caranguejo',
    grupo: 'crustáceo',
    confundeCom: 'molusco',
    pista: 'a carapaça é exoesqueleto articulado que ele troca, não concha secretada por um manto',
  },
  {
    id: 'camarao',
    nome: 'camarão',
    grupo: 'crustáceo',
    confundeCom: 'inseto',
    pista: 'dois pares de antena, que nenhum inseto tem — é o parente marinho deles, não um deles',
  },
  {
    id: 'tatuzinho-de-jardim',
    nome: 'tatuzinho-de-jardim',
    grupo: 'crustáceo',
    confundeCom: 'inseto',
    pista: 'mora em terra e ainda assim respira por brânquia: por isso só aparece embaixo de pedra úmida',
  },
  {
    id: 'craca',
    nome: 'craca',
    grupo: 'crustáceo',
    confundeCom: 'molusco',
    pista: 'a placa calcária engana: lá dentro há um crustáceo deitado de costas, filtrando comida com as patas',
  },

  // --- miriápodes
  {
    id: 'centopeia',
    nome: 'centopeia',
    grupo: 'miriápode',
    confundeCom: 'inseto',
    pista: 'um par de patas por segmento, e segmento não falta — inseto para em seis',
  },
  {
    id: 'piolho-de-cobra',
    nome: 'piolho-de-cobra',
    grupo: 'miriápode',
    confundeCom: 'inseto',
    pista: 'dois pares de patas por segmento: é o que separa o diplópode da centopeia',
  },

  // --- moluscos: o grupo que desmente "molusco é bicho de concha".
  {
    id: 'polvo',
    nome: 'polvo',
    grupo: 'molusco',
    confundeCom: 'cnidário',
    pista: 'os braços têm ventosa, não cnidócito; é o mesmo plano do caracol, com a concha perdida por dentro',
  },
  {
    id: 'lesma',
    nome: 'lesma',
    grupo: 'molusco',
    confundeCom: 'anelídeo',
    pista: 'não é minhoca sem casa: tem pé musculoso, manto e rádula, e nenhum anel',
  },
  {
    id: 'ostra',
    nome: 'ostra',
    grupo: 'molusco',
    confundeCom: 'crustáceo',
    pista: 'a concha é de duas valvas e sai do manto do próprio bicho, que é mole e sem patas',
  },
  {
    id: 'caracol',
    nome: 'caracol',
    grupo: 'molusco',
    pista: 'pé musculoso, manto e rádula — o modelo do grupo, e o parente mais próximo do polvo',
  },

  // --- vermes: três grupos diferentes que o português junta numa palavra só.
  {
    id: 'minhoca',
    nome: 'minhoca',
    grupo: 'anelídeo',
    confundeCom: 'nematoide',
    pista: 'o corpo é uma fila de anéis iguais, cada um com cerdas — "verme" é forma, não parentesco',
  },
  {
    id: 'sanguessuga',
    nome: 'sanguessuga',
    grupo: 'anelídeo',
    confundeCom: 'platelminto',
    pista: 'achatada e sem cerda à vista, mas segmentada por dentro como a minhoca',
  },
  {
    id: 'tenia',
    nome: 'tênia',
    grupo: 'platelminto',
    confundeCom: 'nematoide',
    pista: 'achatada como fita e feita de proglotes, uma atrás da outra; lombriga é roliça',
  },
  {
    id: 'planaria',
    nome: 'planária',
    grupo: 'platelminto',
    pista: 'achatada de cima para baixo, sem cavidade no corpo e sem um único anel',
  },
  {
    id: 'lombriga',
    nome: 'lombriga',
    grupo: 'nematoide',
    confundeCom: 'anelídeo',
    pista: 'roliça, lisa e sem anel nenhum: o corpo é um cilindro só, de ponta a ponta',
  },

  // --- equinodermos: simetria de cinco, e nenhum deles parece com o outro.
  {
    id: 'estrela-do-mar',
    nome: 'estrela-do-mar',
    grupo: 'equinodermo',
    confundeCom: 'cnidário',
    pista: 'simetria de cinco, esqueleto calcário sob a pele e pés ambulacrários movidos a água',
  },
  {
    id: 'ourico-do-mar',
    nome: 'ouriço-do-mar',
    grupo: 'equinodermo',
    confundeCom: 'crustáceo',
    pista: 'os espinhos saem de uma carapaça de placas calcárias soldadas, com a mesma simetria de cinco',
  },
  {
    id: 'pepino-do-mar',
    nome: 'pepino-do-mar',
    grupo: 'equinodermo',
    confundeCom: 'molusco',
    pista: 'mole e sem concha, mas com pés ambulacrários e a simetria de cinco escondida no corpo',
  },

  // --- cnidários e poríferos: os animais que são chamados de planta por
  // estarem parados.
  {
    id: 'coral',
    nome: 'coral',
    grupo: 'cnidário',
    confundeCom: 'planta',
    pista: 'cada ponto do recife é um bicho com tentáculo e cnidócito; a rocha é o esqueleto que ele deposita',
  },
  {
    id: 'anemona-do-mar',
    nome: 'anêmona-do-mar',
    grupo: 'cnidário',
    confundeCom: 'planta',
    pista: 'o nome é de flor, o corpo é um saco com boca única cercada de tentáculos urticantes',
  },
  {
    id: 'agua-viva',
    nome: 'água-viva',
    grupo: 'cnidário',
    pista: 'boca única, tentáculo com cnidócito e nenhum órgão — o retrato do grupo',
  },
  {
    id: 'esponja-do-mar',
    nome: 'esponja-do-mar',
    grupo: 'porífero',
    confundeCom: 'planta',
    pista: 'animal sem tecido e sem órgão, filtrando água pelos poros: parado, mas animal',
  },

  // --- fungos: reino próprio desde 1969, e ainda ensinado como "planta sem
  // clorofila" em livro velho.
  {
    id: 'cogumelo',
    nome: 'cogumelo',
    grupo: 'fungo',
    confundeCom: 'planta',
    pista: 'não faz fotossíntese: absorve matéria orgânica já pronta, e a parede da célula é de quitina',
  },
  {
    id: 'levedura',
    nome: 'levedura',
    grupo: 'fungo',
    confundeCom: 'bactéria',
    pista: 'unicelular, mas com núcleo: é eucarionte, e é por isso que fermenta o pão sem ser bactéria',
  },
  {
    id: 'bolor-do-pao',
    nome: 'bolor do pão',
    grupo: 'fungo',
    confundeCom: 'bactéria',
    pista: 'o mofo é um emaranhado de hifas visível a olho nu, não uma colônia de procariontes',
  },

  // --- plantas
  {
    id: 'musgo',
    nome: 'musgo',
    grupo: 'planta',
    confundeCom: 'fungo',
    pista: 'é verde porque faz fotossíntese: planta sem vaso condutor, e não fungo de lugar úmido',
  },
  {
    id: 'samambaia',
    nome: 'samambaia',
    grupo: 'planta',
    pista: 'tem vaso condutor e se reproduz por esporo, sem flor nem semente',
  },

  // --- bactérias e protistas: a fronteira é o núcleo, e ela não se vê.
  {
    id: 'cianobacteria',
    nome: 'cianobactéria',
    grupo: 'bactéria',
    confundeCom: 'protista',
    pista: 'foi batizada de "alga azul" por fazer fotossíntese, mas a célula não tem núcleo',
  },
  {
    id: 'lactobacilo',
    nome: 'lactobacilo',
    grupo: 'bactéria',
    pista: 'procarionte: sem núcleo e sem nenhuma organela com membrana',
  },
  {
    id: 'ameba',
    nome: 'ameba',
    grupo: 'protista',
    confundeCom: 'bactéria',
    pista: 'unicelular com núcleo e organelas — é eucarionte, do tamanho de uma bactéria e mais nada',
  },
  {
    id: 'euglena',
    nome: 'euglena',
    grupo: 'protista',
    confundeCom: 'planta',
    pista: 'faz fotossíntese e nada com flagelo: ter cloroplasto não faz de ninguém planta',
  },
  {
    id: 'alga-parda',
    nome: 'alga-parda',
    grupo: 'protista',
    confundeCom: 'planta',
    pista: 'parece folha e faz fotossíntese, mas não tem raiz, caule, folha nem vaso condutor',
    aviso:
      '"Protista" é gaveta de sobras e a carta assume isso: no esquema dos cinco reinos a alga-parda cai aqui, e na filogenia atual ela está mais perto das diatomáceas que de qualquer planta. Já as algas verdes ficam do outro lado, junto das plantas.',
  },
]

/**
 * As armadilhas que são a razão de existir do jogo.
 *
 * Existe como função e não como lista escrita para não haver duas verdades: a
 * marca é o `confundeCom` da carta, e quem quiser saber quantas são conta daqui.
 */
export const armadilhas = (): readonly SerVivo[] => SERES_VIVOS.filter((s) => s.confundeCom)

/**
 * Busca por id, e **lança** quando não acha.
 *
 * Devolver `undefined` faria um id errado virar carta sem pergunta no meio da
 * partida, ou — pior — um teste de coerência entre datasets passar comparando
 * nada com nada.
 */
export function serVivo(id: string): SerVivo {
  const achado = SERES_VIVOS.find((s) => s.id === id)
  if (!achado) throw new Error(`taxonomia: não existe ser vivo com id "${id}"`)
  return achado
}

/** Os grupos confundíveis com este. Lança em grupo desconhecido, pela mesma razão. */
export function confusoesDe(grupo: Grupo): readonly Grupo[] {
  const lista = CONFUNDE_COM[grupo]
  if (!lista) throw new Error(`taxonomia: grupo desconhecido "${grupo}"`)
  return lista
}
