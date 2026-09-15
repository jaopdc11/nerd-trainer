import { FORMULAS } from '@/data/formulas'
import type { Formula } from '@/data/formulas'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Mostra a fórmula renderizada e oferece quatro nomes para escolher.
 *
 * Era digitado antes, e era ruim: quem vê E = hf e escreve "relação de Planck"
 * sabe a física inteira, mas errava porque o nome canônico é "Relação de
 * Planck-Einstein". Isso media ortografia, não conhecimento. Com quatro opções,
 * o que o item cobra é reconhecer a fórmula — e a qualidade do exercício passa a
 * depender inteiramente dos distratores.
 */

const POR_ID = new Map(FORMULAS.map((f) => [f.id, f]))

/**
 * Três distratores, em camadas, e cada camada tem um papel:
 *
 * 1. **`confundeCom`**, curado à mão. É o distrator que dá valor ao item —
 *    Gauss elétrica contra Gauss magnética, E=hf contra λ=h/p. Sem ele, o
 *    exercício vira reconhecimento de silhueta.
 * 2. **Mesmo domínio, maior sobreposição de tags.** Impede eliminar as
 *    alternativas de relance, só pelo assunto.
 * 3. **Um de outro domínio**, deliberadamente mais fácil. Três distratores
 *    duríssimos viram chute frustrante; a assimetria mantém o item jogável.
 */
export function escolherDistratores(alvo: Formula, rng: Rng): Formula[] {
  const proibidos = new Set<string>([alvo.id])
  const escolhidos: Formula[] = []

  const aceitar = (f: Formula | undefined): boolean => {
    if (!f || proibidos.has(f.id)) return false
    // Uma forma equivalente da mesma lei apareceria como segunda alternativa
    // correta, e o item ficaria sem resposta.
    if (alvo.equivalentes.includes(f.mathml)) return false
    proibidos.add(f.id)
    escolhidos.push(f)
    return true
  }

  for (const id of rng.shuffle(alvo.confundeCom)) {
    if (aceitar(POR_ID.get(id))) break
  }

  const mesmoDominio = FORMULAS.filter((f) => f.dominio === alvo.dominio && !proibidos.has(f.id))
  const porSemelhanca = [...mesmoDominio].sort((a, b) => {
    const peso = (f: Formula) => f.tags.filter((t) => alvo.tags.includes(t)).length
    return peso(b) - peso(a)
  })
  aceitar(porSemelhanca[0])

  const deLonge = FORMULAS.filter((f) => f.dominio !== alvo.dominio && !proibidos.has(f.id))
  if (deLonge.length > 0) aceitar(rng.pick(deLonge))

  // Rede de segurança, caso alguma camada não tenha achado ninguém.
  for (const f of rng.shuffle(FORMULAS.filter((x) => !proibidos.has(x.id)))) {
    if (escolhidos.length >= 3) break
    aceitar(f)
  }

  return escolhidos.slice(0, 3)
}

function carta(f: Formula, rng: Rng): Carta {
  const opcoes = rng.shuffle([f, ...escolherDistratores(f, rng)])

  return {
    tipo: 'escolha',
    id: `formula-${f.id}`,
    pergunta: { kind: 'mathml', valor: f.mathml },
    alternativas: opcoes.map((x) => ({ kind: 'texto' as const, valor: x.nome })),
    indiceCorreto: opcoes.findIndex((x) => x.id === f.id),
    gabarito: f.nome,
  }
}

export const formulas: JogoFlashcard = {
  id: 'formulas',
  mecanica: 'flashcard',
  nome: 'Identificar fórmulas',
  icone: '∮',
  resumo: 'Maxwell, Schrödinger, Bhaskara — 54 fórmulas para reconhecer.',
  categoria: 'fisica',
  unidade: { singular: 'fórmula', plural: 'fórmulas' },
  comoJogar: [
    'A fórmula aparece na tela; escolha o nome dela entre as quatro opções.',
    'As opções erradas são as confusões clássicas — leia antes de clicar.',
    'O baralho vai até a última carta: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(FORMULAS).map((f) => carta(f, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
