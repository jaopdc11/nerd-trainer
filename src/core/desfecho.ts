/**
 * Como a partida terminou em relação ao recorde.
 *
 * O jeito óbvio — comparar a pontuação com o recorde na hora de desenhar a tela
 * de fim — está errado por dois motivos, e os dois já apareceram em tela:
 *
 * 1. **O recorde já é o desta partida.** Quando o fim chega, a run foi gravada
 *    e `recorde` vale o que você acabou de fazer. Fechar 59 casas batendo um
 *    recorde de 58 exibia "Empatou o recorde", porque a tela comparava 59 com
 *    59. O mesmo bug, mais cedo, dizia "faltaram 1 para o seu recorde de 21"
 *    logo abaixo de um 21.
 * 2. **Empate de pontos não é empate.** A regra de recorde do projeto desempata
 *    por tempo, então 59 casas em 1:12 supera 59 casas em 2:00. Uma comparação
 *    refeita aqui não tem como saber disso.
 *
 * Por isso quem decide é `registrar`, em `storage.ts`, que é a única função que
 * conhece a regra inteira — inclusive a idempotência das partidas salvas pela
 * metade. Esta aqui só traduz o veredito dela para o que a tela mostra.
 */
export type Desfecho = 'superou' | 'empatou' | 'aquem'

/** O que a gravação da partida devolveu, junto do recorde que havia *antes*. */
export interface ResultadoDaRun {
  /** Identifica a partida: a mesma run é gravada mais de uma vez. */
  readonly runId: string
  readonly recordeAnterior: number | null
  /** Veredito da `registrar`: contou como recorde novo. */
  readonly superou: boolean
}

/**
 * `run` é `null` só até a primeira partida ser gravada; aí `recordeAtual` serve
 * de reserva e a comparação volta a ser a ingênua, que nesse instante ainda não
 * tem como estar contaminada.
 */
export function desfecho(
  pontuacao: number,
  run: ResultadoDaRun | null,
  recordeAtual: number | null,
): Desfecho {
  const marca = (run ? run.recordeAnterior : recordeAtual) ?? 0
  const superou = run ? run.superou : pontuacao > marca

  if (superou) return 'superou'
  // Zero nunca é recorde: sem isto, a primeira partida sem nenhum acerto
  // anunciava "Recorde novo", já que o recorde anterior era `null`.
  if (pontuacao === marca && pontuacao > 0) return 'empatou'
  return 'aquem'
}

/**
 * Quantos pontos faltaram para *alcançar* o recorde, ou `null` quando não há
 * distância a mostrar.
 *
 * Alcançar, não superar: a versão anterior somava 1 ("o que falta para bater"),
 * e era esse +1 que produzia o "faltaram 1" em cima de um empate.
 */
export function faltaParaRecorde(
  pontuacao: number,
  run: ResultadoDaRun | null,
  recordeAtual: number | null,
): number | null {
  const marca = run ? run.recordeAnterior : recordeAtual
  if (marca === null || marca <= 0) return null
  const falta = marca - pontuacao
  return falta > 0 ? falta : null
}

/** O recorde que a tela deve citar: o de antes, não o que esta partida criou. */
export const marcaAnterior = (run: ResultadoDaRun | null, recordeAtual: number | null) =>
  run ? run.recordeAnterior : recordeAtual
