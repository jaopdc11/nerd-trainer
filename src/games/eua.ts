import { ALTURA_MAPA, FORMAS, INERTES, LARGURA_MAPA } from '@/data/eua-mapa'
import { ESTADOS_EUA } from '@/data/eua'
import type { CelulaGrade, JogoGrade } from '@/core/types'

/**
 * Os 50 estados dos EUA (mais DC), digitados em ordem livre sobre o mapa.
 *
 * É a mecânica B de novo, sem nada de novo na lógica: cada acerto cai na sua
 * célula, o que sobra fica em vermelho. É o irmão americano do jogo dos estados
 * do Brasil — mesmo layout de mapa, mesmo gabarito agrupado —, e como lá o
 * distrito federal (DC, análogo ao DF) é uma célula respondível: são 51 peças,
 * 50 estados mais o Distrito de Colúmbia.
 *
 * **A sigla vale como resposta**, e o nome em inglês também. Quem sabe onde fica
 * a Califórnia não deixa de saber por escrever "CA" ou "California"; exigir a
 * grafia em português de "Pensilvânia" contra o relógio mede teclado, não
 * geografia. Como `texto`, a caixa e o acento não importam: "ny", "NY",
 * "Nova York" e "New York" caem todos na mesma célula.
 *
 * **Cinco minutos.** Os irmãos dão ~6,7 s por célula no Brasil (180 s / 27) e
 * ~4,4 s no mundo (900 s / 204): o ritmo por peça cai conforme o tabuleiro
 * cresce e o jogador entra em rajada. São 51 células aqui, mais perto do Brasil,
 * então 300 s dá ~5,9 s por célula — dentro da faixa dos dois, e no lado
 * generoso de propósito, porque para um público brasileiro os nomes americanos
 * são menos familiares que os das próprias UFs.
 *
 * `tolerarTypo` fica **ligado**, como no Brasil e ao contrário do mapa-múndi, e
 * a diferença é medida e não sentida: `eua.test.ts` confere que nenhum dos 51
 * nomes cai dentro do raio de perdão de outro (o par mais próximo, Kansas /
 * Arkansas, fica a distância 2 com limite 1). As siglas não entram nessa conta:
 * com duas letras, nenhuma chega ao tamanho mínimo que a tolerância exige.
 */
export const eua: JogoGrade = {
  id: 'eua',
  mecanica: 'grade',
  nome: 'Estados dos EUA',
  icone: '🇺🇸',
  resumo: 'Os 50 estados no mapa: digite o nome ou a sigla e veja o estado acender.',
  categoria: 'geografia',
  unidade: { singular: 'estado', plural: 'estados' },
  comoJogar: [
    'Cinco minutos. Digite os estados em qualquer ordem e cada um acende no mapa.',
    'A sigla vale: "CA" é o mesmo que "Califórnia", e "California" também. Acento e maiúscula não importam.',
    'Uma letra trocada é perdoada, a menos que sirva também para outro estado.',
    'No fim, o gabarito vem por região: em verde o que saiu, em vermelho o que faltou.',
  ],
  config: () => ({
    // Herdados da grade de células e ignorados no layout de mapa.
    linhas: 1,
    colunas: 1,
    layout: {
      tipo: 'mapa',
      largura: LARGURA_MAPA,
      altura: ALTURA_MAPA,
      // O contorno do país é a soma das 51 peças: não há o que desenhar inerte.
      inertes: INERTES,
    },
    limiteSegundos: 300,
    celulas: ESTADOS_EUA.map(
      (e): CelulaGrade => ({
        id: e.sigla,
        linha: 1,
        coluna: 1,
        forma: FORMAS[e.sigla],
        secao: e.regiao,
        gabarito: `${e.nome} (${e.sigla})`,
        detalhe: `${e.nome} — ${e.regiao}`,
        resposta: {
          tipo: 'texto',
          canonica: e.nome,
          aceitas: [e.nome, e.sigla, ...e.sinonimos],
        },
      }),
    ),
    teclado: 'texto',
    ordem: 'livre',
    mostrarRotulos: false,
  }),
}
