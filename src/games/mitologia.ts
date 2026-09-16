import { DIVINDADES, enunciado } from '@/data/mitologia'
import type { Divindade } from '@/data/mitologia'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Domínio → deus, com o panteão dito no enunciado.
 *
 * **A carta nunca monta o texto por conta própria**: quem monta é `enunciado()`,
 * no dataset. Se este arquivo concatenasse `${d.panteao}: ${d.dominio}` na mão,
 * a regra do panteão sobreviveria até o dia em que alguém escrevesse um segundo
 * modo de jogo e esquecesse o prefixo — e o bug seria silencioso, porque a
 * carta continuaria funcionando, só que impossível de responder. Ver o
 * cabeçalho de `data/mitologia.ts` para o porquê da regra.
 *
 * **Digitado, e não múltipla escolha.** Com quatro opções na tela, "grego: deus
 * do mar" se responde por eliminação — as outras três seriam egípcias, ou seriam
 * gregas óbvias, e em nenhum dos casos o jogo mediria alguma coisa. Digitar o
 * nome é lembrar o nome.
 *
 * **`tolerarTypo` fica desligado**, ao contrário de economia e dos pensadores.
 * Aqui os nomes são curtos e vizinhos: Rá tem duas letras, Set, Tot, Nut e Geb
 * têm três, e Hera/Héstia/Hélios/Hermes/Hefesto dividem as mesmas duas
 * primeiras. A régua da engine perdoa um caractere a cada sete, e num baralho
 * assim isso não perdoaria o dedo escorregado — aceitaria o deus errado. É a
 * mesma decisão do alfabeto grego, onde "ni" e "mi" convivem, e pelo mesmo
 * motivo.
 *
 * O `dica` vira o placeholder e repete o panteão: é de graça, e é mais um lugar
 * onde a informação que desfaz a ambiguidade fica visível na hora de responder.
 */
function cartaDivindade(d: Divindade): Carta {
  return {
    tipo: 'digitada',
    id: `mito-${d.id}`,
    pergunta: { kind: 'texto', valor: enunciado(d) },
    dica: d.panteao === 'grego' ? 'nome grego' : 'nome egípcio',
    resposta: {
      tipo: 'texto',
      canonica: d.nome,
      aceitas: [...d.aceitas],
      // Ver o cabeçalho: nomes de três letras não toleram erro de digitação
      // sem entregar o ponto do vizinho.
      opcoes: { tolerarTypo: false },
    },
    // O gabarito diz os outros domínios quando o deus acumula: quem respondeu
    // "Ártemis" para a caça leva junto que ela também é a Lua e os partos, que
    // é a informação que a carta não coube.
    gabarito: d.acumula ? `${d.nome} — também ${d.acumula}` : d.nome,
  }
}

export const mitologia: JogoFlashcard = {
  id: 'mitologia',
  mecanica: 'flashcard',
  nome: 'Mitologia',
  icone: '⚡',
  resumo: 'Gregos e egípcios no mesmo baralho: a carta diz o panteão, você diz o deus.',
  categoria: 'humanas',
  unidade: { singular: 'deus', plural: 'deuses' },
  comoJogar: [
    'A carta sempre começa pelo panteão: "grego: deus do mar" é Poseidon, "egípcio: deus do Sol" é Rá.',
    'Sem isso a pergunta teria duas respostas certas — Hélios e Rá dividem o Sol, Hades e Osíris dividem os mortos.',
    'Escreva o nome grego ou egípcio: Netuno e Júpiter são romanos e não valem.',
    'Aqui não se perdoa erro de digitação: com Set, Tot, Nut e Geb no baralho, uma letra já é outro deus.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(DIVINDADES).map(cartaDivindade),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
