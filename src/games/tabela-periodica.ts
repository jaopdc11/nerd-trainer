import { COLUNAS_GRADE, ELEMENTOS, LINHAS_GRADE } from '@/data/tabela-periodica'
import type { CelulaGrade, JogoGrade } from '@/core/types'

/**
 * Os três modos da tabela periódica.
 *
 * O detalhe que separa os modos não é a pergunta, é o **tipo da resposta**:
 * - nome → `texto`, indiferente a acento e caixa ("nitrogenio" vale)
 * - símbolo → `simbolo`, comparação estrita, porque Co é cobalto e CO é
 *   monóxido de carbono; Hf é háfnio e HF é fluoreto de hidrogênio
 * - número atômico → a grade sorteia a célula e pergunta pelo Z
 */

function celulaNome(): CelulaGrade[] {
  return ELEMENTOS.map((e) => ({
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
  }))
}

function celulaSimbolo(): CelulaGrade[] {
  return ELEMENTOS.map((e) => ({
    id: `z${e.z}`,
    linha: e.linha,
    coluna: e.coluna,
    rotulo: String(e.z),
    grupo: e.bloco,
    gabarito: e.simbolo,
    // Estrita em caixa de propósito: ver o comentário no topo.
    resposta: { tipo: 'simbolo', canonica: e.simbolo },
  }))
}

function celulaPorZ(): CelulaGrade[] {
  return ELEMENTOS.map((e) => ({
    id: `z${e.z}`,
    linha: e.linha,
    coluna: e.coluna,
    rotulo: String(e.z),
    grupo: e.bloco,
    gabarito: `${e.simbolo} · ${e.nome}`,
    resposta: {
      tipo: 'texto',
      canonica: e.nome,
      aceitas: [e.nome, ...e.sinonimos, e.simbolo],
    },
  }))
}

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
    'Acento é opcional no nome; no modo símbolo a caixa importa (Co ≠ CO).',
    'Pode desistir a qualquer momento para ver o gabarito do que faltou.',
  ],
  modos: [
    { id: 'nome', nome: 'Pelo nome', resumo: 'Digite "sódio", "ferro", "oganessônio"…' },
    { id: 'simbolo', nome: 'Pelo símbolo', resumo: 'Digite "Na", "Fe", "Og" — a caixa importa' },
    { id: 'por-z', nome: 'Pelo número atômico', resumo: 'O jogo sorteia o Z e pergunta qual é' },
  ],
  config: (modoId) => ({
    linhas: LINHAS_GRADE,
    colunas: COLUNAS_GRADE,
    celulas:
      modoId === 'simbolo' ? celulaSimbolo() : modoId === 'por-z' ? celulaPorZ() : celulaNome(),
    teclado: 'texto',
    ordem: modoId === 'por-z' ? 'sorteada' : 'livre',
    mostrarRotulos: true,
  }),
}
