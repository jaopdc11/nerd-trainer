/**
 * Configuração eletrônica pela ordem de Madelung — o diagrama de Linus Pauling.
 *
 * **Nenhuma configuração está escrita à mão.** Vale aqui a mesma regra de
 * `data/nox.ts`: gravar a resposta elemento a elemento é pedir para um dedo
 * errado ensinar química errada, e são 118 linhas com 5 a 19 orbitais cada —
 * uma delas sairia torta e ninguém notaria. O que está gravado é só o que *não*
 * sai de regra nenhuma: as vinte exceções medidas.
 *
 * E mesmo elas não são escritas como configuração pronta, e sim como
 * **transferência** — "o 4s cede 1 elétron para o 3d". A diferença não é de
 * estilo: uma transferência conserva o total por construção, então é
 * impossível uma exceção mal digitada produzir um cromo com 23 ou 25 elétrons.
 * Se alguém errar o orbital de origem, `aplicarExcecao` quebra na hora em vez
 * de devolver uma configuração plausível e falsa. A alternativa — um mapa de
 * `24: '1s² 2s² ... 4s¹ 3d⁵'` — tinha de ser conferida caractere a caractere
 * por um humano, que é exatamente o que o teste deste arquivo faz só com as
 * âncoras, e não com as 118.
 *
 * **Por que a ordem energética e não a ordem de camada.** Aqui se escreve
 * `4s² 3d⁶`, na ordem em que os subníveis são preenchidos (a diagonal de
 * Pauling), e não `3d⁶ 4s²`, na ordem de n. As duas convenções existem e
 * descrevem o mesmo átomo, mas é a diagonal que o ensino médio brasileiro usa,
 * é ela que o jogo cobra, e é exatamente sobre ela que mora o erro clássico de
 * pular o 4s. Escrever na ordem de n aqui deixaria o distrator mais importante
 * — o de quem esqueceu a diagonal — indistinguível da resposta certa.
 *
 * **Do Rf (Z=104) em diante a configuração é calculada, não medida.** Nenhuma
 * exceção é declarada para os superpesados: onde ninguém mediu, este arquivo
 * devolve Madelung puro e o jogo não pergunta (ver `PRIMEIRO_PREVISTO`).
 * Inventar aqui a exceção prevista por um cálculo relativístico seria ensinar
 * como certo o que é palpite.
 */

export type Subnivel = 's' | 'p' | 'd' | 'f'

export interface Orbital {
  readonly n: number
  readonly sub: Subnivel
  readonly eletrons: number
}

/** Na ordem em que os subníveis foram preenchidos — a ordem *é* informação. */
export type Configuracao = readonly Orbital[]

/** Um subnível vazio, antes de receber elétron. */
interface Posicao {
  readonly n: number
  readonly sub: Subnivel
}

const CAPACIDADE: Readonly<Record<Subnivel, number>> = { s: 2, p: 6, d: 10, f: 14 }

/** ℓ. É ele que dá a ordem: Madelung ordena por n+ℓ e desempata por n. */
const AZIMUTAL: Readonly<Record<Subnivel, number>> = { s: 0, p: 1, d: 2, f: 3 }

const SUBNIVEIS = ['s', 'p', 'd', 'f'] as const

export const Z_MAX = 118

/**
 * n até 7 basta e não é coincidência: a soma das capacidades até o 7p é
 * exatamente 118. Subir para n=8 só acrescentaria orbitais que jamais recebem
 * elétron neste universo, e o teste trava esse número.
 */
const N_MAX = 7

const TODAS: readonly Posicao[] = SUBNIVEIS.flatMap((sub) =>
  Array.from({ length: N_MAX }, (_, i) => i + 1)
    .filter((n) => AZIMUTAL[sub] < n)
    .map((n): Posicao => ({ n, sub })),
)

const chave = (p: Posicao): string => `${p.n}${p.sub}`

/** 1s 2s 2p 3s 3p 4s 3d 4p… — a diagonal do diagrama de Pauling. */
export const ORDEM_MADELUNG: readonly Posicao[] = [...TODAS].sort(
  (a, b) => a.n + AZIMUTAL[a.sub] - (b.n + AZIMUTAL[b.sub]) || a.n - b.n,
)

/**
 * 1s 2s 2p 3s 3p 3d 4s… — o que sai quando se ignora a diagonal e se preenche
 * camada por camada. Não é uma ordem alternativa legítima: é *o* erro clássico,
 * e está aqui porque é o primeiro distrator (ver `distratores`).
 */
const ORDEM_POR_CAMADA: readonly Posicao[] = [...TODAS].sort(
  (a, b) => a.n - b.n || AZIMUTAL[a.sub] - AZIMUTAL[b.sub],
)

function posicaoDe(k: string): Posicao {
  const p = ORDEM_MADELUNG.find((q) => chave(q) === k)
  // Um 'd3' trocado por '3d' no mapa de exceções tem de explodir: silenciosamente
  // ele viraria um orbital inventado no fim da configuração.
  if (!p) throw new Error(`configuração: subnível desconhecido "${k}"`)
  return p
}

function preencher(z: number, ordem: readonly Posicao[]): Configuracao {
  if (!Number.isInteger(z) || z < 1 || z > Z_MAX) {
    throw new Error(`configuração: Z fora de 1..${Z_MAX} (${z})`)
  }

  let restantes = z
  const saida: Orbital[] = []
  for (const p of ordem) {
    if (restantes === 0) break
    const cabe = Math.min(restantes, CAPACIDADE[p.sub])
    saida.push({ n: p.n, sub: p.sub, eletrons: cabe })
    restantes -= cabe
  }
  if (restantes > 0) throw new Error(`configuração: sobraram ${restantes} elétrons em Z=${z}`)
  return saida
}

/** Aufbau ingênuo: a fila da diagonal, sem nenhuma exceção. */
export function madelungPuro(z: number): Configuracao {
  return preencher(z, ORDEM_MADELUNG)
}

/**
 * Uma exceção medida, dita como transferência a partir do Aufbau ingênuo.
 *
 * `porque` não é enfeite: é o que aparece embaixo do gabarito quando a pessoa
 * erra. "Cr é 4s¹ 3d⁵" sem o motivo não sobrevive à próxima partida — é a mesma
 * decisão do `porque` das armadilhas do nox.
 */
export interface Excecao {
  /** Chave do subnível que cede, "4s". */
  readonly de: string
  /** Chave do subnível que recebe, "3d". */
  readonly para: string
  readonly quantos: number
  readonly porque: string
}

/**
 * As vinte exceções experimentais até o Lr (Z=103), conferidas contra os níveis
 * fundamentais do NIST.
 *
 * Duas famílias respondem por quase todas: **meio preenchido** (3d⁵, 4d⁵, 4f⁷) e
 * **cheio** (3d¹⁰, 4d¹⁰), que compensam o elétron que o s perde. O resto é o
 * começo das séries f, onde o 4f/5f ainda está acima do 5d/6d e a série abre
 * pelo d. O Lr é caso à parte e está comentado na linha.
 *
 * Todas as transferências vão do s para o d, ou do f para o d — menos a do Lr.
 * O teste cobra essa forma: uma linha nova que fuja dela é erro de digitação
 * até prova em contrário.
 */
export const EXCECOES: Readonly<Record<number, Excecao>> = {
  // --- meio preenchido e cheio no 3d ----------------------------------------
  24: { de: '4s', para: '3d', quantos: 1, porque: 'meio preenchido paga: o 4s cede um elétron e o 3d fecha em 3d⁵' },
  29: { de: '4s', para: '3d', quantos: 1, porque: 'subnível cheio paga mais ainda: o 4s cede e o 3d fecha em 3d¹⁰' },

  // --- o mesmo no 4d, onde 5s e 4d estão ainda mais próximos em energia ------
  41: { de: '5s', para: '4d', quantos: 1, porque: 'no 5º período o 5s e o 4d quase empatam: o nióbio já cede um elétron sem nem fechar 4d⁵' },
  42: { de: '5s', para: '4d', quantos: 1, porque: 'molibdênio é o cromo do 5º período: 4d⁵ meio preenchido' },
  44: { de: '5s', para: '4d', quantos: 1, porque: 'rutênio cede o elétron do 5s sem meio preenchido nenhum — 5s e 4d empatam em energia' },
  45: { de: '5s', para: '4d', quantos: 1, porque: 'ródio, como o rutênio: o 5s cede e o 4d recebe' },
  46: { de: '5s', para: '4d', quantos: 2, porque: 'paládio é o único elemento que esvazia o s da última camada: 4d¹⁰ e nada no 5s' },
  47: { de: '5s', para: '4d', quantos: 1, porque: 'prata é o cobre do 5º período: 4d¹⁰ cheio' },

  // --- começo das séries f: o d entra antes do f ----------------------------
  57: { de: '4f', para: '5d', quantos: 1, porque: 'no lantânio o 4f ainda está acima do 5d: a série começa pelo d, não pelo f' },
  58: { de: '4f', para: '5d', quantos: 1, porque: 'o cério ainda segura um elétron no 5d enquanto o 4f começa' },
  64: { de: '4f', para: '5d', quantos: 1, porque: 'gadolínio é o meio preenchido do f: 4f⁷ e o elétron que sobra vai para o 5d' },

  // --- fim da série d do 6º período -----------------------------------------
  78: { de: '6s', para: '5d', quantos: 1, porque: 'platina cede um elétron do 6s para o 5d chegar a 5d⁹' },
  79: { de: '6s', para: '5d', quantos: 1, porque: 'ouro é o cobre do 6º período: 5d¹⁰ cheio e um único elétron no 6s' },

  // --- actinídeos: o 6d entra antes do 5f ------------------------------------
  89: { de: '5f', para: '6d', quantos: 1, porque: 'o actínio abre a série pelo 6d, como o lantânio abre pelo 5d' },
  90: { de: '5f', para: '6d', quantos: 2, porque: 'o tório é o único actinídeo sem nenhum elétron no 5f: os dois vão para o 6d' },
  91: { de: '5f', para: '6d', quantos: 1, porque: 'no protactínio o 5f já domina, mas um elétron fica no 6d' },
  92: { de: '5f', para: '6d', quantos: 1, porque: 'urânio: 5f³ e um elétron teimoso no 6d' },
  93: { de: '5f', para: '6d', quantos: 1, porque: 'netúnio mantém o elétron no 6d, como o urânio' },
  96: { de: '5f', para: '6d', quantos: 1, porque: 'cúrio é o gadolínio dos actinídeos: 5f⁷ meio preenchido e um elétron no 6d' },

  // O Lr é a única exceção que não termina em d. O 7p entra abaixo do 6d por
  // efeito relativístico — previsto por cálculo e confirmado em 2015 pela
  // medida da energia de ionização, que é o que o tira da lista de palpites.
  103: { de: '6d', para: '7p', quantos: 1, porque: 'efeito relativístico: no laurêncio o 7p desce abaixo do 6d, e o elétron vai para lá' },
}

/** Do rutherfórdio em diante ninguém mediu: ver o cabeçalho. */
export const PRIMEIRO_PREVISTO = 104

/**
 * O Aufbau ingênuo de `z` com a transferência de `ex` aplicada.
 *
 * Exportada para que o teste possa alimentá-la com exceções inventadas e ver as
 * guardas quebrarem: elas são a única coisa que separa um mapa auditável de
 * vinte configurações escritas no chute.
 */
export function aplicarExcecao(z: number, ex: Excecao): Configuracao {
  const base = madelungPuro(z)

  // Só pela validação: uma chave inventada em `de` passaria batido como "0
  // elétrons" e a guarda de baixo culparia o elemento, não o mapa.
  posicaoDe(ex.de)
  const para = posicaoDe(ex.para)

  const contas = new Map<string, number>(base.map((o) => [chave(o), o.eletrons]))
  const tinha = contas.get(ex.de) ?? 0
  const recebe = (contas.get(ex.para) ?? 0) + ex.quantos

  // As duas guardas que tornam o mapa auditável: se a origem não tem o elétron,
  // ou se o destino não comporta, a exceção está descrita errada — e uma
  // configuração errada é pior que uma exceção faltando.
  if (tinha < ex.quantos) {
    throw new Error(`Z=${z}: ${ex.de} tem ${tinha} elétrons, não dá para ceder ${ex.quantos}`)
  }
  if (recebe > CAPACIDADE[para.sub]) {
    throw new Error(`Z=${z}: ${ex.para} estouraria a capacidade (${recebe})`)
  }

  contas.set(ex.de, tinha - ex.quantos)
  contas.set(ex.para, recebe)

  // Reemite na ordem da diagonal: o subnível que recebeu pode não existir na
  // base (o 5d do lantânio, o 7p do laurêncio) e precisa entrar no lugar certo,
  // e o que cedeu pode ter zerado (o 5s do paládio) e precisa sumir.
  return ORDEM_MADELUNG.filter((p) => (contas.get(chave(p)) ?? 0) > 0).map(
    (p): Orbital => ({ n: p.n, sub: p.sub, eletrons: contas.get(chave(p)) as number }),
  )
}

/** A configuração do estado fundamental: Madelung, corrigido pelas exceções. */
export function configuracao(z: number): Configuracao {
  const ex = EXCECOES[z]
  return ex ? aplicarExcecao(z, ex) : madelungPuro(z)
}

export function totalDeEletrons(c: Configuracao): number {
  return c.reduce((soma, o) => soma + o.eletrons, 0)
}

// ---------------------------------------------------------------------------
// Exibição
// ---------------------------------------------------------------------------

const SUPERESCRITO = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const

const expoente = (n: number): string =>
  [...String(n)].map((d) => SUPERESCRITO[Number(d)] ?? '').join('')

/**
 * Z e símbolo dos gases nobres, para o caroço da forma abreviada.
 *
 * Escrito aqui e não importado de `tabela-periodica.ts` porque o que interessa
 * é o Z de camada fechada, que é estrutural; o teste confere símbolo por
 * símbolo contra `ELEMENTOS`, então a duplicação não pode divergir em silêncio.
 */
export const GASES_NOBRES: readonly (readonly [number, string])[] = [
  [2, 'He'],
  [10, 'Ne'],
  [18, 'Ar'],
  [36, 'Kr'],
  [54, 'Xe'],
  [86, 'Rn'],
]

export type Forma = 'completa' | 'abreviada'

const mesmoConjunto = (a: Configuracao, b: Configuracao): boolean => {
  if (a.length !== b.length) return false
  const mapa = new Map(a.map((o) => [chave(o), o.eletrons]))
  return b.every((o) => mapa.get(chave(o)) === o.eletrons)
}

/**
 * Maior gás nobre que serve de caroço, ou null.
 *
 * A comparação é por *conjunto* de orbitais, não pela ordem: "[Ar]" quer dizer
 * "os 18 elétrons do argônio", e quem escreveu o caroço na ordem de camada
 * escreveu os mesmos 18. É o que permite abreviar também os distratores — sem
 * isso, o distrator de quem esqueceu a diagonal apareceria na forma completa ao
 * lado de três opções curtas e se denunciaria pelo comprimento, não pela
 * química.
 */
export function caroco(c: Configuracao): readonly [number, string, number] | null {
  let acumulado = 0
  let achado: readonly [number, string, number] | null = null

  for (let i = 0; i < c.length; i++) {
    acumulado += (c[i] as Orbital).eletrons
    const gas = GASES_NOBRES.find(([z]) => z === acumulado)
    // O gás tem de ser menor que o átomo: abreviar o criptônio como "[Kr]"
    // devolveria uma opção vazia.
    if (gas && acumulado < totalDeEletrons(c) && mesmoConjunto(c.slice(0, i + 1), madelungPuro(acumulado))) {
      achado = [gas[0], gas[1], i + 1]
    }
  }
  return achado
}

const orbitalTexto = (o: Orbital): string => `${o.n}${o.sub}${expoente(o.eletrons)}`

export function exibir(c: Configuracao, forma: Forma = 'completa'): string {
  if (forma === 'abreviada') {
    const nucleo = caroco(c)
    if (nucleo) {
      const [, simbolo, corte] = nucleo
      return `[${simbolo}] ${c.slice(corte).map(orbitalTexto).join(' ')}`
    }
  }
  return c.map(orbitalTexto).join(' ')
}

// ---------------------------------------------------------------------------
// Distratores
// ---------------------------------------------------------------------------

/** Move `quantos` elétrons entre dois subníveis de uma configuração qualquer. */
function mover(c: Configuracao, de: Posicao, para: Posicao, quantos: number): Configuracao | null {
  const contas = new Map<string, number>(c.map((o) => [chave(o), o.eletrons]))
  const tinha = contas.get(chave(de)) ?? 0
  const recebe = (contas.get(chave(para)) ?? 0) + quantos
  if (tinha < quantos || recebe > CAPACIDADE[para.sub]) return null

  contas.set(chave(de), tinha - quantos)
  contas.set(chave(para), recebe)
  return ORDEM_MADELUNG.filter((p) => (contas.get(chave(p)) ?? 0) > 0).map(
    (p): Orbital => ({ n: p.n, sub: p.sub, eletrons: contas.get(chave(p)) as number }),
  )
}

/** Último subnível de um tipo que tem elétron. */
function ultimo(c: Configuracao, sub: Subnivel): Orbital | null {
  return [...c].reverse().find((o) => o.sub === sub) ?? null
}

/** Aplicou o truque do cromo onde ele não vale: o s da última camada cede ao d. */
function excecaoIndevida(z: number): Configuracao | null {
  if (EXCECOES[z]) return null
  const base = madelungPuro(z)
  const s = ultimo(base, 's')
  const d = ultimo(base, 'd')
  if (!s || !d || d.n !== s.n - 1) return null
  return mover(base, { n: s.n, sub: 's' }, { n: d.n, sub: 'd' }, 1)
}

/**
 * O 2s¹ 2p³ do carbono: promoveu um elétron do s para o p da mesma camada.
 *
 * É o erro de quem ouviu falar de hibridização antes de fechar o Aufbau, e o
 * único distrator bom para os elementos leves — onde não há d nem exceção e
 * sobrariam só erros de contagem.
 */
function promocaoSP(z: number): Configuracao | null {
  const base = configuracao(z)
  const p = ultimo(base, 'p')
  const s = ultimo(base, 's')
  if (!p || !s || s.n !== p.n) return null
  return mover(base, { n: s.n, sub: 's' }, { n: p.n, sub: 'p' }, 1)
}

/** Não completou o subnível e já pulou para o próximo. Último recurso. */
function deslocado(z: number): Configuracao | null {
  const base = configuracao(z)
  const fim = base[base.length - 1]
  if (!fim) return null
  const i = ORDEM_MADELUNG.findIndex((p) => chave(p) === chave(fim))
  const proximo = ORDEM_MADELUNG[i + 1]
  if (!proximo) return null
  return mover(base, fim, proximo, 1)
}

/** Vizinho na tabela, para o erro de contagem: escreveu a configuração de outro Z. */
function vizinho(z: number, delta: number): Configuracao | null {
  const alvo = z + delta
  if (alvo < 1 || alvo > Z_MAX) return null
  return configuracao(alvo)
}

/**
 * As configurações erradas que alguém de fato marca, em ordem de prioridade.
 *
 * Igual ao nox: distrator aleatório não mede nada, porque quem sabe elimina
 * "3s⁹" sem pensar. Os três primeiros são erros com nome:
 *
 * 1. **esqueceu a diagonal** — preencheu camada por camada e escreveu 3d antes
 *    do 4s. É o erro que o jogo inteiro existe para cobrar, e por isso vem
 *    primeiro; some sozinho nos vinte primeiros elementos, onde não há d.
 * 2. **Aufbau na exceção** — o que a regra diria se o cromo fosse comportado:
 *    4s² 3d⁴. Só existe nas vinte exceções, e é a razão de elas terem um nível
 *    só para si.
 * 3. **exceção indevida** — o contrário: aplicou o truque do cromo no ferro.
 *    Quem decorou "o d rouba do s" sem saber quando marca esta.
 *
 * Depois vêm a promoção s→p e os vizinhos de Z, que cobrem os elementos leves e
 * completam as quatro opções quando os erros com nome não se aplicam. A lista
 * mora no dataset, e não no jogo, porque é química: quem mexer nas exceções tem
 * de ver os distratores na mesma tela.
 */
export function distratores(z: number): readonly Configuracao[] {
  const certa = configuracao(z)
  const certo = exibir(certa)
  const porCamada = preencher(z, ORDEM_POR_CAMADA)

  /**
   * O erro de camada só vale como distrator quando muda alguma ocupação.
   *
   * No cobre ele devolve `3d¹⁰ 4s¹` — que é a resposta certa escrita na outra
   * convenção, a de n crescente, e que qualquer livro aceita. Oferecer isso como
   * opção errada seria punir quem sabe mais, não quem sabe menos. Some também
   * no arsênio, no criptônio e em todo elemento de d fechado.
   */
  const camadaVale = !mesmoConjunto(porCamada, certa)

  const candidatos: readonly (Configuracao | null)[] = [
    camadaVale ? porCamada : null,
    EXCECOES[z] ? madelungPuro(z) : null,
    excecaoIndevida(z),
    promocaoSP(z),
    vizinho(z, 1),
    vizinho(z, -1),
    vizinho(z, 2),
    vizinho(z, -2),
    deslocado(z),
  ]

  const vistos = new Set<string>([certo])
  const saida: Configuracao[] = []
  for (const c of candidatos) {
    if (!c) continue
    const texto = exibir(c)
    if (vistos.has(texto)) continue
    // Mesmo conjunto de ocupações = mesmo átomo, escrito em outra ordem. Nunca
    // entra: ver `camadaVale`.
    if (mesmoConjunto(c, certa)) continue
    vistos.add(texto)
    saida.push(c)
  }

  /**
   * Quem cabe no mesmo gás nobre passa na frente.
   *
   * Na forma abreviada, um distrator com outro caroço se denuncia pelo
   * comprimento e não pela química: ao lado de três opções em `[Xe]`, o
   * `[Kr] 4d¹⁰ 4f¹⁴ 5s² 5p⁶ 5d¹⁰ 5f¹` de quem preencheu por camada é riscado
   * sem ler. Ele continua na lista — é erro de verdade —, só perde a vaga para
   * o vizinho de Z, que obriga a contar elétron. A ordenação é estável, então a
   * prioridade dos erros com nome sobrevive dentro de cada grupo.
   */
  const nucleo = caroco(certa)?.[1]
  const combina = (c: Configuracao) => caroco(c)?.[1] === nucleo
  return [...saida.filter(combina), ...saida.filter((c) => !combina(c))]
}
