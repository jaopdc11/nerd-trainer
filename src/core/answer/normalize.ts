/**
 * Etapas de normalização de texto, exportadas uma a uma porque cada uma precisa
 * de teste próprio. A ordem em `normalizarTexto` é fixa de propósito: mexer nela
 * muda o que o jogo aceita, e isso tem que ser uma decisão, não um acidente.
 */

export const aparar = (s: string): string => s.trim().replace(/\s+/g, ' ')

/** "lítio" → "litio". Decompõe e joga fora os diacríticos combinantes. */
export const semAcento = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')

export const minusculo = (s: string): string => s.toLocaleLowerCase('pt-BR')

export const semPontuacao = (s: string): string => s.replace(/[.,;:!?'"´`^~\-–—()]/g, '')

/**
 * "2ª lei" → "2 lei". Sem isso, cada fórmula precisaria listar "2ª", "2a", "2º"
 * e "segunda" como sinônimos separados.
 *
 * São duas regras porque os indicadores tipográficos (ª º °) não são caracteres
 * de palavra e `\b` não funciona depois deles, enquanto o "a"/"o" datilografado
 * precisa justamente de `\b` para não comer a primeira letra da palavra seguinte.
 */
export const ordinais = (s: string): string =>
  s.replace(/(\d+)\s*[ªº°]/g, '$1').replace(/(\d+)[ao](?=\s|$)/g, '$1')

/**
 * Remove artigos e preposições soltas. É o que faz "a segunda lei de Newton"
 * casar com "segunda lei Newton" sem oito sinônimos por item.
 */
export const semArtigos = (s: string): string =>
  s.replace(/\b(o|a|os|as|de|da|do|das|dos|e)\b/g, ' ')

/** Pipeline padrão de texto livre em pt-BR. */
export function normalizarTexto(texto: string, ignorarArtigos = false): string {
  let s = aparar(texto)
  s = minusculo(s)
  s = semAcento(s)
  s = ordinais(s)
  s = semPontuacao(s)
  if (ignorarArtigos) s = semArtigos(s)
  return aparar(s)
}

/**
 * Distância de Levenshtein com corte: para assim que fica claro que passou de
 * `limite`. Só usamos limite 1, então a matriz completa seria desperdício.
 */
export function distancia(a: string, b: string, limite = 1): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > limite) return limite + 1

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i++) {
    const atual = [i]
    let menorDaLinha = i

    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      const valor = Math.min(
        (atual[j - 1] ?? 0) + 1,
        (anterior[j] ?? 0) + 1,
        (anterior[j - 1] ?? 0) + custo,
      )
      atual.push(valor)
      if (valor < menorDaLinha) menorDaLinha = valor
    }

    // Toda a linha já passou do limite: nenhuma continuação melhora isso.
    if (menorDaLinha > limite) return limite + 1
    anterior = atual
  }

  return anterior[b.length] ?? limite + 1
}
