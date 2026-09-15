import { JOGOS } from './registry'
import type { Banco } from './storage'

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

export const AREAS = ['memoria', 'sequencia', 'velocidade'] as const
export type Area = (typeof AREAS)[number]

export const ROTULO_AREA: Record<Area, string> = {
  memoria: 'Repertório',
  sequencia: 'Sequências',
  velocidade: 'Cálculo',
}

export const DESCRICAO_AREA: Record<Area, string> = {
  memoria: 'conteúdo decorado: elementos, fórmulas, constantes, símbolos',
  sequencia: 'dígitos e termos em ordem, sem errar nenhum',
  velocidade: 'contas e derivadas contra o relógio',
}

export interface Criterio {
  readonly jogoId: string
  /** Pontuação que vale nota cheia naquele jogo. */
  readonly meta: number
  readonly peso: number
  readonly area: Area
}

export const CRITERIOS: readonly Criterio[] = [
  // Memorização de conteúdo: o que mais diz sobre o repertório de alguém.
  { jogoId: 'tabela-periodica', meta: 118, peso: 2, area: 'memoria' },
  { jogoId: 'formulas', meta: 54, peso: 2, area: 'memoria' },
  { jogoId: 'constantes-fisicas', meta: 14, peso: 2, area: 'memoria' },
  { jogoId: 'alfabeto-grego', meta: 24, peso: 2, area: 'memoria' },
  { jogoId: 'prefixos-si', meta: 24, peso: 2, area: 'memoria' },

  // Sequências: metas do que é humanamente decorável, não do dataset.
  { jogoId: 'pi', meta: 100, peso: 1, area: 'sequencia' },
  { jogoId: 'e', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'phi', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'raiz-2', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'primos', meta: 40, peso: 1, area: 'sequencia' },
  { jogoId: 'fibonacci', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'potencias-2', meta: 40, peso: 1, area: 'sequencia' },

  // Velocidade: treina outra coisa, então pesa menos.
  { jogoId: 'aritmetica', meta: 40, peso: 1, area: 'velocidade' },
  { jogoId: 'derivadas-rapidas', meta: 25, peso: 1, area: 'velocidade' },
  { jogoId: 'ordem-de-grandeza', meta: 25, peso: 1, area: 'velocidade' },
]

export interface LinhaNerdometro {
  readonly jogoId: string
  readonly nome: string
  readonly icone: string
  readonly area: Area
  readonly recorde: number
  readonly meta: number
  /** 0 a 1. */
  readonly fracao: number
  readonly peso: number
  /** Quanto a nota final sobe se este jogo for ao máximo. */
  readonly potencial: number
  readonly partidas: number
  /** Chegou na meta. */
  readonly dominado: boolean
}

export interface NotaArea {
  readonly area: Area
  /** 0 a 100 dentro da própria área. */
  readonly nota: number
  readonly dominados: number
  readonly jogos: number
}

export interface Faixa {
  readonly minimo: number
  readonly titulo: string
  readonly lema: string
}

export const FAIXAS: readonly Faixa[] = [
  { minimo: 95, titulo: 'Tem fórmula tatuada', lema: 'não sobrou o que provar' },
  { minimo: 85, titulo: 'Perigo em jantar de família', lema: 'ninguém mais pergunta nada' },
  { minimo: 70, titulo: 'Enciclopédia ambulante', lema: 'o grupo já te consulta' },
  { minimo: 55, titulo: 'Nerd de carteirinha', lema: 'sabe coisa que não cai na prova' },
  { minimo: 40, titulo: 'Nerd assumido', lema: 'e com orgulho' },
  { minimo: 25, titulo: 'Estudante aplicado', lema: 'o repertório está vindo' },
  { minimo: 10, titulo: 'Curioso', lema: 'começou a decorar as coisas' },
  { minimo: 1, titulo: 'Só passando', lema: 'dá uma olhada nos outros jogos' },
  { minimo: 0, titulo: 'Ainda não começou', lema: 'jogue qualquer coisa' },
]

export interface Nerdometro {
  /** 0 a 100. */
  readonly nota: number
  readonly faixa: Faixa
  /** A próxima faixa, e quantos pontos faltam. `null` no topo. */
  readonly proximaFaixa: { readonly faixa: Faixa; readonly falta: number } | null
  readonly linhas: readonly LinhaNerdometro[]
  readonly areas: readonly NotaArea[]
  /** Onde há mais nota a ganhar. */
  readonly proximoPasso: LinhaNerdometro | null
  readonly jogados: number
  readonly total: number
  readonly dominados: number
  readonly partidas: number
  /** Tempo somado de todas as partidas registradas, em ms. */
  readonly tempoMs: number
}

export function calcular(banco: Banco): Nerdometro {
  const pesoTotal = CRITERIOS.reduce((s, c) => s + c.peso, 0)

  const linhas = CRITERIOS.map((c): LinhaNerdometro => {
    const jogo = JOGOS.find((j) => j.id === c.jogoId)
    const entrada = banco.entradas[c.jogoId]
    const recorde = entrada?.recorde.pontuacao ?? 0
    const fracao = Math.min(1, recorde / c.meta)

    return {
      jogoId: c.jogoId,
      nome: jogo?.nome ?? c.jogoId,
      icone: jogo?.icone ?? '?',
      area: c.area,
      recorde,
      meta: c.meta,
      fracao,
      peso: c.peso,
      // O que ainda dá para ganhar aqui, em pontos da nota final.
      potencial: ((1 - fracao) * c.peso * 100) / pesoTotal,
      partidas: entrada?.partidas ?? 0,
      dominado: fracao >= 1,
    }
  })

  const nota = Math.round(linhas.reduce((s, l) => s + l.fracao * l.peso, 0) * (100 / pesoTotal))

  const indiceFaixa = FAIXAS.findIndex((f) => nota >= f.minimo)
  const faixa = FAIXAS[indiceFaixa] ?? (FAIXAS[FAIXAS.length - 1] as Faixa)
  const acima = indiceFaixa > 0 ? FAIXAS[indiceFaixa - 1] : undefined

  const areas = AREAS.map((area): NotaArea => {
    const daArea = linhas.filter((l) => l.area === area)
    const peso = daArea.reduce((s, l) => s + l.peso, 0)
    return {
      area,
      nota: peso === 0 ? 0 : Math.round(daArea.reduce((s, l) => s + l.fracao * l.peso, 0) * (100 / peso)),
      dominados: daArea.filter((l) => l.dominado).length,
      jogos: daArea.length,
    }
  })

  // Tempo e partidas somam o banco inteiro, não só os critérios.
  const todas = Object.values(banco.entradas)

  return {
    nota,
    faixa,
    proximaFaixa: acima ? { faixa: acima, falta: acima.minimo - nota } : null,
    linhas,
    areas,
    proximoPasso: [...linhas].sort((a, b) => b.potencial - a.potencial)[0] ?? null,
    jogados: linhas.filter((l) => l.recorde > 0).length,
    total: linhas.length,
    dominados: linhas.filter((l) => l.dominado).length,
    partidas: todas.reduce((s, e) => s + e.partidas, 0),
    tempoMs: todas.reduce(
      (s, e) => s + e.historico.reduce((t, p) => t + p.duracaoMs, 0),
      0,
    ),
  }
}
