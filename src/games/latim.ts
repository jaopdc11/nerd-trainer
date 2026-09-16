import { CONFUNDEM, EXPRESSOES } from '@/data/latim'
import type { Expressao } from '@/data/latim'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Expressão em latim → significado, em quatro alternativas.
 *
 * **Por que escolha, e não digitação.** Aqui a régua do projeto aponta para o
 * mesmo lado das derivadas e das funções orgânicas, mas por um motivo mais forte
 * que o tamanho da resposta. Em capitais-estados a resposta digitada é "São Luís":
 * existe *uma* forma canônica, e quem sabe escreve aquilo. O significado de
 * "rebus sic stantibus" não tem forma canônica nenhuma — "enquanto as coisas
 * continuarem como estão", "se as circunstâncias se mantiverem", "cláusula de
 * revisão do contrato" são todas certas. Aceitar por texto exigiria listar
 * paráfrases, e cada paráfrase que eu esquecesse seria um ponto roubado de quem
 * sabia. Não é que digitar seja trabalhoso: é que não há gabarito digitável.
 *
 * **Por que esta direção, e não a inversa.** Significado → expressão teria
 * resposta curta e caberia no teclado, e mesmo assim foi descartada por duas
 * razões. A primeira é o uso: ninguém precisa *produzir* latim, precisa entender
 * o que leu num acórdão, num artigo ou num rodapé — o conhecimento útil é
 * receptivo. A segunda é que digitar latim mede ortografia de língua morta
 * ("ipsis litteris" com dois tt, "sed lex" com ou sem vírgula), que é exatamente
 * o tipo de item que o projeto recusa. Fazer as duas direções, como o alfabeto
 * grego faz, duplicaria o mesmo fato em duas cartas e inflaria o placar sem medir
 * nada a mais.
 *
 * **Os distratores são significados de outras expressões, e nunca inventados.**
 * Um significado falso seria escrito por mim e daria para descartar pelo estilo;
 * um significado verdadeiro de outra expressão é a resposta que alguém de fato
 * marca. Eles saem em duas camadas: primeiro as expressões que se confundem com
 * esta (`CONFUNDEM` — pares opositivos como ex nunc × ex tunc, a regra e a
 * exceção, a família de citação), e depois o resto do mesmo domínio. A segunda
 * camada existe porque nem toda expressão tem par natural, e é ela que impede o
 * atalho do tom: três frases de citação acadêmica e uma de processo penal
 * entregariam a carta sem ninguém saber latim.
 */

const POR_ID: ReadonlyMap<string, Expressao> = new Map(EXPRESSOES.map((e) => [e.id, e]))

function cartaLatim(e: Expressao, rng: Rng): Carta {
  const declarados = (CONFUNDEM[e.id] ?? [])
    .map((id) => POR_ID.get(id))
    .filter((x): x is Expressao => x !== undefined)

  /*
   * Os errados, em ordem de quão tentadores são:
   * 1. os declarados — as expressões que de fato se trocam por esta;
   * 2. o resto do mesmo domínio, que mantém o registro e o tom iguais;
   * 3. qualquer uma, só para fechar quatro opções se um dia um domínio encolher.
   *    Hoje esse terceiro trecho nunca é alcançado, e quem mantém isso verdadeiro
   *    é o teste do dataset ("todo domínio tem pelo menos quatro expressões").
   */
  const candidatos: readonly Expressao[] = [
    ...rng.shuffle(declarados),
    ...rng.shuffle(EXPRESSOES.filter((x) => x.dominio === e.dominio)),
    ...rng.shuffle(EXPRESSOES),
  ]

  const errados: Expressao[] = []
  for (const c of candidatos) {
    if (c.id !== e.id && !errados.some((x) => x.id === c.id)) errados.push(c)
    if (errados.length === 3) break
  }

  const opcoes = rng.shuffle([e, ...errados])

  return {
    tipo: 'escolha',
    id: `latim-${e.id}`,
    pergunta: { kind: 'texto', valor: e.expressao },
    alternativas: opcoes.map((x) => ({ kind: 'texto' as const, valor: x.significado })),
    indiceCorreto: opcoes.findIndex((x) => x.id === e.id),
    // O literal entra no gabarito e não nas alternativas: ele é o que faz a
    // expressão parar de ser uma fórmula decorada — "sem a qual não" explica
    // "sine qua non" para sempre —, mas como opção seria uma segunda resposta
    // certa na mesma tela.
    gabarito: `${e.expressao} — ${e.significado} (ao pé da letra, "${e.literal}")`,
  }
}

export const latim: JogoFlashcard = {
  id: 'latim',
  mecanica: 'flashcard',
  nome: 'Expressões em latim',
  icone: '⚖',
  resumo: 'Aparece a expressão, você diz o que ela quer dizer.',
  categoria: 'humanas',
  unidade: { singular: 'expressão', plural: 'expressões' },
  comoJogar: [
    'Escolha o significado da expressão entre as quatro opções.',
    'As erradas são sempre significados verdadeiros de outras expressões, e de preferência a que se troca com esta: ex nunc aparece ao lado de ex tunc, a priori ao lado de a posteriori.',
    'A tradução ao pé da letra vem no gabarito — "habeas corpus" é "que tenhas o corpo", e é daí que o resto se explica.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(EXPRESSOES).map((e) => cartaLatim(e, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
