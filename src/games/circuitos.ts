import type { Rng } from '@/core/rng'
import type { Exercicio, JogoGerador } from '@/core/types'

/**
 * Lei de Ohm, potência dissipada e associação de resistores, contra o relógio.
 *
 * **Não há dataset.** As relações são quatro (`U = Ri`, `P = Ui`, série e
 * paralelo) e não têm exceção nenhuma a cadastrar — diferente do nox, onde o
 * peróxido só existe porque está escrito numa lista. Uma tabela de circuitos
 * prontos seria uma lista finita de gabaritos para decorar; gerado, o item
 * continua sendo sobre a relação na décima partida.
 *
 * **Digitado, e não de escolha** — o mesmo critério que tirou o nox do digitado,
 * aplicado ao contrário. Lá a resposta carregava sinal ("+6" ou "6"? "−2" com um
 * menos que o teclado numérico não tem?) e metade da interação virava disputa de
 * formato. Aqui toda resposta é um inteiro positivo com uma unidade que o
 * enunciado já fixou: 3 A, 12 V, 4 Ω, 48 W. Sem sinal, sem notação alternativa,
 * sem vírgula — logo `inteiroGrande` em teclado numérico, que é o arranjo da
 * massa molar e aceita **sem Enter**, assim que o digitado é exatamente a
 * resposta. Num jogo cronometrado, um Enter por item é um item a menos a cada
 * dez.
 *
 * **Por que os valores do paralelo fecham em inteiro.** Os pares não são
 * sorteados livremente: eles saem de `(R₁ − p)(R₂ − p) = p²`, que é a lei de
 * Ohm do paralelo escrita ao contrário, e por construção a equivalente é o `p`
 * inteiro escolhido antes. Daí saírem os pares clássicos — 6 e 3, 12 e 6, dois
 * de 20, 10 e 15.
 *
 * Isso **não é facilitar**, e vale ser explícito porque parece. O que o item
 * cobra é saber que a equivalente do paralelo é *menor que a menor das duas
 * resistências* — o fato contraintuitivo da associação, e o que separa quem
 * entendeu de quem decorou o desenho. Ninguém, em nenhum contexto real, calcula
 * `1/R₁ + 1/R₂` de cabeça: com 7 Ω e 13 Ω a conta dá 4,55 Ω, e cobrar isso
 * contra o relógio mediria divisão de dois dígitos, que é o jogo do lado. A
 * alternativa descartada — sortear R₁ e R₂ livres e aceitar uma casa decimal —
 * trocaria o conceito por aritmética suja e ainda traria a vírgula de volta para
 * um teclado que não a tem.
 *
 * **O enunciado é telegráfico — "R = 4 Ω, i = 3 A → U" — e isso é imposição da
 * tela.** A engine renderiza o enunciado em monoespaçada de 4xl (5xl no
 * desktop), o que dá umas dezessete letras por linha num celular: "um resistor
 * de 4 ohms é percorrido por uma corrente de 3 ampères" viraria cinco linhas de
 * letra gigante. Os itens dos vizinhos são "nox do S em H₂SO₄" e
 * "C₃H₈ + O₂ → CO₂ + H₂O"; este jogo escreve no mesmo registro: os dados, a
 * seta, a incógnita. `Req` é a resistência equivalente, como no caderno.
 *
 * Três degraus: a lei de Ohm nas três voltas → potência dissipada nas três
 * formas, mais a série → paralelo e as associações alimentadas, onde a conta tem
 * duas pernas.
 */

/** Símbolo do ohm. Ω maiúsculo grego, como o resto do app escreve unidades. */
const OHM = 'Ω'

/**
 * Monta o item e **quebra na hora** se o sorteio não der inteiro positivo.
 *
 * Todo gerador daqui tem uma condição de exatidão que depende dos intervalos
 * sorteados — a corrente é montada a partir de `U = Ri` para dividir exato, o
 * paralelo vem da fatoração de `p²`. Essas condições são fáceis de quebrar sem
 * perceber ao mexer num `rng.pick`, e o estrago seria silencioso: um item com
 * gabarito "4,55 Ω" que o teclado numérico não consegue digitar. Melhor explodir
 * no teste do que ficar impossível de acertar na partida.
 */
function digitada(
  chave: string,
  enunciado: string,
  valor: number,
  unidade: string,
  porque?: string,
): Exercicio {
  if (!Number.isInteger(valor) || valor <= 0) {
    throw new Error(`circuitos: ${chave} deu ${valor}, que não é inteiro positivo`)
  }

  return {
    tipo: 'digitado',
    chave,
    enunciado: { kind: 'texto', valor: enunciado },
    resposta: { tipo: 'inteiroGrande', valor: String(valor) },
    // A unidade fica no gabarito, não na resposta: ela é o que se lê depois de
    // errar. Digitar "Ω" contra o relógio mediria teclado.
    gabarito: `${valor} ${unidade}`,
    teclado: 'numerico',
    ...(porque ? { porque } : {}),
  }
}

type Gerador = (rng: Rng) => Exercicio

const RESISTORES = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50] as const

/**
 * Correntes usadas **como resposta**, mais largas que as de enunciado.
 *
 * Mesmo motivo que vale para a aceleração na cinemática: com a resposta presa em
 * 1..6, teclar um dígito ao acaso acerta quase um em cinco — e como o item
 * aceita sem Enter, chutar fica tão rápido quanto calcular. Com doze valores, o
 * chute deixa de competir com saber. Exigir Enter só neste item seria trocar o
 * comportamento do teclado no meio da partida, o que é pior que a doença.
 */
const CORRENTES_RESPOSTA = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30] as const

// --- nível 0: a lei de Ohm nas três voltas -----------------------------------

/** U = R·i */
const tensao: Gerador = (rng) => {
  const r = rng.pick(RESISTORES)
  const i = rng.int(2, 6)
  return digitada(`cir:u:${r}:${i}`, `R = ${r} ${OHM}, i = ${i} A → U`, r * i, 'V')
}

/**
 * i = U/R, com U montado a partir do produto.
 *
 * Sortear U e R livres e dividir daria 37/8 na maior parte das vezes; montar a
 * tensão a partir da corrente que se quer como resposta faz a divisão ser exata
 * por construção, sem laço de rejeição. É a mesma regra da divisão exata do
 * cálculo rápido.
 */
const corrente: Gerador = (rng) => {
  const i = rng.pick(CORRENTES_RESPOSTA)
  // A resistência é escolhida depois da corrente e limitada pelo produto: com
  // 30 A sobre 50 Ω o enunciado anunciaria 1500 V, que não é circuito de
  // exercício, é linha de transmissão. O teto mantém a tensão numa ordem de
  // grandeza doméstica sem mexer na faixa de respostas.
  const r = rng.pick(RESISTORES.filter((x) => x * i <= 240))
  return digitada(`cir:i:${r}:${i}`, `U = ${r * i} V, R = ${r} ${OHM} → i`, i, 'A')
}

/** R = U/i, pelo mesmo truque. */
const resistencia: Gerador = (rng) => {
  const r = rng.pick(RESISTORES)
  const i = rng.int(2, 6)
  return digitada(`cir:r:${r}:${i}`, `U = ${r * i} V, i = ${i} A → R`, r, OHM)
}

// --- nível 1: potência dissipada e associação em série -----------------------

/** P = U·i, a forma direta. */
const potenciaUI: Gerador = (rng) => {
  const u = rng.pick([6, 9, 12, 20, 24, 30, 40, 50, 60, 100] as const)
  const i = rng.int(2, 6)
  return digitada(`cir:p-ui:${u}:${i}`, `U = ${u} V, i = ${i} A → P`, u * i, 'W')
}

/**
 * P = R·i².
 *
 * O item que cobra o quadrado. O erro clássico é `R·i`, que dá um número
 * plausível e menor — por isso o `porque` fala do dobro da corrente, que é onde
 * a diferença entre linear e quadrático fica impossível de ignorar.
 */
const potenciaRI2: Gerador = (rng) => {
  const r = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const)
  const i = rng.int(2, 6)
  return digitada(
    `cir:p-ri2:${r}:${i}`,
    `R = ${r} ${OHM}, i = ${i} A → P`,
    r * i * i,
    'W',
    'a corrente entra ao quadrado: dobrar a corrente quadruplica a potência dissipada',
  )
}

/** P = U²/R, montado de `U = Ri` para a divisão fechar. */
const potenciaU2R: Gerador = (rng) => {
  const r = rng.pick([2, 4, 5, 10, 20] as const)
  const i = rng.int(2, 6)
  return digitada(`cir:p-u2r:${r}:${i}`, `U = ${r * i} V, R = ${r} ${OHM} → P`, r * i * i, 'W')
}

/** Série: a equivalente é a soma, e é maior que qualquer uma delas. */
const serie: Gerador = (rng) => {
  const quantos = rng.chance(0.4) ? 3 : 2
  const rs = Array.from({ length: quantos }, () => rng.pick(RESISTORES))
  return digitada(
    `cir:serie:${[...rs].sort((a, b) => a - b).join('+')}`,
    `${rs.map((r) => `${r} ${OHM}`).join(' + ')} em série → Req`,
    rs.reduce((s, r) => s + r, 0),
    OHM,
  )
}

/**
 * Série alimentada: achar a equivalente e só então aplicar a lei de Ohm.
 *
 * É o primeiro item de duas pernas, e é onde aparece o erro de dividir a tensão
 * por um dos resistores em vez de pela soma.
 */
const correnteEmSerie: Gerador = (rng) => {
  const r1 = rng.pick(RESISTORES)
  const r2 = rng.pick(RESISTORES)
  const i = rng.int(2, 6)
  return digitada(
    `cir:i-serie:${Math.min(r1, r2)}:${Math.max(r1, r2)}:${i}`,
    `série ${r1} ${OHM} e ${r2} ${OHM} sob ${(r1 + r2) * i} V → i`,
    i,
    'A',
  )
}

// --- nível 2: paralelo e associações alimentadas -----------------------------

/** Acima disto o par deixa de parecer um circuito e vira curiosidade aritmética. */
const TETO_RESISTOR = 60

/**
 * Todos os pares (R₁, R₂) cuja associação em paralelo dá exatamente `p`.
 *
 * `1/R₁ + 1/R₂ = 1/p` equivale a `(R₁ − p)(R₂ − p) = p²`, então cada divisor
 * `d` de `p²` gera um par: `R₁ = p + d`, `R₂ = p + p²/d`. Com `d ≤ p` sai cada
 * par uma vez só, já ordenado.
 *
 * É a inversão do problema, e é o que dispensa laço de rejeição: em vez de
 * sortear dois resistores e torcer para a equivalente ser redonda — o que quase
 * nunca acontece —, escolhe-se a equivalente e derivam-se os resistores que a
 * produzem.
 */
function paresComParalelo(p: number): readonly (readonly [number, number])[] {
  const pares: (readonly [number, number])[] = []
  for (let d = 1; d <= p; d++) {
    if ((p * p) % d !== 0) continue
    const maior = p + (p * p) / d
    if (maior > TETO_RESISTOR) continue
    pares.push([p + d, maior] as const)
  }
  return pares
}

/** Equivalentes possíveis, com os pares já resolvidos uma vez só na carga. */
const PARALELOS: readonly {
  readonly p: number
  readonly pares: readonly (readonly [number, number])[]
}[] = [2, 3, 4, 5, 6, 8, 10, 12]
  .map((p) => ({ p, pares: paresComParalelo(p) }))
  .filter((e) => e.pares.length > 0)

/**
 * Dois resistores em paralelo.
 *
 * O `porque` não repete a fórmula: repete o fato que o item existe para fixar —
 * a equivalente fica **abaixo da menor** das duas. Quem some com um resistor e
 * vê a resistência total subir não errou uma conta, errou o modelo.
 */
const paralelo: Gerador = (rng) => {
  const { p, pares } = rng.pick(PARALELOS)
  const [a, b] = rng.pick(pares)
  const [r1, r2] = rng.chance(0.5) ? [a, b] : [b, a]
  return digitada(
    `cir:par:${a}:${b}`,
    `${r1} ${OHM} e ${r2} ${OHM} em paralelo → Req`,
    p,
    OHM,
    `em paralelo a equivalente é sempre menor que a menor das duas — aqui, menor que ${Math.min(a, b)} ${OHM}`,
  )
}

/**
 * Três ou quatro resistores iguais em paralelo: R/n.
 *
 * Começa em três porque o par de iguais já sai de `paralelo` — a fatoração de
 * `p²` com `d = p` devolve exatamente `(2p, 2p)`. Repetir aqui o caso de dois
 * seria sortear duas vezes o mesmo item.
 *
 * A quantidade vem por extenso e não como algarismo: "3 × 12 Ω" se lê como uma
 * multiplicação, e o valor que ela sugere (36) é justamente o erro que o item
 * cobra — em paralelo a resistência **cai**.
 */
const POR_EXTENSO: Readonly<Record<number, string>> = { 3: 'três', 4: 'quatro' }

const paraleloIguais: Gerador = (rng) => {
  const n = rng.int(3, 4)
  const p = rng.pick([2, 3, 4, 5, 6, 10, 12] as const)
  const r = n * p
  return digitada(
    `cir:par-iguais:${n}x${r}`,
    `${POR_EXTENSO[n] ?? n} de ${r} ${OHM} em paralelo → Req`,
    p,
    OHM,
    'resistores iguais em paralelo dividem a resistência pela quantidade — e multiplicam a corrente total',
  )
}

/**
 * Paralelo alimentado: a equivalente primeiro, a lei de Ohm depois.
 *
 * Duas pernas, e a segunda só fecha se a primeira estiver certa. É o item mais
 * caro do jogo e o mais parecido com um exercício de prova.
 */
const correnteNoParalelo: Gerador = (rng) => {
  const { p, pares } = rng.pick(PARALELOS)
  const [a, b] = rng.pick(pares)
  const i = rng.pick([2, 3, 4, 5, 6, 8, 10] as const)
  return digitada(
    `cir:i-par:${a}:${b}:${i}`,
    `paralelo ${a} ${OHM} e ${b} ${OHM} sob ${p * i} V → i total`,
    i,
    'A',
    `a equivalente do paralelo é ${p} ${OHM}; a corrente total sai dela, não de um dos ramos`,
  )
}

/**
 * Divisor de tensão.
 *
 * O contraponto do paralelo: em série a corrente é que é comum, e a tensão se
 * reparte. Quem troca as duas coisas erra os dois itens, e é essa troca que o
 * degrau inteiro cobra.
 */
const divisorDeTensao: Gerador = (rng) => {
  const r1 = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const)
  const r2 = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const)
  const i = rng.int(2, 6)
  return digitada(
    `cir:divisor:${r1}:${r2}:${i}`,
    `série ${r1} ${OHM} e ${r2} ${OHM} sob ${(r1 + r2) * i} V → U no de ${r1} ${OHM}`,
    r1 * i,
    'V',
    'em série a corrente é a mesma nos dois; é a tensão que se reparte, na proporção das resistências',
  )
}

/**
 * Cada degrau acrescenta sem tirar os anteriores, como no resto do app, e o
 * atual entra em dobro para a progressão não se dissolver no sorteio.
 */
const DEGRAUS: readonly (readonly Gerador[])[] = [
  [tensao, corrente, resistencia],
  [potenciaUI, potenciaRI2, potenciaU2R, serie, correnteEmSerie],
  [paralelo, paraleloIguais, correnteNoParalelo, divisorDeTensao],
]

export const NIVEL_MAX = DEGRAUS.length - 1

export function gerarCircuitos(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), NIVEL_MAX)
  const atuais = DEGRAUS[n] ?? []
  return rng.pick([...DEGRAUS.slice(0, n).flat(), ...atuais, ...atuais])(rng)
}

export const circuitos: JogoGerador = {
  id: 'circuitos',
  mecanica: 'gerador',
  nome: 'Lei de Ohm e resistores',
  icone: 'Ω',
  resumo: 'U = R·i, potência dissipada e associação em série e em paralelo, contra o relógio.',
  categoria: 'fisica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'O enunciado dá os dados e a seta aponta a incógnita: responda só o número, em Ω, V, A ou W.',
    '"Req" é a resistência equivalente da associação.',
    'No paralelo os valores fecham em inteiro de propósito: o que se cobra é saber que a equivalente cai abaixo da menor, não dividir 1/R₁ + 1/R₂ de cabeça.',
    'Não precisa de Enter, e cada acerto devolve 5 segundos ao relógio.',
  ],
  config: () => ({
    gerar: gerarCircuitos,
    segundosIniciais: 60,
    // 5, como o nox e o pH: o enunciado tem dois dados e uma seta, e se lê na
    // mesma batida que "nox do S em H₂SO₄". A cinemática paga 6 porque lá a
    // frase tem três ou quatro dados; aqui não tem o que pagar.
    bonusPorAcertoS: 5,
    tetoSegundos: 120,
    escala: (acertos) => Math.min(NIVEL_MAX, Math.floor(acertos / 6)),
    teclado: 'numerico',
  }),
}
