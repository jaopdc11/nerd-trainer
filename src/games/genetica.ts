import type { Rng } from '@/core/rng'
import type { Conteudo, Exercicio, JogoGerador } from '@/core/types'

/**
 * Genética mendeliana contra o relógio, em quatro opções.
 *
 * Três degraus: monoibridismo, depois diibridismo e retrocruzamento, e por fim
 * os dois lugares em que a régua de Mendel continua valendo com o tabuleiro
 * mudado — os alelos múltiplos do sistema ABO e os genes que moram no X.
 *
 * ## "3:1", "1/4" e "25%": a decisão que organiza o arquivo
 *
 * A mesma resposta tem três grafias legítimas, e essa é a razão de o jogo ser de
 * **escolha e não digitado**. O problema não é o mesmo que a ordem de grandeza
 * resolveu exigindo Enter: lá a dúvida era *quando* a resposta acabou — "1e-5",
 * "10⁻⁵" e "0,00001" são o mesmo número, e o jogo não tinha como saber, na
 * tecla, se o jogador já havia terminado. O Enter resolve aquilo. Aqui o Enter
 * não resolve nada, porque a dúvida é *qual string conta*:
 *
 * - "1/4", "25%" e "0,25" são a mesma probabilidade, e `interpretarNumero` lê
 *   uma das três — a barra e o porcento nem chegam a ser número para ele;
 * - "3:1" não é número nenhum: é uma lista, com o mesmo problema de separador
 *   que tirou o balanceamento do digitado;
 * - e proporção não é probabilidade. "3:1" e "1/4" são respostas de perguntas
 *   diferentes sobre o mesmo cruzamento, e um campo de texto aceitaria as duas
 *   com a mesma cara.
 *
 * Digitar exigiria então ou ensinar frações e porcentagem ao validador, ou
 * escolher uma grafia e recusar as outras duas — ou seja, cobrar do jogador que
 * ele adivinhe a minha convenção, que é medir datilografia. Com alternativas, a
 * grafia deixa de ser pergunta: **cada carta pede uma forma só e as quatro
 * opções vêm todas nela**. Probabilidade sempre como fração irredutível ("1/4"),
 * proporção sempre com dois-pontos ("9:3:3:1"), porcentagem nunca. O teste
 * cobra isso carta a carta.
 *
 * Nada disso torna o item fácil: os distratores são os erros com nome —
 * proporção genotípica no lugar da fenotípica (1:2:1 por 3:1), o segundo loco
 * esquecido (1/4 por 1/16), a probabilidade condicional trocada pela simples
 * (1/3 por 1/2), e a fração "entre os meninos" no lugar da fração da prole
 * inteira (1/2 por 1/4), que é a pegadinha mais antiga do daltonismo.
 *
 * ## O gabarito é calculado, não digitado
 *
 * Nenhuma resposta está escrita no arquivo: cada item monta os gametas dos dois
 * genitores, cruza um a um e conta os descendentes. É a mesma regra do nox —
 * guardar a resposta ao lado da pergunta é pedir para um dedo errado ensinar
 * genética errada. O efeito colateral bom é que 9:3:3:1 não é uma constante
 * digitada por mim: ele *sai* de dois locos segregando independentes, e se
 * alguém estragar a montagem dos gametas a proporção deixa de fechar e o teste
 * denuncia.
 *
 * ## O que ficou de fora
 *
 * "Que cruzamento revela se um indivíduo de fenótipo dominante é AA ou Aa?" é a
 * carta conceitual óbvia, e ela não está aqui: o cruzamento-teste é a resposta
 * de prova, mas cruzar com outro heterozigoto *também* revela (1/4 dos
 * descendentes sai recessivo), e em planta a autofecundação idem. O gabarito
 * seria a minha redação e não um fato — a mesma recusa que as escolas literárias
 * fazem a "característica → escola".
 */

// ---------------------------------------------------------------------------
// Fração
// ---------------------------------------------------------------------------

interface Fracao {
  readonly n: number
  readonly d: number
}

const mdc = (a: number, b: number): number => (b === 0 ? a : mdc(b, a % b))

function fracao(n: number, d: number): Fracao {
  if (d === 0) throw new Error('genética: fração com denominador zero')
  const g = mdc(Math.abs(n), Math.abs(d)) || 1
  return { n: n / g, d: d / g }
}

/**
 * "1/4". Sempre irredutível, e nunca inteira.
 *
 * O denominador 1 explode de propósito: "1/1" e "0/1" não são resposta de jogo
 * nenhum — são itens em que a pergunta não tinha graça ("qual a chance de o
 * filho de AA × AA ser dominante?"). Ver também a guarda de `chanceEntre`.
 */
function exibirFracao(f: Fracao): string {
  if (f.d === 1) throw new Error(`genética: ${f.n}/${f.d} não é fração de probabilidade`)
  return `${f.n}/${f.d}`
}

// ---------------------------------------------------------------------------
// Quadro de Punnett
// ---------------------------------------------------------------------------

/**
 * Um cruzamento é o par de listas de gametas mais a regra que nomeia o
 * descendente.
 *
 * O rótulo é uma string livre, e não um tipo fechado, porque cada degrau nomeia
 * o descendente de um jeito: "dominante", "AaBb", "AB", "menina portadora". O
 * que todos têm em comum é só a contagem, e é isso que esta camada faz.
 */
interface Cruzamento {
  readonly gametasPai: readonly string[]
  readonly gametasMae: readonly string[]
  readonly rotular: (paterno: string, materno: string) => string
}

/** Quantos descendentes de cada rótulo, no denominador que o quadro tem (4, 16). */
function contar(c: Cruzamento): ReadonlyMap<string, number> {
  const conta = new Map<string, number>()
  for (const paterno of c.gametasPai) {
    for (const materno of c.gametasMae) {
      const rotulo = c.rotular(paterno, materno)
      conta.set(rotulo, (conta.get(rotulo) ?? 0) + 1)
    }
  }
  return conta
}

/**
 * Probabilidade dentro de um recorte da prole.
 *
 * `universo` é o que separa "1/4 das crianças" de "1/2 dos meninos", que é a
 * confusão que o daltonismo existe para desfazer — e por isso ele é parâmetro
 * explícito, e não um filtro esquecido dentro de cada item.
 *
 * Explode quando a resposta é 0 ou 1: item de probabilidade certa ou impossível
 * não é item, é uma frase declarativa com quatro botões embaixo.
 */
function chanceEntre(
  c: Cruzamento,
  universo: (rotulo: string) => boolean,
  aceita: (rotulo: string) => boolean,
): Fracao {
  let total = 0
  let favoraveis = 0
  for (const [rotulo, n] of contar(c)) {
    if (!universo(rotulo)) continue
    total += n
    if (aceita(rotulo)) favoraveis += n
  }
  if (total === 0) throw new Error('genética: recorte vazio da prole')
  if (favoraveis === 0 || favoraveis === total) {
    throw new Error(`genética: ${favoraveis}/${total} — item degenerado`)
  }
  return fracao(favoraveis, total)
}

const chance = (c: Cruzamento, aceita: (rotulo: string) => boolean): Fracao =>
  chanceEntre(c, () => true, aceita)

/**
 * "9:3:3:1", na ordem declarada e já reduzida.
 *
 * As duas guardas existem porque as duas falhas são silenciosas: uma classe que
 * aparece no quadro e não está na ordem sumiria da proporção (9:3:3:1 viraria
 * 9:3:3), e uma classe declarada que não aparece entraria como zero. Nos dois
 * casos o jogo mostraria uma proporção plausível e errada.
 */
function proporcao(c: Cruzamento, ordem: readonly string[]): string {
  const conta = contar(c)
  for (const rotulo of conta.keys()) {
    if (!ordem.includes(rotulo)) throw new Error(`genética: classe "${rotulo}" fora da ordem`)
  }
  const valores = ordem.map((rotulo) => conta.get(rotulo) ?? 0)
  if (valores.some((v) => v === 0)) throw new Error('genética: classe declarada que não sai')
  const divisor = valores.reduce((a, b) => mdc(a, b))
  return valores.map((v) => v / divisor).join(':')
}

// ---------------------------------------------------------------------------
// Genótipo em letras: 'Aa', 'AaBb'
// ---------------------------------------------------------------------------

/**
 * Os gametas de um genótipo escrito em pares de letras.
 *
 * 'Aa' → A, a. 'AaBb' → AB, Ab, aB, ab: o produto cartesiano dos locos, que é a
 * segunda lei em forma de código. 'aabb' devolve ab quatro vezes, e a repetição
 * é o que mantém o denominador do quadro em 16 — normalizar para um gameta só
 * daria a proporção certa e a probabilidade errada.
 *
 * É a única peça interna que o teste enxerga, pelo mesmo motivo que o
 * `normalizar` da ordem de grandeza é exportado: tudo depende dela e nada mais
 * a expõe. O resto do miolo fica coberto pelo gabarito escrito à mão — uma
 * contagem errada não devolve 9:3:3:1.
 */
export function gametas(genotipo: string): readonly string[] {
  if (genotipo.length === 0 || genotipo.length % 2 !== 0) {
    throw new Error(`genética: "${genotipo}" não é uma sequência de pares de alelos`)
  }

  let saida: readonly string[] = ['']
  for (let i = 0; i < genotipo.length; i += 2) {
    const primeiro = genotipo.charAt(i)
    const segundo = genotipo.charAt(i + 1)
    if (primeiro.toLowerCase() !== segundo.toLowerCase()) {
      throw new Error(`genética: "${genotipo}" tem dois locos no mesmo par`)
    }
    saida = saida.flatMap((parcial) => [parcial + primeiro, parcial + segundo])
  }
  return saida
}

/** 'A' + 'a' e 'a' + 'A' dão o mesmo 'Aa': o dominante vai na frente, sempre. */
function juntar(paterno: string, materno: string): string {
  let genotipo = ''
  for (let i = 0; i < paterno.length; i++) {
    const a = paterno.charAt(i)
    const b = materno.charAt(i)
    genotipo += a === a.toUpperCase() ? a + b : b + a
  }
  return genotipo
}

/** Um par com pelo menos uma maiúscula expressa o dominante. */
const dominante = (loco: string): boolean => loco !== loco.toLowerCase()

const DOMINANTE = 'dominante'
const RECESSIVO = 'recessivo'

/** Cruzamento de um loco só, rotulado pelo fenótipo. */
const cruzarFenotipo = (pai: string, mae: string): Cruzamento => ({
  gametasPai: gametas(pai),
  gametasMae: gametas(mae),
  rotular: (p, m) => (dominante(juntar(p, m)) ? DOMINANTE : RECESSIVO),
})

/** O mesmo, rotulado pelo genótipo: é o que separa 1:2:1 de 3:1. */
const cruzarGenotipo = (pai: string, mae: string): Cruzamento => ({
  gametasPai: gametas(pai),
  gametasMae: gametas(mae),
  rotular: juntar,
})

// As quatro classes do diibridismo, na ordem em que a proporção é escrita.
const DOIS_DOM = 'dominante nos dois'
const SO_PRIMEIRO = 'dominante só no primeiro'
const SO_SEGUNDO = 'dominante só no segundo'
const DOIS_REC = 'recessivo nos dois'
const CLASSES_DI = [DOIS_DOM, SO_PRIMEIRO, SO_SEGUNDO, DOIS_REC] as const

const cruzarDi = (pai: string, mae: string): Cruzamento => ({
  gametasPai: gametas(pai),
  gametasMae: gametas(mae),
  rotular: (p, m) => {
    const genotipo = juntar(p, m)
    const um = dominante(genotipo.slice(0, 2))
    const dois = dominante(genotipo.slice(2, 4))
    if (um && dois) return DOIS_DOM
    if (um) return SO_PRIMEIRO
    if (dois) return SO_SEGUNDO
    return DOIS_REC
  },
})

// ---------------------------------------------------------------------------
// Montagem do exercício
// ---------------------------------------------------------------------------

const FORMA_FRACAO = /^\d+\/\d+$/
const FORMA_PROPORCAO = /^\d+(?::\d+)+$/

function montar(
  rng: Rng,
  chave: string,
  enunciado: string,
  certo: string,
  candidatos: readonly string[],
  porque?: string,
): Exercicio {
  const errados: string[] = []
  for (const c of candidatos) {
    if (c !== certo && !errados.includes(c)) errados.push(c)
  }
  // Três alternativas erradas ou nada: carta de duas opções pontua igual e não
  // parece defeito na tela. Quebrar aqui põe o estrago no teste.
  if (errados.length < 3) throw new Error(`genética: ${chave} tem menos de três distratores`)

  const opcoes = rng.shuffle([certo, ...errados.slice(0, 3)])
  return {
    tipo: 'escolha',
    chave,
    enunciado: { kind: 'texto', valor: enunciado },
    alternativas: opcoes.map((v): Conteudo => ({ kind: 'texto', valor: v })),
    indiceCorreto: opcoes.indexOf(certo),
    gabarito: certo,
    ...(porque ? { porque } : {}),
  }
}

/**
 * Carta de probabilidade: as quatro opções são frações irredutíveis.
 *
 * Os distratores entram como `Fracao` e não como texto justamente para que a
 * comparação seja de valor: "2/4" e "1/2" são a mesma resposta escrita duas
 * vezes, e uma carta com as duas na tela teria duas alternativas certas.
 */
function cartaFracao(
  rng: Rng,
  chave: string,
  enunciado: string,
  certa: Fracao,
  candidatas: readonly Fracao[],
  porque?: string,
): Exercicio {
  const certo = exibirFracao(certa)
  const textos = candidatas.map(exibirFracao)
  for (const t of [certo, ...textos]) {
    if (!FORMA_FRACAO.test(t)) throw new Error(`genética: ${chave} tem "${t}" fora da forma fração`)
  }
  return montar(rng, chave, enunciado, certo, textos, porque)
}

/** Carta de proporção: as quatro opções são listas com dois-pontos. */
function cartaProporcao(
  rng: Rng,
  chave: string,
  enunciado: string,
  certa: string,
  candidatas: readonly string[],
  porque?: string,
): Exercicio {
  for (const t of [certa, ...candidatas]) {
    if (!FORMA_PROPORCAO.test(t)) {
      throw new Error(`genética: ${chave} tem "${t}" fora da forma proporção`)
    }
  }
  return montar(rng, chave, enunciado, certa, candidatas, porque)
}

// ---------------------------------------------------------------------------
// Nível 0 — monoibridismo
// ---------------------------------------------------------------------------

/**
 * O par de letras é sorteado só para a carta não ficar sempre com a mesma cara.
 *
 * Ele **não** entra na `chave`: a chave é o que a anti-repetição usa, e o mesmo
 * item voltando de casaco novo continua sendo o mesmo item. Trocar 'Aa × Aa' por
 * 'Vv × Vv' não muda pergunta nenhuma.
 */
const LETRAS = ['A', 'B', 'C', 'R', 'T', 'V'] as const

const par = (L: string): string => `${L}${L.toLowerCase()}`
const recessivoPuro = (L: string): string => `${L.toLowerCase()}${L.toLowerCase()}`
const dominantePuro = (L: string): string => `${L}${L}`

type Gerador = (rng: Rng) => Exercicio

const monoFenotipica: Gerador = (rng) => {
  const het = par(rng.pick(LETRAS))
  return cartaProporcao(
    rng,
    'gen:mono:fen',
    `${het} × ${het} → proporção fenotípica`,
    proporcao(cruzarFenotipo(het, het), [DOMINANTE, RECESSIVO]),
    ['1:2:1', '1:1', '9:3:3:1'],
    'a mesma tabela dá 1:2:1 de genótipos: a proporção fenotípica junta o homozigoto dominante e os dois heterozigotos num grupo só',
  )
}

const monoGenotipica: Gerador = (rng) => {
  const L = rng.pick(LETRAS)
  const het = par(L)
  return cartaProporcao(
    rng,
    'gen:mono:gen',
    `${het} × ${het} → proporção genotípica`,
    proporcao(cruzarGenotipo(het, het), [dominantePuro(L), het, recessivoPuro(L)]),
    ['3:1', '1:1', '1:1:1:1'],
    `${het} sai duas vezes em quatro, e por isso o meio da proporção é 2. Quem responde 3:1 deu a proporção fenotípica`,
  )
}

const monoRecessivo: Gerador = (rng) => {
  const het = par(rng.pick(LETRAS))
  return cartaFracao(
    rng,
    'gen:mono:p-rec',
    `${het} × ${het} → probabilidade de descendente com o fenótipo recessivo`,
    chance(cruzarFenotipo(het, het), (r) => r === RECESSIVO),
    [fracao(1, 2), fracao(3, 4), fracao(1, 16)],
  )
}

const monoDominante: Gerador = (rng) => {
  const het = par(rng.pick(LETRAS))
  return cartaFracao(
    rng,
    'gen:mono:p-dom',
    `${het} × ${het} → probabilidade de descendente com o fenótipo dominante`,
    chance(cruzarFenotipo(het, het), (r) => r === DOMINANTE),
    [fracao(1, 4), fracao(1, 2), fracao(9, 16)],
  )
}

const monoHeterozigoto: Gerador = (rng) => {
  const L = rng.pick(LETRAS)
  const het = par(L)
  return cartaFracao(
    rng,
    'gen:mono:p-het',
    `${het} × ${het} → probabilidade de descendente heterozigoto`,
    chance(cruzarGenotipo(het, het), (g) => g === het),
    [fracao(1, 4), fracao(3, 4), fracao(1, 3)],
    `${het} aparece em duas das quatro casas. 1/3 é a resposta de outra pergunta — a de quem já sabe que o descendente saiu com o fenótipo dominante`,
  )
}

const monoHomozigotoDominante: Gerador = (rng) => {
  const L = rng.pick(LETRAS)
  const het = par(L)
  return cartaFracao(
    rng,
    'gen:mono:p-homo',
    `${het} × ${het} → probabilidade de descendente ${dominantePuro(L)}`,
    chance(cruzarGenotipo(het, het), (g) => g === dominantePuro(L)),
    [fracao(3, 4), fracao(1, 2), fracao(1, 16)],
  )
}

const monoCruzamentoTeste: Gerador = (rng) => {
  const L = rng.pick(LETRAS)
  const het = par(L)
  const rec = recessivoPuro(L)
  return cartaProporcao(
    rng,
    'gen:mono:teste-fen',
    `${het} × ${rec} → proporção fenotípica`,
    proporcao(cruzarFenotipo(het, rec), [DOMINANTE, RECESSIVO]),
    ['3:1', '1:2:1', '1:1:1:1'],
  )
}

const monoTesteGenotipica: Gerador = (rng) => {
  const L = rng.pick(LETRAS)
  const het = par(L)
  const rec = recessivoPuro(L)
  return cartaProporcao(
    rng,
    'gen:mono:teste-gen',
    `${het} × ${rec} → proporção genotípica`,
    proporcao(cruzarGenotipo(het, rec), [het, rec]),
    ['3:1', '1:2:1', '9:3:3:1'],
    'no cruzamento com o homozigoto recessivo as duas proporções coincidem: cada genótipo é um fenótipo diferente, e 1:1 serve para as duas perguntas',
  )
}

const monoPuroHeterozigoto: Gerador = (rng) => {
  const L = rng.pick(LETRAS)
  return cartaFracao(
    rng,
    'gen:mono:puro-het',
    `${dominantePuro(L)} × ${par(L)} → probabilidade de descendente heterozigoto`,
    chance(cruzarGenotipo(dominantePuro(L), par(L)), (g) => g === par(L)),
    [fracao(1, 4), fracao(3, 4), fracao(1, 3)],
    `nenhum descendente é recessivo — todos recebem ${L} do genitor puro —, mas metade recebe ${L.toLowerCase()} do outro lado`,
  )
}

// ---------------------------------------------------------------------------
// Nível 1 — diibridismo e retrocruzamento
// ---------------------------------------------------------------------------

/** Dois locos diferentes, sempre em ordem alfabética: 'AaBb', nunca 'BbAa'. */
function doisLocos(rng: Rng): readonly [string, string] {
  const [primeiro, segundo] = rng.shuffle([...LETRAS])
  if (primeiro === undefined || segundo === undefined) throw new Error('genética: sem letras')
  return primeiro < segundo ? [primeiro, segundo] : [segundo, primeiro]
}

const diFenotipica: Gerador = (rng) => {
  const [X, Y] = doisLocos(rng)
  const duplo = par(X) + par(Y)
  return cartaProporcao(
    rng,
    'gen:di:fen',
    `${duplo} × ${duplo} → proporção fenotípica`,
    proporcao(cruzarDi(duplo, duplo), [...CLASSES_DI]),
    ['3:1', '1:1:1:1', '1:2:1'],
    'os dois locos segregam independentes, então a proporção é o produto de duas monoibridismos: (3:1) × (3:1) = 9:3:3:1',
  )
}

const diDuploRecessivo: Gerador = (rng) => {
  const [X, Y] = doisLocos(rng)
  const duplo = par(X) + par(Y)
  return cartaFracao(
    rng,
    'gen:di:p-rec',
    `${duplo} × ${duplo} → probabilidade de descendente recessivo para os dois caracteres`,
    chance(cruzarDi(duplo, duplo), (r) => r === DOIS_REC),
    [fracao(1, 4), fracao(1, 8), fracao(3, 16)],
    'cada loco por si, e depois o produto: 1/4 × 1/4 = 1/16. 1/8 é o que sai de somar onde se multiplica',
  )
}

const diDuploDominante: Gerador = (rng) => {
  const [X, Y] = doisLocos(rng)
  const duplo = par(X) + par(Y)
  return cartaFracao(
    rng,
    'gen:di:p-dom',
    `${duplo} × ${duplo} → probabilidade de descendente dominante para os dois caracteres`,
    chance(cruzarDi(duplo, duplo), (r) => r === DOIS_DOM),
    [fracao(3, 4), fracao(3, 16), fracao(1, 16)],
    '3/4 × 3/4 = 9/16 — é a classe maior do 9:3:3:1',
  )
}

const diMisto: Gerador = (rng) => {
  const [X, Y] = doisLocos(rng)
  const duplo = par(X) + par(Y)
  return cartaFracao(
    rng,
    'gen:di:p-misto',
    `${duplo} × ${duplo} → probabilidade de descendente dominante para ${X} e recessivo para ${Y}`,
    chance(cruzarDi(duplo, duplo), (r) => r === SO_PRIMEIRO),
    [fracao(9, 16), fracao(1, 16), fracao(1, 4)],
    '3/4 no primeiro loco e 1/4 no segundo: 3/16, que é uma das duas classes do meio',
  )
}

const diCruzamentoTeste: Gerador = (rng) => {
  const [X, Y] = doisLocos(rng)
  const duplo = par(X) + par(Y)
  const rec = recessivoPuro(X) + recessivoPuro(Y)
  return cartaProporcao(
    rng,
    'gen:di:teste',
    `${duplo} × ${rec} → proporção fenotípica`,
    proporcao(cruzarDi(duplo, rec), [...CLASSES_DI]),
    ['9:3:3:1', '3:1', '1:2:1'],
    `o duplo recessivo não esconde nada: os quatro gametas de ${duplo} aparecem um a um no descendente, em partes iguais. É o cruzamento-teste`,
  )
}

const retrocruzamento: Gerador = (rng) => {
  const L = rng.pick(LETRAS)
  const het = par(L)
  const rec = recessivoPuro(L)
  return cartaFracao(
    rng,
    'gen:mono:retro',
    `${het} × ${rec} → probabilidade de descendente com o fenótipo recessivo`,
    chance(cruzarFenotipo(het, rec), (r) => r === RECESSIVO),
    [fracao(1, 4), fracao(3, 4), fracao(1, 16)],
    `é o retrocruzamento com o homozigoto recessivo: metade da prole sai recessiva e denuncia o ${L.toLowerCase()} escondido no genitor dominante`,
  )
}

// ---------------------------------------------------------------------------
// Nível 2 — sistema ABO, fator Rh e genes no X
// ---------------------------------------------------------------------------

/**
 * Sistema ABO: três alelos, dois deles codominantes entre si.
 *
 * Os gametas são escritos 'A', 'B' e 'i' porque é o alelo que o gameta carrega —
 * Iᴬ, Iᴮ e i. O enunciado, em compensação, fala em fenótipo e zigose ("tipo A,
 * heterozigoto") e não em genótipo: a notação Iᴬi é a que mais varia de livro
 * para livro, e a carta não existe para testar se o jogador reconhece a minha.
 */
function tipoSanguineo(a: string, b: string): string {
  const temA = a === 'A' || b === 'A'
  const temB = a === 'B' || b === 'B'
  if (temA && temB) return 'AB'
  if (temA) return 'A'
  if (temB) return 'B'
  return 'O'
}

const cruzarABO = (pai: readonly string[], mae: readonly string[]): Cruzamento => ({
  gametasPai: pai,
  gametasMae: mae,
  rotular: tipoSanguineo,
})

const A_HET = ['A', 'i'] as const
const B_HET = ['B', 'i'] as const
const O_PURO = ['i', 'i'] as const
const AB = ['A', 'B'] as const

const aboTipoO: Gerador = (rng) =>
  cartaFracao(
    rng,
    'gen:abo:p-o',
    'Pai do tipo A heterozigoto × mãe do tipo B heterozigota → probabilidade de filho do tipo O',
    chance(cruzarABO(A_HET, B_HET), (t) => t === 'O'),
    [fracao(1, 2), fracao(1, 8), fracao(3, 4)],
    'Iᴬ e Iᴮ são codominantes e i é recessivo diante dos dois: das quatro casas saem AB, A, B e O, uma de cada',
  )

const aboTipoAB: Gerador = (rng) =>
  cartaFracao(
    rng,
    'gen:abo:p-ab',
    'Pai do tipo A heterozigoto × mãe do tipo B heterozigota → probabilidade de filho do tipo AB',
    chance(cruzarABO(A_HET, B_HET), (t) => t === 'AB'),
    [fracao(1, 2), fracao(3, 4), fracao(1, 8)],
    'o filho AB é o que recebe Iᴬ de um lado e Iᴮ do outro — os dois se expressam juntos, que é o que codominância quer dizer',
  )

const aboComO: Gerador = (rng) =>
  cartaFracao(
    rng,
    'gen:abo:com-o',
    'Pai do tipo A heterozigoto × mãe do tipo O → probabilidade de filho do tipo O',
    chance(cruzarABO(A_HET, O_PURO), (t) => t === 'O'),
    [fracao(1, 4), fracao(3, 4), fracao(1, 8)],
  )

const aboAbComO: Gerador = (rng) =>
  cartaProporcao(
    rng,
    'gen:abo:ab-x-o',
    'Pai do tipo AB × mãe do tipo O → proporção dos tipos sanguíneos entre os filhos',
    proporcao(cruzarABO(AB, O_PURO), ['A', 'B']),
    ['1:2:1', '3:1', '1:1:1:1'],
    'nenhum filho é AB nem O: todos recebem Iᴬ ou Iᴮ do pai e i da mãe, metade de cada — o caso em que o filho não pode ter o tipo de nenhum dos dois',
  )

/** Rh: um loco, dominância simples. O nome dos fenótipos é que muda. */
const rhNegativo: Gerador = (rng) =>
  cartaFracao(
    rng,
    'gen:rh:p-neg',
    'Casal Rh positivo, os dois heterozigotos → probabilidade de filho Rh negativo',
    chance(
      {
        gametasPai: gametas('Rr'),
        gametasMae: gametas('Rr'),
        rotular: (p, m) => (dominante(juntar(p, m)) ? 'Rh+' : 'Rh−'),
      },
      (r) => r === 'Rh−',
    ),
    [fracao(1, 2), fracao(3, 4), fracao(1, 16)],
    'Rh+ é dominante, então os dois genitores carregam o alelo negativo sem mostrá-lo: só o duplo recessivo nasce Rh−',
  )

/**
 * Genes no X.
 *
 * Os gametas são 'X' (alelo normal), 'x' (alelo recessivo) e 'Y'. O Y não leva o
 * gene — é justamente por isso que o menino não tem segunda chance, e é isso que
 * as cartas deste bloco medem.
 */
const MAE_PORTADORA = ['X', 'x'] as const
const PAI_NORMAL = ['X', 'Y'] as const
const PAI_AFETADO = ['x', 'Y'] as const

const cruzarNoX = (pai: readonly string[], mae: readonly string[]): Cruzamento => ({
  gametasPai: pai,
  gametasMae: mae,
  rotular: (paterno, materno) => {
    if (paterno === 'Y') return materno === 'x' ? 'menino afetado' : 'menino normal'
    if (paterno === 'x' && materno === 'x') return 'menina afetada'
    if (paterno === 'x' || materno === 'x') return 'menina portadora'
    return 'menina normal'
  },
})

const menino = (r: string): boolean => r.startsWith('menino')
const menina = (r: string): boolean => r.startsWith('menina')
const afetado = (r: string): boolean => r.endsWith('afetado') || r.endsWith('afetada')

const daltonismoProle: Gerador = (rng) =>
  cartaFracao(
    rng,
    'gen:x:dalt-prole',
    'Mulher portadora de daltonismo × homem de visão normal → probabilidade de uma criança daltônica',
    chance(cruzarNoX(PAI_NORMAL, MAE_PORTADORA), afetado),
    [fracao(1, 2), fracao(1, 8), fracao(3, 4)],
    'metade dos meninos é daltônica e os meninos são metade da prole: 1/2 × 1/2 = 1/4. A resposta 1/2 é a de outra pergunta — a fração entre os meninos',
  )

const daltonismoMeninos: Gerador = (rng) =>
  cartaFracao(
    rng,
    'gen:x:dalt-meninos',
    'Mulher portadora de daltonismo × homem de visão normal → entre os meninos, qual a fração de daltônicos',
    chanceEntre(cruzarNoX(PAI_NORMAL, MAE_PORTADORA), menino, afetado),
    [fracao(1, 4), fracao(3, 4), fracao(1, 8)],
    'o menino recebe do pai só o Y, que não carrega o gene: o X dele vem inteiro da mãe, e ela tem um alelo de cada',
  )

const daltonismoMeninas: Gerador = (rng) =>
  cartaFracao(
    rng,
    'gen:x:dalt-meninas',
    'Mulher portadora de daltonismo × homem de visão normal → entre as meninas, qual a fração de portadoras',
    chanceEntre(cruzarNoX(PAI_NORMAL, MAE_PORTADORA), menina, (r) => r === 'menina portadora'),
    [fracao(1, 4), fracao(3, 4), fracao(1, 8)],
    'nenhuma menina é daltônica aqui: o X que vem do pai é normal, e a que recebe o alelo da mãe fica portadora',
  )

const hemofiliaProle: Gerador = (rng) =>
  cartaFracao(
    rng,
    'gen:x:hemo-prole',
    'Mulher portadora de hemofilia × homem hemofílico → probabilidade de uma criança hemofílica',
    chance(cruzarNoX(PAI_AFETADO, MAE_PORTADORA), afetado),
    [fracao(1, 4), fracao(3, 4), fracao(1, 8)],
    'aqui a menina também pode ser afetada, porque recebe um X do pai hemofílico: metade das meninas e metade dos meninos',
  )

const hemofiliaMenina: Gerador = (rng) =>
  cartaFracao(
    rng,
    'gen:x:hemo-menina',
    'Mulher portadora de hemofilia × homem hemofílico → probabilidade de uma menina hemofílica',
    chance(cruzarNoX(PAI_AFETADO, MAE_PORTADORA), (r) => r === 'menina afetada'),
    [fracao(1, 2), fracao(3, 4), fracao(1, 8)],
    'a menina só é afetada com o alelo dos dois lados — e o lado do pai só existe quando o pai é hemofílico, que é por que a hemofilia em mulher é rara',
  )

// ---------------------------------------------------------------------------
// Escada
// ---------------------------------------------------------------------------

const DEGRAUS: readonly (readonly Gerador[])[] = [
  [
    monoFenotipica,
    monoGenotipica,
    monoRecessivo,
    monoDominante,
    monoHeterozigoto,
    monoHomozigotoDominante,
    monoCruzamentoTeste,
    monoTesteGenotipica,
    monoPuroHeterozigoto,
  ],
  [diFenotipica, diDuploRecessivo, diDuploDominante, diMisto, diCruzamentoTeste, retrocruzamento],
  [
    aboTipoO,
    aboTipoAB,
    aboComO,
    aboAbComO,
    rhNegativo,
    daltonismoProle,
    daltonismoMeninos,
    daltonismoMeninas,
    hemofiliaProle,
    hemofiliaMenina,
  ],
]

export const NIVEL_MAX = DEGRAUS.length - 1

export function gerarGenetica(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), NIVEL_MAX)
  const atuais = DEGRAUS[n] ?? []
  // O nível novo entra em dobro: acumula os anteriores sem afogá-los.
  return rng.pick([...DEGRAUS.slice(0, n).flat(), ...atuais, ...atuais])(rng)
}

export const genetica: JogoGerador = {
  id: 'genetica',
  mecanica: 'gerador',
  nome: 'Genética mendeliana',
  // O quadro de Punnett, que é a coisa que o jogo inteiro faz. O ícone de DNA
  // fica para quem trabalha com código genético: aqui não se transcreve nada.
  icone: '⊞',
  resumo: 'Do 3:1 ao 9:3:3:1, com grupos sanguíneos e daltonismo no fim.',
  categoria: 'biologicas',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Aparece o cruzamento e você escolhe a resposta entre quatro.',
    'Probabilidade vem sempre como fração irredutível (1/4) e proporção sempre com dois-pontos (3:1) — a carta pede uma das duas, e as quatro opções estão na mesma forma.',
    'Repare no recorte: "uma criança daltônica" e "entre os meninos" são perguntas diferentes sobre o mesmo casal.',
    'Cada acerto devolve 6 segundos ao relógio.',
  ],
  config: () => ({
    gerar: gerarGenetica,
    // Entre o nox (60s/+5s) e o balanceamento (75s/+6s), e por um motivo que
    // muda com o nível: "Aa × Aa → proporção fenotípica" se lê na batida do nox,
    // mas "mulher portadora × homem hemofílico → probabilidade de uma menina
    // hemofílica" é uma frase com dois genitores e um recorte da prole. O relógio
    // maior paga o custo de ler o item, não aumenta a vazão.
    segundosIniciais: 70,
    bonusPorAcertoS: 6,
    tetoSegundos: 140,
    escala: (acertos) => Math.min(NIVEL_MAX, Math.floor(acertos / 6)),
    teclado: 'texto',
  }),
}
