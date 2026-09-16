import { DISTRATORES_FIXOS, LUAS, NOME_PLANETA, distratores } from '@/data/luas'
import type { Lua } from '@/data/luas'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * De quem é esta lua?
 *
 * **Escolha de quatro, e não resposta digitada.** É a decisão que define o
 * jogo, e ela vai contra o hábito do projeto — filosofia, sociologia e
 * bandeiras são digitados justamente para cobrar lembrar em vez de reconhecer.
 * Aqui três coisas mudam a conta:
 *
 * 1. **O conjunto de respostas é fechado, minúsculo e já conhecido.** São seis
 *    planetas com lua (Mercúrio e Vênus não têm nenhuma). Digitar não cobra
 *    repertório nenhum: ninguém erra a *grafia* de "Saturno", e a lista de
 *    candidatos já está na cabeça de quem abriu o jogo. O que se mede, digitado
 *    ou escolhido, é exatamente a mesma associação lua→planeta.
 * 2. **O que ensina é o distrator, e digitado não existe distrator.** Numa
 *    carta aberta, Reia é "acertei ou não". Com Júpiter, Urano e Netuno na
 *    tela, a carta pergunta a coisa certa: as luas de Júpiter e de Saturno
 *    dividem a mesma mitologia, e é aí que a memória escorrega. Ver `CONFUNDEM`
 *    em `data/luas.ts`.
 * 3. **O baralho tem respostas repetidas, e o motor de texto não foi feito para
 *    isso.** Sete cartas respondem "Saturno". A trava de ambiguidade do
 *    validador monta a vizinhança com as respostas das *outras* cartas do
 *    baralho — então "Saturno" estaria na própria vizinhança, e qualquer dedo
 *    errado ("Satrno") seria recusado como ambíguo em vez de perdoado como
 *    typo. Contornar isso exigiria um caso especial no núcleo para um jogo só.
 *
 * O preço honesto da escolha é o chute: 25% por carta contra 1/6 se fosse
 * aberta — e, na prática, mais que isso, porque quem elimina os rochosos já
 * está em 33%. É pequeno perto do que se ganha, e o baralho de 22 cartas dilui:
 * acertar 20 por sorte não acontece.
 */

/**
 * As quatro alternativas de uma carta.
 *
 * Dois distratores fixos (os que confundem de verdade) e um sorteado do resto.
 * O sorteio existe para o **conjunto** de opções não virar a resposta: com três
 * fixos, toda carta de Júpiter mostraria sempre Saturno/Urano/Netuno e toda
 * carta marciana mostraria Terra — duas partidas e a pessoa aprende a ler o
 * cardápio em vez de aprender as luas.
 */
function alternativas(lua: Lua, rng: Rng): readonly string[] {
  const candidatos = distratores(lua.planeta)
  const fixos = candidatos.slice(0, DISTRATORES_FIXOS)
  const giratorio = rng.pick(candidatos.slice(DISTRATORES_FIXOS))
  return rng.shuffle([lua.planeta, ...fixos, giratorio].map((p) => NOME_PLANETA[p]))
}

function carta(lua: Lua, rng: Rng): Carta {
  const certo = NOME_PLANETA[lua.planeta]
  const opcoes = alternativas(lua, rng)
  return {
    tipo: 'escolha',
    id: `lua-${lua.id}`,
    // Só o nome da lua: qualquer complemento ("a lua Io") já seria dica, e o
    // reconhecimento do nome é metade do que se pergunta.
    pergunta: { kind: 'texto', valor: lua.nome },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(certo),
    // Quem errou leva o fato junto: saber que Encélado é de Saturno gruda
    // melhor com o gêiser do que sozinho.
    gabarito: `${certo} — ${lua.nota}`,
  }
}

export function montarBaralhoLuas(rng: Rng): readonly Carta[] {
  return rng.shuffle(LUAS).map((l) => carta(l, rng))
}

export const luas: JogoFlashcard = {
  id: 'luas',
  mecanica: 'flashcard',
  nome: 'Luas',
  icone: '🌙',
  resumo: 'Aparece a lua, você diz de qual planeta ela é.',
  categoria: 'fisica',
  unidade: { singular: 'lua', plural: 'luas' },
  comoJogar: [
    'Aparece "Ganimedes" e você escolhe Júpiter entre as quatro opções.',
    'Só as 22 luas de nome consagrado em português — as galileanas, as principais de Saturno, as cinco de Urano.',
    'As opções erradas são sempre planetas que se confundem: Júpiter e Saturno dividem a mesma mitologia.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: montarBaralhoLuas,
    fim: 'baralho',
    teclado: 'texto',
  }),
}
