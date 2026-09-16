/**
 * Relações ecológicas: o caso concreto de um lado, o nome da relação do outro.
 *
 * **O dado central não é o nome da relação — são os dois eixos.** Harmônica ou
 * desarmônica (alguém sai prejudicado?) e intraespecífica ou interespecífica (é
 * dentro da espécie ou entre espécies?) é o que organiza o conteúdo inteiro, e
 * decorar "comensalismo" sem saber em que quadrante ele cai é decorar uma
 * palavra. Por isso os dois eixos moram na ficha da relação e são o que o
 * gabarito mostra depois de cada carta — repetir o nome que a pessoa acabou de
 * errar não ensina nada, pelo mesmo motivo que o gabarito das escolas literárias
 * traz o período e a marca da escola.
 *
 * **Os eixos ficam na relação, não no caso, com uma exceção deliberada.** A
 * harmonia é definição: parasitismo é desarmônico em todo caso possível, e
 * deixar cada caso declarar isso seria abrir a porta para o dataset se
 * contradizer. Já o escopo depende do caso em duas relações — competição
 * acontece entre duas espécies (leão e hiena na mesma carcaça) e dentro de uma
 * (dois machos de veado no mesmo território), e canibalismo é predatismo
 * intraespecífico. Nessas duas, e só nelas, o caso declara o escopo e
 * `escopoDe()` recusa tanto a omissão quanto a declaração incompatível. Nas
 * outras nove o caso **não pode** declarar escopo: informação repetida é
 * informação que diverge.
 *
 * **Caso de relação de escopo duplo não declara `confundeCom`.** É a contrapartida
 * do parágrafo acima: quando o escopo é decisão do caso, a carta que o jogo monta
 * deixa de ser "qual das onze" e passa a ser o cruzamento dos dois eixos — as duas
 * relações de escopo duplo, cada uma nos dois escopos. Não sobra alternativa para
 * uma confusão particular, e aceitá-la escrita seria guardar um dado que ninguém
 * lê. `distratoresDe()` recusa. A confusão que o caso quisesse desfazer cabe na
 * `disputa`, que vai para a tela de qualquer jeito — é o que a dioneia faz.
 *
 * **Nenhuma das onze é exclusivamente intraespecífica**, e isso não é descuido:
 * colônia e sociedade — as duas harmônicas de dentro da espécie — ficaram fora
 * da lista que este jogo classifica. Elas pedem outra pergunta ("os indivíduos
 * são anatomicamente ligados?"), e enfiá-las aqui faria a carta de uma colmeia
 * competir com a de um cardume por um critério que o jogador não tem como
 * adivinhar.
 *
 * ## Classificação é decisão, não fato
 *
 * Meia dúzia de casos clássicos não tem uma resposta só na literatura escolar.
 * O tratamento é o mesmo que `capitais.ts` dá a capital disputada: **escolhe-se
 * uma**, ela é o gabarito, e o caso carrega por escrito a razão da escolha e
 * qual é a outra leitura. O texto vai para a tela junto do resultado, porque
 * esconder a disputa do jogador seria ensinar uma certeza que não existe:
 *
 * - **Anêmona × peixe-palhaço** — canônica **protocooperação**. Os dois ganham
 *   (o peixe tem abrigo entre os tentáculos urticantes, a anêmona ganha
 *   limpeza, restos de comida e defesa contra peixes-borboleta) e a anêmona
 *   vive perfeitamente sem o peixe. É a assimetria que decide: mutualismo exige
 *   que nenhum dos dois sobreviva sozinho, e só o peixe-palhaço está nessa
 *   situação. Boa parte dos livros escreve "mutualismo" aqui.
 * - **Rêmora × tubarão** — canônica **comensalismo**. A rêmora se gruda para
 *   ser transportada *e* para comer os restos da caça, e é o alimento que dá
 *   nome à coisa: comensal é quem come à mesa. Quem olha só a carona classifica
 *   como inquilinismo, o que não é absurdo — é só olhar metade do caso.
 * - **Cracas × baleia** — canônica **comensalismo**, pela mesma régua: a craca
 *   filtra o plâncton que a baleia empurra ao nadar, o que é alimento e não só
 *   pouso. A leitura de inquilinismo (a pele como substrato) é comum.
 * - **Orquídea × árvore** — canônica **epifitismo**, que é o nome específico de
 *   planta que se apoia em planta para alcançar a luz, sem tirar seiva. Muitos
 *   livros dissolvem o epifitismo em comensalismo ou em inquilinismo, por ser
 *   um caso particular deles. O jogo mantém o nome específico porque é ele que
 *   a prova cobra, e porque sem ele o contraste com o cipó-chumbo — que parece
 *   epífita e é parasita — se perde.
 * - **Mosquito hematófago** — canônica **parasitismo**. A fêmea suga e vai
 *   embora sem matar: é parasita temporário, não predador. Quem chama de
 *   predatismo confunde "causar dano" com "matar para comer".
 * - **Chupim × tico-tico** — canônica **parasitismo** (de ninhada). O chupim
 *   não escraviza o tico-tico adulto; ele impõe um filhote que consome o
 *   cuidado alheio, e o hospedeiro é quem perde. A leitura de esclavagismo
 *   existe e é defensável, já que o trabalho alheio é o recurso apropriado.
 * - **Formiga × pulgão** — canônica **esclavagismo** (sinfilia). A formiga
 *   protege o pulgão e o "ordenha", ficando com a secreção açucarada que seria
 *   dele; o pulgão ganha proteção e perde o produto. Metade dos livros trata
 *   como protocooperação, olhando só a proteção.
 * - **Louva-a-deus fêmea × macho** — canônica **predatismo**, no escopo
 *   intraespecífico: canibalismo é predatismo dentro da espécie, e não uma
 *   categoria à parte. Alguns livros listam "canibalismo" como relação própria;
 *   como ela não está entre as onze que o jogo classifica, o caso entra pelo
 *   escopo, que é justamente o eixo que o jogo quer treinar.
 * - **Nogueira-preta (alelopatia)** — canônica **amensalismo**. A juglona
 *   liberada pela raiz impede outras plantas de brotar embaixo, e a nogueira
 *   não se alimenta delas nem disputa nada diretamente. Há quem leia como
 *   competição por interferência, argumentando que sobra recurso para a
 *   nogueira — o que é consequência, não o mecanismo da relação.
 * - **Planta carnívora × mosca** — canônica **predatismo**, e aqui não há
 *   disputa nenhuma na literatura: a leitura errada ("herbivoria, porque tem
 *   planta") é comum o bastante entre alunos para merecer o texto na tela.
 * - **Vaca × capim** — canônica **herbivoria**. A vaca consome sem matar a
 *   touceira, o que faz a relação parecer parasitismo; é exatamente por causa
 *   dessa fronteira borrada que a herbivoria tem nome próprio.
 *
 * ## O que este arquivo deliberadamente NÃO tem
 *
 * O **pássaro-palito catando restos entre os dentes do crocodilo** é o exemplo
 * mais citado de protocooperação em livro didático brasileiro e não está aqui.
 * A cena vem de Heródoto e não tem registro de campo que a sustente; os
 * exemplos de limpeza bem documentados são outros, e o peixe-limpador está
 * nesta lista no lugar dele. Um dataset cuja regra é "gabarito conferido à mão"
 * não pode ter como carta uma anedota de 2.400 anos.
 */

export const RELACOES = [
  'Mutualismo',
  'Protocooperação',
  'Comensalismo',
  'Inquilinismo',
  'Epifitismo',
  'Parasitismo',
  'Predatismo',
  'Competição',
  'Amensalismo',
  'Herbivoria',
  'Esclavagismo',
] as const
export type Relacao = (typeof RELACOES)[number]

export type Harmonia = 'harmônica' | 'desarmônica'
export type Escopo = 'intraespecífica' | 'interespecífica'

export interface FichaRelacao {
  readonly nome: Relacao
  readonly harmonia: Harmonia
  /**
   * Em que escopos a relação existe. Uma só entrada = o caso não declara nada;
   * duas = o caso é obrigado a declarar. Ver `escopoDe()`.
   */
  readonly escopos: readonly Escopo[]
  /** O que define a relação, em uma linha. Vai para o gabarito de quem errou. */
  readonly marca: string
  /**
   * As relações com que esta se confunde de verdade, da mais tentadora para a
   * menos — é daqui que saem os distratores.
   *
   * **Mora no dataset porque é julgamento biológico, não contagem.** É a mesma
   * fronteira que separa as formas irmãs da geometria molecular (contagem de
   * domínios, logo montagem, logo dentro do jogo) das escolas vizinhas na linha
   * do tempo (ordem do array, idem). Saber que inquilinismo encosta em
   * epifitismo e não em predatismo é conteúdo, e conteúdo fica onde quem mexe
   * no conteúdo o vê.
   *
   * Oferecer "amensalismo" para o carrapato no boi não mede nada, porque
   * ninguém erra assim. Oferecer "predatismo" mede a coisa inteira.
   */
  readonly confundeCom: readonly Relacao[]
}

/**
 * As onze fichas.
 *
 * `confundeCom` tem exatamente três entradas em todas — não por simetria
 * estética, mas porque três é o que o jogo consome. O teste cobra o mínimo de
 * três, e o jogo **quebra** se faltar: carta com duas alternativas continua
 * jogável, pontua e não parece defeito nenhum na tela, que é exatamente o tipo
 * de erro que ninguém descobre jogando. Falhar na montagem do baralho põe o
 * estrago no teste, onde ele custa barato.
 */
export const FICHAS: readonly FichaRelacao[] = [
  {
    nome: 'Mutualismo',
    harmonia: 'harmônica',
    escopos: ['interespecífica'],
    marca: 'os dois ganham e nenhum dos dois sobrevive sem o outro — a associação é obrigatória',
    confundeCom: ['Protocooperação', 'Comensalismo', 'Inquilinismo'],
  },
  {
    nome: 'Protocooperação',
    harmonia: 'harmônica',
    escopos: ['interespecífica'],
    marca: 'os dois ganham, mas cada um vive sozinho se precisar — a associação é facultativa',
    confundeCom: ['Mutualismo', 'Comensalismo', 'Esclavagismo'],
  },
  {
    nome: 'Comensalismo',
    harmonia: 'harmônica',
    escopos: ['interespecífica'],
    marca: 'um aproveita o alimento que sobra e o outro não ganha nem perde nada',
    // Amensalismo entra na lista por um motivo prosaico e real: as duas
    // palavras diferem por uma letra, e trocar uma pela outra é o erro mais
    // comum da prova. Distrator não precisa ser sofisticado para ser honesto.
    confundeCom: ['Inquilinismo', 'Amensalismo', 'Protocooperação'],
  },
  {
    nome: 'Inquilinismo',
    harmonia: 'harmônica',
    escopos: ['interespecífica'],
    marca: 'um usa o outro como abrigo ou suporte, sem tirar alimento dele e sem prejudicá-lo',
    confundeCom: ['Comensalismo', 'Epifitismo', 'Parasitismo'],
  },
  {
    nome: 'Epifitismo',
    harmonia: 'harmônica',
    escopos: ['interespecífica'],
    marca: 'uma planta se apoia em outra para alcançar a luz, sem enfiar raiz nela',
    confundeCom: ['Inquilinismo', 'Comensalismo', 'Parasitismo'],
  },
  {
    nome: 'Parasitismo',
    harmonia: 'desarmônica',
    escopos: ['interespecífica'],
    marca: 'um retira alimento do corpo do outro e o debilita, em geral sem matá-lo',
    confundeCom: ['Predatismo', 'Comensalismo', 'Herbivoria'],
  },
  {
    nome: 'Predatismo',
    harmonia: 'desarmônica',
    // O segundo escopo existe por causa do canibalismo, que é predatismo dentro
    // da espécie. Ver a nota do louva-a-deus no cabeçalho.
    escopos: ['interespecífica', 'intraespecífica'],
    marca: 'um mata o outro para comer',
    confundeCom: ['Herbivoria', 'Parasitismo', 'Competição'],
  },
  {
    nome: 'Competição',
    harmonia: 'desarmônica',
    escopos: ['interespecífica', 'intraespecífica'],
    marca: 'os dois disputam o mesmo recurso escasso e os dois saem perdendo',
    confundeCom: ['Amensalismo', 'Predatismo', 'Herbivoria'],
  },
  {
    nome: 'Amensalismo',
    harmonia: 'desarmônica',
    escopos: ['interespecífica'],
    marca: 'um libera substância que inibe o outro, sem tirar proveito nenhum disso',
    confundeCom: ['Competição', 'Comensalismo', 'Parasitismo'],
  },
  {
    nome: 'Herbivoria',
    harmonia: 'desarmônica',
    escopos: ['interespecífica'],
    marca: 'o animal consome a planta viva, em geral sem matá-la',
    confundeCom: ['Predatismo', 'Parasitismo', 'Competição'],
  },
  {
    nome: 'Esclavagismo',
    harmonia: 'desarmônica',
    escopos: ['interespecífica'],
    marca: 'um se apropria do trabalho ou do produto do outro — também chamado sinfilia',
    confundeCom: ['Parasitismo', 'Protocooperação', 'Predatismo'],
  },
]

const POR_NOME: ReadonlyMap<Relacao, FichaRelacao> = new Map(FICHAS.map((f) => [f.nome, f]))

/** Lança em relação não cadastrada: carta sem ficha é carta sem gabarito. */
export function fichaDe(relacao: Relacao): FichaRelacao {
  const ficha = POR_NOME.get(relacao)
  if (!ficha) throw new Error(`relação sem ficha: ${relacao}`)
  return ficha
}

export interface Caso {
  readonly id: string
  /**
   * O caso como aparece na tela.
   *
   * Regra dura: **não pode conter o nome da relação nem o radical dele**. "O
   * cupim e o protozoário que vive em mutualismo com ele" é uma carta que se
   * responde sem saber biologia nenhuma, e é o tipo de vazamento que passa
   * despercebido na revisão. O teste procura por isso em todas as cartas.
   */
  readonly enunciado: string
  readonly relacao: Relacao
  /** Obrigatório — e só permitido — quando a relação admite os dois escopos. */
  readonly escopo?: Escopo
  /**
   * Confusão deste caso específico, à frente das da relação.
   *
   * Existe porque a confusão nem sempre é da relação: parasitismo se confunde
   * com predatismo *em geral*, mas o cipó-chumbo se confunde com epifitismo, e
   * é justamente esse par que a carta existe para desfazer. Sem isto o caso
   * mais instrutivo do dataset viraria o mais fácil.
   *
   * Proibido nas relações de escopo duplo — ver o cabeçalho e `distratoresDe()`.
   */
  readonly confundeCom?: readonly Relacao[]
  /** Classificação disputada: por que esta, e qual é a outra leitura. */
  readonly disputa?: string
}

/**
 * O escopo do caso, com as duas guardas que o desenho pede.
 *
 * Omitir escopo numa relação de escopo duplo é erro de cadastro, e declarar
 * escopo numa relação de escopo único também é: no primeiro caso o dado falta,
 * no segundo ele passa a existir em dois lugares e um dia vai divergir do
 * outro. As duas situações explodem aqui, na carga do baralho, e não viram
 * carta errada.
 */
export function escopoDe(caso: Caso): Escopo {
  const { escopos } = fichaDe(caso.relacao)
  const unico = escopos.length === 1 ? escopos[0] : undefined

  // A compatibilidade é checada **antes** da arity, e não depois, porque na
  // ordem contrária esta linha era inalcançável: um caso de herbivoria
  // declarando escopo intraespecífico caía no "não declare escopo" e saía com a
  // mensagem errada — o problema dele não é declarar, é declarar o que a relação
  // não admite.
  if (caso.escopo !== undefined && !escopos.includes(caso.escopo)) {
    throw new Error(`${caso.id}: ${caso.relacao} não existe como ${caso.escopo}`)
  }

  if (unico !== undefined) {
    if (caso.escopo !== undefined) {
      throw new Error(`${caso.id}: ${caso.relacao} só existe como ${unico}; não declare escopo`)
    }
    return unico
  }

  if (caso.escopo === undefined) {
    throw new Error(`${caso.id}: ${caso.relacao} existe nos dois escopos; o caso tem de declarar um`)
  }
  return caso.escopo
}

export function harmoniaDe(caso: Caso): Harmonia {
  return fichaDe(caso.relacao).harmonia
}

/**
 * As classificações erradas que alguém de fato marca, na ordem em que tentam.
 *
 * O caso vem primeiro, a relação depois, sem repetição e sem a resposta certa.
 * Quem monta as quatro opções é o jogo — aqui só se diz *quais* confusões são
 * reais, que é a parte que depende de biologia.
 */
export function distratoresDe(caso: Caso): readonly Relacao[] {
  if (caso.confundeCom !== undefined && fichaDe(caso.relacao).escopos.length > 1) {
    throw new Error(
      `${caso.id}: ${caso.relacao} tem escopo duplo; a carta é o cruzamento dos eixos e não usa confundeCom`,
    )
  }

  const vistos = new Set<Relacao>([caso.relacao])
  const saida: Relacao[] = []
  for (const r of [...(caso.confundeCom ?? []), ...fichaDe(caso.relacao).confundeCom]) {
    if (vistos.has(r)) continue
    vistos.add(r)
    saida.push(r)
  }
  return saida
}

/** "Protocooperação — harmônica e interespecífica: os dois ganham, mas…". */
export function descreverCaso(caso: Caso): string {
  const ficha = fichaDe(caso.relacao)
  return `${ficha.nome} — ${ficha.harmonia} e ${escopoDe(caso)}: ${ficha.marca}`
}

/**
 * Os casos, agrupados pela relação só para leitura — o baralho é embaralhado.
 *
 * Todo caso é uma cena concreta e verificável, não uma definição disfarçada. É
 * a mesma exigência que o dataset de escolas literárias faz ao recusar
 * "característica → escola": se o gabarito depender de como eu redigi a frase,
 * o item parece checável e não é.
 */
export const CASOS: readonly Caso[] = [
  // --- mutualismo: os dois ganham e nenhum vive sozinho ----------------------
  {
    id: 'cupim-protozoario',
    enunciado: 'O cupim e o protozoário que digere a celulose dentro do intestino dele',
    relacao: 'Mutualismo',
  },
  {
    id: 'liquen',
    enunciado: 'O fungo e a alga que juntos formam o líquen',
    relacao: 'Mutualismo',
  },
  {
    id: 'micorriza',
    enunciado: 'O fungo que envolve a raiz do pinheiro e lhe passa água e fósforo',
    relacao: 'Mutualismo',
  },
  {
    id: 'rizobio',
    enunciado: 'A bactéria Rhizobium nos nódulos da raiz da soja, fixando nitrogênio',
    relacao: 'Mutualismo',
  },
  {
    id: 'rumen',
    enunciado: 'As bactérias do rúmen do boi, que quebram o capim que ele não digere',
    relacao: 'Mutualismo',
  },
  {
    id: 'figo-vespa',
    enunciado: 'A figueira e a vespa-do-figo, que só se reproduz dentro do figo',
    relacao: 'Mutualismo',
  },

  // --- protocooperação: os dois ganham e cada um vive sozinho ----------------
  {
    id: 'anemona-peixe-palhaco',
    enunciado: 'A anêmona e o peixe-palhaço que se abriga entre os tentáculos dela',
    relacao: 'Protocooperação',
    disputa:
      'Os dois ganham, mas a anêmona vive bem sem o peixe — associação facultativa é protocooperação. Boa parte dos livros escreve "mutualismo" aqui; mutualismo exigiria que nenhum dos dois sobrevivesse sozinho.',
  },
  {
    id: 'eremita-anemona',
    enunciado: 'O caranguejo-eremita que carrega a anêmona grudada na concha',
    relacao: 'Protocooperação',
  },
  {
    id: 'anu-boi',
    enunciado: 'O anu-branco catando carrapatos no lombo do boi',
    relacao: 'Protocooperação',
  },
  {
    id: 'peixe-limpador',
    enunciado: 'O peixe-limpador e a garoupa, que abre a boca e o deixa entrar',
    relacao: 'Protocooperação',
  },
  {
    id: 'abelha-flor',
    enunciado: 'A abelha e a flor de laranjeira que ela poliniza',
    relacao: 'Protocooperação',
    disputa:
      'Nem a abelha depende dessa flor nem a flor daquela abelha: qualquer um dos dois troca de parceiro. Compare com a figueira e a vespa-do-figo, onde nenhum dos dois existe sem o outro — ali, e só ali, é mutualismo.',
  },

  // --- comensalismo: um come o que sobra, o outro é indiferente --------------
  {
    id: 'remora-tubarao',
    enunciado: 'A rêmora grudada no tubarão pela ventosa da cabeça',
    relacao: 'Comensalismo',
    disputa:
      'A rêmora pega carona e come os restos da caça; é o alimento que nomeia a relação — comensal é quem come à mesa. Quem olha só o transporte classifica como inquilinismo.',
  },
  {
    id: 'urubu-onca',
    enunciado: 'O urubu que come o que a onça deixou da capivara',
    relacao: 'Comensalismo',
  },
  {
    id: 'entamoeba-coli',
    enunciado: 'A Entamoeba coli no intestino humano, comendo restos sem causar doença',
    relacao: 'Comensalismo',
  },
  {
    id: 'cracas-baleia',
    enunciado: 'As cracas fixadas na pele da baleia, filtrando o plâncton que ela empurra',
    relacao: 'Comensalismo',
    disputa:
      'A craca ganha alimento, e não só um lugar para ficar — por isso comensalismo e não inquilinismo, que é a leitura comum de quem vê a pele apenas como substrato.',
  },

  // --- inquilinismo: abrigo ou suporte, sem alimento e sem prejuízo ----------
  {
    id: 'fierasfer-pepino',
    // "Peixe-agulha" estava errado e era erro caro: peixe-agulha é o
    // Strongylura, que nada em cardume na superfície e não entra em pepino
    // nenhum. O inquilino do pepino-do-mar é o Fierasfer (peixe-pérola), que é
    // como o exemplo aparece em livro brasileiro.
    enunciado: 'O peixe-pérola (Fierasfer) que passa o dia dentro do corpo do pepino-do-mar',
    relacao: 'Inquilinismo',
  },
  {
    id: 'peixe-ourico',
    enunciado: 'O peixinho que se esconde entre os espinhos do ouriço-do-mar',
    relacao: 'Inquilinismo',
  },
  {
    id: 'sapo-bromelia',
    enunciado: 'O sapinho que vive na água acumulada entre as folhas da bromélia',
    relacao: 'Inquilinismo',
  },
  {
    id: 'joao-de-barro',
    enunciado: 'O joão-de-barro que constrói o ninho no galho da árvore',
    relacao: 'Inquilinismo',
  },

  // --- epifitismo: planta sobre planta, atrás de luz -------------------------
  {
    id: 'orquidea-arvore',
    enunciado: 'A orquídea presa ao tronco da árvore, com as raízes soltas no ar',
    relacao: 'Epifitismo',
    disputa:
      'As raízes ficam no ar e captam umidade: não entram no tronco nem tiram seiva. Vários livros dissolvem o epifitismo em comensalismo ou inquilinismo, por ser um caso particular deles; o nome específico fica porque é ele que separa a orquídea do cipó-chumbo.',
  },
  {
    id: 'bromelia-galho',
    enunciado: 'A bromélia instalada no galho alto, onde chega sol',
    relacao: 'Epifitismo',
  },
  {
    id: 'samambaia-tronco',
    enunciado: 'A samambaia brotando na forquilha do tronco, sem tocar o chão',
    relacao: 'Epifitismo',
  },

  // --- parasitismo: vive à custa do corpo do outro ---------------------------
  {
    id: 'carrapato-boi',
    enunciado: 'O carrapato preso ao boi, sugando o sangue dele',
    relacao: 'Parasitismo',
  },
  {
    id: 'lombriga',
    enunciado: 'A lombriga no intestino humano, comendo o que a pessoa comeu',
    relacao: 'Parasitismo',
  },
  {
    id: 'pulga-cao',
    enunciado: 'A pulga instalada no pelo do cão, que não para de se coçar',
    relacao: 'Parasitismo',
  },
  {
    id: 'cipo-chumbo',
    enunciado: 'O cipó-chumbo enrolado no arbusto, com filamentos enfiados no caule dele',
    relacao: 'Parasitismo',
    // Sem isto o caso vira o mais fácil do baralho: a carta existe para o
    // jogador reparar nos haustórios, e só repara quem tem "epifitismo" na tela.
    confundeCom: ['Epifitismo'],
  },
  {
    id: 'erva-de-passarinho',
    enunciado: 'A erva-de-passarinho instalada no galho, puxando seiva pela casca',
    relacao: 'Parasitismo',
    confundeCom: ['Epifitismo'],
  },
  {
    id: 'mosquito-hematofago',
    enunciado: 'A fêmea do mosquito que suga o sangue da pessoa e vai embora',
    relacao: 'Parasitismo',
    disputa:
      'Suga e não mata: é parasita temporário. Quem responde predatismo trocou "causar dano" por "matar para comer".',
  },
  {
    id: 'chupim-tico-tico',
    enunciado: 'O chupim que põe o ovo no ninho do tico-tico e vai embora',
    relacao: 'Parasitismo',
    confundeCom: ['Esclavagismo'],
    disputa:
      'É parasitismo de ninhada: quem perde é o tico-tico, que cria filhote alheio. A leitura de esclavagismo é defensável — o recurso apropriado é o trabalho do outro —, mas o chupim adulto não domina nem obriga o hospedeiro.',
  },

  // --- predatismo: mata para comer ------------------------------------------
  {
    id: 'onca-capivara',
    enunciado: 'A onça-pintada que abate a capivara na beira do rio',
    relacao: 'Predatismo',
    escopo: 'interespecífica',
  },
  {
    id: 'joaninha-pulgao',
    enunciado: 'A joaninha solta na lavoura para devorar os pulgões',
    relacao: 'Predatismo',
    escopo: 'interespecífica',
  },
  {
    id: 'dioneia-mosca',
    enunciado: 'A planta carnívora que fecha a folha sobre a mosca e a digere',
    relacao: 'Predatismo',
    escopo: 'interespecífica',
    // A inversão é o ponto: a planta come o animal. Ela não cabe mais nas
    // alternativas — carta de relação de escopo duplo é o cruzamento dos eixos —,
    // então vai por escrito, que aliás ensina melhor do que uma opção a mais:
    // "herbivoria" ali seria uma pegadinha, e aqui é uma frase que fica.
    disputa:
      'Quem responde herbivoria inverteu os papéis: herbivoria é o animal que come a planta. Aqui é a planta que captura e digere o animal, e capturar para comer é predatismo, venha de que reino vier.',
  },
  {
    id: 'louva-a-deus',
    enunciado: 'A fêmea do louva-a-deus que devora o macho depois da cópula',
    relacao: 'Predatismo',
    escopo: 'intraespecífica',
    disputa:
      'Canibalismo é predatismo dentro da própria espécie, e não uma categoria à parte: alguns livros o listam separado, mas o que muda em relação à onça e à capivara é só o escopo.',
  },

  // --- competição: os dois disputam e os dois perdem -------------------------
  {
    id: 'leao-hiena',
    enunciado: 'O leão e a hiena disputando a mesma carcaça',
    relacao: 'Competição',
    escopo: 'interespecífica',
  },
  {
    id: 'capim-soja',
    enunciado: 'O capim-amargoso e a soja dividindo água e nitrogênio no mesmo talhão',
    relacao: 'Competição',
    escopo: 'interespecífica',
  },
  {
    id: 'veados-territorio',
    enunciado: 'Dois machos de veado batendo galhada pelo mesmo território no cio',
    relacao: 'Competição',
    escopo: 'intraespecífica',
  },
  {
    id: 'eucalipto-adensado',
    enunciado: 'As mudas de eucalipto plantadas juntas demais, disputando a mesma luz',
    relacao: 'Competição',
    escopo: 'intraespecífica',
  },

  // --- amensalismo: um inibe o outro sem ganhar nada com isso ----------------
  {
    id: 'penicillium',
    enunciado: 'O fungo Penicillium, em volta do qual as bactérias da placa não crescem',
    relacao: 'Amensalismo',
  },
  {
    id: 'mare-vermelha',
    enunciado: 'A maré vermelha: o dinoflagelado libera toxina e os peixes morrem',
    relacao: 'Amensalismo',
  },
  {
    id: 'nogueira-juglona',
    enunciado: 'A nogueira-preta, cuja raiz libera juglona e impede o que brotaria embaixo dela',
    relacao: 'Amensalismo',
    disputa:
      'A nogueira não se alimenta das plantas inibidas nem disputa nada diretamente com elas — inibir sem ganhar é amensalismo. Há quem leia como competição por interferência, pelo recurso que sobra; sobrar recurso é consequência, não o mecanismo.',
  },

  // --- herbivoria: come a planta viva ---------------------------------------
  {
    id: 'gafanhotos-milho',
    enunciado: 'A nuvem de gafanhotos que cai sobre a lavoura de milho',
    relacao: 'Herbivoria',
  },
  {
    id: 'lagarta-repolho',
    enunciado: 'A lagarta comendo as folhas do pé de repolho',
    relacao: 'Herbivoria',
  },
  {
    id: 'vaca-capim',
    enunciado: 'A vaca pastando o capim do piquete',
    relacao: 'Herbivoria',
    disputa:
      'A touceira rebrota: o animal consome sem matar, o que é herbivoria. É porque a fronteira com o parasitismo é essa mesma — dano sem morte — que a herbivoria tem nome próprio.',
  },

  // --- esclavagismo: apropria-se do trabalho ou do produto alheio ------------
  {
    id: 'formiga-pulgao',
    enunciado: 'A formiga que protege o pulgão e fica com a secreção açucarada dele',
    relacao: 'Esclavagismo',
    disputa:
      'O pulgão ganha proteção e perde o produto: quem fica com o açúcar é a formiga. Metade dos livros trata como protocooperação, olhando só a proteção e ignorando de quem é o que está sendo levado.',
  },
  {
    id: 'formiga-amazona',
    enunciado: 'As formigas que raptam pupas de outro formigueiro e as põem para trabalhar',
    relacao: 'Esclavagismo',
  },
]
