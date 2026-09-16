import {
  BASES_DNA,
  CODONS,
  codificadoraParaRna,
  distratores,
  distratoresDeCodificadora,
  distratoresDeMolde,
  moldeDe,
  rotulo,
  transcrever,
  traduzir,
} from '@/data/codigo-genetico'
import type { Rng } from '@/core/rng'
import type { Conteudo, Exercicio, JogoGerador } from '@/core/types'

/**
 * DNA → mRNA → proteína, contra o relógio.
 *
 * Os três degraus são as três pernas do caminho: primeiro parear a fita molde,
 * depois ler o códon na tabela, e por fim fazer as duas coisas na mesma cabeça —
 * que é a única pergunta do assunto que uma prova de verdade faz. No último
 * degrau entra também a armadilha, que é a fita **codificadora**: ela tem a
 * mesma sequência do mRNA e não se complementa, e quem não sabe qual das duas
 * fitas está na mão erra tudo com o método certo.
 *
 * **Por que isto não é o jogo de códons outra vez.** Lá o baralho são os 64
 * códons, sem relógio, em morte súbita: ele mede o repertório da tabela, e o
 * placar é até onde você vai sem tropeçar. Aqui o códon é uma perna de três,
 * você tem de chegar até ele sozinho a partir do DNA, e o relógio anda. São
 * medidas diferentes da mesma matéria, como a grade da tabela periódica e o
 * baralho de símbolos dos elementos — e, como lá, o dataset é o mesmo de
 * propósito: duplicar a tabela para dar um baralho próprio a este jogo criaria
 * uma segunda verdade sobre o código genético.
 *
 * **De escolha, o jogo inteiro**, e as duas metades chegaram aí por caminhos
 * diferentes:
 *
 * - o aminoácido é o caso do nox e do latim: 'ácido glutâmico' não se digita
 *   contra o relógio, e 'parada' não tem forma canônica nenhuma;
 * - a fita de mRNA, sozinha, *seria* digitável — 'AUGCCU' é curta, positiva e
 *   inequívoca, exatamente o critério que manteve o pH no teclado. Foi de
 *   escolha assim mesmo, por duas razões. A primeira é que as opções erradas
 *   **são** a lição: as três leituras erradas da fita (não complementou,
 *   complementou ao contrário, esqueceu o U) são o assunto inteiro, e um campo
 *   de texto vazio não pergunta "molde ou codificadora?". A segunda é que
 *   alternar entre digitar-e-dar-Enter e clicar no meio de uma partida
 *   cronometrada é pior do que qualquer uma das duas — é a mesma objeção que o
 *   pH faz a trocar de teclado entre um item e o outro, e ela é mais séria
 *   quando o que troca é o gesto.
 *
 * Os distratores moram no dataset, ao lado da tabela de pareamento, pelo mesmo
 * motivo dos do nox: a lista é biologia, e quem mexer nas tabelas tem de ver os
 * erros que elas produzem na mesma tela.
 */

/** Uma fita de DNA sorteada base a base. Seis = dois códons, e é o que se lê de relance. */
function fitaDna(rng: Rng, bases: number): string {
  return Array.from({ length: bases }, () => rng.pick(BASES_DNA)).join('')
}

function escolha(
  chave: string,
  enunciado: string,
  certo: string,
  errados: readonly string[],
  rng: Rng,
  porque?: string,
): Exercicio {
  // Explode em vez de montar uma carta de três opções, ou de duas opções iguais.
  // Um gerador que devolve exercício degenerado não pode virar uma partida que
  // roda: é a mesma escolha do `digitada()` do pH, que prefere lançar a entregar
  // um item impossível de acertar.
  if (errados.length < 3) throw new Error(`${chave}: só ${errados.length} distratores`)
  if (errados.includes(certo)) throw new Error(`${chave}: a resposta certa está entre os errados`)

  const opcoes = rng.shuffle([certo, ...errados.slice(0, 3)])
  return {
    tipo: 'escolha',
    chave,
    enunciado: { kind: 'texto', valor: enunciado },
    alternativas: opcoes.map((v): Conteudo => ({ kind: 'texto', valor: v })),
    indiceCorreto: opcoes.indexOf(certo),
    gabarito: certo,
    ...(porque ? { porque } : {}),
  }
}

type Gerador = (rng: Rng) => Exercicio

/**
 * Fita molde → mRNA. A definição, sem desvio nenhum.
 *
 * Seis bases e não três: com três, a resposta certa e a errada diferem em três
 * caracteres e o item vira comparação visual; com seis, é mais rápido
 * transcrever de cabeça e reconhecer o resultado do que conferir opção por
 * opção — que é justamente o que se quer treinar. Doze seriam leitura, não
 * pareamento.
 */
const moldeParaRna: Gerador = (rng) => {
  const molde = fitaDna(rng, 6)
  return escolha(
    `transcricao:molde:${molde}`,
    `mRNA da fita molde ${molde}`,
    transcrever(molde),
    distratoresDeMolde(molde),
    rng,
  )
}

/** Códon → aminoácido. A tabela, direta. */
const codonParaAminoacido: Gerador = (rng) => {
  const codon = rng.pick(CODONS)
  const certo = traduzir(codon)
  return escolha(
    `transcricao:codon:${codon}`,
    `aminoácido do códon ${codon}`,
    rotulo(certo),
    distratores(codon).map(rotulo),
    rng,
  )
}

/**
 * As duas pernas de uma vez: fita molde → aminoácido.
 *
 * O códon é sorteado primeiro e o molde sai dele por `moldeDe`, e não o
 * contrário. Sortear três bases de DNA daria o mesmo espaço amostral, mas a
 * chave do exercício ficaria em DNA e a anti-repetição deixaria de conversar com
 * o degrau anterior — TAC e AUG são o mesmo item visto de dois lados.
 *
 * O primeiro distrator é o aminoácido que sai se a fita for lida como
 * codificadora: é o erro com nome deste degrau, e ele tem de estar na tela pelo
 * mesmo motivo que a regra decorada está na tela do nox. Depois dele vêm os
 * vizinhos de um nucleotídeo, que cobram a degenerescência.
 */
const moldeParaAminoacido: Gerador = (rng) => {
  const codon = rng.pick(CODONS)
  const molde = moldeDe(codon)
  const certo = traduzir(codon)

  const lidaAoContrario = codificadoraParaRna(molde)
  const errados = [rotulo(traduzir(lidaAoContrario)), ...distratores(codon).map(rotulo)].filter(
    (nome) => nome !== rotulo(certo),
  )

  return escolha(
    `transcricao:molde-amino:${codon}`,
    `aminoácido da fita molde ${molde}`,
    rotulo(certo),
    [...new Set(errados)],
    rng,
    `${molde} transcreve para ${codon}, e ${codon} é ${rotulo(certo)}`,
  )
}

/**
 * A armadilha: fita **codificadora** → mRNA, onde complementar é o erro.
 *
 * É o `H₂O₂` deste jogo — o item em que o método decorado no primeiro degrau
 * produz a resposta errada. Ele mora no último degrau e não no primeiro porque
 * só trai quem já aprendeu a complementar: mostrá-lo antes ensinaria que às
 * vezes se complementa e às vezes não, sem dizer quando, que é pior do que não
 * ensinar nada.
 */
const codificadoraParaMrna: Gerador = (rng) => {
  const fita = fitaDna(rng, 6)
  return escolha(
    `transcricao:codificadora:${fita}`,
    `mRNA da fita codificadora ${fita}`,
    codificadoraParaRna(fita),
    distratoresDeCodificadora(fita),
    rng,
    'a codificadora é a irmã da molde: ela já tem a sequência do mRNA, então só se troca T por U — quem complementa aqui leu a fita errada',
  )
}

const DEGRAUS: readonly (readonly Gerador[])[] = [
  [moldeParaRna],
  [codonParaAminoacido],
  [moldeParaAminoacido, codificadoraParaMrna],
]

export function gerarTranscricao(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), DEGRAUS.length - 1)
  const atuais = DEGRAUS[n] ?? []
  // O nível novo entra em dobro: acumula os anteriores sem afogá-los.
  return rng.pick([...DEGRAUS.slice(0, n).flat(), ...atuais, ...atuais])(rng)
}

export const transcricao: JogoGerador = {
  id: 'transcricao',
  mecanica: 'gerador',
  nome: 'Transcrição e tradução',
  icone: '🧬',
  resumo: 'Da fita de DNA ao aminoácido, contra o relógio.',
  categoria: 'biologicas',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Fita molde: pareie e troque T por U — TAC vira AUG.',
    'As opções erradas são as três leituras erradas da fita: não complementou, complementou ao contrário, esqueceu de trocar o T pelo U.',
    'Nos níveis finais a fita vai direto ao aminoácido, e aparece a codificadora — que já tem a sequência do mRNA e não se complementa.',
    'Cada acerto devolve 6 segundos ao relógio.',
  ],
  /**
   * Relógio maior que o do nox e do pH, como o do balanceamento e o da
   * configuração eletrônica.
   *
   * Lá o item é "+6" contra "−2" e se lê na batida; aqui cada item pede seis
   * pares de bases, ou uma entrada de tabela, ou as duas coisas — e quatro fitas
   * de seis caracteres não se comparam de relance. Os 75 segundos e o bônus de 6
   * pagam o custo do item; eles não aumentam a vazão, e é por isso que a meta no
   * Nerdômetro fica em 20 e não em 25.
   */
  config: () => ({
    gerar: gerarTranscricao,
    segundosIniciais: 75,
    bonusPorAcertoS: 6,
    tetoSegundos: 150,
    escala: (acertos) => Math.min(2, Math.floor(acertos / 6)),
    teclado: 'texto',
  }),
}
