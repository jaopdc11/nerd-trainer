/**
 * Proposições escritas em notação, e o que elas de fato afirmam.
 *
 * **Este é o jogo que separa quem lê matemática de quem reconhece símbolo
 * solto.** Saber que `∀` se chama "para todo" e que `∃` se chama "existe" é o
 * jogo de símbolos, ao lado. Ler `∃y ∀x : y > x` e perceber que isso afirma a
 * existência de um real maior que todos os reais — e que trocar a ordem dos
 * dois quantificadores muda uma falsidade numa verdade banal — é outra coisa
 * inteiramente, e é a única que serve para alguma coisa numa demonstração.
 *
 * **Por que é de escolha e não digitado.** A resposta certa aqui é uma frase em
 * português, e frase em português tem cinquenta grafias equivalentes. Digitar
 * mediria redação. Com quatro alternativas, o item cobra exatamente a leitura —
 * e a qualidade do exercício passa a depender inteiramente dos distratores.
 *
 * **A regra dos distratores, que é a regra do jogo.** Todo distrator aqui é uma
 * *leitura errada da mesma notação*, catalogada em `ErroClassico`: trocar a
 * ordem dos quantificadores, ler `∈` onde está `⊆`, responder a recíproca no
 * lugar da contrapositiva, chamar de imagem o que é contradomínio. Distrator
 * que é só "outra frase de matemática" não mede nada: quem não sabe elimina
 * pelo assunto, e quem sabe acerta sem ler. Há teste que exige a etiqueta de
 * erro em cada distrator, e o embaralhador prefere três classes de erro
 * diferentes por carta, para o jogador não enfrentar três variações da mesma
 * armadilha.
 *
 * **Por que Unicode e não MathML.** Toda proposição daqui é linear: `∀`, `∃`,
 * `⟹`, `↦`, índices e expoentes que o Unicode já tem (`xₙ`, `x²`, `f⁻¹`, `ℵ₀`).
 * O MathML do projeto existe para estrutura em duas dimensões — fração, radical,
 * limite embaixo do sigma — e nada disso aparece aqui. Pagar um script gerador,
 * um arquivo gerado e um teste de sincronia para desenhar o mesmo texto seria
 * cerimônia. O dia em que uma carta precisar de uma fração de verdade, esta
 * decisão se revisa; até lá, a notação é string e o teste garante que ela nunca
 * caia em ASCII improvisado (`<=`, `->`, `!=`).
 */

export type Tema =
  | 'quantificadores'
  | 'conjuntos'
  | 'funcoes'
  | 'implicacao'
  | 'limites'
  | 'aritmetica'
  | 'algebra'
  | 'probabilidade'

/**
 * O catálogo de leituras erradas. Cada distrator carrega a sua, e isso não é
 * enfeite: é o que permite ao teste cobrar que o baralho continue medindo o que
 * promete, e ao embaralhador variar a armadilha dentro de uma mesma carta.
 */
export type ErroClassico =
  /** Lê `∀x ∃y` como `∃y ∀x`, ou vice-versa. O erro-rei da análise. */
  | 'ordem-dos-quantificadores'
  /** Troca `∀` por `∃` sem mexer na ordem: "algum" onde está "todo". */
  | 'quantificador-trocado'
  /** Confunde `∈` com `⊆`: elemento de um conjunto × parte dele. */
  | 'pertence-por-contido'
  /** Responde `Q ⟹ P` no lugar de `P ⟹ Q`. */
  | 'reciproca'
  /** Responde `¬P ⟹ ¬Q`, que é a inversa e não equivale a nada. */
  | 'inversa'
  /** Troca domínio, contradomínio e imagem uns pelos outros. */
  | 'imagem-por-dominio'
  /** Empurra a negação para dentro do quantificador errado. */
  | 'negacao-mal-feita'
  /** Troca a operação: `∪` por `∩`, supremo por máximo, `\` por diferença simétrica. */
  | 'operacao-trocada'
  /** Inverte os operandos de uma operação que não é comutativa. */
  | 'ordem-dos-operandos'
  /** Lê `∃!` como `∃`: perde a unicidade pelo caminho. */
  | 'perde-a-unicidade'
  /** Confunde enumerável com não enumerável, ou finito com infinito. */
  | 'cardinalidade-trocada'
  /** Lê um símbolo de relação como se fosse `=`. */
  | 'simbolo-lido-como-igualdade'
  /** Lê a proposição como algo que vale para qualquer objeto — ou seja, nada. */
  | 'confunde-com-caso-trivial'

export interface Distrator {
  /** Leitura errada, em português, no mesmo registro da certa. */
  readonly texto: string
  readonly erro: ErroClassico
}

export interface Proposicao {
  readonly id: string
  /** A proposição como ela aparece na carta. Unicode, sempre. */
  readonly notacao: string
  /** O que ela afirma. É a alternativa correta e é o gabarito. */
  readonly leitura: string
  /**
   * Pelo menos três, e de preferência mais: sobrar distrator é o que permite ao
   * sorteio variar a armadilha entre partidas sem repetir a mesma pegadinha.
   */
  readonly distratores: readonly Distrator[]
  readonly tema: Tema
}

export const PROPOSICOES: readonly Proposicao[] = [
  // --- quantificadores ------------------------------------------------------
  {
    id: 'existe-maior',
    notacao: '∀x∈ℝ ∃y∈ℝ : y > x',
    leitura: 'para cada real existe outro maior que ele — o que é verdade',
    tema: 'quantificadores',
    distratores: [
      { texto: 'existe um real maior que todos os outros', erro: 'ordem-dos-quantificadores' },
      { texto: 'para todo x e para todo y vale y > x', erro: 'quantificador-trocado' },
      {
        texto: 'todo real que é maior que outro real também é real',
        erro: 'confunde-com-caso-trivial',
      },
      { texto: 'não existe real algum sem um maior que ele', erro: 'negacao-mal-feita' },
    ],
  },
  {
    id: 'maximo-dos-reais',
    notacao: '∃y∈ℝ ∀x∈ℝ : y > x',
    leitura: 'existe um real maior que todos os reais — o que é falso',
    tema: 'quantificadores',
    distratores: [
      {
        texto: 'para cada real existe outro maior, o que é verdade',
        erro: 'ordem-dos-quantificadores',
      },
      { texto: 'existe um real maior que si mesmo', erro: 'quantificador-trocado' },
      { texto: 'todo real é maior que algum outro real', erro: 'ordem-dos-quantificadores' },
      { texto: 'nenhum real é maior que todos os outros', erro: 'negacao-mal-feita' },
    ],
  },
  {
    id: 'nega-para-todo',
    notacao: '¬∀x P(x)',
    leitura: 'existe pelo menos um x para o qual P é falsa',
    tema: 'quantificadores',
    distratores: [
      { texto: 'para todo x, P(x) é falsa', erro: 'negacao-mal-feita' },
      { texto: 'não existe x com P(x) verdadeira', erro: 'negacao-mal-feita' },
      { texto: 'existe pelo menos um x para o qual P é verdadeira', erro: 'quantificador-trocado' },
    ],
  },
  {
    id: 'nega-existe',
    notacao: '¬∃x P(x)',
    leitura: 'para todo x, P(x) é falsa',
    tema: 'quantificadores',
    distratores: [
      { texto: 'existe pelo menos um x para o qual P é falsa', erro: 'negacao-mal-feita' },
      { texto: 'nem todo x satisfaz P', erro: 'negacao-mal-feita' },
      { texto: 'existe exatamente um x que não satisfaz P', erro: 'perde-a-unicidade' },
    ],
  },
  {
    id: 'troca-de-quantificadores',
    notacao: '∃x ∀y P(x,y) ⟹ ∀y ∃x P(x,y)',
    leitura: 'vale sempre — e a recíproca, não',
    tema: 'quantificadores',
    distratores: [
      { texto: 'vale sempre, e a recíproca também', erro: 'reciproca' },
      { texto: 'é a recíproca que vale sempre, e não esta', erro: 'reciproca' },
      { texto: 'as duas afirmações dizem a mesma coisa', erro: 'ordem-dos-quantificadores' },
      { texto: 'nenhuma das duas implica a outra', erro: 'negacao-mal-feita' },
    ],
  },
  {
    id: 'existe-unico',
    notacao: '∃! y : f(y) = 0',
    leitura: 'existe exatamente um y que zera f',
    tema: 'quantificadores',
    distratores: [
      { texto: 'existe pelo menos um y que zera f', erro: 'perde-a-unicidade' },
      { texto: 'existe no máximo um y que zera f', erro: 'perde-a-unicidade' },
      { texto: 'todo y do domínio zera f', erro: 'quantificador-trocado' },
      { texto: 'o único valor que f assume é y', erro: 'imagem-por-dominio' },
    ],
  },

  // --- conjuntos ------------------------------------------------------------
  {
    id: 'subconjunto',
    notacao: 'A ⊆ B',
    leitura: 'todo elemento de A também é elemento de B',
    tema: 'conjuntos',
    distratores: [
      { texto: 'A é um dos elementos de B', erro: 'pertence-por-contido' },
      { texto: 'todo elemento de B também é elemento de A', erro: 'ordem-dos-operandos' },
      { texto: 'A e B têm exatamente os mesmos elementos', erro: 'operacao-trocada' },
      { texto: 'A tem menos elementos que B', erro: 'cardinalidade-trocada' },
    ],
  },
  {
    id: 'elemento',
    notacao: 'A ∈ B',
    leitura: 'o conjunto A é, ele próprio, um dos elementos de B',
    tema: 'conjuntos',
    distratores: [
      { texto: 'todo elemento de A é elemento de B', erro: 'pertence-por-contido' },
      { texto: 'A é um subconjunto de B', erro: 'pertence-por-contido' },
      { texto: 'B é um dos elementos de A', erro: 'ordem-dos-operandos' },
      { texto: 'A e B têm elementos em comum', erro: 'operacao-trocada' },
    ],
  },
  {
    id: 'vazio-contido',
    notacao: '∅ ⊆ A',
    leitura: 'vale para qualquer A: o vazio não tem elemento que possa faltar em A',
    tema: 'conjuntos',
    distratores: [
      { texto: 'o vazio é um dos elementos de A, seja A qual for', erro: 'pertence-por-contido' },
      { texto: 'A é o conjunto vazio, porque ∅ aparece à esquerda', erro: 'operacao-trocada' },
      {
        texto: 'A tem pelo menos um elemento para o vazio caber dentro',
        erro: 'confunde-com-caso-trivial',
      },
    ],
  },
  {
    id: 'vazio-elemento',
    notacao: '∅ ∈ A',
    leitura: 'o conjunto vazio é um dos elementos de A — logo A não é vazio',
    tema: 'conjuntos',
    distratores: [
      {
        texto: 'o vazio está contido em A, o que vale para qualquer A',
        erro: 'pertence-por-contido',
      },
      { texto: 'A é o conjunto vazio, porque ∅ aparece à esquerda', erro: 'operacao-trocada' },
      { texto: 'A não tem nenhum elemento além do vazio', erro: 'confunde-com-caso-trivial' },
    ],
  },
  {
    id: 'diferenca',
    // `∖` (U+2216) e não a contrabarra do teclado: em `A \ B` o traço fica
    // curto e torto ao lado dos outros operadores, e a carta é sobre notação.
    notacao: 'A ∖ B',
    leitura: 'os elementos de A que não estão em B',
    tema: 'conjuntos',
    distratores: [
      { texto: 'os elementos de B que não estão em A', erro: 'ordem-dos-operandos' },
      { texto: 'os elementos que estão em exatamente um dos dois', erro: 'operacao-trocada' },
      { texto: 'os elementos que não estão nem em A nem em B', erro: 'negacao-mal-feita' },
      { texto: 'os elementos que estão em A e em B', erro: 'operacao-trocada' },
    ],
  },
  {
    id: 'uniao',
    notacao: 'x ∈ A ∪ B',
    leitura: 'x está em A, está em B, ou está nos dois',
    tema: 'conjuntos',
    distratores: [
      { texto: 'x está em A e em B ao mesmo tempo', erro: 'operacao-trocada' },
      { texto: 'x está em exatamente um dos dois', erro: 'operacao-trocada' },
      { texto: 'A e B contêm x como subconjunto', erro: 'pertence-por-contido' },
    ],
  },
  {
    id: 'aleph-zero',
    notacao: '|A| = ℵ₀',
    leitura: 'A é infinito enumerável: dá para listá-lo numa sequência indexada por ℕ',
    tema: 'conjuntos',
    distratores: [
      { texto: 'A é infinito e não enumerável, do tamanho de ℝ', erro: 'cardinalidade-trocada' },
      { texto: 'A é finito, porém muito grande', erro: 'cardinalidade-trocada' },
      {
        texto: 'A não tem elemento nenhum, já que a cardinalidade é zero',
        erro: 'simbolo-lido-como-igualdade',
      },
      { texto: 'A é o menor conjunto que não cabe dentro de ℕ', erro: 'cardinalidade-trocada' },
    ],
  },
  {
    id: 'produto-cartesiano',
    notacao: 'A × B',
    leitura: 'o conjunto dos pares ordenados (a, b) com a em A e b em B',
    tema: 'conjuntos',
    distratores: [
      { texto: 'o conjunto dos produtos a·b', erro: 'simbolo-lido-como-igualdade' },
      { texto: 'o mesmo conjunto que B × A', erro: 'ordem-dos-operandos' },
      { texto: 'o conjunto dos pares sem ordem {a, b}', erro: 'operacao-trocada' },
    ],
  },
  {
    id: 'compreensao',
    notacao: '{x ∈ ℝ : x² < 2}',
    leitura: 'os reais cujo quadrado é menor que 2 — o intervalo aberto de −√2 a √2',
    tema: 'conjuntos',
    distratores: [
      { texto: 'o conjunto dos x² com x real, limitado a 2', erro: 'imagem-por-dominio' },
      { texto: 'os quadrados de reais que são menores que 2', erro: 'imagem-por-dominio' },
      { texto: 'os reais menores que 2, sem elevar nada ao quadrado', erro: 'simbolo-lido-como-igualdade' },
      { texto: 'os reais positivos menores que √2', erro: 'operacao-trocada' },
    ],
  },

  // --- funções --------------------------------------------------------------
  {
    id: 'tipo-da-funcao',
    notacao: 'f: X → Y',
    leitura: 'f leva cada elemento de X num elemento de Y: X é o domínio, Y é o contradomínio',
    tema: 'funcoes',
    distratores: [
      { texto: 'Y é o domínio e X é o contradomínio', erro: 'imagem-por-dominio' },
      { texto: 'Y é a imagem de f: todo elemento de Y é atingido', erro: 'imagem-por-dominio' },
      { texto: 'cada elemento de Y vem de um único elemento de X', erro: 'confunde-com-caso-trivial' },
    ],
  },
  {
    id: 'mapsto',
    notacao: 'x ↦ x²',
    leitura: 'a regra da função: cada x é levado no seu quadrado',
    tema: 'funcoes',
    distratores: [
      { texto: 'a equação x = x², cujas soluções são 0 e 1', erro: 'simbolo-lido-como-igualdade' },
      { texto: 'a regra inversa: cada x² é levado no seu x', erro: 'ordem-dos-operandos' },
      { texto: 'o domínio da função é o conjunto dos quadrados', erro: 'imagem-por-dominio' },
    ],
  },
  {
    id: 'pre-imagem',
    notacao: 'f⁻¹(B)',
    leitura: 'a pré-imagem de B: os pontos do domínio cuja imagem cai em B',
    tema: 'funcoes',
    distratores: [
      {
        texto: 'a função inversa de f aplicada a B, que só existe se f for bijetora',
        erro: 'confunde-com-caso-trivial',
      },
      { texto: 'a imagem de B por f, ou seja, o que f faz com B', erro: 'imagem-por-dominio' },
      { texto: 'o conjunto dos f(x) com x em B', erro: 'imagem-por-dominio' },
      { texto: 'o conjunto dos 1/f(x) com x em B', erro: 'simbolo-lido-como-igualdade' },
    ],
  },
  {
    id: 'composicao',
    notacao: '(f ∘ g)(x)',
    leitura: 'aplica g primeiro e f depois: é f(g(x))',
    tema: 'funcoes',
    distratores: [
      { texto: 'aplica f primeiro e g depois: é g(f(x))', erro: 'ordem-dos-operandos' },
      { texto: 'o produto f(x)·g(x)', erro: 'simbolo-lido-como-igualdade' },
      { texto: 'a inversa de f aplicada a g', erro: 'confunde-com-caso-trivial' },
    ],
  },
  {
    id: 'injetora',
    notacao: 'f(a) = f(b) ⟹ a = b',
    leitura: 'f é injetora: imagens iguais só podem vir de pontos iguais',
    tema: 'funcoes',
    distratores: [
      {
        texto: 'f é sobrejetora: todo elemento do contradomínio é atingido',
        erro: 'imagem-por-dominio',
      },
      { texto: 'a = b implica f(a) = f(b), o que vale em qualquer função', erro: 'reciproca' },
      { texto: 'f é constante: assume um único valor', erro: 'confunde-com-caso-trivial' },
    ],
  },
  {
    id: 'sobrejetora',
    notacao: '∀y∈Y ∃x∈X : f(x) = y',
    leitura: 'f é sobrejetora: a imagem de f é todo o Y',
    tema: 'funcoes',
    distratores: [
      { texto: 'f é injetora: pontos diferentes têm imagens diferentes', erro: 'imagem-por-dominio' },
      { texto: 'existe um x que serve para todo y', erro: 'ordem-dos-quantificadores' },
      {
        texto: 'todo x de X tem imagem em Y, o que vale em qualquer função',
        erro: 'confunde-com-caso-trivial',
      },
    ],
  },

  // --- implicação -----------------------------------------------------------
  {
    id: 'implicacao',
    notacao: 'P ⟹ Q',
    leitura: 'sempre que P for verdadeira, Q também é — se P for falsa, nada se afirma',
    tema: 'implicacao',
    distratores: [
      { texto: 'sempre que Q for verdadeira, P também é', erro: 'reciproca' },
      { texto: 'se P for falsa, então Q é falsa', erro: 'inversa' },
      { texto: 'P e Q são verdadeiras juntas e falsas juntas', erro: 'operacao-trocada' },
      { texto: 'P é verdadeira, e Q também — as duas afirmadas', erro: 'confunde-com-caso-trivial' },
    ],
  },
  {
    id: 'contrapositiva',
    notacao: '¬Q ⟹ ¬P',
    leitura: 'a contrapositiva de P ⟹ Q: afirma exatamente a mesma coisa que ela',
    tema: 'implicacao',
    distratores: [
      { texto: 'a recíproca de P ⟹ Q, que não equivale a ela', erro: 'reciproca' },
      { texto: 'a inversa de P ⟹ Q, que não equivale a ela', erro: 'inversa' },
      { texto: 'a negação de P ⟹ Q, que a contradiz', erro: 'negacao-mal-feita' },
      { texto: 'que P e Q são ambas falsas, sem implicação nenhuma', erro: 'confunde-com-caso-trivial' },
    ],
  },

  // --- limites --------------------------------------------------------------
  {
    id: 'limite-epsilon-delta',
    notacao: '∀ε>0 ∃δ>0 : |x−a|<δ ⟹ |f(x)−L|<ε',
    leitura: 'por menor que seja ε, existe um δ que força f(x) a ficar a menos de ε de L',
    tema: 'limites',
    distratores: [
      {
        texto: 'existe um δ que serve para todo ε, seja ele qual for',
        erro: 'ordem-dos-quantificadores',
      },
      {
        texto: 'se f(x) está a menos de ε de L, então x está a menos de δ de a',
        erro: 'reciproca',
      },
      { texto: 'f está definida em a e vale exatamente L ali', erro: 'confunde-com-caso-trivial' },
      { texto: 'existe um x a menos de δ de a com f(x) perto de L', erro: 'quantificador-trocado' },
    ],
  },
  {
    id: 'convergencia',
    notacao: '∀ε>0 ∃N ∀n>N : |xₙ − L| < ε',
    leitura: 'a sequência converge para L',
    tema: 'limites',
    distratores: [
      { texto: 'existe um N que serve para todo ε de uma vez', erro: 'ordem-dos-quantificadores' },
      { texto: 'algum termo depois de N fica a menos de ε de L', erro: 'quantificador-trocado' },
      { texto: 'a sequência é limitada', erro: 'confunde-com-caso-trivial' },
    ],
  },
  {
    id: 'continuidade-uniforme',
    notacao: '∀ε>0 ∃δ>0 ∀x,y : |x−y|<δ ⟹ |f(x)−f(y)|<ε',
    leitura: 'f é uniformemente contínua: o mesmo δ serve em todos os pontos',
    tema: 'limites',
    distratores: [
      {
        texto: 'f é contínua, com um δ escolhido a cada ponto',
        erro: 'ordem-dos-quantificadores',
      },
      { texto: 'f é lipschitziana: |f(x)−f(y)| ≤ K|x−y|', erro: 'confunde-com-caso-trivial' },
      { texto: 'f é contínua em pelo menos um ponto', erro: 'quantificador-trocado' },
    ],
  },
  {
    id: 'limsup',
    notacao: 'lim sup xₙ',
    leitura: 'o limite dos supremos das caudas: o maior valor de aderência da sequência',
    tema: 'limites',
    distratores: [
      { texto: 'o supremo do conjunto de todos os termos', erro: 'operacao-trocada' },
      { texto: 'o limite da sequência, que sempre existe', erro: 'confunde-com-caso-trivial' },
      { texto: 'o menor valor de aderência da sequência', erro: 'operacao-trocada' },
      { texto: 'o maior termo da sequência, quando ele existe', erro: 'operacao-trocada' },
    ],
  },
  {
    id: 'supremo',
    notacao: 'sup A',
    leitura: 'a menor das cotas superiores de A — que pode não pertencer a A',
    tema: 'limites',
    distratores: [
      { texto: 'o maior elemento de A, que sempre existe', erro: 'confunde-com-caso-trivial' },
      { texto: 'qualquer número maior que todos os elementos de A', erro: 'quantificador-trocado' },
      { texto: 'a maior das cotas superiores de A', erro: 'operacao-trocada' },
    ],
  },

  // --- aritmética, álgebra e probabilidade ----------------------------------
  {
    id: 'congruencia-modular',
    notacao: 'a ≡ b (mod n)',
    leitura: 'a e b deixam o mesmo resto na divisão por n — ou seja, n divide a − b',
    tema: 'aritmetica',
    distratores: [
      { texto: 'a dividido por n deixa resto b', erro: 'simbolo-lido-como-igualdade' },
      { texto: 'a diferença a − b é igual a n, exatamente', erro: 'simbolo-lido-como-igualdade' },
      { texto: 'n divide a e também divide b', erro: 'operacao-trocada' },
      { texto: 'a e b são iguais, e n é o módulo dos dois', erro: 'confunde-com-caso-trivial' },
    ],
  },
  {
    id: 'divide',
    notacao: 'n ∣ m',
    leitura: 'n divide m: m é múltiplo de n',
    tema: 'aritmetica',
    distratores: [
      { texto: 'm divide n: n é múltiplo de m', erro: 'ordem-dos-operandos' },
      { texto: 'o quociente de n por m', erro: 'simbolo-lido-como-igualdade' },
      { texto: 'n e m são primos entre si', erro: 'operacao-trocada' },
    ],
  },
  {
    id: 'ortogonais',
    notacao: '⟨u, v⟩ = 0',
    leitura: 'u e v são ortogonais',
    tema: 'algebra',
    distratores: [
      { texto: 'u ou v é o vetor nulo', erro: 'confunde-com-caso-trivial' },
      { texto: 'u e v são paralelos', erro: 'operacao-trocada' },
      { texto: 'u e v são o mesmo vetor', erro: 'simbolo-lido-como-igualdade' },
    ],
  },
  {
    id: 'condicional',
    notacao: 'P(A ∣ B)',
    leitura: 'a probabilidade de A, dado que B ocorreu',
    tema: 'probabilidade',
    distratores: [
      { texto: 'a probabilidade de B, dado que A ocorreu', erro: 'ordem-dos-operandos' },
      { texto: 'a probabilidade de A e B ocorrerem juntos', erro: 'operacao-trocada' },
      { texto: 'a probabilidade de A ou de B', erro: 'operacao-trocada' },
      { texto: 'a probabilidade de A, já que B não interfere nela', erro: 'confunde-com-caso-trivial' },
    ],
  },
]
