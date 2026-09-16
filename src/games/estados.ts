import { ALTURA_MAPA, FORMAS, LARGURA_MAPA } from '@/data/estados-mapa'
import { ESTADOS } from '@/data/estados'
import type { CelulaGrade, JogoGrade } from '@/core/types'

/**
 * As 27 UFs, digitadas em ordem livre sobre o mapa do Brasil.
 *
 * É o mapa-múndi outra vez, e de propósito: mesma mecânica B, mesmo layout de
 * mapa, mesmo gabarito agrupado — só trocou o arquivo de dados. Era exatamente
 * isso que o jogo dos países previa quando disse que "o mapa do Brasil depois
 * será um arquivo de dados", e o jogo inteiro cabe nesta página porque a engine
 * já sabia tudo que precisava saber.
 *
 * **A sigla vale como resposta.** Ninguém que sabe onde fica o Amapá deixa de
 * saber por escrever AP, e num mapa de 27 peças digitar "Rio Grande do Norte"
 * por extenso mede teclado, não geografia. Como `texto`, a caixa não importa:
 * "sp", "SP" e "São Paulo" caem todos na mesma célula.
 *
 * **Três minutos**, contra os dez do mundo: são 27 itens e não 195, e o ritmo
 * aqui é de rajada — o tempo é o adversário, sem crédito por acerto.
 *
 * `tolerarTypo` fica **ligado**, ao contrário do mapa-múndi, e a diferença é
 * medida e não sentida: entre 195 países há pares a um caractere de distância, e
 * aqui `estados.test.ts` confere que nenhum dos 27 nomes cai dentro do raio de
 * perdão de outro. Perder Pernambuco por uma letra seria gratuito. As siglas
 * não entram nessa conta: com duas letras, nenhuma delas chega ao tamanho
 * mínimo que a tolerância exige.
 */
export const estados: JogoGrade = {
  id: 'estados',
  mecanica: 'grade',
  nome: 'Estados do Brasil',
  icone: '🇧🇷',
  resumo: 'As 27 UFs no mapa: digite o nome ou a sigla e veja o estado acender.',
  categoria: 'geografia',
  unidade: { singular: 'estado', plural: 'estados' },
  comoJogar: [
    'Três minutos. Digite os estados em qualquer ordem e cada um acende no mapa.',
    'A sigla vale: "MG" é o mesmo que "Minas Gerais". Acento e maiúscula não importam.',
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
      // O contorno do país é a soma das 27 peças: não há o que desenhar inerte.
      inertes: [],
    },
    limiteSegundos: 180,
    celulas: ESTADOS.map(
      (e): CelulaGrade => ({
        id: e.sigla,
        linha: 1,
        coluna: 1,
        forma: FORMAS[e.sigla],
        secao: e.regiao,
        gabarito: `${e.nome} (${e.sigla})`,
        detalhe: `${e.nome} — ${e.capital}`,
        resposta: {
          tipo: 'texto',
          canonica: e.nome,
          aceitas: [e.nome, e.sigla],
        },
      }),
    ),
    teclado: 'texto',
    ordem: 'livre',
    mostrarRotulos: false,
  }),
}
