/**
 * Luas do Sistema Solar, e de quem cada uma é.
 *
 * Fonte: IAU/USGS Gazetteer of Planetary Nomenclature para os nomes e as datas
 * de descoberta; NASA Science (páginas de satélites) para os fatos. Os nomes
 * estão na forma consagrada em português, que não é a inglesa: Ganimedes e não
 * Ganymede, Calisto e não Callisto, Tritão e não Triton, Jápeto e não Iapetus.
 *
 * **O que este arquivo deliberadamente não tem: contagem de luas.** É a
 * primeira coisa que alguém pensa em perguntar num jogo de satélites e é
 * justamente a que não se pode gravar — Saturno saiu de 82 luas confirmadas em
 * 2019 para mais de 270 em 2025, e Júpiter passou de 79 para 95. Qualquer
 * número desses envelhece sozinho e o jogo passa a ensinar coisa errada sem
 * ninguém tocar no arquivo. O que não muda é **de quem é cada lua**, e é só
 * isso que se pergunta aqui.
 *
 * O corte da lista tem duas regras, as duas conservadoras:
 *
 * 1. **Só lua com nome consagrado em português.** Metis, Thebe, Kiviuq e as
 *    centenas de irregulares ficam de fora: não têm forma estabelecida em
 *    português e ninguém as reconheceria pelo nome. Um baralho cheio delas
 *    mediria leitura de catálogo, não conhecimento.
 * 2. **Só lua confirmada e nomeada.** Nada de designação provisória
 *    (S/2023 J 1), que é exatamente o material que muda de ano para ano.
 *
 * Caronte não entra, embora seja a lua mais interessante do sistema externo:
 * Plutão não é planeta desde 2006, e admitir Caronte obrigaria a oferecer
 * "Plutão" como resposta possível. O jogo inteiro é construído sobre a resposta
 * ser um dos planetas — ver `games/luas.ts` —, e abrir exceção para um anão só
 * embaralharia a regra sem ensinar nada que o jogo de sistema solar já não
 * ensine.
 */

/**
 * Os planetas que hospedam alguma lua deste baralho.
 *
 * Mercúrio e Vênus não estão aqui, e não é esquecimento: **os dois não têm lua
 * nenhuma.** Como o tipo não os admite, eles não podem virar distrator por
 * acidente — e virar distrator seria um defeito, não um detalhe: quem sabe que
 * Vênus não tem lua elimina a opção sem olhar para a pergunta, e a carta de
 * quatro alternativas vira uma de três.
 */
export type PlanetaComLua = 'terra' | 'marte' | 'jupiter' | 'saturno' | 'urano' | 'netuno'

export const NOME_PLANETA: Readonly<Record<PlanetaComLua, string>> = {
  terra: 'Terra',
  marte: 'Marte',
  jupiter: 'Júpiter',
  saturno: 'Saturno',
  urano: 'Urano',
  netuno: 'Netuno',
}

export interface Lua {
  readonly id: string
  readonly nome: string
  readonly planeta: PlanetaComLua
  /**
   * Ano da descoberta. Ausente só na Lua, que ninguém descobriu.
   *
   * Não é enfeite: é o que dá consistência à lista. As quatro galileanas são
   * todas de 1610 e as cinco grandes de Urano vão de 1787 a 1948 — datas que o
   * teste confere uma a uma. Uma lua entrando no arquivo com o planeta errado
   * quase sempre entra com a data errada junto.
   */
  readonly descoberta?: number
  /** O que faz esta lua valer uma carta. Vai no gabarito. */
  readonly nota: string
}

export const LUAS: readonly Lua[] = [
  // --- Terra ----------------------------------------------------------------
  {
    id: 'lua', nome: 'Lua', planeta: 'terra',
    nota: 'o único satélite natural da Terra, e o maior em relação ao seu planeta',
  },

  // --- Marte ----------------------------------------------------------------
  // As duas são asteroides capturados, minúsculos e com nomes dos filhos de
  // Ares: medo e pavor.
  {
    id: 'fobos', nome: 'Fobos', planeta: 'marte', descoberta: 1877,
    nota: 'espirala para dentro: vai se despedaçar sobre Marte em algumas dezenas de milhões de anos',
  },
  {
    id: 'deimos', nome: 'Deimos', planeta: 'marte', descoberta: 1877,
    nota: 'a menor das duas de Marte, com cerca de 12 km de diâmetro',
  },

  // --- Júpiter: as quatro galileanas ----------------------------------------
  // Só elas. As outras noventa e tantas não têm nome consagrado em português e
  // o número muda toda temporada de observação.
  {
    id: 'io', nome: 'Io', planeta: 'jupiter', descoberta: 1610,
    nota: 'o corpo com mais vulcões ativos do Sistema Solar',
  },
  {
    id: 'europa', nome: 'Europa', planeta: 'jupiter', descoberta: 1610,
    nota: 'um oceano de água líquida sob a crosta de gelo',
  },
  {
    id: 'ganimedes', nome: 'Ganimedes', planeta: 'jupiter', descoberta: 1610,
    nota: 'a maior lua do Sistema Solar — maior que Mercúrio',
  },
  {
    id: 'calisto', nome: 'Calisto', planeta: 'jupiter', descoberta: 1610,
    nota: 'a superfície mais craterizada que se conhece',
  },

  // --- Saturno: as sete principais ------------------------------------------
  {
    id: 'tita', nome: 'Titã', planeta: 'saturno', descoberta: 1655,
    nota: 'a única lua com atmosfera densa, e tem rios e lagos de metano',
  },
  {
    id: 'encelado', nome: 'Encélado', planeta: 'saturno', descoberta: 1789,
    nota: 'gêiseres no polo sul alimentam o anel E de Saturno',
  },
  {
    id: 'reia', nome: 'Reia', planeta: 'saturno', descoberta: 1672,
    nota: 'a segunda maior de Saturno',
  },
  {
    id: 'japeto', nome: 'Jápeto', planeta: 'saturno', descoberta: 1671,
    nota: 'um hemisfério quase branco e outro quase preto',
  },
  {
    id: 'dione', nome: 'Dione', planeta: 'saturno', descoberta: 1684,
    nota: 'as faixas claras que o Voyager viu como nuvens são falhas de gelo',
  },
  {
    id: 'tetis', nome: 'Tétis', planeta: 'saturno', descoberta: 1684,
    nota: 'praticamente só gelo de água: é menos densa que a própria água',
  },
  {
    id: 'mimas', nome: 'Mimas', planeta: 'saturno', descoberta: 1789,
    nota: 'a cratera Herschel faz dela a cara da Estrela da Morte',
  },

  // --- Urano: as cinco grandes ----------------------------------------------
  // Urano é a exceção da nomenclatura: em vez de mitologia greco-romana, os
  // nomes vêm de Shakespeare e de Pope. É a pista que resolve a carta — e é
  // também por isso que as luas de Urano se confundem entre si, e não com as de
  // Saturno.
  {
    id: 'miranda', nome: 'Miranda', planeta: 'urano', descoberta: 1948,
    nota: 'o penhasco de Verona, o maior do Sistema Solar, com até 20 km de queda',
  },
  {
    id: 'ariel', nome: 'Ariel', planeta: 'urano', descoberta: 1851,
    nota: 'a superfície mais jovem entre as cinco grandes de Urano',
  },
  {
    id: 'umbriel', nome: 'Umbriel', planeta: 'urano', descoberta: 1851,
    nota: 'a mais escura das cinco grandes de Urano',
  },
  {
    id: 'titania', nome: 'Titânia', planeta: 'urano', descoberta: 1787,
    nota: 'a maior lua de Urano',
  },
  {
    id: 'oberon', nome: 'Oberon', planeta: 'urano', descoberta: 1787,
    nota: 'a mais externa das cinco grandes de Urano',
  },

  // --- Netuno ---------------------------------------------------------------
  {
    id: 'tritao', nome: 'Tritão', planeta: 'netuno', descoberta: 1846,
    nota: 'órbita retrógrada: foi capturada do cinturão de Kuiper',
  },
  {
    id: 'nereida', nome: 'Nereida', planeta: 'netuno', descoberta: 1949,
    nota: 'uma das órbitas mais excêntricas que se conhece numa lua grande',
  },
  {
    id: 'proteu', nome: 'Proteu', planeta: 'netuno', descoberta: 1989,
    nota: 'grande e escura demais para ser vista da Terra: só apareceu na passagem da Voyager 2',
  },
]

/**
 * Os planetas que se confundem com cada um, do mais tentador ao menos.
 *
 * Esta lista **é** o jogo. Numa carta de quatro alternativas com só seis
 * respostas possíveis, quem escolhe os distratores decide o que está sendo
 * perguntado: oferecer Terra e Marte para Encélado faz a carta se responder
 * sozinha, porque ninguém acha que um gêiser de gelo é de Marte. A pergunta que
 * vale é Saturno contra Júpiter contra Urano.
 *
 * O critério de vizinhança é a **cultura de nomes**, que é o que de fato
 * confunde: Júpiter e Saturno dividem a mitologia greco-romana (Io, Europa,
 * Reia, Dione e Tétis são todas titânides ou amantes de Zeus, e ninguém lembra
 * de cor quem ficou com quem); Urano usa Shakespeare; Netuno usa divindades
 * marinhas e é sempre o vizinho natural de Urano. Terra e Marte só se
 * confundem entre si.
 *
 * Fica no dataset, e não no jogo, pelo mesmo motivo dos distratores de nox: é
 * uma afirmação sobre o assunto, e quem mexer nas luas tem de ver a lista na
 * mesma tela.
 */
export const CONFUNDEM: Readonly<Record<PlanetaComLua, readonly PlanetaComLua[]>> = {
  terra: ['marte', 'jupiter', 'saturno', 'netuno'],
  marte: ['terra', 'jupiter', 'saturno', 'urano'],
  jupiter: ['saturno', 'urano', 'netuno', 'marte'],
  saturno: ['jupiter', 'urano', 'netuno', 'marte'],
  urano: ['netuno', 'saturno', 'jupiter', 'terra'],
  netuno: ['urano', 'saturno', 'jupiter', 'marte'],
}

/**
 * Quantos distratores saem fixos e quantos giram.
 *
 * Os dois primeiros da lista entram sempre, porque são a pergunta. O terceiro é
 * sorteado do resto, e isso não é enfeite: com os três fixos, o conjunto de
 * alternativas seria sempre o mesmo para cada planeta e viraria a resposta —
 * ver Júpiter aparecer junto de Terra só acontece em carta de lua marciana, e
 * duas partidas bastariam para aprender isso em vez de aprender as luas.
 */
export const DISTRATORES_FIXOS = 2

/** Os candidatos a distrator de um planeta, na ordem em que são tentadores. */
export function distratores(planeta: PlanetaComLua): readonly PlanetaComLua[] {
  return CONFUNDEM[planeta]
}
