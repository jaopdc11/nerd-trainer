import { CAPITAIS, formasAceitas } from '@/data/capitais'
import type { Capital } from '@/data/capitais'
import { PAISES } from '@/data/paises'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * País → capital, digitado, baralho de 195 cartas.
 *
 * É o par do "Países do mundo": lá o desafio é *onde fica*, aqui é *quem manda*.
 * Mecânica C sem nada de novo — o país aparece como texto, você escreve a
 * capital, o baralho vai até o fim e errar custa o ponto, não a partida.
 *
 * **Sem relógio**, pela régua do projeto: card onde digitar é o obstáculo,
 * digitação onde o desafio é lembrar. "Uagadugu" não é difícil de escrever, é
 * difícil de lembrar — e quatro alternativas entregariam a resposta por
 * reconhecimento. Sem tempo, escrever por extenso não castiga ninguém.
 *
 * **A tolerância a erro de digitação fica ligada**, ao contrário do mapa. Lá os
 * 195 nomes de país competem entre si na mesma tela e a tolerância aceitaria o
 * vizinho; aqui a trava de vizinhança do validador já recebe as formas de todas
 * as outras cartas do baralho, então "kingstow" não vira ponto nem para Kingston
 * nem para Kingstown — é ambígua, e ambiguidade não é resolvida a favor do
 * jogador. O que sobra da tolerância é o que ela deve ser: misericórdia com
 * "Antananarivo" e "Bandar Seri Begawan", que têm dezoito caracteres e nenhum
 * vizinho. `capitais.test.ts` enumera os pares perigosos para que a decisão
 * continue medida e não suposta.
 */
export const capitais: JogoFlashcard = {
  id: 'capitais',
  mecanica: 'flashcard',
  nome: 'Capitais do mundo',
  icone: '🏛',
  resumo: 'As 195: aparece o país, você escreve a capital.',
  categoria: 'geografia',
  unidade: { singular: 'capital', plural: 'capitais' },
  comoJogar: [
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
    'Acento e maiúscula não importam; "Kabul", "Beijing" e "Madrid" também valem.',
    'Onde há mais de uma sede — África do Sul, Bolívia, Países Baixos —, qualquer uma vale.',
  ],
  config: () => ({
    montarBaralho: (rng) =>
      rng.shuffle(PAISES).map((p): Carta => {
        // `CAPITAIS` cobre os 195 ids, e o teste do dataset é quem garante isso:
        // um país sem capital quebra lá, não aqui em cima do jogador.
        const capital = CAPITAIS[p.id] as Capital
        return {
          tipo: 'digitada',
          id: `capital-${p.id}`,
          pergunta: { kind: 'texto', valor: p.nome },
          resposta: {
            tipo: 'texto',
            canonica: capital.nome,
            aceitas: formasAceitas(capital),
          },
          gabarito: capital.nome,
        }
      }),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
