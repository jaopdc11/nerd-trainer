import { PROPOSICOES } from '@/data/linguagem-matematica'
import type { Distrator, Proposicao } from '@/data/linguagem-matematica'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Mostra uma proposição em notação e oferece quatro leituras em português.
 *
 * **É o jogo que separa quem lê matemática de quem reconhece símbolo solto.**
 * O baralho de símbolos, ao lado, cobra o nome do glifo: `∀` é "para todo". Não
 * é a mesma coisa. Ler `∃y ∀x : y > x` e ver que aquilo afirma a existência de
 * um real maior que todos os reais — e que inverter os dois quantificadores
 * transforma a falsidade numa verdade banal — é a habilidade de verdade, e é a
 * única das duas que serve numa demonstração.
 *
 * A carta é de escolha porque a resposta certa é uma frase em português, e
 * frase em português tem cinquenta grafias equivalentes: digitar mediria
 * redação. O preço disso é que o item inteiro passa a valer o que valem os
 * distratores — daí a regra do dataset de que todo distrator é uma leitura
 * errada catalogada, e não "outra frase de matemática".
 */

/**
 * Três distratores, preferindo três armadilhas *diferentes*.
 *
 * O sorteio ingênuo — pegar três ao acaso — produz cartas em que as três opções
 * erradas são variações da mesma confusão: em `∅ ⊆ A` daria duas leituras de
 * `∈` por `⊆` na mesma tela, e aí a alternativa certa se destaca justamente por
 * ser a única diferente. O jogador elimina pelo padrão, não pela leitura.
 *
 * Então a escolha é gulosa por classe de erro: embaralha, passa uma vez pegando
 * só classes inéditas, e só então completa com o que sobrou. Quando a carta tem
 * três classes ou mais no bolso, saem três armadilhas distintas; quando não
 * tem, o jogo não inventa — completa com repetida, que ainda é melhor que
 * distrator fraco.
 */
export function escolherDistratores(p: Proposicao, rng: Rng): Distrator[] {
  const embaralhados = rng.shuffle(p.distratores)

  const usados = new Set<string>()
  const escolhidos: Distrator[] = []

  for (const d of embaralhados) {
    if (escolhidos.length === 3) break
    if (usados.has(d.erro)) continue
    usados.add(d.erro)
    escolhidos.push(d)
  }

  for (const d of embaralhados) {
    if (escolhidos.length === 3) break
    if (!escolhidos.includes(d)) escolhidos.push(d)
  }

  return escolhidos
}

function carta(p: Proposicao, rng: Rng): Carta {
  const opcoes = rng.shuffle([p.leitura, ...escolherDistratores(p, rng).map((d) => d.texto)])

  return {
    tipo: 'escolha',
    id: `linguagem-${p.id}`,
    // Texto, não MathML: a notação daqui é toda linear e o Unicode já a desenha.
    // Ver o comentário de topo de `@/data/linguagem-matematica`.
    pergunta: { kind: 'texto', valor: p.notacao },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(p.leitura),
    gabarito: p.leitura,
  }
}

export const linguagemMatematica: JogoFlashcard = {
  id: 'linguagem-matematica',
  mecanica: 'flashcard',
  nome: 'Linguagem matemática',
  icone: '∀∃',
  resumo: 'A proposição está escrita em notação: escolha o que ela afirma.',
  categoria: 'matematica',
  unidade: { singular: 'proposição', plural: 'proposições' },
  comoJogar: [
    'Aparece ∃y ∀x : y > x e você escolhe, entre quatro frases, o que aquilo afirma.',
    'As erradas são as leituras erradas clássicas: ordem dos quantificadores trocada, ∈ no lugar de ⊆, a recíproca no lugar da contrapositiva.',
    'Saber o nome do símbolo não basta aqui — isso é o jogo de símbolos matemáticos.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(PROPOSICOES).map((p) => carta(p, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
