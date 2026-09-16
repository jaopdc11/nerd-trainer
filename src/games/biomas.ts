import { ESTADOS } from '@/data/estados'
import { ALTURA_MAPA, FORMAS, LARGURA_MAPA } from '@/data/estados-mapa'
import { COMPOSICAO, FICHAS, dominantes, fichaDo } from '@/data/biomas'
import type { Bioma } from '@/data/biomas'
import type { Carta, CelulaGrade, JogoFlashcard, JogoGrade } from '@/core/types'

/**
 * Regiões e biomas do Brasil — e por que são dois jogos, e não um.
 *
 * O pedido original era um só: a mecânica de grade sobre o mapa do Brasil que
 * `estados.ts` já usa, com o bioma como resposta. **Não dá**, e o motivo é
 * mecânico antes de ser cartográfico.
 *
 * **1. A grade livre não aceita resposta repetida.** Em `useGrid`, responder
 * procura a *primeira célula ainda vazia* que aceita o texto. Se as 27 células
 * fossem os estados e a resposta fosse o bioma, digitar "Cerrado" seis vezes
 * acenderia seis estados em ordem de array — o jogador nunca diria *qual*
 * estado é de Cerrado, que é justamente o que o jogo diria estar medindo. O
 * projeto já sabe disso: `capitais.test.ts` trata resposta que serve a duas
 * células como bug e falha se aparecer uma. Um jogo de "estado → bioma" em
 * grade livre seria esse bug, de propósito, 27 vezes.
 *
 * O modo `ordem: 'sorteada'` resolveria a repetição — o motor destaca uma
 * célula por vez —, mas `GridEngine` imprime "Número atômico X?" em cima do
 * alvo, com o texto fixo no componente. Enquanto isso não for um campo do
 * jogo, 'sorteada' pertence à tabela periódica e a mais ninguém.
 *
 * **2. Bioma não é união de UF.** Nem por aproximação: a fronteira entre
 * Cerrado e Mata Atlântica corta Minas Gerais quase ao meio, a do Cerrado com a
 * Amazônia corta Mato Grosso, e o Pantanal é 7% de um estado e 25% de outro.
 * Desenhar os seis biomas emendando contornos de estado seria inventar um mapa
 * e chamá-lo de IBGE. Contorno novo de bioma não sai deste arquivo: sairia de
 * um `gen-biomas.mjs` com a malha do IBGE, e é assim que teria de ser.
 *
 * O que **é** união exata de UF são as cinco regiões — essa é a definição
 * oficial, não uma aproximação. Então o mapa fica com as regiões, onde ele não
 * mente, e os biomas viram baralho, onde a resposta pode ser o que o dado
 * permite dizer: ora um nome, ora dois.
 */

// ---------------------------------------------------------------------------
// Jogo 1 — as cinco regiões, no mapa
// ---------------------------------------------------------------------------

const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] as const
type Regiao = (typeof REGIOES)[number]

/**
 * O contorno de uma região é a concatenação dos contornos das suas UFs.
 *
 * Isso funciona e não é gambiarra: os `d` de `estados-mapa.ts` são polígonos
 * fechados (todos terminam em `Z`) e as UFs não se sobrepõem, então um `path`
 * único com todos os subcaminhos preenche exatamente a união deles sob a regra
 * `nonzero`, que é a padrão do SVG. O traço continua desenhando as divisas
 * internas, e isso foi mantido de propósito: dá para ver quantos estados formam
 * a região sem que o jogo diga quais são.
 *
 * A alternativa seria gerar um contorno dissolvido num script. Custaria uma
 * dependência de geometria e um arquivo gerado a mais para apagar linhas que
 * são informação verdadeira.
 */
function contornoDaRegiao(regiao: Regiao): string {
  const partes = ESTADOS.filter((e) => e.regiao === regiao).map((e) => FORMAS[e.sigla]?.d)
  const faltando = ESTADOS.filter((e) => e.regiao === regiao && !FORMAS[e.sigla])
  if (faltando.length > 0) {
    // Silenciar isto desenharia uma região com buraco no lugar de um estado, e
    // o jogador não teria como saber que o mapa está incompleto.
    throw new Error(`UF sem contorno no mapa: ${faltando.map((e) => e.sigla).join(', ')}`)
  }
  return partes.join('')
}

function ufsDa(regiao: Regiao): readonly string[] {
  return ESTADOS.filter((e) => e.regiao === regiao).map((e) => e.sigla)
}

/**
 * As cinco regiões do IBGE, digitadas sobre o mapa do Brasil.
 *
 * **Sem relógio, e isso é assumir o tamanho do jogo.** São cinco respostas que
 * qualquer pessoa alfabetizada em geografia diz de cabeça; pôr um cronômetro
 * fingiria uma dificuldade que não existe. O que sobra de disputa é o desempate
 * por tempo que toda mecânica de grade já tem: com todo mundo fazendo 5 de 5, o
 * recorde vira quão rápido você acha as cinco. É um aquecimento, e o `resumo`
 * diz isso na cara.
 *
 * **"Região Norte" vale tanto quanto "Norte"**, e o hífen do Centro-Oeste não é
 * cobrado: a normalização do projeto já derruba pontuação e espaço, e quem
 * escreve "centro oeste" sabe exatamente a mesma geografia.
 */
export const regioes: JogoGrade = {
  id: 'regioes',
  mecanica: 'grade',
  nome: 'Regiões do Brasil',
  icone: '🧭',
  resumo: 'As cinco regiões do IBGE no mapa. Curto de propósito: vale pelo tempo.',
  categoria: 'geografia',
  unidade: { singular: 'região', plural: 'regiões' },
  comoJogar: [
    'Digite as cinco regiões em qualquer ordem e cada uma acende no mapa inteira.',
    'Cada região é a soma exata das suas UFs — as divisas dos estados continuam à vista dentro dela.',
    'Sem relógio: com cinco respostas, o que separa uma partida da outra é o tempo.',
    'No fim, o que faltou fica em vermelho no mapa.',
  ],
  config: () => ({
    // Herdados da grade de células e ignorados no layout de mapa.
    linhas: 1,
    colunas: 1,
    layout: {
      tipo: 'mapa',
      largura: LARGURA_MAPA,
      altura: ALTURA_MAPA,
      // As cinco regiões cobrem o país inteiro: não sobra nada para desenhar
      // inerte, ao contrário do mapa-múndi com a Antártida.
      inertes: [],
    },
    celulas: REGIOES.map((regiao): CelulaGrade => {
      const ufs = ufsDa(regiao)
      return {
        id: regiao,
        linha: 1,
        coluna: 1,
        forma: { d: contornoDaRegiao(regiao) },
        gabarito: `${regiao} (${ufs.length} UFs)`,
        detalhe: ufs.join(', '),
        resposta: {
          tipo: 'texto',
          canonica: regiao,
          aceitas: [regiao, `Região ${regiao}`],
        },
      }
    }),
    teclado: 'texto',
    ordem: 'livre',
    mostrarRotulos: false,
  }),
}

// ---------------------------------------------------------------------------
// Jogo 2 — os seis biomas, em baralho
// ---------------------------------------------------------------------------

/**
 * A partir de quantos pontos percentuais o segundo bioma de uma UF é grande
 * demais para a carta ficar calada.
 *
 * Trinta. Abaixo disso o predominante é a resposta e ponto — ninguém precisa
 * ser avisado dos 7% de Pantanal em Mato Grosso para entender que Mato Grosso é
 * amazônico. Acima, a carta estaria dando meia verdade: Minas é 57% Cerrado com
 * 41% de Mata Atlântica, e quem responde "Mata Atlântica" não está errado sobre
 * Minas, está errado sobre a pergunta. O `aviso` existe exatamente para isso —
 * a carta pontua normalmente e o recado aparece do lado.
 */
const SEGUNDO_RELEVANTE = 30

function avisoDaUf(sigla: string, nome: string): string | undefined {
  const fatias = COMPOSICAO[sigla]
  const segundo = fatias?.[1]
  if (!fatias || !segundo || segundo.pct < SEGUNDO_RELEVANTE) return undefined

  const nomes = fatias.filter((f) => f.pct >= SEGUNDO_RELEVANTE).map((f) => f.bioma)
  return dominantes(sigla).length > 1
    ? `${nome} fica meio a meio entre ${nomes.join(' e ')} — as duas respostas valem.`
    : `${nome} não é de um bioma só: ${nomes.join(' e ')} dividem o estado. A carta pede o que ocupa mais área.`
}

/** Todas as grafias que valem para um bioma: o nome e os sinônimos correntes. */
function formasDo(bioma: Bioma): readonly string[] {
  const ficha = fichaDo(bioma)
  return [ficha.nome, ...ficha.sinonimos]
}

/**
 * Estado → bioma predominante, digitado.
 *
 * Digitado e não múltipla escolha, pela régua do projeto — mas aqui a régua
 * quase se inverte, e vale dizer por quê. As respostas possíveis são **seis**, e
 * um card com quatro alternativas entregaria metade do baralho de graça: com
 * seis nomes no mundo, reconhecer não custa nada. Digitar seis nomes que o
 * jogador já viu na tela também não é datilografia — é lembrar qual deles.
 *
 * **Quando o dado empata, as duas valem.** Alagoas é 52/48 entre Mata Atlântica
 * e Caatinga e Sergipe é 51/49: `dominantes()` devolve os dois nomes, os dois
 * entram em `aceitas` e o gabarito diz "X ou Y". Cobrar um só ali seria cobrar
 * de qual edição do mapa de biomas o jogador se lembra, e não o que ele sabe.
 */
function cartaDaUf(sigla: string, nome: string): Carta {
  const alvos = dominantes(sigla)
  const principal = alvos[0] as Bioma
  const aviso = avisoDaUf(sigla, nome)

  return {
    tipo: 'digitada',
    id: `bioma-uf-${sigla}`,
    pergunta: { kind: 'texto', valor: nome },
    dica: 'bioma predominante',
    resposta: {
      tipo: 'texto',
      canonica: principal,
      aceitas: alvos.flatMap((b) => [...formasDo(b)]),
    },
    gabarito: alvos.join(' ou '),
    ...(aviso ? { aviso } : {}),
  }
}

/**
 * Pista → bioma.
 *
 * Estas cartas não são enfeite: **sem elas o Pantanal nunca seria resposta.**
 * Ele não é o bioma predominante de UF nenhuma — é 25% de Mato Grosso do Sul e
 * 7% de Mato Grosso —, então um baralho só de "estado → bioma" teria cinco
 * respostas possíveis e chamaria isso de seis. `biomas.test.ts` trava esse fato
 * justamente para que ninguém apague as pistas achando que são decoração.
 *
 * Cada pista é verdadeira para um bioma e falsa para os outros cinco, e as
 * afirmações verificáveis — "o menor", "nove UFs", "só no Rio Grande do Sul" —
 * são conferidas contra a própria composição no teste do dataset.
 */
function cartaDaPista(bioma: Bioma, pista: string, indice: number): Carta {
  return {
    tipo: 'digitada',
    id: `bioma-pista-${indice}`,
    pergunta: { kind: 'texto', valor: pista },
    dica: 'qual bioma',
    resposta: {
      tipo: 'texto',
      canonica: bioma,
      aceitas: [...formasDo(bioma)],
    },
    gabarito: bioma,
  }
}

function baralho(): readonly Carta[] {
  const porUf = ESTADOS.map((e) => cartaDaUf(e.sigla, e.nome))
  const porPista = FICHAS.flatMap((f, i) =>
    f.pistas.map((p, j) => cartaDaPista(f.nome, p, i * 100 + j)),
  )
  return [...porUf, ...porPista]
}

/**
 * Os seis biomas brasileiros, de dois ângulos.
 *
 * **Baralho e não morte súbita.** Com seis respostas possíveis, morte súbita
 * premiaria o chute: uma em seis é chute bom demais para custar a partida
 * inteira. Indo até o fim, errar custa o ponto e o jogador ainda vê as 39
 * cartas — que é onde está o aprendizado, porque metade do baralho são estados
 * que ele achava que sabia.
 *
 * **O que o jogo não finge.** Sete das 27 cartas de estado vêm com recado: em
 * Minas, Mato Grosso, Maranhão, Piauí e Rio Grande do Sul o segundo bioma passa
 * de 30% do estado, e em Alagoas e Sergipe a diferença é tão pequena que as
 * duas respostas valem. O `comoJogar` diz isso antes de a primeira carta sair —
 * "bioma predominante" é uma pergunta honesta só quando o jogador sabe que é de
 * predominância que se trata.
 */
export const biomas: JogoFlashcard = {
  id: 'biomas',
  mecanica: 'flashcard',
  nome: 'Biomas do Brasil',
  icone: '🌿',
  resumo: 'Os seis biomas: o predominante de cada estado, e o retrato de cada um.',
  categoria: 'geografia',
  unidade: { singular: 'carta', plural: 'cartas' },
  comoJogar: [
    'Aparece um estado, você escreve o bioma que ocupa a maior parte dele.',
    'Estado não tem um bioma só: Minas é Cerrado e Mata Atlântica, Mato Grosso é Amazônia e Cerrado. Vale o de maior área.',
    'Em Alagoas e em Sergipe a divisão é meio a meio, e ali as duas respostas contam.',
    'Outras cartas descrevem o bioma e pedem o nome — é onde o Pantanal aparece, já que ele não é o maior de nenhum estado.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(baralho()),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
