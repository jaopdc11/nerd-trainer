import { GRUPOS, SERES_VIVOS, confusoesDe } from '@/data/taxonomia'
import type { Grupo, SerVivo } from '@/data/taxonomia'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Ser vivo → grupo, em quatro opções.
 *
 * **Por que escolha e não digitação.** Pela régua do projeto, a mesma que mandou
 * as derivadas e as funções orgânicas virarem card: as respostas possíveis são
 * vinte palavras conhecidas, e digitar "equinodermo" ou "aracnídeo" contra o
 * relógio mede acentuação, não classificação. O contra-argumento — que card
 * troca lembrar por reconhecer — é real e é exatamente o que o desenho dos
 * distratores existe para pagar: quando as quatro opções na tela são mamífero,
 * peixe, réptil e ave, reconhecer o golfinho não é de graça.
 *
 * **O distrator nunca é sorteado.** Esta é a decisão que faz o jogo existir. Com
 * vinte grupos, três opções tiradas do chapéu para o golfinho dariam algo como
 * "porífero, miriápode, fungo" — e a carta passaria a medir se o jogador sabe
 * ler. Os errados saem sempre de `CONFUNDE_COM`, e nas cartas-armadilha o
 * primeiro deles é o grupo que a própria carta declara: peixe para o golfinho,
 * inseto para a aranha, planta para o coral. A opção que engana é obrigatória; o
 * resto é preenchimento.
 *
 * **Não há trecho de sorteio geral de verdade.** Ele está escrito como rede de
 * segurança, mas `taxonomia.test.ts` garante que toda lista de confusões tem
 * três ou mais entradas — ou seja, hoje o `for` sempre fecha os três errados
 * antes de chegar lá. É a mesma construção de `funcoes-organicas.ts`, e o teste
 * é o que a mantém verdadeira.
 */

/**
 * "golfinho" → "Golfinho".
 *
 * O dataset guarda o nome em minúscula porque é substantivo comum e porque é
 * assim que ele casa com o `popular` de `nomes-cientificos.ts`. Quem capitaliza
 * é a camada de exibição — guardar "Golfinho" com maiúscula no dado faria a
 * comparação entre os dois datasets depender de caixa, que é informação
 * nenhuma aqui.
 */
const maiuscular = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

function cartaSerVivo(s: SerVivo, rng: Rng): Carta {
  /*
   * Os errados, em ordem de quão tentadores são:
   * 1. o grupo que a carta declara confundível — a armadilha, quando há;
   * 2. os outros confundíveis do grupo certo, embaralhados;
   * 3. qualquer outro, só para fechar quatro opções se um dia alguém encolher o
   *    mapa. Hoje este terceiro trecho nunca é alcançado.
   */
  const candidatos: readonly Grupo[] = [
    ...(s.confundeCom ? [s.confundeCom] : []),
    ...rng.shuffle([...confusoesDe(s.grupo)]),
    ...rng.shuffle([...GRUPOS]),
  ]

  const errados: Grupo[] = []
  for (const g of candidatos) {
    if (g !== s.grupo && !errados.includes(g)) errados.push(g)
    if (errados.length === 3) break
  }

  const opcoes = rng.shuffle([s.grupo, ...errados])

  return {
    tipo: 'escolha',
    id: `taxon-${s.id}`,
    pergunta: { kind: 'texto', valor: maiuscular(s.nome) },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(s.grupo),
    // Repetir a resposta no gabarito não ensinaria nada a quem errou: o que
    // ensina é o traço que decide — pulmão e leite, oito patas, dois pares de
    // antena. Mesmo papel do `porque` do nox.
    gabarito: `${s.grupo} — ${s.nome}: ${s.pista}`,
    ...(s.aviso ? { aviso: s.aviso } : {}),
  }
}

export const taxonomia: JogoFlashcard = {
  id: 'taxonomia',
  mecanica: 'flashcard',
  nome: 'Taxonomia',
  icone: '🐙',
  resumo: 'Aparece o ser vivo, você diz o grupo. Vive das armadilhas.',
  categoria: 'biologicas',
  unidade: { singular: 'carta', plural: 'cartas' },
  comoJogar: [
    'Aparece um ser vivo e você escolhe o grupo dele entre quatro opções.',
    'A opção errada é sempre a que engana: peixe aparece para o golfinho, inseto para a aranha, planta para o coral. Não dá para eliminar por absurdo.',
    'Os oito níveis, do mais amplo ao mais restrito: domínio, reino, filo, classe, ordem, família, gênero e espécie. O que se cobra aqui é o grupo de uso corrente — "mamífero" é classe, "molusco" é filo, "fungo" é reino.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(SERES_VIVOS).map((s) => cartaSerVivo(s, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
