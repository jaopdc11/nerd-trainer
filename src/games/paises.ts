import { FORMAS, ALTURA_MAPA, INERTES, LARGURA_MAPA } from '@/data/paises-mapa'
import { PAISES } from '@/data/paises'
import type { CelulaGrade, JogoGrade } from '@/core/types'

/**
 * Os 195 países, digitados em ordem livre sobre o mapa-múndi.
 *
 * É a mecânica B inteira, sem nada de novo na lógica: cada acerto cai no lugar
 * certo, o que sobra fica em vermelho. Só o desenho mudou — `path` de SVG no
 * lugar de `linha`/`coluna` —, e é por isso que o mapa do Brasil depois será um
 * arquivo de dados.
 *
 * **Quinze minutos** — eram dez, e subiu junto com o tabuleiro: com os
 * territórios são 204 células, e o relógio tem de acompanhar o que se pede. Sem crédito por acerto:
 * na tabela periódica o tempo não existe, aqui ele é o adversário, e não uma
 * moeda que se reconquista como no gerador.
 *
 * `tolerarTypo` fica **ligado**, e isso foi medido e não suposto — inclusive
 * contra a medição anterior, que estava errada. A conta antiga varria todas as
 * formas contra todas e achava cinco pares a um caractere de distância, mas os
 * cinco eram sinônimos do MESMO país (Bielorrússia/Bielorússia,
 * Tchéquia/Chéquia, Mianmar/Myanmar, Timor-Leste/Timor Leste): ela nunca
 * comparava países diferentes. Refeita separando por país e já com a tolerância
 * escalada por tamanho, dá **zero** pares ambíguos entre os 195 — o par mais
 * próximo é Áustria/Austrália, a distância 2 com limite 1. Ver
 * `paises.test.ts`, que falha se algum dia aparecer um.
 *
 * O que segura o jogo mesmo assim é a trava de vizinhança: um texto que encosta
 * em dois países é recusado nos dois. Digitar num mapa de dez minutos é corrida,
 * e exigir grafia perfeita de "Quirguistão" não mede geografia, mede datilografia.
 */
/**
 * Mensagens que aparecem ao acertar um país específico.
 *
 * Posição política do autor, e não um dado do mapa — por isso mora aqui e não
 * no dataset gerado, que continua sendo a lista da ONU sem edição. A resposta
 * pontua normalmente: o jogo não finge que o país não existe, ele diz o que
 * tem a dizer e segue.
 */
const AVISOS: Readonly<Record<string, string>> = {
  il: 'Israel não é um Estado legítimo',
}

export const paises: JogoGrade = {
  id: 'paises',
  mecanica: 'grade',
  nome: 'Países do mundo',
  icone: '🌍',
  resumo: 'Os 195 no mapa: digite o que lembrar e veja o país acender.',
  categoria: 'geografia',
  unidade: { singular: 'país', plural: 'países' },
  comoJogar: [
    'Quinze minutos. Digite países em qualquer ordem e cada um acende no mapa.',
    'Acento, maiúscula e espaço não importam; "Holanda", "EUA" e "Birmânia" valem.',
    'Uma letra trocada é perdoada — a menos que o que você digitou também sirva para outro país.',
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
        texto: 'Os 195 da ONU, todos. O que sobrou no mapa é bônus.',
      },
    ],
    celulas: PAISES.map(
      (p): CelulaGrade => ({
        id: p.id,
        linha: 1,
        coluna: 1,
        forma: FORMAS[p.id],
        secao: p.continente,
        ...(AVISOS[p.id] ? { aviso: AVISOS[p.id] } : {}),
        gabarito: p.nome,
        detalhe: p.nome,
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
