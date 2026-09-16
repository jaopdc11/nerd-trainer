/**
 * Hormônios, quem os fabrica e o que eles fazem.
 *
 * **O dado que faz o jogo funcionar é `alvos`.** Ele é a contraparte exata da
 * geometria eletrônica na VSEPR: a opção errada que a pessoa de fato marca. O
 * TSH é o "hormônio tireoestimulante" e quem o fabrica é a hipófise — a tireoide
 * é quem *obedece*, e está escrita no nome dele. Sem `alvos`, a carta do TSH
 * sortearia "pâncreas" e "pineal" como opções erradas e não mediria nada; com
 * ele, "tireoide" aparece na tela e a carta passa a cobrar a única coisa que
 * importa aqui, que é distinguir a fábrica do destinatário.
 *
 * **A hipófise não foi partida em adeno e neuro-hipófise**, e essa foi a decisão
 * mais difícil do dataset. A ocitocina e o ADH são fabricados por neurônios do
 * **hipotálamo** e apenas armazenados e liberados pela neuro-hipófise — é o que
 * dizem Amabis e Sônia Lopes, e é a resposta de prova. Se "neuro-hipófise"
 * fosse uma alternativa na tela, a carta teria duas respostas defensáveis e o
 * ponto sairia no sorteio. Mantendo a hipófise inteira, a carta fica limpa: a
 * resposta é hipotálamo, "hipófise" é o erro canônico e vai como distrator, e a
 * ressalva explica a divisão de trabalho no gabarito. A alternativa descartada —
 * marcar a neuro-hipófise como produtora, que é como alguns cursinhos ensinam —
 * seria mais confortável e estaria errada.
 *
 * As glândulas suprarrenais, ao contrário, **foram** partidas em córtex e
 * medula, e pela razão oposta: aí a divisão não cria ambiguidade nenhuma e
 * carrega conteúdo de verdade. Cortisol e aldosterona são esteroides do córtex,
 * de ação lenta; a adrenalina é uma amina da medula, que é tecido nervoso
 * adaptado e responde em segundos. Quem acha que "vem da suprarrenal" está no
 * meio do caminho, e a carta cobra o resto.
 */
export type Glandula =
  | 'hipotálamo'
  | 'hipófise'
  | 'pineal'
  | 'tireoide'
  | 'paratireoides'
  | 'córtex da suprarrenal'
  | 'medula da suprarrenal'
  | 'pâncreas'
  | 'ovários'
  | 'testículos'

export const GLANDULAS: readonly Glandula[] = [
  'hipotálamo',
  'hipófise',
  'pineal',
  'tireoide',
  'paratireoides',
  'córtex da suprarrenal',
  'medula da suprarrenal',
  'pâncreas',
  'ovários',
  'testículos',
]

export type Hormonio =
  | 'insulina'
  | 'glucagon'
  | 'adrenalina'
  | 'cortisol'
  | 'aldosterona'
  | 'tiroxina'
  | 'calcitonina'
  | 'paratormônio'
  | 'TSH'
  | 'ACTH'
  | 'FSH'
  | 'LH'
  | 'GH'
  | 'prolactina'
  | 'ocitocina'
  | 'ADH'
  | 'melatonina'
  | 'testosterona'
  | 'estrogênio'
  | 'progesterona'

export const HORMONIOS: readonly Hormonio[] = [
  'insulina',
  'glucagon',
  'adrenalina',
  'cortisol',
  'aldosterona',
  'tiroxina',
  'calcitonina',
  'paratormônio',
  'TSH',
  'ACTH',
  'FSH',
  'LH',
  'GH',
  'prolactina',
  'ocitocina',
  'ADH',
  'melatonina',
  'testosterona',
  'estrogênio',
  'progesterona',
]

export interface Endocrino {
  readonly nome: Hormonio
  /** Só nas siglas: sem isto, "FSH" na tela é um enigma, não uma pergunta. */
  readonly porExtenso?: string
  /** Quem **fabrica**. É a resposta da carta de produção. */
  readonly glandula: Glandula
  /**
   * O que o hormônio faz, escrito para ser a pergunta da outra direção. Nunca
   * contém o nome do próprio hormônio.
   */
  readonly efeito: string
  /** O que o separa dos irmãos. Vai para o gabarito. */
  readonly detalhe: string
  /**
   * A glândula que ele **comanda**, quando é trófico.
   *
   * O erro canônico deste jogo inteiro mora aqui, e por isso o alvo é sempre o
   * primeiro distrator oferecido. Vazio em quem não comanda glândula nenhuma.
   */
  readonly alvos: readonly Glandula[]
  /** Onde produzir e liberar não são a mesma glândula. Vira aviso na carta. */
  readonly ressalva?: string
}

/**
 * As glândulas que se respondem no lugar de cada uma — a lista de onde saem os
 * distratores da carta de produção.
 *
 * **Este mapa é assimétrico de propósito**, ao contrário do mapa de irmãs das
 * organelas, e a diferença não é desleixo: lá a confusão é mútua (quem troca
 * lisossomo por peroxissomo troca peroxissomo por lisossomo), aqui ela tem
 * direção. Todo mundo responde "hipófise" quando não sabe, porque ela é a
 * glândula mestra do capítulo; ninguém responde "pâncreas" para um hormônio da
 * hipófise. Impor simetria obrigaria a hipófise a listar as nove outras, e as
 * cartas dela — que são seis, um terço do baralho — passariam a sortear
 * "pineal, ovários, pâncreas", um trio que se elimina sozinho.
 *
 * Então a leitura de `IRMAS_GLANDULA[g]` é: *quando a resposta certa é `g`, o
 * que a pessoa marca errado*.
 */
export const IRMAS_GLANDULA: Readonly<Record<Glandula, readonly Glandula[]>> = {
  // O eixo do crânio: as três ficam a centímetros uma da outra e todo mundo as
  // troca. Para ADH e ocitocina, "hipófise" é o erro clássico.
  hipotálamo: ['hipófise', 'pineal', 'tireoide'],
  hipófise: ['hipotálamo', 'pineal', 'tireoide'],
  pineal: ['hipotálamo', 'hipófise', 'tireoide'],
  // Paratireoides são quatro caroços grudados atrás da tireoide: a vizinhança é
  // literal, e calcitonina × paratormônio é o par que a prova cobra.
  tireoide: ['paratireoides', 'hipófise', 'medula da suprarrenal', 'hipotálamo'],
  paratireoides: ['tireoide', 'hipófise', 'pâncreas'],
  // O córtex fabrica andrógeno também, e é por isso que gônada é opção errada
  // tentadora — e vice-versa.
  'córtex da suprarrenal': [
    'medula da suprarrenal',
    'hipófise',
    'pâncreas',
    'ovários',
    'testículos',
  ],
  'medula da suprarrenal': ['córtex da suprarrenal', 'tireoide', 'hipófise'],
  // Cortisol levanta a glicemia igual ao glucagon: quem estuda pelo efeito
  // troca pâncreas por córtex.
  pâncreas: ['córtex da suprarrenal', 'hipófise', 'paratireoides'],
  ovários: ['testículos', 'córtex da suprarrenal', 'hipófise'],
  testículos: ['ovários', 'córtex da suprarrenal', 'hipófise'],
}

/**
 * Os hormônios que se confundem entre si — de onde saem os distratores quando a
 * pergunta é o efeito.
 *
 * Aqui a simetria **é** exigida, e o teste quebra sem ela: trocar insulina por
 * glucagon e glucagon por insulina é o mesmo erro visto de dois ângulos. O
 * critério para entrar é um destes:
 *
 * 1. **o par antagonista** — insulina × glucagon na glicemia, calcitonina ×
 *    paratormônio no cálcio. São os melhores distratores que a fisiologia dá de
 *    graça, porque a resposta errada é a que faz exatamente o contrário;
 * 2. **o mesmo efeito por outro caminho** — cortisol e adrenalina levantam a
 *    glicemia junto com o glucagon; aldosterona e ADH seguram líquido no rim,
 *    uma pelo sódio, o outro pela água;
 * 3. **o eixo trófico** — TSH, ACTH, FSH e LH são quatro siglas da mesma
 *    hipófise, e trocá-las é o erro mais comum do capítulo;
 * 4. **a etapa vizinha** — a prolactina faz o leite, a ocitocina ejeta o leite;
 *    o FSH amadurece o folículo, o LH dispara a ovulação.
 */
export const IRMAS: Readonly<Record<Hormonio, readonly Hormonio[]>> = {
  insulina: ['glucagon', 'cortisol', 'adrenalina', 'GH'],
  glucagon: ['insulina', 'adrenalina', 'cortisol'],
  adrenalina: ['cortisol', 'glucagon', 'insulina', 'tiroxina', 'ADH'],
  cortisol: ['adrenalina', 'aldosterona', 'glucagon', 'insulina', 'ACTH', 'melatonina'],
  aldosterona: ['cortisol', 'ADH', 'paratormônio', 'calcitonina'],
  tiroxina: ['adrenalina', 'TSH', 'calcitonina', 'GH', 'paratormônio'],
  calcitonina: ['paratormônio', 'tiroxina', 'aldosterona'],
  paratormônio: ['calcitonina', 'tiroxina', 'aldosterona'],
  TSH: ['tiroxina', 'ACTH', 'FSH', 'LH'],
  ACTH: ['TSH', 'cortisol', 'FSH', 'LH'],
  FSH: ['LH', 'TSH', 'ACTH', 'estrogênio'],
  LH: ['FSH', 'TSH', 'ACTH', 'progesterona', 'testosterona'],
  GH: ['tiroxina', 'insulina', 'testosterona', 'prolactina', 'melatonina'],
  prolactina: ['ocitocina', 'GH', 'estrogênio'],
  ocitocina: ['ADH', 'prolactina', 'progesterona'],
  ADH: ['ocitocina', 'aldosterona', 'adrenalina', 'melatonina'],
  // Melatonina × cortisol é o par do relógio biológico: o cortisol sobe de
  // manhã, a melatonina à noite. E o GH é secretado dormindo.
  melatonina: ['cortisol', 'GH', 'ADH'],
  testosterona: ['estrogênio', 'progesterona', 'LH', 'GH'],
  estrogênio: ['progesterona', 'testosterona', 'FSH', 'prolactina'],
  progesterona: ['estrogênio', 'testosterona', 'LH', 'ocitocina'],
}

/**
 * O baralho, conferido linha a linha.
 *
 * Os efeitos foram escritos para serem **mutuamente exclusivos**: a carta é de
 * escolha, e uma frase que sirva para dois hormônios não vira discussão, vira
 * ponto perdido. Os casos delicados e como cada um foi resolvido:
 *
 * - aldosterona × ADH: uma reabsorve **sódio**, o outro reabsorve **água**;
 * - prolactina × ocitocina: uma **produz** o leite, a outra **ejeta** o leite;
 * - estrogênio × progesterona: um **reconstrói** o endométrio antes da ovulação,
 *   a outra o **sustenta** depois;
 * - GH × testosterona: o efeito do GH fala de osso longo e estatura, e não de
 *   massa muscular — que é o que tornaria a testosterona defensável.
 */
export const ENDOCRINOS: readonly Endocrino[] = [
  {
    nome: 'insulina',
    glandula: 'pâncreas',
    efeito: 'baixa a glicemia: põe glicose para dentro das células e guarda o excesso como glicogênio',
    detalhe: 'a única que baixa a glicemia; vem das células beta das ilhotas de Langerhans',
    alvos: [],
  },
  {
    nome: 'glucagon',
    glandula: 'pâncreas',
    efeito: 'levanta a glicemia quebrando o glicogênio guardado no fígado',
    detalhe: 'células alfa das mesmas ilhotas: mesma glândula da insulina, efeito oposto',
    alvos: [],
  },
  {
    nome: 'adrenalina',
    porExtenso: 'epinefrina',
    glandula: 'medula da suprarrenal',
    efeito: 'prepara para lutar ou fugir: acelera o coração, dilata a pupila e libera glicose em segundos',
    detalhe: 'a medula da suprarrenal é tecido nervoso adaptado, e por isso responde em segundos',
    alvos: [],
  },
  {
    nome: 'cortisol',
    glandula: 'córtex da suprarrenal',
    efeito: 'segura o estresse longo: quebra proteína e gordura para manter a glicemia alta, e derruba a resposta imune',
    detalhe: 'esteroide do córtex, de ação lenta e prolongada — o oposto da adrenalina no tempo de resposta',
    alvos: [],
  },
  {
    nome: 'aldosterona',
    glandula: 'córtex da suprarrenal',
    efeito: 'faz o rim reabsorver sódio e excretar potássio; com o sódio volta a água, e a pressão sobe',
    detalhe: 'mineralocorticoide: mexe com o sal, enquanto o cortisol mexe com o açúcar',
    alvos: [],
  },
  {
    nome: 'tiroxina',
    porExtenso: 'T4',
    glandula: 'tireoide',
    efeito: 'acelera o metabolismo basal de todas as células e produz calor',
    detalhe: 'depende de iodo para ser fabricada; a falta dá bócio, e o excesso, hipertireoidismo',
    alvos: [],
  },
  {
    nome: 'calcitonina',
    glandula: 'tireoide',
    efeito: 'tira cálcio do sangue e o deposita no osso',
    detalhe: 'a tireoide fabrica esta também, e ela é o oposto exato do paratormônio',
    alvos: [],
  },
  {
    nome: 'paratormônio',
    porExtenso: 'PTH',
    glandula: 'paratireoides',
    efeito: 'tira cálcio do osso e o devolve ao sangue',
    detalhe: 'vem das paratireoides, quatro caroços colados atrás da tireoide: glândula vizinha, efeito contrário',
    alvos: [],
  },
  {
    nome: 'TSH',
    porExtenso: 'hormônio tireoestimulante',
    glandula: 'hipófise',
    efeito: 'manda a tireoide fabricar e liberar T3 e T4',
    detalhe: 'trófico: a hipófise manda, a tireoide obedece — e é o nome de quem obedece que está na sigla',
    alvos: ['tireoide'],
  },
  {
    nome: 'ACTH',
    porExtenso: 'hormônio adrenocorticotrófico',
    glandula: 'hipófise',
    efeito: 'manda o córtex da suprarrenal liberar cortisol',
    detalhe: 'mesmo caso do TSH: quem fabrica é a adeno-hipófise, quem obedece está no nome',
    alvos: ['córtex da suprarrenal'],
  },
  {
    nome: 'FSH',
    porExtenso: 'hormônio folículo-estimulante',
    glandula: 'hipófise',
    efeito: 'amadurece o folículo ovariano a cada ciclo e comanda a produção de espermatozoides no testículo',
    detalhe: 'gonadotrofina da adeno-hipófise: a gônada é o alvo, não a fábrica',
    alvos: ['ovários', 'testículos'],
  },
  {
    nome: 'LH',
    porExtenso: 'hormônio luteinizante',
    glandula: 'hipófise',
    efeito: 'dispara a ovulação e transforma o folículo que sobrou em corpo lúteo',
    detalhe: 'a outra gonadotrofina; o pico dele no meio do ciclo é o gatilho da ovulação',
    alvos: ['ovários', 'testículos'],
  },
  {
    nome: 'GH',
    porExtenso: 'hormônio do crescimento, somatotrofina',
    glandula: 'hipófise',
    efeito: 'estimula o alongamento dos ossos longos e o crescimento do corpo na infância',
    detalhe: 'da adeno-hipófise; em excesso antes de fechar as cartilagens dá gigantismo, depois dá acromegalia',
    alvos: [],
  },
  {
    nome: 'prolactina',
    glandula: 'hipófise',
    efeito: 'faz a mama produzir leite depois do parto',
    detalhe: 'da adeno-hipófise; esta manda fabricar o leite, e quem o ejeta na mamada é a ocitocina',
    alvos: [],
  },
  {
    nome: 'ocitocina',
    glandula: 'hipotálamo',
    efeito: 'contrai o útero no parto e ejeta o leite durante a mamada',
    detalhe: 'fabricada por neurônios do hipotálamo, desce pelo axônio e é só estocada na neuro-hipófise',
    alvos: [],
    ressalva:
      'a neuro-hipófise não fabrica nada: ela armazena e libera o que o hipotálamo produziu — a pergunta é sempre quem fabrica',
  },
  {
    nome: 'ADH',
    porExtenso: 'hormônio antidiurético, vasopressina',
    glandula: 'hipotálamo',
    efeito: 'faz o rim reabsorver água e concentrar a urina',
    detalhe: 'mesma rota da ocitocina: feito no hipotálamo, guardado na neuro-hipófise',
    alvos: [],
    ressalva:
      'a neuro-hipófise não fabrica nada: ela armazena e libera o que o hipotálamo produziu — a pergunta é sempre quem fabrica',
  },
  {
    nome: 'melatonina',
    glandula: 'pineal',
    efeito: 'avisa ao corpo que é noite e organiza o ciclo do sono',
    detalhe: 'a pineal responde à luz que chega pela retina: escuro liga a produção, luz desliga',
    alvos: [],
  },
  {
    nome: 'testosterona',
    glandula: 'testículos',
    efeito: 'desenvolve os caracteres sexuais masculinos e comanda a produção de espermatozoides',
    detalhe: 'das células intersticiais do testículo; o córtex da suprarrenal fabrica andrógeno em pouca quantidade',
    alvos: [],
  },
  {
    nome: 'estrogênio',
    glandula: 'ovários',
    efeito: 'desenvolve os caracteres sexuais femininos e reconstrói o endométrio na primeira metade do ciclo',
    detalhe: 'do folículo em amadurecimento, antes da ovulação',
    alvos: [],
  },
  {
    nome: 'progesterona',
    glandula: 'ovários',
    efeito: 'sustenta o endométrio depois da ovulação e segura a gravidez',
    detalhe: 'do corpo lúteo, que é o que sobra do folículo; na gravidez adiantada a placenta assume',
    alvos: [],
  },
]
