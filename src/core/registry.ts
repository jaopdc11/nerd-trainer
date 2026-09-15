import { aritmetica } from '@/games/aritmetica'
import { euler, phi, pi, raiz2 } from '@/games/decimais'
import { derivadasRapidas } from '@/games/derivadas-rapidas'
import { alfabetoGrego, constantesFisicas, prefixosSI } from '@/games/flashcards'
import { formulas } from '@/games/formulas'
import { fibonacciJogo, potencias2Jogo, primosJogo } from '@/games/inteiros'
import { ordemDeGrandeza } from '@/games/ordem-grandeza'
import { tabelaPeriodica } from '@/games/tabela-periodica'
import { CATEGORIAS } from './types'
import type { Categoria, JogoModule } from './types'

/**
 * Catálogo único. Adicionar um jogo é criar o módulo em `src/games/` e
 * acrescentar uma linha aqui — menu, rota e tela de recordes se derivam desta
 * lista, e nenhum deles conhece jogo nenhum individualmente.
 *
 * Este é o único módulo de `core/` que pode importar de `games/`.
 */
export const JOGOS: readonly JogoModule[] = [
  pi,
  tabelaPeriodica,
  aritmetica,
  derivadasRapidas,
  alfabetoGrego,
  formulas,
  euler,
  phi,
  raiz2,
  primosJogo,
  fibonacciJogo,
  potencias2Jogo,
  constantesFisicas,
  prefixosSI,
  ordemDeGrandeza,
]

const porId = new Map(JOGOS.map((j) => [j.id, j]))

if (porId.size !== JOGOS.length) {
  // Dois jogos com o mesmo id colidiriam na rota e misturariam recordes no
  // storage. Falhar barulhento na carga é melhor que corromper dado em silêncio.
  throw new Error('registry: há ids de jogo duplicados em JOGOS')
}

export function buscarJogo(id: string): JogoModule | undefined {
  return porId.get(id)
}

/** Jogos agrupados por categoria, na ordem de `CATEGORIAS`. */
export function porCategoria(): { categoria: Categoria; jogos: JogoModule[] }[] {
  return CATEGORIAS.map((categoria) => ({
    categoria,
    jogos: JOGOS.filter((j) => j.categoria === categoria),
  })).filter((g) => g.jogos.length > 0)
}
