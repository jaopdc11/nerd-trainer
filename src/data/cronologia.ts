/**
 * Eventos datados, para o jogo de cronologia.
 *
 * O jogo não pergunta o ano — pergunta **qual veio antes**. A diferença não é
 * cosmética: decorar que a Comuna de Paris foi em 1871 é memorizar um número
 * solto, enquanto saber que ela veio depois da Guerra Civil Americana e antes
 * da Conferência de Berlim é entender o século. E, de quebra, *n* eventos dão
 * n² pares, então o dataset vira exercício infinito em vez de baralho finito.
 *
 * `ano` negativo é a.C. A precisão exigida é só a **ordem**: 753 a.C. para a
 * fundação de Roma é a data lendária e ninguém sabe o dia, mas nenhuma pergunta
 * depende disso — depende de Roma vir antes de Maratona, o que é firme.
 *
 * A dificuldade sai da própria lista, sem dado extra: o nível é a distância
 * entre os dois eventos sorteados. Um século de intervalo é fácil; 1888 contra
 * 1889 é o que separa quem sabe de quem chutou.
 */
export interface Evento {
  readonly id: string
  readonly nome: string
  /** Negativo para a.C. */
  readonly ano: number
  readonly onde: 'brasil' | 'mundo'
}

export const EVENTOS: readonly Evento[] = [
  // --- antiguidade e medievo ------------------------------------------------
  { id: 'olimpiadas', nome: 'Primeiros Jogos Olímpicos', ano: -776, onde: 'mundo' },
  { id: 'roma-fundacao', nome: 'Fundação lendária de Roma', ano: -753, onde: 'mundo' },
  { id: 'roma-republica', nome: 'Proclamação da República Romana', ano: -509, onde: 'mundo' },
  { id: 'maratona', nome: 'Batalha de Maratona', ano: -490, onde: 'mundo' },
  { id: 'socrates', nome: 'Morte de Sócrates', ano: -399, onde: 'mundo' },
  { id: 'gaugamela', nome: 'Alexandre derrota Dario III em Gaugamela', ano: -331, onde: 'mundo' },
  { id: 'cesar', nome: 'Assassinato de Júlio César', ano: -44, onde: 'mundo' },
  { id: 'roma-queda', nome: 'Queda do Império Romano do Ocidente', ano: 476, onde: 'mundo' },
  { id: 'hegira', nome: 'Hégira, início do calendário islâmico', ano: 622, onde: 'mundo' },
  { id: 'carlos-magno', nome: 'Coroação de Carlos Magno', ano: 800, onde: 'mundo' },
  { id: 'cisma', nome: 'Cisma do Oriente', ano: 1054, onde: 'mundo' },
  { id: 'cruzada', nome: 'Primeira Cruzada', ano: 1096, onde: 'mundo' },
  { id: 'magna-carta', nome: 'Magna Carta', ano: 1215, onde: 'mundo' },
  { id: 'peste-negra', nome: 'Peste Negra chega à Europa', ano: 1347, onde: 'mundo' },

  // --- modernidade ----------------------------------------------------------
  { id: 'constantinopla', nome: 'Queda de Constantinopla', ano: 1453, onde: 'mundo' },
  { id: 'gutenberg', nome: 'Bíblia de Gutenberg', ano: 1455, onde: 'mundo' },
  { id: 'colombo', nome: 'Chegada de Colombo à América', ano: 1492, onde: 'mundo' },
  { id: 'cabral', nome: 'Chegada de Cabral ao Brasil', ano: 1500, onde: 'brasil' },
  { id: 'lutero', nome: 'As 95 teses de Lutero', ano: 1517, onde: 'mundo' },
  { id: 'martim-afonso', nome: 'Expedição de Martim Afonso de Sousa', ano: 1530, onde: 'brasil' },
  { id: 'copernico', nome: 'Copérnico publica o heliocentrismo', ano: 1543, onde: 'mundo' },
  { id: 'governo-geral', nome: 'Governo-geral e fundação de Salvador', ano: 1549, onde: 'brasil' },
  { id: 'armada', nome: 'Derrota da Invencível Armada', ano: 1588, onde: 'mundo' },
  { id: 'trinta-anos', nome: 'Início da Guerra dos Trinta Anos', ano: 1618, onde: 'mundo' },
  { id: 'holandeses', nome: 'Invasão holandesa em Pernambuco', ano: 1630, onde: 'brasil' },
  { id: 'vestfalia', nome: 'Paz de Vestfália', ano: 1648, onde: 'mundo' },
  { id: 'newton', nome: 'Newton publica os Principia', ano: 1687, onde: 'mundo' },
  { id: 'bill-of-rights', nome: 'Bill of Rights inglês', ano: 1689, onde: 'mundo' },
  { id: 'zumbi', nome: 'Morte de Zumbi dos Palmares', ano: 1695, onde: 'brasil' },
  { id: 'madri', nome: 'Tratado de Madri', ano: 1750, onde: 'brasil' },
  { id: 'eua', nome: 'Independência dos Estados Unidos', ano: 1776, onde: 'mundo' },
  { id: 'inconfidencia', nome: 'Inconfidência Mineira', ano: 1789, onde: 'brasil' },
  { id: 'revolucao-francesa', nome: 'Revolução Francesa', ano: 1789, onde: 'mundo' },
  { id: 'brumario', nome: 'Golpe do 18 de Brumário', ano: 1799, onde: 'mundo' },

  // --- século XIX -----------------------------------------------------------
  { id: 'familia-real', nome: 'Chegada da família real portuguesa ao Brasil', ano: 1808, onde: 'brasil' },
  { id: 'waterloo', nome: 'Batalha de Waterloo', ano: 1815, onde: 'mundo' },
  { id: 'independencia', nome: 'Independência do Brasil', ano: 1822, onde: 'brasil' },
  { id: 'constituicao-1824', nome: 'Primeira Constituição brasileira', ano: 1824, onde: 'brasil' },
  { id: 'abdicacao', nome: 'Abdicação de D. Pedro I', ano: 1831, onde: 'brasil' },
  { id: 'manifesto', nome: 'Manifesto Comunista', ano: 1848, onde: 'mundo' },
  { id: 'darwin', nome: 'A Origem das Espécies', ano: 1859, onde: 'mundo' },
  { id: 'guerra-civil', nome: 'Início da Guerra Civil Americana', ano: 1861, onde: 'mundo' },
  { id: 'paraguai', nome: 'Início da Guerra do Paraguai', ano: 1864, onde: 'brasil' },
  { id: 'comuna', nome: 'Comuna de Paris', ano: 1871, onde: 'mundo' },
  { id: 'berlim-conferencia', nome: 'Conferência de Berlim', ano: 1884, onde: 'mundo' },
  { id: 'lei-aurea', nome: 'Lei Áurea', ano: 1888, onde: 'brasil' },
  { id: 'republica', nome: 'Proclamação da República no Brasil', ano: 1889, onde: 'brasil' },
  { id: 'canudos', nome: 'Fim da Guerra de Canudos', ano: 1897, onde: 'brasil' },

  // --- século XX ------------------------------------------------------------
  { id: 'relatividade', nome: 'Einstein publica a relatividade restrita', ano: 1905, onde: 'mundo' },
  { id: 'primeira-guerra', nome: 'Início da Primeira Guerra Mundial', ano: 1914, onde: 'mundo' },
  { id: 'revolucao-russa', nome: 'Revolução Russa', ano: 1917, onde: 'mundo' },
  { id: 'versalhes', nome: 'Tratado de Versalhes', ano: 1919, onde: 'mundo' },
  { id: 'semana-22', nome: 'Semana de Arte Moderna', ano: 1922, onde: 'brasil' },
  { id: 'crise-29', nome: 'Crise da Bolsa de Nova York', ano: 1929, onde: 'mundo' },
  { id: 'revolucao-30', nome: 'Revolução de 1930', ano: 1930, onde: 'brasil' },
  { id: 'hitler', nome: 'Hitler chega ao poder', ano: 1933, onde: 'mundo' },
  { id: 'estado-novo', nome: 'Golpe do Estado Novo', ano: 1937, onde: 'brasil' },
  { id: 'segunda-guerra', nome: 'Início da Segunda Guerra Mundial', ano: 1939, onde: 'mundo' },
  { id: 'hiroshima', nome: 'Bombas de Hiroshima e Nagasaki', ano: 1945, onde: 'mundo' },
  { id: 'fim-estado-novo', nome: 'Queda de Vargas e fim do Estado Novo', ano: 1945, onde: 'brasil' },
  { id: 'declaracao-dh', nome: 'Declaração Universal dos Direitos Humanos', ano: 1948, onde: 'mundo' },
  { id: 'revolucao-chinesa', nome: 'Revolução Chinesa', ano: 1949, onde: 'mundo' },
  { id: 'sputnik', nome: 'Lançamento do Sputnik', ano: 1957, onde: 'mundo' },
  { id: 'revolucao-cubana', nome: 'Revolução Cubana', ano: 1959, onde: 'mundo' },
  { id: 'brasilia', nome: 'Inauguração de Brasília', ano: 1960, onde: 'brasil' },
  { id: 'muro-construcao', nome: 'Construção do Muro de Berlim', ano: 1961, onde: 'mundo' },
  { id: 'golpe-64', nome: 'Golpe militar no Brasil', ano: 1964, onde: 'brasil' },
  { id: 'ai5', nome: 'Decretação do AI-5', ano: 1968, onde: 'brasil' },
  { id: 'lua', nome: 'Chegada do homem à Lua', ano: 1969, onde: 'mundo' },
  { id: 'anistia', nome: 'Lei da Anistia', ano: 1979, onde: 'brasil' },
  { id: 'diretas', nome: 'Campanha das Diretas Já', ano: 1984, onde: 'brasil' },
  { id: 'nova-republica', nome: 'Fim da ditadura militar e Nova República', ano: 1985, onde: 'brasil' },
  { id: 'constituicao-88', nome: 'Constituição Cidadã', ano: 1988, onde: 'brasil' },
  { id: 'muro-queda', nome: 'Queda do Muro de Berlim', ano: 1989, onde: 'mundo' },
  { id: 'urss', nome: 'Fim da União Soviética', ano: 1991, onde: 'mundo' },
  { id: 'collor', nome: 'Impeachment de Collor', ano: 1992, onde: 'brasil' },
  { id: 'plano-real', nome: 'Plano Real', ano: 1994, onde: 'brasil' },
  { id: 'onze-setembro', nome: 'Atentados de 11 de setembro', ano: 2001, onde: 'mundo' },
]

/** "1789" ou "44 a.C." */
export const exibirAno = (ano: number): string =>
  ano < 0 ? `${-ano} a.C.` : String(ano)
