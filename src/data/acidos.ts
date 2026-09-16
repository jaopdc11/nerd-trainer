/**
 * Nomenclatura de ácidos.
 *
 * **O nome não está escrito em lugar nenhum.** Nenhuma entrada guarda "ácido
 * hipocloroso": guarda a composição (`atomos`) e a raiz do elemento, e
 * `nomeDoAcido()` monta o resto. O sufixo sai do nox do átomo central, que é
 * calculado pela mesma `nox()` do jogo de número de oxidação — não há segunda
 * implementação e não há como as duas divergirem.
 *
 * Isso não é purismo. A série é a coisa que o jogo ensina:
 *
 *     nox do -ico + 2  →  per...ico     HClO₄  perclórico
 *     nox do -ico      →  ico           HClO₃  clórico
 *     nox do -ico − 2  →  oso           HClO₂  cloroso
 *     nox do -ico − 4  →  hipo...oso    HClO   hipocloroso
 *
 * Com o nome digitado à mão, "ácido clórico" em HClO₂ seria um erro de digitação
 * silencioso e o jogo passaria a ensinar química errada com toda a convicção. Do
 * jeito que está, um oxigênio a mais ou a menos na composição muda o nox, muda o
 * degrau e muda o nome — e o gabarito conferido à mão em `acidos.test.ts` grita.
 *
 * **Hidrácido é outro tipo, não um oxiácido com zero oxigênio.** União
 * discriminada porque a diferença é real: no hidrácido não existe série nenhuma,
 * o sufixo é sempre -ídrico, e o nox do átomo central nem sempre é calculável
 * (no HCN o carbono está ligado a nitrogênio, que não tem nox fixo — `nox()`
 * quebraria, e com razão). Um campo `nox` opcional com um `null` significando
 * "aqui não se aplica" seria a mesma coisa escrita de um jeito que o
 * compilador não verifica.
 *
 * O que ficou **de fora**, e por quê: H₂MnO₄/HMnO₄ (mangânico e permangânico)
 * são +6 e +7 — degrau de 1, não de 2 —, e H₂Cr₂O₇ (dicrômico) ganha o "di" por
 * contagem de átomos, não por estado de oxidação. Os três são nome para decorar
 * solto, que é exatamente o que este jogo se recusa a ser. Os íons
 * correspondentes continuam no baralho de íons, onde decorar é o combinado.
 */

import { nox } from './nox'
import type { Composto } from './nox'

const SUBSCRITO = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'] as const

const subscrito = (n: number): string => {
  const digito = SUBSCRITO[n]
  if (digito === undefined) throw new Error(`índice ${n} fora da faixa de uma fórmula`)
  return digito
}

/** Os cinco sufixos que a nomenclatura tradicional tem. Não há um sexto. */
export type Grau = 'ídrico' | 'hipo-oso' | 'oso' | 'ico' | 'per-ico'

interface AcidoBase {
  /** Composição na ordem da fórmula: [símbolo, quantidade]. */
  readonly atomos: readonly (readonly [string, number])[]
  /** Agrupa a série. É o elemento, não o ácido: 'cloro' para os quatro do cloro. */
  readonly familia: string
  /**
   * A raiz sem acento, a que serve para -oso e -ídrico: 'clor', 'sulfur'.
   * O -ico quase sempre pede acento e por isso tem campo próprio.
   */
  readonly raiz: string
  readonly sinonimos?: readonly string[]
}

export type Acido =
  | (AcidoBase & { readonly tipo: 'hidracido' })
  | (AcidoBase & {
      readonly tipo: 'oxiacido'
      /** Símbolo do átomo central: é dele que sai o nox que decide o sufixo. */
      readonly central: string
      /** A raiz do -ico, quando o acento cai: 'clór', 'nítr'. Ausente = igual à raiz. */
      readonly raizIco?: string
    })

/**
 * O nox que vale o sufixo -ico em cada família.
 *
 * É a única constante arbitrária do arquivo, e é assim mesmo: o "-ico" marca a
 * valência mais comum do elemento, que é um fato sobre a família e não uma
 * consequência de nada. Todo o resto — per-, -oso, hipo- — é distância medida a
 * partir daqui, de dois em dois.
 */
const NOX_DO_ICO: Readonly<Record<string, number>> = {
  cloro: 5,
  bromo: 5,
  iodo: 5,
  nitrogenio: 5,
  fosforo: 5,
  enxofre: 6,
  carbono: 4,
  boro: 3,
  cromo: 6,
}

export const formulaDoAcido = (a: Acido): string =>
  a.atomos.map(([simbolo, n]) => (n === 1 ? simbolo : `${simbolo}${subscrito(n)}`)).join('')

/** O ácido no formato que `nox()` entende. Ácido é neutro: carga 0, sempre. */
const comoComposto = (a: Acido, central: string): Composto => ({
  formula: formulaDoAcido(a),
  nome: a.familia,
  alvo: central,
  atomos: a.atomos,
  carga: 0,
  nivel: 0,
})

/** Nox do átomo central. Lança nos hidrácidos, onde a pergunta não faz sentido. */
export function noxCentral(a: Acido): number {
  if (a.tipo !== 'oxiacido') {
    throw new Error(`${formulaDoAcido(a)}: hidrácido não tem série, logo não tem nox a consultar`)
  }
  return nox(comoComposto(a, a.central))
}

/**
 * Em que degrau da série o ácido está. É aqui que a regra vira código.
 *
 * Quebrar num degrau desconhecido é deliberado: um oxiácido cujo nox não caia em
 * ico±2 ou ico−4 não pertence à série tradicional, e inventar um sufixo para ele
 * seria ensinar uma regra que não existe.
 */
export function grauDo(a: Acido): Grau {
  if (a.tipo === 'hidracido') return 'ídrico'

  const ico = NOX_DO_ICO[a.familia]
  if (ico === undefined) {
    throw new Error(`${formulaDoAcido(a)}: a família ${a.familia} não declara o nox do -ico`)
  }

  switch (noxCentral(a) - ico) {
    case 2:
      return 'per-ico'
    case 0:
      return 'ico'
    case -2:
      return 'oso'
    case -4:
      return 'hipo-oso'
    default:
      throw new Error(
        `${formulaDoAcido(a)}: nox ${noxCentral(a)} não cai em nenhum degrau da série de ${a.familia}`,
      )
  }
}

/** Só o adjetivo: "hipocloroso". É a resposta que o jogo aceita sozinha. */
export function adjetivoDoAcido(a: Acido): string {
  const comAcento = a.tipo === 'oxiacido' ? (a.raizIco ?? a.raiz) : a.raiz

  switch (grauDo(a)) {
    case 'ídrico':
      return `${a.raiz}ídrico`
    case 'hipo-oso':
      return `hipo${a.raiz}oso`
    case 'oso':
      return `${a.raiz}oso`
    case 'ico':
      return `${comAcento}ico`
    case 'per-ico':
      return `per${comAcento}ico`
  }
}

/** O nome inteiro: "ácido hipocloroso". */
export const nomeDoAcido = (a: Acido): string => `ácido ${adjetivoDoAcido(a)}`

/** Tudo que vale ponto: com e sem a palavra "ácido", mais as grafias declaradas. */
export const formasDoAcido = (a: Acido): readonly string[] => [
  nomeDoAcido(a),
  adjetivoDoAcido(a),
  ...(a.sinonimos ?? []),
]

/**
 * O baralho, agrupado por família — e cada série entra **inteira**.
 *
 * HBrO₂ e HIO₂ quase não existem fora do papel, e mesmo assim estão aqui: o
 * jogador que vê hipobromoso/bromoso/brômico/perbrômico depois de ter visto os
 * quatro do cloro não decora oito nomes, entende uma regra e passa a gerar os
 * nomes sozinho. Cortar os "pouco úteis" devolveria o jogo ao que ele existe
 * para combater — uma lista de nomes soltos.
 */
export const ACIDOS: readonly Acido[] = [
  // --- hidrácidos: sem oxigênio, sufixo -ídrico e ponto final ----------------
  { tipo: 'hidracido', familia: 'fluor', raiz: 'fluor', atomos: [['H', 1], ['F', 1]] },
  { tipo: 'hidracido', familia: 'cloro', raiz: 'clor', atomos: [['H', 1], ['Cl', 1]] },
  { tipo: 'hidracido', familia: 'bromo', raiz: 'brom', atomos: [['H', 1], ['Br', 1]] },
  { tipo: 'hidracido', familia: 'iodo', raiz: 'iod', atomos: [['H', 1], ['I', 1]] },
  // A raiz do enxofre muda de tradição no meio do caminho: sulf- no hidrácido,
  // sulfur- no oxiácido. É irregularidade de verdade, não erro de digitação.
  { tipo: 'hidracido', familia: 'enxofre', raiz: 'sulf', atomos: [['H', 2], ['S', 1]] },
  { tipo: 'hidracido', familia: 'cianeto', raiz: 'cian', atomos: [['H', 1], ['C', 1], ['N', 1]] },

  // --- cloro: a série completa, os quatro degraus ---------------------------
  {
    tipo: 'oxiacido', familia: 'cloro', raiz: 'clor', raizIco: 'clór', central: 'Cl',
    atomos: [['H', 1], ['Cl', 1], ['O', 1]],
  },
  {
    tipo: 'oxiacido', familia: 'cloro', raiz: 'clor', raizIco: 'clór', central: 'Cl',
    atomos: [['H', 1], ['Cl', 1], ['O', 2]],
  },
  {
    tipo: 'oxiacido', familia: 'cloro', raiz: 'clor', raizIco: 'clór', central: 'Cl',
    atomos: [['H', 1], ['Cl', 1], ['O', 3]],
  },
  {
    tipo: 'oxiacido', familia: 'cloro', raiz: 'clor', raizIco: 'clór', central: 'Cl',
    atomos: [['H', 1], ['Cl', 1], ['O', 4]],
  },

  // --- bromo: a mesma série, com a mesma conta -------------------------------
  {
    tipo: 'oxiacido', familia: 'bromo', raiz: 'brom', raizIco: 'brôm', central: 'Br',
    atomos: [['H', 1], ['Br', 1], ['O', 1]],
  },
  {
    tipo: 'oxiacido', familia: 'bromo', raiz: 'brom', raizIco: 'brôm', central: 'Br',
    atomos: [['H', 1], ['Br', 1], ['O', 2]],
  },
  {
    tipo: 'oxiacido', familia: 'bromo', raiz: 'brom', raizIco: 'brôm', central: 'Br',
    atomos: [['H', 1], ['Br', 1], ['O', 3]],
  },
  {
    tipo: 'oxiacido', familia: 'bromo', raiz: 'brom', raizIco: 'brôm', central: 'Br',
    atomos: [['H', 1], ['Br', 1], ['O', 4]],
  },

  // --- iodo ------------------------------------------------------------------
  {
    tipo: 'oxiacido', familia: 'iodo', raiz: 'iod', raizIco: 'iód', central: 'I',
    atomos: [['H', 1], ['I', 1], ['O', 1]],
  },
  {
    tipo: 'oxiacido', familia: 'iodo', raiz: 'iod', raizIco: 'iód', central: 'I',
    atomos: [['H', 1], ['I', 1], ['O', 2]],
  },
  {
    tipo: 'oxiacido', familia: 'iodo', raiz: 'iod', raizIco: 'iód', central: 'I',
    atomos: [['H', 1], ['I', 1], ['O', 3]],
  },
  {
    tipo: 'oxiacido', familia: 'iodo', raiz: 'iod', raizIco: 'iód', central: 'I',
    atomos: [['H', 1], ['I', 1], ['O', 4]],
  },

  // --- enxofre: só dois degraus, porque o enxofre só tem dois ----------------
  {
    tipo: 'oxiacido', familia: 'enxofre', raiz: 'sulfur', raizIco: 'sulfúr', central: 'S',
    atomos: [['H', 2], ['S', 1], ['O', 3]],
  },
  {
    tipo: 'oxiacido', familia: 'enxofre', raiz: 'sulfur', raizIco: 'sulfúr', central: 'S',
    atomos: [['H', 2], ['S', 1], ['O', 4]],
  },

  // --- nitrogênio ------------------------------------------------------------
  {
    tipo: 'oxiacido', familia: 'nitrogenio', raiz: 'nitr', raizIco: 'nítr', central: 'N',
    atomos: [['H', 1], ['N', 1], ['O', 2]],
  },
  {
    tipo: 'oxiacido', familia: 'nitrogenio', raiz: 'nitr', raizIco: 'nítr', central: 'N',
    atomos: [['H', 1], ['N', 1], ['O', 3]],
  },

  // --- fósforo: três degraus, e o hipo- que ninguém espera -------------------
  // O H₃PO₂ é a carta que prova a regra: três hidrogênios, dois oxigênios,
  // fósforo +1 — dois abaixo do -oso, logo hipofosforoso.
  {
    tipo: 'oxiacido', familia: 'fosforo', raiz: 'fosfor', raizIco: 'fosfór', central: 'P',
    atomos: [['H', 3], ['P', 1], ['O', 2]],
  },
  {
    tipo: 'oxiacido', familia: 'fosforo', raiz: 'fosfor', raizIco: 'fosfór', central: 'P',
    atomos: [['H', 3], ['P', 1], ['O', 3]],
  },
  {
    tipo: 'oxiacido', familia: 'fosforo', raiz: 'fosfor', raizIco: 'fosfór', central: 'P',
    atomos: [['H', 3], ['P', 1], ['O', 4]],
  },

  // --- famílias de um degrau só ---------------------------------------------
  {
    tipo: 'oxiacido', familia: 'carbono', raiz: 'carbon', raizIco: 'carbôn', central: 'C',
    atomos: [['H', 2], ['C', 1], ['O', 3]],
  },
  {
    tipo: 'oxiacido', familia: 'boro', raiz: 'bor', raizIco: 'bór', central: 'B',
    atomos: [['H', 3], ['B', 1], ['O', 3]],
  },
  {
    tipo: 'oxiacido', familia: 'cromo', raiz: 'crom', raizIco: 'crôm', central: 'Cr',
    atomos: [['H', 2], ['Cr', 1], ['O', 4]],
  },
]
