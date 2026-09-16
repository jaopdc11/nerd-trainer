import { ACIDOS, formasDoAcido, formulaDoAcido, nomeDoAcido } from '@/data/acidos'
import type { Acido } from '@/data/acidos'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Nomenclatura de ácidos: aparece a fórmula, você dá o nome.
 *
 * **Digitado, e não escolha de quatro.** A tentação era grande, porque os
 * distratores sairiam de graça e seriam ótimos: os outros três degraus da mesma
 * série (hipocloroso, cloroso, clórico, perclórico) são exatamente as respostas
 * que um humano marca, do mesmo jeito que a geometria eletrônica é o distrator
 * perfeito na VSEPR. O problema é o que a carta viraria: com a série inteira na
 * tela, o item deixa de cobrar a regra e passa a cobrar contar oxigênio e
 * ordenar quatro palavras que já estão escritas. A régua do projeto é a dos
 * pensadores — card troca recordar por reconhecer, e aqui o que se quer é
 * justamente produzir "hipofosforoso" a partir de H₃PO₂, prefixo e sufixo
 * inclusive. O custo de digitar é baixo: são palavras comuns, sem símbolo que o
 * teclado não tenha — ao contrário de "6,674×10⁻¹¹", que foi o que empurrou as
 * constantes físicas para múltipla escolha.
 *
 * **E a tolerância a erro de digitação fica desligada.** Esta é a decisão que
 * anda junto com a de cima, porque a régua padrão (um caractere a cada sete, ver
 * `OpcoesTexto`) engoliria o jogo inteiro:
 *
 * - "cloroso" × "clórico" dão chaves de 7 caracteres a distância 2 — a
 *   tolerância de 1 não alcança, e esse par estaria a salvo;
 * - mas "ácido sulfúrico" × "ácido sulfuroso" colapsam em 14 caracteres, e 14
 *   valem **2** de tolerância. A distância entre os dois é exatamente 2. Ou
 *   seja: com a tolerância ligada, responder "sulfuroso" no H₂SO₄ cairia dentro
 *   da misericórdia, e quem barraria seria só a trava de vizinhança — que
 *   depende de o irmão estar no baralho como carta digitada. Fazer a correção do
 *   jogo depender de qual outra carta por acaso existe é fundação ruim.
 *
 * As duas letras que separam -oso de -ico são a resposta inteira. Perdoá-las é
 * perdoar precisamente o erro que o jogo existe para pegar.
 *
 * O baralho cobre séries **completas** — os quatro do cloro, os quatro do bromo,
 * os quatro do iodo, os três do fósforo. Ver o comentário de `ACIDOS`: meia
 * série ensina nomes, série inteira ensina a regra.
 */

function cartaAcido(acido: Acido): Carta {
  return {
    tipo: 'digitada',
    id: `acido-${formulaDoAcido(acido)}`,
    pergunta: { kind: 'texto', valor: formulaDoAcido(acido) },
    resposta: {
      tipo: 'texto',
      canonica: nomeDoAcido(acido),
      aceitas: formasDoAcido(acido),
      opcoes: { tolerarTypo: false },
    },
    gabarito: nomeDoAcido(acido),
  }
}

export const nomenclaturaAcidos: JogoFlashcard = {
  id: 'nomenclatura-acidos',
  mecanica: 'flashcard',
  nome: 'Nomenclatura de ácidos',
  icone: 'HClO₄',
  resumo: 'Hipo-, -oso, -ico, per-: aparece a fórmula, você dá o nome do ácido.',
  categoria: 'quimica',
  unidade: { singular: 'ácido', plural: 'ácidos' },
  comoJogar: [
    'Aparece HClO₂ e você escreve "cloroso" — ou "ácido cloroso", tanto faz.',
    'A série é regra, não decoreba: dois oxigênios abaixo do -ico vira -oso, quatro abaixo vira hipo-...-oso, dois acima vira per-...-ico.',
    'Sem oxigênio o sufixo é sempre -ídrico: HCl é clorídrico.',
    'Uma letra errada não passa — "cloroso" e "clórico" são ácidos diferentes.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(ACIDOS).map(cartaAcido),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
