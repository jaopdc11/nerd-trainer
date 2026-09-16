/**
 * Quadros célebres, mapeados ao pintor.
 *
 * ## Por que este baralho é textual, e não de imagens
 *
 * A pergunta natural de um jogo de pintura é a própria pintura na tela. As
 * bandeiras fazem isso: `kind: 'imagem'`, um SVG por carta em `public/`. E é
 * justamente o caso das bandeiras que explica por que aqui não dá.
 *
 * As 202 bandeiras vêm do pacote npm `flag-icons`, que é dependência declarada,
 * versionada e instalada junto com o resto — o build copia os arquivos para
 * `public/` e ninguém baixa nada em tempo de execução. **Para pintura não existe
 * pacote equivalente**, e as três alternativas que sobram foram todas
 * descartadas:
 *
 *   1. **Baixar de um museu ou da Wikimedia na hora de jogar.** O projeto não
 *      faz nenhuma requisição de rede em partida — nenhum jogo faz —, e passar a
 *      fazer trocaria um app que funciona offline por um que depende de um
 *      servidor de terceiros para a carta aparecer. Um 404 aqui não degrada:
 *      apaga a pergunta.
 *   2. **Versionar os JPEGs no repositório.** Trinta e oito reproduções em
 *      resolução decente passam de 20 MB, contra os 1,3 MB das 202 bandeiras
 *      inteiras. E quadro pequeno demais para caber no bundle é quadro que não
 *      dá para reconhecer, o que devolve o problema ao início.
 *   3. **Redesenhar cada obra em SVG.** Não é sério.
 *
 * Fica o nome da obra e a resposta é o pintor. É menos bonito e é honesto: um
 * bom baralho de reconhecimento visual é outro jogo, e precisa de uma decisão
 * sobre imagens que não é minha para tomar. **Quem for "consertar" isto depois
 * precisa resolver o item 1 ou o 2 antes, não o contrário.**
 *
 * ## O que é perguntado
 *
 * Só autoria, pela mesma régua de `pensadores.ts` e de `economia.ts`: "Guernica
 * → Picasso" é fato verificável, "o que Guernica significa" não cabe numa linha.
 * O ano entra no enunciado onde ajuda a situar sem entregar o pintor.
 *
 * ## Quem ficou de fora de propósito
 *
 * **Manet.** "Monet" e "Manet" ficam a um caractere um do outro, e a tolerância
 * a erro de digitação da engine escala com o tamanho — com os dois no mesmo
 * baralho, quem digitasse qualquer um dos dois cairia na trava de ambiguidade e
 * perderia o ponto sabendo a resposta. Entre ter Monet funcionando e ter os dois
 * quebrados, fica Monet. Há teste para isso.
 *
 * **Os títulos que outro pintor também usou.** "O Beijo" é de Klimt, de Munch e
 * de Rodin (escultura); "O Grito" é de Munch, mas no Brasil todo mundo pensa em
 * "O Grito do Ipiranga", que é de Pedro Américo e se chama outra coisa. As duas
 * cartas trazem desambiguação no enunciado e um `aviso`, que é o campo que o
 * projeto tem justamente para isto: dizer algo sobre a resposta sem deixar de
 * aceitá-la.
 *
 * ## Peso brasileiro
 *
 * Dezesseis das trinta e oito cartas são de pintores brasileiros, e isso é
 * decisão, não sobra. Tarsila, Portinari, Di Cavalcanti e Anita Malfatti caem em
 * vestibular tanto quanto Van Gogh, e um baralho de pintura que só olha para a
 * Europa ensina que arte é coisa que acontece longe.
 */
export interface Quadro {
  readonly id: string
  /** O título como aparece na carta, com o ano. */
  readonly obra: string
  /** Ano de conclusão, ou o primeiro da série. */
  readonly ano: number
  readonly pintor: string
  readonly aceitas: readonly string[]
  readonly brasileiro: boolean
  /**
   * Há reprodução em `public/pinturas/<id>.jpg`, e a carta mostra o quadro.
   *
   * Cinco não têm, e a carta delas continua sendo o título: `antropofagia`,
   * `cafe` e `homem-amarelo` não existem em reprodução nenhuma que este projeto
   * possa usar, e `retirantes` e `guerra-e-paz` só existem como foto de parede
   * de museu e de evento — carta com imagem errada é pior que carta sem imagem.
   * Ver `scripts/gen-pinturas.mjs`, que registra onde cada uma foi procurada.
   */
  readonly imagem?: boolean
  /** Recado exibido quando a carta sai, acertada ou não. Ver o topo. */
  readonly aviso?: string
}

export const QUADROS: readonly Quadro[] = [
  // --- modernismo brasileiro ------------------------------------------------
  {
    id: 'abaporu',
    obra: 'Abaporu',
    ano: 1928,
    pintor: 'Tarsila do Amaral',
    aceitas: ['Tarsila do Amaral', 'Tarsila'],
    brasileiro: true,
    imagem: true,
  },
  {
    id: 'operarios',
    obra: 'Operários',
    ano: 1933,
    pintor: 'Tarsila do Amaral',
    aceitas: ['Tarsila do Amaral', 'Tarsila'],
    brasileiro: true,
    imagem: true,
  },
  {
    id: 'a-negra',
    obra: 'A Negra',
    ano: 1923,
    pintor: 'Tarsila do Amaral',
    aceitas: ['Tarsila do Amaral', 'Tarsila'],
    brasileiro: true,
    imagem: true,
  },
  {
    id: 'antropofagia',
    obra: 'Antropofagia',
    ano: 1929,
    pintor: 'Tarsila do Amaral',
    aceitas: ['Tarsila do Amaral', 'Tarsila'],
    brasileiro: true,
  },
  {
    id: 'retirantes',
    obra: 'Os Retirantes',
    ano: 1944,
    pintor: 'Portinari',
    aceitas: ['Portinari', 'Candido Portinari', 'Cândido Portinari'],
    brasileiro: true,
  },
  {
    id: 'cafe',
    obra: 'Café',
    ano: 1935,
    pintor: 'Portinari',
    aceitas: ['Portinari', 'Candido Portinari', 'Cândido Portinari'],
    brasileiro: true,
  },
  {
    id: 'guerra-e-paz',
    obra: 'Guerra e Paz (os painéis da sede da ONU)',
    ano: 1956,
    pintor: 'Portinari',
    aceitas: ['Portinari', 'Candido Portinari', 'Cândido Portinari'],
    brasileiro: true,
  },
  {
    id: 'lavrador',
    obra: 'O Lavrador de Café',
    ano: 1934,
    pintor: 'Portinari',
    aceitas: ['Portinari', 'Candido Portinari', 'Cândido Portinari'],
    brasileiro: true,
    imagem: true,
  },
  {
    id: 'cinco-mocas',
    obra: 'Cinco Moças de Guaratinguetá',
    ano: 1930,
    pintor: 'Di Cavalcanti',
    aceitas: ['Di Cavalcanti', 'Emiliano Di Cavalcanti'],
    brasileiro: true,
    imagem: true,
  },
  {
    id: 'samba',
    obra: 'Samba',
    ano: 1925,
    pintor: 'Di Cavalcanti',
    aceitas: ['Di Cavalcanti', 'Emiliano Di Cavalcanti'],
    brasileiro: true,
    imagem: true,
  },
  {
    id: 'a-boba',
    obra: 'A Boba',
    ano: 1916,
    pintor: 'Anita Malfatti',
    aceitas: ['Anita Malfatti', 'Malfatti'],
    brasileiro: true,
    imagem: true,
  },
  {
    id: 'homem-amarelo',
    obra: 'O Homem Amarelo',
    ano: 1916,
    pintor: 'Anita Malfatti',
    aceitas: ['Anita Malfatti', 'Malfatti'],
    brasileiro: true,
  },

  // --- academismo e século XIX no Brasil -----------------------------------
  {
    id: 'independencia',
    obra: 'Independência ou Morte',
    ano: 1888,
    pintor: 'Pedro Américo',
    aceitas: ['Pedro Américo', 'Pedro Americo'],
    brasileiro: true,
    imagem: true,
    aviso: 'É o quadro que todo mundo chama de "O Grito do Ipiranga" — e que não é "O Grito", de Munch.',
  },
  {
    id: 'primeira-missa',
    obra: 'A Primeira Missa no Brasil',
    ano: 1860,
    pintor: 'Victor Meirelles',
    aceitas: ['Victor Meirelles', 'Vítor Meirelles', 'Meirelles'],
    brasileiro: true,
    imagem: true,
  },
  {
    id: 'moema',
    obra: 'Moema',
    ano: 1866,
    pintor: 'Victor Meirelles',
    aceitas: ['Victor Meirelles', 'Vítor Meirelles', 'Meirelles'],
    brasileiro: true,
    imagem: true,
  },
  {
    id: 'caipira',
    obra: 'Caipira Picando Fumo',
    ano: 1893,
    pintor: 'Almeida Júnior',
    aceitas: ['Almeida Júnior', 'Almeida Junior', 'José Ferraz de Almeida Júnior'],
    brasileiro: true,
    imagem: true,
  },

  // --- Renascimento e Barroco ----------------------------------------------
  {
    id: 'mona-lisa',
    obra: 'Mona Lisa (a Gioconda)',
    ano: 1503,
    pintor: 'Leonardo da Vinci',
    aceitas: ['Leonardo da Vinci', 'Da Vinci', 'Leonardo'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'ultima-ceia',
    obra: 'A Última Ceia',
    ano: 1498,
    pintor: 'Leonardo da Vinci',
    aceitas: ['Leonardo da Vinci', 'Da Vinci', 'Leonardo'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'criacao-adao',
    obra: 'A Criação de Adão, no teto da Capela Sistina',
    ano: 1512,
    pintor: 'Michelangelo',
    aceitas: ['Michelangelo', 'Miguel Ângelo'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'nascimento-venus',
    obra: 'O Nascimento de Vênus',
    ano: 1485,
    pintor: 'Botticelli',
    aceitas: ['Botticelli', 'Sandro Botticelli'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'escola-atenas',
    obra: 'A Escola de Atenas',
    ano: 1511,
    pintor: 'Rafael',
    aceitas: ['Rafael', 'Rafael Sanzio', 'Raphael'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'jardim-delicias',
    obra: 'O Jardim das Delícias Terrenas',
    ano: 1505,
    pintor: 'Bosch',
    aceitas: ['Bosch', 'Hieronymus Bosch', 'Jheronimus Bosch'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'ronda-noturna',
    obra: 'A Ronda Noturna',
    ano: 1642,
    pintor: 'Rembrandt',
    aceitas: ['Rembrandt'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'as-meninas',
    obra: 'As Meninas',
    ano: 1656,
    pintor: 'Velázquez',
    aceitas: ['Velázquez', 'Velazquez', 'Diego Velázquez'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'brinco-perola',
    obra: 'Moça com Brinco de Pérola',
    ano: 1665,
    pintor: 'Vermeer',
    aceitas: ['Vermeer', 'Johannes Vermeer', 'Jan Vermeer'],
    brasileiro: false,
    imagem: true,
  },

  // --- século XIX ------------------------------------------------------------
  {
    id: 'tres-maio',
    obra: 'Os Fuzilamentos de Três de Maio',
    ano: 1814,
    pintor: 'Goya',
    aceitas: ['Goya', 'Francisco de Goya'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'liberdade',
    obra: 'A Liberdade Guiando o Povo',
    ano: 1830,
    pintor: 'Delacroix',
    aceitas: ['Delacroix', 'Eugène Delacroix'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'onda',
    obra: 'A Grande Onda de Kanagawa',
    ano: 1831,
    pintor: 'Hokusai',
    aceitas: ['Hokusai', 'Katsushika Hokusai'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'impressao',
    obra: 'Impressão, Nascer do Sol',
    ano: 1872,
    pintor: 'Monet',
    aceitas: ['Monet', 'Claude Monet'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'girassois',
    obra: 'Os Girassóis',
    ano: 1888,
    pintor: 'Van Gogh',
    aceitas: ['Van Gogh', 'Vincent van Gogh'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'noite-estrelada',
    obra: 'A Noite Estrelada',
    ano: 1889,
    pintor: 'Van Gogh',
    aceitas: ['Van Gogh', 'Vincent van Gogh'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'grito',
    obra: 'O Grito',
    ano: 1893,
    pintor: 'Munch',
    aceitas: ['Munch', 'Edvard Munch'],
    brasileiro: false,
    imagem: true,
    aviso: 'Este é o de Munch. O do Ipiranga chama-se "Independência ou Morte" e é de Pedro Américo.',
  },
  {
    id: 'beijo-klimt',
    obra: 'O Beijo (o casal envolto em ouro)',
    ano: 1908,
    pintor: 'Klimt',
    aceitas: ['Klimt', 'Gustav Klimt'],
    brasileiro: false,
    imagem: true,
    aviso: 'Munch também pintou um "O Beijo", e o de Rodin é escultura — por isso o enunciado descreve o quadro.',
  },

  // --- século XX ------------------------------------------------------------
  {
    id: 'senhoritas',
    obra: 'As Senhoritas de Avignon',
    ano: 1907,
    pintor: 'Picasso',
    aceitas: ['Picasso', 'Pablo Picasso'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'persistencia',
    obra: 'A Persistência da Memória (os relógios derretidos)',
    ano: 1931,
    pintor: 'Dalí',
    aceitas: ['Dalí', 'Dali', 'Salvador Dalí'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'guernica',
    obra: 'Guernica',
    ano: 1937,
    pintor: 'Picasso',
    aceitas: ['Picasso', 'Pablo Picasso'],
    brasileiro: false,
    imagem: true,
  },
  {
    // "As Duas Fridas" seria a escolha óbvia, e é justamente por isso que não
    // entrou: o título traz o primeiro nome da pintora dentro dele, e a carta
    // se responde lendo a pergunta. "A Coluna Partida" é igualmente conhecida e
    // não entrega nada.
    id: 'coluna-partida',
    obra: 'A Coluna Partida',
    ano: 1944,
    pintor: 'Frida Kahlo',
    aceitas: ['Frida Kahlo', 'Frida', 'Kahlo'],
    brasileiro: false,
    imagem: true,
  },
  {
    id: 'filho-homem',
    obra: 'O Filho do Homem (o homem de chapéu-coco com uma maçã no rosto)',
    ano: 1964,
    pintor: 'Magritte',
    aceitas: ['Magritte', 'René Magritte'],
    brasileiro: false,
    imagem: true,
  },
]

/**
 * Pintores deliberadamente ausentes, e o motivo.
 *
 * Mora no dataset e não no teste porque é uma decisão do baralho: quem quiser
 * acrescentar Manet vai ter de apagar esta linha e responder ao que ela diz.
 */
export const AUSENTES_DE_PROPOSITO: Readonly<Record<string, string>> = {
  Manet:
    'fica a um caractere de "Monet", que está no baralho: com os dois, a trava de ambiguidade da engine recusaria as duas respostas certas.',
}
