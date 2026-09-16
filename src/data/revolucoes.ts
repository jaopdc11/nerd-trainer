/**
 * Revoluções e tratados: o fato de cada um, para o jogador dizer o nome.
 *
 * **A pergunta, que é a decisão inteira deste dataset.**
 *
 * Havia três candidatas, e duas foram descartadas:
 *
 * - *Evento → ano.* Descartada, e não por ser difícil: por contrariar o que
 *   este app já decidiu em `cronologia`, que "decorar que a Comuna de Paris foi
 *   em 1871 é memorizar um número solto". Um baralho de trinta datas seria
 *   exatamente o que aquele jogo se recusou a ser, com a agravante de ter
 *   gabarito discutível — a Revolução Industrial não tem ano, a Haitiana durou
 *   treze e a Gloriosa fica entre dois.
 * - *Evento → o que mudou.* Descartada por não ter gabarito. "O que a Revolução
 *   Francesa mudou" não cabe numa linha, e qualquer linha que coubesse seria
 *   uma caricatura que o jogo passaria a cobrar como se fosse fato.
 *
 * Sobra a que tem resposta curta, verificável e não trivial: **o fato → o
 * nome**. "Encerrou a Guerra dos Trinta Anos e é tomado como a certidão de
 * nascimento do Estado soberano" → Vestfália. É a mesma forma dos baralhos de
 * filosofia e sociologia, que perguntam autoria e nunca interpretação, pelo
 * mesmo motivo: é o que de fato é factual nessas áreas.
 *
 * **Como isto se diferencia do "Qual veio antes?".** Aquele jogo é um gerador
 * combinatório que sorteia dois eventos e pergunta a ordem entre eles; nunca
 * diz o que um evento foi, e nunca premia quem sabe. Este é um baralho finito
 * que pergunta o conteúdo e nunca a data. Os dois compartilham móveis —
 * Vestfália, Versalhes, a Revolução Francesa e a Russa estão nos dois datasets
 * —, e isso é deliberado: é o mesmo acervo servindo a duas perguntas que não se
 * substituem. Quem sabe que Vestfália vem antes de Versalhes pode não fazer
 * ideia do que cada um encerrou; quem sabe o que cada um encerrou responde a
 * ordem de graça. O ano mora aqui só como **gabarito**, nunca como pergunta —
 * há um teste que cobra isso enunciado por enunciado.
 *
 * **Tratado e revolução no mesmo baralho** porque são a mesma moeda: quase todo
 * tratado da lista encerra uma guerra que uma revolução começou, e separá-los
 * em dois jogos de quinze cartas produziria dois baralhos curtos demais para
 * valer a abertura. A `dica` da carta diz qual dos dois é, o que tira a
 * ambiguidade sem entregar a resposta.
 */

/**
 * O que a carta é. Vale como dica exibida, e é por isso que 'acordo' cobre
 * tratado, pacto, congresso e conferência de uma vez: a distinção diplomática
 * entre eles não é o que o jogo cobra, e um jogador que soubesse a resposta
 * poderia perder o ponto por chamar o Congresso de Viena de tratado.
 */
export type Genero = 'revolucao' | 'acordo'

export interface Marco {
  readonly id: string
  /** A resposta canônica, como se cita em aula. */
  readonly nome: string
  /** Formas aceitas. A primeira é sempre `nome`. */
  readonly aceitas: readonly string[]
  readonly genero: Genero
  /**
   * O enunciado da carta: o que aquilo fez.
   *
   * Nunca contém o ano, e isso é regra testada — um enunciado que diz a data
   * transforma a carta num exercício de leitura e faz o baralho pisar no
   * território de `cronologia`.
   */
  readonly fato: string
  /** Ano de referência, para o gabarito. */
  readonly ano: number
  /** Quando o processo não cabe num ano: "1791–1804". Também só no gabarito. */
  readonly periodo?: string
}

export const MARCOS: readonly Marco[] = [
  // --- tratados, pactos e congressos ----------------------------------------
  {
    id: 'tordesilhas',
    nome: 'Tratado de Tordesilhas',
    aceitas: ['Tratado de Tordesilhas', 'Tordesilhas'],
    genero: 'acordo',
    fato: 'Riscou um meridiano 370 léguas a oeste de Cabo Verde e repartiu entre Portugal e Castela terras que nenhuma das duas tinha visto.',
    ano: 1494,
  },
  {
    id: 'vestfalia',
    nome: 'Paz de Vestfália',
    aceitas: ['Paz de Vestfália', 'Vestfália', 'Tratado de Vestfália', 'Paz de Westfália'],
    genero: 'acordo',
    fato: 'Encerrou a Guerra dos Trinta Anos e é tomada como a certidão de nascimento do Estado soberano e do direito internacional.',
    ano: 1648,
  },
  {
    id: 'methuen',
    nome: 'Tratado de Methuen',
    aceitas: ['Tratado de Methuen', 'Methuen', 'Tratado dos panos e vinhos'],
    genero: 'acordo',
    fato: 'Trocou panos ingleses por vinhos portugueses e amarrou Portugal à indústria da Inglaterra.',
    ano: 1703,
  },
  {
    id: 'utrecht',
    nome: 'Tratado de Utrecht',
    aceitas: ['Tratado de Utrecht', 'Utrecht', 'Paz de Utrecht'],
    genero: 'acordo',
    fato: 'Encerrou a Guerra de Sucessão Espanhola e proibiu que as coroas da França e da Espanha ficassem na mesma cabeça.',
    ano: 1713,
  },
  {
    id: 'madri',
    nome: 'Tratado de Madri',
    aceitas: ['Tratado de Madri', 'Tratado de Madrid'],
    genero: 'acordo',
    fato: 'Aposentou a linha de Tordesilhas, adotou o princípio do uti possidetis e deu ao Brasil quase o contorno que ele tem hoje.',
    ano: 1750,
  },
  {
    id: 'paris-1783',
    nome: 'Tratado de Paris',
    aceitas: ['Tratado de Paris', 'Paz de Paris'],
    genero: 'acordo',
    fato: 'A Grã-Bretanha reconhece a independência das Treze Colônias e encerra a guerra na América.',
    ano: 1783,
  },
  {
    id: 'viena',
    nome: 'Congresso de Viena',
    aceitas: ['Congresso de Viena', 'Viena', 'Tratado de Viena'],
    genero: 'acordo',
    fato: 'Reuniu os vencedores de Napoleão para restaurar dinastias e redesenhar as fronteiras da Europa em nome do equilíbrio.',
    ano: 1815,
    periodo: '1814–1815',
  },
  {
    id: 'nanquim',
    nome: 'Tratado de Nanquim',
    aceitas: ['Tratado de Nanquim', 'Nanquim', 'Tratado de Nanquin'],
    genero: 'acordo',
    fato: 'Encerrou a Primeira Guerra do Ópio, abriu cinco portos chineses ao comércio britânico e entregou Hong Kong a Londres.',
    ano: 1842,
  },
  {
    id: 'berlim',
    nome: 'Conferência de Berlim',
    aceitas: ['Conferência de Berlim', 'Partilha da África'],
    genero: 'acordo',
    fato: 'Sentou as potências europeias à mesa para repartir a África e exigiu ocupação efetiva de quem quisesse reivindicar território.',
    ano: 1885,
    periodo: '1884–1885',
  },
  {
    id: 'petropolis',
    nome: 'Tratado de Petrópolis',
    aceitas: ['Tratado de Petrópolis', 'Petrópolis'],
    genero: 'acordo',
    fato: 'Passou o Acre da Bolívia para o Brasil por dois milhões de libras e pela promessa da ferrovia Madeira-Mamoré.',
    ano: 1903,
  },
  {
    id: 'brest-litovski',
    nome: 'Tratado de Brest-Litovski',
    aceitas: ['Tratado de Brest-Litovski', 'Brest-Litovski', 'Brest-Litovsk'],
    genero: 'acordo',
    fato: 'Tirou a Rússia da Primeira Guerra Mundial ao preço de um terço da população do antigo império.',
    ano: 1918,
  },
  {
    id: 'versalhes',
    nome: 'Tratado de Versalhes',
    aceitas: ['Tratado de Versalhes', 'Versalhes'],
    genero: 'acordo',
    fato: 'Encerrou a Primeira Guerra Mundial atribuindo à Alemanha a culpa pelo conflito, mais reparações e desarmamento.',
    ano: 1919,
  },
  {
    id: 'ribbentrop-molotov',
    nome: 'Pacto Ribbentrop-Molotov',
    aceitas: [
      'Pacto Ribbentrop-Molotov',
      'Pacto Molotov-Ribbentrop',
      'Pacto germano-soviético',
      'Pacto nazi-soviético',
    ],
    genero: 'acordo',
    fato: 'Pacto de não agressão entre Hitler e Stálin, com um protocolo secreto que repartia a Polônia e o Báltico.',
    ano: 1939,
  },
  {
    id: 'bretton-woods',
    nome: 'Conferência de Bretton Woods',
    aceitas: ['Conferência de Bretton Woods', 'Bretton Woods', 'Acordo de Bretton Woods'],
    genero: 'acordo',
    fato: 'Amarrou o sistema monetário do pós-guerra ao dólar conversível em ouro e criou o FMI e o Banco Mundial.',
    ano: 1944,
  },
  {
    id: 'assuncao',
    nome: 'Tratado de Assunção',
    aceitas: ['Tratado de Assunção', 'Assunção'],
    genero: 'acordo',
    fato: 'Criou o Mercosul, entre Brasil, Argentina, Uruguai e Paraguai.',
    ano: 1991,
  },

  // --- revoluções -----------------------------------------------------------
  {
    id: 'puritana',
    nome: 'Revolução Puritana',
    aceitas: ['Revolução Puritana', 'Revolução Inglesa', 'Guerra Civil Inglesa'],
    genero: 'revolucao',
    fato: 'Guerra civil que levou Carlos I ao cadafalso e pôs Cromwell no poder como lorde protetor.',
    ano: 1642,
    periodo: '1642–1649',
  },
  {
    id: 'gloriosa',
    nome: 'Revolução Gloriosa',
    aceitas: ['Revolução Gloriosa', 'Gloriosa'],
    genero: 'revolucao',
    fato: 'Depôs Jaime II praticamente sem sangue e submeteu o rei inglês ao Parlamento pela Declaração de Direitos.',
    ano: 1688,
    periodo: '1688–1689',
  },
  {
    id: 'industrial',
    nome: 'Revolução Industrial',
    aceitas: ['Revolução Industrial'],
    genero: 'revolucao',
    fato: 'Começou na Inglaterra, com a máquina a vapor, o tear mecânico e a fábrica no lugar da oficina artesanal.',
    ano: 1760,
    periodo: 'a partir de 1760',
  },
  {
    id: 'americana',
    nome: 'Independência dos Estados Unidos',
    aceitas: [
      'Independência dos Estados Unidos',
      'Revolução Americana',
      'Independência dos EUA',
      'Independência americana',
    ],
    genero: 'revolucao',
    fato: 'As Treze Colônias rompem com Jorge III em nome de não pagar imposto sem representação no Parlamento.',
    ano: 1776,
  },
  {
    id: 'francesa',
    nome: 'Revolução Francesa',
    aceitas: ['Revolução Francesa'],
    genero: 'revolucao',
    fato: 'Tomada da Bastilha, Declaração dos Direitos do Homem e do Cidadão e o fim do Antigo Regime.',
    ano: 1789,
  },
  {
    id: 'haitiana',
    nome: 'Revolução Haitiana',
    aceitas: ['Revolução Haitiana', 'Independência do Haiti'],
    genero: 'revolucao',
    fato: 'Única revolta de escravizados a fundar um Estado: derrotou o exército de Napoleão e libertou a colônia mais rica do Caribe.',
    ano: 1791,
    periodo: '1791–1804',
  },
  {
    id: 'pernambucana',
    nome: 'Revolução Pernambucana',
    aceitas: ['Revolução Pernambucana', 'Revolução Pernambucana de 1817', 'Revolta Pernambucana'],
    genero: 'revolucao',
    fato: 'Proclamou uma república em Pernambuco contra a corte recém-instalada no Rio, e durou setenta e cinco dias.',
    ano: 1817,
  },
  {
    id: 'farroupilha',
    nome: 'Revolução Farroupilha',
    aceitas: ['Revolução Farroupilha', 'Guerra dos Farrapos', 'Farroupilha'],
    genero: 'revolucao',
    fato: 'Dez anos de guerra no sul do Império e uma república separatista proclamada em Piratini.',
    ano: 1835,
    periodo: '1835–1845',
  },
  {
    id: 'primavera-dos-povos',
    nome: 'Primavera dos Povos',
    aceitas: ['Primavera dos Povos', 'Revoluções de 1848'],
    genero: 'revolucao',
    fato: 'A onda de levantes liberais e nacionalistas que varreu a Europa em poucos meses e derrubou Luís Filipe na França.',
    ano: 1848,
  },
  {
    id: 'mexicana',
    nome: 'Revolução Mexicana',
    aceitas: ['Revolução Mexicana'],
    genero: 'revolucao',
    fato: 'Derrubou Porfírio Díaz depois de três décadas no poder e pôs Zapata e Pancho Villa em armas pela reforma agrária.',
    ano: 1910,
  },
  {
    id: 'russa',
    nome: 'Revolução Russa',
    aceitas: ['Revolução Russa', 'Revolução de Outubro', 'Revolução Bolchevique'],
    genero: 'revolucao',
    fato: 'Os bolcheviques de Lênin derrubam o governo provisório de Kerenski e fundam o primeiro Estado socialista.',
    ano: 1917,
  },
  {
    id: 'revolucao-1930',
    nome: 'Revolução de 1930',
    aceitas: ['Revolução de 1930', 'Revolução de 30'],
    genero: 'revolucao',
    fato: 'Derrubou a República Velha e a política do café com leite, e levou Vargas ao poder por quinze anos.',
    ano: 1930,
  },
  {
    id: 'constitucionalista',
    nome: 'Revolução Constitucionalista',
    // "Revolução de 1932" ficou de fora: compactada, fica a um caractere de
    // "Revolução de 1930", que é outra carta do mesmo baralho.
    aceitas: ['Revolução Constitucionalista', 'Revolução Constitucionalista de 1932'],
    genero: 'revolucao',
    fato: 'São Paulo pega em armas contra o governo provisório de Vargas exigindo uma nova constituição.',
    ano: 1932,
  },
  {
    id: 'chinesa',
    nome: 'Revolução Chinesa',
    aceitas: ['Revolução Chinesa'],
    genero: 'revolucao',
    fato: 'Mao Tsé-Tung vence a guerra civil, Chiang Kai-shek foge para Taiwan e nasce a República Popular.',
    ano: 1949,
  },
  {
    id: 'cubana',
    nome: 'Revolução Cubana',
    aceitas: ['Revolução Cubana'],
    genero: 'revolucao',
    fato: 'Fidel Castro e Che Guevara descem da Sierra Maestra e derrubam Fulgencio Batista.',
    ano: 1959,
  },
  {
    id: 'cravos',
    nome: 'Revolução dos Cravos',
    aceitas: ['Revolução dos Cravos', 'Cravos', '25 de Abril'],
    genero: 'revolucao',
    fato: 'Um golpe militar quase sem tiros derruba o Estado Novo português e abre a descolonização da África portuguesa.',
    ano: 1974,
  },
  {
    id: 'iraniana',
    nome: 'Revolução Iraniana',
    aceitas: ['Revolução Iraniana', 'Revolução Islâmica'],
    genero: 'revolucao',
    fato: 'Derrubou o xá Reza Pahlevi e instalou uma república islâmica sob o aiatolá Khomeini.',
    ano: 1979,
  },
]

/** "1648" ou "1791–1804": o período manda quando existe. */
export const exibirData = (m: Marco): string => m.periodo ?? String(m.ano)

/** A dica da carta. Ver `Genero` para por que 'acordo' é um guarda-chuva. */
export const ROTULO_GENERO: Record<Genero, string> = {
  revolucao: 'revolução',
  acordo: 'tratado, pacto ou congresso',
}
