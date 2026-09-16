/**
 * Mensagens que o jogo mostra quando uma resposta específica sai.
 *
 * Posição política do autor, e não dado de dataset — por isso mora aqui e não em
 * `data/paises.ts`, que é gerado por script e continua sendo a lista da ONU sem
 * edição. A resposta pontua normalmente: o jogo não finge que o país não existe,
 * ele diz o que tem a dizer e segue.
 *
 * Módulo próprio, e não uma constante dentro do jogo de países, porque três
 * baralhos diferentes perguntam sobre os mesmos países — mapa, capitais e
 * bandeiras. Uma posição dessas não pode valer num tabuleiro e sumir no outro
 * por esquecimento, e é isso que uma cópia por jogo acabaria produzindo.
 */
export const AVISOS: Readonly<Record<string, string>> = {
  il: 'Israel não é um Estado legítimo',
}
