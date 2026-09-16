/**
 * Funções orgânicas.
 *
 * O dado que faz o jogo funcionar não é a função — é a **fórmula estrutural
 * condensada** e a lista de funções que se parecem com a certa.
 *
 * A pergunta é a fórmula, e não o nome do composto, por uma razão só: o nome
 * *já contém a resposta*. "Etanol" termina em -ol, "propanona" em -ona,
 * "etanoato de etila" diz "-ato de -ila"; perguntar a função a partir do nome
 * mede se a pessoa decorou a tabela de sufixos da IUPAC, que é outro assunto e
 * dá para aprender numa tarde. Mostrar só o grupo funcional solto (-COOH, -CHO)
 * é pior ainda: vira uma tabela de doze linhas, decorável no ônibus, e some
 * exatamente a parte difícil — *achar* o grupo no meio da cadeia. Com a fórmula
 * na tela, CH₃-CO-CH₃ e CH₃-CHO passam a exigir olhar onde a carbonila está, que
 * é a habilidade que a prova cobra.
 *
 * `sinal` é a contraparte do `axe` da geometria molecular: quem errou precisa
 * ver *por quê*, e aqui o porquê é sempre uma frase curta sobre a posição do
 * grupo — "carbonila na ponta da cadeia" contra "carbonila entre dois carbonos"
 * é a diferença inteira entre aldeído e cetona.
 *
 * **Nenhum composto tem duas funções.** É regra do dataset, não acaso: uma carta
 * de escolha precisa ter uma resposta certa só, e um aminoácido ou um
 * hidroxiácido tornaria duas alternativas defensáveis ao mesmo tempo. O gabarito
 * do teste confere isso composto a composto, à mão.
 */
export type Funcao =
  | 'hidrocarboneto'
  | 'haleto de alquila'
  | 'álcool'
  | 'fenol'
  | 'éter'
  | 'aldeído'
  | 'cetona'
  | 'ácido carboxílico'
  | 'éster'
  | 'amina'
  | 'amida'
  | 'nitrila'

export const FUNCOES: readonly Funcao[] = [
  'hidrocarboneto',
  'haleto de alquila',
  'álcool',
  'fenol',
  'éter',
  'aldeído',
  'cetona',
  'ácido carboxílico',
  'éster',
  'amina',
  'amida',
  'nitrila',
]

export interface Composto {
  /** Fórmula estrutural condensada, em Unicode. É a pergunta. */
  readonly formula: string
  readonly nome: string
  /** A resposta. */
  readonly funcao: Funcao
  /** O grupo funcional isolado, como se escreve no quadro. */
  readonly grupo: string
  /** O que na estrutura denuncia a função. Vai para o gabarito. */
  readonly sinal: string
}

/**
 * As funções que de fato se confundem com cada uma — a lista de onde saem os
 * distratores.
 *
 * Ela não é decorativa nem simétrica por acaso: oferecer "nitrila" para o etanol
 * não testa nada, porque ninguém erra assim, e a carta vira uma opção certa com
 * três enfeites. O critério para entrar aqui é um destes três:
 *
 * 1. **isomeria de função** — o par que a química já reconhece como confundível
 *    porque compartilha a fórmula molecular: álcool × éter (C₂H₆O), aldeído ×
 *    cetona (C₃H₆O), ácido carboxílico × éster (C₂H₄O₂). Estes são os melhores
 *    distratores que existem para este jogo, e nenhum deles é invenção minha;
 * 2. **mesmo átomo, posição diferente** — fenol é hidroxila no anel e álcool é
 *    hidroxila em carbono saturado; amida é nitrogênio preso à carbonila e amina
 *    é nitrogênio sem carbonila. Quem só procura "tem OH" ou "tem N" marca o
 *    irmão;
 * 3. **grupo que passa despercebido** — CH₃-CH₂-Cl e CH₃-CH₂-O-CH₃ parecem
 *    hidrocarboneto para quem lê a cadeia e não o heteroátomo; C₆H₅-OH parece
 *    benzeno pelo mesmo motivo.
 *
 * O mapa é simétrico de propósito, e o teste quebra se deixar de ser: "A se
 * confunde com B" e "B se confunde com A" são a mesma afirmação sobre a química,
 * e uma assimetria aqui seria sempre esquecimento, nunca decisão.
 *
 * Toda lista tem no mínimo três entradas, e isso também é testado — é o que
 * garante que os três distratores de qualquer carta saiam *só* das irmãs, sem
 * nunca cair no sorteio geral.
 *
 * Mora no dataset e não junto do baralho, ao contrário das irmãs da geometria
 * molecular: lá a lista sai mecanicamente da contagem de domínios e é detalhe de
 * montagem da carta; aqui ela é um julgamento sobre o que se parece com o quê,
 * isto é, é dado — e dado tem teste.
 */
export const IRMAS: Readonly<Record<Funcao, readonly Funcao[]>> = {
  hidrocarboneto: ['haleto de alquila', 'éter', 'fenol', 'nitrila'],
  'haleto de alquila': ['hidrocarboneto', 'álcool', 'éter'],
  álcool: ['fenol', 'éter', 'ácido carboxílico', 'haleto de alquila', 'amina'],
  fenol: ['álcool', 'éter', 'hidrocarboneto'],
  éter: ['álcool', 'éster', 'fenol', 'hidrocarboneto', 'haleto de alquila'],
  aldeído: ['cetona', 'ácido carboxílico', 'éster'],
  cetona: ['aldeído', 'ácido carboxílico', 'éster'],
  'ácido carboxílico': ['éster', 'aldeído', 'cetona', 'álcool', 'amida'],
  éster: ['ácido carboxílico', 'éter', 'aldeído', 'cetona', 'amida'],
  amina: ['amida', 'nitrila', 'álcool'],
  amida: ['amina', 'éster', 'ácido carboxílico', 'nitrila'],
  nitrila: ['amina', 'amida', 'hidrocarboneto'],
}

/**
 * Três compostos por função, e os três escolhidos para cobrir a mesma função em
 * contextos diferentes: um de cadeia curta, um de cadeia maior ou ramificada e
 * um aromático. Repetir CH₃- em todas as cartas ensinaria a reconhecer o começo
 * da fórmula, não a função.
 *
 * **Não há haleto de arila** (C₆H₅-Cl e companhia). Ele é função à parte, não
 * está na lista de alternativas, e a carta ficaria sem resposta certa —
 * "haleto de alquila" seria aceito por aproximação, que é o tipo de meia-verdade
 * que um jogo de treino não pode ensinar.
 */
export const COMPOSTOS: readonly Composto[] = [
  // Hidrocarbonetos: só carbono e hidrogênio. Incluído o benzeno porque o par
  // benzeno × fenol é metade do jogo do anel aromático.
  { formula: 'CH₃-CH₂-CH₃', nome: 'propano', funcao: 'hidrocarboneto', grupo: '—', sinal: 'só carbono e hidrogênio na fórmula' },
  { formula: 'CH₃-CH=CH₂', nome: 'propeno', funcao: 'hidrocarboneto', grupo: '—', sinal: 'a dupla é insaturação, não grupo funcional' },
  { formula: 'C₆H₆', nome: 'benzeno', funcao: 'hidrocarboneto', grupo: '—', sinal: 'anel aromático sem nada pendurado nele' },

  // Haletos de alquila: halogênio no lugar de um hidrogênio da cadeia.
  { formula: 'CH₃-CH₂-Cl', nome: 'cloroetano', funcao: 'haleto de alquila', grupo: '-X', sinal: 'halogênio no lugar de um hidrogênio' },
  { formula: 'CH₂Cl₂', nome: 'diclorometano', funcao: 'haleto de alquila', grupo: '-X', sinal: 'dois halogênios no mesmo carbono, e nenhum oxigênio' },
  { formula: 'CH₃-CH₂-CH₂-Br', nome: '1-bromopropano', funcao: 'haleto de alquila', grupo: '-X', sinal: 'halogênio na ponta da cadeia' },

  // Álcoois: hidroxila em carbono saturado. Nenhum deles tem o anel colado no
  // OH — se tivesse, seria fenol, e é justamente essa a fronteira.
  { formula: 'CH₃-CH₂-OH', nome: 'etanol', funcao: 'álcool', grupo: '-OH', sinal: 'hidroxila em carbono saturado' },
  { formula: 'CH₃-CH(OH)-CH₃', nome: 'propan-2-ol', funcao: 'álcool', grupo: '-OH', sinal: 'hidroxila no carbono do meio: continua álcool' },
  { formula: 'HO-CH₂-CH₂-OH', nome: 'etano-1,2-diol (etilenoglicol)', funcao: 'álcool', grupo: '-OH', sinal: 'duas hidroxilas, as duas em carbono saturado' },

  // Fenóis: hidroxila ligada DIRETO ao anel. O teste exige o anel encostado no
  // OH na fórmula, porque é literalmente a definição.
  { formula: 'C₆H₅-OH', nome: 'fenol', funcao: 'fenol', grupo: '-OH', sinal: 'hidroxila ligada direto ao anel aromático' },
  { formula: 'CH₃-C₆H₄-OH', nome: '2-metilfenol (o-cresol)', funcao: 'fenol', grupo: '-OH', sinal: 'a metila no anel não muda nada: o OH continua no anel' },
  { formula: 'HO-C₆H₄-OH', nome: 'benzeno-1,4-diol (hidroquinona)', funcao: 'fenol', grupo: '-OH', sinal: 'duas hidroxilas, as duas no anel' },

  // Éteres: oxigênio entre dois carbonos, sem hidrogênio nele.
  { formula: 'CH₃-O-CH₃', nome: 'metoximetano (éter metílico)', funcao: 'éter', grupo: '-O-', sinal: 'oxigênio entre dois carbonos, sem hidrogênio' },
  { formula: 'CH₃-CH₂-O-CH₂-CH₃', nome: 'etoxietano (éter etílico)', funcao: 'éter', grupo: '-O-', sinal: 'o oxigênio no meio da cadeia não é hidroxila' },
  { formula: 'CH₃-O-C₆H₅', nome: 'metoxibenzeno (anisol)', funcao: 'éter', grupo: '-O-', sinal: 'o anel de um lado do oxigênio não faz dele fenol' },

  // Aldeídos: carbonila na ponta, com hidrogênio preso a ela.
  { formula: 'HCHO', nome: 'metanal (formaldeído)', funcao: 'aldeído', grupo: '-CHO', sinal: 'carbonila na ponta, com hidrogênio' },
  { formula: 'CH₃-CHO', nome: 'etanal (acetaldeído)', funcao: 'aldeído', grupo: '-CHO', sinal: 'carbonila na ponta da cadeia' },
  { formula: 'C₆H₅-CHO', nome: 'benzaldeído', funcao: 'aldeído', grupo: '-CHO', sinal: 'carbonila na ponta, com o anel do outro lado' },

  // Cetonas: carbonila entre dois carbonos.
  { formula: 'CH₃-CO-CH₃', nome: 'propanona (acetona)', funcao: 'cetona', grupo: '-CO-', sinal: 'carbonila entre dois carbonos' },
  { formula: 'CH₃-CO-CH₂-CH₃', nome: 'butanona', funcao: 'cetona', grupo: '-CO-', sinal: 'carbonila no interior da cadeia' },
  { formula: 'C₆H₅-CO-CH₃', nome: 'acetofenona', funcao: 'cetona', grupo: '-CO-', sinal: 'carbonila entre o anel e a metila' },

  // Ácidos carboxílicos: carbonila e hidroxila no mesmo carbono.
  { formula: 'HCOOH', nome: 'ácido metanoico (fórmico)', funcao: 'ácido carboxílico', grupo: '-COOH', sinal: 'carboxila: carbonila e hidroxila no mesmo carbono' },
  { formula: 'CH₃-COOH', nome: 'ácido etanoico (acético)', funcao: 'ácido carboxílico', grupo: '-COOH', sinal: 'carboxila na ponta da cadeia' },
  { formula: 'C₆H₅-COOH', nome: 'ácido benzoico', funcao: 'ácido carboxílico', grupo: '-COOH', sinal: 'carboxila presa ao anel' },

  // Ésteres: a carboxila com o hidrogênio trocado por carbono.
  { formula: 'HCOO-CH₃', nome: 'metanoato de metila', funcao: 'éster', grupo: '-COO-', sinal: 'o oxigênio da carboxila leva carbono, não hidrogênio' },
  { formula: 'CH₃-COO-CH₂-CH₃', nome: 'etanoato de etila', funcao: 'éster', grupo: '-COO-', sinal: 'carbono dos dois lados do -COO-' },
  { formula: 'C₆H₅-COO-CH₃', nome: 'benzoato de metila', funcao: 'éster', grupo: '-COO-', sinal: 'o anel está do lado da carbonila, não do oxigênio' },

  // Aminas: nitrogênio sem carbonila ao lado.
  { formula: 'CH₃-NH₂', nome: 'metilamina', funcao: 'amina', grupo: '-NH₂', sinal: 'nitrogênio ligado só a carbono e hidrogênio' },
  { formula: 'CH₃-NH-CH₃', nome: 'dimetilamina', funcao: 'amina', grupo: '-NH-', sinal: 'nitrogênio entre dois carbonos, e nenhuma carbonila' },
  { formula: 'C₆H₅-NH₂', nome: 'fenilamina (anilina)', funcao: 'amina', grupo: '-NH₂', sinal: 'nitrogênio no anel continua amina' },

  // Amidas: nitrogênio preso à carbonila. É a única diferença para a amina.
  { formula: 'HCONH₂', nome: 'metanamida (formamida)', funcao: 'amida', grupo: '-CONH₂', sinal: 'nitrogênio grudado na carbonila' },
  { formula: 'CH₃-CONH₂', nome: 'etanamida (acetamida)', funcao: 'amida', grupo: '-CONH₂', sinal: 'carbonila e nitrogênio no mesmo carbono' },
  { formula: 'CH₃-CO-NH-CH₃', nome: 'N-metiletanamida', funcao: 'amida', grupo: '-CO-NH-', sinal: 'o carbono no nitrogênio não desfaz a amida' },

  // Nitrilas: carbono em tripla com nitrogênio.
  { formula: 'CH₃-C≡N', nome: 'etanonitrila (acetonitrila)', funcao: 'nitrila', grupo: '-C≡N', sinal: 'carbono em tripla com nitrogênio' },
  { formula: 'CH₃-CH₂-C≡N', nome: 'propanonitrila', funcao: 'nitrila', grupo: '-C≡N', sinal: 'a tripla é com nitrogênio, não com carbono' },
  { formula: 'C₆H₅-C≡N', nome: 'benzonitrila', funcao: 'nitrila', grupo: '-C≡N', sinal: 'tripla C≡N na ponta, presa ao anel' },
]
