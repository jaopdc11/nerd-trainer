import { QUADROS } from '@/data/pinturas'
import type { Quadro } from '@/data/pinturas'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Quadro → pintor.
 *
 * **Este jogo é textual, e isso foi decidido, não esquecido.** A carta mostra o
 * nome da obra, não a obra. O motivo completo está no cabeçalho de
 * `data/pinturas.ts`, e o resumo é: as bandeiras podem ser imagens porque os
 * SVGs vêm do pacote `flag-icons`, que é dependência instalada; para pintura não
 * existe pacote equivalente, e as saídas seriam baixar de terceiros em tempo de
 * execução (o app não faz requisição de rede em partida, e um 404 aqui apagaria
 * a pergunta) ou versionar dezenas de megabytes de JPEG. Nenhuma das duas é
 * decisão que este jogo possa tomar sozinho.
 *
 * **Digitado**, pela régua do projeto: a resposta é um sobrenome curto e o que
 * se mede é lembrar de quem é. Múltipla escolha aqui seria pior que em qualquer
 * outro baralho de humanas — com "Guernica" na tela e Picasso entre quatro
 * opções, sobra reconhecimento de nome famoso.
 *
 * **`tolerarTypo` fica ligado** (o padrão): "Michelangelo" tem doze letras,
 * "Velázquez" nove, "Botticelli" dez. O par perigoso — Monet e Manet — foi
 * resolvido no dataset, tirando Manet do baralho, e não aqui apertando a régua
 * para todo mundo; ver `AUSENTES_DE_PROPOSITO`.
 *
 * O `dica` é "pintor" e não o ano: o ano já está no enunciado onde ajuda, e um
 * placeholder com a data faria o jogador achar que a resposta é a data.
 */
function cartaQuadro(q: Quadro): Carta {
  return {
    tipo: 'digitada',
    id: `pintura-${q.id}`,
    // O ano entra no enunciado porque situa a obra sem entregar o pintor —
    // 1937 não diz "Picasso" a quem não sabe, mas diz "século XX" a quem sabe.
    pergunta: { kind: 'texto', valor: `${q.obra}, ${q.ano}` },
    dica: 'pintor',
    // O mesmo uso que as bandeiras fazem do campo: dizer algo sobre a resposta
    // sem deixar de aceitá-la. Aqui ele desfaz as confusões de título.
    ...(q.aviso ? { aviso: q.aviso } : {}),
    resposta: {
      tipo: 'texto',
      canonica: q.pintor,
      aceitas: [...q.aceitas],
    },
    gabarito: `${q.pintor} — ${q.obra}, ${q.ano}`,
  }
}

export const pinturas: JogoFlashcard = {
  id: 'pinturas',
  mecanica: 'flashcard',
  nome: 'Pinturas',
  icone: '🖼',
  resumo: 'Aparece o nome do quadro, você escreve o pintor.',
  categoria: 'humanas',
  unidade: { singular: 'quadro', plural: 'quadros' },
  comoJogar: [
    'Aparece "Guernica, 1937" e você escreve Picasso.',
    'Só o sobrenome basta; acento e maiúscula não importam.',
    'Quase metade do baralho é brasileira: Abaporu, Operários, Os Retirantes, A Boba.',
    'O quadro não aparece na tela, só o nome — é um jogo de autoria, não de reconhecimento visual.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(QUADROS).map(cartaQuadro),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
