import { ALFABETO_GREGO } from '@/data/alfabeto-grego'
import { CONSTANTES_FISICAS } from '@/data/constantes-fisicas'
import { PREFIXOS_SI } from '@/data/prefixos-si'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Os baralhos que rodam sobre a mecânica C.
 *
 * Cada `montarBaralho` recebe o RNG da engine e devolve as cartas já embaralhadas
 * — é dentro dele que os modos bidirecionais decidem a direção da pergunta.
 */

// --- alfabeto grego ---------------------------------------------------------

/** Símbolo → nome. A resposta é texto: acento e caixa não importam. */
function gregoParaNome(rng: Rng): readonly Carta[] {
  return rng.shuffle(ALFABETO_GREGO).map((letra): Carta => {
    const glifo = rng.chance(0.5) ? letra.minuscula : letra.maiuscula
    return {
      tipo: 'digitada',
      id: `grego-nome-${letra.ordem}`,
      pergunta: { kind: 'texto', valor: glifo },
      resposta: {
        tipo: 'texto',
        canonica: letra.nome,
        aceitas: [letra.nome, ...letra.sinonimos],
        // Nomes gregos são curtos e parecidos entre si (ni/mi, csi/qui):
        // tolerar um caractere aceitaria a letra errada.
        opcoes: { tolerarTypo: false },
      },
      gabarito: letra.nome,
    }
  })
}

export const alfabetoGrego: JogoFlashcard = {
  id: 'alfabeto-grego',
  mecanica: 'flashcard',
  nome: 'Alfabeto grego',
  icone: 'αβγ',
  resumo: 'As 24 letras: aparece o glifo, você escreve o nome.',
  categoria: 'matematica',
  unidade: { singular: 'letra', plural: 'letras' },
  comoJogar: [
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
    'A letra aparece em maiúscula ou minúscula, sorteada.',
    '"mi" e "mu" valem igual; acento é opcional.',
  ],
  config: () => ({
    montarBaralho: gregoParaNome,
    fim: 'baralho',
    teclado: 'texto',
  }),
}

// --- prefixos SI ------------------------------------------------------------

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const
const sobrescrito = (n: number): string => {
  const corpo = [...Math.abs(n).toString()].map((d) => SUP[Number(d)] ?? '').join('')
  return n < 0 ? `⁻${corpo}` : corpo
}

export const prefixosSI: JogoFlashcard = {
  id: 'prefixos-si',
  mecanica: 'flashcard',
  nome: 'Prefixos SI',
  icone: 'n·μ·M',
  resumo: 'De quetta a quecto: aparece a potência, você escreve o nome.',
  categoria: 'fisica',
  unidade: { singular: 'prefixo', plural: 'prefixos' },
  comoJogar: [
    'Aparece 10⁻⁹ e você escreve "nano".',
    'São 24, incluindo os quatro adotados pela CGPM em 2022.',
    'Acento e maiúscula não importam.',
  ],
  config: () => ({
    montarBaralho: (rng) =>
      rng.shuffle(PREFIXOS_SI).map(
        (p): Carta => ({
          tipo: 'digitada',
          id: `si-${p.nome}`,
          pergunta: { kind: 'texto', valor: `10${sobrescrito(p.expoente)}` },
          resposta: {
            tipo: 'texto',
            canonica: p.nome,
            aceitas: [p.nome, ...p.sinonimos],
            // Nomes de prefixo são curtos e parecidos (pico/peta, zepto/zetta):
            // tolerar um caractere aceitaria o prefixo errado.
            opcoes: { tolerarTypo: false },
          },
          gabarito: `${p.nome} (${p.simbolo})`,
        }),
      ),
    fim: 'baralho',
    teclado: 'texto',
  }),
}

// --- constantes físicas -----------------------------------------------------

/**
 * Quantos algarismos você lembra — agora em quatro opções.
 *
 * Era digitado, e digitar "6,674×10⁻¹¹" contra uma lista de catorze constantes
 * é castigo, não treino. Como card fica até melhor: os distratores podem ser a
 * mesma mantissa com o expoente trocado, que é exatamente o erro que interessa
 * pegar — quem confunde 10⁻¹¹ com 10⁻⁹ em G não sabe a constante.
 */
function cartaConstante(k: (typeof CONSTANTES_FISICAS)[number], rng: Rng): Carta {
  const certo = exibirValor(k.mantissa, k.expoente, k.unidade)

  // Três erros plausíveis: ordem de grandeza para mais, para menos, e a
  // mantissa de outra constante com o expoente certo.
  const outra = rng.pick(CONSTANTES_FISICAS.filter((c) => c.id !== k.id))
  const candidatos = [
    exibirValor(k.mantissa, k.expoente + rng.pick([1, 2, 3]), k.unidade),
    exibirValor(k.mantissa, k.expoente - rng.pick([1, 2, 3]), k.unidade),
    exibirValor(outra.mantissa.slice(0, k.mantissa.length), k.expoente, k.unidade),
  ]

  const errados = [...new Set(candidatos.filter((c) => c !== certo))]
  let ajuste = 4
  while (errados.length < 3) {
    const extra = exibirValor(k.mantissa, k.expoente + ajuste, k.unidade)
    if (extra !== certo && !errados.includes(extra)) errados.push(extra)
    ajuste++
  }

  const opcoes = rng.shuffle([certo, ...errados.slice(0, 3)])

  return {
    tipo: 'escolha',
    id: `const-${k.id}`,
    pergunta: { kind: 'texto', valor: `${k.nome}  (${k.simbolo})` },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(certo),
    gabarito: certo,
  }
}

function exibirValor(mantissa: string, expoente: number, unidade: string): string {
  const cabeca = mantissa.length > 1 ? `${mantissa[0]},${mantissa.slice(1)}` : mantissa
  const corpo = expoente === 0 ? cabeca : `${cabeca}×10${sobrescrito(expoente)}`
  return `${corpo} ${unidade}`
}

export const constantesFisicas: JogoFlashcard = {
  id: 'constantes-fisicas',
  mecanica: 'flashcard',
  nome: 'Constantes físicas',
  icone: 'ħ',
  resumo: 'c, h, G, k_B, N_A — reconheça o valor certo entre quatro.',
  categoria: 'fisica',
  unidade: { singular: 'constante', plural: 'constantes' },
  comoJogar: [
    'Escolha o valor certo da constante entre as quatro opções.',
    'As erradas costumam ter a mantissa certa e o expoente trocado.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(CONSTANTES_FISICAS).map((k) => cartaConstante(k, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
