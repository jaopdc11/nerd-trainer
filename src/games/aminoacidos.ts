import { AMINOACIDOS } from '@/data/codigo-genetico'
import type { Aminoacido } from '@/data/codigo-genetico'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Os 20 aminoácidos: nome → sigla de três letras, e nome → letra única.
 *
 * **Digitado, e não de escolha** — o caminho contrário ao do jogo de códons, com
 * a mesma régua. Lá a resposta é um nome comprido, três cartas não têm gabarito
 * digitável ('parada' não tem forma canônica) e a pergunta de verdade só existe
 * com os vizinhos na tela. Aqui nada disso vale: a resposta é 'Trp' ou 'W', tem
 * forma canônica única, cabe em três teclas, e a pergunta é puro repertório —
 * você sabe ou não sabe. É o caso dos símbolos dos elementos, e a decisão é a
 * mesma que lá: quatro opções trocariam recordar por reconhecer, que é
 * exatamente o oposto do que este baralho existe para medir.
 *
 * **A resposta é `tipo: 'simbolo'`, e a caixa é a informação.** 'Trp' e não
 * 'trp' nem 'TRP'; 'W' e não 'w'. Não é preciosismo tipográfico: a sigla de três
 * letras é um símbolo padronizado pela IUPAC-IUB, e é assim que ela aparece em
 * toda estrutura do PDB, em todo registro do UniProt e em toda notação de
 * mutação — p.Trp26Cys, W26C. Quem escreve 'trp' num arquivo de sequência
 * escreveu outra coisa. O validador em modo estrito recusa a caixa errada com o
 * recado certo ("a caixa faz parte do símbolo"), que é o que ensina a diferença.
 *
 * **Uma direção só: do nome para o código.** As duas descartadas, e por quê:
 *
 * - *código → nome* seria a direção receptiva, e ela duplica o fato sem medir
 *   nada a mais — é o argumento que o latim já usou contra fazer as duas. E
 *   aqui há um agravante que lá não havia: essa direção é grátis na maior parte
 *   do baralho. 'Ala', 'Gly', 'Ser', 'Val', 'Leu', 'Met', 'Pro', 'Thr', 'His',
 *   'Ile', 'Lys', 'Arg', 'Cys', 'Trp', 'Tyr', 'Phe' se leem de volta sem saber
 *   aminoácido nenhum; sobrariam quatro cartas de conteúdo (Asn, Asp, Gln, Glu)
 *   e dezesseis de digitação. Além disso a resposta perderia a forma canônica —
 *   'ácido aspártico' ou 'aspartato', com acento ou sem —, e é justamente onde o
 *   projeto só digita quando não tem alternativa.
 * - *sigla ↔ letra* é tradução de código para código: não sabe biologia
 *   nenhuma, e quem tem as duas setas a partir do nome já a compõe sozinho.
 *
 * **Duas cartas por aminoácido, e não uma pedindo as duas coisas.** A sigla e a
 * letra são dois fatos independentes em metade do baralho — ver
 * `letraSegueASigla` —, e uma carta que pedisse as duas de uma vez mediria duas
 * coisas sem saber dizer qual das duas a pessoa errou, que é o erro que o jogo
 * de famílias já tinha evitado ao pôr o nome do elemento junto do símbolo.
 */

/**
 * A letra única é a inicial da sigla?
 *
 * Em onze dos vinte, é: Ala→A, Cys→C, Gly→G, His→H, Ile→I, Leu→L, Met→M, Pro→P,
 * Ser→S, Thr→T, Val→V. Nos outros nove ela é arbitrária — Asp→D, Glu→E, Phe→F,
 * Lys→K, Asn→N, Gln→Q, Arg→R, Trp→W, Tyr→Y — porque as iniciais já estavam
 * tomadas: A ficou com a alanina e sobrou D para o aspártico, G ficou com a
 * glicina e sobrou Q para a glutamina.
 *
 * Isso é regra calculada e não lista escrita à mão, pelo mesmo motivo de
 * `origemDoSimbolo` nos símbolos dos elementos: uma lista envelheceria calada. E
 * não é curiosidade de comentário — são esses nove que separam quem sabe o
 * código de quem chuta a inicial, e é deles que sai a meta do Nerdômetro.
 */
export const letraSegueASigla = (a: Aminoacido): boolean => a.letra === a.sigla[0]

/**
 * Nome → código, num dos dois códigos.
 *
 * A `dica` não é enfeite: as duas cartas do mesmo aminoácido mostram o mesmo
 * nome na tela, e sem ela "triptofano" seria uma pergunta ambígua — 'Trp' ou
 * 'W'? Errar por ambiguidade do enunciado não é o que o jogo quer medir. É o
 * mesmo papel que a dica cumpre nos símbolos matemáticos, onde `⊕` sozinho pode
 * ser álgebra linear ou circuito digital.
 */
function carta(a: Aminoacido, qual: 'sigla' | 'letra'): Carta {
  const resposta = qual === 'sigla' ? a.sigla : a.letra

  return {
    tipo: 'digitada',
    id: `amino-${qual}-${a.letra}`,
    pergunta: { kind: 'texto', valor: a.nome },
    dica: qual === 'sigla' ? 'sigla de três letras' : 'letra única',
    resposta: { tipo: 'simbolo', canonica: resposta },
    // O gabarito mostra os dois códigos e o sinônimo do ânion quando existe:
    // quem errou 'W' aprende de uma vez que ele é 'Trp', e quem errou 'Asp'
    // descobre que o aminoácido também se chama aspartato. Ver só a resposta que
    // faltava manda decorar de novo.
    gabarito: `${comSinonimo(a)} — ${a.sigla} (${a.letra})`,
  }
}

/** 'ácido aspártico (aspartato)'. O ânion é o nome que aparece em bioquímica. */
const comSinonimo = (a: Aminoacido): string =>
  a.sinonimos.length === 0 ? a.nome : `${a.nome} (${a.sinonimos.join(', ')})`

export const aminoacidos: JogoFlashcard = {
  id: 'aminoacidos',
  mecanica: 'flashcard',
  nome: 'Aminoácidos',
  icone: 'Trp',
  resumo: 'Os 20: aparece o nome, você escreve a sigla de três letras e a de uma.',
  categoria: 'biologicas',
  unidade: { singular: 'código', plural: 'códigos' },
  comoJogar: [
    'Aparece "triptofano" e você escreve Trp — ou W, conforme a dica no campo.',
    'A caixa faz parte da resposta: Trp, nunca trp nem TRP. É como a sigla aparece no PDB e em toda notação de mutação.',
    'As siglas são as internacionais, e não as do português: Gly, Cys, Phe, Lys, Tyr.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  /**
   * Baralho completo e sem relógio, como os símbolos dos elementos.
   *
   * Morte súbita aqui seria perversa pelo mesmo motivo de lá: das 40 cartas, 9
   * pedem uma letra que não se deduz de nada (K de lisina, Q de glutamina, W de
   * triptofano), e cair numa delas no segundo card encerraria a partida sem
   * medir repertório nenhum — a nota mediria a ordem do baralho. Um conjunto
   * fechado de 20 que a gente quer ver terminado se joga até o fim, e 40 cartas
   * digitadas duram o suficiente para ninguém querer repeti-las por um tropeço.
   *
   * As duas cartas de cada aminoácido entram embaralhadas juntas, e não em
   * blocos: elas saem separadas por dezenas de cartas, então a segunda não vira
   * eco da primeira.
   */
  config: () => ({
    montarBaralho: (rng) =>
      rng.shuffle(AMINOACIDOS.flatMap((a) => [carta(a, 'sigla'), carta(a, 'letra')])),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
