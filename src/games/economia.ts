import { ECONOMIA } from '@/data/economia'
import type { ItemEconomia } from '@/data/economia'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Conceito ou obra de economia → autor.
 *
 * **Digitado, e não múltipla escolha**, pela mesma régua que manteve filosofia e
 * sociologia digitados: a resposta é um sobrenome curto e o que se quer medir é
 * *lembrar* quem foi, não reconhecer numa lista de quatro. Card aqui seria fácil
 * demais de outra forma — as escolas econômicas são tão distintas entre si que
 * qualquer distrator plausível ("Hayek" contra "Keynes") entregaria a resposta
 * pelo contexto da pergunta.
 *
 * **`tolerarTypo` fica no padrão, ou seja, ligado.** "Schumpeter" tem dez
 * letras, "Kahneman" oito, "Prebisch" oito: perder o ponto por um dedo fora de
 * hora seria medir teclado. O que impede a tolerância de dar a resposta do
 * vizinho é a trava de vizinhança da engine, mais o teste de distância do
 * dataset — e esse teste compara **autor contra autor**, nunca forma contra
 * forma, porque "Friedrich Hayek" e "Hayek" são a mesma pessoa e acusariam um
 * falso conflito. É o mesmo ajuste que as bandeiras tiveram de fazer.
 *
 * O `dica` vira o placeholder do campo e diz só se a carta é conceito ou obra —
 * o mesmo que o baralho de filosofia faz. É informação de *forma*, não de
 * conteúdo: saber que "A Riqueza das Nações" é um livro não ajuda ninguém a
 * lembrar que é de Smith.
 */
function cartaEconomia(item: ItemEconomia): Carta {
  return {
    tipo: 'digitada',
    id: `econ-${item.id}`,
    pergunta: { kind: 'texto', valor: item.pergunta },
    dica: item.tipo === 'obra' ? 'obra' : 'conceito',
    resposta: {
      tipo: 'texto',
      canonica: item.autor,
      aceitas: [...item.aceitas],
    },
    gabarito: item.autor,
  }
}

export const economia: JogoFlashcard = {
  id: 'economia',
  mecanica: 'flashcard',
  nome: 'Economia',
  icone: '📈',
  resumo: 'Conceito ou obra na tela, você escreve de quem é.',
  categoria: 'humanas',
  unidade: { singular: 'carta', plural: 'cartas' },
  comoJogar: [
    'Aparece "destruição criadora", você escreve Schumpeter.',
    'Só o sobrenome basta; acento e maiúscula não importam.',
    'De Adam Smith a Piketty, com Prebisch e Celso Furtado no meio — aqui a periferia também escreve teoria.',
    'Nada de interpretação: aqui só se pergunta autoria, que é o que tem resposta.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(ECONOMIA).map(cartaEconomia),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
