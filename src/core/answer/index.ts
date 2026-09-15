import { arredondarMantissa, interpretarNumero, limparInteiro } from './number'
import { distancia, normalizarTexto } from './normalize'
import type { Contexto, EspecResposta, Resultado } from './types'

export * from './types'
export { interpretarNumero, limparInteiro } from './number'
export { distancia, normalizarTexto, semAcento } from './normalize'

/** Uma forma canônica precisa deste tamanho para tolerar erro de digitação. */
const TAMANHO_MINIMO_PARA_TYPO = 7

const CERTO = (motivo: Resultado['motivo']): Resultado => ({ veredito: 'certo', motivo })
const ERRADO = (motivo: Resultado['motivo'], explicacao?: string): Resultado => ({
  veredito: 'errado',
  motivo,
  explicacao,
})

/**
 * Decide se uma resposta está certa. É o único lugar do projeto que faz isso —
 * nenhuma engine compara string por conta própria.
 */
export function validar(entrada: string, esperado: EspecResposta, ctx: Contexto): Resultado {
  if (entrada.trim() === '') return ERRADO('vazio')

  switch (esperado.tipo) {
    case 'texto':
      return validarTexto(entrada, esperado, ctx)
    case 'simbolo':
      return validarSimbolo(entrada, esperado, ctx)
    case 'numero':
      return validarNumero(entrada, esperado)
    case 'inteiroGrande': {
      const limpo = limparInteiro(entrada)
      if (limpo === null) return ERRADO('nao-numerico')
      return limpo === esperado.valor ? CERTO('exato') : ERRADO('diferente')
    }
    case 'digito':
      return entrada.trim() === esperado.valor ? CERTO('exato') : ERRADO('diferente')
    case 'escolha':
      return Number(entrada) === esperado.indiceCorreto ? CERTO('exato') : ERRADO('diferente')
  }
}

function validarTexto(
  entrada: string,
  esperado: Extract<EspecResposta, { tipo: 'texto' }>,
  ctx: Contexto,
): Resultado {
  const ignorarArtigos = esperado.opcoes?.ignorarArtigos ?? true
  const alvo = normalizarTexto(entrada, ignorarArtigos)
  const aceitas = esperado.aceitas.map((a) => normalizarTexto(a, ignorarArtigos))

  if (aceitas.includes(alvo)) {
    const canonica = normalizarTexto(esperado.canonica, ignorarArtigos)
    return CERTO(alvo === canonica ? 'exato' : 'sinonimo')
  }

  if (esperado.opcoes?.tolerarTypo === false) return ERRADO('diferente')

  const perto = aceitas.find(
    (a) => a.length >= TAMANHO_MINIMO_PARA_TYPO && distancia(alvo, a) <= 1,
  )
  if (!perto) return ERRADO('diferente')

  // Trava contra dar de graça a resposta de OUTRO item do baralho: se o que ele
  // digitou também está a um caractere de outra resposta possível, a entrada é
  // ambígua — e ambiguidade nunca é resolvida a favor do jogador.
  const ambigua = [...(ctx.vizinhanca ?? [])].some((v) => distancia(alvo, v) <= 1)
  if (ambigua) return ERRADO('diferente')

  // Typo aceito mantém o combo mas não é acerto cheio: a UI mostra a grafia certa.
  return {
    veredito: 'quase',
    motivo: 'typo',
    explicacao: `Quase — o certo é "${esperado.canonica}".`,
  }
}

function validarSimbolo(
  entrada: string,
  esperado: Extract<EspecResposta, { tipo: 'simbolo' }>,
  ctx: Contexto,
): Resultado {
  const alvo = entrada.trim()
  const aceitas = [esperado.canonica, ...(esperado.aceitas ?? [])]

  // Comparação byte a byte, de propósito: em química e no SI a caixa não é
  // formatação, é a informação. Co é cobalto, CO é monóxido de carbono;
  // k é quilo, K é kelvin.
  if (aceitas.includes(alvo)) return CERTO(alvo === esperado.canonica ? 'exato' : 'sinonimo')

  const soACaixa = aceitas.some((a) => a.toLowerCase() === alvo.toLowerCase())
  if (!soACaixa) return ERRADO('diferente')

  const explicacao = `Quase — a caixa faz parte do símbolo: é "${esperado.canonica}".`
  // Em morte súbita ou valendo recorde, "quase" não salva ninguém.
  return ctx.rigor === 'estrito'
    ? ERRADO('caixa-errada', explicacao)
    : { veredito: 'quase', motivo: 'caixa-errada', explicacao }
}

function validarNumero(
  entrada: string,
  esperado: Extract<EspecResposta, { tipo: 'numero' }>,
): Resultado {
  const lido = interpretarNumero(entrada)
  if (!lido) return ERRADO('nao-numerico')

  if (lido.negativo !== (esperado.negativo ?? false)) return ERRADO('diferente')

  const n = lido.significativos

  // A régua é quantos algarismos ele lembrou: arredondamos a referência para a
  // precisão que ele deu e comparamos. Assim "3,00e8" e "299792458" são ambos
  // certos, com pontuação diferente.
  const ref = arredondarMantissa(esperado.mantissa, n)
  const expoenteRef = esperado.expoente + ref.ajusteExpoente

  if (lido.expoente !== expoenteRef) {
    return ERRADO('expoente-errado', 'A ordem de grandeza não bate.')
  }
  if (lido.mantissa !== ref.mantissa) return ERRADO('diferente')

  if (n < esperado.sigMin) {
    return {
      veredito: 'quase',
      motivo: 'precisao-insuficiente',
      digitosCorretos: n,
      explicacao: `Ordem de grandeza certa, mas quero ${esperado.sigMin} algarismos.`,
    }
  }

  return { veredito: 'certo', motivo: 'exato', digitosCorretos: n }
}
