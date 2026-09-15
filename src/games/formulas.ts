import { FORMULAS } from '@/data/formulas'
import type { JogoFlashcard } from '@/core/types'

/**
 * A fórmula aparece renderizada e você escreve o nome dela.
 *
 * A direção contrária (nome → escolher entre quatro fórmulas) foi tirada junto
 * com os modos; se voltar um dia, o que ela precisa é de um sorteador de
 * distratores que puxe das confusões clássicas — o dataset ainda traz o campo
 * `confundeCom` com elas mapeadas (Gauss elétrica × magnética, E=hf × λ=h/p).
 */
export const formulas: JogoFlashcard = {
  id: 'formulas',
  mecanica: 'flashcard',
  nome: 'Identificar fórmulas',
  icone: '∮',
  resumo: 'Maxwell, Schrödinger, Bhaskara — 54 fórmulas para nomear.',
  categoria: 'fisica',
  unidade: { singular: 'fórmula', plural: 'fórmulas' },
  comoJogar: [
    'Escreva o nome como quiser: "2ª lei de Newton" ou "princípio fundamental da dinâmica".',
    'Acento é opcional e artigos são ignorados.',
    'Um erro encerra a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) =>
      rng.shuffle(FORMULAS).map((f) => ({
        tipo: 'digitada' as const,
        id: `formula-${f.id}`,
        pergunta: { kind: 'mathml' as const, valor: f.mathml },
        resposta: {
          tipo: 'texto' as const,
          canonica: f.nome,
          aceitas: [f.nome, ...f.sinonimos],
          // Nomes de fórmula são longos; um caractere trocado é deslize, não
          // desconhecimento. A trava de vizinhança protege contra o abuso.
          opcoes: { ignorarArtigos: true },
        },
        gabarito: f.nome,
      })),
    fim: 'morte-subita',
    teclado: 'texto',
  }),
}
