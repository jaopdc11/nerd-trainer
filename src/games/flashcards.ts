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

/** Nome → símbolo. A resposta é símbolo, então a caixa importa (Σ ≠ σ). */
function gregoParaSimbolo(rng: Rng, minuscula: boolean): readonly Carta[] {
  return rng.shuffle(ALFABETO_GREGO).map((letra): Carta => {
    const alvo = minuscula ? letra.minuscula : letra.maiuscula
    return {
      tipo: 'digitada',
      id: `grego-simbolo-${letra.ordem}`,
      pergunta: { kind: 'texto', valor: letra.nome },
      dica: minuscula ? 'minúscula' : 'maiúscula',
      resposta: {
        tipo: 'simbolo',
        canonica: alvo,
        // As variantes são desenhos da mesma letra e valem só na minúscula.
        aceitas: minuscula ? [...(letra.variantes ?? [])] : [],
      },
      gabarito: alvo,
    }
  })
}

/** Símbolo → nome. Aqui a resposta é texto: acento e caixa não importam. */
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
  resumo: 'As 24 letras, do alfa ao ômega, nos dois sentidos.',
  categoria: 'matematica',
  unidade: { singular: 'letra', plural: 'letras' },
  comoJogar: [
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
    'No modo símbolo, a caixa importa — Σ não é σ.',
    'No modo nome, "mi" e "mu" valem igual; acento é opcional.',
  ],
  modos: [
    { id: 'nome', nome: 'Símbolo → nome', resumo: 'Vê a letra, escreve o nome' },
    { id: 'minuscula', nome: 'Nome → minúscula', resumo: 'Vê o nome, escreve α' },
    { id: 'maiuscula', nome: 'Nome → maiúscula', resumo: 'Vê o nome, escreve Α' },
  ],
  config: (modoId) => ({
    montarBaralho: (rng) =>
      modoId === 'minuscula'
        ? gregoParaSimbolo(rng, true)
        : modoId === 'maiuscula'
          ? gregoParaSimbolo(rng, false)
          : gregoParaNome(rng),
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
  resumo: 'De quetta a quecto, incluindo os quatro adotados em 2022.',
  categoria: 'fisica',
  unidade: { singular: 'prefixo', plural: 'prefixos' },
  comoJogar: [
    'No modo expoente, responda só o número: "-6" ou "−6".',
    'No modo símbolo, a caixa importa: k é quilo, K é kelvin.',
    'Para micro vale tanto μ quanto µ — e até "u".',
  ],
  modos: [
    { id: 'expoente', nome: 'Nome → expoente', resumo: 'micro → −6' },
    { id: 'simbolo', nome: 'Nome → símbolo', resumo: 'quilo → k' },
    { id: 'nome', nome: 'Expoente → nome', resumo: '10⁻⁹ → nano' },
  ],
  config: (modoId) => ({
    montarBaralho: (rng) =>
      rng.shuffle(PREFIXOS_SI).map((p): Carta => {
        if (modoId === 'simbolo') {
          return {
            tipo: 'digitada',
            id: `si-simbolo-${p.nome}`,
            pergunta: { kind: 'texto', valor: p.nome },
            resposta: {
              tipo: 'simbolo',
              canonica: p.simbolo,
              aceitas: [...(p.simbolosAceitos ?? [])],
            },
            gabarito: p.simbolo,
          }
        }
        if (modoId === 'nome') {
          return {
            tipo: 'digitada',
            id: `si-nome-${p.nome}`,
            pergunta: { kind: 'texto', valor: `10${sobrescrito(p.expoente)}` },
            resposta: {
              tipo: 'texto',
              canonica: p.nome,
              aceitas: [p.nome, ...p.sinonimos],
              opcoes: { tolerarTypo: false },
            },
            gabarito: p.nome,
          }
        }
        return {
          tipo: 'digitada',
          id: `si-expoente-${p.nome}`,
          pergunta: { kind: 'texto', valor: p.nome },
          dica: 'só o expoente',
          resposta: { tipo: 'inteiroGrande', valor: String(p.expoente) },
          gabarito: String(p.expoente),
        }
      }),
    fim: 'baralho',
    teclado: modoId === 'expoente' ? 'numerico' : 'texto',
  }),
}

// --- constantes físicas -----------------------------------------------------

export const constantesFisicas: JogoFlashcard = {
  id: 'constantes-fisicas',
  mecanica: 'flashcard',
  nome: 'Constantes físicas',
  icone: 'ħ',
  resumo: 'c, h, G, k_B, N_A… quantos algarismos você lembra de cada uma.',
  categoria: 'fisica',
  unidade: { singular: 'constante', plural: 'constantes' },
  comoJogar: [
    'Responda o valor; a unidade já está na tela e não precisa ser digitada.',
    'Três algarismos bastam: "3,00e8" vale tanto quanto "299792458".',
    'Acertar o valor e errar a potência de 10 conta como erro — o jogo avisa.',
  ],
  config: () => ({
    montarBaralho: (rng) =>
      rng.shuffle(CONSTANTES_FISICAS).map((k): Carta => {
        const cabeca =
          k.mantissa.length > 1 ? `${k.mantissa[0]},${k.mantissa.slice(1)}` : k.mantissa
        return {
          tipo: 'digitada',
          id: `const-${k.id}`,
          pergunta: { kind: 'texto', valor: `${k.nome}  (${k.simbolo})` },
          dica: `valor em ${k.unidade}`,
          resposta: {
            tipo: 'numero',
            mantissa: k.mantissa,
            expoente: k.expoente,
            sigMin: k.sigMin,
          },
          gabarito:
            k.expoente === 0
              ? `${cabeca} ${k.unidade}`
              : `${cabeca}×10${sobrescrito(k.expoente)} ${k.unidade}`,
        }
      }),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
