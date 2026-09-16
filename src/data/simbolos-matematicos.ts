/**
 * Os símbolos que a matemática usa como se todo mundo já os conhecesse.
 *
 * **Por que texto Unicode e não MathML.** O projeto pré-renderiza notação no
 * build (ver `scripts/gen-formulas.mjs`) porque fórmula tem estrutura em duas
 * dimensões: fração, índice, limite embaixo do sigma. Símbolo solto não tem
 * nada disso — `∂` é um caractere, e envolvê-lo num `<math><mi>∂</mi></math>`
 * produziria exatamente o mesmo glifo ao custo de um script gerador, um arquivo
 * gerado e um teste de sincronia. MathML aqui seria cerimônia. Os únicos itens
 * com mais de um caractere — `ℵ₀`, `∃!`, `⌊x⌋`, `⌈x⌉` — continuam sendo texto
 * linear, e o subscrito zero de aleph existe em Unicode (U+2080).
 *
 * **Nenhuma forma aceita termina em preposição solta.** Foi a regra que faltava,
 * e ela custou caro: `⊥` aceitava "perpendicular" e "perpendicular a", e o
 * segundo fazia o primeiro — o nome canônico! — parar de commitar sozinho,
 * porque `completaSemAmbiguidade` segura o commit enquanto alguma forma da carta
 * continua a partir do que foi digitado. A preposição final nunca compra nada:
 * `semArtigos` já a apaga antes de comparar, então quem digita "perpendicular a"
 * é aceito pela forma "perpendicular" do mesmo jeito. Onde a leitura completa
 * ensina alguma coisa, ela virou glosa (ver `∝`), que é onde ela devia estar.
 * Quem acrescentar símbolo aqui quebra `engines/flashcard/autocommit.test.ts`,
 * que varre o registry inteiro atrás disso.
 *
 * **A resposta é o nome, e o nome tem sinônimo de verdade.** `∇` é "nabla" para
 * quem aprendeu o desenho, "del" para quem aprendeu em inglês e "gradiente"
 * para quem aprendeu o que ele faz. As três passam. O que *não* se aceita é
 * inventar: nenhuma forma aceita aqui pode ser também a resposta de outro
 * símbolo do baralho — há teste que cruza todos os pares.
 *
 * **O que ficou de fora, e por quê.**
 * - `≤` e `≥`: são a primeira coisa que qualquer um aprende, não medem
 *   repertório nenhum, e seus nomes ("menor ou igual" × "maior ou igual") ficam
 *   a um caractere de distância um do outro.
 * - `→` sozinho: é o símbolo mais sobrecarregado da matemática — implicação em
 *   lógica, contradomínio em `f: X → Y`, tendência em `xₙ → L`. Pedir "o nome"
 *   dele é pedir uma resposta que depende do contexto que a carta não mostra.
 *   Por isso a implicação entra como `⟹` e a bicondicional como `⟺`, que só
 *   têm uma leitura. Ler `→` em contexto é o assunto do outro jogo, o de
 *   linguagem matemática.
 */

export type AreaSimbolo = 'conjuntos' | 'logica' | 'analise' | 'relacoes'

/** Vira a dica do campo de resposta: diz que tipo de nome se espera, não qual. */
export const ROTULO_AREA_SIMBOLO: Record<AreaSimbolo, string> = {
  conjuntos: 'conjuntos',
  logica: 'lógica',
  analise: 'análise',
  relacoes: 'relações',
}

export interface SimboloMatematico {
  readonly id: string
  /** O que aparece na carta. Texto Unicode, nunca imagem nem MathML. */
  readonly glifo: string
  /** Forma canônica, em minúsculas: é ela que aparece no "era ...". */
  readonly nome: string
  readonly sinonimos: readonly string[]
  readonly area: AreaSimbolo
  /**
   * Uma linha a mais no gabarito, só onde o nome sozinho não ensina nada.
   *
   * Saber que `⊨` se chama "satisfaz" sem saber que ele é o irmão semântico do
   * `⊢` é decorar som. É o mesmo raciocínio do `porque` do gerador de exercício:
   * quem errou precisa ver por quê, senão erra igual da próxima vez.
   */
  readonly glosa?: string
}

export const SIMBOLOS_MATEMATICOS: readonly SimboloMatematico[] = [
  // --- conjuntos ------------------------------------------------------------
  {
    id: 'vazio',
    glifo: '∅',
    nome: 'conjunto vazio',
    sinonimos: ['vazio', 'conjunto nulo'],
    area: 'conjuntos',
    glosa: 'está contido em todo conjunto, e não é o mesmo que {∅}',
  },
  {
    id: 'pertence',
    glifo: '∈',
    nome: 'pertence',
    // Saíram "pertence a" e "elemento de", e **quem digita as duas continua
    // sendo aceito**: `semArtigos` come a preposição final antes de comparar, e
    // o que sobra é "pertence" e "elemento", que as formas restantes já casam.
    // Elas só serviam para registrar as chaves "pertencea" e "elementode" — e
    // chave que ninguém digita, dentro da própria carta, é exatamente o que
    // mata o auto-commit (ver `autocommit.test.ts` do flashcard). Descartada a
    // alternativa de mexer em `completaSemAmbiguidade`: ali o prefixo defende a
    // carta seguinte de receber o resto da digitação.
    sinonimos: ['é elemento de', 'pertinência'],
    area: 'conjuntos',
  },
  {
    id: 'nao-pertence',
    glifo: '∉',
    nome: 'não pertence',
    // Mesma faxina do ∈: "não pertence a" era o canônico mais uma preposição
    // que a normalização já descarta.
    sinonimos: ['não é elemento de'],
    area: 'conjuntos',
  },
  {
    id: 'contido',
    glifo: '⊂',
    nome: 'está contido',
    // "subconjunto de" saiu: a preposição final some na normalização, então ela
    // era a mesma resposta que "subconjunto" com uma chave a mais para travar o
    // auto-commit. "contido em" fica, porque "em" *não* está na lista de
    // partículas soltas e a forma é, de fato, uma leitura própria.
    sinonimos: ['contido', 'contido em', 'subconjunto', 'inclusão'],
    area: 'conjuntos',
    // A ambiguidade é da literatura, não do dataset: parte dos autores reserva
    // ⊂ para subconjunto próprio e escreve ⊆ no caso geral, parte usa ⊂ para
    // inclusão qualquer. Por isso a carta cobra "está contido" e nunca exige
    // que o jogador adivinhe qual convenção o autor da carta adotou.
    glosa: 'inclusão; há autores que reservam ⊂ ao subconjunto próprio',
  },
  {
    id: 'contido-ou-igual',
    glifo: '⊆',
    nome: 'está contido ou é igual',
    sinonimos: ['contido ou igual', 'subconjunto ou igual', 'inclusão não estrita'],
    area: 'conjuntos',
  },
  {
    id: 'uniao',
    glifo: '∪',
    nome: 'união',
    sinonimos: ['reunião', 'união de conjuntos'],
    area: 'conjuntos',
  },
  {
    id: 'intersecao',
    glifo: '∩',
    nome: 'interseção',
    sinonimos: ['intersecção', 'interseção de conjuntos'],
    area: 'conjuntos',
  },
  {
    id: 'reais',
    glifo: 'ℝ',
    nome: 'reais',
    sinonimos: ['conjunto dos reais', 'números reais', 'conjunto dos números reais'],
    area: 'conjuntos',
  },
  /*
   * As quatro cartas abaixo ganharam "conjunto dos números X", que só ℝ tinha.
   * Não é enfeite: a forma longa é a que a escola fala por extenso, e ela não
   * chegava perto de nenhuma das curtas. "conjunto dos números racionais" dista
   * 7 caracteres de "conjunto dos racionais", e o perdão de digitação para em 3
   * — ou seja, quem respondia certo por extenso em ℚ perdia o ponto que ganhava
   * em ℝ, dependendo só de qual letra tinha caído.
   */
  {
    id: 'racionais',
    glifo: 'ℚ',
    nome: 'racionais',
    sinonimos: ['conjunto dos racionais', 'números racionais', 'conjunto dos números racionais'],
    area: 'conjuntos',
    glosa: 'Q de quociente',
  },
  {
    id: 'inteiros',
    glifo: 'ℤ',
    nome: 'inteiros',
    sinonimos: ['conjunto dos inteiros', 'números inteiros', 'conjunto dos números inteiros'],
    area: 'conjuntos',
    glosa: 'Z de Zahlen, "número" em alemão',
  },
  {
    id: 'naturais',
    glifo: 'ℕ',
    nome: 'naturais',
    sinonimos: ['conjunto dos naturais', 'números naturais', 'conjunto dos números naturais'],
    area: 'conjuntos',
  },
  {
    id: 'complexos',
    glifo: 'ℂ',
    nome: 'complexos',
    sinonimos: ['conjunto dos complexos', 'números complexos', 'conjunto dos números complexos'],
    area: 'conjuntos',
  },
  {
    id: 'aleph-zero',
    glifo: 'ℵ₀',
    nome: 'aleph zero',
    sinonimos: ['alef zero', 'aleph nulo', 'álefe zero', 'cardinal dos naturais'],
    area: 'conjuntos',
    glosa: 'a cardinalidade de ℕ: o menor infinito que existe',
  },

  // --- lógica ---------------------------------------------------------------
  {
    id: 'para-todo',
    glifo: '∀',
    nome: 'para todo',
    sinonimos: ['quantificador universal', 'qualquer que seja', 'para qualquer', 'para cada'],
    area: 'logica',
  },
  {
    id: 'existe',
    glifo: '∃',
    nome: 'existe',
    sinonimos: ['quantificador existencial', 'existe pelo menos um'],
    area: 'logica',
  },
  {
    id: 'nao-existe',
    glifo: '∄',
    nome: 'não existe',
    sinonimos: ['não existe nenhum'],
    area: 'logica',
  },
  {
    id: 'existe-unico',
    glifo: '∃!',
    nome: 'existe um único',
    sinonimos: ['existe e é único', 'existe exatamente um', 'unicidade'],
    area: 'logica',
  },
  {
    id: 'conjuncao',
    glifo: '∧',
    nome: 'conjunção',
    // "e" sozinho não entra: a normalização em pt-BR trata "e" como conectivo
    // solto e o apaga, e uma forma aceita vazia casaria com qualquer coisa.
    sinonimos: ['e lógico', 'conjunção lógica'],
    area: 'logica',
  },
  {
    id: 'disjuncao',
    glifo: '∨',
    nome: 'disjunção',
    sinonimos: ['ou lógico', 'ou inclusivo', 'disjunção lógica'],
    area: 'logica',
  },
  {
    id: 'negacao',
    glifo: '¬',
    nome: 'negação',
    sinonimos: ['não', 'negação lógica'],
    area: 'logica',
  },
  {
    id: 'implica',
    glifo: '⟹',
    nome: 'implica',
    sinonimos: ['implicação', 'se então', 'condicional', 'acarreta'],
    area: 'logica',
  },
  {
    id: 'sse',
    glifo: '⟺',
    nome: 'se e somente se',
    sinonimos: ['sse', 'bicondicional', 'equivalência', 'se e só se'],
    area: 'logica',
  },
  {
    id: 'deduz',
    glifo: '⊢',
    nome: 'deduz',
    sinonimos: ['demonstra', 'derivável', 'asserção', 'prova sintática', 'trave', 'turnstile'],
    area: 'logica',
    glosa: 'Γ ⊢ φ: existe demonstração de φ a partir de Γ — é sintaxe',
  },
  {
    id: 'satisfaz',
    glifo: '⊨',
    nome: 'satisfaz',
    sinonimos: ['modela', 'consequência semântica', 'implicação semântica', 'duplo trave'],
    area: 'logica',
    glosa: 'Γ ⊨ φ: φ vale em todo modelo de Γ — é semântica, não demonstração',
  },
  {
    id: 'portanto',
    glifo: '∴',
    nome: 'portanto',
    sinonimos: ['logo', 'por conseguinte', 'consequentemente'],
    area: 'logica',
  },
  {
    id: 'pois',
    glifo: '∵',
    nome: 'pois',
    sinonimos: ['porque', 'já que', 'uma vez que', 'visto que'],
    area: 'logica',
  },
  {
    id: 'fim-da-demonstracao',
    glifo: '∎',
    nome: 'fim da demonstração',
    sinonimos: ['cqd', 'como queríamos demonstrar', 'qed', 'fim da prova', 'lápide'],
    area: 'logica',
    glosa: 'a lápide de Halmos, que aposentou o "c.q.d."',
  },

  // --- análise --------------------------------------------------------------
  {
    id: 'derivada-parcial',
    glifo: '∂',
    nome: 'derivada parcial',
    // "del" sozinho *não* entra, por mais que em inglês se leia assim: ele é
    // forma aceita do ∇, e duas cartas dividindo a mesma palavra é o começo da
    // loteria. "d rondo" é o apelido de sala de aula em pt-BR e fica.
    sinonimos: ['parcial', 'del parcial', 'd rondo'],
    area: 'analise',
    // Faltava glosa justamente na carta em que o nome não ensina: quem responde
    // "derivada parcial" sem saber o que ela congela responde de ouvido.
    glosa: '∂f/∂x: deriva em x segurando as outras variáveis como constantes',
  },
  {
    id: 'nabla',
    glifo: '∇',
    nome: 'nabla',
    sinonimos: ['del', 'gradiente', 'operador nabla'],
    area: 'analise',
    // "gradiente" é aceito porque é como quase todo mundo lê ∇ sozinho, mas o
    // símbolo é o operador: ∇· é divergente e ∇× é rotacional.
    glosa: 'sozinho é o gradiente; com · vira divergente, com × vira rotacional',
  },
  {
    id: 'integral',
    glifo: '∫',
    nome: 'integral',
    sinonimos: ['sinal de integral', 'integral indefinida'],
    area: 'analise',
  },
  {
    id: 'integral-fechada',
    glifo: '∮',
    nome: 'integral de contorno',
    sinonimos: [
      'integral fechada',
      'integral de linha fechada',
      'integral em curva fechada',
      'integral de circuito',
    ],
    area: 'analise',
  },
  {
    id: 'somatorio',
    glifo: '∑',
    nome: 'somatório',
    sinonimos: ['soma', 'sigma'],
    area: 'analise',
  },
  {
    id: 'produtorio',
    glifo: '∏',
    nome: 'produtório',
    sinonimos: ['produto', 'pi'],
    area: 'analise',
  },
  {
    id: 'infinito',
    glifo: '∞',
    nome: 'infinito',
    sinonimos: ['lemniscata'],
    area: 'analise',
  },
  {
    id: 'piso',
    glifo: '⌊x⌋',
    nome: 'piso',
    // "parte inteira" continua aceita porque é como a escola brasileira ensina,
    // mas é a única forma da carta que está *errada* fora dos positivos — daí a
    // glosa, que corrige sem tirar o ponto de quem respondeu o que aprendeu.
    sinonimos: ['chão', 'função piso', 'parte inteira', 'floor'],
    area: 'analise',
    glosa: '⌊−1,5⌋ = −2: parte inteira só é a mesma coisa quando x ≥ 0',
  },
  {
    id: 'teto',
    glifo: '⌈x⌉',
    nome: 'teto',
    sinonimos: ['função teto', 'ceiling'],
    area: 'analise',
  },
  {
    id: 'composicao',
    glifo: '∘',
    nome: 'composição',
    sinonimos: ['composição de funções', 'composta', 'bola'],
    area: 'analise',
    glosa: 'f ∘ g aplica g primeiro',
  },
  {
    id: 'leva-em',
    glifo: '↦',
    nome: 'leva em',
    // "leva a" virou "leva" e "associa a" virou "associa" — perder a preposição
    // final não perde resposta nenhuma (quem digitar a frase inteira normaliza
    // para a mesma chave), e evita registrar "levaa"/"associaa", que só existiam
    // para travar o commit. Apagar as duas formas em vez de encurtá-las era a
    // alternativa óbvia e está errada: aí "leva a" passaria a ser recusado, e
    // 4 caracteres não ganham perdão de digitação nenhum para socorrer.
    sinonimos: ['leva', 'associa', 'mapsto', 'seta de aplicação'],
    area: 'analise',
    glosa: 'a seta da regra: x ↦ x². A do tipo, f: X → Y, é outra',
  },

  // --- relações -------------------------------------------------------------
  {
    id: 'proporcional',
    glifo: '∝',
    // O canônico era "proporcional a", e essa preposição sozinha derrubava o
    // auto-commit da carta inteira **mesmo sem sinônimo nenhum**: a forma
    // registra as duas leituras, "proporcional" e "proporcionala", e a segunda
    // trava a primeira. O nome agora é a palavra, e a leitura completa está na
    // glosa, que é onde ela ensina — o gabarito "proporcional a" sozinho não
    // dizia a quê.
    nome: 'proporcional',
    // "proporcionalidade" saiu no mesmo movimento: é o nome do *conceito*, não
    // a leitura do símbolo (este baralho cobra como se lê o glifo, ver o
    // cabeçalho), e de quebra era mais um prefixo travando "proporcional".
    // "diretamente proporcional" entra no lugar porque é o que se fala em
    // física quando se escreve F ∝ a, e não começa por "proporcional".
    sinonimos: ['diretamente proporcional'],
    area: 'relacoes',
    glosa: 'y ∝ x quer dizer y = kx para algum k constante',
  },
  {
    id: 'aproximado',
    glifo: '≈',
    nome: 'aproximadamente igual',
    sinonimos: ['aproximadamente', 'aproximado', 'quase igual'],
    area: 'relacoes',
  },
  {
    id: 'congruente',
    glifo: '≅',
    nome: 'congruente',
    // "congruente a" era o canônico com a preposição que a normalização já come.
    sinonimos: ['congruência', 'isomorfo'],
    area: 'relacoes',
    glosa: 'em geometria, congruente; em álgebra, isomorfo',
  },
  {
    id: 'identico',
    glifo: '≡',
    nome: 'idêntico',
    // "equivalente" ficou de fora de propósito: é a leitura de ⟺, e deixar as
    // duas cartas compartilharem vocabulário é o começo da loteria.
    sinonimos: ['identicamente igual', 'congruente módulo n', 'definido como'],
    area: 'relacoes',
    glosa: 'em teoria dos números lê-se "congruente módulo n"',
  },
  {
    id: 'diferente',
    glifo: '≠',
    nome: 'diferente',
    // Idem: "diferente de" é o canônico mais "de". "não é igual a" fica, apesar
    // de também terminar em partícula, porque o artigo do meio muda a chave — a
    // leitura sem partículas é "nao igual", que não é prefixo de "naoeiguala".
    sinonimos: ['não igual', 'não é igual a', 'desigual'],
    area: 'relacoes',
  },
  {
    id: 'muito-menor',
    glifo: '≪',
    nome: 'muito menor',
    // "desprezível perto de" saiu inteira, e não só a preposição: era descrição
    // do efeito, não nome do símbolo — ninguém digita isso contra o relógio —, e
    // terminada em "de" ela ainda sabotava o próprio auto-commit. Encurtar para
    // "desprezível perto" consertaria a trava e deixaria no lugar uma frase
    // manca.
    sinonimos: ['muito menor que'],
    area: 'relacoes',
  },
  {
    id: 'muito-maior',
    glifo: '≫',
    nome: 'muito maior',
    sinonimos: ['muito maior que'],
    area: 'relacoes',
  },
  {
    id: 'mais-ou-menos',
    glifo: '±',
    nome: 'mais ou menos',
    sinonimos: ['mais menos', 'sinal de mais ou menos'],
    area: 'relacoes',
  },
  {
    id: 'perpendicular',
    glifo: '⊥',
    nome: 'perpendicular',
    // A carta que denunciou o defeito: "perpendicular" é o nome canônico e
    // mesmo assim exigia Enter, porque "perpendicular a" continuava a partir
    // dele e `completaSemAmbiguidade` ficava esperando a continuação. As duas
    // formas com preposição saíram e **nada deixou de ser aceito**: `semArtigos`
    // transforma "perpendicular a" em "perpendicular" antes de comparar.
    sinonimos: ['ortogonal'],
    area: 'relacoes',
    glosa: 'em lógica o mesmo símbolo é o absurdo: a proposição sempre falsa',
  },
  {
    id: 'soma-direta',
    glifo: '⊕',
    nome: 'soma direta',
    sinonimos: ['ou exclusivo', 'xor', 'adição módulo 2'],
    area: 'relacoes',
    // ⊕ é o caso em que a carta parecia injusta: a dica diz "relações" e o
    // glifo tem duas vidas legítimas — álgebra e lógica —, então as duas
    // respostas pontuam e a glosa conta o porquê em vez de deixar o jogador
    // achando que chutou.
    glosa: 'em álgebra é soma direta; em lógica e computação, o ou exclusivo',
  },
  {
    id: 'produto-tensorial',
    glifo: '⊗',
    nome: 'produto tensorial',
    // "produto tensor" fica, e foi medido antes de decidir: cheguei a tirá-la
    // por ser prefixo de "produto tensorial", e é justamente o caso em que o
    // prefixo é sinônimo de verdade e não extensão de ruído. Sem ela a forma
    // passa a ser **recusada** — são 3 caracteres de distância e o perdão de um
    // nome de 16 é de 2 —, e trocar um Enter a mais por uma resposta correta
    // perdida é péssimo negócio. O que ela custa é só o auto-commit de quem
    // digita exatamente "produto tensor" e para ali.
    sinonimos: ['tensorial', 'produto de Kronecker', 'produto tensor'],
    area: 'relacoes',
    glosa: 'em física o mesmo círculo marca o vetor entrando na página',
  },
]
