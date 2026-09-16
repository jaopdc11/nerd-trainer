import { ESTADOS } from '@/data/estados'
import type { Estado } from '@/data/estados'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Estado → capital, digitado.
 *
 * Digitado e não múltipla escolha, pela régua do projeto: a resposta é o nome de
 * uma cidade e o desafio é *lembrar* qual é, não reconhecê-la numa lista. Card
 * aqui seria fácil demais — ninguém confunde Cuiabá com Curitiba quando as duas
 * estão na tela; o jogo inteiro está em não ter nada na tela.
 *
 * Importa só `estados.ts`, nunca `estados-mapa.ts`: os contornos são quase todo
 * o peso do dataset e este baralho não desenha mapa nenhum. É a mesma razão de
 * o jogo de bandeiras não arrastar o mapa-múndi.
 *
 * `tolerarTypo` fica no padrão, isto é, **ligado** — "Florianópolis" e "Belo
 * Horizonte" são longos o bastante para que uma letra trocada seja dedo, e não
 * desconhecimento. As capitais são bem mais distantes entre si que os nomes dos
 * países (ver a medida em `estados.test.ts`), então não há o risco de a
 * tolerância entregar a resposta da carta vizinha.
 */
function cartaCapital(e: Estado): Carta {
  return {
    tipo: 'digitada',
    id: `capital-${e.sigla}`,
    pergunta: { kind: 'texto', valor: e.nome },
    resposta: {
      tipo: 'texto',
      canonica: e.capital,
      aceitas: [e.capital],
    },
    // A sigla no gabarito para quem está aprendendo as duas coisas ao mesmo
    // tempo: quem erra São Luís costuma ser quem ainda troca MA com PI.
    gabarito: `${e.capital} (${e.sigla})`,
  }
}

export const capitaisEstados: JogoFlashcard = {
  id: 'capitais-estados',
  mecanica: 'flashcard',
  nome: 'Capitais dos estados',
  icone: '🏙',
  resumo: 'Aparece o estado, você escreve a capital. As 27, sem relógio.',
  categoria: 'geografia',
  unidade: { singular: 'capital', plural: 'capitais' },
  comoJogar: [
    'Aparece "Maranhão" e você escreve São Luís.',
    'São as 27 UFs, incluindo o Distrito Federal. Acento e maiúscula não importam.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(ESTADOS).map(cartaCapital),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
