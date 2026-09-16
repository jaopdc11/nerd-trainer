import type { Elemento } from './tabela-periodica'

/**
 * A família de cada elemento — **derivada**, nunca guardada.
 *
 * A família não é um dado novo: ela já está inteira no grupo, no bloco e na
 * linha que `ELEMENTOS` declara. Gravar um campo `familia` ao lado seria
 * duplicar informação que pode divergir — bastaria alguém mexer no grupo de um
 * elemento e o jogo passaria a ensinar química errada em silêncio, exatamente o
 * problema que `nox()` evita não guardando o nox. Aqui a regra é a mesma: uma
 * função, e um gabarito conferido à mão no teste para que a função não possa se
 * autoaprovar.
 *
 * O grupo 3 é o caso que obriga a olhar `linha` e não só `grupo`: o dataset
 * adota a convenção de mandar La e Ac para as faixas de baixo (`linha` 9 e 10,
 * `grupo` null), e a IUPAC de fato deixa La×Lu em aberto. Essa decisão já foi
 * tomada lá em cima e este módulo se limita a respeitá-la — se um dia a
 * convenção mudar, muda no dataset e a classificação acompanha sozinha.
 */

export type Familia =
  | 'hidrogenio'
  | 'alcalinos'
  | 'alcalinoterrosos'
  | 'transicao'
  | 'lantanideos'
  | 'actinideos'
  | 'boro'
  | 'carbono'
  | 'pnictogenios'
  | 'calcogenios'
  | 'halogenios'
  | 'nobres'

/** Na ordem em que se atravessa a tabela, não em ordem alfabética. */
export const FAMILIAS: readonly Familia[] = [
  'hidrogenio',
  'alcalinos',
  'alcalinoterrosos',
  'lantanideos',
  'actinideos',
  'transicao',
  'boro',
  'carbono',
  'pnictogenios',
  'calcogenios',
  'halogenios',
  'nobres',
]

/**
 * O que aparece escrito no botão.
 *
 * "metais alcalinos" e não "alcalinos" porque a alternativa vizinha é "metais
 * alcalinoterrosos": com os nomes curtos, as duas opções mais confundíveis do
 * jogo ficariam distinguíveis por uma sílaba no fim de uma palavra só, e ler a
 * alternativa passaria a fazer parte da dificuldade. Não é isso que o jogo quer
 * medir.
 *
 * O hidrogênio não repete o próprio nome no rótulo. Se o botão dissesse
 * "hidrogênio", a carta que pergunta pelo H entregaria a resposta na primeira
 * leitura — e é justamente essa a carta que mais tem a ensinar.
 */
export const ROTULO_FAMILIA: Readonly<Record<Familia, string>> = {
  hidrogenio: 'nenhuma — é caso à parte',
  alcalinos: 'metais alcalinos',
  alcalinoterrosos: 'metais alcalinoterrosos',
  transicao: 'metais de transição',
  lantanideos: 'lantanídeos',
  actinideos: 'actinídeos',
  boro: 'família do boro',
  carbono: 'família do carbono',
  pnictogenios: 'pnictogênios',
  calcogenios: 'calcogênios',
  halogenios: 'halogênios',
  nobres: 'gases nobres',
}

/**
 * Grupo → família, para tudo que tem grupo.
 *
 * Os grupos 3 a 12 caem todos em `transicao`, inclusive o 12. O zinco, o cádmio
 * e o mercúrio têm d¹⁰ completo e há quem os ponha fora dos metais de transição
 * pela definição estrita da IUPAC ("camada d incompleta, inclusive num íon
 * comum"). Ficam dentro aqui por duas razões: é a convenção do ensino médio
 * brasileiro, que é o público deste jogo; e a alternativa seria criar uma
 * décima terceira família para três elementos, cujo único efeito prático seria
 * transformar Zn numa pegadinha sobre nomenclatura em vez de uma pergunta sobre
 * onde o elemento mora.
 */
const POR_GRUPO: Readonly<Record<number, Familia>> = {
  1: 'alcalinos',
  2: 'alcalinoterrosos',
  3: 'transicao',
  4: 'transicao',
  5: 'transicao',
  6: 'transicao',
  7: 'transicao',
  8: 'transicao',
  9: 'transicao',
  10: 'transicao',
  11: 'transicao',
  12: 'transicao',
  13: 'boro',
  14: 'carbono',
  15: 'pnictogenios',
  16: 'calcogenios',
  17: 'halogenios',
  18: 'nobres',
}

/**
 * Classifica um elemento. Lança quando o elemento não se encaixa em nada.
 *
 * Lançar, e não devolver um palpite: um elemento mal cadastrado — bloco f fora
 * das faixas, grupo null no meio da tabela — tem de quebrar o teste, não virar
 * uma carta com resposta plausível e errada. É a mesma escolha de `nox()`.
 *
 * A ordem das três checagens é a decisão de verdade deste arquivo:
 *
 * 1. **H primeiro.** Ele está no grupo 1 e não é alcalino: um gás diatômico e
 *    não-metálico não vira metal alcalino porque calhou de ter um elétron na
 *    camada de valência. Ver `ROTULO_FAMILIA`.
 * 2. **Bloco f antes do grupo**, porque lantanídeo e actinídeo têm `grupo` null
 *    e cair no `POR_GRUPO` os mandaria para o erro em vez da resposta.
 * 3. **Grupo por último**, e aí o He se resolve sozinho: ele é bloco s, mas é
 *    grupo 18, e quem manda é o grupo. Hélio é gás nobre, não alcalinoterroso.
 */
export function familiaDe(e: Elemento): Familia {
  if (e.z === 1) return 'hidrogenio'

  if (e.bloco === 'f') {
    if (e.linha === 9) return 'lantanideos'
    if (e.linha === 10) return 'actinideos'
    throw new Error(`${e.simbolo}: bloco f fora das faixas (linha ${e.linha})`)
  }

  if (e.grupo === null) {
    throw new Error(`${e.simbolo}: sem grupo e fora do bloco f, não dá para classificar`)
  }

  const familia = POR_GRUPO[e.grupo]
  if (familia === undefined) {
    throw new Error(`${e.simbolo}: grupo ${e.grupo} não existe na tabela`)
  }
  return familia
}

/**
 * As famílias que fazem fronteira com cada uma, em ordem de quão tentadoras são.
 *
 * Escrita à mão, e não calculada a partir do número do grupo, por dois motivos.
 * O primeiro é que a vizinhança de verdade não é linear: lantanídeos e
 * actinídeos são vizinhos um do outro e dos metais de transição, mas moram numa
 * faixa que o número do grupo nem tem. O segundo é que "vizinho" aqui significa
 * *erro que alguém comete*, não distância geométrica — e isso é conhecimento de
 * química, que pertence ao dataset, do mesmo jeito que os distratores do nox.
 *
 * O critério, alternativa a alternativa: distrator absurdo se elimina sozinho e
 * a carta deixa de medir qualquer coisa. Oferecer "gases nobres" para o ferro é
 * transformar quatro opções em três. Oferecer "metais alcalinoterrosos" para o
 * sódio é perguntar de verdade se a pessoa sabe contar a coluna.
 *
 * A relação é **simétrica entre as onze famílias de verdade**, e o teste cobra
 * isso: se A é um erro plausível para quem procura B, B é um erro plausível para
 * quem procura A. Assimetria aqui seria esquecimento em 100% dos casos. A única
 * exceção é o hidrogênio, e ela é de propósito — ver `distratores`.
 */
export const VIZINHAS: Readonly<Record<Familia, readonly Familia[]>> = {
  // As três leituras que existem do hidrogênio, e todas têm defesa: fica sobre
  // o lítio (alcalino), falta-lhe um elétron para fechar camada como a um
  // halogênio, e esse elétron que falta é justamente o do hélio. Quem marca
  // qualquer uma delas não chutou — entendeu metade.
  hidrogenio: ['alcalinos', 'halogenios', 'nobres'],
  // O erro de quem não sabe localizar um metal é outro metal, nunca um
  // ametal: ninguém confunde potássio com calcogênio. Daí a vizinhança dos
  // quatro primeiros ser toda dentro do lado esquerdo da tabela — a coluna ao
  // lado, o bloco d e a faixa f.
  alcalinos: ['alcalinoterrosos', 'transicao', 'lantanideos'],
  alcalinoterrosos: ['alcalinos', 'transicao', 'lantanideos', 'actinideos'],
  // A faixa f fica logo depois do grupo 2 e antes do 4: é de lá que vêm os dois
  // erros honestos. A troca entre as duas faixas vem primeiro porque é o erro
  // clássico de quem sabe que existe faixa e não sabe qual delas é qual.
  lantanideos: ['actinideos', 'transicao', 'alcalinoterrosos', 'alcalinos'],
  actinideos: ['lantanideos', 'transicao', 'alcalinoterrosos'],
  transicao: ['lantanideos', 'actinideos', 'alcalinoterrosos', 'alcalinos', 'boro'],
  // Do boro em diante a vizinhança é geométrica de verdade: a coluna ao lado e
  // a seguinte. Errar por uma coluna é o erro que o bloco p produz.
  boro: ['transicao', 'carbono', 'pnictogenios'],
  carbono: ['boro', 'pnictogenios', 'calcogenios'],
  pnictogenios: ['carbono', 'calcogenios', 'boro', 'halogenios', 'nobres'],
  calcogenios: ['pnictogenios', 'halogenios', 'carbono', 'nobres'],
  halogenios: ['calcogenios', 'nobres', 'pnictogenios'],
  nobres: ['halogenios', 'calcogenios', 'pnictogenios'],
}

/**
 * Candidatos a alternativa errada, do mais tentador ao menos.
 *
 * Devolve as vizinhas primeiro e só então o resto, numa ordem fixa, para que o
 * jogo nunca fique sem três opções mesmo se um dia alguém encurtar `VIZINHAS`.
 * Hoje a sobra nunca é usada — todas as famílias têm ao menos três vizinhas — e
 * o teste trava isso, porque é a sobra que abriria a porta para o distrator
 * absurdo voltar sem ninguém notar.
 *
 * O hidrogênio é excluído de propósito: "nenhuma — é caso à parte" nunca é um
 * erro que alguém comete de boa-fé sobre o oxigênio, e seria a única alternativa
 * com cara de resposta especial na tela. Ela só aparece na carta do H, onde é a
 * resposta certa.
 */
export function distratores(familia: Familia): readonly Familia[] {
  const vizinhas = VIZINHAS[familia]
  const resto = FAMILIAS.filter(
    (f) => f !== familia && f !== 'hidrogenio' && !vizinhas.includes(f),
  )
  return [...vizinhas, ...resto]
}
