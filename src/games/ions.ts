import { IONS, formasDoIon, formulaDoIon, tipoDoIon } from '@/data/ions'
import type { Ion } from '@/data/ions'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Cátions e ânions: aparece o íon, você escreve o nome.
 *
 * **A direção é essa e não a oposta, e não é preferência.** "Aparece o nome,
 * escreva a fórmula" exigiria digitar `SO₄²⁻` — índice subscrito e carga
 * sobrescrita, que nenhum teclado tem. É o mesmo beco em que o jogo de nox se
 * meteu quando era digitado: metade da interação virava disputa de formato, e o
 * jogo passava a medir teclado em vez de química. A saída seria transformar a
 * direção inversa em múltipla escolha, e aí ela mede reconhecer, não lembrar —
 * ver a fórmula certa entre quatro é bem menos do que produzir o nome.
 *
 * Então: fórmula na tela, nome digitado. É também o que a pessoa faz de verdade
 * ao ler uma equação.
 *
 * **A tolerância a erro de digitação fica desligada**, e este é o baralho em que
 * isso mais importa. Sulfeto, sulfito e sulfato são três íons diferentes,
 * separados por uma letra; nitreto/nitrito/nitrato e cloreto/clorito/clorato são
 * a mesma armadilha. A régua do projeto (ver `OpcoesTexto`) perdoa um caractere
 * a cada sete, e "sulfato" tem sete — ou seja, com a tolerância ligada a
 * diferença entre dois íons caberia inteira dentro da misericórdia. A trava de
 * vizinhança do validador até pegaria o caso em que o irmão está no baralho,
 * mas aí a correção do jogo passaria a depender de qual carta por acaso existe,
 * o que é fundação ruim. Aqui a letra **é** a resposta, como no grego e nos
 * prefixos SI.
 */

function cartaIon(ion: Ion): Carta {
  const formas = formasDoIon(ion)

  return {
    tipo: 'digitada',
    // A carga entra no id: Fe²⁺ e Fe³⁺ compartilham o núcleo e seriam a mesma
    // carta se o id fosse só o símbolo.
    id: `ion-${ion.nucleo}-${ion.carga}`,
    pergunta: { kind: 'texto', valor: formulaDoIon(ion) },
    // O sinal mora num sobrescrito de poucos pixels. Dizer "cátion" ou "ânion"
    // ao lado não entrega nada — a carga já está na tela — e evita que a carta
    // vire teste de acuidade visual, ou fique impossível no leitor de tela.
    dica: tipoDoIon(ion),
    resposta: {
      tipo: 'texto',
      canonica: ion.nome,
      aceitas: formas,
      opcoes: { tolerarTypo: false },
    },
    // Quem errou precisa sair sabendo que as duas tradições valem: o gabarito
    // mostra o outro nome quando ele existe, em vez de deixar o jogador achando
    // que "bicarbonato" foi recusado.
    gabarito: ion.outroNome === undefined ? ion.nome : `${ion.nome} (ou ${ion.outroNome})`,
  }
}

export const ions: JogoFlashcard = {
  id: 'ions',
  mecanica: 'flashcard',
  nome: 'Cátions e ânions',
  icone: 'SO₄²⁻',
  resumo: 'Aparece o íon, você escreve o nome — de Ca²⁺ a MnO₄⁻.',
  categoria: 'quimica',
  unidade: { singular: 'íon', plural: 'íons' },
  comoJogar: [
    'Aparece Ca²⁺ e você escreve "cálcio"; aparece MnO₄⁻ e você escreve "permanganato".',
    'As duas tradições valem: "ferroso" e "ferro(II)", "bicarbonato" e "hidrogenocarbonato".',
    'Uma letra errada não é perdoada — sulfeto, sulfito e sulfato são três íons diferentes.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(IONS).map(cartaIon),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
