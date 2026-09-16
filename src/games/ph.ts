import { interpretarNumero } from '@/core/answer'
import type { Rng } from '@/core/rng'
import type { Exercicio, JogoGerador } from '@/core/types'

/**
 * pH, pOH e concentração, contra o relógio.
 *
 * O jogo pergunta as três voltas da mesma relação: a concentração dá o pH, o pH
 * dá o pOH, o pH volta a dar a concentração. Nos níveis finais o caminho tem
 * duas pernas — a concentração dada é a do OH⁻, ou é o pOH que está na mão — e
 * entra a diluição, que é onde a intuição de "dividir por 100" vira "somar 2".
 *
 * **Os números são redondos de propósito.** Só entram potências de 10 e
 * meios-passos, e nunca as duas coisas ao mesmo tempo: pH 3,5 existe (o pOH dele
 * é 10,5, igualmente redondo), mas a concentração correspondente seria
 * 3,16×10⁻⁴ e ninguém tira isso de cabeça. O que se mede aqui é a relação
 * logarítmica; medir log de cabeça seria outro jogo, e um chato.
 *
 * **Digitado, e não de escolha** — o caminho contrário ao do nox, com o mesmo
 * critério. O nox saiu do digitado porque a resposta carregava sinal: "+6" ou
 * "6", "−2" com um menos que o teclado não tem, e um Enter obrigatório só para
 * saber se o que vinha era sinal ou dígito. Aqui não há sinal nenhum: a resposta
 * é "11", "9,5" ou "10⁻⁵" — curta, positiva e inequívoca. O Enter continua
 * necessário, e é o mesmo preço que a ordem de grandeza já paga de bom grado:
 * "1e-5", "10⁻⁵" e "0,00001" são a mesma resposta, e é justamente por aceitar as
 * três que o jogo não consegue saber sozinho quando o jogador terminou.
 *
 * Por isso também não há dois tecidos de teclado. Metade dos itens responde um
 * inteiro e caberia no teclado numérico, mas a outra metade precisa de vírgula e
 * de expoente — e trocar o teclado entre um item e o outro, no meio de uma
 * partida cronometrada, é pior do que uma tecla a mais.
 */

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const

function sobrescrito(n: number): string {
  const corpo = [...Math.abs(n).toString()].map((d) => SUP[Number(d)] ?? '').join('')
  return n < 0 ? `⁻${corpo}` : corpo
}

/** '10⁻⁵'. O menos é o tipográfico sobrescrito, como no resto do app. */
const potencia = (expoente: number): string => `10${sobrescrito(expoente)}`

/**
 * Meio-passo em português: 19 meios → '9,5'; 22 meios → '11'.
 *
 * O pH anda de meio em meio, então a unidade interna é o meio — inteira. Guardar
 * 9.5 como float e formatar depois traria `toFixed` e o ponto do inglês para
 * dentro de um jogo em que a vírgula é a grafia certa.
 */
function emMeios(meios: number): string {
  return meios % 2 === 0 ? String(meios / 2) : `${(meios - 1) / 2},5`
}

/**
 * Monta o exercício **derivando a resposta do próprio texto do gabarito**, pela
 * mesma função que lê o que o jogador digita.
 *
 * É a trava que impede o erro mais fácil deste arquivo: escrever na tela "10⁻⁵"
 * e cadastrar o expoente +5 na resposta. Passando os dois pelo mesmo
 * `interpretarNumero`, gabarito e gabarito-julgado não têm como divergir — e se
 * algum dia alguém escrever um gabarito que o validador não sabe ler, isso
 * explode aqui em vez de virar um item impossível de acertar.
 */
function digitada(
  chave: string,
  enunciado: string,
  gabarito: string,
  porque?: string,
): Exercicio {
  const lido = interpretarNumero(gabarito)
  if (!lido) throw new Error(`ph: "${gabarito}" não é um número que o validador saiba ler`)

  return {
    tipo: 'digitado',
    chave,
    enunciado: { kind: 'texto', valor: enunciado },
    resposta: {
      tipo: 'numero',
      mantissa: lido.mantissa,
      expoente: lido.expoente,
      negativo: lido.negativo,
      // Exige a precisão que o próprio gabarito tem: em '9,5' o meio não é
      // detalhe, e aceitar '9' seria aceitar outra resposta.
      sigMin: lido.significativos,
    },
    gabarito,
    teclado: 'texto',
    ...(porque ? { porque } : {}),
  }
}

type Gerador = (rng: Rng) => Exercicio

/** [H⁺] = 10⁻ⁿ → pH = n. A definição, sem desvio nenhum. */
const phDeConcentracao: Gerador = (rng) => {
  const n = rng.int(1, 13)
  return digitada(`ph:de-h:${n}`, `[H⁺] = ${potencia(-n)} → pH`, String(n))
}

/** pH + pOH = 14. */
const pohDePh: Gerador = (rng) => {
  const ph = rng.int(1, 13)
  return digitada(`ph:poh:${ph}`, `pH = ${ph} → pOH`, String(14 - ph))
}

/**
 * O mesmo, com meio-passo.
 *
 * É o único lugar onde o meio-passo cabe: 14 − 4,5 continua redondo dos dois
 * lados. Pedir a concentração de um pH 4,5 daria 3,16×10⁻⁵, que é outra
 * pergunta.
 */
const pohMeioPasso: Gerador = (rng) => {
  const meios = 2 * rng.int(1, 12) + 1
  return digitada(`ph:poh:${meios}m`, `pH = ${emMeios(meios)} → pOH`, emMeios(28 - meios))
}

/** A volta: do pH para a concentração. */
const concentracaoDePh: Gerador = (rng) => {
  const ph = rng.int(1, 13)
  return digitada(`ph:conc:${ph}`, `pH = ${ph} → [H⁺]`, potencia(-ph))
}

/** Duas pernas: a concentração dada é a do OH⁻, e o que se pede é o pH. */
const phDeHidroxila: Gerador = (rng) => {
  const poh = rng.int(1, 13)
  return digitada(
    `ph:de-oh:${poh}`,
    `[OH⁻] = ${potencia(-poh)} → pH`,
    String(14 - poh),
    'a concentração dada é a do OH⁻: dela sai o pOH, e o pH é 14 menos ele',
  )
}

/** Duas pernas na outra direção: do pOH até a concentração de H⁺. */
const concentracaoDePoh: Gerador = (rng) => {
  const poh = rng.int(1, 13)
  return digitada(
    `ph:conc-poh:${poh}`,
    `pOH = ${poh} → [H⁺]`,
    potencia(-(14 - poh)),
    'pH = 14 − pOH, e é o pH que entra no expoente de 10',
  )
}

/**
 * Diluição.
 *
 * O item mais honesto do jogo: é aqui que "dividi por 100" tem de virar "subi 2
 * no pH", que é a única coisa que o logaritmo está fazendo o tempo todo. O
 * limite de pH 6 no resultado não é arredondamento preguiçoso — diluir ácido
 * nunca atravessa o 7, e um enunciado que sugerisse o contrário ensinaria uma
 * química falsa por conta de um sorteio.
 */
const diluicao: Gerador = (rng) => {
  const inicial = rng.int(1, 3)
  const vezes = rng.int(1, 3)
  return digitada(
    `ph:dil:${inicial}x${vezes}`,
    `pH ${inicial}, diluído ${10 ** vezes}× → pH`,
    String(inicial + vezes),
    'cada diluição de 10× divide [H⁺] por 10 e sobe 1 no pH — que nunca atravessa o 7: diluir ácido não faz base',
  )
}

const DEGRAUS: readonly (readonly Gerador[])[] = [
  [phDeConcentracao, pohDePh],
  [concentracaoDePh, pohMeioPasso],
  [phDeHidroxila, concentracaoDePoh, diluicao],
]

export function gerarPh(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), DEGRAUS.length - 1)
  const atuais = DEGRAUS[n] ?? []
  // O nível novo entra em dobro: acumula os anteriores sem afogá-los.
  return rng.pick([...DEGRAUS.slice(0, n).flat(), ...atuais, ...atuais])(rng)
}

export const ph: JogoGerador = {
  id: 'ph',
  mecanica: 'gerador',
  nome: 'pH e concentração',
  icone: 'pH',
  resumo: 'Da concentração ao pH e de volta, incluindo a diluição.',
  categoria: 'quimica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Concentração sempre em mol/L, água a 25 °C: pH + pOH = 14.',
    'Digite o número e aperte Enter. Para concentração, "1e-5", "10⁻⁵" e "0,00001" valem igual.',
    'Os números são redondos de propósito — o que se cobra é a relação logarítmica, não fazer log de cabeça.',
    'Cada acerto devolve 5 segundos ao relógio.',
  ],
  config: () => ({
    gerar: gerarPh,
    segundosIniciais: 60,
    bonusPorAcertoS: 5,
    tetoSegundos: 120,
    escala: (acertos) => Math.min(2, Math.floor(acertos / 6)),
    teclado: 'texto',
  }),
}
