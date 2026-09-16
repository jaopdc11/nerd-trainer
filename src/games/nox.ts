import { COMPOSTOS, distratores, exibirNox, nox } from '@/data/nox'
import type { Composto } from '@/data/nox'
import type { Rng } from '@/core/rng'
import type { Conteudo, Exercicio, JogoGerador } from '@/core/types'

/**
 * Número de oxidação contra o relógio, em quatro opções.
 *
 * O enunciado é sempre o mesmo formato — "nox do S em H₂SO₄" — e a dificuldade
 * mora no composto, não na pergunta. Três degraus: a regra pura nos óxidos e
 * oxiácidos, a soma fechando numa carga nos íons, e por fim os casos em que a
 * regra decorada trai (peróxido, hidreto, `OF₂`).
 *
 * **Era digitado, e o digitado atrapalhava.** A resposta é um inteiro curto com
 * sinal, então metade da interação virava disputa de formato — "+6" ou "6",
 * "−2" com o menos que o teclado não tem —, e ainda pedia Enter porque não dava
 * para saber, na primeira tecla, se o que vinha era um sinal. Com opções, o item
 * volta a cobrar só a conta: o clique é imediato e o relógio anda.
 *
 * Os distratores é que são a parte séria, e por isso moram no dataset: são os
 * três erros com nome — a regra decorada, a carga esquecida e o sinal trocado.
 * Ver `distratores()` em `data/nox.ts`.
 */

function exercicio(rng: Rng, c: Composto): Exercicio {
  const valor = nox(c)
  const opcoes = rng.shuffle([valor, ...distratores(c).slice(0, 3)])
  const certo = exibirNox(valor)

  return {
    tipo: 'escolha',
    chave: `nox:${c.formula}:${c.alvo}`,
    enunciado: { kind: 'texto', valor: `nox do ${c.alvo} em ${c.formula}` },
    alternativas: opcoes.map((v): Conteudo => ({ kind: 'texto', valor: exibirNox(v) })),
    indiceCorreto: opcoes.indexOf(valor),
    gabarito: certo,
    // Nas armadilhas a resposta sozinha não ensina nada: quem errou precisa do
    // motivo, senão erra igual da próxima vez.
    ...(c.porque ? { porque: c.porque } : {}),
  }
}

const POR_NIVEL: readonly (readonly Composto[])[] = [0, 1, 2].map((n) =>
  COMPOSTOS.filter((c) => c.nivel === n),
)

export function gerarNox(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), POR_NIVEL.length - 1)
  const atuais = POR_NIVEL[n] ?? []
  // O nível novo entra em dobro: acumula os anteriores sem afogá-los.
  const sorteio = [...POR_NIVEL.slice(0, n).flat(), ...atuais, ...atuais]
  return exercicio(rng, rng.pick(sorteio))
}

export const numeroDeOxidacao: JogoGerador = {
  id: 'nox',
  mecanica: 'gerador',
  nome: 'Número de oxidação',
  icone: '±e⁻',
  resumo: 'Nox de cada átomo, do sulfúrico ao peróxido, contra o relógio.',
  categoria: 'quimica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Escolha o nox certo entre as quatro opções — com sinal.',
    'As erradas são os erros clássicos: a regra decorada, a carga esquecida, o sinal trocado.',
    'Nos níveis finais aparecem peróxido, hidreto e OF₂, onde a regra decorada trai.',
    'Cada acerto devolve 5 segundos ao relógio.',
  ],
  config: () => ({
    gerar: gerarNox,
    segundosIniciais: 60,
    bonusPorAcertoS: 5,
    tetoSegundos: 120,
    escala: (acertos) => Math.min(2, Math.floor(acertos / 7)),
    teclado: 'texto',
  }),
}
