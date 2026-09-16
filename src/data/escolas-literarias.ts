/**
 * Escolas literárias brasileiras, na ordem em que aconteceram.
 *
 * **A ordem desta lista é dado, não apresentação.** É dela que o jogo tira os
 * distratores: as escolas que se confundem são as que se tocam no tempo, e
 * oferecer Barroco para quem leu Drummond não testa nada. Reordenar o array muda
 * o que aparece na tela — por isso há teste em cima da ordem.
 *
 * **A periodização é a brasileira, e só ela.** Eça de Queirós é realista e
 * Fernando Pessoa é modernista em Portugal, mas com outras datas e outro recorte:
 * o modernismo português começa em 1915, com o Orpheu, e a primeira fase do nosso
 * começa em 1922. Misturar as duas linhas do tempo tornaria a resposta
 * discutível, e um jogo de treino não pode ter carta com duas respostas
 * defensáveis. Autor português fica de fora inteiro, sem exceção honrosa.
 *
 * **Os limites de período são os marcos de praxe, e marco é convenção.** 1601 é a
 * Prosopopeia, 1768 são as Obras Poéticas de Cláudio Manuel, 1836 são os
 * Suspiros Poéticos, 1881 são as Memórias Póstumas e O Mulato no mesmo ano, 1922
 * é a Semana. Ninguém acordou modernista em fevereiro de 1922; o que a data marca
 * é onde a história da literatura resolveu cortar. As bordas são inclusivas nos
 * dois lados de propósito: Libertinagem é de 1930 e é primeira fase, O Quinze é
 * de 1930 e é segunda.
 */
export type Escola =
  | 'Barroco'
  | 'Arcadismo'
  | 'Romantismo'
  | 'Realismo'
  | 'Naturalismo'
  | 'Parnasianismo'
  | 'Simbolismo'
  | 'Pré-modernismo'
  | 'Modernismo (1ª fase)'
  | 'Modernismo (2ª fase)'
  | 'Modernismo (3ª fase)'
  | 'Contemporâneo'

export interface EscolaInfo {
  readonly nome: Escola
  readonly inicio: number
  /** Ausente no Contemporâneo: ele não acabou. */
  readonly fim?: number
  /** O que distingue a escola em uma linha. Vai para o gabarito de quem errou. */
  readonly marca: string
}

/** Em ordem cronológica. A ordem é a fonte dos distratores — ver o cabeçalho. */
export const ESCOLAS: readonly EscolaInfo[] = [
  {
    nome: 'Barroco',
    inicio: 1601,
    fim: 1768,
    marca: 'conflito entre carne e espírito; cultismo (jogo de palavras) e conceptismo (jogo de ideias)',
  },
  {
    nome: 'Arcadismo',
    inicio: 1768,
    fim: 1836,
    marca: 'fugere urbem e pastor fingido: a simplicidade neoclássica contra o excesso barroco',
  },
  {
    nome: 'Romantismo',
    inicio: 1836,
    fim: 1881,
    marca: 'idealização, subjetivismo e nacionalismo indianista; o eu acima do mundo',
  },
  {
    nome: 'Realismo',
    inicio: 1881,
    fim: 1902,
    marca: 'análise psicológica e ironia; o narrador desconfia do personagem e do leitor',
  },
  {
    nome: 'Naturalismo',
    inicio: 1881,
    fim: 1902,
    marca: 'determinismo de meio, raça e momento; o personagem vira caso clínico e a massa vira animal',
  },
  {
    nome: 'Parnasianismo',
    inicio: 1882,
    fim: 1902,
    marca: 'arte pela arte: rigor formal, soneto, rima rica e emoção contida',
  },
  {
    nome: 'Simbolismo',
    inicio: 1893,
    fim: 1902,
    marca: 'musicalidade, sinestesia e mistério; o vago e o sugerido contra a nitidez parnasiana',
  },
  {
    nome: 'Pré-modernismo',
    inicio: 1902,
    fim: 1922,
    marca: 'o Brasil real e feio entra na literatura antes de a forma mudar',
  },
  {
    nome: 'Modernismo (1ª fase)',
    inicio: 1922,
    fim: 1930,
    marca: 'a fase heroica: manifesto, verso livre, humor e destruição da sintaxe acadêmica',
  },
  {
    nome: 'Modernismo (2ª fase)',
    inicio: 1930,
    fim: 1945,
    marca: 'o romance de 30 e a poesia madura: seca, engenho, cais e consciência social',
  },
  {
    nome: 'Modernismo (3ª fase)',
    inicio: 1945,
    fim: 1980,
    marca: 'Geração de 45: o rigor volta — linguagem construída, sintaxe inventada, prosa introspectiva',
  },
  {
    nome: 'Contemporâneo',
    inicio: 1980,
    marca: 'sem escola: projetos individuais, cidade, violência urbana e vozes que antes não publicavam',
  },
]

export interface AutorLiterario {
  readonly id: string
  /** A pergunta da carta. */
  readonly nome: string
  /** A resposta. */
  readonly escola: Escola
  /** A obra que fixa a filiação. Vai para o gabarito — e para a pergunta, se `precisaDaObra`. */
  readonly obra: string
  /** Ausente onde a data é fabricada: Gregório só foi impresso em 1882. */
  readonly ano?: number
  /**
   * Mostra a obra junto do nome na pergunta.
   *
   * Existe por Machado, e Machado é a razão de a coluna existir: ele é romântico
   * em 1876 e realista em 1881, e "Machado de Assis → ?" teria duas respostas
   * certas. Quando o autor atravessa escolas, quem responde é a obra, e a obra
   * precisa estar na tela. O teste do dataset exige a marca em **todos** os
   * autores repetidos — esquecer uma das pontas criaria uma carta impossível.
   */
  readonly precisaDaObra?: true
}

/**
 * Autor → escola. Ver o cabeçalho de `games/escolas-literarias.ts` para por que a
 * pergunta é o autor e não a obra nem a característica.
 *
 * **As contagens por escola são desiguais, e isso é a verdade e não descuido.** O
 * Realismo brasileiro em prosa é Machado de Assis e mais ninguém: Aluísio,
 * Adolfo Caminha, Júlio Ribeiro e Inglês de Sousa são naturalistas, e Raul
 * Pompeia fica de fora porque O Ateneu é classificado ora como realista, ora como
 * naturalista, ora como impressionista — carta com resposta discutível não entra.
 * Emparelhar as colunas inventando realistas seria falsificar a história literária
 * para deixar a planilha bonita. Quem paga essa desigualdade é o sorteio, não a
 * verdade: o baralho vai até o fim e todas as cartas saem.
 */
export const AUTORES: readonly AutorLiterario[] = [
  // --- Barroco --------------------------------------------------------------
  { id: 'bento-teixeira', nome: 'Bento Teixeira', escola: 'Barroco', obra: 'Prosopopeia', ano: 1601 },
  { id: 'vieira', nome: 'Padre Antônio Vieira', escola: 'Barroco', obra: 'Sermão da Sexagésima', ano: 1655 },
  // Sem ano: a obra de Gregório circulou em manuscrito e só foi impressa em 1882,
  // quase dois séculos depois de ele morrer. Datar cada poema seria inventar.
  { id: 'gregorio', nome: 'Gregório de Matos', escola: 'Barroco', obra: 'a poesia satírica do "Boca do Inferno"' },
  { id: 'botelho', nome: 'Manuel Botelho de Oliveira', escola: 'Barroco', obra: 'Música do Parnaso', ano: 1705 },

  // --- Arcadismo ------------------------------------------------------------
  { id: 'claudio-manuel', nome: 'Cláudio Manuel da Costa', escola: 'Arcadismo', obra: 'Obras Poéticas', ano: 1768 },
  { id: 'basilio-gama', nome: 'Basílio da Gama', escola: 'Arcadismo', obra: 'O Uraguai', ano: 1769 },
  { id: 'santa-rita-durao', nome: 'Santa Rita Durão', escola: 'Arcadismo', obra: 'Caramuru', ano: 1781 },
  { id: 'gonzaga', nome: 'Tomás Antônio Gonzaga', escola: 'Arcadismo', obra: 'Marília de Dirceu', ano: 1792 },

  // --- Romantismo -----------------------------------------------------------
  { id: 'magalhaes', nome: 'Gonçalves de Magalhães', escola: 'Romantismo', obra: 'Suspiros Poéticos e Saudades', ano: 1836 },
  { id: 'goncalves-dias', nome: 'Gonçalves Dias', escola: 'Romantismo', obra: 'Primeiros Cantos', ano: 1846 },
  { id: 'manuel-antonio', nome: 'Manuel Antônio de Almeida', escola: 'Romantismo', obra: 'Memórias de um Sargento de Milícias', ano: 1853 },
  { id: 'alvares-azevedo', nome: 'Álvares de Azevedo', escola: 'Romantismo', obra: 'Lira dos Vinte Anos', ano: 1853 },
  { id: 'alencar', nome: 'José de Alencar', escola: 'Romantismo', obra: 'Iracema', ano: 1865 },
  { id: 'castro-alves', nome: 'Castro Alves', escola: 'Romantismo', obra: 'O Navio Negreiro', ano: 1869 },
  { id: 'machado-romantico', nome: 'Machado de Assis', escola: 'Romantismo', obra: 'Helena', ano: 1876, precisaDaObra: true },

  // --- Realismo -------------------------------------------------------------
  { id: 'machado-realista', nome: 'Machado de Assis', escola: 'Realismo', obra: 'Memórias Póstumas de Brás Cubas', ano: 1881, precisaDaObra: true },

  // --- Naturalismo ----------------------------------------------------------
  { id: 'julio-ribeiro', nome: 'Júlio Ribeiro', escola: 'Naturalismo', obra: 'A Carne', ano: 1888 },
  { id: 'aluisio', nome: 'Aluísio Azevedo', escola: 'Naturalismo', obra: 'O Cortiço', ano: 1890 },
  { id: 'ingles-sousa', nome: 'Inglês de Sousa', escola: 'Naturalismo', obra: 'O Missionário', ano: 1891 },
  { id: 'adolfo-caminha', nome: 'Adolfo Caminha', escola: 'Naturalismo', obra: 'Bom-Crioulo', ano: 1895 },

  // --- Parnasianismo (a tríade) ---------------------------------------------
  { id: 'raimundo-correia', nome: 'Raimundo Correia', escola: 'Parnasianismo', obra: 'Sinfonias', ano: 1883 },
  { id: 'alberto-oliveira', nome: 'Alberto de Oliveira', escola: 'Parnasianismo', obra: 'Meridionais', ano: 1884 },
  { id: 'bilac', nome: 'Olavo Bilac', escola: 'Parnasianismo', obra: 'Via Láctea', ano: 1888 },

  // --- Simbolismo -----------------------------------------------------------
  { id: 'cruz-e-sousa', nome: 'Cruz e Sousa', escola: 'Simbolismo', obra: 'Broquéis', ano: 1893 },
  { id: 'alphonsus', nome: 'Alphonsus de Guimaraens', escola: 'Simbolismo', obra: 'Kiriale', ano: 1902 },

  // --- Pré-modernismo -------------------------------------------------------
  { id: 'euclides', nome: 'Euclides da Cunha', escola: 'Pré-modernismo', obra: 'Os Sertões', ano: 1902 },
  { id: 'graca-aranha', nome: 'Graça Aranha', escola: 'Pré-modernismo', obra: 'Canaã', ano: 1902 },
  { id: 'augusto-anjos', nome: 'Augusto dos Anjos', escola: 'Pré-modernismo', obra: 'Eu', ano: 1912 },
  { id: 'lima-barreto', nome: 'Lima Barreto', escola: 'Pré-modernismo', obra: 'Triste Fim de Policarpo Quaresma', ano: 1915 },
  { id: 'monteiro-lobato', nome: 'Monteiro Lobato', escola: 'Pré-modernismo', obra: 'Urupês', ano: 1918 },

  // --- Modernismo, 1ª fase --------------------------------------------------
  { id: 'mario', nome: 'Mário de Andrade', escola: 'Modernismo (1ª fase)', obra: 'Paulicéia Desvairada', ano: 1922 },
  { id: 'alcantara', nome: 'Alcântara Machado', escola: 'Modernismo (1ª fase)', obra: 'Brás, Bexiga e Barra Funda', ano: 1927 },
  { id: 'oswald', nome: 'Oswald de Andrade', escola: 'Modernismo (1ª fase)', obra: 'Manifesto Antropófago', ano: 1928 },
  { id: 'bandeira', nome: 'Manuel Bandeira', escola: 'Modernismo (1ª fase)', obra: 'Libertinagem', ano: 1930 },

  // --- Modernismo, 2ª fase --------------------------------------------------
  { id: 'rachel', nome: 'Rachel de Queiroz', escola: 'Modernismo (2ª fase)', obra: 'O Quinze', ano: 1930 },
  { id: 'drummond', nome: 'Carlos Drummond de Andrade', escola: 'Modernismo (2ª fase)', obra: 'Alguma Poesia', ano: 1930 },
  { id: 'jose-lins', nome: 'José Lins do Rego', escola: 'Modernismo (2ª fase)', obra: 'Menino de Engenho', ano: 1932 },
  { id: 'jorge-amado', nome: 'Jorge Amado', escola: 'Modernismo (2ª fase)', obra: 'Capitães da Areia', ano: 1937 },
  { id: 'graciliano', nome: 'Graciliano Ramos', escola: 'Modernismo (2ª fase)', obra: 'Vidas Secas', ano: 1938 },
  { id: 'erico', nome: 'Erico Verissimo', escola: 'Modernismo (2ª fase)', obra: 'Olhai os Lírios do Campo', ano: 1938 },

  // --- Modernismo, 3ª fase --------------------------------------------------
  { id: 'joao-cabral', nome: 'João Cabral de Melo Neto', escola: 'Modernismo (3ª fase)', obra: 'Morte e Vida Severina', ano: 1955 },
  { id: 'suassuna', nome: 'Ariano Suassuna', escola: 'Modernismo (3ª fase)', obra: 'Auto da Compadecida', ano: 1955 },
  { id: 'guimaraes-rosa', nome: 'Guimarães Rosa', escola: 'Modernismo (3ª fase)', obra: 'Grande Sertão: Veredas', ano: 1956 },
  { id: 'clarice', nome: 'Clarice Lispector', escola: 'Modernismo (3ª fase)', obra: 'Laços de Família', ano: 1960 },

  // --- Contemporâneo --------------------------------------------------------
  { id: 'caio-fernando', nome: 'Caio Fernando Abreu', escola: 'Contemporâneo', obra: 'Morangos Mofados', ano: 1982 },
  { id: 'rubem-fonseca', nome: 'Rubem Fonseca', escola: 'Contemporâneo', obra: 'A Grande Arte', ano: 1983 },
  { id: 'paulo-lins', nome: 'Paulo Lins', escola: 'Contemporâneo', obra: 'Cidade de Deus', ano: 1997 },
  { id: 'hatoum', nome: 'Milton Hatoum', escola: 'Contemporâneo', obra: 'Dois Irmãos', ano: 2000 },
  { id: 'conceicao', nome: 'Conceição Evaristo', escola: 'Contemporâneo', obra: 'Ponciá Vicêncio', ano: 2003 },
]

/** Posição na linha do tempo. É o que mede a vizinhança entre escolas. */
export const INDICE_DA_ESCOLA: ReadonlyMap<Escola, number> = new Map(
  ESCOLAS.map((e, i) => [e.nome, i]),
)

export const infoDaEscola = (nome: Escola): EscolaInfo => {
  const i = INDICE_DA_ESCOLA.get(nome)
  const info = i === undefined ? undefined : ESCOLAS[i]
  if (!info) throw new Error(`escola desconhecida: ${nome}`)
  return info
}

/** "1881–1902", "1980 em diante". */
export const exibirPeriodo = (e: EscolaInfo): string =>
  e.fim === undefined ? `${e.inicio} em diante` : `${e.inicio}–${e.fim}`
