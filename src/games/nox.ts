import { COMPOSTOS, exibirNox, nox } from '@/data/nox'
import type { Composto } from '@/data/nox'
import type { Rng } from '@/core/rng'
import type { Exercicio, JogoGerador } from '@/core/types'

/**
 * Número de oxidação contra o relógio.
 *
 * O enunciado é sempre o mesmo formato — "nox do S em H₂SO₄" — e a dificuldade
 * mora no composto, não na pergunta. Três degraus: a regra pura nos óxidos e
 * oxiácidos, a soma fechando numa carga nos íons, e por fim os casos em que a
 * regra decorada trai (peróxido, hidreto, `OF₂`).
 *
 * Pede Enter, pelo mesmo motivo da ordem de grandeza: "+6" e "6" são a mesma
 * resposta e não dá para saber, na primeira tecla, se o que vem é um sinal.
 */

function exercicio(c: Composto): Exercicio {
  const valor = nox(c)

  return {
    tipo: 'digitado',
    chave: `nox:${c.formula}:${c.alvo}`,
    enunciado: { kind: 'texto', valor: `nox do ${c.alvo} em ${c.formula}` },
    resposta: {
      tipo: 'numero',
      mantissa: String(Math.abs(valor)),
      expoente: 0,
      negativo: valor < 0,
      sigMin: 1,
    },
    // Nas armadilhas a resposta sozinha não ensina nada: quem errou precisa do
    // motivo, senão erra igual da próxima vez.
    gabarito: c.porque ? `${exibirNox(valor)} — ${c.porque}` : exibirNox(valor),
    teclado: 'texto',
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
  return exercicio(rng.pick(sorteio))
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
    'Responda com o sinal: "+6" ou "6" valem igual, "−2" precisa do menos.',
    'Enter confirma — sem ele não dá para saber se você ia digitar um sinal.',
    'Nos níveis finais aparecem peróxido, hidreto e OF₂, onde a regra decorada trai.',
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
