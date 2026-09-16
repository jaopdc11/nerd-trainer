import {
  CORPOS,
  PLANETAS,
  POR_GRAVIDADE,
  POR_PERIODO,
  POR_RAIO,
  exibirDistancia,
  exibirGravidade,
  exibirPeriodo,
  exibirRaio,
  ordinal,
} from '@/data/sistema-solar'
import type { Corpo } from '@/data/sistema-solar'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Sistema Solar.
 *
 * **O problema que este jogo tem de resolver antes de existir:** os oito
 * planetas em ordem são oito itens, e todo mundo já sabe os oito. Como
 * sequência isso dura onze segundos e mede a lembrança de uma frase decorada na
 * quarta série; como baralho, acaba antes de a pessoa se sentar. Os dois
 * caminhos óbvios de crescimento foram testados na cabeça e um foi descartado:
 *
 * - **descartado — perguntar quantas luas cada planeta tem.** É o dado mais
 *   chamativo que existe aqui e é exatamente o que não se pode gravar: Saturno
 *   saltou de 82 para mais de 270 satélites confirmados entre 2019 e 2025. Um
 *   número desses fica errado sozinho, sem ninguém tocar no arquivo.
 * - **adotado — quatro perguntas sobre treze corpos.** Entram os cinco anões da
 *   IAU, e o mesmo acervo passa a render ordem a partir do Sol (8 cartas),
 *   comparação de tamanho (10), duração do ano (12) e gravidade de superfície
 *   (8): 38 cartas de um dataset de treze linhas, sem inventar fato nenhum.
 *
 * A carta de ordem é **digitada** e o resto é **escolha**, e a diferença não é
 * estética. "Qual é o 4º planeta" tem uma resposta que a pessoa tem na ponta da
 * língua ou não tem — oferecer quatro nomes ali trocaria lembrar por
 * reconhecer, que é a régua do projeto. Já "quanto dura o ano de Netuno" só
 * funciona como escolha: digitar "164,79" contra o teclado mediria digitação, e
 * o erro que interessa pegar — confundir os 84 anos de Urano com os 165 de
 * Netuno — só aparece quando os dois números estão na tela ao mesmo tempo.
 */

/**
 * Os três vizinhos de um corpo num ranking, pulando quem exibe o mesmo texto.
 *
 * Vizinho de ranking é o distrator que mede alguma coisa: para os 84 anos de
 * Urano, as opções que importam são os 30 de Saturno e os 165 de Netuno, não os
 * 88 dias de Mercúrio, que quem sabe qualquer coisa elimina de longe.
 *
 * O filtro por **texto exibido**, e não por corpo, é obrigatório e não é
 * paranoia: com uma casa decimal, Vênus e Urano exibem os mesmos 8,9 m/s² —
 * eles têm mesmo a mesma gravidade — e Mercúrio e Marte os mesmos 3,7. Sem o
 * filtro, a carta de Urano teria duas alternativas idênticas e a resposta certa
 * apareceria duas vezes. Duas casas decimais "resolveriam" o empate de Mercúrio
 * e Marte (3,70 contra 3,71) criando um problema pior: escolher entre 3,70 e
 * 3,71 é sorteio, não conhecimento.
 */
function vizinhos(
  ranking: readonly Corpo[],
  alvo: Corpo,
  exibir: (c: Corpo) => string,
  quantos: number,
): readonly Corpo[] {
  const centro = ranking.indexOf(alvo)
  const textoCerto = exibir(alvo)
  const escolhidos: Corpo[] = []
  const vistos = new Set<string>([textoCerto])

  // 1, −1, 2, −2, 3, −3…: a distância no ranking é a medida de "quão tentador".
  for (let passo = 1; passo < ranking.length && escolhidos.length < quantos; passo++) {
    for (const lado of [1, -1]) {
      const c = ranking[centro + passo * lado]
      if (!c || escolhidos.length === quantos) continue
      const texto = exibir(c)
      if (vistos.has(texto)) continue
      vistos.add(texto)
      escolhidos.push(c)
    }
  }
  return escolhidos
}

function cartaDeValor(
  id: string,
  pergunta: string,
  alvo: Corpo,
  ranking: readonly Corpo[],
  exibir: (c: Corpo) => string,
  gabarito: string,
  rng: Rng,
): Carta {
  const certo = exibir(alvo)
  const opcoes = rng.shuffle([certo, ...vizinhos(ranking, alvo, exibir, 3).map(exibir)])
  return {
    tipo: 'escolha',
    id,
    pergunta: { kind: 'texto', valor: pergunta },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(certo),
    gabarito,
  }
}

// --- família 1: a ordem a partir do Sol, digitada ----------------------------

function cartasOrdem(): readonly Carta[] {
  return PLANETAS.map((p): Carta => {
    const posicao = p.ordem as number
    return {
      tipo: 'digitada',
      id: `solar-ordem-${p.id}`,
      pergunta: { kind: 'texto', valor: `${ordinal(posicao)} planeta a partir do Sol` },
      dica: 'planeta',
      resposta: {
        tipo: 'texto',
        canonica: p.nome,
        aceitas: [p.nome],
        // A tolerância a erro de digitação fica **ligada**, ao contrário do
        // grego e dos prefixos SI, onde as respostas são curtas e vizinhas
        // (pico/peta, ni/mi). Aqui nenhum par de nomes chega perto o bastante
        // para um dedo errado trocar um planeta por outro, e o teste deste
        // arquivo confere isso nome a nome. As oito cartas digitadas do baralho
        // são justamente estes oito nomes, então a trava de vizinhança do motor
        // tem a lista inteira em mãos para recusar o ambíguo.
      },
      gabarito: `${p.nome}, a ${exibirDistancia(p.semieixoUA)} do Sol`,
    }
  })
}

// --- família 2: quem é maior -------------------------------------------------

/**
 * Janela de quatro corpos consecutivos no ranking de raio: a resposta é sempre
 * o primeiro da janela.
 *
 * É o formato que força a comparação que interessa. Perguntar "qual é o maior
 * planeta" uma vez só é uma carta; deslizar a janela pelos treze corpos dá dez
 * cartas e coloca lado a lado exatamente os pares que enganam — Urano contra
 * Netuno, Vênus contra Terra, Plutão contra Éris. A alternativa descartada era
 * sortear quatro corpos quaisquer: metade das cartas sairia "Júpiter contra
 * Ceres", que não pergunta nada.
 */
function cartasTamanho(rng: Rng): readonly Carta[] {
  const saida: Carta[] = []
  for (let i = 0; i + 4 <= POR_RAIO.length; i++) {
    const janela = POR_RAIO.slice(i, i + 4)
    const maior = janela[0] as Corpo
    const opcoes = rng.shuffle(janela.map((c) => c.nome))
    saida.push({
      tipo: 'escolha',
      id: `solar-maior-${maior.id}`,
      pergunta: { kind: 'texto', valor: 'Qual destes é o maior?' },
      alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
      indiceCorreto: opcoes.indexOf(maior.nome),
      gabarito: `${maior.nome} — raio de ${exibirRaio(maior.raioKm)}`,
    })
  }
  return saida
}

// --- família 3: a duração do ano ---------------------------------------------

function cartasPeriodo(rng: Rng): readonly Carta[] {
  // A Terra fica de fora: "quanto dura o ano da Terra" não é uma pergunta, é
  // uma definição — e nenhum distrator disfarçaria o "1 ano" na tela. Ela
  // continua servindo de distrator para Vênus e Marte, que é onde ela ajuda.
  return CORPOS.filter((c) => c.id !== 'terra').map((c) =>
    cartaDeValor(
      `solar-ano-${c.id}`,
      `Quanto dura o ano de ${c.nome}?`,
      c,
      POR_PERIODO,
      (x) => exibirPeriodo(x.periodoAnos),
      `${exibirPeriodo(c.periodoAnos)} — ${c.nome} orbita a ${exibirDistancia(c.semieixoUA)} do Sol`,
      rng,
    ),
  )
}

// --- família 4: a gravidade de superfície ------------------------------------

function cartasGravidade(rng: Rng): readonly Carta[] {
  // Só planeta, porque só planeta tem gravidade no dataset — e pelo motivo
  // explicado lá: nos anões o valor é mal determinado, e 0,3 m/s² numa lista de
  // planetas se elimina sozinho.
  return PLANETAS.map((p) =>
    cartaDeValor(
      `solar-g-${p.id}`,
      `Gravidade na superfície de ${p.nome}`,
      p,
      POR_GRAVIDADE,
      (x) => exibirGravidade(x.gravidade as number),
      `${exibirGravidade(p.gravidade as number)} — ${p.nota}`,
      rng,
    ),
  )
}

/** As quatro famílias embaralhadas juntas: a variedade é o que segura o baralho. */
export function montarBaralhoSolar(rng: Rng): readonly Carta[] {
  return rng.shuffle([
    ...cartasOrdem(),
    ...cartasTamanho(rng),
    ...cartasPeriodo(rng),
    ...cartasGravidade(rng),
  ])
}

export const sistemaSolar: JogoFlashcard = {
  id: 'sistema-solar',
  mecanica: 'flashcard',
  nome: 'Sistema Solar',
  icone: '🪐',
  resumo: 'Os oito planetas e os cinco anões: ordem, tamanho, ano e gravidade.',
  categoria: 'fisica',
  unidade: { singular: 'carta', plural: 'cartas' },
  comoJogar: [
    'Quatro tipos de carta sobre treze corpos: a ordem a partir do Sol é digitada, o resto é escolha.',
    'Nas de tamanho, os quatro nomes são vizinhos no ranking — Urano é maior que Netuno.',
    'Nas de ano e de gravidade, as opções erradas são os valores reais dos corpos vizinhos.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: montarBaralhoSolar,
    fim: 'baralho',
    teclado: 'texto',
  }),
}
