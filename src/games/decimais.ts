import {
  E_DECIMAIS,
  PHI_DECIMAIS,
  PI_DECIMAIS,
  RAIZ2_DECIMAIS,
} from '@/data/constantes-matematicas'
import type { Categoria, JogoSequencia } from '@/core/types'

/**
 * Os quatro jogos de constante decimal.
 *
 * São literalmente a mesma partida com uma string diferente, então são uma
 * fábrica e não quatro pastas: acrescentar a constante de Euler-Mascheroni um
 * dia é uma linha aqui e uma no `registry`.
 */

interface Receita {
  readonly id: string
  readonly nome: string
  readonly icone: string
  readonly resumo: string
  readonly categoria: Categoria
  /** Parte inteira mais a vírgula: "3," em π. Exibida, nunca digitada. */
  readonly prefixo: string
  readonly decimais: string
}

function criar({ id, nome, icone, resumo, categoria, prefixo, decimais }: Receita): JogoSequencia {
  const digitos = [...decimais]

  return {
    id,
    mecanica: 'sequencia',
    nome,
    icone,
    resumo,
    categoria,
    unidade: { singular: 'casa', plural: 'casas' },
    comoJogar: [
      `O "${prefixo}" já está na tela: comece pela primeira casa decimal.`,
      'Cada tecla é julgada na hora — não há Enter e não há apagar.',
      'Um dígito errado encerra a partida, mas mostra os dez seguintes para você decorar.',
    ],
    config: () => ({
      itens: digitos,
      total: digitos.length,
      entrada: 'caractere',
      teclado: 'numerico',
      prefixo,
      separador: '',
      agrupar: 10,
      revisaoPosMorte: 10,
    }),
  }
}

export const pi = criar({
  id: 'pi',
  nome: 'Casas de π',
  icone: 'π',
  resumo: 'As mil primeiras casas de π, uma tecla por vez.',
  categoria: 'matematica',
  prefixo: '3,',
  decimais: PI_DECIMAIS,
})

export const euler = criar({
  id: 'e',
  nome: 'Casas de e',
  icone: 'e',
  resumo: 'A base do logaritmo natural, casa a casa.',
  categoria: 'matematica',
  prefixo: '2,',
  decimais: E_DECIMAIS,
})

export const phi = criar({
  id: 'phi',
  nome: 'Casas de φ',
  icone: 'φ',
  resumo: 'A razão áurea, (1+√5)/2, casa a casa.',
  categoria: 'matematica',
  prefixo: '1,',
  decimais: PHI_DECIMAIS,
})

export const raiz2 = criar({
  id: 'raiz-2',
  nome: 'Casas de √2',
  icone: '√2',
  resumo: 'A constante de Pitágoras — o primeiro irracional conhecido.',
  categoria: 'matematica',
  prefixo: '1,',
  decimais: RAIZ2_DECIMAIS,
})
