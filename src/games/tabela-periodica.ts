import { COLUNAS_GRADE, ELEMENTOS, LINHAS_GRADE } from '@/data/tabela-periodica'
import type { CelulaGrade, JogoGrade } from '@/core/types'

/**
 * A tabela periódica preenchida pelo nome dos elementos, em ordem livre.
 *
 * A resposta é `texto`: acento e caixa não importam, "nitrogenio" vale tanto
 * quanto "Nitrogênio". Os nomes em latim de onde vêm os símbolos estranhos
 * (Natrium, Kalium, Ferrum...) entram como sinônimos.
 */
export const tabelaPeriodica: JogoGrade = {
  id: 'tabela-periodica',
  mecanica: 'grade',
  nome: 'Tabela periódica',
  icone: '⚛',
  resumo: 'Os 118 elementos, preenchidos na ordem que você lembrar.',
  categoria: 'quimica',
  unidade: { singular: 'elemento', plural: 'elementos' },
  comoJogar: [
    'Digite os elementos na ordem que quiser: cada acerto cai na célula certa.',
    'Acento e maiúscula não importam — "sodio" vale.',
    'Assim que o nome estiver completo ele é aceito sozinho, sem Enter.',
  ],
  config: () => ({
    linhas: LINHAS_GRADE,
    colunas: COLUNAS_GRADE,
    celulas: ELEMENTOS.map(
      (e): CelulaGrade => ({
        id: `z${e.z}`,
        linha: e.linha,
        coluna: e.coluna,
        rotulo: String(e.z),
        grupo: e.bloco,
        gabarito: e.simbolo,
        resposta: {
          tipo: 'texto',
          canonica: e.nome,
          aceitas: [e.nome, ...e.sinonimos],
        },
      }),
    ),
    teclado: 'texto',
    ordem: 'livre',
    mostrarRotulos: true,
  }),
}
