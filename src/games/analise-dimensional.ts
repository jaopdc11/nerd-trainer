import { GRANDEZAS, emUnidadesBase } from '@/data/grandezas'
import type { Grandeza } from '@/data/grandezas'
import { distratoresDimensionais, notacaoDimensional } from '@/data/dimensoes'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * A grandeza na tela, a dimensão escolhida entre quatro.
 *
 * **Múltipla escolha aqui, e digitado no jogo de unidades — a diferença não é
 * gosto, é o que cada resposta custa.** `Pa` tem dois caracteres e sai de
 * qualquer teclado. `M⁻¹L⁻²T⁴I²` tem expoente negativo sobrescrito em quatro
 * fatores: digitar isso é disputa de formato, não análise dimensional, e o jogo
 * passaria a medir quem descobre como escrever `⁻¹` no celular. É o mesmo beco
 * do nox quando ele era digitado, e a saída é a mesma.
 *
 * O preço da escolha é medir reconhecer no lugar de lembrar, e é por isso que os
 * distratores são a parte séria — estão em `data/dimensoes.ts`, ao lado dos
 * expoentes. São o sinal trocado (`MLT²` contra `MLT⁻²`, idênticos menos por um
 * traço) e a grandeza vizinha, achada pela distância entre os expoentes e não
 * por uma lista escrita à mão: energia contra potência é um `T` de diferença,
 * pressão contra força são dois `L`. Com eles na tela, eliminar sem saber deixa
 * de funcionar.
 *
 * **O baralho é a tabela inteira, 43 cartas, e não só as que têm unidade com
 * nome.** É justamente onde os dois jogos se separam: torque, velocidade,
 * densidade e a constante de Planck não têm unidade batizada, e têm dimensão —
 * perguntar `[G]` é uma pergunta clássica de vestibular que o outro jogo não
 * teria como fazer.
 */

function cartaDimensao(g: Grandeza, rng: Rng): Carta {
  const certa = notacaoDimensional(g)
  const opcoes = rng.shuffle([certa, ...distratoresDimensionais(g).slice(0, 3)])

  return {
    tipo: 'escolha',
    id: `dim-${g.id}`,
    pergunta: { kind: 'texto', valor: g.nome },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(certa),
    // A resposta, a cadeia de unidades e a relação que a produz, nesta ordem. É
    // a linha que mostra de onde vem cada letra — quem só vê "ML²T⁻²" decora o
    // desenho e erra a próxima grandeza parecida.
    gabarito: `${certa} = ${emUnidadesBase(g)} — ${g.definicao}`,
  }
}

export const analiseDimensional: JogoFlashcard = {
  id: 'analise-dimensional',
  mecanica: 'flashcard',
  nome: 'Análise dimensional',
  icone: 'MLT⁻²',
  resumo: 'MLT⁻² ou ML²T⁻³: escolha a dimensão da grandeza entre quatro.',
  categoria: 'fisica',
  unidade: { singular: 'grandeza', plural: 'grandezas' },
  comoJogar: [
    'Aparece "pressão" e você escolhe ML⁻¹T⁻² entre as quatro opções.',
    'M é massa, L é comprimento, T é tempo, I é corrente e Θ é temperatura.',
    'As erradas são o sinal trocado e a grandeza vizinha: energia e potência diferem por um T.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(GRANDEZAS).map((g) => cartaDimensao(g, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
