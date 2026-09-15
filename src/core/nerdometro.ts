import type { Banco } from './storage'
import { JOGOS } from './registry'

/**
 * A nota de nerd: 0 a 100.
 *
 * O desenho tem três decisões que importam:
 *
 * 1. **Cada jogo tem uma meta, não o total.** Decorar 118 elementos vale 100%,
 *    mas ninguém decora 10 mil casas de π — a meta de π é 100 casas, que já é
 *    coisa de gente obsessiva. Usar o total como denominador faria a nota
 *    depender de quantas casas eu resolvi embutir no dataset, o que é arbitrário.
 * 2. **Conhecimento pesa mais que velocidade.** Saber a tabela periódica diz
 *    mais sobre alguém do que somar rápido, então memorização pesa 2 e os
 *    cronometrados pesam 1.
 * 3. **Jogo não jogado conta zero.** É o que impede alguém tirar 100 treinando
 *    só π, e é o que dá ao medidor o que dizer sobre onde ir depois.
 */

export interface Criterio {
  readonly jogoId: string
  /** Pontuação que vale nota cheia naquele jogo. */
  readonly meta: number
  readonly peso: number
}

export const CRITERIOS: readonly Criterio[] = [
  // Memorização de conteúdo: o que mais diz sobre o repertório de alguém.
  { jogoId: 'tabela-periodica', meta: 118, peso: 2 },
  { jogoId: 'formulas', meta: 54, peso: 2 },
  { jogoId: 'constantes-fisicas', meta: 14, peso: 2 },
  { jogoId: 'alfabeto-grego', meta: 24, peso: 2 },
  { jogoId: 'prefixos-si', meta: 24, peso: 2 },

  // Sequências: metas do que é humanamente decorável, não do dataset.
  { jogoId: 'pi', meta: 100, peso: 1 },
  { jogoId: 'e', meta: 30, peso: 1 },
  { jogoId: 'phi', meta: 30, peso: 1 },
  { jogoId: 'raiz-2', meta: 30, peso: 1 },
  { jogoId: 'primos', meta: 40, peso: 1 },
  { jogoId: 'fibonacci', meta: 30, peso: 1 },
  { jogoId: 'potencias-2', meta: 40, peso: 1 },

  // Velocidade: treina outra coisa, então pesa menos.
  { jogoId: 'aritmetica', meta: 40, peso: 1 },
  { jogoId: 'derivadas-rapidas', meta: 25, peso: 1 },
  { jogoId: 'ordem-de-grandeza', meta: 25, peso: 1 },
]

export interface LinhaNerdometro {
  readonly jogoId: string
  readonly nome: string
  readonly recorde: number
  readonly meta: number
  /** 0 a 1. */
  readonly fracao: number
  readonly peso: number
  /** Quanto a nota final sobe se este jogo for ao máximo. */
  readonly potencial: number
}

export interface Nerdometro {
  /** 0 a 100. */
  readonly nota: number
  readonly titulo: string
  readonly linhas: readonly LinhaNerdometro[]
  /** Onde há mais nota a ganhar com menos esforço. */
  readonly proximoPasso: LinhaNerdometro | null
  readonly jogados: number
  readonly total: number
}

const TITULOS: readonly { minimo: number; titulo: string }[] = [
  { minimo: 95, titulo: 'Tem fórmula tatuada' },
  { minimo: 85, titulo: 'Perigo em jantar de família' },
  { minimo: 70, titulo: 'Enciclopédia ambulante' },
  { minimo: 55, titulo: 'Nerd de carteirinha' },
  { minimo: 40, titulo: 'Nerd assumido' },
  { minimo: 25, titulo: 'Estudante aplicado' },
  { minimo: 10, titulo: 'Curioso' },
  { minimo: 1, titulo: 'Só passando' },
  { minimo: 0, titulo: 'Ainda não começou' },
]

export function calcular(banco: Banco): Nerdometro {
  const pesoTotal = CRITERIOS.reduce((s, c) => s + c.peso, 0)

  const linhas = CRITERIOS.map((c): LinhaNerdometro => {
    const jogo = JOGOS.find((j) => j.id === c.jogoId)
    const recorde = banco.entradas[c.jogoId]?.recorde.pontuacao ?? 0
    const fracao = Math.min(1, recorde / c.meta)

    return {
      jogoId: c.jogoId,
      nome: jogo?.nome ?? c.jogoId,
      recorde,
      meta: c.meta,
      fracao,
      peso: c.peso,
      // O que ainda dá para ganhar aqui, em pontos da nota final.
      potencial: ((1 - fracao) * c.peso * 100) / pesoTotal,
    }
  })

  const nota = Math.round(
    linhas.reduce((s, l) => s + l.fracao * l.peso, 0) * (100 / pesoTotal),
  )

  const titulo = TITULOS.find((t) => nota >= t.minimo)?.titulo ?? TITULOS[TITULOS.length - 1]?.titulo ?? ''

  // Sugere o de maior potencial entre os que já foram tocados ou nunca jogados,
  // preferindo o que está mais longe da meta.
  const candidatos = [...linhas].sort((a, b) => b.potencial - a.potencial)

  return {
    nota,
    titulo,
    linhas,
    proximoPasso: candidatos[0] ?? null,
    jogados: linhas.filter((l) => l.recorde > 0).length,
    total: linhas.length,
  }
}
