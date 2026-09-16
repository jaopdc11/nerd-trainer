import { FASES, TAMANHO_DO_TRECHO_DE_MITOSE, exibirPloidia } from '@/data/divisao-celular'
import type { Fase } from '@/data/divisao-celular'
import type { EspecResposta } from '@/core/answer'
import type { JogoSequencia } from '@/core/types'

/**
 * As fases da divisão celular, recitadas na ordem: o ciclo com mitose primeiro,
 * a meiose inteira depois.
 *
 * ## Por que sequência, e não flashcard
 *
 * Porque uma fase **é** a sua posição entre as outras. Uma carta "o que acontece
 * na anáfase I?" mede se o jogador decorou uma frase; recitar a fila do
 * leptóteno até a citocinese II sem errar um degrau mede a única coisa que o
 * conteúdo tem para ensinar, que é a costura. A alternativa de escolha múltipla
 * seria ainda pior aqui: com nomes tão parecidos entre si — prófase, prófase I,
 * prófase II —, quatro alternativas na tela entregam de graça exatamente a
 * distinção que se queria cobrar.
 *
 * ## Um jogo, dois trechos, e a vaga era uma só
 *
 * Mitose (8 casas) e meiose (15) entram numa sequência só, na ordem didática, do
 * jeito que `rios-montanhas.ts` fez com rios e picos. As alternativas e por que
 * caíram:
 *
 * - **Dois jogos, "Mitose" e "Meiose".** Não havia duas vagas, e mesmo que
 *   houvesse: oito itens não é jogo. Numa mecânica sem relógio, em que o placar
 *   é até onde você chegou, um teto de oito satura na segunda partida de quem
 *   estudou, e um recorde que todo mundo empata não mede mais nada.
 * - **Só a meiose.** Seria o conteúdo puro do enunciado — as duas divisões são
 *   onde todo mundo tropeça — e mesmo assim perde: a meiose I só faz sentido
 *   como contraste com a mitose, e quem recita "metáfase I" sem ter recitado
 *   "metáfase" três minutos antes não percebeu que numa se alinham pares de
 *   homólogos e na outra cromossomos avulsos.
 *
 * O preço é o de sempre em morte súbita: o segundo trecho só existe para quem
 * passa das oito primeiras casas. É aceitável precisamente porque a mitose é a
 * parte fácil e universalmente sabida — é uma porta baixa, não um pedágio. Foi
 * por não ser aceitável com vinte casas de porta que `maiores-paises.ts` ficou
 * com um trecho só.
 *
 * ## A régua da lista é anunciada, não adivinhada
 *
 * O dataset lista o menor passo nomeado (G1/S/G2, e não "intérfase"; leptóteno a
 * diacinese, e não "prófase I") pelas razões escritas em `data/divisao-celular.ts`.
 * Aqui só interessa a consequência: quem digitar "intérfase" na casa 1 morre por
 * causa do regulamento e não da biologia, que é o pior jeito de morrer. Por isso
 * as duas regras de granularidade e o fato de a intérfase da meiose não se
 * repetir estão no `comoJogar`, ditos na cara — mesmo tratamento que
 * `presidentes.ts` dá ao recorte de 1930.
 *
 * ## A tolerância a erro de digitação fica desligada, e há medição para isso
 *
 * `data/divisao-celular.test.ts` mede "prófase I" a **um caractere** de
 * "prófase II". Com a tolerância ligada, digitar uma pela outra devolveria
 * 'quase' — que nesta mecânica mata do mesmo jeito, já que `useSequence` só
 * segue com 'certo' — e, sem a trava de vizinhança (a sequência não passa
 * `vizinhanca` ao validador), nada seguraria o perdão na direção errada. Aqui
 * não existe "quase": ou é a primeira divisão, ou é a segunda.
 */

const ITENS: readonly string[] = FASES.map((f) => f.nome)

/**
 * Uma espec por casa, montada numa função só para não existirem duas descrições
 * da mesma resposta — a que o jogo julga e a que o teste confere.
 *
 * `respostaEm` é o que faz isto funcionar: sem ele `useSequence` deriva a espec
 * de `entrada` ('termo' → `inteiroGrande`), manda "G1" para o limpador de
 * inteiro e a partida morre na primeira casa.
 */
const especDeFase = (f: Fase): EspecResposta => ({
  tipo: 'texto',
  canonica: f.nome,
  aceitas: f.aceitas,
  opcoes: { tolerarTypo: false },
})

const RESPOSTAS: readonly EspecResposta[] = FASES.map(especDeFase)

/** Exposto para o teste conferir as especs sem reconstruí-las. */
export const RESPOSTAS_DIVISAO_CELULAR = RESPOSTAS

/**
 * "15ª Anáfase I — meiose I · n, 2C · os homólogos se separam…".
 *
 * Exposto para o teste: é o único lugar em que posição, nome, bloco e ploidia
 * se encontram, e é o que denuncia uma fase colada no bloco errado.
 */
export const linhaDoGabarito = (posicao: number): string => {
  const f = FASES[posicao]
  if (!f) throw new Error(`divisao-celular: não há casa ${posicao + 1}`)
  return `${posicao + 1}ª ${f.nome} — ${f.bloco} · ${exibirPloidia(f)} · ${f.acontece}`
}

export const divisaoCelular: JogoSequencia = {
  id: 'divisao-celular',
  mecanica: 'sequencia',
  nome: 'Mitose e meiose',
  icone: '🧫',
  resumo: 'O ciclo com mitose e, depois, a meiose inteira — as duas divisões, fase a fase.',
  categoria: 'biologicas',
  unidade: { singular: 'fase', plural: 'fases' },
  comoJogar: [
    'Primeiro o ciclo com mitose: G1, S, G2 e daí prófase até a citocinese, uma fase por Enter.',
    'A intérfase entra por G1, S e G2, e a prófase I pelas cinco subfases (leptóteno, zigóteno, paquíteno, diplóteno, diacinese): o item é sempre o passo mais fino.',
    'Depois da citocinese o jogo vira meiose e começa no leptóteno — a intérfase não se repete. Na meiose todo nome leva o algarismo: metáfase I, prófase II.',
    'Entre as duas divisões vem a intercinese, e nela o DNA não duplica. O gabarito mostra a ploidia de cada fase: ela cai na anáfase I, não na II.',
  ],
  config: () => ({
    itens: ITENS,
    total: ITENS.length,
    // 'termo', nunca 'caractere': "Prófase" é prefixo de "Prófase II", e julgar
    // na tecla aceitaria cedo demais — o mesmo motivo que obriga os inteiros ao
    // Enter. E `respostaEm` é o ramo de texto: ver a nota do topo.
    entrada: 'termo',
    teclado: 'texto',
    respostaEm: (i) => RESPOSTAS[i] as EspecResposta,
    separador: ' → ',
    // Oito por bloco, e não cinco: oito é exatamente o trecho da mitose, então a
    // virada para a meiose cai sempre numa fronteira de bloco da fita e fica
    // visível sem nenhum rótulo novo na engine. É a mesma conta que fez
    // `rios-montanhas.ts` escolher cinco para um corte no décimo item.
    agrupar: TAMANHO_DO_TRECHO_DE_MITOSE,
    // Quatro: aqui cada item é uma fase, e a revisão pós-morte é para decorar o
    // próximo pedaço, não para ler a lista toda.
    revisaoPosMorte: 4,
  }),
}
