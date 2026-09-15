/**
 * Contrato da validação de respostas.
 *
 * Princípio que organiza o módulo inteiro: **não existe normalizador universal
 * de resposta em pt-BR**. "1.024" é mil e vinte e quatro num inteiro e é 1,024
 * numa constante física; a caixa de "Co" é decorativa num nome e é a informação
 * inteira num símbolo químico. Por isso `EspecResposta` é uma união discriminada
 * em que cada tipo carrega os próprios parâmetros de comparação, e o validador
 * sempre recebe o tipo esperado junto com a entrada.
 */

export interface OpcoesTexto {
  /** Remove artigos e preposições soltas ("a segunda lei de Newton"). */
  readonly ignorarArtigos?: boolean
  /** Aceita erro de digitação de 1 caractere. Ver `tolerarTypo` em `EspecResposta`. */
  readonly tolerarTypo?: boolean
}

/** O que o item espera. O `tipo` decide o pipeline inteiro de normalização. */
export type EspecResposta =
  /** Nome de elemento, de letra grega, de fórmula. Indiferente a acento e caixa. */
  | {
      readonly tipo: 'texto'
      readonly canonica: string
      readonly aceitas: readonly string[]
      readonly opcoes?: OpcoesTexto
    }
  /** Símbolo químico, prefixo SI, letra grega. Caixa É a informação. */
  | {
      readonly tipo: 'simbolo'
      readonly canonica: string
      readonly aceitas?: readonly string[]
    }
  /** Constante física e afins: comparação por algarismos significativos. */
  | {
      readonly tipo: 'numero'
      /** Dígitos significativos em ordem, sem vírgula: "299792458". */
      readonly mantissa: string
      readonly expoente: number
      readonly negativo?: boolean
      /** Mínimo de algarismos para contar como acerto. Abaixo disso, 'quase'. */
      readonly sigMin: number
    }
  /** Fibonacci, potências de 2, primos: qualquer separador é agrupamento. */
  | { readonly tipo: 'inteiroGrande'; readonly valor: string }
  /** Um caractere das sequências decimais (pi, e, phi, raiz de 2). */
  | { readonly tipo: 'digito'; readonly valor: string }
  /** Alternativa de múltipla escolha. */
  | { readonly tipo: 'escolha'; readonly indiceCorreto: number }

export type Veredito = 'certo' | 'quase' | 'errado'

export type Motivo =
  | 'vazio'
  | 'exato'
  | 'sinonimo'
  | 'typo'
  | 'caixa-errada'
  | 'precisao-insuficiente'
  | 'expoente-errado'
  | 'nao-numerico'
  | 'diferente'

export interface Resultado {
  readonly veredito: Veredito
  readonly motivo: Motivo
  /** Algarismos significativos corretos (tipo 'numero') — vira pontuação. */
  readonly digitosCorretos?: number
  /** Mensagem curta em pt-BR, pronta para a UI. */
  readonly explicacao?: string
}

/** Rigor da sessão. Morte súbita e qualquer modo valendo recorde usam 'estrito'. */
export type Rigor = 'estrito' | 'indulgente'

export interface Contexto {
  readonly rigor: Rigor
  /**
   * Formas aceitas (já normalizadas) dos OUTROS itens do mesmo baralho.
   *
   * Sem isso, a tolerância a erro de digitação aceitaria "Cobalto" onde a
   * resposta era "Cobre" — ou seja, daria a resposta de outro item como certa.
   * Ambiguidade nunca é resolvida a favor do jogador.
   */
  readonly vizinhanca?: ReadonlySet<string>
}
