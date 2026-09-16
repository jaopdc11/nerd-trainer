/**
 * Conceitos e obras, mapeados ao autor.
 *
 * **O que um card de memorização pode e não pode segurar.** Ele não segura "o
 * que Kant pensava" — isso vira redução idiota, e qualquer resposta curta seria
 * uma caricatura de uma obra inteira. O que ele segura com honestidade é o que
 * de fato é factual nessas áreas: quem escreveu o quê e quem cunhou qual termo.
 * Que, por sorte, é também o que se cobra em prova, e o que serve de índice
 * para ler o resto depois.
 *
 * Por isso todo item aqui é de autoria, nunca de interpretação. "Imperativo
 * categórico → Kant" é verificável; "o que é o imperativo categórico" não cabe
 * numa linha e não está aqui.
 *
 * A resposta é o sobrenome, que é como se cita em aula e em prova. Nomes
 * completos entram como sinônimos, e onde o sobrenome sozinho seria ambíguo a
 * forma canônica é mais longa — em sociologia brasileira ninguém diz "Holanda",
 * diz "Sérgio Buarque de Holanda".
 */
export interface Item {
  readonly id: string
  /** O que aparece na carta. */
  readonly pergunta: string
  /** Sobrenome, como se cita. */
  readonly autor: string
  readonly aceitas: readonly string[]
  readonly tipo: 'conceito' | 'obra'
}

export const FILOSOFIA: readonly Item[] = [
  // --- antiguidade ----------------------------------------------------------
  { id: 'maieutica', pergunta: 'maiêutica', autor: 'Sócrates', aceitas: ['Sócrates'], tipo: 'conceito' },
  { id: 'nada-sei', pergunta: '"só sei que nada sei"', autor: 'Sócrates', aceitas: ['Sócrates'], tipo: 'conceito' },
  { id: 'caverna', pergunta: 'mito da caverna', autor: 'Platão', aceitas: ['Platão'], tipo: 'conceito' },
  { id: 'formas', pergunta: 'teoria das ideias (ou das formas)', autor: 'Platão', aceitas: ['Platão'], tipo: 'conceito' },
  { id: 'republica', pergunta: 'A República', autor: 'Platão', aceitas: ['Platão'], tipo: 'obra' },
  { id: 'motor-imovel', pergunta: 'motor imóvel', autor: 'Aristóteles', aceitas: ['Aristóteles'], tipo: 'conceito' },
  { id: 'eudaimonia', pergunta: 'eudaimonia', autor: 'Aristóteles', aceitas: ['Aristóteles'], tipo: 'conceito' },
  { id: 'nicomaco', pergunta: 'Ética a Nicômaco', autor: 'Aristóteles', aceitas: ['Aristóteles'], tipo: 'obra' },
  { id: 'ataraxia', pergunta: 'ataraxia pelo prazer moderado', autor: 'Epicuro', aceitas: ['Epicuro'], tipo: 'conceito' },

  // --- moderna --------------------------------------------------------------
  { id: 'principe', pergunta: 'O Príncipe', autor: 'Maquiavel', aceitas: ['Maquiavel', 'Nicolau Maquiavel'], tipo: 'obra' },
  { id: 'idolos', pergunta: 'ídolos da mente', autor: 'Bacon', aceitas: ['Bacon', 'Francis Bacon'], tipo: 'conceito' },
  { id: 'navalha', pergunta: 'navalha de Occam', autor: 'Occam', aceitas: ['Occam', 'Ockham', 'Guilherme de Occam'], tipo: 'conceito' },
  { id: 'cogito', pergunta: 'cogito, ergo sum', autor: 'Descartes', aceitas: ['Descartes', 'René Descartes'], tipo: 'conceito' },
  { id: 'duvida', pergunta: 'dúvida metódica', autor: 'Descartes', aceitas: ['Descartes', 'René Descartes'], tipo: 'conceito' },
  { id: 'metodo', pergunta: 'Discurso do Método', autor: 'Descartes', aceitas: ['Descartes', 'René Descartes'], tipo: 'obra' },
  { id: 'guerra-todos', pergunta: '"guerra de todos contra todos"', autor: 'Hobbes', aceitas: ['Hobbes', 'Thomas Hobbes'], tipo: 'conceito' },
  { id: 'leviata', pergunta: 'Leviatã', autor: 'Hobbes', aceitas: ['Hobbes', 'Thomas Hobbes'], tipo: 'obra' },
  { id: 'tabula-rasa', pergunta: 'tábula rasa', autor: 'Locke', aceitas: ['Locke', 'John Locke'], tipo: 'conceito' },
  { id: 'aposta', pergunta: 'a aposta sobre a existência de Deus', autor: 'Pascal', aceitas: ['Pascal', 'Blaise Pascal'], tipo: 'conceito' },
  { id: 'monada', pergunta: 'mônada', autor: 'Leibniz', aceitas: ['Leibniz'], tipo: 'conceito' },
  { id: 'melhor-mundos', pergunta: '"o melhor dos mundos possíveis"', autor: 'Leibniz', aceitas: ['Leibniz'], tipo: 'conceito' },
  { id: 'deus-natureza', pergunta: 'Deus sive Natura, a substância única', autor: 'Espinosa', aceitas: ['Espinosa', 'Spinoza', 'Baruch de Espinosa'], tipo: 'conceito' },
  { id: 'inducao', pergunta: 'o problema da indução', autor: 'Hume', aceitas: ['Hume', 'David Hume'], tipo: 'conceito' },
  { id: 'guilhotina', pergunta: 'a lei de Hume: do ser não se deduz o dever-ser', autor: 'Hume', aceitas: ['Hume', 'David Hume'], tipo: 'conceito' },
  { id: 'vontade-geral', pergunta: 'vontade geral', autor: 'Rousseau', aceitas: ['Rousseau', 'Jean-Jacques Rousseau'], tipo: 'conceito' },
  { id: 'imperativo', pergunta: 'imperativo categórico', autor: 'Kant', aceitas: ['Kant', 'Immanuel Kant'], tipo: 'conceito' },
  { id: 'numeno', pergunta: 'coisa em si (númeno)', autor: 'Kant', aceitas: ['Kant', 'Immanuel Kant'], tipo: 'conceito' },
  { id: 'critica-razao', pergunta: 'Crítica da Razão Pura', autor: 'Kant', aceitas: ['Kant', 'Immanuel Kant'], tipo: 'obra' },
  { id: 'senhor-escravo', pergunta: 'dialética do senhor e do escravo', autor: 'Hegel', aceitas: ['Hegel'], tipo: 'conceito' },
  { id: 'fenomenologia-espirito', pergunta: 'Fenomenologia do Espírito', autor: 'Hegel', aceitas: ['Hegel'], tipo: 'obra' },
  { id: 'materialismo', pergunta: 'materialismo histórico', autor: 'Marx', aceitas: ['Marx', 'Karl Marx'], tipo: 'conceito' },

  // --- contemporânea --------------------------------------------------------
  { id: 'eterno-retorno', pergunta: 'eterno retorno', autor: 'Nietzsche', aceitas: ['Nietzsche'], tipo: 'conceito' },
  { id: 'vontade-potencia', pergunta: 'vontade de potência', autor: 'Nietzsche', aceitas: ['Nietzsche'], tipo: 'conceito' },
  { id: 'morte-deus', pergunta: '"Deus está morto"', autor: 'Nietzsche', aceitas: ['Nietzsche'], tipo: 'conceito' },
  { id: 'zaratustra', pergunta: 'Assim Falou Zaratustra', autor: 'Nietzsche', aceitas: ['Nietzsche'], tipo: 'obra' },
  { id: 'falseabilidade', pergunta: 'falseabilidade', autor: 'Popper', aceitas: ['Popper', 'Karl Popper'], tipo: 'conceito' },
  { id: 'paradigma', pergunta: 'paradigma e revolução científica', autor: 'Kuhn', aceitas: ['Kuhn', 'Thomas Kuhn'], tipo: 'conceito' },
  { id: 'jogos-linguagem', pergunta: 'jogos de linguagem', autor: 'Wittgenstein', aceitas: ['Wittgenstein'], tipo: 'conceito' },
  { id: 'calar', pergunta: '"sobre aquilo de que não se pode falar, deve-se calar"', autor: 'Wittgenstein', aceitas: ['Wittgenstein'], tipo: 'conceito' },
  { id: 'dasein', pergunta: 'Dasein, o ser-aí', autor: 'Heidegger', aceitas: ['Heidegger'], tipo: 'conceito' },
  { id: 'ser-tempo', pergunta: 'Ser e Tempo', autor: 'Heidegger', aceitas: ['Heidegger'], tipo: 'obra' },
  { id: 'existencia-essencia', pergunta: '"a existência precede a essência"', autor: 'Sartre', aceitas: ['Sartre', 'Jean-Paul Sartre'], tipo: 'conceito' },
  { id: 'ma-fe', pergunta: 'má-fé', autor: 'Sartre', aceitas: ['Sartre', 'Jean-Paul Sartre'], tipo: 'conceito' },
  { id: 'ser-nada', pergunta: 'O Ser e o Nada', autor: 'Sartre', aceitas: ['Sartre', 'Jean-Paul Sartre'], tipo: 'obra' },
  { id: 'absurdo', pergunta: 'o absurdo e o mito de Sísifo', autor: 'Camus', aceitas: ['Camus', 'Albert Camus'], tipo: 'conceito' },
  { id: 'torna-se-mulher', pergunta: '"não se nasce mulher, torna-se"', autor: 'Beauvoir', aceitas: ['Beauvoir', 'Simone de Beauvoir'], tipo: 'conceito' },
  { id: 'segundo-sexo', pergunta: 'O Segundo Sexo', autor: 'Beauvoir', aceitas: ['Beauvoir', 'Simone de Beauvoir'], tipo: 'obra' },
  { id: 'banalidade', pergunta: 'banalidade do mal', autor: 'Arendt', aceitas: ['Arendt', 'Hannah Arendt'], tipo: 'conceito' },
  { id: 'vita-activa', pergunta: 'labor, trabalho e ação', autor: 'Arendt', aceitas: ['Arendt', 'Hannah Arendt'], tipo: 'conceito' },
  { id: 'biopoder', pergunta: 'biopoder', autor: 'Foucault', aceitas: ['Foucault', 'Michel Foucault'], tipo: 'conceito' },
  { id: 'vigiar-punir', pergunta: 'Vigiar e Punir', autor: 'Foucault', aceitas: ['Foucault', 'Michel Foucault'], tipo: 'obra' },
  { id: 'veu-ignorancia', pergunta: 'véu da ignorância', autor: 'Rawls', aceitas: ['Rawls', 'John Rawls'], tipo: 'conceito' },
  { id: 'teoria-justica', pergunta: 'Uma Teoria da Justiça', autor: 'Rawls', aceitas: ['Rawls', 'John Rawls'], tipo: 'obra' },
  { id: 'agir-comunicativo', pergunta: 'agir comunicativo', autor: 'Habermas', aceitas: ['Habermas', 'Jürgen Habermas'], tipo: 'conceito' },
  { id: 'desconstrucao', pergunta: 'desconstrução', autor: 'Derrida', aceitas: ['Derrida', 'Jacques Derrida'], tipo: 'conceito' },
]

export const SOCIOLOGIA: readonly Item[] = [
  // --- os clássicos ---------------------------------------------------------
  { id: 'fato-social', pergunta: 'fato social', autor: 'Durkheim', aceitas: ['Durkheim', 'Émile Durkheim'], tipo: 'conceito' },
  { id: 'anomia', pergunta: 'anomia', autor: 'Durkheim', aceitas: ['Durkheim', 'Émile Durkheim'], tipo: 'conceito' },
  { id: 'solidariedade', pergunta: 'solidariedade mecânica e orgânica', autor: 'Durkheim', aceitas: ['Durkheim', 'Émile Durkheim'], tipo: 'conceito' },
  { id: 'consciencia-coletiva', pergunta: 'consciência coletiva', autor: 'Durkheim', aceitas: ['Durkheim', 'Émile Durkheim'], tipo: 'conceito' },
  { id: 'suicidio', pergunta: 'O Suicídio', autor: 'Durkheim', aceitas: ['Durkheim', 'Émile Durkheim'], tipo: 'obra' },
  { id: 'acao-social', pergunta: 'ação social', autor: 'Weber', aceitas: ['Weber', 'Max Weber'], tipo: 'conceito' },
  { id: 'tipo-ideal', pergunta: 'tipo ideal', autor: 'Weber', aceitas: ['Weber', 'Max Weber'], tipo: 'conceito' },
  { id: 'desencantamento', pergunta: 'desencantamento do mundo', autor: 'Weber', aceitas: ['Weber', 'Max Weber'], tipo: 'conceito' },
  { id: 'dominacao', pergunta: 'dominação tradicional, carismática e racional-legal', autor: 'Weber', aceitas: ['Weber', 'Max Weber'], tipo: 'conceito' },
  { id: 'burocracia', pergunta: 'a burocracia como jaula de ferro', autor: 'Weber', aceitas: ['Weber', 'Max Weber'], tipo: 'conceito' },
  { id: 'etica-protestante', pergunta: 'A Ética Protestante e o Espírito do Capitalismo', autor: 'Weber', aceitas: ['Weber', 'Max Weber'], tipo: 'obra' },
  { id: 'mais-valia', pergunta: 'mais-valia', autor: 'Marx', aceitas: ['Marx', 'Karl Marx'], tipo: 'conceito' },
  { id: 'luta-classes', pergunta: 'luta de classes', autor: 'Marx', aceitas: ['Marx', 'Karl Marx'], tipo: 'conceito' },
  { id: 'fetichismo', pergunta: 'fetichismo da mercadoria', autor: 'Marx', aceitas: ['Marx', 'Karl Marx'], tipo: 'conceito' },
  { id: 'alienacao', pergunta: 'alienação do trabalho', autor: 'Marx', aceitas: ['Marx', 'Karl Marx'], tipo: 'conceito' },
  { id: 'infra-super', pergunta: 'infraestrutura e superestrutura', autor: 'Marx', aceitas: ['Marx', 'Karl Marx'], tipo: 'conceito' },
  { id: 'capital', pergunta: 'O Capital', autor: 'Marx', aceitas: ['Marx', 'Karl Marx'], tipo: 'obra' },

  // --- século XX ------------------------------------------------------------
  { id: 'funcao-latente', pergunta: 'função manifesta e função latente', autor: 'Merton', aceitas: ['Merton', 'Robert Merton'], tipo: 'conceito' },
  { id: 'estrutural-funcionalismo', pergunta: 'estrutural-funcionalismo e o sistema social', autor: 'Parsons', aceitas: ['Parsons', 'Talcott Parsons'], tipo: 'conceito' },
  { id: 'self', pergunta: 'o self entre o "eu" e o "mim"', autor: 'Mead', aceitas: ['Mead', 'George Herbert Mead'], tipo: 'conceito' },
  { id: 'estigma', pergunta: 'estigma', autor: 'Goffman', aceitas: ['Goffman', 'Erving Goffman'], tipo: 'conceito' },
  { id: 'dramaturgia', pergunta: 'a vida social como representação teatral', autor: 'Goffman', aceitas: ['Goffman', 'Erving Goffman'], tipo: 'conceito' },
  { id: 'rotulacao', pergunta: 'teoria da rotulação e os outsiders', autor: 'Becker', aceitas: ['Becker', 'Howard Becker'], tipo: 'conceito' },
  { id: 'industria-cultural', pergunta: 'indústria cultural', autor: 'Adorno', aceitas: ['Adorno', 'Theodor Adorno', 'Adorno e Horkheimer'], tipo: 'conceito' },
  { id: 'espetaculo', pergunta: 'sociedade do espetáculo', autor: 'Debord', aceitas: ['Debord', 'Guy Debord'], tipo: 'conceito' },
  { id: 'habitus', pergunta: 'habitus', autor: 'Bourdieu', aceitas: ['Bourdieu', 'Pierre Bourdieu'], tipo: 'conceito' },
  { id: 'capital-cultural', pergunta: 'capital cultural', autor: 'Bourdieu', aceitas: ['Bourdieu', 'Pierre Bourdieu'], tipo: 'conceito' },
  { id: 'violencia-simbolica', pergunta: 'violência simbólica', autor: 'Bourdieu', aceitas: ['Bourdieu', 'Pierre Bourdieu'], tipo: 'conceito' },
  { id: 'modernidade-liquida', pergunta: 'modernidade líquida', autor: 'Bauman', aceitas: ['Bauman', 'Zygmunt Bauman'], tipo: 'conceito' },
  { id: 'sociedade-risco', pergunta: 'sociedade de risco', autor: 'Beck', aceitas: ['Beck', 'Ulrich Beck'], tipo: 'conceito' },

  // --- pensamento social brasileiro -----------------------------------------
  { id: 'homem-cordial', pergunta: 'o homem cordial', autor: 'Sérgio Buarque de Holanda', aceitas: ['Sérgio Buarque de Holanda', 'Sérgio Buarque'], tipo: 'conceito' },
  { id: 'raizes', pergunta: 'Raízes do Brasil', autor: 'Sérgio Buarque de Holanda', aceitas: ['Sérgio Buarque de Holanda', 'Sérgio Buarque'], tipo: 'obra' },
  { id: 'casa-grande', pergunta: 'Casa-Grande & Senzala', autor: 'Gilberto Freyre', aceitas: ['Gilberto Freyre', 'Freyre'], tipo: 'obra' },
  { id: 'coronelismo', pergunta: 'coronelismo, enxada e voto', autor: 'Victor Nunes Leal', aceitas: ['Victor Nunes Leal', 'Nunes Leal'], tipo: 'conceito' },
  { id: 'formacao-brasil', pergunta: 'Formação do Brasil Contemporâneo', autor: 'Caio Prado Júnior', aceitas: ['Caio Prado Júnior', 'Caio Prado Jr', 'Caio Prado'], tipo: 'obra' },
  { id: 'mito-democracia-racial', pergunta: 'a crítica ao mito da democracia racial', autor: 'Florestan Fernandes', aceitas: ['Florestan Fernandes', 'Florestan'], tipo: 'conceito' },
  { id: 'dialetica-malandragem', pergunta: 'dialética da malandragem', autor: 'Antonio Candido', aceitas: ['Antonio Candido', 'Antônio Cândido'], tipo: 'conceito' },
  { id: 'racismo-estrutural', pergunta: 'racismo estrutural', autor: 'Silvio Almeida', aceitas: ['Silvio Almeida', 'Sílvio Almeida'], tipo: 'conceito' },
  { id: 'lugar-de-fala', pergunta: 'lugar de fala', autor: 'Djamila Ribeiro', aceitas: ['Djamila Ribeiro', 'Djamila'], tipo: 'conceito' },
]
