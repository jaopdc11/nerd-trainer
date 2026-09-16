import { EVENTOS, exibirAno } from '@/data/cronologia'
import type { Evento } from '@/data/cronologia'
import type { Rng } from '@/core/rng'
import type { Exercicio, JogoGerador } from '@/core/types'

/**
 * Qual veio antes?
 *
 * O único gerador do app cujo exercício não é calculado — é **combinado**. Os
 * 79 eventos dão mais de três mil pares ordenados, então o dataset nunca se
 * esgota como um baralho, e nenhum par precisa estar escrito em lugar nenhum.
 *
 * A dificuldade também sai da combinação, sem dado extra: é a distância entre
 * os dois anos. Séculos de intervalo é reconhecimento grosseiro; 1888 contra
 * 1889 é a Lei Áurea contra a Proclamação da República, que é exatamente onde
 * mora a diferença entre saber e ter chutado.
 */
/**
 * A faixa de distância de cada nível — com **teto**, não só piso.
 *
 * A primeira versão pedia só um mínimo, e o resultado foi ridículo: o nível
 * fácil sorteava a morte de Júlio César contra a Lei Áurea, 1.932 anos de
 * intervalo. Não era azar. Como a lista cobre de 776 a.C. a 2001, a mediana de
 * distância entre dois eventos quaisquer é de **268 anos** — com regra de
 * mínimo, o absurdo é o caso comum, não a exceção.
 *
 * Com teto, "fácil" passa a significar duas coisas que estão na mesma vizinhança
 * histórica e ainda assim são distinguíveis, que é a pergunta que ensina algo.
 */
const FAIXA_POR_NIVEL = [
  { de: 40, ate: 250 },
  { de: 12, ate: 60 },
  { de: 1, ate: 15 },
] as const

/** Pares cuja distância cai dentro da faixa. */
function pares(de: number, ate: number): (readonly [Evento, Evento])[] {
  const saida: (readonly [Evento, Evento])[] = []
  for (let i = 0; i < EVENTOS.length; i++) {
    for (let j = i + 1; j < EVENTOS.length; j++) {
      const a = EVENTOS[i] as Evento
      const b = EVENTOS[j] as Evento
      // Anos iguais nunca entram: a pergunta não teria resposta. Inconfidência
      // Mineira e Revolução Francesa são ambas de 1789.
      const d = Math.abs(a.ano - b.ano)
      if (d >= Math.max(1, de) && d <= ate) saida.push([a, b])
    }
  }
  return saida
}

/** Pré-computado por nível: são três varreduras, não uma por exercício. */
const PARES_POR_NIVEL = FAIXA_POR_NIVEL.map((f) => pares(f.de, f.ate))

/** Exposto para o teste conferir que nenhum nível estoura a própria faixa. */
export const FAIXAS = FAIXA_POR_NIVEL

function exercicio(a: Evento, b: Evento, rng: Rng): Exercicio {
  const primeiro = a.ano < b.ano ? a : b
  const segundo = primeiro === a ? b : a

  // A ordem na tela é sorteada, senão a resposta seria sempre a de cima.
  const mostrados = rng.chance(0.5) ? [primeiro, segundo] : [segundo, primeiro]

  return {
    tipo: 'escolha',
    // Ordenada, para a anti-repetição enxergar o par como um só.
    chave: `antes:${[a.id, b.id].sort().join(':')}`,
    enunciado: { kind: 'texto', valor: 'Qual veio antes?' },
    alternativas: mostrados.map((e) => ({ kind: 'texto' as const, valor: e.nome })),
    indiceCorreto: mostrados.indexOf(primeiro),
    gabarito: `${primeiro.nome} (${exibirAno(primeiro.ano)}), antes de ${segundo.nome} (${exibirAno(segundo.ano)})`,
  }
}

export function gerarCronologia(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), PARES_POR_NIVEL.length - 1)
  const atuais = PARES_POR_NIVEL[n] ?? []
  // O nível novo entra em dobro, e os anteriores seguem no bolo: o jogo aperta
  // sem virar outro jogo de repente.
  const [a, b] = rng.pick([...PARES_POR_NIVEL.slice(0, n).flat(), ...atuais, ...atuais])
  return exercicio(a, b, rng)
}

export const cronologia: JogoGerador = {
  id: 'cronologia',
  mecanica: 'gerador',
  nome: 'Qual veio antes?',
  icone: '⏳',
  resumo: 'Dois eventos na tela, você diz qual é o mais antigo.',
  categoria: 'humanas',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Escolha o evento mais antigo dos dois.',
    'Brasil e mundo na mesma lista, da fundação de Roma ao 11 de setembro.',
    'Vai apertando: começa com séculos de diferença e termina em anos vizinhos.',
  ],
  config: () => ({
    gerar: gerarCronologia,
    segundosIniciais: 60,
    bonusPorAcertoS: 4,
    tetoSegundos: 110,
    escala: (acertos) => Math.min(2, Math.floor(acertos / 8)),
    teclado: 'texto',
  }),
}
