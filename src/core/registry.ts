import { analiseDimensional } from '@/games/analise-dimensional'
import { aritmetica } from '@/games/aritmetica'
import { balanceamento } from '@/games/balanceamento'
import { euler, phi, pi, raiz2 } from '@/games/decimais'
import { derivadasRapidas } from '@/games/derivadas-rapidas'
import { capitais } from '@/games/capitais'
import { biomas } from '@/games/biomas'
import { capitaisEstados } from '@/games/capitais-estados'
import { cinematica } from '@/games/cinematica'
import { circuitos } from '@/games/circuitos'
import { configuracaoEletronica } from '@/games/configuracao-eletronica'
import { cronologia } from '@/games/cronologia'
import { espectro } from '@/games/espectro'
import { economia } from '@/games/economia'
import { estados } from '@/games/estados'
import { estreitos } from '@/games/estreitos'
import { eua } from '@/games/eua'
import { familiasPeriodicas } from '@/games/familias-periodicas'
import {
  alfabetoGrego,
  bandeiras,
  constantesFisicas,
  filosofia,
  geometriaMolecular,
  prefixosSI,
  sociologia,
} from '@/games/flashcards'
import { formulas } from '@/games/formulas'
import { funcoesOrganicas } from '@/games/funcoes-organicas'
import { grandezas } from '@/games/grandezas'
import { idiomas } from '@/games/idiomas'
import { fibonacciJogo, potencias2Jogo, primosJogo } from '@/games/inteiros'
import { linguagemMatematica } from '@/games/linguagem-matematica'
import { ions } from '@/games/ions'
import { luas } from '@/games/luas'
import { latim } from '@/games/latim'
import { maioresPaises } from '@/games/maiores-paises'
import { massaMolarJogo } from '@/games/massa-molar'
import { nomenclaturaAcidos } from '@/games/nomenclatura-acidos'
import { modeloPadrao } from '@/games/modelo-padrao'
import { mitologia } from '@/games/mitologia'
import { moedas } from '@/games/moedas'
import { numeroDeOxidacao } from '@/games/nox'
import { ordemDeGrandeza } from '@/games/ordem-grandeza'
import { ph } from '@/games/ph'
import { obras } from '@/games/obras'
import { escolasLiterarias } from '@/games/escolas-literarias'
import { paises } from '@/games/paises'
import { periodosBrasil } from '@/games/periodos-brasil'
import { presidentes } from '@/games/presidentes'
import { pinturas } from '@/games/pinturas'
import { simbolosMatematicos } from '@/games/simbolos-matematicos'
import { revolucoes } from '@/games/revolucoes'
import { riosMontanhas } from '@/games/rios-montanhas'
import { simbolosElementos } from '@/games/simbolos-elementos'
import { sistemaSolar } from '@/games/sistema-solar'
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
  simbolosMatematicos,
  linguagemMatematica,
  formulas,
  euler,
  phi,
  raiz2,
  primosJogo,
  fibonacciJogo,
  potencias2Jogo,
  constantesFisicas,
  prefixosSI,
  grandezas,
  analiseDimensional,
  espectro,
  modeloPadrao,
  cinematica,
  circuitos,
  sistemaSolar,
  luas,
  ordemDeGrandeza,
  geometriaMolecular,
  numeroDeOxidacao,
  massaMolarJogo,
  configuracaoEletronica,
  balanceamento,
  ph,
  simbolosElementos,
  familiasPeriodicas,
  ions,
  nomenclaturaAcidos,
  funcoesOrganicas,
  cronologia,
  filosofia,
  sociologia,
  economia,
  mitologia,
  pinturas,
  presidentes,
  periodosBrasil,
  revolucoes,
  obras,
  escolasLiterarias,
  latim,
  bandeiras,
  paises,
  capitais,
  estados,
  capitaisEstados,
  eua,
  maioresPaises,
  riosMontanhas,
  biomas,
  estreitos,
  moedas,
  idiomas,
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
