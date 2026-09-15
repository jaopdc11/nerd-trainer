import { FORMULAS } from '@/data/formulas'
import type { Formula } from '@/data/formulas'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Identificar fórmulas, nas duas direções.
 *
 * - fórmula → nome: a fórmula aparece renderizada e o nome é digitado.
 * - nome → fórmula: o nome aparece e ele escolhe entre quatro fórmulas. Essa
 *   direção é múltipla escolha porque digitar LaTeX de cabeça mediria
 *   digitação, não memória.
 */

const POR_ID = new Map(FORMULAS.map((f) => [f.id, f]))

/**
 * Três distratores, em camadas, e cada camada tem um papel:
 *
 * 1. **`confundeCom`**, curado à mão. É o distrator que dá valor ao item —
 *    Gauss elétrica contra Gauss magnética, E=hf contra λ=h/p.
 * 2. **Mesma silhueta visual**: mesmo domínio, maior sobreposição de tags.
 *    Impede eliminar as alternativas de relance, sem ler.
 * 3. **Um fácil**, de outro domínio. Três distratores duríssimos viram chute
 *    frustrante; a assimetria mantém o item jogável.
 */
export function escolherDistratores(alvo: Formula, rng: Rng): Formula[] {
  const proibidos = new Set<string>([alvo.id])
  const escolhidos: Formula[] = []

  const aceitar = (f: Formula | undefined): boolean => {
    if (!f || proibidos.has(f.id)) return false
    // Uma forma equivalente da mesma lei apareceria como segunda alternativa
    // correta. Isso tornaria o item sem resposta.
    if (alvo.equivalentes.includes(f.mathml)) return false
    proibidos.add(f.id)
    escolhidos.push(f)
    return true
  }

  // 1. confusão clássica
  for (const id of rng.shuffle(alvo.confundeCom)) {
    if (aceitar(POR_ID.get(id))) break
  }

  // 2. mesma silhueta
  const mesmoDominio = FORMULAS.filter((f) => f.dominio === alvo.dominio && !proibidos.has(f.id))
  const porSemelhanca = [...mesmoDominio].sort((a, b) => {
    const peso = (f: Formula) => f.tags.filter((t) => alvo.tags.includes(t)).length
    return peso(b) - peso(a)
  })
  aceitar(porSemelhanca[0])

  // 3. o fácil, de outro domínio
  const deLonge = FORMULAS.filter((f) => f.dominio !== alvo.dominio && !proibidos.has(f.id))
  aceitar(rng.pick(deLonge))

  // Rede de segurança: completa com o que sobrar, se alguma camada falhou.
  const resto = rng.shuffle(FORMULAS.filter((f) => !proibidos.has(f.id)))
  for (const f of resto) {
    if (escolhidos.length >= 3) break
    aceitar(f)
  }

  return escolhidos.slice(0, 3)
}

function cartaParaNome(f: Formula): Carta {
  return {
    tipo: 'digitada',
    id: `formula-nome-${f.id}`,
    pergunta: { kind: 'mathml', valor: f.mathml },
    resposta: {
      tipo: 'texto',
      canonica: f.nome,
      aceitas: [f.nome, ...f.sinonimos],
      // Nomes de fórmula são longos; um caractere trocado é deslize, não
      // desconhecimento. A trava de vizinhança protege contra o abuso.
      opcoes: { ignorarArtigos: true },
    },
    gabarito: f.nome,
  }
}

function cartaParaFormula(f: Formula, rng: Rng): Carta {
  const distratores = escolherDistratores(f, rng)
  const ordem = rng.shuffle([f, ...distratores])

  return {
    tipo: 'escolha',
    id: `formula-escolha-${f.id}`,
    pergunta: { kind: 'texto', valor: f.nome },
    alternativas: ordem.map((x) => ({ kind: 'mathml' as const, valor: x.mathml })),
    indiceCorreto: ordem.findIndex((x) => x.id === f.id),
    gabarito: f.nome,
  }
}

export const formulas: JogoFlashcard = {
  id: 'formulas',
  mecanica: 'flashcard',
  nome: 'Identificar fórmulas',
  icone: '∮',
  resumo: 'Maxwell, Schrödinger, Bhaskara — 54 fórmulas nos dois sentidos.',
  categoria: 'fisica',
  unidade: { singular: 'fórmula', plural: 'fórmulas' },
  comoJogar: [
    'No modo nome, escreva como quiser: "2ª lei de Newton" ou "princípio fundamental da dinâmica".',
    'Acento é opcional e artigos são ignorados.',
    'No modo escolha, os distratores são as confusões clássicas — leia antes de clicar.',
  ],
  modos: [
    { id: 'nome', nome: 'Fórmula → nome', resumo: 'Vê a fórmula, escreve o nome' },
    { id: 'escolha', nome: 'Nome → fórmula', resumo: 'Vê o nome, escolhe entre quatro' },
    { id: 'misto', nome: 'Misto', resumo: 'As duas direções, alternando' },
  ],
  config: (modoId) => ({
    montarBaralho: (rng) =>
      rng.shuffle(FORMULAS).map((f) => {
        if (modoId === 'escolha') return cartaParaFormula(f, rng)
        if (modoId === 'nome') return cartaParaNome(f)
        return rng.chance(0.5) ? cartaParaNome(f) : cartaParaFormula(f, rng)
      }),
    fim: 'morte-subita',
    teclado: 'texto',
  }),
}
