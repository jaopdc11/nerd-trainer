import { ALTURA_MAPA, FORMAS, INERTES, LARGURA_MAPA } from '@/data/paises-mapa'
import { PASSAGENS, pontoDe } from '@/data/estreitos'
import type { CelulaGrade, JogoGrade } from '@/core/types'

/**
 * Estreitos e canais sobre o mapa-múndi — o jogo que ficou no lugar dos oceanos.
 *
 * O pedido era oceanos e mares. Não foi feito, e a razão está por extenso no
 * cabeçalho de `src/data/estreitos.ts`: oceano é área, área precisa de
 * contorno, e o contorno de um oceano é linha de costa de vários continentes
 * mais limites que são **convenção internacional**, não acidente geográfico.
 * Escrever à mão um retângulo e chamá-lo de Atlântico seria pôr no app um mapa
 * que ensina errado — o retângulo ou invade terra, ou é um borrão que o jogador
 * lê como se fosse a extensão do oceano. Contorno de oceano se gera de fonte,
 * num `gen-oceanos.mjs` com as camadas do Natural Earth, ou não se desenha.
 *
 * Estreito, ao contrário, **é um ponto nesta escala** — Gibraltar tem 14 km,
 * que aqui dão 0,35 px. O marcador não afirma extensão nenhuma, que era
 * exatamente o problema do oceano, e a coordenada de cada um é fato publicado.
 * É a mesma geografia física que o pedido queria, feita com a representação que
 * o dado sustenta.
 *
 * **O mapa aqui é o gabarito, não o enunciado.** Os trinta pontos são iguais
 * entre si enquanto apagados, então ninguém joga "olhando o mapa": joga
 * despejando o que lembra, que é a mecânica B como ela é em países. O desenho
 * paga no fim — os vermelhos mostram onde ficava o que você não sabia que
 * existia, e isso é mais ensino do que qualquer lista alfabética.
 */

/**
 * Todo o planeta ao fundo, em cinza e sem valer ponto.
 *
 * Os 204 contornos de `paises-mapa.ts` viram inerte: aqui a terra é referência
 * para achar a água, e um país aceso confundiria o tabuleiro. Micro-estado fica
 * de fora sem prejuízo — ele é ponto, não tem `d`, e um círculo a mais no mapa
 * só disputaria atenção com os marcadores que valem.
 */
const PLANETA: readonly { readonly id: string; readonly d: string }[] = [
  ...Object.entries(FORMAS).flatMap(([id, forma]) => ('d' in forma ? [{ id, d: forma.d }] : [])),
  ...INERTES,
]

/**
 * As trinta passagens, digitadas em ordem livre sobre o mapa-múndi.
 *
 * **Cinco minutos.** São trinta respostas curtas e o relógio existe para
 * impedir a varredura mental: quem sabe, sabe rápido; quem não sabe, não chega
 * lá listando tudo que termina em "-estreito". Contra os quinze minutos dos 204
 * países, é a mesma régua — tempo proporcional ao tabuleiro, sem crédito por
 * acerto.
 *
 * **A forma curta vale.** "Gibraltar", "Ormuz", "Drake", "Suez" — ninguém que
 * sabe onde fica Bab-el-Mandeb deixa de saber por escrever só "Mandeb", e
 * exigir "Estreito de" trinta vezes mede teclado. "Formosa" vale por Taiwan e
 * "Helesponto" por Dardanelos: são os nomes que o jogador aprendeu na aula de
 * história, e o jogo não está cobrando qual edição do atlas ele leu.
 *
 * `tolerarTypo` fica no padrão, ligado, e isso é medido em `estreitos.test.ts`
 * — nenhum par de nomes, curtos inclusive, cai dentro do raio de perdão do
 * outro. "Bass" e "Bab" são os mais próximos, e ambos são curtos demais para
 * receber tolerância nenhuma.
 */
export const estreitos: JogoGrade = {
  id: 'estreitos',
  mecanica: 'grade',
  nome: 'Estreitos e canais',
  icone: '🌊',
  resumo: 'Os trinta gargalos do planeta: digite e veja o ponto acender no mapa-múndi.',
  categoria: 'geografia',
  unidade: { singular: 'passagem', plural: 'passagens' },
  comoJogar: [
    'Cinco minutos. Digite os estreitos e canais em qualquer ordem e cada um acende no mapa.',
    'A forma curta basta: "Gibraltar", "Ormuz", "Drake". "Formosa" vale por Taiwan, "Helesponto" por Dardanelos.',
    'O marcador é um ponto porque nesta escala um estreito é um ponto — Gibraltar tem 14 km, menos de meio pixel.',
    'Seis deles aparecem sobre a terra cinza: Suez, Panamá, Kiel, Corinto, Öresund e Dardanelos são mais estreitos que a resolução do mapa.',
  ],
  config: () => ({
    // Herdados da grade de células e ignorados no layout de mapa.
    linhas: 1,
    colunas: 1,
    layout: {
      tipo: 'mapa',
      largura: LARGURA_MAPA,
      altura: ALTURA_MAPA,
      inertes: PLANETA,
    },
    limiteSegundos: 300,
    marcos: [
      {
        // Os quatro escavados são uma lista fechada e verificável — obra com
        // data de inauguração —, ao contrário de "os estreitos importantes",
        // que é opinião. É o único marco que o dataset autoriza.
        ids: PASSAGENS.filter((p) => p.tipo === 'escavado').map((p) => p.id),
        texto: 'Os quatro canais escavados por gente, todos. O resto é acidente geográfico.',
      },
    ],
    celulas: PASSAGENS.map(
      (p): CelulaGrade => ({
        id: p.id,
        linha: 1,
        coluna: 1,
        forma: pontoDe(p),
        secao: p.bacia,
        // O gabarito é o que se lê depois de errar, então carrega a informação
        // que faz o nome significar alguma coisa: o estreito é o que ele liga.
        gabarito: `${p.nome} — ${p.liga}`,
        detalhe: p.separa,
        resposta: {
          tipo: 'texto',
          canonica: p.nome,
          aceitas: [p.nome, ...p.sinonimos],
        },
      }),
    ),
    teclado: 'texto',
    ordem: 'livre',
    mostrarRotulos: false,
  }),
}
