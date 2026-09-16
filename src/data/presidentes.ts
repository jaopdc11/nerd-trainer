/**
 * Os presidentes do Brasil, em ordem, de 1930 até hoje.
 *
 * **O recorte, que é a decisão inteira deste arquivo.**
 *
 * Da Proclamação da República até hoje passaram pelo cargo mais de quarenta
 * pessoas, e a lista completa é indefensável num jogo de sequência com morte
 * súbita por três motivos somados:
 *
 * 1. A República Velha põe os nomes mais difíceis **no começo**. Quem não sabe
 *    que depois de Campos Sales vem Rodrigues Alves morre no quarto item, e o
 *    jogo acaba antes de chegar em qualquer coisa que a pessoa saiba. Uma
 *    escada de morte súbita tem de subir; essa começaria no teto.
 * 2. Entram juntas governativas (a de 1930 e a Militar de 1969), que não são
 *    *um* nome e não têm resposta curta.
 * 3. Entram presidentes de dias: Carlos Luz governou três, Ranieri Mazzilli
 *    duas vezes por menos de duas semanas cada. Errar por não saber que houve
 *    um interino de três dias entre Café Filho e Nereu Ramos não mede
 *    conhecimento de história, mede conhecimento de nota de rodapé.
 *
 * O outro extremo — começar na Nova República (1985) — dá nove mandatos, o que
 * não é uma escada, é um degrau: quem acompanha jornal recita a lista inteira
 * sem ter estudado nada.
 *
 * O corte adotado é **1930**, e ele não é conveniência: é a fronteira que a
 * própria historiografia usa. Antes, o cargo girava entre oligarquias estaduais
 * numa alternância que só especialista recita; de Vargas em diante, cada
 * presidente é alguém de quem a escola, o noticiário e a mesa de jantar falam.
 * Dá 21 mandatos — longo o bastante para ser uma escada de verdade e curto o
 * bastante para caber na régua do projeto, a de que meta é o que dá para
 * decorar de verdade.
 *
 * **Quem entra.** Os titulares: eleitos (direta ou indiretamente) e os vices
 * que os sucederam **em definitivo**. Ficam de fora as juntas e quem exerceu a
 * presidência em substituição temporária — José Linhares, Carlos Luz, Nereu
 * Ramos e Mazzilli. A regra tem de estar no `comoJogar`, senão o jogador erra
 * por não saber a regra do jogo, não por não saber história. Cada ausência fica
 * registrada em `noIntervalo`, e o teste cobra que toda lacuna entre um mandato
 * e o seguinte tenha esse registro: a lista é curta por decisão declarada, não
 * por esquecimento.
 *
 * **A unidade é o mandato, não a pessoa.** Vargas aparece duas vezes (1930 e
 * 1951) e Lula também (2003 e 2023), porque são duas passagens separadas pelo
 * cargo, e a segunda de Vargas é outro país. Já FHC, Lula 2003 e Dilma contam
 * uma vez cada por período contínuo, ainda que sejam dois mandatos seguidos:
 * o que a sequência pede é quem veio depois de quem, e a reeleição não muda
 * isso.
 *
 * **As datas são ISO, não anos.** Ano sozinho não ordena esta lista: Jânio
 * Quadros e João Goulart começam ambos em 1961, e Vargas sai em 1954 no mesmo
 * ano em que Café Filho entra. String 'AAAA-MM-DD' compara na ordem certa por
 * acidente feliz do formato, então o teste de ordem não precisa de `Date` nem
 * de fuso — que é justamente onde datas históricas costumam se estragar.
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
   */
  readonly noIntervalo?: string
}

export const PRESIDENTES: readonly Presidente[] = [
  // --- Era Vargas -----------------------------------------------------------
  {
    id: 'vargas-1',
    nome: 'Getúlio Vargas',
    completo: 'Getúlio Dornelles Vargas',
    aceitas: ['Getúlio Vargas', 'Vargas', 'Getúlio', 'Getúlio Dornelles Vargas'],
    inicio: '1930-11-03',
    fim: '1945-10-29',
    // Não foi eleito: recebeu o poder da Junta Governativa que depôs Washington
    // Luís. Governo Provisório, Constitucional e Estado Novo são o mesmo homem
    // sem sair do cargo, e por isso são uma linha só.
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
    noIntervalo: 'a Junta Militar de 1969 — Aurélio de Lira Tavares, Rademaker e Márcio de Sousa e Melo',
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

/** '1990-03-15' → 1990. Só os quatro primeiros caracteres: ver a nota do topo. */
export const anoDe = (data: string): number => Number(data.slice(0, 4))

/** "1930–1945", e "2023–" para quem está no cargo. Travessão, não hífen. */
export const exibirMandato = (p: Presidente): string =>
  `${anoDe(p.inicio)}–${p.fim === null ? '' : anoDe(p.fim)}`
