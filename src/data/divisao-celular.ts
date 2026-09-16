/**
 * As fases do ciclo celular e da meiose, na ordem em que acontecem.
 *
 * **Por que o item é a fase mais fina, e não a mais conhecida.** A escada aqui
 * tem dois degraus: "intérfase" é o nome de um bloco que se cumpre em G1, S e
 * G2; "prófase I" é o nome de um bloco que se cumpre em leptóteno, zigóteno,
 * paquíteno, diplóteno e diacinese. Dá para montar a lista nos dois níveis, e a
 * escolha muda o jogo inteiro.
 *
 * O dataset fica no nível fino, e a regra é uma só: **é item o menor passo que
 * a escola nomeia e que acontece depois do anterior.** G1, S e G2 se sucedem;
 * leptóteno a diacinese se sucedem. "Intérfase" e "prófase I" não se sucedem a
 * nada — são rótulos de quem já está dentro deles.
 *
 * A alternativa descartada foi listar os dois níveis: intérfase, G1, S, G2,
 * prófase I, leptóteno… É exatamente o erro que `periodos-brasil.ts` recusou ao
 * deixar o Estado Novo fora da lista de períodos — misturar duas réguas faz a
 * pergunta "o que vem depois" perder resposta única, porque depois da intérfase
 * vem G1 e vem a prófase, dependendo da régua que se estiver lendo. Com uma
 * régua só, cada casa tem um dono.
 *
 * O preço está cobrado onde tem de estar: no `comoJogar` do jogo, que diz em
 * voz alta que a intérfase entra por G1/S/G2 e que a prófase I entra pelas
 * cinco subfases. Morrer por não saber o regulamento é o pior jeito de morrer.
 *
 * **A intercinese entra; a intérfase da meiose não se repete.** A intercinese é
 * item porque carrega sozinha o fato que o jogo existe para ensinar: entre as
 * duas divisões **não há fase S**, e é por isso que a segunda divisão trabalha
 * com metade dos cromossomos sem duplicar nada de novo. Já a intérfase que
 * antecede a meiose I é literalmente a mesma G1/S/G2 do começo da lista, e
 * repeti-la custaria três casas de digitação sem ensinar nada — a meiose começa,
 * nesta lista, no leptóteno.
 *
 * ## Ploidia e quantidade de DNA são dois números, não um
 *
 * Confundir os dois é o erro clássico do conteúdo, e um dataset com uma coluna
 * só o reproduziria. São coisas independentes:
 *
 * - `ploidia` conta **conjuntos cromossômicos** por núcleo: 2 = diploide (2n),
 *   1 = haploide (n). Cai uma vez só na meiose, na **anáfase I**, quando os
 *   homólogos se separam.
 * - `dna` conta **quantidade de DNA** por núcleo, em C, onde 2C é o da célula
 *   recém-dividida. Sobe na fase S (2C → 4C) e cai quando as cromátides-irmãs
 *   se separam: na anáfase da mitose e na **anáfase II** da meiose.
 *
 * Quem decora "a meiose reduz pela metade" e para aí erra as duas pontas: acha
 * que a redução é na anáfase II (é na I) e acha que a anáfase II não muda nada
 * (muda o C). O teste de coerência cobra exatamente essas duas afirmações.
 *
 * **Os valores são medidos no fim da fase, e isso não é detalhe.** A fase S
 * começa 2C e termina 4C; registrada pelo começo ela apareceria como 2C e o
 * dataset diria que a duplicação acontece em G2. Na anáfase, em que ainda não
 * há dois núcleos, o valor é o **do polo** — que é o que vai virar núcleo na
 * telófase, e é a única leitura que faz a coluna andar sem salto.
 */

export const TRECHOS = ['mitose', 'meiose'] as const
export type Trecho = (typeof TRECHOS)[number]

/**
 * O bloco a que a fase pertence, para o gabarito dizer onde ela mora.
 *
 * 'intérfase' existe separada de 'mitose' porque **a intérfase não é parte da
 * mitose**: é a parte do ciclo em que a célula não está se dividindo. O trecho
 * as junta (quem recita a mitose recita o ciclo que a contém); o bloco mantém a
 * distinção onde ela importa, que é na hora de explicar.
 */
export const BLOCOS = ['intérfase', 'mitose', 'meiose I', 'intercinese', 'meiose II'] as const
export type Bloco = (typeof BLOCOS)[number]

export interface Fase {
  readonly id: string
  /** O que se digita e o que aparece na fita. */
  readonly nome: string
  /** Formas aceitas. A primeira é sempre `nome` — conferido na carga. */
  readonly aceitas: readonly string[]
  readonly trecho: Trecho
  readonly bloco: Bloco
  /** Conjuntos cromossômicos por núcleo (ou por polo, na anáfase), ao fim da fase. */
  readonly ploidia: 1 | 2
  /** DNA por núcleo (ou por polo), em C, ao fim da fase. 2C = célula recém-dividida. */
  readonly dna: 1 | 2 | 4
  /** O que acontece na fase. É o que vai para o gabarito. */
  readonly acontece: string
}

export const FASES: readonly Fase[] = [
  // ---- Trecho 1: o ciclo com divisão mitótica -----------------------------
  {
    id: 'g1',
    nome: 'G1',
    // Sem 'G₁': o subscrito não é letra nem dígito, e `compactar` o joga fora —
    // "G₁" e "G₂" virariam a mesma chave "g", e digitar um valeria pelo outro.
    // Medido em `divisao-celular.test.ts`, que proíbe chave repetida.
    aceitas: ['G1', 'Fase G1', 'Gap 1'],
    trecho: 'mitose',
    bloco: 'intérfase',
    ploidia: 2,
    dna: 2,
    acontece: 'a célula cresce e produz proteínas; cada cromossomo ainda tem uma cromátide só',
  },
  {
    id: 's',
    nome: 'S',
    aceitas: ['S', 'Fase S', 'Síntese'],
    trecho: 'mitose',
    bloco: 'intérfase',
    ploidia: 2,
    // O único ponto do ciclo em que o DNA duplica. Valor do fim da fase: ver o topo.
    dna: 4,
    acontece: 'o DNA é duplicado: cada cromossomo passa a ter duas cromátides-irmãs',
  },
  {
    id: 'g2',
    nome: 'G2',
    aceitas: ['G2', 'Fase G2', 'Gap 2'],
    trecho: 'mitose',
    bloco: 'intérfase',
    ploidia: 2,
    dna: 4,
    acontece: 'a célula confere a duplicação e monta as proteínas que a divisão vai gastar',
  },
  {
    id: 'profase',
    nome: 'Prófase',
    aceitas: ['Prófase'],
    trecho: 'mitose',
    bloco: 'mitose',
    ploidia: 2,
    dna: 4,
    acontece: 'a cromatina condensa, o nucléolo some, a carioteca se desfaz e o fuso se organiza',
  },
  {
    id: 'metafase',
    nome: 'Metáfase',
    aceitas: ['Metáfase'],
    trecho: 'mitose',
    bloco: 'mitose',
    ploidia: 2,
    dna: 4,
    acontece: 'os cromossomos se alinham um a um na placa equatorial, no máximo da condensação',
  },
  {
    id: 'anafase',
    nome: 'Anáfase',
    aceitas: ['Anáfase'],
    trecho: 'mitose',
    bloco: 'mitose',
    ploidia: 2,
    // Cai o C, não a ploidia: cada polo fica com 2n cromossomos de uma cromátide.
    dna: 2,
    acontece: 'as cromátides-irmãs se separam e migram para polos opostos — cada polo fica 2n',
  },
  {
    id: 'telofase',
    nome: 'Telófase',
    aceitas: ['Telófase'],
    trecho: 'mitose',
    bloco: 'mitose',
    ploidia: 2,
    dna: 2,
    acontece: 'os cromossomos descondensam e duas cariotecas se reorganizam em volta deles',
  },
  {
    id: 'citocinese',
    nome: 'Citocinese',
    aceitas: ['Citocinese'],
    trecho: 'mitose',
    bloco: 'mitose',
    ploidia: 2,
    dna: 2,
    acontece: 'o citoplasma se divide e saem duas células diploides idênticas à mãe',
  },

  // ---- Trecho 2: meiose I -------------------------------------------------
  {
    id: 'leptoteno',
    nome: 'Leptóteno',
    // 'Leptonema' é a outra nomenclatura corrente (leptonema, zigonema,
    // paquinema, diplonema), e não é sinônimo de conveniência: há livro
    // brasileiro que só usa essa. Recusá-la mataria quem estudou pelo outro.
    aceitas: ['Leptóteno', 'Leptonema'],
    trecho: 'meiose',
    bloco: 'meiose I',
    ploidia: 2,
    dna: 4,
    acontece: 'os cromossomos começam a condensar e aparecem como filamentos finos',
  },
  {
    id: 'zigoteno',
    nome: 'Zigóteno',
    aceitas: ['Zigóteno', 'Zigonema'],
    trecho: 'meiose',
    bloco: 'meiose I',
    ploidia: 2,
    dna: 4,
    acontece: 'os homólogos se emparelham ponto a ponto, montando o complexo sinaptonêmico',
  },
  {
    id: 'paquiteno',
    nome: 'Paquíteno',
    aceitas: ['Paquíteno', 'Paquinema'],
    trecho: 'meiose',
    bloco: 'meiose I',
    ploidia: 2,
    dna: 4,
    acontece: 'acontece o crossing-over: os homólogos pareados trocam pedaços entre si',
  },
  {
    id: 'diploteno',
    nome: 'Diplóteno',
    aceitas: ['Diplóteno', 'Diplonema'],
    trecho: 'meiose',
    bloco: 'meiose I',
    ploidia: 2,
    dna: 4,
    acontece: 'os homólogos começam a se afastar e os quiasmas ficam visíveis',
  },
  {
    id: 'diacinese',
    nome: 'Diacinese',
    aceitas: ['Diacinese'],
    trecho: 'meiose',
    bloco: 'meiose I',
    ploidia: 2,
    dna: 4,
    acontece: 'a condensação chega ao máximo, o nucléolo some e a carioteca se desfaz',
  },
  {
    id: 'metafase-i',
    nome: 'Metáfase I',
    aceitas: ['Metáfase I', 'Metáfase 1'],
    trecho: 'meiose',
    bloco: 'meiose I',
    ploidia: 2,
    dna: 4,
    acontece: 'os PARES de homólogos se alinham no equador — não os cromossomos avulsos',
  },
  {
    id: 'anafase-i',
    nome: 'Anáfase I',
    aceitas: ['Anáfase I', 'Anáfase 1'],
    trecho: 'meiose',
    bloco: 'meiose I',
    // A queda. É a única do dataset inteiro, e o teste de coerência existe para
    // que continue sendo — é aqui, e não na anáfase II, que a meiose reduz.
    ploidia: 1,
    dna: 2,
    acontece:
      'os homólogos se separam e as cromátides-irmãs continuam juntas: é aqui que a ploidia cai para n',
  },
  {
    id: 'telofase-i',
    nome: 'Telófase I',
    aceitas: ['Telófase I', 'Telófase 1'],
    trecho: 'meiose',
    bloco: 'meiose I',
    ploidia: 1,
    dna: 2,
    acontece: 'os núcleos se reorganizam já com n cromossomos, cada um ainda com duas cromátides',
  },
  {
    id: 'citocinese-i',
    nome: 'Citocinese I',
    aceitas: ['Citocinese I', 'Citocinese 1'],
    trecho: 'meiose',
    bloco: 'meiose I',
    ploidia: 1,
    dna: 2,
    acontece: 'saem duas células haploides, cada cromossomo ainda com duas cromátides',
  },

  // ---- A dobradiça --------------------------------------------------------
  {
    id: 'intercinese',
    nome: 'Intercinese',
    /*
     * 'Intérfase II' entra como forma aceita a contragosto, e a razão de entrar
     * é a mesma de `periodos-brasil` aceitar "República de 46": é o nome pelo
     * qual boa parte dos livros brasileiros chama a coisa, e recusá-lo mataria a
     * partida de quem aprendeu certo com a palavra errada. A objeção é real — o
     * nome sugere uma intérfase completa, com fase S, que é justamente o que
     * **não** acontece aqui —, e a resposta a ela é o `acontece`, que diz isso
     * na cara no gabarito em vez de fingir que o problema não existe.
     */
    aceitas: ['Intercinese', 'Intérfase II', 'Intérfase 2'],
    trecho: 'meiose',
    bloco: 'intercinese',
    ploidia: 1,
    dna: 2,
    acontece: 'o intervalo entre as duas divisões — e nele NÃO há fase S: o DNA não duplica de novo',
  },

  // ---- Trecho 3: meiose II ------------------------------------------------
  {
    id: 'profase-ii',
    nome: 'Prófase II',
    aceitas: ['Prófase II', 'Prófase 2'],
    trecho: 'meiose',
    bloco: 'meiose II',
    ploidia: 1,
    dna: 2,
    acontece: 'sem homólogo para parear e sem crossing-over: só condensa de novo e monta o fuso',
  },
  {
    id: 'metafase-ii',
    nome: 'Metáfase II',
    aceitas: ['Metáfase II', 'Metáfase 2'],
    trecho: 'meiose',
    bloco: 'meiose II',
    ploidia: 1,
    dna: 2,
    acontece: 'os n cromossomos se alinham no equador, como numa mitose de célula haploide',
  },
  {
    id: 'anafase-ii',
    nome: 'Anáfase II',
    aceitas: ['Anáfase II', 'Anáfase 2'],
    trecho: 'meiose',
    bloco: 'meiose II',
    // Note que a ploidia NÃO cai aqui: já era n desde a anáfase I. O que cai é o C.
    ploidia: 1,
    dna: 1,
    acontece:
      'agora sim as cromátides-irmãs se separam; a ploidia já era n e continua n — o que cai é a quantidade de DNA',
  },
  {
    id: 'telofase-ii',
    nome: 'Telófase II',
    aceitas: ['Telófase II', 'Telófase 2'],
    trecho: 'meiose',
    bloco: 'meiose II',
    ploidia: 1,
    dna: 1,
    acontece: 'quatro núcleos haploides se reorganizam, cada cromossomo com uma cromátide só',
  },
  {
    id: 'citocinese-ii',
    nome: 'Citocinese II',
    aceitas: ['Citocinese II', 'Citocinese 2'],
    trecho: 'meiose',
    bloco: 'meiose II',
    ploidia: 1,
    dna: 1,
    acontece: 'saem as quatro células-filhas haploides e geneticamente diferentes entre si',
  },
]

/** Onde o trecho da mitose termina e o da meiose começa. */
export const TAMANHO_DO_TRECHO_DE_MITOSE = FASES.filter((f) => f.trecho === 'mitose').length

/**
 * Guardas de carga, no espírito do `fichaDe` de `relacoes-ecologicas.ts`: um
 * dataset quebrado tem de falhar barulhento e cedo, não virar uma casa sem
 * resposta possível no meio da partida.
 *
 * As três coisas conferidas são as que ninguém enxerga relendo a lista: id
 * repetido (duas casas com o mesmo dono), `aceitas[0]` diferente de `nome` (a
 * fita mostraria um texto que a validação não aceita) e trecho fora de ordem —
 * um item de meiose entre os de mitose faria `TAMANHO_DO_TRECHO_DE_MITOSE`
 * mentir, e com ele a linha do gabarito e o `comoJogar`.
 */
function conferirDataset(): void {
  const vistos = new Set<string>()
  for (const f of FASES) {
    if (vistos.has(f.id)) throw new Error(`divisao-celular: id repetido "${f.id}"`)
    vistos.add(f.id)
    if (f.aceitas[0] !== f.nome) {
      throw new Error(`divisao-celular: a primeira forma aceita de "${f.id}" não é o nome`)
    }
  }
  const trechos = FASES.map((f) => f.trecho)
  const corte = trechos.indexOf('meiose')
  if (corte === -1 || trechos.slice(corte).some((t) => t !== 'meiose')) {
    throw new Error('divisao-celular: os trechos não estão em blocos contíguos')
  }
}
conferirDataset()

const POR_ID: ReadonlyMap<string, Fase> = new Map(FASES.map((f) => [f.id, f]))

/** Lança em id inexistente: fase sem ficha é casa sem gabarito. */
export function faseDe(id: string): Fase {
  const f = POR_ID.get(id)
  if (!f) throw new Error(`divisao-celular: a fase "${id}" não existe no dataset`)
  return f
}

/** "2n, 4C" — os dois números que o conteúdo vive confundindo, lado a lado. */
export const exibirPloidia = (f: Fase): string => `${f.ploidia === 1 ? 'n' : '2n'}, ${f.dna}C`
