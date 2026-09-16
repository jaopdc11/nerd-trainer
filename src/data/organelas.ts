/**
 * Estruturas celulares e o que cada uma faz.
 *
 * **A pergunta é a função, e a resposta é o nome.** O caminho contrário — mostrar
 * "lisossomo" e pedir a função — foi descartado por um motivo de forma e um de
 * conteúdo. O de forma: as quatro alternativas passariam a ser quatro frases de
 * vinte palavras cada, e a carta viraria um exercício de leitura contra o
 * relógio, que é o erro que este projeto já evitou nas derivadas e nas funções
 * orgânicas. O de conteúdo: ninguém confunde *o texto* de duas funções, confunde
 * **de quem** é a função — "quem digere" é lisossomo ou peroxissomo, "quem faz
 * proteína" é ribossomo ou retículo rugoso. Pondo o nome nas alternativas, a
 * carta cobra exatamente esse julgamento, com quatro rótulos curtos e
 * comparáveis lado a lado.
 *
 * **`ocorrencia` é conteúdo, não etiqueta.** Saber que o cloroplasto é só
 * vegetal e que o centríolo falta nos vegetais superiores é metade do que a
 * escola cobra sobre célula, e enterrar isso num campo que só o gabarito lê
 * seria desperdiçar o dado. Por isso ele vira um segundo tipo de carta — ver
 * `src/games/organelas.ts`.
 *
 * **"Organela" está no nome do jogo e não no do tipo.** Parede celular, membrana
 * plasmática, citoesqueleto, ribossomo e centríolo não têm membrana própria, e
 * pela definição estrita nenhum deles é organela — a definição estrita, aliás,
 * também jogaria o ribossomo fora, o que ninguém aceita numa prova. O tipo se
 * chama `Estrutura`, que é o que de fato está aqui, e o jogo mantém o nome
 * popular, que é como a pergunta chega ao jogador.
 */
export type Organela =
  | 'núcleo'
  | 'nucléolo'
  | 'envoltório nuclear'
  | 'membrana plasmática'
  | 'parede celular'
  | 'mitocôndria'
  | 'cloroplasto'
  | 'ribossomo'
  | 'retículo endoplasmático rugoso'
  | 'retículo endoplasmático liso'
  | 'complexo golgiense'
  | 'lisossomo'
  | 'peroxissomo'
  | 'vacúolo central'
  | 'centríolo'
  | 'citoesqueleto'
  | 'cílios e flagelos'

export const ORGANELAS: readonly Organela[] = [
  'núcleo',
  'nucléolo',
  'envoltório nuclear',
  'membrana plasmática',
  'parede celular',
  'mitocôndria',
  'cloroplasto',
  'ribossomo',
  'retículo endoplasmático rugoso',
  'retículo endoplasmático liso',
  'complexo golgiense',
  'lisossomo',
  'peroxissomo',
  'vacúolo central',
  'centríolo',
  'citoesqueleto',
  'cílios e flagelos',
]

/**
 * Em que tipo de célula a estrutura existe.
 *
 * Só três valores, e de propósito: 'procarionte' não entra porque o baralho
 * inteiro é de célula eucarionte, e enfiar a bactéria aqui faria a carta de
 * exclusividade ter duas respostas defensáveis (o ribossomo existe em
 * procarionte, a mitocôndria não).
 */
export type Ocorrencia = 'vegetal' | 'animal' | 'ambas'

export interface Estrutura {
  readonly nome: Organela
  /**
   * A pergunta da carta de função. Nunca contém o nome da própria estrutura —
   * seria entregar a resposta —, e é escrita como o enunciado apareceria na
   * prova, não como a legenda de um desenho.
   */
  readonly funcao: string
  /**
   * O que separa esta estrutura das irmãs. Vai para o gabarito.
   *
   * É o gêmeo do `sinal` das funções orgânicas e do `axe` da geometria
   * molecular: quem errou precisa ver *por que* é esta e não a vizinha, e
   * repetir a resposta não ensina isso a ninguém.
   */
  readonly sinal: string
  readonly ocorrencia: Ocorrencia
  /** Por que só existe naquele tipo de célula. Obrigatório quando não é 'ambas'. */
  readonly exclusividade?: string
  /**
   * Onde o livro escolar simplifica, dito na cara.
   *
   * Existe porque metade das brigas sobre célula vegetal × animal é sobre
   * simplificação, não sobre biologia: o lisossomo é "da célula animal" em
   * quatro livros de cinco, e a célula vegetal faz a mesma digestão dentro do
   * vacúolo. O campo não muda a resposta; ele existe para a carta de
   * exclusividade **não usar** essas estruturas como distrator, que é a única
   * maneira honesta de não punir quem estudou pelo livro. Ver `montarBaralho`.
   */
  readonly ressalva?: string
}

/**
 * As estruturas que de fato se confundem com cada uma — a lista de onde saem os
 * distratores.
 *
 * Mesmo princípio das formas irmãs da VSEPR: oferecer "parede celular" para
 * "quem digere o que entra por fagocitose" não mede nada, porque ninguém erra
 * assim, e a carta vira uma resposta certa com três enfeites. O critério para
 * entrar aqui é um destes:
 *
 * 1. **a etapa vizinha da mesma linha de montagem** — ribossomo → retículo
 *    rugoso → complexo golgiense → lisossomo é uma esteira só, e o erro clássico
 *    é atribuir a etapa à peça de trás ou à da frente ("quem faz a proteína" é o
 *    ribossomo, não o retículo que a recebe);
 * 2. **o par que a prova cobra de propósito** — lisossomo × peroxissomo (os dois
 *    "quebram coisa dentro da célula", um com hidrolase em pH ácido, o outro com
 *    catalase), retículo liso × rugoso (o mesmo retículo, a diferença é o
 *    ribossomo grudado), parede celular × membrana plasmática (as duas
 *    fronteiras);
 * 3. **a parte pelo todo** — nucléolo dentro do núcleo, envoltório nuclear como
 *    borda do núcleo, centríolo como um pedaço do citoesqueleto. Quem responde o
 *    continente pelo conteúdo erra aqui, e é um erro que vale pegar.
 *
 * O mapa é simétrico, e o teste quebra se deixar de ser: "A se confunde com B" e
 * "B se confunde com A" são a mesma afirmação sobre a biologia, e uma assimetria
 * seria sempre esquecimento, nunca decisão. Toda lista tem no mínimo três
 * entradas — é o que garante que os três distratores saiam *só* das irmãs, sem
 * nunca cair no sorteio geral.
 *
 * Mora no dataset, e não junto do baralho como as irmãs da geometria molecular:
 * lá a lista sai mecanicamente da contagem de domínios e é detalhe de montagem
 * da carta; aqui ela é um julgamento sobre o que se parece com o quê, isto é, é
 * dado — e dado tem teste.
 */
export const IRMAS: Readonly<Record<Organela, readonly Organela[]>> = {
  // O compartimento inteiro contra a borda dele, o grânulo dentro dele, e as
  // duas organelas que também têm DNA próprio.
  núcleo: ['nucléolo', 'envoltório nuclear', 'mitocôndria', 'cloroplasto'],
  // Fabrica a peça e é confundido com a peça: nucléolo × ribossomo.
  nucléolo: ['núcleo', 'ribossomo', 'envoltório nuclear'],
  // É contínuo com o retículo rugoso — não é semelhança inventada, é a mesma
  // membrana.
  'envoltório nuclear': [
    'núcleo',
    'nucléolo',
    'membrana plasmática',
    'retículo endoplasmático rugoso',
  ],
  'membrana plasmática': [
    'parede celular',
    'envoltório nuclear',
    'retículo endoplasmático liso',
    'complexo golgiense',
    'cílios e flagelos',
  ],
  // Quem "dá forma e sustenta" pode ser a parede, o citoesqueleto ou o vacúolo
  // cheio de água empurrando por dentro. As três respostas são tentadoras e só
  // uma serve para cada enunciado.
  'parede celular': ['membrana plasmática', 'citoesqueleto', 'vacúolo central'],
  mitocôndria: ['cloroplasto', 'núcleo', 'peroxissomo'],
  cloroplasto: ['mitocôndria', 'núcleo', 'vacúolo central'],
  ribossomo: ['nucléolo', 'retículo endoplasmático rugoso', 'complexo golgiense'],
  'retículo endoplasmático rugoso': [
    'retículo endoplasmático liso',
    'ribossomo',
    'complexo golgiense',
    'envoltório nuclear',
  ],
  // Liso × peroxissomo não é chute: os dois desintoxicam no fígado, um
  // metabolizando álcool e remédio, o outro quebrando peróxido.
  'retículo endoplasmático liso': [
    'retículo endoplasmático rugoso',
    'complexo golgiense',
    'membrana plasmática',
    'peroxissomo',
  ],
  'complexo golgiense': [
    'retículo endoplasmático rugoso',
    'retículo endoplasmático liso',
    'lisossomo',
    'ribossomo',
    'membrana plasmática',
    'centríolo',
  ],
  lisossomo: ['peroxissomo', 'complexo golgiense', 'vacúolo central'],
  peroxissomo: ['lisossomo', 'mitocôndria', 'retículo endoplasmático liso'],
  'vacúolo central': ['lisossomo', 'parede celular', 'cloroplasto'],
  // Centríolo × complexo golgiense parece disparatado e não é: no
  // espermatozoide o acrossomo vem do golgiense e o flagelo vem do centríolo, e
  // trocar os dois é erro de prova todo ano.
  centríolo: ['citoesqueleto', 'cílios e flagelos', 'complexo golgiense'],
  citoesqueleto: ['centríolo', 'cílios e flagelos', 'parede celular'],
  'cílios e flagelos': ['centríolo', 'citoesqueleto', 'membrana plasmática'],
}

/**
 * O baralho, conferido linha a linha.
 *
 * As funções estão escritas para serem **mutuamente exclusivas**: nenhuma frase
 * daqui pode ter duas respostas defensáveis, porque a carta é de escolha e uma
 * ambiguidade não vira discussão, vira ponto perdido. O caso mais delicado é
 * ribossomo × retículo rugoso — "sintetiza proteína" serve para os dois —, e a
 * solução foi escrever cada um pelo que é *só* dele: o ribossomo lê o RNA
 * mensageiro e encadeia aminoácidos; o retículo rugoso recebe essa proteína
 * ainda nascendo e a encaminha para fora da célula. Mesma história em lisossomo
 * × peroxissomo, resolvida por "hidrolase em pH ácido" contra "catalase".
 */
export const ESTRUTURAS: readonly Estrutura[] = [
  {
    nome: 'núcleo',
    funcao: 'guarda o DNA da célula e é onde o RNA é transcrito',
    sinal: 'é o compartimento inteiro, não a membrana que o cerca nem o grânulo lá dentro',
    ocorrencia: 'ambas',
  },
  {
    nome: 'nucléolo',
    funcao: 'fabrica o RNA ribossômico e monta as subunidades que virão a ser ribossomos',
    sinal: 'região densa dentro do núcleo, sem membrana própria: faz a peça, não é a peça',
    ocorrencia: 'ambas',
  },
  {
    nome: 'envoltório nuclear',
    funcao: 'duas membranas cheias de poros que separam o material genético do citoplasma',
    sinal: 'é a fronteira do núcleo, e é contínua com o retículo rugoso',
    ocorrencia: 'ambas',
  },
  {
    nome: 'membrana plasmática',
    funcao:
      'bicamada de lipídios com proteínas embutidas que decide o que entra e o que sai da célula',
    sinal: 'permeabilidade seletiva; é o limite de toda célula, tenha ou não parede por fora',
    ocorrencia: 'ambas',
  },
  {
    nome: 'parede celular',
    funcao:
      'camada rígida de celulose por fora da membrana, que impede a célula de estourar em meio hipotônico',
    sinal: 'celulose, e fica por fora da membrana: são duas camadas, não uma',
    ocorrencia: 'vegetal',
    exclusividade:
      'a célula animal não tem parede nenhuma — é por isso que ela estoura em água pura e a vegetal só fica túrgida',
  },
  {
    nome: 'mitocôndria',
    funcao: 'faz a respiração celular aeróbica e entrega quase todo o ATP da célula',
    sinal: 'dupla membrana, cristas e DNA próprio: o ATP aeróbico sai daqui',
    ocorrencia: 'ambas',
  },
  {
    nome: 'cloroplasto',
    funcao: 'usa a energia da luz para transformar gás carbônico e água em glicose',
    sinal: 'clorofila nos tilacoides; como a mitocôndria, tem dupla membrana e DNA próprio',
    ocorrencia: 'vegetal',
    exclusividade:
      'só a célula vegetal (e a das algas) fotossintetiza — a animal tem mitocôndria, mas nenhum cloroplasto',
  },
  {
    nome: 'ribossomo',
    funcao: 'lê o RNA mensageiro e encadeia os aminoácidos na ordem que ele manda',
    sinal:
      'grânulo de rRNA e proteína, sem membrana: é a máquina da tradução, solta no citoplasma ou grudada no retículo',
    ocorrencia: 'ambas',
  },
  {
    nome: 'retículo endoplasmático rugoso',
    funcao:
      'recebe a proteína ainda nascendo, dobra e encaminha o que vai ser exportado ou ir para a membrana',
    sinal: 'rugoso por causa dos ribossomos grudados: quem traduz é o ribossomo, quem endereça é ele',
    ocorrencia: 'ambas',
  },
  {
    nome: 'retículo endoplasmático liso',
    funcao:
      'sintetiza lipídios e hormônios esteroides, estoca cálcio e desintoxica o organismo de álcool e remédios',
    sinal: 'sem ribossomos; no fígado é ele que metaboliza o que a pessoa bebeu e tomou',
    ocorrencia: 'ambas',
  },
  {
    nome: 'complexo golgiense',
    funcao:
      'recebe as vesículas vindas do retículo, glicosila, empacota e endereça cada proteína ao seu destino',
    sinal: 'pilha de bolsas achatadas: é a expedição, não a produção — e é dele que saem os lisossomos',
    ocorrencia: 'ambas',
  },
  {
    nome: 'lisossomo',
    funcao: 'bolsa de enzimas hidrolíticas em pH ácido que faz a digestão dentro da célula',
    sinal: 'hidrolases em pH ácido, e nasce do complexo golgiense',
    ocorrencia: 'ambas',
    ressalva:
      'quatro livros escolares em cinco tratam o lisossomo como exclusivo da célula animal; a vegetal faz a mesma digestão, dentro do vacúolo',
  },
  {
    nome: 'peroxissomo',
    funcao:
      'oxida ácidos graxos e usa a catalase para destruir o peróxido de hidrogênio antes que ele queime a célula',
    sinal: 'catalase quebrando água oxigenada: não é digestão em pH ácido, é oxidação',
    ocorrencia: 'ambas',
  },
  {
    nome: 'vacúolo central',
    funcao:
      'bolsa enorme de água e solutos que empurra o citoplasma contra a parede e mantém a célula túrgida',
    sinal: 'ocupa quase toda a célula e espreme o resto contra a parede',
    ocorrencia: 'vegetal',
    exclusividade:
      'a célula animal tem vesículas e vacúolos pequenos e passageiros; o vacúolo único e gigante é vegetal',
  },
  {
    nome: 'centríolo',
    funcao:
      'cilindro de microtúbulos que organiza o fuso na divisão celular e dá origem aos corpúsculos basais',
    sinal: 'nove trincas de microtúbulos em cilindro; é um centro organizador, não a rede inteira',
    ocorrencia: 'animal',
    exclusividade:
      'os vegetais superiores montam o fuso sem centríolo nenhum — a ausência é a marca deles',
  },
  {
    nome: 'citoesqueleto',
    funcao:
      'rede de microtúbulos e filamentos que sustenta a forma da célula e carrega vesículas de um lado para o outro',
    sinal: 'é a rede inteira, espalhada pelo citoplasma; o centríolo é só um dos pontos que a organizam',
    ocorrencia: 'ambas',
  },
  {
    nome: 'cílios e flagelos',
    funcao:
      'projeções que batem e movem a célula, ou movem o líquido que passa por cima dela',
    sinal: 'nove pares de microtúbulos em volta de um par central — o 9+2 é a assinatura',
    ocorrencia: 'ambas',
    ressalva:
      'a célula vegetal típica não tem nenhum dos dois, mas os anterozoides de samambaias e briófitas são flagelados',
  },
]
