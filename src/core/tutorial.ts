/**
 * A memória de "esta pessoa já viu como o app funciona".
 *
 * Chave própria, e não um campo do banco de recordes: o banco é exportado,
 * importado e fundido entre navegadores, e "eu já li o tutorial" não é dado de
 * desempenho — não pode viajar num backup nem ser fundido com o de outro
 * aparelho. Apagar os recordes também não devolve o tutorial, que é o certo:
 * quem apaga tudo não está pedindo a aula de novo.
 *
 * Guarda a versão vista, não um booleano, para que um tutorial reescrito possa
 * voltar a aparecer sem precisar de outra chave.
 */
const CHAVE = 'nerd-trainer:tutorial'

/**
 * Sobe quando o tutorial mudar o bastante para valer reabrir na cara de quem já
 * o viu. Correção de vírgula não conta.
 */
export const VERSAO_TUTORIAL = 1

/**
 * Nunca lança: em navegador com dados de site bloqueados o `localStorage` joga
 * no `getItem`, e o app não pode morrer por causa de uma ajuda opcional. Ali o
 * tutorial simplesmente reaparece toda visita — chato, mas inofensivo, e é o
 * mesmo navegador que já não guarda recorde nenhum.
 */
export function tutorialVisto(): boolean {
  try {
    return Number(window.localStorage.getItem(CHAVE)) >= VERSAO_TUTORIAL
  } catch {
    return false
  }
}

export function marcarTutorialVisto(): void {
  try {
    window.localStorage.setItem(CHAVE, String(VERSAO_TUTORIAL))
  } catch {
    // Sem espaço ou sem permissão: perder isto custa uma abertura repetida.
  }
}
