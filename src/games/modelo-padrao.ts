import {
  cargaEmFracao,
  COLUNAS_GRADE,
  formasAceitas,
  LINHAS_GRADE,
  PARTICULAS,
  ROTULO_FAMILIA,
  spinEmFracao,
} from '@/data/modelo-padrao'
import type { Particula } from '@/data/modelo-padrao'
import type { CelulaGrade, JogoGrade } from '@/core/types'

/**
 * O quadro do Modelo Padrão preenchido pelo nome das partículas, em ordem livre.
 *
 * É a tabela periódica com outro dataset, de propósito: mesma mecânica, mesma
 * régua de resposta, mesmo gesto de despejar o que se lembra. O que muda é a
 * escala — 17 células contra 118 —, e é essa diferença que decide tudo abaixo.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NÃO É CRONOMETRADO
 * ---------------------------------------------------------------------------
 *
 * A pergunta parece de gosto e não é. `ResultadoRun` já desempata recorde por
 * menor `duracaoMs`, e num baralho de 17 *todo mundo que sabe vai fechar os
 * 17*: a pontuação satura, e o ranking passa a ser tempo de qualquer jeito. O
 * relógio já está lá, só que como desempate em vez de como carrasco.
 *
 * Pôr um limite por cima disso muda o que o jogo mede, e para pior. As respostas
 * têm acento em quase metade dos casos — múon, glúon, fóton, elétron — e três
 * delas são compostas ("neutrino do múon"). Com cronômetro, quem sabe as 17 mas
 * digita devagar perde para quem sabe 14 e digita rápido; o jogo teria virado
 * teste de teclado, que é justamente a crítica que derrubou outros desenhos
 * neste projeto. O mapa-múndi tem dez minutos porque 195 países sem relógio é
 * uma sessão de vinte minutos que ninguém termina; 17 partículas se resolvem em
 * quarenta segundos e não precisam de pressão emprestada.
 *
 * A tabela periódica, com 118, também não tem relógio. Seria estranho o irmão
 * menor ser o apertado.
 *
 * ---------------------------------------------------------------------------
 * OUTRAS DECISÕES
 * ---------------------------------------------------------------------------
 *
 * **`rotulo` é o símbolo, e o símbolo nunca é resposta.** Mesma função do número
 * atômico na tabela periódica: é a pista que torna a célula identificável sem
 * entregar o nome. O dataset tem teste garantindo que nenhuma forma aceita
 * coincide com um símbolo do quadro — sem ele, "Z" preencheria a célula do Z
 * copiando o que está escrito nela.
 *
 * **`gabarito` é o nome curto, `detalhe` é o completo.** A célula é quadrada e
 * pequena; o motor escreve `gabarito` dentro dela, e "Neutrino do elétron" não
 * cabe em tamanho de fonte legível. O nome inteiro, mais carga e spin, vai para
 * o tooltip — que a engine só mostra depois que a célula foi revelada, então não
 * há risco de entregar resposta.
 *
 * **`secao` por família, e não por geração.** O gabarito do fim agrupa por
 * seção, e a pergunta que ele precisa responder é "de que lado você é fraco":
 * quem esquece bóson esquece os quatro, quem esquece neutrino esquece os três.
 * Agrupar por geração espalharia cada esquecimento por três blocos e não
 * diagnosticaria nada.
 *
 * **Dois marcos, e não um por família.** Fechar os 12 férmions e fechar os 5
 * bósons são os dois feitos que existem aqui — é a divisão matéria × interação,
 * que é a única coisa que o quadro realmente ensina. Um marco por família daria
 * quatro recados numa partida de quarenta segundos, e recado demais é o mesmo
 * que recado nenhum.
 */

/** Uma linha de tooltip que diz algo além do nome: geração, carga e spin. */
function detalheDe(p: Particula): string {
  const geracao = p.geracao === null ? ROTULO_FAMILIA[p.familia] : `${p.geracao}ª geração`
  return `${p.nome} · ${geracao} · carga ${cargaEmFracao(p)} · spin ${spinEmFracao(p)}`
}

/** Matéria × interação: a única divisão que o quadro de fato ensina. */
const idsPorLado = (lado: 'materia' | 'forca'): readonly string[] =>
  PARTICULAS.filter((p) =>
    lado === 'materia'
      ? p.familia === 'quark' || p.familia === 'lepton'
      : p.familia === 'gauge' || p.familia === 'escalar',
  ).map((p) => p.id)

export const modeloPadrao: JogoGrade = {
  id: 'modelo-padrao',
  mecanica: 'grade',
  nome: 'Modelo Padrão',
  icone: 'ν',
  resumo: 'As 17 partículas elementares, preenchidas na ordem que você lembrar.',
  categoria: 'fisica',
  unidade: { singular: 'partícula', plural: 'partículas' },
  comoJogar: [
    'Digite as partículas na ordem que quiser: cada acerto cai na célula certa do quadro.',
    'O símbolo fica visível como pista — a resposta é sempre o nome, então "W" não vale pelo bóson W.',
    'Inglês ou português: "quark strange" e "quark estranho" valem igual; acento e maiúscula não importam.',
    'Não tem relógio. O placar é quantas das 17 você lembrou; o tempo só desempata recorde.',
  ],
  config: () => ({
    linhas: LINHAS_GRADE,
    colunas: COLUNAS_GRADE,
    celulas: PARTICULAS.map(
      (p): CelulaGrade => ({
        id: p.id,
        linha: p.linha,
        coluna: p.coluna,
        rotulo: p.simbolo,
        grupo: p.familia,
        secao: ROTULO_FAMILIA[p.familia],
        gabarito: p.curto,
        detalhe: detalheDe(p),
        resposta: {
          tipo: 'texto',
          canonica: p.nome,
          aceitas: formasAceitas(p),
        },
      }),
    ),
    marcos: [
      {
        ids: idsPorLado('materia'),
        texto: 'Os 12 férmions: toda a matéria que existe cabe nestas doze células.',
      },
      {
        ids: idsPorLado('forca'),
        texto: 'Os 5 bósons: as forças e o campo que dá massa a tudo o mais.',
      },
    ],
    teclado: 'texto',
    ordem: 'livre',
    mostrarRotulos: true,
    // Sem `limiteSegundos`: ver a nota no topo do arquivo.
  }),
}
