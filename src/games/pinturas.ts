import { QUADROS } from '@/data/pinturas'
import type { Quadro } from '@/data/pinturas'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Quadro → pintor.
 *
 * **A carta é o quadro.** Trinta e três das trinta e oito mostram a reprodução;
 * as outras cinco mostram o título, porque não existe reprodução delas que este
 * projeto possa usar — o porquê de cada uma está em `scripts/gen-pinturas.mjs`,
 * que é quem baixa os arquivos para `public/pinturas/`.
 *
 * As imagens ficam em `public/` e não no bundle, pelo mesmo motivo das
 * bandeiras: são 6,7 MB e cada carta paga só a sua. A diferença é que bandeira
 * vem de um pacote npm e quadro vem de museu, então aqui existe um script de
 * download em vez de uma dependência.
 *
 * As cinco sem imagem continuam valendo como carta: o título sozinho é uma
 * pergunta legítima, e tirá-las do baralho seria perder Antropofagia, Café e Os
 * Retirantes por um problema de acervo, não de conteúdo.
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
    // Com imagem, a pergunta é o quadro e mais nada: pôr o título junto
    // devolveria de graça a carta que a imagem acabou de tornar difícil — quem
    // reconhece "Guernica" escrito não precisou olhar para o quadro. O `alt` é
    // genérico pelo mesmo motivo, como nas bandeiras.
    //
    // Sem imagem, o ano entra no enunciado porque situa a obra sem entregar o
    // pintor: 1937 não diz "Picasso" a quem não sabe, mas diz "século XX" a
    // quem sabe.
    pergunta: q.imagem
      ? {
          kind: 'imagem',
          valor: `${import.meta.env.BASE_URL}pinturas/${q.id}.jpg`,
          alt: 'Quadro a identificar',
          tamanho: 'quadro',
        }
      : { kind: 'texto', valor: `${q.obra}, ${q.ano}` },
    dica: 'pintor',
    // Dizer algo sobre a resposta sem deixar de aceitá-la; aqui, desfazer as
    // confusões de título. Explicação e não aviso: passa com a carta, porque é
    // sobre aquele quadro e mais nenhum.
    ...(q.aviso ? { explicacao: q.aviso } : {}),
    resposta: {
      tipo: 'texto',
      canonica: q.pintor,
      aceitas: [...q.aceitas],
    },
    // O título vai no gabarito sempre, e nas cartas com imagem ele é metade do
    // que se aprende: quem errou fica sabendo de quem é E que quadro era.
    gabarito: `${q.pintor} — ${q.obra}, ${q.ano}`,
  }
}

export const pinturas: JogoFlashcard = {
  id: 'pinturas',
  mecanica: 'flashcard',
  nome: 'Pinturas',
  icone: '🖼',
  resumo: 'Aparece o quadro, você escreve o pintor.',
  categoria: 'humanas',
  unidade: { singular: 'quadro', plural: 'quadros' },
  comoJogar: [
    'Aparece o quadro e você escreve quem pintou.',
    'Só o sobrenome basta; acento e maiúscula não importam.',
    'Quase metade do baralho é brasileira: Abaporu, Operários, Os Retirantes, A Boba.',
    'Cinco cartas vêm sem imagem, com o título no lugar: não existe reprodução delas que este app possa usar.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(QUADROS).map(cartaQuadro),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
