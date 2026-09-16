/**
 * Os presidentes do Brasil, em ordem, da Proclamação da República até hoje.
 *
 * **O recorte: 1889, a lista inteira.** A versão anterior começava em 1930, e o
 * argumento era bom — a República Velha põe os nomes mais difíceis logo no
 * começo, e uma escada de morte súbita que começa no teto mata o jogador no
 * quarto item, antes de ele chegar a qualquer coisa que saiba. Perdeu para um
 * argumento melhor: quem abre um jogo chamado "Presidentes do Brasil" e digita
 * "Deodoro da Fonseca" está certo, e levar errado por causa de um recorte que
 * ninguém anunciou é o app contrariando o próprio nome. Um jogo pode ser duro;
 * não pode recusar a resposta certa.
 *
 * O custo do recorte maior não some — ele muda de lugar. Vai para três
 * parâmetros do jogo, e cada um está justificado em `games/presidentes.ts`: a
 * **meta** do Nerdômetro, que não pode mais ser a lista inteira; a **revisão
 * pós-morte**, que é o que o jogador leva para casa quando morre no item 3; e o
 * **agrupamento** da fita.
 *
 * **Quem entra: os titulares.** Eleitos, direta ou indiretamente, e os vices que
 * sucederam **em definitivo**. Ficam de fora as duas juntas governativas (a de
 * 1930 e a Militar de 1969) e quem exerceu a presidência em substituição
 * temporária: José Linhares, Carlos Luz, Nereu Ramos e Ranieri Mazzilli.
 *
 * Isso foi decidido de frente, e contra a alternativa de incluí-los:
 *
 * - **Junta não é um nome.** "Junta Governativa Provisória" são três militares
 *   e nenhuma resposta curta; aceitar "junta" seria aceitar um marcador de
 *   lugar como se fosse conhecimento, e exigir os três sobrenomes transformaria
 *   um item da lista num exercício de ortografia.
 * - **A junta de 1930 cairia no pior lugar possível da fita**: logo depois de
 *   Washington Luís, ou seja, no exato ponto em que o jogador acabou de pagar o
 *   preço mais alto da partida recitando os treze da República Velha. Morrer
 *   ali, na burocracia, depois daquilo, é perder para o regulamento.
 * - **Mazzilli apareceria duas vezes e não seguidas** (1961 e 1964, com Jango
 *   no meio). Lembrar disso não é saber história, é ter decorado a nota de
 *   rodapé.
 *
 * Não é a única lista defensável — há lista oficial que conta todos eles —, e é
 * justamente por isso que a regra está escrita no `comoJogar` do jogo, e não só
 * aqui. Cada ausência fica registrada em `noIntervalo`, e o teste cobra que
 * toda lacuna entre um mandato e o seguinte tenha esse registro: a lista é mais
 * curta por decisão declarada, nunca por esquecimento.
 *
 * **A unidade é o mandato, não a pessoa.** Vargas aparece duas vezes (1930 e
 * 1951) e Lula também (2003 e 2023), porque são duas passagens separadas pelo
 * cargo, e a segunda de Vargas é outro país. Já Deodoro, FHC, Lula 2003 e Dilma
 * contam uma vez cada por período contínuo, ainda que sejam dois mandatos
 * seguidos ou dois títulos diferentes: o que a sequência pede é quem veio
 * depois de quem, e nem a reeleição nem a eleição indireta que confirmou
 * Deodoro em 1891 mudam isso.
 *
 * **As datas são ISO, não anos.** Ano sozinho não ordena esta lista: Jânio
 * Quadros e João Goulart começam ambos em 1961, Delfim Moreira e Epitácio
 * Pessoa se revezam dentro de 1919, e Vargas sai em 1954 no mesmo ano em que
 * Café Filho entra. String 'AAAA-MM-DD' compara na ordem certa por acidente
 * feliz do formato, então o teste de ordem não precisa de `Date` nem de fuso —
 * que é justamente onde datas históricas costumam se estragar.
 */

/** Como chegou ao cargo. Não pontua nada: existe para o gabarito e para o teste. */
export type Via = 'eleicao-direta' | 'eleicao-indireta' | 'sucessao' | 'revolucao'

export interface Presidente {
  readonly id: string
  /** O que se digita e o que aparece na fita: o nome como se diz em aula. */
  readonly nome: string
  /** Nome de batismo, para o gabarito e para desempatar homônimo. */
  readonly completo: string
  /** Formas aceitas como resposta. A primeira é sempre `nome`. */
  readonly aceitas: readonly string[]
  /** 'AAAA-MM-DD'. Comparável como string — ver a nota do topo. */
  readonly inicio: string
  /** `null` = em exercício. */
  readonly fim: string | null
  readonly via: Via
  /**
   * Quem exerceu a presidência entre o fim deste mandato e o começo do
   * próximo, e por isso **não** está na lista.
   *
   * Presente exatamente quando há lacuna entre `fim` e o `inicio` seguinte — o
   * teste verifica a equivalência nos dois sentidos. É o que impede a lista de
   * ficar mais curta com o tempo sem ninguém perceber.
   *
   * Substituição temporária que não interrompe o mandato não conta como lacuna
   * e não aparece aqui: Manuel Vitorino governou quase cinco meses no lugar de
   * Prudente de Morais doente, em 1896, e mesmo assim o titular nunca deixou de
   * ser Prudente.
   */
  readonly noIntervalo?: string
}

export const PRESIDENTES: readonly Presidente[] = [
  // --- República Velha ------------------------------------------------------
  {
    id: 'deodoro',
    nome: 'Deodoro da Fonseca',
    completo: 'Manuel Deodoro da Fonseca',
    aceitas: ['Deodoro da Fonseca', 'Deodoro', 'Marechal Deodoro', 'Manuel Deodoro da Fonseca'],
    inicio: '1889-11-15',
    // Renunciou sob a ameaça da Revolta da Armada, catorze meses depois de ser
    // confirmado no cargo pelo Congresso. Chefe do Governo Provisório e
    // presidente eleito indiretamente são o mesmo homem sem sair da cadeira, e
    // por isso são uma linha só.
    fim: '1891-11-23',
    via: 'revolucao',
  },
  {
    id: 'floriano',
    nome: 'Floriano Peixoto',
    completo: 'Floriano Vieira Peixoto',
    aceitas: ['Floriano Peixoto', 'Floriano', 'Marechal Floriano', 'Floriano Vieira Peixoto'],
    inicio: '1891-11-23',
    fim: '1894-11-15',
    via: 'sucessao',
  },
  {
    id: 'prudente',
    nome: 'Prudente de Morais',
    completo: 'Prudente José de Morais Barros',
    aceitas: ['Prudente de Morais', 'Prudente de Moraes', 'Prudente'],
    inicio: '1894-11-15',
    fim: '1898-11-15',
    via: 'eleicao-direta',
  },
  {
    id: 'campos-sales',
    nome: 'Campos Sales',
    completo: 'Manuel Ferraz de Campos Sales',
    aceitas: ['Campos Sales', 'Campos Salles'],
    inicio: '1898-11-15',
    fim: '1902-11-15',
    via: 'eleicao-direta',
  },
  {
    id: 'rodrigues-alves',
    nome: 'Rodrigues Alves',
    completo: 'Francisco de Paula Rodrigues Alves',
    aceitas: ['Rodrigues Alves', 'Francisco de Paula Rodrigues Alves'],
    inicio: '1902-11-15',
    // Eleito de novo em 1918 e morto pela gripe espanhola antes da posse: a
    // segunda eleição não vira linha nenhuma aqui, porque ele não governou.
    fim: '1906-11-15',
    via: 'eleicao-direta',
  },
  {
    id: 'afonso-pena',
    nome: 'Afonso Pena',
    completo: 'Afonso Augusto Moreira Pena',
    aceitas: ['Afonso Pena', 'Affonso Penna', 'Afonso Augusto Moreira Pena'],
    inicio: '1906-11-15',
    // Morreu no cargo.
    fim: '1909-06-14',
    via: 'eleicao-direta',
  },
  {
    id: 'nilo-pecanha',
    nome: 'Nilo Peçanha',
    completo: 'Nilo Procópio Peçanha',
    aceitas: ['Nilo Peçanha', 'Nilo Procópio Peçanha'],
    inicio: '1909-06-14',
    fim: '1910-11-15',
    via: 'sucessao',
  },
  {
    id: 'hermes',
    nome: 'Hermes da Fonseca',
    completo: 'Hermes Rodrigues da Fonseca',
    aceitas: ['Hermes da Fonseca', 'Hermes', 'Marechal Hermes', 'Hermes Rodrigues da Fonseca'],
    inicio: '1910-11-15',
    fim: '1914-11-15',
    via: 'eleicao-direta',
  },
  {
    id: 'venceslau',
    nome: 'Venceslau Brás',
    completo: 'Venceslau Brás Pereira Gomes',
    aceitas: ['Venceslau Brás', 'Venceslau Braz', 'Wenceslau Brás'],
    inicio: '1914-11-15',
    fim: '1918-11-15',
    via: 'eleicao-direta',
  },
  {
    id: 'delfim-moreira',
    nome: 'Delfim Moreira',
    completo: 'Delfim Moreira da Costa Ribeiro',
    aceitas: ['Delfim Moreira', 'Delfim Moreira da Costa Ribeiro'],
    // Vice de Rodrigues Alves, que foi eleito e morreu sem tomar posse. Assumiu
    // no dia marcado para o titular e ficou até a eleição de Epitácio.
    inicio: '1918-11-15',
    fim: '1919-07-28',
    via: 'sucessao',
  },
  {
    id: 'epitacio',
    nome: 'Epitácio Pessoa',
    completo: 'Epitácio Lindolfo da Silva Pessoa',
    aceitas: ['Epitácio Pessoa', 'Epitácio'],
    inicio: '1919-07-28',
    fim: '1922-11-15',
    via: 'eleicao-direta',
  },
  {
    id: 'bernardes',
    nome: 'Artur Bernardes',
    completo: 'Artur da Silva Bernardes',
    aceitas: ['Artur Bernardes', 'Arthur Bernardes', 'Artur da Silva Bernardes'],
    inicio: '1922-11-15',
    fim: '1926-11-15',
    via: 'eleicao-direta',
  },
  {
    id: 'washington-luis',
    nome: 'Washington Luís',
    completo: 'Washington Luís Pereira de Sousa',
    aceitas: ['Washington Luís', 'Washington Luiz'],
    inicio: '1926-11-15',
    // Deposto pela Revolução de 1930 a três semanas do fim do mandato.
    fim: '1930-10-24',
    via: 'eleicao-direta',
    noIntervalo:
      'a Junta Governativa Provisória de 1930 — Tasso Fragoso, Mena Barreto e Isaías de Noronha',
  },

  // --- Era Vargas -----------------------------------------------------------
  {
    id: 'vargas-1',
    nome: 'Getúlio Vargas',
    completo: 'Getúlio Dornelles Vargas',
    aceitas: ['Getúlio Vargas', 'Vargas', 'Getúlio', 'Getúlio Dornelles Vargas'],
    inicio: '1930-11-03',
    fim: '1945-10-29',
    // Não foi eleito: recebeu o poder da junta que depôs Washington Luís.
    // Governo Provisório, Constitucional e Estado Novo são o mesmo homem sem
    // sair do cargo, e por isso são uma linha só.
    via: 'revolucao',
    noIntervalo: 'José Linhares, presidente do STF, nos três meses até a posse de Dutra',
  },

  // --- República de 1946 ----------------------------------------------------
  {
    id: 'dutra',
    nome: 'Dutra',
    completo: 'Eurico Gaspar Dutra',
    aceitas: ['Dutra', 'Eurico Gaspar Dutra', 'Eurico Dutra', 'General Dutra'],
    inicio: '1946-01-31',
    fim: '1951-01-31',
    via: 'eleicao-direta',
  },
  {
    id: 'vargas-2',
    nome: 'Getúlio Vargas',
    completo: 'Getúlio Dornelles Vargas',
    aceitas: ['Getúlio Vargas', 'Vargas', 'Getúlio', 'Getúlio Dornelles Vargas'],
    inicio: '1951-01-31',
    // Suicídio no Catete. O mandato termina no dia, não no fim do ano.
    fim: '1954-08-24',
    via: 'eleicao-direta',
  },
  {
    id: 'cafe-filho',
    nome: 'Café Filho',
    completo: 'João Fernandes Campos Café Filho',
    aceitas: ['Café Filho', 'João Café Filho'],
    inicio: '1954-08-24',
    // Licenciou-se por doença e nunca voltou: o Congresso declarou o
    // impedimento definitivo em 22 de novembro, já com Nereu Ramos no cargo.
    fim: '1955-11-08',
    via: 'sucessao',
    noIntervalo: 'Carlos Luz, por três dias, e Nereu Ramos, até a posse de Juscelino',
  },
  {
    id: 'jk',
    nome: 'Juscelino Kubitschek',
    completo: 'Juscelino Kubitschek de Oliveira',
    aceitas: ['Juscelino Kubitschek', 'Juscelino', 'JK', 'Kubitschek'],
    inicio: '1956-01-31',
    fim: '1961-01-31',
    via: 'eleicao-direta',
  },
  {
    id: 'janio',
    nome: 'Jânio Quadros',
    completo: 'Jânio da Silva Quadros',
    aceitas: ['Jânio Quadros', 'Jânio'],
    inicio: '1961-01-31',
    // Sete meses: renunciou por carta, apostando num apelo popular que não veio.
    fim: '1961-08-25',
    via: 'eleicao-direta',
    noIntervalo: 'Ranieri Mazzilli, até o acordo do parlamentarismo dar posse a Jango',
  },
  {
    id: 'jango',
    nome: 'João Goulart',
    completo: 'João Belchior Marques Goulart',
    aceitas: ['João Goulart', 'Jango', 'Goulart'],
    inicio: '1961-09-07',
    fim: '1964-04-01',
    via: 'sucessao',
    noIntervalo: 'Ranieri Mazzilli, entre a deposição de Jango e a eleição de Castelo Branco',
  },

  // --- ditadura militar -----------------------------------------------------
  {
    id: 'castelo-branco',
    nome: 'Castelo Branco',
    completo: 'Humberto de Alencar Castelo Branco',
    aceitas: ['Castelo Branco', 'Castello Branco', 'Humberto de Alencar Castelo Branco'],
    inicio: '1964-04-15',
    fim: '1967-03-15',
    // Os cinco generais foram eleitos pelo Congresso, sob regras que o próprio
    // regime escrevia. 'eleicao-indireta' é o nome técnico e não é um elogio.
    via: 'eleicao-indireta',
  },
  {
    id: 'costa-e-silva',
    nome: 'Costa e Silva',
    completo: 'Artur da Costa e Silva',
    aceitas: ['Costa e Silva', 'Artur da Costa e Silva', 'Arthur da Costa e Silva'],
    inicio: '1967-03-15',
    // Um derrame o tirou do cargo; a junta militar impediu a posse do vice
    // civil, Pedro Aleixo, que era o que a Constituição de 1967 mandava.
    fim: '1969-08-31',
    via: 'eleicao-indireta',
    noIntervalo:
      'a Junta Militar de 1969 — Aurélio de Lira Tavares, Rademaker e Márcio de Sousa e Melo',
  },
  {
    id: 'medici',
    nome: 'Médici',
    completo: 'Emílio Garrastazu Médici',
    aceitas: ['Médici', 'Emílio Médici', 'Emílio Garrastazu Médici'],
    inicio: '1969-10-30',
    fim: '1974-03-15',
    via: 'eleicao-indireta',
  },
  {
    id: 'geisel',
    nome: 'Geisel',
    completo: 'Ernesto Geisel',
    aceitas: ['Geisel', 'Ernesto Geisel'],
    inicio: '1974-03-15',
    fim: '1979-03-15',
    via: 'eleicao-indireta',
  },
  {
    id: 'figueiredo',
    nome: 'Figueiredo',
    completo: 'João Baptista de Oliveira Figueiredo',
    aceitas: ['Figueiredo', 'João Figueiredo', 'João Baptista Figueiredo'],
    inicio: '1979-03-15',
    fim: '1985-03-15',
    via: 'eleicao-indireta',
  },

  // --- Nova República -------------------------------------------------------
  {
    id: 'sarney',
    nome: 'Sarney',
    completo: 'José Sarney de Araújo Costa',
    aceitas: ['Sarney', 'José Sarney'],
    // Tomou posse no dia marcado para Tancredo Neves, que adoeceu na véspera e
    // morreu em 21 de abril sem nunca ter sido presidente. Por isso a data aqui
    // é a da posse de Sarney como interino: é quando ele de fato governa.
    inicio: '1985-03-15',
    fim: '1990-03-15',
    via: 'sucessao',
  },
  {
    id: 'collor',
    nome: 'Collor',
    completo: 'Fernando Affonso Collor de Mello',
    aceitas: ['Collor', 'Fernando Collor', 'Fernando Collor de Mello'],
    inicio: '1990-03-15',
    // Afastado em 2 de outubro pela abertura do processo; renunciou em 29 de
    // dezembro no meio do julgamento, e o Senado cassou seus direitos assim
    // mesmo. A data do fim é a da renúncia, que é quando Itamar vira titular.
    fim: '1992-12-29',
    via: 'eleicao-direta',
  },
  {
    id: 'itamar',
    nome: 'Itamar Franco',
    completo: 'Itamar Augusto Cautiero Franco',
    aceitas: ['Itamar Franco', 'Itamar'],
    inicio: '1992-12-29',
    fim: '1995-01-01',
    via: 'sucessao',
  },
  {
    id: 'fhc',
    nome: 'Fernando Henrique Cardoso',
    completo: 'Fernando Henrique Cardoso',
    aceitas: ['Fernando Henrique Cardoso', 'Fernando Henrique', 'FHC'],
    inicio: '1995-01-01',
    // Dois mandatos seguidos, um período contínuo, uma linha. Ver a nota do topo.
    fim: '2003-01-01',
    via: 'eleicao-direta',
  },
  {
    id: 'lula-1',
    nome: 'Lula',
    completo: 'Luiz Inácio Lula da Silva',
    aceitas: ['Lula', 'Luiz Inácio Lula da Silva', 'Luís Inácio Lula da Silva'],
    inicio: '2003-01-01',
    fim: '2011-01-01',
    via: 'eleicao-direta',
  },
  {
    id: 'dilma',
    nome: 'Dilma Rousseff',
    completo: 'Dilma Vana Rousseff',
    aceitas: ['Dilma Rousseff', 'Dilma'],
    inicio: '2011-01-01',
    // Afastada em 12 de maio pela abertura do processo, cassada em 31 de agosto.
    // A data é a da cassação: até lá Temer era interino, não titular.
    fim: '2016-08-31',
    via: 'eleicao-direta',
  },
  {
    id: 'temer',
    nome: 'Michel Temer',
    completo: 'Michel Miguel Elias Temer Lulia',
    aceitas: ['Michel Temer', 'Temer'],
    inicio: '2016-08-31',
    fim: '2019-01-01',
    via: 'sucessao',
  },
  {
    id: 'bolsonaro',
    nome: 'Jair Bolsonaro',
    completo: 'Jair Messias Bolsonaro',
    aceitas: ['Jair Bolsonaro', 'Bolsonaro'],
    inicio: '2019-01-01',
    fim: '2023-01-01',
    via: 'eleicao-direta',
  },
  {
    id: 'lula-2',
    nome: 'Lula',
    completo: 'Luiz Inácio Lula da Silva',
    aceitas: ['Lula', 'Luiz Inácio Lula da Silva', 'Luís Inácio Lula da Silva'],
    inicio: '2023-01-01',
    fim: null,
    via: 'eleicao-direta',
  },
]

/**
 * Onde termina a República Velha, contado a partir do começo da lista.
 *
 * É o número que o jogo usa para explicar a si mesmo — e é a conta da meta no
 * Nerdômetro, porque a dificuldade desta sequência está **toda** nestes treze
 * primeiros itens. Fica aqui, e não escrito à mão lá, para não ficar errado no
 * dia em que a lista mudar.
 */
export const FIM_DA_REPUBLICA_VELHA = PRESIDENTES.findIndex((p) => p.id === 'vargas-1')

/** '1990-03-15' → 1990. Só os quatro primeiros caracteres: ver a nota do topo. */
export const anoDe = (data: string): number => Number(data.slice(0, 4))

/** "1930–1945", e "2023–" para quem está no cargo. Travessão, não hífen. */
export const exibirMandato = (p: Presidente): string =>
  `${anoDe(p.inicio)}–${p.fim === null ? '' : anoDe(p.fim)}`
