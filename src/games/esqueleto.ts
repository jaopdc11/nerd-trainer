import { ALTURA_CORPO, LARGURA_CORPO, OSSOS, SILHUETA } from '@/data/esqueleto'
import type { CelulaGrade, JogoGrade } from '@/core/types'

/**
 * Os 32 ossos, digitados em ordem livre sobre o desenho do corpo.
 *
 * É o mapa-múndi outra vez, e de propósito: mesma mecânica B, mesmo layout de
 * `mapa`, mesmo gabarito agrupado — trocou o arquivo de dados e mais nada. O que
 * a engine chama de "mapa" nunca foi sobre geografia; é "um `path` por célula,
 * acende quem for dito", e um corpo humano serve tão bem quanto um planeta.
 *
 * A diferença que precisa estar escrita está no cabeçalho de `src/data/esqueleto.ts`:
 * o contorno dos países é malha do Natural Earth, e o deste boneco é desenhado à
 * mão. Não é a mesma licença que o jogo de oceanos não teve — lá o problema era
 * afirmar, com um retângulo inventado, onde termina um oceano; aqui um esqueleto
 * didático **é** um esquema, e a prancha da parede da sala de aula também é. O
 * que o desenho promete (posição relativa, proporção grosseira, simetria) está
 * medido em `esqueleto.test.ts`, e o que ele não promete está dito lá também.
 *
 * **Quatro minutos.** A régua é a dos irmãos, por item e não por relógio: 27 UFs
 * em 180 s dão 6,7 s cada, e são rajada pura; 30 estreitos em 300 s dão 10 s
 * cada, e ali cada resposta é garimpo. Osso fica no meio — a lista é fechada e
 * decorável como a das UFs, mas "vértebras torácicas" e "falanges do pé" custam
 * o dobro de teclas que "Pará" —, então 240 s para 32 células, 7,5 s cada.
 * Sem crédito por acerto: o tempo aqui é adversário, não moeda de gerador.
 *
 * **O nome de escola vale.** Rótula, omoplata, perônio e cúbito são o que se
 * ensina na maior parte das escolas do país, e recusá-los mediria qual edição da
 * apostila o jogador leu. `esqueleto.test.ts` confere que cada um desses cai na
 * célula certa.
 *
 * `tolerarTypo` fica no padrão, ligado, e isso é medido: nenhum par de nomes
 * — nem "tíbia"/"fíbula", nem "ílio"/"ísquio", nem "metacarpo"/"metatarso" —
 * cai dentro do raio de perdão do outro. Os pares curtos nem chegam a receber
 * tolerância: abaixo de sete caracteres o limite é zero.
 */
export const esqueleto: JogoGrade = {
  id: 'esqueleto',
  mecanica: 'grade',
  nome: 'Esqueleto humano',
  icone: '🦴',
  resumo: 'Os 32 ossos no corpo: digite o nome e veja cada um acender no desenho.',
  categoria: 'biologicas',
  unidade: { singular: 'osso', plural: 'ossos' },
  comoJogar: [
    'Quatro minutos. Digite os ossos em qualquer ordem e cada um acende no desenho.',
    'O nome de escola vale: "rótula", "omoplata", "perônio" e "cúbito" acendem patela, escápula, fíbula e ulna.',
    'O corpo está de frente e a cabeça de perfil — de frente não dá para ver occipital nem parietal.',
    'No fim, o gabarito vem por região: em verde o que saiu, em vermelho o que faltou.',
  ],
  config: () => ({
    // Herdados da grade de células e ignorados no layout de mapa.
    linhas: 1,
    colunas: 1,
    layout: {
      tipo: 'mapa',
      largura: LARGURA_CORPO,
      altura: ALTURA_CORPO,
      // A silhueta do corpo, em cinza: é o "mapa" sobre o qual os ossos acendem,
      // e nenhuma peça dela vale ponto — como a Groenlândia no mapa-múndi.
      inertes: SILHUETA,
    },
    limiteSegundos: 240,
    marcos: [
      {
        // Os sete do crânio são a lista que a prova de escola cobra fechada, e
        // num tabuleiro de 32 fechá-la passaria batido sem isto.
        ids: OSSOS.filter((o) => o.regiao === 'Crânio').map((o) => o.id),
        texto: 'Os sete do crânio, todos. O resto do corpo é o que sobra.',
      },
      {
        ids: ['ilio', 'isquio', 'pubis'],
        texto: 'Ílio, ísquio e púbis: os três que se fundem num osso só do quadril.',
      },
    ],
    celulas: OSSOS.map(
      (o): CelulaGrade => ({
        id: o.id,
        linha: 1,
        coluna: 1,
        forma: o.forma,
        secao: o.regiao,
        // O gabarito leva a quantidade porque é ela que responde a pergunta que
        // todo mundo faz depois de errar "costelas": quantas, afinal.
        gabarito: `${o.nome} (${o.quantidade})`,
        detalhe: o.detalhe,
        resposta: {
          tipo: 'texto',
          canonica: o.nome,
          aceitas: [o.nome, ...o.sinonimos],
        },
      }),
    ),
    teclado: 'texto',
    ordem: 'livre',
    mostrarRotulos: false,
  }),
}
