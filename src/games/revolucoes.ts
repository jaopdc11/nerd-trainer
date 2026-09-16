import { MARCOS, ROTULO_GENERO, exibirData } from '@/data/revolucoes'
import type { Marco } from '@/data/revolucoes'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Revoluções e tratados: aparece o que aconteceu, você escreve o nome.
 *
 * **Digitado, não múltipla escolha**, pela régua que o projeto já aplica em
 * filosofia e sociologia: a resposta é um nome curto e o desafio é *lembrar*
 * qual é, não reconhecê-lo numa lista de quatro. Card com alternativas aqui
 * seria fácil demais — ver "Guerra dos Trinta Anos" no enunciado e escolher
 * "Vestfália" entre quatro opções não exige saber nada, porque as outras três
 * seriam obviamente de outro século.
 *
 * **Como isto não é o "Qual veio antes?".** Aquele é um gerador: sorteia dois
 * eventos de `@/data/cronologia` e pergunta a **ordem** entre eles, sem nunca
 * dizer o que qualquer um deles foi. Este é um baralho finito que pergunta o
 * **conteúdo** e nunca a data — o ano só aparece no gabarito, depois de a carta
 * ter sido respondida. Os dois se cruzam no acervo de propósito (Vestfália,
 * Versalhes, a Francesa e a Russa estão nos dois), e é justamente aí que se vê
 * que são jogos diferentes: dá para gabaritar a cronologia inteira sabendo só
 * a fila dos séculos, e dá para gabaritar este baralho sem saber ordenar duas
 * cartas quaisquer. Um treina a linha do tempo, o outro o que está em cima
 * dela.
 *
 * **A tolerância a erro de digitação fica ligada**, ao contrário do grego e dos
 * prefixos SI, e a medição está no teste: entre as 32 cartas há exatamente
 * **um** par dentro da tolerância — "revolucaoamericana" contra
 * "revolucaomexicana", distância 2 num limite de 2, porque o prefixo
 * "revolucao" é longo e o limite escala com o tamanho da resposta. Esse par não
 * precisa de conserto no dataset porque quem o resolve é a trava de vizinhança
 * da engine: uma entrada que encosta em duas cartas ao mesmo tempo é recusada,
 * e a resposta exata continua passando porque o casamento exato é decidido
 * antes. Desligar a tolerância por causa de um par castigaria
 * "Brest-Litovski" e "Tordesilhas", que são justamente onde o dedo escorrega.
 */
function carta(m: Marco): Carta {
  return {
    tipo: 'digitada',
    id: `marco-${m.id}`,
    pergunta: { kind: 'texto', valor: m.fato },
    // A dica separa tratado de revolução, o que tira a ambiguidade do
    // enunciado sem entregar a resposta: saber que é um tratado não diz qual.
    dica: ROTULO_GENERO[m.genero],
    resposta: {
      tipo: 'texto',
      canonica: m.nome,
      aceitas: [...m.aceitas],
    },
    // O ano entra aqui e só aqui: é contexto de quem já respondeu, nunca
    // pergunta. Ver a nota do dataset sobre a fronteira com a cronologia.
    gabarito: `${m.nome} (${exibirData(m)})`,
  }
}

export const revolucoes: JogoFlashcard = {
  id: 'revolucoes',
  mecanica: 'flashcard',
  nome: 'Revoluções e tratados',
  icone: '⚔',
  resumo: 'O que aconteceu na tela, você escreve o nome. De Tordesilhas ao Mercosul.',
  categoria: 'humanas',
  unidade: { singular: 'carta', plural: 'cartas' },
  comoJogar: [
    'Aparece "encerrou a Guerra dos Trinta Anos", você escreve Vestfália.',
    'A dica diz se é uma revolução ou um tratado; o nome curto basta, e acento e maiúscula não importam.',
    'Aqui não se pergunta o ano — ele aparece no gabarito depois que você responde.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(MARCOS).map(carta),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
