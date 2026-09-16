import { EQUACOES, balancear, distratores, exibirConjunto, exibirEquacao } from '@/data/equacoes'
import type { Equacao } from '@/data/equacoes'
import type { Rng } from '@/core/rng'
import type { Conteudo, Exercicio, JogoGerador } from '@/core/types'

/**
 * Balanceamento de equação contra o relógio, em quatro opções.
 *
 * A equação aparece crua — `C₃H₈ + O₂ → CO₂ + H₂O` — e o jogador escolhe o
 * conjunto de coeficientes na ordem em que as fórmulas estão escritas. Três
 * degraus: síntese e decomposição que saem de cabeça, combustão de orgânico com
 * o orgânico em 1, e por fim as que pedem fração — onde o conjunto todo tem de
 * ser multiplicado para o 13 do butano aparecer inteiro.
 *
 * **De escolha, e não digitado**, pela razão contrária à do nox. Ali a resposta
 * era um inteiro curto e mesmo assim o digitado atrapalhava, por causa do sinal;
 * aqui a resposta é uma *lista* de três ou quatro números, e digitar "2, 13, 8,
 * 10" contra o relógio mede pontuação e teclado, não química. O separador
 * sozinho já viraria discussão: vírgula, espaço, hífen. Com opções, o item volta
 * a cobrar só a conta.
 *
 * Os distratores são a parte séria e moram no dataset — são os três erros com
 * nome: o hidrogênio esquecido, o conjunto dobrado e a troca de dois
 * coeficientes. Ver `distratores()` em `data/equacoes.ts`, em especial o
 * comentário sobre o conjunto dobrado, que conserva os átomos e ainda assim está
 * errado.
 */

function exercicio(rng: Rng, eq: Equacao): Exercicio {
  const certo = balancear(eq)
  const opcoes = rng.shuffle([certo, ...distratores(eq).slice(0, 3)])
  const gabarito = exibirConjunto(certo)

  return {
    tipo: 'escolha',
    chave: `bal:${eq.id}`,
    enunciado: { kind: 'texto', valor: exibirEquacao(eq) },
    alternativas: opcoes.map((c): Conteudo => ({ kind: 'texto', valor: exibirConjunto(c) })),
    indiceCorreto: opcoes.indexOf(certo),
    gabarito,
    // Só o último degrau traz isto: "era 2, 13, 8, 10" não ensina por que não
    // dava para deixar 1 no butano, e quem errou pela fração erra igual depois.
    ...(eq.porque ? { porque: eq.porque } : {}),
  }
}

const POR_NIVEL: readonly (readonly Equacao[])[] = [0, 1, 2].map((n) =>
  EQUACOES.filter((eq) => eq.nivel === n),
)

export function gerarBalanceamento(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), POR_NIVEL.length - 1)
  const atuais = POR_NIVEL[n] ?? []
  // O nível novo entra em dobro: acumula os anteriores sem afogá-los.
  const sorteio = [...POR_NIVEL.slice(0, n).flat(), ...atuais, ...atuais]
  return exercicio(rng, rng.pick(sorteio))
}

export const balanceamento: JogoGerador = {
  id: 'balanceamento',
  mecanica: 'gerador',
  nome: 'Balanceamento',
  icone: '⇌',
  resumo: 'Acerte os coeficientes que fecham a equação, do metano ao octano.',
  categoria: 'quimica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Escolha o conjunto de coeficientes na ordem em que as fórmulas aparecem na equação.',
    'A resposta é sempre o menor conjunto de inteiros — o dobro dele também conserva os átomos, e mesmo assim está errado.',
    'As erradas são os deslizes de sempre: esquecer que a água leva dois hidrogênios, dobrar tudo, trocar dois coeficientes de lugar.',
    'Cada acerto devolve 6 segundos ao relógio.',
  ],
  config: () => ({
    gerar: gerarBalanceamento,
    // Mais folgado que os outros geradores (60s / +5s) porque aqui há uma
    // equação inteira para ler antes de pensar em qualquer coisa, e quatro
    // conjuntos de números para comparar depois. Com 60s o jogo virava teste de
    // leitura; o teto maior é a contrapartida de o item render menos por minuto.
    segundosIniciais: 75,
    bonusPorAcertoS: 6,
    tetoSegundos: 150,
    escala: (acertos) => Math.min(2, Math.floor(acertos / 6)),
    teclado: 'texto',
  }),
}
