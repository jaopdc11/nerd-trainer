import { ROTULO_AREA_SIMBOLO, SIMBOLOS_MATEMATICOS } from '@/data/simbolos-matematicos'
import type { SimboloMatematico } from '@/data/simbolos-matematicos'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Glifo → nome. O parente direto do alfabeto grego, e com uma decisão diferente.
 *
 * **A tolerância a erro de digitação fica ligada**, ao contrário do grego e dos
 * prefixos SI, e a régua é a mesma dos dois: ela se desliga quando as respostas
 * são curtas e parecidas *entre si*. No grego isso descreve o baralho inteiro —
 * "mi"/"mu", "ni"/"nu", "csi"/"xi" — e, com a tolerância escalando a um
 * caractere a cada sete, nomes de duas e três letras nem chegam a ganhar
 * perdão: o que sobra de ligar a tolerância lá é só o risco de "épsilon" virar
 * "úpsilon".
 *
 * Aqui o baralho é o oposto. A mediana do nome canônico passa de dez
 * caracteres e há "aproximadamente igual", "fim da demonstração", "produto
 * tensorial", "está contido ou é igual" — exatamente o caso de países e
 * bandeiras, em que exigir vinte e três teclas certas de vinte e três mede
 * digitação e não repertório.
 *
 * E a medição foi feita, não presumida: cruzando forma contra forma de cartas
 * diferentes, com o mesmo `limiteDeErro` que o validador usa, **nenhum par do
 * baralho cai dentro da tolerância**. Nem "muito menor" × "muito maior", que
 * era a colisão que eu tinha como certa antes de medir: "menor" e "maior"
 * diferem em duas letras, e o perdão de um nome de dez caracteres é de uma.
 * Ver `simbolos-matematicos.test.ts`, onde essa lista é uma asserção —
 * acrescentar um símbolo que crie um par quebra o teste.
 *
 * E se um dia sobrar um par, ele ainda não vira ponto errado: quem digita um
 * texto que encosta em duas cartas cai na trava de vizinhança, que recusa
 * entrada ambígua em vez de decidir a favor do jogador.
 */
function carta(s: SimboloMatematico): Carta {
  return {
    tipo: 'digitada',
    id: `simbolo-${s.id}`,
    pergunta: { kind: 'texto', valor: s.glifo },
    // A dica é a área, nunca o nome: diz que tipo de resposta se espera — "isto
    // é lógica, não análise" — sem entregar qual. Sem ela, `⊕` sozinho pode ser
    // pergunta de álgebra linear ou de circuito digital, e o jogador erra por
    // ambiguidade do enunciado, que não é o que o jogo quer medir.
    dica: ROTULO_AREA_SIMBOLO[s.area],
    resposta: {
      tipo: 'texto',
      canonica: s.nome,
      aceitas: [s.nome, ...s.sinonimos],
    },
    // O gabarito ensina quando o nome sozinho não ensina: "satisfaz" não diz
    // nada, "satisfaz — φ vale em todo modelo de Γ" diz.
    gabarito: s.glosa ? `${s.nome} — ${s.glosa}` : s.nome,
  }
}

export const simbolosMatematicos: JogoFlashcard = {
  id: 'simbolos-matematicos',
  mecanica: 'flashcard',
  nome: 'Símbolos matemáticos',
  icone: '∂∇',
  resumo: 'De ∂ a ℵ₀: aparece o símbolo, você escreve o nome.',
  categoria: 'matematica',
  unidade: { singular: 'símbolo', plural: 'símbolos' },
  comoJogar: [
    'Aparece ∇ e você escreve "nabla" — "del" e "gradiente" também valem.',
    'A dica no campo é a área do símbolo: conjuntos, lógica, análise ou relações.',
    'Acento e maiúscula não importam, e um dedo escorregado num nome longo é perdoado.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(SIMBOLOS_MATEMATICOS).map(carta),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
