import type { Grupo } from './taxonomia'

/**
 * Nomenclatura binomial: o nome científico e o bicho (ou a planta) que ele nomeia.
 *
 * ## A direção é nome científico → nome popular, e não o contrário
 *
 * O caminho inverso foi considerado e descartado por dois motivos independentes.
 * O primeiro é a régua do projeto contra datilografia: digitar
 * "Canis lupus familiaris" contra o relógio são 22 caracteres de latim, e a
 * carta passaria a medir teclado — o mesmo defeito que tirou "ácido carboxílico"
 * do teclado em `funcoes-organicas.ts`. O segundo é pior: "cachorro" tem uma
 * resposta científica só, mas "gato" também nomeia o gato-do-mato, "abelha"
 * nomeia centenas de espécies e "tomate" nomeia a planta e o fruto. Perguntar
 * popular → científico obrigaria a fingir que cada nome popular designa uma
 * espécie, que é justamente a falsidade que a nomenclatura binomial existe para
 * corrigir.
 *
 * Na direção escolhida nada disso acontece: `Panthera onca` designa uma coisa só
 * no mundo inteiro, e a resposta é uma palavra curta em português.
 *
 * ## A caixa é cobrada, e em carta separada
 *
 * Gênero com inicial maiúscula e epíteto específico sempre minúsculo é **regra**
 * do Código Internacional de Nomenclatura, não estilo de revista: `Panthera Onca`
 * está errado do mesmo jeito que `H2o` está errado. Havia três saídas:
 *
 * 1. **não cobrar** — foi o que quase aconteceu, e seria o pior dos mundos: o
 *    jogo mostraria a grafia certa cinquenta vezes sem nunca dizer que ela é
 *    obrigatória, e o jogador sairia achando que "Panthera Onca" é aceitável;
 * 2. **cobrar na digitação**, com `EspecResposta` do tipo `simbolo`, em que a
 *    caixa é a informação (é para isso que aquele tipo existe). Cai pelo mesmo
 *    motivo da direção inversa: seria digitar latim;
 * 3. **cobrar em cartas próprias, de escolha** — oito delas, misturadas ao
 *    baralho, mostrando o mesmo nome em quatro caixas diferentes. É o que está
 *    aqui.
 *
 * Sim, depois de duas ou três dessas cartas o jogador aprende o formato e acerta
 * as outras sem pensar. **É o objetivo, não um defeito** — a regra é uma só, e
 * `nomenclatura-acidos` já estabeleceu no projeto que um baralho pode ser uma
 * regra em vez de um acervo. Por isso são oito e não trinta e duas: cobrar a
 * mesma regra em toda carta encheria metade do baralho de repetição.
 *
 * O itálico, que é a outra metade da convenção tipográfica, **não** é cobrado: o
 * `Conteudo` do projeto é texto puro, a carta não tem como exibir a diferença, e
 * uma pergunta cuja resposta a tela não sabe mostrar não é pergunta. O
 * `comoJogar` diz isso em voz alta.
 *
 * ## O que é compartilhado com `taxonomia.ts`
 *
 * O tipo `Grupo` vem de lá por importação — ter duas listas de "mamífero,
 * inseto, planta" era garantia de divergência silenciosa. E sete espécies daqui
 * **são** cartas de lá; nesses casos `serVivo` guarda o id, e
 * `nomes-cientificos.test.ts` confere que nome popular e grupo não divergiram.
 * Nunca por cópia: copiar "ornitorrinco" nos dois arquivos faria uma correção
 * num deles passar despercebida no outro.
 *
 * O critério para haver link é estreito de propósito: só quando o nome popular
 * do card de taxonomia designa **esta** espécie e nenhuma outra. "Golfinho" são
 * quarenta espécies e "polvo" são centenas, então essas cartas não se ligam a
 * nada, ainda que os bichos se pareçam; já "ornitorrinco" e "baleia-azul" são
 * uma espécie cada, e aí o link é um fato, não uma aproximação.
 */

export interface Especie {
  /** Sem acento, kebab-case: é chave, não texto de tela. */
  readonly id: string
  /** O binômio (ou trinômio), escrito **corretamente**. É a pergunta. */
  readonly binomio: string
  /** A resposta, em minúscula. */
  readonly popular: string
  /** Outras formas correntes em pt-BR. */
  readonly sinonimos: readonly string[]
  /** Vocabulário de `taxonomia.ts`. Vira a dica da carta. */
  readonly grupo: Grupo
  /** Esta espécie também rende uma carta de grafia. */
  readonly grafia?: true
  /** Id do ser vivo em `taxonomia.ts`, quando é o mesmo bicho. */
  readonly serVivo?: string
  /** Ressalva que a carta diz mesmo aceitando a resposta. */
  readonly aviso?: string
}

/**
 * O acervo.
 *
 * Escolhido para caber na cabeça de quem terminou o ensino médio: os nomes que
 * aparecem em prova, em bula, em rótulo e em documentário. Nada de espécie que
 * só existe em chave de identificação — um baralho com *Latrodectus curacaviensis*
 * mediria acesso a literatura, não repertório.
 *
 * Os trinômios estão aqui de propósito e são dois: `Canis lupus familiaris` e
 * `Gallus gallus domesticus`. Sem eles a regra ensinada seria "duas palavras",
 * quando a regra é sobre *quais* palavras — a subespécie também vai em
 * minúscula, e é o erro que aparece em trabalho escolar toda semana.
 */
export const ESPECIES: readonly Especie[] = [
  // --- mamíferos
  {
    id: 'panthera-onca',
    binomio: 'Panthera onca',
    popular: 'onça-pintada',
    sinonimos: ['onça', 'jaguar'],
    grupo: 'mamífero',
    grafia: true,
  },
  {
    id: 'homo-sapiens',
    binomio: 'Homo sapiens',
    popular: 'ser humano',
    sinonimos: ['humano', 'homem', 'gente', 'pessoa'],
    grupo: 'mamífero',
    grafia: true,
  },
  {
    id: 'canis-lupus-familiaris',
    binomio: 'Canis lupus familiaris',
    popular: 'cachorro',
    sinonimos: ['cão', 'cão doméstico', 'cachorro doméstico'],
    grupo: 'mamífero',
    grafia: true,
    aviso:
      'Três palavras porque é subespécie: o cachorro é a forma domesticada de Canis lupus, o lobo-cinzento. Parte dos autores prefere tratá-lo como espécie à parte e escreve Canis familiaris — a disputa é real e não se resolve por gosto.',
  },
  {
    id: 'felis-catus',
    binomio: 'Felis catus',
    popular: 'gato',
    sinonimos: ['gato doméstico'],
    grupo: 'mamífero',
    grafia: true,
  },
  {
    id: 'panthera-leo',
    binomio: 'Panthera leo',
    popular: 'leão',
    sinonimos: [],
    grupo: 'mamífero',
  },
  {
    id: 'panthera-tigris',
    binomio: 'Panthera tigris',
    popular: 'tigre',
    sinonimos: [],
    grupo: 'mamífero',
  },
  {
    id: 'balaenoptera-musculus',
    binomio: 'Balaenoptera musculus',
    popular: 'baleia-azul',
    sinonimos: [],
    grupo: 'mamífero',
    serVivo: 'baleia-azul',
  },
  {
    id: 'ornithorhynchus-anatinus',
    binomio: 'Ornithorhynchus anatinus',
    popular: 'ornitorrinco',
    sinonimos: [],
    grupo: 'mamífero',
    serVivo: 'ornitorrinco',
  },
  {
    id: 'equus-caballus',
    binomio: 'Equus caballus',
    popular: 'cavalo',
    sinonimos: ['égua'],
    grupo: 'mamífero',
  },
  {
    id: 'bos-taurus',
    binomio: 'Bos taurus',
    popular: 'boi',
    sinonimos: ['vaca', 'gado'],
    grupo: 'mamífero',
  },
  {
    id: 'mus-musculus',
    binomio: 'Mus musculus',
    popular: 'camundongo',
    sinonimos: ['ratinho'],
    grupo: 'mamífero',
    aviso:
      'Camundongo, não rato: o rato de esgoto e de laboratório é Rattus norvegicus, outro gênero. É o exemplo de por que o nome popular não serve para ciência — em Portugal, "rato" é justamente este aqui.',
  },
  {
    id: 'pan-troglodytes',
    binomio: 'Pan troglodytes',
    popular: 'chimpanzé',
    sinonimos: [],
    grupo: 'mamífero',
  },
  {
    id: 'loxodonta-africana',
    binomio: 'Loxodonta africana',
    popular: 'elefante-africano',
    sinonimos: ['elefante'],
    grupo: 'mamífero',
  },

  // --- aves
  {
    id: 'struthio-camelus',
    binomio: 'Struthio camelus',
    popular: 'avestruz',
    sinonimos: [],
    grupo: 'ave',
    serVivo: 'avestruz',
  },
  {
    id: 'gallus-gallus-domesticus',
    binomio: 'Gallus gallus domesticus',
    popular: 'galinha',
    sinonimos: ['galo', 'frango', 'galinha doméstica'],
    grupo: 'ave',
    grafia: true,
  },
  {
    id: 'columba-livia',
    binomio: 'Columba livia',
    popular: 'pombo',
    sinonimos: ['pomba', 'pombo-comum'],
    grupo: 'ave',
  },

  // --- outros vertebrados
  {
    id: 'chelonia-mydas',
    binomio: 'Chelonia mydas',
    popular: 'tartaruga-verde',
    sinonimos: ['aruanã'],
    grupo: 'réptil',
  },
  {
    id: 'rhinella-marina',
    binomio: 'Rhinella marina',
    popular: 'sapo-cururu',
    sinonimos: ['cururu', 'sapo-boi'],
    grupo: 'anfíbio',
    aviso:
      'Foi Bufo marinus por dois séculos, e é assim que o livro antigo traz. A revisão de 2006 levou os sapos americanos para Rhinella: nome científico também muda, e muda por evidência, não por gosto.',
  },
  {
    id: 'carcharodon-carcharias',
    binomio: 'Carcharodon carcharias',
    popular: 'tubarão-branco',
    sinonimos: ['grande tubarão branco'],
    grupo: 'peixe',
  },

  // --- invertebrados
  {
    id: 'apis-mellifera',
    binomio: 'Apis mellifera',
    popular: 'abelha',
    sinonimos: ['abelha-europeia', 'abelha do mel'],
    grupo: 'inseto',
    grafia: true,
  },
  {
    id: 'drosophila-melanogaster',
    binomio: 'Drosophila melanogaster',
    popular: 'mosca-das-frutas',
    sinonimos: ['drosófila', 'mosca-da-banana', 'mosca de fruta'],
    grupo: 'inseto',
    grafia: true,
  },
  {
    id: 'aedes-aegypti',
    binomio: 'Aedes aegypti',
    popular: 'mosquito-da-dengue',
    sinonimos: ['pernilongo-da-dengue'],
    grupo: 'inseto',
    serVivo: 'mosquito-da-dengue',
  },
  {
    id: 'armadillidium-vulgare',
    binomio: 'Armadillidium vulgare',
    popular: 'tatuzinho-de-jardim',
    sinonimos: ['tatuzinho', 'bicho-de-conta'],
    grupo: 'crustáceo',
    serVivo: 'tatuzinho-de-jardim',
  },
  {
    id: 'ascaris-lumbricoides',
    binomio: 'Ascaris lumbricoides',
    popular: 'lombriga',
    sinonimos: [],
    grupo: 'nematoide',
    serVivo: 'lombriga',
  },
  {
    id: 'octopus-vulgaris',
    binomio: 'Octopus vulgaris',
    popular: 'polvo-comum',
    sinonimos: ['polvo'],
    grupo: 'molusco',
  },

  // --- fungos, plantas e bactérias
  {
    id: 'saccharomyces-cerevisiae',
    binomio: 'Saccharomyces cerevisiae',
    popular: 'levedura',
    sinonimos: ['levedo', 'fermento biológico', 'levedura de cerveja'],
    grupo: 'fungo',
    serVivo: 'levedura',
  },
  {
    id: 'zea-mays',
    binomio: 'Zea mays',
    popular: 'milho',
    sinonimos: [],
    grupo: 'planta',
  },
  {
    id: 'oryza-sativa',
    binomio: 'Oryza sativa',
    popular: 'arroz',
    sinonimos: [],
    grupo: 'planta',
  },
  {
    id: 'coffea-arabica',
    binomio: 'Coffea arabica',
    popular: 'café',
    sinonimos: ['cafeeiro', 'café-arábica'],
    grupo: 'planta',
  },
  {
    id: 'solanum-lycopersicum',
    binomio: 'Solanum lycopersicum',
    popular: 'tomate',
    sinonimos: ['tomateiro'],
    grupo: 'planta',
    grafia: true,
    aviso:
      'Já foi Lycopersicon esculentum, e o nome velho ainda aparece em rótulo. A genética pôs o tomate de volta em Solanum, o gênero da batata e da berinjela — o nome mudou porque o parentesco era outro.',
  },
  {
    id: 'theobroma-cacao',
    binomio: 'Theobroma cacao',
    popular: 'cacau',
    sinonimos: ['cacaueiro'],
    grupo: 'planta',
  },
  {
    id: 'mycobacterium-tuberculosis',
    binomio: 'Mycobacterium tuberculosis',
    popular: 'bacilo de Koch',
    sinonimos: ['bacilo da tuberculose'],
    grupo: 'bactéria',
  },
]

/**
 * A regra da nomenclatura binomial, escrita como expressão e não como prosa.
 *
 * Gênero com inicial maiúscula, epíteto específico inteiro em minúscula, e a
 * subespécie — quando há — também em minúscula. É o que o jogo cobra nas cartas
 * de grafia, e é o que o teste cobra do próprio dataset: um binômio digitado
 * errado aqui ensinaria o contrário do que a carta pergunta.
 */
export const GRAFIA_BINOMIAL = /^[A-Z][a-z]+(?: [a-z]+){1,2}$/

/** "Panthera onca" → "P. onca". A forma abreviada só encurta o gênero: o epíteto nunca. */
export function abreviar(binomio: string): string {
  const partes = binomio.split(' ')
  const genero = partes[0]
  if (!genero || partes.length < 2) throw new Error(`nome científico incompleto: "${binomio}"`)
  return [`${genero[0] as string}.`, ...partes.slice(1)].join(' ')
}

const capitalizar = (p: string): string => p.charAt(0).toUpperCase() + p.slice(1)

/**
 * As grafias erradas do mesmo nome — de onde saem os distratores da carta de
 * grafia.
 *
 * Mora no dataset, e não junto da carta, porque **é a regra**, não um detalhe de
 * montagem: cada variante aqui é um jeito específico de violar o Código, e cada
 * uma delas é um erro que se vê em trabalho escolar. Ficando aqui, ela tem
 * teste próprio.
 *
 * As três primeiras valem para qualquer nome; a quarta só existe no trinômio,
 * onde "capitalizar tudo" e "capitalizar só a subespécie" são erros diferentes.
 * No binômio as duas dão a mesma string, e o `Set` a descarta — é por isso que
 * a deduplicação não é enfeite.
 */
export function variantesDeCaixa(binomio: string): readonly string[] {
  const palavras = binomio.split(' ')
  const ultima = palavras.at(-1)
  if (palavras.length < 2 || !ultima) throw new Error(`nome científico incompleto: "${binomio}"`)

  const formas = [
    // O erro mais comum de todos: escrever como se fosse nome comum.
    binomio.toLowerCase(),
    // O segundo mais comum: tratar o nome como título e capitalizar tudo.
    palavras.map(capitalizar).join(' '),
    // O de quem acha que nome científico é sigla.
    binomio.toUpperCase(),
    // Só a última maiúscula: no trinômio é o erro de quem sabe a regra pela
    // metade e acha que subespécie é um nome próprio a mais.
    [...palavras.slice(0, -1), capitalizar(ultima)].join(' '),
  ]

  const erradas = [...new Set(formas)].filter((f) => f !== binomio)
  if (erradas.length < 3) {
    // Com menos de três não dá para montar a carta de quatro opções, e uma
    // carta com três opções seria outra pergunta, mais fácil, sem avisar.
    throw new Error(`"${binomio}" não gera três grafias erradas distintas`)
  }
  return erradas
}

/** Busca por id, e lança quando não acha — id errado não pode virar carta muda. */
export function especie(id: string): Especie {
  const achada = ESPECIES.find((e) => e.id === id)
  if (!achada) throw new Error(`nomes-cientificos: não existe espécie com id "${id}"`)
  return achada
}

/** As espécies que também rendem carta de grafia. */
export const comGrafia = (): readonly Especie[] => ESPECIES.filter((e) => e.grafia)
