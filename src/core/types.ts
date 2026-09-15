import type { EspecResposta } from './answer/types'
import type { Rng } from './rng'

/**
 * Tudo que atravessa a fronteira jogo ↔ núcleo mora aqui, para que nenhum jogo
 * precise importar de dentro de outro e para não haver ciclo entre registry,
 * storage e engines.
 */

export const CATEGORIAS = ['matematica', 'fisica', 'quimica'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  matematica: 'Matemática',
  fisica: 'Física',
  quimica: 'Química',
}

export type Mecanica = 'sequencia' | 'grade' | 'flashcard' | 'gerador'

/** Teclado a pedir ao sistema. Ver `AnswerInput` para por que isso importa. */
export type Teclado = 'numerico' | 'texto'

/** Como o placar é falado na UI: "347 casas", "31 acertos". */
export interface Unidade {
  readonly singular: string
  readonly plural: string
}

interface JogoBase {
  /** kebab-case. É o slug da rota E a chave do storage: nunca mude depois de publicado. */
  readonly id: string
  readonly nome: string
  readonly resumo: string
  readonly categoria: Categoria
  /** Emoji ou símbolo do card. */
  readonly icone: string
  readonly unidade: Unidade
  readonly comoJogar: readonly string[]
}

/**
 * Um jogo declarado ao registry.
 *
 * `config` é função e não objeto porque alguns jogos montam o baralho ou a lista
 * de células na hora, e fazer isso no topo do módulo custaria na carga do menu —
 * o registry importa todos os jogos.
 */
export type JogoModule =
  | (JogoBase & { readonly mecanica: 'sequencia'; config(): ConfigSequencia })
  | (JogoBase & { readonly mecanica: 'grade'; config(): ConfigGrade })
  | (JogoBase & { readonly mecanica: 'flashcard'; config(): ConfigFlashcard })
  | (JogoBase & { readonly mecanica: 'gerador'; config(): ConfigGerador })

export type JogoSequencia = Extract<JogoModule, { mecanica: 'sequencia' }>
export type JogoGrade = Extract<JogoModule, { mecanica: 'grade' }>
export type JogoFlashcard = Extract<JogoModule, { mecanica: 'flashcard' }>
export type JogoGerador = Extract<JogoModule, { mecanica: 'gerador' }>

/**
 * Fatos crus de uma partida, iguais para as quatro mecânicas.
 *
 * Uma única regra de recorde serve para todas: maior `pontuacao` vence, empate
 * desempata por menor `duracaoMs`. Isso cobre sequência (mais dígitos), gerador
 * (mais acertos) e grade (118 elementos empatados → ganha o mais rápido) sem
 * nenhum caso especial.
 */
export interface ResultadoRun {
  readonly jogoId: string
  readonly modoId?: string
  readonly pontuacao: number
  /** Total possível, quando finito. Ausente = sequência sem fim. */
  readonly total?: number
  readonly duracaoMs: number
  readonly erros: number
  readonly completou: boolean
  /** Gerado uma vez por partida: torna a gravação idempotente. */
  readonly runId: string
}

// ---------------------------------------------------------------------------
// Mecânica A — sequência infinita, morte súbita
// ---------------------------------------------------------------------------

export interface ConfigSequencia {
  /** Sequência pronta, item a item. Exclusivo com `itemEm`. */
  readonly itens?: readonly string[]
  /** Geração preguiçosa e memoizada. `null` marca o fim. Exclusivo com `itens`. */
  readonly itemEm?: (indice: number) => string | null
  /** Quantidade total, quando conhecida. */
  readonly total?: number

  /**
   * 'caractere': cada tecla é um item e é julgada na hora — é o que dá o ritmo
   * de metralhadora que as casas de pi pedem.
   * 'termo': acumula até Enter. Obrigatório para inteiros, porque "13" é
   * prefixo de "137" e julgar na tecla aceitaria cedo demais.
   */
  readonly entrada: 'caractere' | 'termo'
  readonly teclado: Teclado

  /** Mostrado antes do primeiro item digitável, e não faz parte da resposta. */
  readonly prefixo?: string
  /** Separador entre itens na fita. "" para dígitos, ", " para inteiros. */
  readonly separador?: string
  /** Respiro visual a cada N itens na fita. */
  readonly agrupar?: number
  /** Quantos itens mostrar na revisão pós-morte. */
  readonly revisaoPosMorte?: number
}

// ---------------------------------------------------------------------------
// Mecânica B — grade preenchida em ordem livre
// ---------------------------------------------------------------------------

export interface CelulaGrade {
  readonly id: string
  /** 1-based, como em CSS grid. */
  readonly linha: number
  readonly coluna: number
  /** Pista sempre visível na célula, como o número atômico. */
  readonly rotulo?: string
  readonly resposta: EspecResposta
  /** O que aparece no gabarito, no fim. */
  readonly gabarito: string
  /** Texto longo do tooltip: só é exibido quando a célula já foi revelada. */
  readonly detalhe?: string
  /** Classe de cor: bloco s/p/d/f, categoria, etc. */
  readonly grupo?: string
}

export interface ConfigGrade {
  readonly linhas: number
  readonly colunas: number
  readonly celulas: readonly CelulaGrade[]
  readonly teclado: Teclado
  /**
   * 'livre': digita qualquer resposta e ela cai na célula certa.
   * 'sorteada': o motor destaca uma célula vazia por vez.
   */
  readonly ordem: 'livre' | 'sorteada'
  readonly mostrarRotulos?: boolean
}

// ---------------------------------------------------------------------------
// Mecânica C — flashcard sorteado
// ---------------------------------------------------------------------------

/** Conteúdo exibível. Só o componente de fórmula sabe lidar com 'mathml'. */
export type Conteudo =
  | { readonly kind: 'texto'; readonly valor: string }
  | { readonly kind: 'mathml'; readonly valor: string }

export type Carta =
  | {
      readonly tipo: 'digitada'
      readonly id: string
      readonly pergunta: Conteudo
      readonly dica?: string
      readonly resposta: EspecResposta
      readonly gabarito: string
    }
  | {
      readonly tipo: 'escolha'
      readonly id: string
      readonly pergunta: Conteudo
      readonly alternativas: readonly Conteudo[]
      readonly indiceCorreto: number
      readonly gabarito: string
    }

export interface ConfigFlashcard {
  /**
   * Ponto de extensão único da mecânica. Dataset estático devolve a constante;
   * grego sorteia a direção; fórmulas sorteiam os distratores aqui dentro.
   */
  montarBaralho(rng: Rng): readonly Carta[]
  readonly fim: 'morte-subita' | 'baralho'
  readonly teclado: Teclado
}

// ---------------------------------------------------------------------------
// Mecânica D — gerador procedural cronometrado
// ---------------------------------------------------------------------------

interface ExercicioBase {
  /** Chave estável para a anti-repetição: "mult:7x8". Normaliza operandos comutativos. */
  readonly chave: string
  readonly enunciado: Conteudo
  readonly gabarito: string
}

/**
 * Um exercício gerado. Digitado quando a resposta é curta (um número), de
 * escolha quando digitá-la mediria outra coisa — escrever "36x^5" contra o
 * relógio testa teclado, não derivada.
 */
export type Exercicio =
  | (ExercicioBase & {
      readonly tipo: 'digitado'
      readonly resposta: EspecResposta
      readonly teclado?: Teclado
    })
  | (ExercicioBase & {
      readonly tipo: 'escolha'
      readonly alternativas: readonly Conteudo[]
      readonly indiceCorreto: number
    })

export interface ConfigGerador {
  gerar(rng: Rng, nivel: number): Exercicio
  readonly segundosIniciais: number
  readonly bonusPorAcertoS: number
  /** Teto do relógio: sem ele, quem é bom no nível fácil joga para sempre. */
  readonly tetoSegundos: number
  /** Acertos acumulados → nível. O nível acumula, não substitui os anteriores. */
  escala(acertos: number): number
  readonly teclado: Teclado
}
