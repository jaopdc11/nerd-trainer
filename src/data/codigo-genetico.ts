/**
 * O código genético: os 64 códons do mRNA e os 20 aminoácidos.
 *
 * **Nada que se resolva fica gravado.** O dataset guarda duas coisas e só duas:
 * a lista dos 20 aminoácidos (nome, sigla de três letras, letra única) e a
 * tabela dos códons em 16 blocos de quatro. Todo o resto — os 64 códons em si,
 * qual aminoácido cada um codifica, quantos códons cada aminoácido tem, quem é
 * vizinho de quem — sai de função. É a mesma regra do nox: gravar a resposta
 * junto do enunciado é pedir para um dedo errado ensinar biologia errada, e aqui
 * seria pior, porque a redundância do código é exatamente o que o jogo quer
 * ensinar. Uma lista escrita à mão com "leucina: 6 códons" envelheceria calada
 * no dia em que alguém corrigisse um bloco.
 *
 * **A tabela é escrita em blocos de quatro, e não como 64 linhas.** Os dois
 * primeiros nucleotídeos são a linha da tabela e o terceiro é a coluna, que é
 * como qualquer livro imprime o código — e é a forma em que a redundância fica
 * visível a olho nu: `'CUU'`/`'CUC'`/`'CUA'`/`'CUG'` viram `CU: 'LLLL'`, um
 * bloco inteiro de leucina. Sessenta e quatro linhas soltas esconderiam
 * justamente isso e dariam sessenta e quatro chances de errar de digitação em
 * vez de dezesseis.
 *
 * A alternativa descartada foi guardar a fita canônica do NCBI
 * (`FFLLSSSSYY**CC*W...`, 64 caracteres em sequência). É mais compacta e é o
 * formato que circula, mas ninguém confere 64 caracteres colados contra um
 * livro sem perder a conta — e conferir à mão é o único controle de qualidade
 * que um dataset destes tem.
 */

/**
 * A ordem dos nucleotídeos **é** a ordem da tabela: U, C, A, G.
 *
 * Não é alfabética nem arbitrária — é a ordem em que o código é impresso desde
 * Nirenberg, e é ela que põe os blocos quadruplamente degenerados juntos. Trocar
 * por A, C, G, U embaralharia todos os blocos de `BLOCOS` e obrigaria a reescrevê-los.
 */
export const BASES_RNA = ['U', 'C', 'A', 'G'] as const
export type BaseRna = (typeof BASES_RNA)[number]

/**
 * As quatro bases do DNA.
 *
 * A ordem aqui é indiferente, e é por isso que é a alfabética e não a de
 * `BASES_RNA`: nenhuma tabela deste arquivo é indexada por ela — ela existe para
 * quem precisa sortear uma fita. Copiar a ordem U, C, A, G daria a impressão
 * falsa de que as duas listas são simétricas, e a primeira pessoa a mexer nisso
 * tentaria alinhá-las.
 */
export const BASES_DNA = ['A', 'T', 'C', 'G'] as const
export type BaseDna = (typeof BASES_DNA)[number]

export interface Aminoacido {
  /** Código de uma letra, sempre maiúsculo (IUPAC-IUB 1968). */
  readonly letra: string
  /** Sigla de três letras, capitalizada: 'Trp', nunca 'TRP' nem 'trp'. */
  readonly sigla: string
  readonly nome: string
  /** Outras grafias do nome que valem: 'aspartato' por 'ácido aspártico'. */
  readonly sinonimos: readonly string[]
}

/**
 * Os 20 aminoácidos proteinogênicos, em ordem de letra — que é a ordem em que
 * qualquer tabela de referência os lista.
 *
 * **As siglas são as internacionais, e não abreviações do português.** Livro
 * brasileiro às vezes escreve Cis, Gli, Fen, Lis, Tir; aqui o gabarito é Cys,
 * Gly, Phe, Lys, Tyr. A razão é a mesma que faz o símbolo do ferro ser Fe em
 * qualquer língua: a sigla de três letras não é uma abreviação do nome, é um
 * símbolo padronizado (IUPAC-IUB, 1983) e é o que está escrito em toda estrutura
 * do PDB, em todo registro do UniProt e em toda notação de mutação. Aceitar 'Gli'
 * seria ensinar uma grafia que não passa em lugar nenhum fora da prova.
 */
export const AMINOACIDOS: readonly Aminoacido[] = [
  { letra: 'A', sigla: 'Ala', nome: 'alanina', sinonimos: [] },
  { letra: 'C', sigla: 'Cys', nome: 'cisteína', sinonimos: [] },
  { letra: 'D', sigla: 'Asp', nome: 'ácido aspártico', sinonimos: ['aspartato'] },
  { letra: 'E', sigla: 'Glu', nome: 'ácido glutâmico', sinonimos: ['glutamato'] },
  { letra: 'F', sigla: 'Phe', nome: 'fenilalanina', sinonimos: [] },
  { letra: 'G', sigla: 'Gly', nome: 'glicina', sinonimos: [] },
  { letra: 'H', sigla: 'His', nome: 'histidina', sinonimos: [] },
  { letra: 'I', sigla: 'Ile', nome: 'isoleucina', sinonimos: [] },
  { letra: 'K', sigla: 'Lys', nome: 'lisina', sinonimos: [] },
  { letra: 'L', sigla: 'Leu', nome: 'leucina', sinonimos: [] },
  { letra: 'M', sigla: 'Met', nome: 'metionina', sinonimos: [] },
  { letra: 'N', sigla: 'Asn', nome: 'asparagina', sinonimos: [] },
  { letra: 'P', sigla: 'Pro', nome: 'prolina', sinonimos: [] },
  { letra: 'Q', sigla: 'Gln', nome: 'glutamina', sinonimos: [] },
  { letra: 'R', sigla: 'Arg', nome: 'arginina', sinonimos: [] },
  { letra: 'S', sigla: 'Ser', nome: 'serina', sinonimos: [] },
  { letra: 'T', sigla: 'Thr', nome: 'treonina', sinonimos: [] },
  { letra: 'V', sigla: 'Val', nome: 'valina', sinonimos: [] },
  { letra: 'W', sigla: 'Trp', nome: 'triptofano', sinonimos: [] },
  { letra: 'Y', sigla: 'Tyr', nome: 'tirosina', sinonimos: [] },
]

/** Marca de parada dentro de `BLOCOS`. Fora daqui a parada é `null`. */
const LETRA_PARADA = '*'

/**
 * Como a parada é chamada na tela.
 *
 * Fica aqui, e não espalhada pelos três jogos, porque é vocabulário do código
 * genético e não de nenhum deles em particular.
 *
 * A primeira versão deste arquivo trazia junto uma lista de sinônimos aceitos
 * ('stop', 'terminação', 'fim', 'nenhum') para o caso de a parada ser digitada.
 * Ela saiu quando os três jogos ficaram prontos e nenhum deles pede a parada por
 * escrito — e é justamente por isso que ela tinha de sair: uma lista de formas
 * aceitas que nenhum validador consulta é um gabarito que ninguém confere, e um
 * gabarito que ninguém confere é o jeito mais silencioso de um dataset começar a
 * mentir. Se um dia algum jogo pedir a parada digitada, a lista volta junto com o
 * jogo que a usa.
 */
export const NOME_PARADA = 'parada'

/**
 * O código, em 16 blocos de quatro.
 *
 * A chave são os dois primeiros nucleotídeos; os quatro caracteres do valor são
 * o terceiro nucleotídeo na ordem `BASES_RNA` — U, C, A, G. Cada caractere é a
 * letra do aminoácido, ou `*` para parada.
 *
 * Conferido à mão contra a tabela padrão (NCBI translation table 1), e o que se
 * enxerga daqui — e não se enxergaria de 64 linhas soltas — é a aritmética do
 * código:
 *
 * - **oito** dos dezesseis blocos são degenerados nos quatro códons (UC, CU,
 *   CC, CG, AC, GU, GC, GG). Metade do código cabe em oito fatos;
 * - **seis** se partem ao meio entre pirimidina e purina no terceiro
 *   nucleotídeo (UU, UA, CA, AA, AG, GA);
 * - **dois**, e só dois, são irregulares de verdade: `UG: 'CC*W'` e
 *   `AU: 'IIIM'`. São os blocos do triptofano e da metionina, os dois
 *   aminoácidos de códon único, e é neles que moram as duas armadilhas do
 *   assunto — UGA é parada e não triptofano, AUA é isoleucina e não metionina.
 *
 * Essa contagem é asserção no teste, e não observação simpática de comentário:
 * um erro de digitação que transformasse `AU: 'IIIM'` em `AU: 'IIII'` faria a
 * metionina sumir do código, e o `expandir()` abaixo pegaria esse caso, mas não
 * pegaria `UA: 'YY**'` virando `UA: 'Y***'`. A contagem pega.
 */
const BLOCOS: Readonly<Record<string, string>> = {
  UU: 'FFLL', UC: 'SSSS', UA: 'YY**', UG: 'CC*W',
  CU: 'LLLL', CC: 'PPPP', CA: 'HHQQ', CG: 'RRRR',
  AU: 'IIIM', AC: 'TTTT', AA: 'NNKK', AG: 'SSRR',
  GU: 'VVVV', GC: 'AAAA', GA: 'DDEE', GG: 'GGGG',
}

/** O códon que inicia toda tradução, e que também codifica metionina. */
export const CODON_INICIO = 'AUG'

const POR_LETRA: ReadonlyMap<string, Aminoacido> = new Map(
  AMINOACIDOS.map((a) => [a.letra, a]),
)

/**
 * Expande os 16 blocos nos 64 códons, **explodindo** se a tabela estiver
 * malformada.
 *
 * Roda na carga do módulo de propósito: um bloco com três caracteres, uma letra
 * que não é aminoácido nenhum ou uma chave sobrando não podem virar um jogo que
 * roda e ensina errado — têm de derrubar o import. É a mesma escolha do `nox()`,
 * que prefere lançar a devolver um inteiro plausível.
 */
function expandir(): Readonly<Record<string, string>> {
  const chaves = Object.keys(BLOCOS)
  if (chaves.length !== 16) {
    throw new Error(`código genético: ${chaves.length} blocos, e a tabela tem 16`)
  }

  const saida: Record<string, string> = {}
  for (const b1 of BASES_RNA) {
    for (const b2 of BASES_RNA) {
      const bloco = BLOCOS[`${b1}${b2}`]
      if (bloco === undefined) throw new Error(`código genético: falta o bloco ${b1}${b2}`)
      if (bloco.length !== 4) {
        throw new Error(`código genético: bloco ${b1}${b2} tem ${bloco.length} letras, e não 4`)
      }
      BASES_RNA.forEach((b3, i) => {
        const letra = bloco[i] as string
        if (letra !== LETRA_PARADA && !POR_LETRA.has(letra)) {
          throw new Error(`código genético: "${letra}" em ${b1}${b2} não é aminoácido nenhum`)
        }
        saida[`${b1}${b2}${b3}`] = letra
      })
    }
  }

  // Um erro de digitação que troca uma letra por outra já existente não seria
  // pego acima — 'CC*W' virando 'CC*C' passaria batido e o triptofano sumiria do
  // código. Exigir que os 20 apareçam fecha essa porta.
  const presentes = new Set(Object.values(saida))
  for (const a of AMINOACIDOS) {
    if (!presentes.has(a.letra)) {
      throw new Error(`código genético: nenhum códon codifica ${a.nome} (${a.letra})`)
    }
  }
  if (!presentes.has(LETRA_PARADA)) throw new Error('código genético: nenhum códon de parada')

  return saida
}

const CODIGO = expandir()

/** Os 64 códons na ordem da tabela: UUU, UUC, UUA, UUG, UCU… */
export const CODONS: readonly string[] = Object.keys(CODIGO)

/**
 * O que um códon codifica. `null` é a parada.
 *
 * Parada é `null` e não um vigésimo-primeiro registro em `AMINOACIDOS` porque
 * parada não é aminoácido: nenhum resíduo entra na cadeia, a tradução acaba.
 * Enfiá-la na lista faria `AMINOACIDOS.length` valer 21 e todo consumidor teria
 * de filtrá-la de volta — e algum esqueceria.
 *
 * Lança em códon inválido: quem passa 'AXG' ou 'ATG' (com T, que é DNA) tem um
 * bug, e devolver `null` ali seria devolver "parada" para um erro de programa.
 */
export function traduzir(codon: string): Aminoacido | null {
  const letra = CODIGO[codon]
  if (letra === undefined) throw new Error(`"${codon}" não é um códon de mRNA`)
  return letra === LETRA_PARADA ? null : (POR_LETRA.get(letra) as Aminoacido)
}

/** Nome do que o códon codifica, com a parada incluída. */
export const rotulo = (t: Aminoacido | null): string => t?.nome ?? NOME_PARADA

/**
 * Todos os códons que codificam a mesma coisa, em ordem de tabela.
 *
 * Derivado, nunca gravado: é a redundância do código, que é o fato que estes
 * jogos existem para ensinar. Uma lista escrita à mão aqui mentiria por omissão
 * no primeiro dia em que alguém corrigisse um bloco.
 */
export const codonsDe = (t: Aminoacido | null): readonly string[] =>
  CODONS.filter((c) => traduzir(c) === t)

// ---------------------------------------------------------------------------
// Transcrição
// ---------------------------------------------------------------------------

/**
 * Pareamento DNA → RNA e RNA → DNA.
 *
 * Duas tabelas e não uma invertida na hora, porque elas não são simétricas: no
 * DNA a adenina pareia com timina e no RNA com uracila, então `A` leva a `U` numa
 * direção e a `T` na outra. Inverter uma tabela daria `U → A` e `A → U`, e o `T`
 * do molde sumiria.
 */
const MOLDE_PARA_RNA: Readonly<Record<string, string>> = { A: 'U', T: 'A', C: 'G', G: 'C' }
const RNA_PARA_MOLDE: Readonly<Record<string, string>> = { A: 'T', U: 'A', C: 'G', G: 'C' }

function mapear(fita: string, tabela: Readonly<Record<string, string>>, oque: string): string {
  let saida = ''
  for (const base of fita) {
    const par = tabela[base]
    if (par === undefined) throw new Error(`"${base}" não é ${oque}`)
    saida += par
  }
  return saida
}

/**
 * Fita **molde** de DNA → mRNA: complementa e troca T por U.
 *
 * As duas fitas são antiparalelas de verdade; escrevê-las alinhadas posição a
 * posição, sem marcar 5′ e 3′, é a convenção de toda a literatura didática e é a
 * que este jogo usa. Marcar a polaridade no enunciado obrigaria a digitá-la na
 * resposta, e aí o jogo passaria a medir notação em vez de pareamento.
 */
export const transcrever = (molde: string): string =>
  mapear(molde, MOLDE_PARA_RNA, 'nucleotídeo de DNA')

/** mRNA → a fita molde que o gerou. O caminho de volta, mesma tabela ao contrário. */
export const moldeDe = (rna: string): string => mapear(rna, RNA_PARA_MOLDE, 'nucleotídeo de RNA')

/**
 * Fita **codificadora** de DNA → mRNA: só troca T por U, sem complementar.
 *
 * É a armadilha inteira do assunto e por isso é função separada, e não um
 * parâmetro booleano de `transcrever`: a fita codificadora tem a mesma sequência
 * do mRNA porque ela é a irmã da molde. Quem complementa aqui está lendo a fita
 * errada, e uma flag no meio da assinatura tornaria esse erro invisível na
 * chamada.
 */
export const codificadoraParaRna = (codificadora: string): string =>
  mapear(codificadora, { A: 'A', T: 'U', C: 'C', G: 'G' }, 'nucleotídeo de DNA')

/**
 * DNA → DNA: a fita irmã, sem passar por RNA.
 *
 * Não é usada para transcrever coisa nenhuma — existe para escrever o erro de
 * quem complementou certo e esqueceu que RNA não tem timina. Fica aqui, junto
 * das outras duas, porque é a terceira tabela de pareamento do assunto e deixá-la
 * escondida no gerador de exercícios seria espalhar biologia por dois arquivos.
 */
export const complementarDna = (fita: string): string =>
  mapear(fita, { A: 'T', T: 'A', C: 'G', G: 'C' }, 'nucleotídeo de DNA')

// ---------------------------------------------------------------------------
// Vizinhança e distratores
// ---------------------------------------------------------------------------

/**
 * Os nove códons a um nucleotídeo de distância, na ordem em que enganam.
 *
 * Terceira posição primeiro, depois primeira, depois segunda — e a ordem não é
 * estética. A terceira posição é a oscilante: é onde o código é degenerado, e
 * é por isso que ela é o erro que vale a pena cobrar. Quem decorou "o terceiro
 * nucleotídeo não muda o aminoácido" acerta os seis blocos quadruplamente
 * degenerados e cai exatamente em UGA (parada, e não triptofano) e em AUA
 * (isoleucina, e não metionina). A primeira posição vem depois porque troca de
 * bloco mantendo a família de trás; a segunda é a que mais muda o aminoácido, e
 * portanto a que menos engana.
 */
export function vizinhos(codon: string): readonly string[] {
  if (CODIGO[codon] === undefined) throw new Error(`"${codon}" não é um códon de mRNA`)

  const saida: string[] = []
  for (const posicao of [2, 0, 1]) {
    for (const base of BASES_RNA) {
      if (base === codon[posicao]) continue
      saida.push(codon.slice(0, posicao) + base + codon.slice(posicao + 1))
    }
  }
  return saida
}

/**
 * As respostas erradas que um humano de fato marca, em ordem de prioridade.
 *
 * Distrator sorteado entre os 20 aminoácidos não mede nada: "prolina" para o
 * códon UGG se elimina sozinho para quem sabe alguma coisa, e para quem não sabe
 * é chute igual. Os que valem são os vizinhos de um nucleotídeo, porque a
 * pergunta real do código genético é onde a degenerescência para — UUA é leucina
 * e UUU é fenilalanina, com um nucleotídeo de diferença; UGG é triptofano e UGA é
 * parada, com um nucleotídeo de diferença.
 *
 * Fica no dataset, e não no jogo, pelo mesmo motivo dos distratores do nox: a
 * lista é biologia, e quem mexer na tabela tem de ver os distratores na mesma
 * tela.
 *
 * A cauda de segurança existe só para o caso de a tabela mudar: hoje os 64
 * códons têm pelo menos três vizinhos distintos, e o teste trava isso.
 */
export function distratores(codon: string): readonly (Aminoacido | null)[] {
  const certo = traduzir(codon)
  const vistos = new Set<Aminoacido | null>([certo])
  const saida: (Aminoacido | null)[] = []

  const considerar = (t: Aminoacido | null): void => {
    if (vistos.has(t)) return
    vistos.add(t)
    saida.push(t)
  }

  for (const v of vizinhos(codon)) considerar(traduzir(v))
  for (const a of AMINOACIDOS) considerar(a)
  return saida
}

/** A mesma fita com uma base trocada, posição a posição. Só cauda de segurança. */
function umaBaseTrocada(fita: string): readonly string[] {
  const saida: string[] = []
  for (let i = 0; i < fita.length; i++) {
    for (const base of BASES_RNA) {
      if (base === fita[i]) continue
      saida.push(fita.slice(0, i) + base + fita.slice(i + 1))
    }
  }
  return saida
}

/** Dedupe preservando a ordem de plausibilidade, sem deixar a certa entrar. */
function alemDoCerto(certo: string, candidatos: readonly string[]): readonly string[] {
  const vistos = new Set<string>([certo])
  const saida: string[] = []
  for (const c of candidatos) {
    if (vistos.has(c)) continue
    vistos.add(c)
    saida.push(c)
  }
  return saida
}

/**
 * As fitas de mRNA erradas que um humano de fato marca, dada a fita **molde**.
 *
 * Em ordem de quão tentadoras são, e a ordem é o conteúdo:
 *
 * 1. **leu a molde como se fosse a codificadora** — só trocou T por U e não
 *    complementou nada. É a armadilha inteira do assunto, e é a única opção que
 *    continua sendo RNA plausível: quem marca esta não sabe qual das duas fitas
 *    está na mão, que é exatamente o que o item pergunta;
 * 2. **leu de trás para frente** — o complemento reverso. As fitas são
 *    antiparalelas de verdade, e produzir o reverso é o erro clássico de quem
 *    aprendeu a antiparalelidade e a aplicou onde o enunciado não pediu;
 * 3. **complementou certo e esqueceu o U** — devolveu a fita irmã em DNA, com
 *    timina.
 *
 * A terceira vem por último de propósito, porque é a mais fraca: um T na tela
 * denuncia a opção para quem sabe que RNA não tem timina, e uma opção que se
 * elimina sozinha transforma quatro alternativas em três. Ela fica mesmo assim
 * pela mesma razão que o nox mantém a regra decorada entre as opções — é o erro
 * com nome, e quem o comete precisa vê-lo escrito para descobrir que o cometeu.
 *
 * A cauda de `umaBaseTrocada` não é enfeite: fita sem nenhum A faz o item 3
 * coincidir com a resposta certa (não há T para sobrar), e fita palindrômica faz
 * o item 2 coincidir. Sem a cauda, esses sorteios devolveriam duas alternativas
 * e não quatro.
 */
export function distratoresDeMolde(molde: string): readonly string[] {
  const certo = transcrever(molde)
  return alemDoCerto(certo, [
    codificadoraParaRna(molde),
    [...certo].reverse().join(''),
    complementarDna(molde),
    ...umaBaseTrocada(certo),
  ])
}

/**
 * O mesmo, dada a fita **codificadora** — onde a resposta certa é a fita quase
 * inalterada e o erro é justamente complementar.
 *
 * Função separada, e não um parâmetro de `distratoresDeMolde`, pelo motivo já
 * dado em `codificadoraParaRna`: qual fita está na mão é a pergunta do assunto,
 * e escondê-la num argumento tornaria o erro invisível na chamada. Os dois erros
 * com nome trocam de lugar: aqui o tentador é ter complementado, e o fraco é ter
 * devolvido a fita de DNA intacta, com timina e tudo.
 */
export function distratoresDeCodificadora(codificadora: string): readonly string[] {
  const certo = codificadoraParaRna(codificadora)
  return alemDoCerto(certo, [
    transcrever(codificadora),
    [...certo].reverse().join(''),
    codificadora,
    ...umaBaseTrocada(certo),
  ])
}
