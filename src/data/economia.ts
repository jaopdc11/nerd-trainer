/**
 * Conceitos e obras de economia, mapeados ao autor.
 *
 * Este baralho é irmão direto do de filosofia (`pensadores.ts`) e herda dele a
 * regra que o torna honesto: **só se pergunta autoria, nunca interpretação**.
 * "Mão invisível → Smith" é verificável em qualquer manual; "o que Smith
 * pensava sobre o mercado" não cabe numa linha e, comprimido numa, vira
 * caricatura — em economia mais ainda que em filosofia, porque aqui quase todo
 * conceito tem uma leitura de direita e uma de esquerda e o card daria a
 * impressão de que existe uma só.
 *
 * **O que foi tirado, e por quê.** A lista original deste jogo pedia
 * "mais-valia → Marx". Ela saiu: `SOCIOLOGIA`, no mesmo aplicativo, já tem a
 * carta `mais-valia` com a mesma resposta. Duas cartas idênticas em dois
 * baralhos não medem duas coisas — medem a mesma coisa duas vezes, e ainda
 * inflam a nota de quem decorou uma delas, porque o Nerdômetro soma jogo a jogo.
 * Marx continua aqui por outros dois conceitos que a sociologia não cobre
 * (exército industrial de reserva, queda tendencial da taxa de lucro) e por uma
 * obra distinta de `O Capital`. O teste `economia.test.ts` trava isso: nenhuma
 * pergunta deste baralho pode repetir uma pergunta de filosofia ou de
 * sociologia, e se alguém reintroduzir mais-valia aqui, o teste cai.
 *
 * **Autorias contestadas ficaram de fora, ou vieram desambiguadas no
 * enunciado.** Três exemplos do que o critério descartou:
 *   - "multiplicador dos gastos" → Keynes é o que se cobra em prova, mas quem
 *     formalizou foi Richard Kahn. Uma carta que dá ponto pela resposta popular
 *     e não pela certa ensina errado; ficou fora.
 *   - "taxa natural de desemprego" é de Friedman *e* de Phelps, no mesmo ano,
 *     independentemente. Ficou fora.
 *   - "divisão do trabalho" sozinho pertence tanto a Smith quanto a Durkheim
 *     (que está no baralho de sociologia). Aqui a carta diz "na fábrica de
 *     alfinetes", que é de Smith e de mais ninguém.
 *
 * A resposta é o sobrenome, que é como se cita em aula e em prova. Nomes
 * completos entram como sinônimos. A tolerância a erro de digitação fica ligada
 * — "Schumpeter" tem dez letras e ninguém deve perder o ponto por uma —, e quem
 * impede que ela dê a resposta do vizinho é o teste de distância entre autores,
 * feito **autor contra autor** e não forma contra forma (ver o teste).
 */
export interface ItemEconomia {
  readonly id: string
  /** O que aparece na carta. */
  readonly pergunta: string
  /** Sobrenome, como se cita. */
  readonly autor: string
  readonly aceitas: readonly string[]
  readonly tipo: 'conceito' | 'obra'
}

export const ECONOMIA: readonly ItemEconomia[] = [
  // --- clássicos ------------------------------------------------------------
  {
    id: 'mao-invisivel',
    pergunta: 'a mão invisível',
    autor: 'Smith',
    aceitas: ['Smith', 'Adam Smith'],
    tipo: 'conceito',
  },
  {
    // "Divisão do trabalho" sem qualificação seria de Smith e de Durkheim ao
    // mesmo tempo, e Durkheim está a um baralho de distância. A fábrica de
    // alfinetes é o exemplo que só Smith usou.
    id: 'alfinetes',
    pergunta: 'a divisão do trabalho na fábrica de alfinetes',
    autor: 'Smith',
    aceitas: ['Smith', 'Adam Smith'],
    tipo: 'conceito',
  },
  {
    id: 'riqueza-nacoes',
    pergunta: 'A Riqueza das Nações',
    autor: 'Smith',
    aceitas: ['Smith', 'Adam Smith'],
    tipo: 'obra',
  },
  {
    id: 'vantagem-comparativa',
    pergunta: 'vantagem comparativa',
    autor: 'Ricardo',
    aceitas: ['Ricardo', 'David Ricardo'],
    tipo: 'conceito',
  },
  {
    id: 'renda-terra',
    pergunta: 'a renda da terra e a fertilidade diferencial',
    autor: 'Ricardo',
    aceitas: ['Ricardo', 'David Ricardo'],
    tipo: 'conceito',
  },
  {
    id: 'principios-tributacao',
    pergunta: 'Princípios de Economia Política e Tributação',
    autor: 'Ricardo',
    aceitas: ['Ricardo', 'David Ricardo'],
    tipo: 'obra',
  },
  {
    id: 'populacao',
    pergunta: 'população em progressão geométrica, alimento em progressão aritmética',
    autor: 'Malthus',
    aceitas: ['Malthus', 'Thomas Malthus', 'Thomas Robert Malthus'],
    tipo: 'conceito',
  },
  {
    id: 'ensaio-populacao',
    pergunta: 'Ensaio sobre o Princípio da População',
    autor: 'Malthus',
    aceitas: ['Malthus', 'Thomas Malthus', 'Thomas Robert Malthus'],
    tipo: 'obra',
  },
  {
    id: 'lei-say',
    pergunta: '"a oferta cria a sua própria procura"',
    autor: 'Say',
    aceitas: ['Say', 'Jean-Baptiste Say'],
    tipo: 'conceito',
  },

  // --- Marx -----------------------------------------------------------------
  // Sem mais-valia: ela já é carta do baralho de sociologia. Ver o topo.
  {
    id: 'exercito-reserva',
    pergunta: 'exército industrial de reserva',
    autor: 'Marx',
    aceitas: ['Marx', 'Karl Marx'],
    tipo: 'conceito',
  },
  {
    id: 'taxa-lucro',
    pergunta: 'a queda tendencial da taxa de lucro',
    autor: 'Marx',
    aceitas: ['Marx', 'Karl Marx'],
    tipo: 'conceito',
  },
  {
    // E não `O Capital`, que é carta da sociologia.
    id: 'critica-economia',
    pergunta: 'Contribuição à Crítica da Economia Política',
    autor: 'Marx',
    aceitas: ['Marx', 'Karl Marx'],
    tipo: 'obra',
  },

  // --- marginalistas e neoclássicos ----------------------------------------
  {
    // "Utilidade marginal" não entra: Jevons, Menger e Walras chegaram nela
    // sozinhos e quase juntos, e uma carta com três donos não tem gabarito.
    // Equilíbrio geral, esse sim, é de Walras.
    id: 'equilibrio-geral',
    pergunta: 'o equilíbrio geral, com todos os mercados se ajustando de uma vez',
    autor: 'Walras',
    aceitas: ['Walras', 'Léon Walras'],
    tipo: 'conceito',
  },
  {
    // Enunciado pela definição e não pelo nome: "ótimo de Pareto → Pareto" é
    // uma carta que se responde sem saber nada, lendo a própria pergunta.
    id: 'otimo',
    pergunta: 'a situação em que ninguém melhora sem que alguém piore',
    autor: 'Pareto',
    aceitas: ['Pareto', 'Vilfredo Pareto'],
    tipo: 'conceito',
  },
  {
    id: 'tesoura',
    pergunta: 'oferta e procura como as duas lâminas de uma tesoura',
    autor: 'Marshall',
    aceitas: ['Marshall', 'Alfred Marshall'],
    tipo: 'conceito',
  },
  {
    id: 'principios-economia',
    pergunta: 'Princípios de Economia (1890)',
    autor: 'Marshall',
    aceitas: ['Marshall', 'Alfred Marshall'],
    tipo: 'obra',
  },

  // --- keynesianos ----------------------------------------------------------
  {
    id: 'demanda-efetiva',
    pergunta: 'demanda efetiva',
    autor: 'Keynes',
    aceitas: ['Keynes', 'John Maynard Keynes'],
    tipo: 'conceito',
  },
  {
    id: 'armadilha-liquidez',
    pergunta: 'armadilha da liquidez',
    autor: 'Keynes',
    aceitas: ['Keynes', 'John Maynard Keynes'],
    tipo: 'conceito',
  },
  {
    id: 'teoria-geral',
    pergunta: 'Teoria Geral do Emprego, do Juro e da Moeda',
    autor: 'Keynes',
    aceitas: ['Keynes', 'John Maynard Keynes'],
    tipo: 'obra',
  },

  // --- austríacos e a inovação ---------------------------------------------
  {
    id: 'destruicao-criadora',
    pergunta: 'destruição criadora',
    autor: 'Schumpeter',
    aceitas: ['Schumpeter', 'Joseph Schumpeter'],
    tipo: 'conceito',
  },
  {
    id: 'capitalismo-socialismo',
    pergunta: 'Capitalismo, Socialismo e Democracia',
    autor: 'Schumpeter',
    aceitas: ['Schumpeter', 'Joseph Schumpeter'],
    tipo: 'obra',
  },
  {
    id: 'ordem-espontanea',
    pergunta: 'ordem espontânea',
    autor: 'Hayek',
    aceitas: ['Hayek', 'Friedrich Hayek', 'Friedrich von Hayek'],
    tipo: 'conceito',
  },
  {
    id: 'caminho-servidao',
    pergunta: 'O Caminho da Servidão',
    autor: 'Hayek',
    aceitas: ['Hayek', 'Friedrich Hayek', 'Friedrich von Hayek'],
    tipo: 'obra',
  },
  {
    id: 'calculo-socialista',
    pergunta: 'o problema do cálculo econômico no socialismo',
    autor: 'Mises',
    aceitas: ['Mises', 'Ludwig von Mises', 'von Mises'],
    tipo: 'conceito',
  },

  // --- monetaristas ---------------------------------------------------------
  {
    id: 'monetarismo',
    pergunta: 'monetarismo: "a inflação é sempre e em toda parte um fenômeno monetário"',
    autor: 'Friedman',
    aceitas: ['Friedman', 'Milton Friedman'],
    tipo: 'conceito',
  },
  {
    id: 'renda-permanente',
    pergunta: 'hipótese da renda permanente',
    autor: 'Friedman',
    aceitas: ['Friedman', 'Milton Friedman'],
    tipo: 'conceito',
  },
  {
    id: 'capitalismo-liberdade',
    pergunta: 'Capitalismo e Liberdade',
    autor: 'Friedman',
    aceitas: ['Friedman', 'Milton Friedman'],
    tipo: 'obra',
  },

  // --- instituições, informação e comportamento ----------------------------
  {
    id: 'custos-transacao',
    pergunta: 'custos de transação: por que existem firmas em vez de só contratos',
    autor: 'Coase',
    aceitas: ['Coase', 'Ronald Coase'],
    tipo: 'conceito',
  },
  {
    id: 'racionalidade-limitada',
    pergunta: 'racionalidade limitada',
    autor: 'Simon',
    aceitas: ['Simon', 'Herbert Simon'],
    tipo: 'conceito',
  },
  {
    id: 'limoes',
    pergunta: 'o mercado de limões e a seleção adversa',
    autor: 'Akerlof',
    aceitas: ['Akerlof', 'George Akerlof'],
    tipo: 'conceito',
  },
  {
    id: 'bens-comuns',
    pergunta: 'o governo dos bens comuns, contra a tragédia como destino',
    autor: 'Ostrom',
    aceitas: ['Ostrom', 'Elinor Ostrom'],
    tipo: 'conceito',
  },
  {
    // Kahneman assina sozinho o Nobel porque Tversky já havia morrido, mas o
    // artigo é dos dois: a dupla entra nas formas aceitas.
    id: 'perspectiva',
    pergunta: 'teoria da perspectiva (prospect theory)',
    autor: 'Kahneman',
    aceitas: ['Kahneman', 'Daniel Kahneman', 'Kahneman e Tversky'],
    tipo: 'conceito',
  },

  // --- desenvolvimento, centro e periferia ---------------------------------
  {
    id: 'desenvolvimento-liberdade',
    pergunta: 'Desenvolvimento como Liberdade',
    autor: 'Sen',
    aceitas: ['Sen', 'Amartya Sen'],
    tipo: 'obra',
  },
  {
    id: 'capacidades',
    pergunta: 'a abordagem das capacidades',
    autor: 'Sen',
    aceitas: ['Sen', 'Amartya Sen'],
    tipo: 'conceito',
  },
  {
    id: 'termos-troca',
    pergunta: 'a deterioração dos termos de troca entre centro e periferia',
    autor: 'Prebisch',
    aceitas: ['Prebisch', 'Raúl Prebisch'],
    tipo: 'conceito',
  },
  {
    // Não confundir com `Formação do Brasil Contemporâneo`, de Caio Prado
    // Júnior, que é carta do baralho de sociologia. Os dois títulos são
    // parecidos e as duas cartas existem; por isso o ano vai no enunciado.
    id: 'formacao-economica',
    pergunta: 'Formação Econômica do Brasil (1959)',
    autor: 'Furtado',
    aceitas: ['Furtado', 'Celso Furtado'],
    tipo: 'obra',
  },
  {
    id: 'subdesenvolvimento',
    pergunta: 'o subdesenvolvimento como processo próprio, e não como etapa atrasada',
    autor: 'Furtado',
    aceitas: ['Furtado', 'Celso Furtado'],
    tipo: 'conceito',
  },
  {
    id: 'capital-xxi',
    pergunta: 'O Capital no Século XXI',
    autor: 'Piketty',
    aceitas: ['Piketty', 'Thomas Piketty'],
    tipo: 'obra',
  },
  {
    id: 'r-maior-g',
    pergunta: 'r > g: o retorno do capital acima do crescimento da economia',
    autor: 'Piketty',
    aceitas: ['Piketty', 'Thomas Piketty'],
    tipo: 'conceito',
  },
]
