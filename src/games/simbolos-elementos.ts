import { ELEMENTOS } from '@/data/tabela-periodica'
import type { Elemento } from '@/data/tabela-periodica'
import { chaveDeTexto } from '@/core/answer'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Símbolo → nome do elemento.
 *
 * **Por que isto não é a tabela periódica de novo.** Na grade (mecânica B) a
 * pergunta é *onde fica*: o tabuleiro já mostra o número atômico e a casa, e o
 * que se cobra é a geografia da tabela — período, coluna, o buraco que sobrou no
 * meio do bloco d. Aqui não há tabuleiro nenhum. Aparece "Sb" sozinho no meio da
 * tela e a pergunta é *de quem é esse símbolo*, que é conhecimento diferente e
 * mede gente diferente: quem enche a grade inteira de cima para baixo muitas
 * vezes trava em W, Sb, Hg e Sn, porque lá a posição ajuda a lembrar o nome e
 * aqui ela não existe. São os onze símbolos que vêm do latim que separam os
 * dois jogos — e é justamente onde a grade não pergunta nada.
 *
 * O dataset é o mesmo, `ELEMENTOS`, e de propósito: duplicar 118 nomes para
 * criar um baralho próprio seria criar uma segunda verdade sobre a grafia em
 * pt-BR, que é exatamente o que `tabela-periodica.test.ts` existe para impedir.
 */

/**
 * Uma palavra explica um símbolo quando começa com a mesma letra e traz todas
 * as letras dele na ordem: "ferro" explica Fe, "hydrargyrum" explica Hg,
 * "mercúrio" não explica coisa nenhuma.
 *
 * Subsequência e não prefixo porque o Hg é justamente o caso em que prefixo não
 * serve — o g está lá no meio de hydrar**g**yrum. E a primeira letra é exigida à
 * parte porque só a subsequência é frouxa demais: "s" e "n" aparecem nessa ordem
 * dentro de "estanho", e sem a trava o Sn passaria por explicado pelo português,
 * quando ele vem de Stannum.
 */
function explica(simbolo: string, palavra: string): boolean {
  if (palavra[0] !== simbolo[0]) return false
  let i = 0
  for (const letra of palavra) {
    if (letra === simbolo[i]) i++
    if (i === simbolo.length) return true
  }
  return false
}

/**
 * O nome em latim, quando é ele que explica o símbolo.
 *
 * Regra mecânica, e não uma lista escrita à mão: o sinônimo entra no gabarito
 * quando o nome em português **não** explica o símbolo e ele explica. Sai daí
 * exatamente o conjunto que interessa — Na de Natrium, Sb de Stibium, Pb de
 * Plumbum, Hg de Hydrargyrum — sem o ruído que uma regra mais frouxa produziria:
 * "Arsênio (Arsênico)" e "Astato (Ástato)" não ensinam nada, porque o próprio
 * nome em português já dá conta do As e do At.
 *
 * Mecânica porque uma lista escrita à mão envelheceria calada: bastaria alguém
 * acrescentar um sinônimo no dataset para o gabarito passar a mentir por
 * omissão. O teste fixa quais são os casos, então mudar a regra sem querer
 * quebra alguma coisa.
 */
export function origemDoSimbolo(e: Elemento): string | null {
  const simbolo = chaveDeTexto(e.simbolo, false)
  if (explica(simbolo, chaveDeTexto(e.nome, false))) return null
  return e.sinonimos.find((s) => explica(simbolo, chaveDeTexto(s, false))) ?? null
}

/**
 * A tolerância a erro de digitação fica **ligada**, e a medição está em
 * `simbolos-elementos.test.ts`.
 *
 * O medo é legítimo e todo mundo o tem ao olhar a lista: Boro e Bromo, Cromo e
 * Bromo, Sódio e Ródio, Ródio e Rádio, Gálio e Tálio, Túlio e Tálio, Césio e
 * Cério, Cério e Cúrio, Térbio e Érbio. Medidos par a par, são **nove** pares de
 * nomes a um único caractere de distância — mais do que o grego e os prefixos SI
 * têm, e foi por menos que aqueles dois desligaram a tolerância.
 *
 * Só que a régua do projeto não é "um caractere": é um erro a cada sete
 * caracteres, com piso em zero (ver `limiteDeErro`). E aí a conta vira outra.
 * Todos os nove pares perigosos são de nomes de cinco e seis letras, que
 * perdoam **nada** — "sodio" tem 5 caracteres, logo 0 de tolerância, e nunca
 * chega perto da carta do ródio. Refeita com a régua que o jogo de fato usa,
 * sobra **um** par ambíguo em 118 elementos: Térbio × Itérbio, porque "iterbio"
 * tem sete letras e passa a perdoar uma. E esse único caso morre na trava de
 * vizinhança, que recusa qualquer texto que encoste em duas cartas do mesmo
 * baralho ao mesmo tempo — o baralho aqui é o dataset inteiro, então a trava vê
 * todos os 118.
 *
 * O que se ganha em troca: Praseodímio, Protactínio, Rutherfórdio, Darmstácio,
 * Roentgênio e Oganessônio. São onze e doze caracteres em que a pessoa sabe
 * perfeitamente a resposta e perde o ponto por um dedo, que é o oposto do que o
 * jogo quer medir. Ligar a tolerância custa zero ambiguidade real e resolve
 * exatamente essa faixa.
 */
function cartaSimbolo(e: Elemento): Carta {
  const origem = origemDoSimbolo(e)

  return {
    tipo: 'digitada',
    id: `simbolo-z${e.z}`,
    pergunta: { kind: 'texto', valor: e.simbolo },
    resposta: {
      tipo: 'texto',
      canonica: e.nome,
      // O latim entra como forma aceita, não só como curiosidade do gabarito:
      // quem responde "Natrium" para Na sabe mais, não menos.
      aceitas: [e.nome, ...e.sinonimos],
      // Explícito de propósito: a decisão é o miolo deste jogo e não pode
      // depender de o padrão da opção continuar sendo `true` amanhã.
      opcoes: { tolerarTypo: true },
    },
    // Depois de errar, ver "Chumbo (Plumbum)" ensina o porquê do Pb; ver
    // "Chumbo" sozinho manda decorar de novo.
    gabarito: origem ? `${e.nome} (${origem})` : e.nome,
  }
}

export const simbolosElementos: JogoFlashcard = {
  id: 'simbolos-elementos',
  mecanica: 'flashcard',
  nome: 'Símbolos dos elementos',
  icone: 'Sb',
  resumo: 'Aparece o símbolo, você escreve o elemento — inclusive os do latim.',
  categoria: 'quimica',
  unidade: { singular: 'símbolo', plural: 'símbolos' },
  comoJogar: [
    'Aparece "Sb" e você escreve antimônio.',
    'Os do latim são os que pegam: W, Sb, Hg, K, Na, Fe, Pb, Sn, Ag, Au, Cu.',
    'Acento e maiúscula não importam, e o nome em latim também vale.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  /**
   * Baralho completo e sem relógio, como o grego e os prefixos SI.
   *
   * Morte súbita aqui seria perversa: o sorteio decidiria a partida na hora em
   * que caísse Darmstácio, e a nota mediria a sorte da ordem das cartas, não o
   * repertório. Um conjunto fechado que a gente quer ver terminado se joga até
   * o fim — e 118 cartas digitadas já são uma partida longa o bastante para
   * ninguém querer repeti-la por causa de um tropeço no quinto card.
   */
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(ELEMENTOS).map(cartaSimbolo),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
