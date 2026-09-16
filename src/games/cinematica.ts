import type { Rng } from '@/core/rng'
import type { Exercicio, JogoGerador } from '@/core/types'

/**
 * Cinemática contra o relógio.
 *
 * **Não há dataset.** Tudo aqui é gerado: as quatro relações do MUV são fechadas
 * e não têm cauda de exceções para cadastrar — ao contrário do nox, onde o
 * peróxido e o hidreto só existem porque alguém os escreveu numa lista. Um
 * `data/cinematica.ts` com trinta enunciados prontos seria trinta itens que
 * acabam, e o jogador decoraria o gabarito antes de decorar a fórmula.
 *
 * **Os números são redondos de propósito**, e isso não é afrouxar o item. O que
 * se mede é a relação — quem sabe que `v = v₀ + at` responde em dois segundos
 * com 3 m/s² tanto quanto com 3,7 m/s². Com a conta suja, o relógio passaria a
 * medir aritmética, que já é o jogo do lado (`aritmetica`). Na prática isso quer
 * dizer: acelerações inteiras, tempos inteiros, `at²/2` sempre exato (a é par
 * onde t é livre) e, em Torricelli, velocidades múltiplas de 10 — assim
 * `v² − v₀²` é múltiplo de 100 e a divisão por 2a fecha sozinha.
 *
 * **Digitado, e não de escolha.** É o critério do projeto aplicado, não uma
 * preferência: o nox saiu do digitado porque a resposta carregava sinal ("+6" ou
 * "6"? "−2" com um menos que o teclado numérico não tem?) e a ordem de grandeza
 * ficou no digitado pagando o Enter porque "6e-3", "6×10⁻³" e "0,006" são a
 * mesma resposta e não dá para saber quando o jogador terminou. Aqui não há
 * nenhum dos dois problemas: toda resposta é um inteiro não-negativo, sem sinal
 * e sem notação alternativa. Logo é `inteiroGrande` com teclado numérico — o
 * mesmo arranjo da massa molar, que aceita sem Enter assim que o texto digitado
 * é exatamente a resposta. Num jogo cronometrado, um Enter por item é caro; não
 * pagá-lo quando não é preciso é a diferença entre 20 e 25 acertos.
 *
 * **A orientação é sempre a do movimento.** A trajetória é orientada no sentido
 * em que o móvel anda, então `v₀ ≥ 0` sempre e a única aceleração negativa é a
 * de quem freia. Quando a freada aparece no enunciado, ela aparece com o menos
 * tipográfico ("a = −2 m/s²") e o que se pergunta é uma grandeza positiva —
 * tempo até parar, distância de frenagem. Quando é a própria aceleração que se
 * pergunta numa freada, a incógnita vem escrita **`|a|`**: as barras estão na
 * tela, e a velocidade final menor que a inicial já diz o sinal. A alternativa
 * seria aceitar "−2" num teclado que não tem menos, ou aceitar "2" e "−2" como a
 * mesma coisa — a primeira é impossível, a segunda ensina que sinal em
 * cinemática é decoração.
 *
 * Na queda livre a orientação é para baixo, com `g = +10 m/s²`. Não é a
 * convenção de todo livro, mas é a que deixa altura e velocidade positivas o
 * tempo todo, e no lançamento vertical o jogo só pergunta altura máxima e tempo
 * de voo, que não dependem de qual lado é o positivo.
 *
 * **O enunciado é telegráfico — "v₀=10 m/s v=30 m/s a=5 m/s² → t" — e isso é
 * imposição da tela.** A engine renderiza o enunciado em monoespaçada de 4xl
 * (5xl no desktop), o que dá umas dezessete letras por linha num celular: a
 * frase "um carro parte do repouso e acelera a 5 m/s² durante 4 segundos" viraria
 * seis linhas de letra gigante, e o jogador passaria mais tempo rolando o olho
 * do que calculando. Os itens dos vizinhos são "nox do S em H₂SO₄" e
 * "C₃H₈ + O₂ → CO₂ + H₂O"; este jogo escreve no mesmo registro. A forma é
 * sempre a mesma — os dados com o símbolo e a unidade, a seta, a incógnita —,
 * então não há o que decifrar duas vezes.
 *
 * Os três degraus: substituir numa fórmula com uma incógnita só → isolar a
 * variável que está no meio (achar `a`, achar `t`, achar `ΔS`) → dois móveis ou
 * queda com o tempo implícito, onde a conta tem duas pernas e a primeira não
 * está escrita no enunciado.
 */

/** Aceleração da gravidade adotada. Redonda, como o resto. */
const G = 10

/**
 * Monta o item e **quebra na hora** se o sorteio produzir algo que não seja
 * inteiro não-negativo.
 *
 * Isto é a trava do arquivo inteiro. Todo gerador aqui tem uma condição de
 * integralidade que depende dos intervalos sorteados (`at²/2` exige a par ou t
 * par; Torricelli exige velocidades múltiplas de 10), e essas condições são
 * fáceis de quebrar sem perceber ao mexer num `rng.pick`. Sem o `throw`, o
 * estrago seria silencioso: um item com gabarito "12,5" que o teclado numérico
 * não consegue digitar, ou um "−4" impossível de acertar. Melhor explodir no
 * teste do que ensinar física errada no relógio.
 */
function digitada(
  chave: string,
  enunciado: string,
  valor: number,
  unidade: string,
  porque?: string,
): Exercicio {
  if (!Number.isInteger(valor) || valor < 0) {
    throw new Error(`cinematica: ${chave} deu ${valor}, que não é inteiro não-negativo`)
  }

  return {
    tipo: 'digitado',
    chave,
    enunciado: { kind: 'texto', valor: enunciado },
    resposta: { tipo: 'inteiroGrande', valor: String(valor) },
    // A unidade entra no gabarito e não na resposta: ela é o que se lê depois de
    // errar, e digitar "m/s" contra o relógio mediria teclado.
    gabarito: `${valor} ${unidade}`,
    teclado: 'numerico',
    ...(porque ? { porque } : {}),
  }
}

type Gerador = (rng: Rng) => Exercicio

// --- nível 0: uma incógnita, substituir e calcular ---------------------------

const VELOCIDADES = [0, 5, 10, 15, 20] as const
const ACELERACOES = [1, 2, 3, 4, 5] as const
const TEMPOS = [2, 3, 4, 5, 6, 8, 10] as const

/** v = v₀ + at */
const velocidadeFinal: Gerador = (rng) => {
  const v0 = rng.pick(VELOCIDADES)
  const a = rng.pick(ACELERACOES)
  const t = rng.pick(TEMPOS)
  return digitada(
    `cin:v:${v0}:${a}:${t}`,
    `v₀=${v0} m/s a=${a} m/s² t=${t} s → v`,
    v0 + a * t,
    'm/s',
  )
}

/**
 * S = S₀ + v₀t + at²/2
 *
 * A aceleração é par de propósito: com `a` ímpar e `t` ímpar, `at²/2` cai em
 * meio metro e a resposta deixa de caber no teclado numérico. Amarrar `t` a
 * valores pares resolveria também, mas custaria metade dos tempos possíveis — é
 * mais barato abrir mão dos ímpares de `a`, que são três valores, do que dos
 * ímpares de `t`, que mudam a cara do item.
 */
const posicao: Gerador = (rng) => {
  const s0 = rng.pick([0, 10, 20, 50, 100] as const)
  const v0 = rng.pick([0, 5, 10, 20] as const)
  const a = rng.pick([2, 4, 6] as const)
  const t = rng.pick([2, 3, 4, 5] as const)
  return digitada(
    `cin:s:${s0}:${v0}:${a}:${t}`,
    `S₀=${s0} m v₀=${v0} m/s a=${a} m/s² t=${t} s → S`,
    s0 + v0 * t + (a * t * t) / 2,
    'm',
  )
}

/** h = gt²/2, do repouso. Com g = 10 isso é literalmente 5t². */
const alturaDeQueda: Gerador = (rng) => {
  const t = rng.int(1, 6)
  return digitada(
    `cin:queda-h:${t}`,
    `queda do repouso, t=${t} s, g=${G} → h`,
    (G * t * t) / 2,
    'm',
  )
}

/** v = gt, do repouso. */
const velocidadeDeQueda: Gerador = (rng) => {
  const t = rng.int(1, 8)
  return digitada(`cin:queda-v:${t}`, `queda do repouso, t=${t} s, g=${G} → v`, G * t, 'm/s')
}

// --- nível 1: isolar a variável do meio --------------------------------------

/**
 * A faixa de aceleração usada **como resposta** é mais larga que a de `v₀ + at`,
 * e o motivo é o auto-commit: com a resposta presa em 1..5, teclar um dígito ao
 * acaso acerta um em cinco, e o item aceita sem Enter — ou seja, o chute é tão
 * rápido quanto a conta. Com dez valores, chutar deixa de competir com saber.
 * A alternativa era exigir Enter só neste item, o que significa trocar o
 * teclado no meio da partida: pior remédio que a doença.
 */
const ACELERACOES_RESPOSTA = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const

/**
 * a = (v − v₀)/t, acelerando ou freando.
 *
 * Na freada o que se pede é `|a|`, com as barras na tela. A alternativa era
 * aceitar "−2" num teclado numérico que não tem menos, ou aceitar "2" e "−2"
 * como a mesma coisa — a primeira é impossível, a segunda ensinaria que sinal em
 * cinemática é enfeite. Com as barras, a pergunta fica bem posta: a velocidade
 * final é menor que a inicial, logo o sinal já está dado pelo enunciado, e o que
 * falta é o tamanho.
 */
const aceleracao: Gerador = (rng) => {
  const a = rng.pick(ACELERACOES_RESPOSTA)
  const t = rng.pick([2, 3, 4, 5, 6, 8] as const)

  if (rng.chance(0.5)) {
    const v = rng.pick([0, 5, 10] as const)
    const v0 = v + a * t
    return digitada(
      `cin:a-freia:${v0}:${v}:${t}`,
      `v₀=${v0} m/s v=${v} m/s t=${t} s → |a|`,
      a,
      'm/s²',
    )
  }

  const v0 = rng.pick(VELOCIDADES)
  return digitada(
    `cin:a:${v0}:${a}:${t}`,
    `v₀=${v0} m/s v=${v0 + a * t} m/s t=${t} s → a`,
    a,
    'm/s²',
  )
}

/** t = (v − v₀)/a. Na freada, o tempo até parar. */
const tempoParaVelocidade: Gerador = (rng) => {
  const a = rng.pick([2, 3, 4, 5] as const)
  const t = rng.pick([3, 4, 5, 6, 8, 10, 12] as const)

  if (rng.chance(0.5)) {
    const v0 = a * t
    return digitada(
      `cin:t-freia:${v0}:${a}`,
      // Aqui o menos aparece de verdade, e é onde ele ensina alguma coisa: a
      // aceleração vem escrita contra o movimento, e o tempo pedido é positivo.
      `v₀=${v0} m/s v=0 m/s a=−${a} m/s² → t`,
      t,
      's',
    )
  }

  const v0 = rng.pick([0, 5, 10, 20] as const)
  return digitada(
    `cin:t:${v0}:${a}:${t}`,
    `v₀=${v0} m/s v=${v0 + a * t} m/s a=${a} m/s² → t`,
    t,
    's',
  )
}

/**
 * Torricelli pedindo v: v² = v₀² + 2aΔS.
 *
 * Velocidades múltiplas de 10 garantem que `v² − v₀²` seja múltiplo de 100, e
 * como `2a ∈ {4, 10, 20}` a divisão fecha em inteiro sempre. Sortear ΔS
 * primeiro e tirar a raiz depois era o caminho óbvio e está errado: quase
 * nenhum ΔS dá quadrado perfeito, e o gerador viraria um laço de rejeição que
 * às vezes devolve 41,23 m/s.
 */
const torricelliVelocidade: Gerador = (rng) => {
  const v0 = rng.pick([0, 10, 20] as const)
  const a = rng.pick([2, 5, 10] as const)
  const v = v0 + 10 * rng.int(1, 4)
  const ds = (v * v - v0 * v0) / (2 * a)
  return digitada(
    `cin:torr-v:${v0}:${a}:${ds}`,
    `v₀=${v0} m/s a=${a} m/s² ΔS=${ds} m → v`,
    v,
    'm/s',
  )
}

/** Torricelli pedindo ΔS — a distância de frenagem, que é o caso que se usa. */
const torricelliDistancia: Gerador = (rng) => {
  const a = rng.pick([2, 5, 10] as const)
  const k = rng.int(2, 5)
  const v0 = 10 * k
  const v = 10 * rng.int(0, k - 1)
  return digitada(
    `cin:torr-s:${v0}:${v}:${a}`,
    `v₀=${v0} m/s v=${v} m/s a=−${a} m/s² → ΔS`,
    (v0 * v0 - v * v) / (2 * a),
    'm',
  )
}

/** A volta da queda: dada a altura, o tempo. */
const tempoDeQueda: Gerador = (rng) => {
  const t = rng.int(2, 6)
  return digitada(
    `cin:queda-t:${t}`,
    `queda do repouso, h=${(G * t * t) / 2} m, g=${G} → t`,
    t,
    's',
  )
}

// --- nível 2: dois móveis, ou o tempo que não está no enunciado ---------------

/**
 * Queda com o tempo implícito.
 *
 * É o primeiro item do jogo em que falta um dado: o enunciado dá só a altura, e
 * quem tentar `v = gt` trava porque não tem `t`. Tem dois caminhos honestos —
 * achar `t` em `h = 5t²` e substituir, ou ir direto por Torricelli — e o
 * `porque` cita os dois, porque quem errou aqui normalmente não errou a conta,
 * errou em não ver que o tempo era calculável.
 */
const velocidadeNoSolo: Gerador = (rng) => {
  const t = rng.int(2, 6)
  return digitada(
    `cin:solo-v:${t}`,
    `queda do repouso, h=${(G * t * t) / 2} m, g=${G} → v`,
    G * t,
    'm/s',
    'o tempo não está no enunciado: de h = gt²/2 sai t, e daí v = gt — ou direto, v = √(2gh)',
  )
}

/** Altura máxima no lançamento vertical: h = v₀²/2g. */
const alturaMaxima: Gerador = (rng) => {
  const v0 = 10 * rng.int(1, 5)
  return digitada(
    `cin:hmax:${v0}`,
    `sobe com v₀=${v0} m/s, g=${G} → h máx`,
    (v0 * v0) / (2 * G),
    'm',
    'no ponto mais alto a velocidade é zero: por Torricelli, h = v₀²/2g',
  )
}

/** Tempo de voo: sobe e desce em tempos iguais, então t = 2v₀/g. */
const tempoDeVoo: Gerador = (rng) => {
  const v0 = 5 * rng.int(2, 10)
  return digitada(
    `cin:voo:${v0}`,
    `sobe com v₀=${v0} m/s, g=${G} → t de voo`,
    (2 * v0) / G,
    's',
    'a subida e a descida levam o mesmo tempo: t = 2v₀/g, o dobro do tempo de subida',
  )
}

/**
 * Perseguição, mesmo sentido.
 *
 * O erro que este item cobra é somar as velocidades. Quem soma resolve o
 * encontro frontal e erra a perseguição, e é exatamente por isso que os dois
 * casos estão no mesmo degrau: separados, cada um vira uma receita.
 *
 * Quem é A e quem é B não aparece porque não importa: o tempo até alcançar
 * depende só da diferença das velocidades e da distância. Nomear os dois móveis
 * custaria seis caracteres de tela para não dizer nada.
 */
const perseguicao: Gerador = (rng) => {
  const dv = rng.pick([2, 5, 10] as const)
  const t = rng.pick([4, 5, 6, 8, 10, 12] as const)
  const vB = rng.pick([10, 15, 20] as const)
  const vA = vB + dv
  const d = dv * t
  return digitada(
    `cin:perseguicao:${vA}:${vB}:${d}`,
    `mesmo sentido: ${vA} e ${vB} m/s, d=${d} m → t`,
    t,
    's',
    'no mesmo sentido quem fecha a distância é a diferença das velocidades, não a soma',
  )
}

/** Encontro frontal: a distância some à taxa da soma das velocidades. */
const encontroFrontal: Gerador = (rng) => {
  const vA = rng.pick([10, 15, 20, 25] as const)
  const vB = rng.pick([5, 10, 15, 20] as const)
  const t = rng.pick([3, 4, 5, 6, 8, 10] as const)
  return digitada(
    `cin:encontro:${vA}:${vB}:${t}`,
    `de frente: ${vA} e ${vB} m/s, d=${(vA + vB) * t} m → t`,
    t,
    's',
  )
}

/**
 * Cada degrau acrescenta sem tirar os anteriores — a mesma regra do resto do
 * app. O degrau atual entra em dobro, senão a progressão se dissolve no sorteio.
 */
const DEGRAUS: readonly (readonly Gerador[])[] = [
  [velocidadeFinal, posicao, alturaDeQueda, velocidadeDeQueda],
  [aceleracao, tempoParaVelocidade, torricelliVelocidade, torricelliDistancia, tempoDeQueda],
  [velocidadeNoSolo, alturaMaxima, tempoDeVoo, perseguicao, encontroFrontal],
]

export const NIVEL_MAX = DEGRAUS.length - 1

export function gerarCinematica(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), NIVEL_MAX)
  const atuais = DEGRAUS[n] ?? []
  return rng.pick([...DEGRAUS.slice(0, n).flat(), ...atuais, ...atuais])(rng)
}

export const cinematica: JogoGerador = {
  id: 'cinematica',
  mecanica: 'gerador',
  nome: 'Cinemática rápida',
  icone: 'v₀+at',
  resumo: 'MUV, Torricelli e queda livre contra o relógio, com números redondos.',
  categoria: 'fisica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'O enunciado lista os dados e a seta aponta a incógnita: responda só o número, na unidade dela.',
    'Tudo no SI, g = 10 m/s², e "|a|" pede o módulo — na freada a resposta é positiva.',
    'Os números são redondos de propósito: o que se cobra é a relação, não a conta suja.',
    'Não precisa de Enter, e cada acerto devolve 6 segundos ao relógio.',
  ],
  config: () => ({
    gerar: gerarCinematica,
    segundosIniciais: 60,
    // 6 e não 5, como na ordem de grandeza e pelo mesmo motivo: aqui o item é
    // uma frase com três ou quatro dados para ler antes de qualquer conta, e
    // "nox do S em H₂SO₄" não é. O bônus paga o tempo de leitura; subir os
    // segundos iniciais pagaria uma vez só e deixaria de comparar com os irmãos.
    bonusPorAcertoS: 6,
    tetoSegundos: 120,
    escala: (acertos) => Math.min(NIVEL_MAX, Math.floor(acertos / 6)),
    teclado: 'numerico',
  }),
}
