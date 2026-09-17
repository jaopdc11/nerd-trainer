import { ESTRUTURAS, IRMAS, ORGANELAS } from '@/data/organelas'
import type { Estrutura, Organela } from '@/data/organelas'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Função → estrutura celular, em quatro alternativas.
 *
 * **Por que a função é a pergunta, e não a resposta.** Mostrar "lisossomo" e
 * pedir a função poria quatro frases longas na tela ao mesmo tempo, e a carta
 * passaria a medir leitura contra o relógio — o mesmo erro que fez as derivadas
 * e as funções orgânicas virarem card em vez de digitação. Com o nome nas
 * alternativas, as quatro opções são rótulos curtos e comparáveis, e o que se
 * decide é a única coisa que interessa: **de quem** é aquela função.
 *
 * **Por que escolha e não digitação.** Pela régua do projeto: "retículo
 * endoplasmático rugoso" tem 31 caracteres e quatro acentos, e digitar isso
 * mediria teclado, não citologia. O preço da escolha é entregar a resposta por
 * reconhecimento, e é para isso que serve o mapa de irmãs — ninguém acerta
 * "digestão em pH ácido" por eliminação quando as outras três opções na tela são
 * peroxissomo, complexo golgiense e vacúolo central.
 *
 * **Dois tipos de carta, e o segundo não é enfeite.** Onde a estrutura existe —
 * cloroplasto e parede só na vegetal, centríolo só na animal — é metade do que a
 * escola cobra sobre célula, e deixar isso escondido num campo que só o gabarito
 * lê seria jogar fora o dado. A carta de ocorrência pergunta "qual destas só
 * existe na célula vegetal?" com quatro nomes, e **não** o contrário ("o
 * cloroplasto existe em qual célula?", com três rótulos de resposta): naquela
 * forma, dez das dezessete cartas teriam "nas duas" como resposta, e responder
 * sempre "nas duas" tiraria nota boa sem saber nada.
 *
 * O distrator daqui nunca é uma estrutura sobre a qual o livro escolar briga —
 * ver `ressalva` no dataset. Oferecer "lisossomo" numa carta de "só na célula
 * animal" pegaria muita gente, mas pegaria quem estudou: quatro livros em cinco
 * ensinam que ele é animal. Punir por uma verdade de livro não ensina nada.
 */

/** Toda lista de `IRMAS` tem três ou mais entradas: o sorteio geral é rede de segurança morta. */
function cartaFuncao(e: Estrutura, rng: Rng): Carta {
  /*
   * Os errados, em ordem de quão tentadores são:
   * 1. as irmãs — as estruturas que de fato se confundem com a certa;
   * 2. qualquer outra, só para fechar quatro opções se um dia alguém encolher o
   *    mapa. Hoje esse segundo trecho nunca é alcançado, e o teste do dataset
   *    (`toda estrutura tem três irmãs ou mais`) é o que mantém isso verdadeiro.
   */
  const candidatos: readonly Organela[] = [
    ...rng.shuffle([...IRMAS[e.nome]]),
    ...rng.shuffle([...ORGANELAS]),
  ]

  const opcoes = rng.shuffle([e.nome, ...tresErrados(candidatos, e.nome)])

  return {
    tipo: 'escolha',
    id: `organela-${e.nome}`,
    pergunta: { kind: 'texto', valor: e.funcao },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(e.nome),
    // Quem errou precisa ver o que separa esta da vizinha, não o nome de novo:
    // "lisossomo" sozinho não ensina por que não era o peroxissomo.
    gabarito: `${e.nome} — ${e.sinal}`,
    // A ressalva é sobre onde o livro escolar simplifica. Fica como explicação,
    // e não no gabarito, porque vale mesmo quando a carta foi acertada.
    ...(e.ressalva ? { explicacao: e.ressalva } : {}),
  }
}

/**
 * A carta de ocorrência: qual das quatro só existe naquele tipo de célula.
 *
 * Os distratores saem das irmãs, como sempre, **mas filtradas**: uma irmã que
 * também seja exclusiva daria duas respostas certas na mesma tela (o cloroplasto
 * tem o vacúolo central como irmã, e os dois são vegetais), e uma irmã com
 * ressalva puniria quem estudou. Sobra o sorteio entre as neutras para fechar as
 * quatro opções — aqui ele não é rede de segurança morta, é o caminho normal.
 */
function cartaOcorrencia(e: Estrutura, neutras: readonly Organela[], rng: Rng): Carta {
  if (!e.exclusividade) {
    // Dataset mal cadastrado quebra na hora, como em `nox()`: um gabarito vazio
    // viraria uma carta plausível que não explica nada.
    throw new Error(`${e.nome}: exclusiva sem explicação de exclusividade`)
  }

  const irmasNeutras = IRMAS[e.nome].filter((n) => neutras.includes(n))
  const candidatos: readonly Organela[] = [
    ...rng.shuffle(irmasNeutras),
    ...rng.shuffle([...neutras]),
  ]

  const opcoes = rng.shuffle([e.nome, ...tresErrados(candidatos, e.nome)])
  const onde = e.ocorrencia === 'vegetal' ? 'vegetal' : 'animal'

  return {
    tipo: 'escolha',
    id: `organela-onde-${e.nome}`,
    pergunta: { kind: 'texto', valor: `Qual destas só existe na célula ${onde}?` },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(e.nome),
    gabarito: `${e.nome} — ${e.exclusividade}`,
  }
}

function tresErrados(candidatos: readonly Organela[], certa: Organela): Organela[] {
  const errados: Organela[] = []
  for (const c of candidatos) {
    if (c !== certa && !errados.includes(c)) errados.push(c)
    if (errados.length === 3) break
  }
  return errados
}

export const organelas: JogoFlashcard = {
  id: 'organelas',
  mecanica: 'flashcard',
  nome: 'Organelas',
  icone: '🧫',
  resumo: 'Aparece a função, você diz a organela — e o que é só vegetal.',
  categoria: 'biologicas',
  // "carta" e não "organela": o baralho tem mais cartas que estruturas, porque
  // as exclusivas aparecem duas vezes, com perguntas diferentes.
  unidade: { singular: 'carta', plural: 'cartas' },
  comoJogar: [
    'Aparece a função e você escolhe de quem ela é, entre quatro estruturas.',
    'As opções erradas são sempre as que se confundem de verdade com a certa: lisossomo e peroxissomo, retículo liso e rugoso, complexo golgiense e retículo.',
    'Algumas cartas viram a pergunta do avesso: qual das quatro só existe na célula vegetal, ou só na animal.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => {
      // As neutras são calculadas uma vez, e não por carta: a lista é a mesma
      // para todas as cartas de ocorrência, e recalculá-la lá dentro só
      // esconderia a regra num lugar onde ela não se lê.
      const neutras = ESTRUTURAS.filter((e) => e.ocorrencia === 'ambas' && !e.ressalva).map(
        (e) => e.nome,
      )

      return rng.shuffle([
        ...ESTRUTURAS.map((e) => cartaFuncao(e, rng)),
        ...ESTRUTURAS.filter((e) => e.ocorrencia !== 'ambas').map((e) =>
          cartaOcorrencia(e, neutras, rng),
        ),
      ])
    },
    fim: 'baralho',
    teclado: 'texto',
  }),
}
