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
 * Cola tudo: tira espaço e qualquer separador que `semPontuacao` não conheça.
 *
 * Roda **depois** de `normalizarTexto` inteiro, e é por isso que não bagunça a
 * ordem das etapas: `semArtigos` precisa dos espaços para achar as fronteiras de
 * palavra, e insere espaços no lugar do artigo removido — só quando esse
 * trabalho terminou é que os espaços deixam de ter serventia.
 */
export const compactar = (s: string): string => s.replace(/[^0-9a-z]/gi, '')

/**
 * As chaves de comparação de um texto: forma compactada, sem espaço nenhum.
 *
 * São **até duas** porque quem digita sem espaço também digita sem enxergar
 * artigo: em "republicademocraticadocongo" não existe fronteira de palavra para
 * `semArtigos` achar o "do", e tirar "do" de dentro de palavra colada arrancaria
 * pedaço de nome de verdade (Do-minicana, Lon-dres). Então a forma aceita é
 * registrada nas duas versões — com e sem os artigos — e basta uma casar.
 *
 * A primeira é sempre a principal: é ela que entra na distância de edição.
 */
export function chavesDeTexto(texto: string, ignorarArtigos = true): readonly string[] {
  const comArtigos = compactar(normalizarTexto(texto, false))
  if (!ignorarArtigos) return [comArtigos]
  const semOsArtigos = compactar(normalizarTexto(texto, true))
  return semOsArtigos === comArtigos ? [comArtigos] : [semOsArtigos, comArtigos]
}

/** Só a chave principal — o que a maioria das comparações quer. */
export const chaveDeTexto = (texto: string, ignorarArtigos = true): string =>
  chavesDeTexto(texto, ignorarArtigos)[0] as string

/**
 * Quantos caracteres de erro uma forma aceita perdoa, pelo tamanho dela.
 *
 * Escala em vez de ser fixo em 1 porque errar não é um evento por resposta, é
 * uma taxa por tecla: "República Centro-Africana" colada dá 23 caracteres, e
 * exigir 22 certos e 1 errado é exigir quase perfeição justamente onde digitar
 * é mais trabalhoso. Um erro a cada 7 caracteres, que é a mesma régua de antes
 * ("sete letras valem um erro") aplicada até o fim em vez de só no primeiro
 * degrau: 7→1, 14→2, 21→3.
 *
 * O teto de 3 é deliberado: acima disso a distância de edição deixa de
 * significar "errei de dedo" e passa a significar "lembrei de outro país", e aí
 * quem decide já não é a misericórdia, é a trava de vizinhança.
 */
export const LIMITE_MAXIMO_DE_ERRO = 3
export const CARACTERES_POR_ERRO = 7
export const limiteDeErro = (tamanho: number): number =>
  Math.min(LIMITE_MAXIMO_DE_ERRO, Math.floor(tamanho / CARACTERES_POR_ERRO))

/**
 * Distância de Damerau-Levenshtein (variante OSA) com corte: para assim que
 * fica claro que passou de `limite`.
 *
 * Damerau e não Levenshtein puro porque a troca de teclas vizinhas é o erro de
 * digitação mais comum que existe — "rebpulica" por "republica" — e no
 * Levenshtein ela custa 2, o mesmo que dois erros independentes. Aqui custa 1,
 * que é o que ela é: um dedo fora de hora.
 *
 * O corte não é enfeite: a validação roda esta função contra todas as formas do
 * baralho a cada resposta, e a matriz completa de 195 países seria desperdício.
 */
export function distancia(a: string, b: string, limite = 1): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > limite) return limite + 1

  // Três linhas da matriz: a anterior basta para inserção/remoção/troca, e a
  // transposição precisa enxergar duas linhas atrás.
  let doisAtras: number[] = []
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i++) {
    const atual = [i]
    let menorDaLinha = i

    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      let valor = Math.min(
        (atual[j - 1] ?? 0) + 1,
        (anterior[j] ?? 0) + 1,
        (anterior[j - 1] ?? 0) + custo,
      )

      // Transposição de adjacentes: "ab" onde se esperava "ba", custo 1.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        valor = Math.min(valor, (doisAtras[j - 2] ?? 0) + 1)
      }

      atual.push(valor)
      if (valor < menorDaLinha) menorDaLinha = valor
    }

    // Toda a linha já passou do limite: nenhuma continuação melhora isso.
    if (menorDaLinha > limite) return limite + 1
    doisAtras = anterior
    anterior = atual
  }

  return anterior[b.length] ?? limite + 1
}
