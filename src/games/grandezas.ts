import { GRANDEZAS_COM_UNIDADE, gabaritoDaUnidade } from '@/data/grandezas'
import type { GrandezaComUnidade } from '@/data/grandezas'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * A grandeza na tela, o símbolo da unidade digitado.
 *
 * **A direção é essa, e as três alternativas foram descartadas por motivo.**
 *
 * 1. *Unidade → grandeza* ("o que o joule mede?") inverte a pergunta que a
 *    física faz. Ninguém chega numa conta com um pascal na mão perguntando do
 *    que ele é; chega com uma pressão e precisa saber em que unidade ela sai. E
 *    a resposta ficaria ambígua de graça: joule mede energia, trabalho e calor,
 *    e aceitar as três é aceitar qualquer coisa.
 * 2. *Grandeza → nome da unidade* ("newton") jogaria fora justamente a
 *    informação que este baralho tem para ensinar. Como `tipo: 'texto'`, a
 *    comparação é indiferente a acento e caixa e ainda perdoa um caractere a
 *    cada sete — o que transforma o jogo num concurso de soletrar "becquerel" e
 *    dá "henrry" por bom. O nome continua no gabarito, onde ele serve.
 * 3. *Múltipla escolha* mediria reconhecer no lugar de lembrar, e aqui não há
 *    desculpa para isso: a resposta tem de um a três caracteres, então digitar
 *    não custa relógio nem paciência — o oposto do que aconteceu com o nox, que
 *    virou escolha porque digitar "+6" era briga de formato.
 *
 * **Por que `tipo: 'simbolo'` e não `'texto'`.** No SI a caixa não é
 * formatação, é a informação, e este dataset é o exemplo mais cruel disso que
 * existe: `S` é siemens e `s` é segundo; `K` é kelvin e `k` é o prefixo quilo;
 * `T` é tesla e `t` é tonelada; `N` é newton e `n` é nano. Um validador que
 * ignorasse caixa daria "pa" por pascal e "wb" por weber, que é escrever errado
 * com aprovação. É a mesma decisão do alfabeto grego (σ não é Σ) e dos prefixos
 * SI (k não é K) — e a engine já tem o recado pronto para o quase-acerto: em
 * modo estrito, caixa errada é erro *com explicação*, "a caixa faz parte do
 * símbolo".
 *
 * A regra que sai do baralho inteiro é uma só, e vale a pena sair dele sabendo:
 * unidade batizada com nome de gente tem símbolo com maiúscula (N, Pa, Hz, Wb,
 * Bq, Gy, Sv), e o resto é minúsculo (m, s, mol, cd, lm, lx, kat). O dataset
 * marca cada caso em `deNomeProprio` e o teste exige que os dois concordem.
 *
 * O baralho é `GRANDEZAS_COM_UNIDADE`, 26 cartas: as sete de base e as
 * dezenove derivadas com nome próprio que sobraram depois de tirar as
 * adimensionais e o grau Celsius. As outras grandezas do dataset — velocidade,
 * torque, densidade — não têm unidade com nome e ficam só na análise
 * dimensional; perguntar "qual é a unidade da velocidade" só produziria discussão
 * sobre como digitar `m/s`.
 */

function cartaUnidade(g: GrandezaComUnidade): Carta {
  return {
    tipo: 'digitada',
    id: `unidade-${g.id}`,
    pergunta: { kind: 'texto', valor: g.nome },
    // O placeholder do campo. Não é decoração: sem ele, metade das pessoas
    // escreve "pascal" na primeira carta e leva um erro que não é de física.
    dica: 'símbolo',
    resposta: {
      tipo: 'simbolo',
      canonica: g.unidade.simbolo,
      // Só o ohm tem grafias extras, e por causa do teclado. Ver o dataset.
      ...(g.unidade.simbolosAceitos ? { aceitas: g.unidade.simbolosAceitos } : {}),
    },
    // Quem errou precisa dos três pedaços: o nome, o símbolo e a cadeia de
    // unidades de base. "Pa" sozinho não ensina que pascal é newton por metro
    // quadrado, e é disso que a próxima carta vai depender.
    gabarito: gabaritoDaUnidade(g),
  }
}

export const grandezas: JogoFlashcard = {
  id: 'grandezas',
  mecanica: 'flashcard',
  nome: 'Unidade de cada grandeza',
  icone: 'N·Pa·W',
  resumo: 'Aparece a grandeza, você escreve o símbolo da unidade — N, Pa, Wb.',
  categoria: 'fisica',
  unidade: { singular: 'unidade', plural: 'unidades' },
  comoJogar: [
    'Aparece "pressão" e você escreve Pa; aparece "fluxo magnético", Wb.',
    'É o símbolo, não o nome: "pascal" não vale.',
    'A caixa faz parte da resposta — S é siemens, s é segundo.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(GRANDEZAS_COM_UNIDADE).map(cartaUnidade),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
