/**
 * Obras literárias, mapeadas ao autor.
 *
 * **A fronteira com `pensadores.ts`, que é o que justifica este dataset existir
 * separado.** Lá já há "O Capital → Marx" e "Crítica da Razão Pura → Kant", e
 * seria fácil este arquivo virar uma segunda cópia do mesmo baralho com outra
 * capa. A divisão é de gênero, não de prestígio: **`pensadores` fica com o
 * tratado — o livro escrito para sustentar uma tese — e `obras` fica com a
 * literatura — romance, conto, poesia, teatro.** "O Ser e o Nada" é tratado e
 * está lá; "O Estrangeiro" é romance e está aqui. Por isso Marx, Weber e
 * Durkheim não aparecem nenhuma vez neste arquivo: eles não escreveram
 * literatura, e repeti-los aqui seria perguntar duas vezes o mesmo fato.
 *
 * Um autor só atravessa as duas listas: **Camus**, que é filósofo do absurdo em
 * `pensadores` ("o absurdo e o mito de Sísifo") e romancista aqui ("O
 * Estrangeiro"). A sobreposição é de pessoa, nunca de pergunta — nenhum título
 * desta lista aparece lá, e o teste confere isso contra os dois decks de verdade,
 * não de memória.
 *
 * **Os Sertões é a única exceção ao critério de gênero**, e entra de olhos
 * abertos: é reportagem e ensaio, não ficção, mas é ensinado como literatura em
 * todo programa de pré-modernismo brasileiro, e não está em `pensadores`. Deixá-lo
 * de fora por pureza taxonômica tiraria do baralho um dos livros que mais caem.
 *
 * A resposta é o nome pelo qual se cita o autor — que quase sempre é o sobrenome,
 * mas não sempre. Onde o sobrenome sozinho não identifica, a forma canônica é
 * mais longa e a curta **não** entra em `aceitas`: "Andrade" é Mário e é Oswald,
 * e aceitar a forma solta daria ponto por uma resposta que não distingue os dois.
 * A mesma decisão que fez "Sérgio Buarque de Holanda" ser canônico em sociologia.
 */
export interface Obra {
  readonly id: string
  /** O título como aparece na carta. É a pergunta. */
  readonly titulo: string
  /** A resposta, na forma em que se cita. */
  readonly autor: string
  /** Todas as grafias que valem ponto. Contém `autor`. */
  readonly aceitas: readonly string[]
  /**
   * Ano da primeira publicação. Negativo é a.C. — Homero e Sófocles não têm data
   * e o que se datou foi a composição, então o número aqui é o consenso
   * aproximado, e o gabarito o exibe como "séc. VIII a.C.", sem fingir precisão.
   */
  readonly ano: number
  /** Vira a dica da carta. Serve para separar "Fausto" (teatro) de um romance homônimo. */
  readonly genero: 'romance' | 'conto' | 'poesia' | 'teatro' | 'ensaio'
  /**
   * Brasileira ou não. Não entra na carta: existe para o teste garantir que o
   * baralho não vire só literatura brasileira nem só cânone europeu — as duas
   * metades são cobradas juntas em qualquer prova daqui.
   */
  readonly origem: 'brasileira' | 'universal'
}

export const OBRAS: readonly Obra[] = [
  // --- Brasil: colônia e século XIX -----------------------------------------
  { id: 'marilia-dirceu', titulo: 'Marília de Dirceu', autor: 'Tomás Antônio Gonzaga', aceitas: ['Tomás Antônio Gonzaga', 'Gonzaga'], ano: 1792, genero: 'poesia', origem: 'brasileira' },
  { id: 'sargento-milicias', titulo: 'Memórias de um Sargento de Milícias', autor: 'Manuel Antônio de Almeida', aceitas: ['Manuel Antônio de Almeida', 'Manuel Antonio de Almeida'], ano: 1853, genero: 'romance', origem: 'brasileira' },
  { id: 'o-guarani', titulo: 'O Guarani', autor: 'José de Alencar', aceitas: ['José de Alencar', 'Alencar'], ano: 1857, genero: 'romance', origem: 'brasileira' },
  { id: 'iracema', titulo: 'Iracema', autor: 'José de Alencar', aceitas: ['José de Alencar', 'Alencar'], ano: 1865, genero: 'romance', origem: 'brasileira' },
  { id: 'senhora', titulo: 'Senhora', autor: 'José de Alencar', aceitas: ['José de Alencar', 'Alencar'], ano: 1875, genero: 'romance', origem: 'brasileira' },
  { id: 'navio-negreiro', titulo: 'O Navio Negreiro', autor: 'Castro Alves', aceitas: ['Castro Alves'], ano: 1869, genero: 'poesia', origem: 'brasileira' },
  { id: 'bras-cubas', titulo: 'Memórias Póstumas de Brás Cubas', autor: 'Machado de Assis', aceitas: ['Machado de Assis', 'Machado'], ano: 1881, genero: 'romance', origem: 'brasileira' },
  { id: 'o-alienista', titulo: 'O Alienista', autor: 'Machado de Assis', aceitas: ['Machado de Assis', 'Machado'], ano: 1882, genero: 'conto', origem: 'brasileira' },
  { id: 'o-ateneu', titulo: 'O Ateneu', autor: 'Raul Pompeia', aceitas: ['Raul Pompeia', 'Pompeia'], ano: 1888, genero: 'romance', origem: 'brasileira' },
  { id: 'o-cortico', titulo: 'O Cortiço', autor: 'Aluísio Azevedo', aceitas: ['Aluísio Azevedo', 'Aluisio Azevedo'], ano: 1890, genero: 'romance', origem: 'brasileira' },
  { id: 'quincas-borba', titulo: 'Quincas Borba', autor: 'Machado de Assis', aceitas: ['Machado de Assis', 'Machado'], ano: 1891, genero: 'romance', origem: 'brasileira' },
  { id: 'dom-casmurro', titulo: 'Dom Casmurro', autor: 'Machado de Assis', aceitas: ['Machado de Assis', 'Machado'], ano: 1899, genero: 'romance', origem: 'brasileira' },

  // --- Brasil: pré-modernismo e modernismo ----------------------------------
  { id: 'os-sertoes', titulo: 'Os Sertões', autor: 'Euclides da Cunha', aceitas: ['Euclides da Cunha', 'Euclides'], ano: 1902, genero: 'ensaio', origem: 'brasileira' },
  { id: 'policarpo', titulo: 'Triste Fim de Policarpo Quaresma', autor: 'Lima Barreto', aceitas: ['Lima Barreto'], ano: 1915, genero: 'romance', origem: 'brasileira' },
  { id: 'pauliceia', titulo: 'Paulicéia Desvairada', autor: 'Mário de Andrade', aceitas: ['Mário de Andrade', 'Mario de Andrade'], ano: 1922, genero: 'poesia', origem: 'brasileira' },
  { id: 'joao-miramar', titulo: 'Memórias Sentimentais de João Miramar', autor: 'Oswald de Andrade', aceitas: ['Oswald de Andrade'], ano: 1924, genero: 'romance', origem: 'brasileira' },
  { id: 'macunaima', titulo: 'Macunaíma', autor: 'Mário de Andrade', aceitas: ['Mário de Andrade', 'Mario de Andrade'], ano: 1928, genero: 'romance', origem: 'brasileira' },
  { id: 'alguma-poesia', titulo: 'Alguma Poesia', autor: 'Carlos Drummond de Andrade', aceitas: ['Carlos Drummond de Andrade', 'Drummond'], ano: 1930, genero: 'poesia', origem: 'brasileira' },
  { id: 'libertinagem', titulo: 'Libertinagem', autor: 'Manuel Bandeira', aceitas: ['Manuel Bandeira', 'Bandeira'], ano: 1930, genero: 'poesia', origem: 'brasileira' },
  { id: 'sao-bernardo', titulo: 'São Bernardo', autor: 'Graciliano Ramos', aceitas: ['Graciliano Ramos', 'Graciliano'], ano: 1934, genero: 'romance', origem: 'brasileira' },
  { id: 'capitaes-areia', titulo: 'Capitães da Areia', autor: 'Jorge Amado', aceitas: ['Jorge Amado'], ano: 1937, genero: 'romance', origem: 'brasileira' },
  { id: 'vidas-secas', titulo: 'Vidas Secas', autor: 'Graciliano Ramos', aceitas: ['Graciliano Ramos', 'Graciliano'], ano: 1938, genero: 'romance', origem: 'brasileira' },

  // --- Brasil: do pós-guerra para cá ----------------------------------------
  { id: 'perto-coracao', titulo: 'Perto do Coração Selvagem', autor: 'Clarice Lispector', aceitas: ['Clarice Lispector', 'Clarice'], ano: 1943, genero: 'romance', origem: 'brasileira' },
  { id: 'sagarana', titulo: 'Sagarana', autor: 'Guimarães Rosa', aceitas: ['Guimarães Rosa', 'João Guimarães Rosa', 'Guimaraes Rosa'], ano: 1946, genero: 'conto', origem: 'brasileira' },
  { id: 'morte-vida-severina', titulo: 'Morte e Vida Severina', autor: 'João Cabral de Melo Neto', aceitas: ['João Cabral de Melo Neto', 'João Cabral'], ano: 1955, genero: 'poesia', origem: 'brasileira' },
  { id: 'grande-sertao', titulo: 'Grande Sertão: Veredas', autor: 'Guimarães Rosa', aceitas: ['Guimarães Rosa', 'João Guimarães Rosa', 'Guimaraes Rosa'], ano: 1956, genero: 'romance', origem: 'brasileira' },
  { id: 'hora-da-estrela', titulo: 'A Hora da Estrela', autor: 'Clarice Lispector', aceitas: ['Clarice Lispector', 'Clarice'], ano: 1977, genero: 'romance', origem: 'brasileira' },

  // --- universal: antiguidade e clássicos -----------------------------------
  { id: 'odisseia', titulo: 'Odisseia', autor: 'Homero', aceitas: ['Homero'], ano: -750, genero: 'poesia', origem: 'universal' },
  { id: 'edipo-rei', titulo: 'Édipo Rei', autor: 'Sófocles', aceitas: ['Sófocles', 'Sofocles'], ano: -429, genero: 'teatro', origem: 'universal' },
  { id: 'divina-comedia', titulo: 'A Divina Comédia', autor: 'Dante', aceitas: ['Dante', 'Dante Alighieri'], ano: 1321, genero: 'poesia', origem: 'universal' },
  { id: 'lusiadas', titulo: 'Os Lusíadas', autor: 'Camões', aceitas: ['Camões', 'Luís de Camões', 'Camoes'], ano: 1572, genero: 'poesia', origem: 'universal' },
  { id: 'romeu-julieta', titulo: 'Romeu e Julieta', autor: 'Shakespeare', aceitas: ['Shakespeare', 'William Shakespeare'], ano: 1597, genero: 'teatro', origem: 'universal' },
  { id: 'hamlet', titulo: 'Hamlet', autor: 'Shakespeare', aceitas: ['Shakespeare', 'William Shakespeare'], ano: 1601, genero: 'teatro', origem: 'universal' },
  { id: 'dom-quixote', titulo: 'Dom Quixote', autor: 'Cervantes', aceitas: ['Cervantes', 'Miguel de Cervantes'], ano: 1605, genero: 'romance', origem: 'universal' },
  { id: 'fausto', titulo: 'Fausto', autor: 'Goethe', aceitas: ['Goethe'], ano: 1808, genero: 'teatro', origem: 'universal' },

  // --- universal: o romance do século XIX -----------------------------------
  { id: 'orgulho-preconceito', titulo: 'Orgulho e Preconceito', autor: 'Jane Austen', aceitas: ['Jane Austen', 'Austen'], ano: 1813, genero: 'romance', origem: 'universal' },
  { id: 'madame-bovary', titulo: 'Madame Bovary', autor: 'Flaubert', aceitas: ['Flaubert', 'Gustave Flaubert'], ano: 1857, genero: 'romance', origem: 'universal' },
  { id: 'miseraveis', titulo: 'Os Miseráveis', autor: 'Victor Hugo', aceitas: ['Victor Hugo', 'Hugo'], ano: 1862, genero: 'romance', origem: 'universal' },
  { id: 'crime-castigo', titulo: 'Crime e Castigo', autor: 'Dostoiévski', aceitas: ['Dostoiévski', 'Dostoievski', 'Fiódor Dostoiévski'], ano: 1866, genero: 'romance', origem: 'universal' },
  { id: 'guerra-paz', titulo: 'Guerra e Paz', autor: 'Tolstói', aceitas: ['Tolstói', 'Tolstoi', 'Liev Tolstói'], ano: 1869, genero: 'romance', origem: 'universal' },
  { id: 'anna-karienina', titulo: 'Anna Kariênina', autor: 'Tolstói', aceitas: ['Tolstói', 'Tolstoi', 'Liev Tolstói'], ano: 1877, genero: 'romance', origem: 'universal' },
  { id: 'karamazov', titulo: 'Os Irmãos Karamázov', autor: 'Dostoiévski', aceitas: ['Dostoiévski', 'Dostoievski', 'Fiódor Dostoiévski'], ano: 1880, genero: 'romance', origem: 'universal' },

  // --- universal: século XX -------------------------------------------------
  { id: 'tempo-perdido', titulo: 'Em Busca do Tempo Perdido', autor: 'Proust', aceitas: ['Proust', 'Marcel Proust'], ano: 1913, genero: 'romance', origem: 'universal' },
  { id: 'metamorfose', titulo: 'A Metamorfose', autor: 'Kafka', aceitas: ['Kafka', 'Franz Kafka'], ano: 1915, genero: 'conto', origem: 'universal' },
  { id: 'ulisses', titulo: 'Ulisses', autor: 'Joyce', aceitas: ['Joyce', 'James Joyce'], ano: 1922, genero: 'romance', origem: 'universal' },
  { id: 'mrs-dalloway', titulo: 'Mrs. Dalloway', autor: 'Virginia Woolf', aceitas: ['Virginia Woolf', 'Woolf'], ano: 1925, genero: 'romance', origem: 'universal' },
  { id: 'o-processo', titulo: 'O Processo', autor: 'Kafka', aceitas: ['Kafka', 'Franz Kafka'], ano: 1925, genero: 'romance', origem: 'universal' },
  { id: 'mensagem', titulo: 'Mensagem', autor: 'Fernando Pessoa', aceitas: ['Fernando Pessoa', 'Pessoa'], ano: 1934, genero: 'poesia', origem: 'universal' },
  { id: 'o-estrangeiro', titulo: 'O Estrangeiro', autor: 'Camus', aceitas: ['Camus', 'Albert Camus'], ano: 1942, genero: 'romance', origem: 'universal' },
  { id: '1984', titulo: '1984', autor: 'George Orwell', aceitas: ['George Orwell', 'Orwell'], ano: 1949, genero: 'romance', origem: 'universal' },
  { id: 'velho-e-o-mar', titulo: 'O Velho e o Mar', autor: 'Hemingway', aceitas: ['Hemingway', 'Ernest Hemingway'], ano: 1952, genero: 'romance', origem: 'universal' },
  { id: 'cem-anos', titulo: 'Cem Anos de Solidão', autor: 'García Márquez', aceitas: ['García Márquez', 'Garcia Marquez', 'Gabriel García Márquez'], ano: 1967, genero: 'romance', origem: 'universal' },
  { id: 'memorial-convento', titulo: 'Memorial do Convento', autor: 'Saramago', aceitas: ['Saramago', 'José Saramago'], ano: 1982, genero: 'romance', origem: 'universal' },
]

const ROMANOS: Readonly<Record<number, string>> = {
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
}

/** Exibição do ano no gabarito. Século em algarismo romano no a.C. */
export function exibirAno(ano: number): string {
  if (ano > 0) return String(ano)
  // Nada tão antigo tem data confiável: o que se sabe de Homero é o século, e
  // escrever "750 a.C." fingiria uma precisão que a filologia não tem.
  const seculo = Math.ceil(-ano / 100)
  return `séc. ${ROMANOS[seculo] ?? seculo} a.C.`
}
