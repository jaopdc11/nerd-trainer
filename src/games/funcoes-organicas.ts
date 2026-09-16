import { COMPOSTOS, FUNCOES, IRMAS } from '@/data/funcoes-organicas'
import type { Composto, Funcao } from '@/data/funcoes-organicas'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Fórmula estrutural → função orgânica, em quatro alternativas.
 *
 * **Por que a pergunta é a fórmula.** As três opções eram o nome do composto, o
 * grupo funcional solto e a fórmula estrutural, e as duas primeiras caem por
 * motivos diferentes. O nome *carrega a resposta no sufixo*: quem lê "etanol" e
 * responde "álcool" demonstrou saber a tabela de sufixos da IUPAC, não
 * reconhecer uma função — e a tabela de sufixos é outro jogo, mais raso. O grupo
 * solto ("-COOH → ?") é uma correspondência de doze linhas, decorável numa
 * tarde, e apaga a única parte difícil: achar o grupo no meio da cadeia. Sobra a
 * fórmula, que é onde a habilidade mora — em `CH₃-CO-CH₃` contra `CH₃-CHO` a
 * pergunta inteira é *onde* está a carbonila.
 *
 * **Por que escolha e não digitação.** Pela régua do projeto, a mesma que
 * mandou as derivadas virarem card: digitar "ácido carboxílico" contra o relógio
 * mede teclado, não química. "Ácido carboxílico" tem 18 caracteres, e ainda por
 * cima dois acentos; o item viraria um teste de ortografia. O oposto — o erro de
 * que capitais-estados escapa ficando digitado — seria entregar a resposta por
 * reconhecimento, e é ele que o mapa de irmãs existe para evitar: ninguém acerta
 * `CH₃-COO-CH₂-CH₃` por eliminação quando as outras três opções na tela são
 * ácido carboxílico, éter e amida.
 *
 * Aqui não existe o distrator "geometria eletrônica" da VSEPR, que é o erro
 * canônico daquele jogo. O equivalente é a isomeria de função — álcool × éter,
 * aldeído × cetona, ácido × éster têm a mesma fórmula molecular —, e ela já está
 * dentro de `IRMAS`, que é onde esse julgamento pode ser testado.
 */

/** Toda lista de `IRMAS` tem três ou mais entradas: o sorteio geral é rede de segurança morta. */
function cartaFuncao(c: Composto, rng: Rng): Carta {
  /*
   * Os errados, em ordem de quão tentadores são:
   * 1. as irmãs — as funções que de fato se confundem com a certa;
   * 2. qualquer outra, só para fechar quatro opções se um dia alguém encolher o
   *    mapa. Hoje esse segundo trecho nunca é alcançado, e o teste do dataset
   *    (`toda função tem três irmãs ou mais`) é o que mantém isso verdadeiro.
   */
  const candidatos: readonly Funcao[] = [
    ...rng.shuffle([...IRMAS[c.funcao]]),
    ...rng.shuffle([...FUNCOES]),
  ]

  const errados: Funcao[] = []
  for (const f of candidatos) {
    if (f !== c.funcao && !errados.includes(f)) errados.push(f)
    if (errados.length === 3) break
  }

  const opcoes = rng.shuffle([c.funcao, ...errados])

  return {
    tipo: 'escolha',
    id: `organica-${c.formula}`,
    pergunta: { kind: 'texto', valor: c.formula },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(c.funcao),
    // Quem errou precisa ver *onde* estava o grupo, não só o nome da função: é a
    // posição que separa aldeído de cetona e álcool de fenol, e repetir a
    // resposta não ensinaria isso a ninguém.
    gabarito: `${c.funcao} — ${c.nome}: ${c.sinal}`,
  }
}

export const funcoesOrganicas: JogoFlashcard = {
  id: 'funcoes-organicas',
  mecanica: 'flashcard',
  nome: 'Funções orgânicas',
  icone: '⌬OH',
  resumo: 'Aparece a fórmula estrutural, você diz a função.',
  categoria: 'quimica',
  unidade: { singular: 'composto', plural: 'compostos' },
  comoJogar: [
    'Escolha a função do composto entre as quatro opções.',
    'A pergunta é a fórmula, nunca o nome: "etanol" já entregaria a resposta no sufixo.',
    'As opções erradas são sempre as funções que se parecem — álcool e éter têm a mesma fórmula molecular, e fenol é só a hidroxila mudando de lugar.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(COMPOSTOS).map((c) => cartaFuncao(c, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
