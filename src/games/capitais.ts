import { CAPITAIS, formasAceitas } from '@/data/capitais'
import type { Capital } from '@/data/capitais'
import { PAISES } from '@/data/paises'
import { ALTURA_MAPA, FORMAS, INERTES, LARGURA_MAPA } from '@/data/paises-mapa'
import { AVISOS } from './avisos'
import type { CelulaGrade, JogoGrade } from '@/core/types'

/**
 * As capitais do mundo, digitadas em ordem livre sobre o mapa-múndi.
 *
 * É o mesmo tabuleiro do "Países do mundo" com a pergunta virada do avesso: lá
 * você diz o país e o país acende; aqui você diz **a capital** e quem acende é o
 * país que ela governa. O mapa deixa de ser ilustração e vira o placar — dá para
 * ver a África inteira apagada e saber exatamente o que falta estudar.
 *
 * Foi flashcard antes, e como flashcard não funcionava: o card mostrava um país
 * por vez e o baralho de 204 cartas passava obrigando a pular país por país, sem
 * nunca mostrar o todo. Nomear em ordem livre é outro jogo — você despeja o que
 * sabe, na ordem em que lembra, e o que sobra no mapa é o diagnóstico.
 *
 * **Quinze minutos**, o mesmo do irmão, e de propósito: são os mesmos 204
 * alvos, e ter dois relógios diferentes para o mesmo tabuleiro só faria os dois
 * placares deixarem de ser comparáveis.
 *
 * `tolerarTypo` fica ligado, como no mapa de países, e pelo mesmo motivo: a
 * trava de vizinhança do validador recebe as formas de todas as outras células,
 * então "kingstow" não vira ponto nem para Kingston nem para Kingstown — os dois
 * únicos nomes a um caractere de distância no baralho inteiro, medidos em
 * `data/capitais.test.ts`. O que sobra da tolerância é misericórdia com
 * "Antananarivo" e "Bandar Seri Begawan", que ninguém digita em quinze minutos
 * de corrida sem trocar uma letra.
 */
export const capitais: JogoGrade = {
  id: 'capitais',
  mecanica: 'grade',
  nome: 'Capitais do mundo',
  icone: '🏛',
  resumo: 'Digite capitais e veja o país de cada uma acender no mapa.',
  categoria: 'geografia',
  unidade: { singular: 'capital', plural: 'capitais' },
  comoJogar: [
    'Quinze minutos. Digite capitais em qualquer ordem e o país de cada uma acende.',
    'Acento e maiúscula não importam; "Kabul", "Beijing" e "Madrid" também valem.',
    'Onde há mais de uma sede — África do Sul, Bolívia, Países Baixos —, qualquer uma vale.',
    'No fim, o gabarito vem por continente: em verde o que saiu, em vermelho o que faltou.',
  ],
  config: () => ({
    // Herdados da grade de células e ignorados no layout de mapa.
    linhas: 1,
    colunas: 1,
    layout: {
      tipo: 'mapa',
      largura: LARGURA_MAPA,
      altura: ALTURA_MAPA,
      inertes: INERTES,
    },
    limiteSegundos: 900,
    marcos: [
      {
        ids: PAISES.filter((p) => p.soberano).map((p) => p.id),
        texto: 'As 195 capitais da ONU, todas. O que sobrou no mapa é bônus.',
      },
    ],
    celulas: PAISES.map((p): CelulaGrade => {
      // `CAPITAIS` cobre os mesmos ids de `PAISES`, e o teste do dataset é quem
      // garante: um país sem capital seria célula sem resposta possível.
      const capital = CAPITAIS[p.id] as Capital

      return {
        id: p.id,
        linha: 1,
        coluna: 1,
        forma: FORMAS[p.id],
        secao: p.continente,
        ...(AVISOS[p.id] ? { aviso: AVISOS[p.id] } : {}),
        // O país entra no gabarito junto da capital: no fim da partida, "Gitega"
        // sozinho não diz a quem olha o mapa que o Burundi é que ficou vermelho.
        gabarito: `${capital.nome} (${p.nome})`,
        detalhe: `${capital.nome} — ${p.nome}`,
        resposta: {
          tipo: 'texto',
          canonica: capital.nome,
          aceitas: formasAceitas(capital),
        },
      }
    }),
    teclado: 'texto',
    ordem: 'livre',
    mostrarRotulos: false,
  }),
}
