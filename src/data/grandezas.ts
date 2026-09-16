/**
 * Grandezas físicas: o que cada uma vale em unidades de base do SI.
 *
 * **Nada aqui guarda a unidade escrita como texto.** Cada grandeza declara só os
 * expoentes das sete unidades de base — `força` é `{ kg: 1, m: 1, s: -2 }` — e
 * tanto `kg·m·s⁻²` quanto a notação dimensional `MLT⁻²` são *resolvidas* a
 * partir desses números. É a mesma regra do nox, e pelo mesmo motivo: gravar a
 * resposta ao lado do dado cria duas verdades, e a segunda envelhece calada. Com
 * os expoentes, um sinal trocado quebra no teste — que confere grandeza por
 * grandeza contra um gabarito escrito à mão — e não na cara do jogador.
 *
 * **É este arquivo que os dois jogos compartilham**, e é por isso que ele guarda
 * expoentes de unidade de base e não de dimensão. `data/dimensoes.ts` importa
 * daqui e traduz `kg → M`, `m → L`, `s → T`, `A → I`, `K → Θ`, `mol → N`,
 * `cd → J`; o caminho inverso (a dimensão morar aqui e a unidade ser derivada)
 * daria no mesmo, mas a unidade é o dado primário — é ela que o SI define, e a
 * dimensão é a leitura abstrata dela. A alternativa descartada foi ter dois
 * datasets independentes, um por jogo: duplicaria a tabela inteira e deixaria
 * `capacitância = kg⁻¹·m⁻²·s⁴·A²` num arquivo e `M⁻¹L⁻²T⁴I²` no outro, livres
 * para discordar. Do jeito que está, discordar é impossível — e o teste de
 * `dimensoes.ts` verifica exatamente isso, fator por fator.
 *
 * O campo `unidade` é opcional de propósito: o SI dá nome próprio a 22 unidades
 * derivadas, e velocidade, torque e densidade não estão entre elas. Destas 22
 * entram 19 — ficam de fora o radiano e o esterradiano, adimensionais, e o grau
 * Celsius, que é o kelvin com outro zero e pediria um `°` no teclado. Com as
 * sete de base, o baralho de unidades fecha em 26. O jogo de unidades filtra
 * por `temUnidade()`; o de análise
 * dimensional usa a tabela inteira, porque perguntar a dimensão de `m·s⁻¹` faz
 * todo sentido e perguntar "qual é a unidade da velocidade" só produziria briga
 * de formato.
 *
 * Grandeza adimensional (ângulo plano, deformação, índice de refração) ficou de
 * fora, e conscientemente: num jogo que escolhe a notação entre quatro, um "1"
 * sozinho no meio de três cadeias de expoentes se destaca antes de a pessoa ler
 * a pergunta, e a carta passaria a medir formato em vez de física. `expoentes()`
 * quebra se alguém cadastrar uma.
 */

/**
 * As sete unidades de base, na ordem em que o SI as escreve.
 *
 * A ordem não é decorativa: `emUnidadesBase()` e a notação dimensional saem daí,
 * então é ela que faz sair `s·A` para o coulomb e `kg·m²·s⁻³·A⁻¹` para o volt —
 * exatamente como está na brochura do SI.
 */
export const BASES_SI = ['kg', 'm', 's', 'A', 'K', 'mol', 'cd'] as const
export type BaseSI = (typeof BASES_SI)[number]

/**
 * Só os expoentes não nulos.
 *
 * Ausente é zero. Zero escrito à mão é dado errado e `expoentes()` quebra: a
 * diferença entre "não depende de corrente" e "depende com expoente zero" não
 * existe em física, e permitir as duas grafias faria dois cadastros iguais
 * renderizarem diferente.
 */
export type Expoentes = Readonly<Partial<Record<BaseSI, number>>>

export interface UnidadeSI {
  readonly nome: string
  /** Como se escreve: "Pa", "Wb", "kat". A caixa é a informação. */
  readonly simbolo: string
  /** Outras grafias aceitas na resposta. Só onde o teclado obriga — ver o ohm. */
  readonly simbolosAceitos?: readonly string[]
  /**
   * O nome é de gente?
   *
   * Existe para virar guarda: no SI, símbolo de unidade batizada com nome de
   * pessoa começa com maiúscula (N, Pa, Hz, Wb, Bq) e o resto é minúsculo (m,
   * s, mol, cd, lm, lx, kat). O teste exige que os dois campos concordem, então
   * um "pa" ou um "Lx" cadastrado errado não chega ao jogador.
   */
  readonly deNomeProprio: boolean
}

export interface Grandeza {
  /** kebab-case sem acento. Vira id de carta nos dois jogos. */
  readonly id: string
  readonly nome: string
  readonly base: Expoentes
  /** Só quando o SI deu nome próprio à unidade. Ver o comentário do topo. */
  readonly unidade?: UnidadeSI
  /**
   * A relação que justifica os expoentes: "F = m·a", "p = F/A".
   *
   * Obrigatória, e é o que separa este dataset de uma tabela copiada. Ela aparece
   * no gabarito dos dois jogos — quem errou precisa ver de onde vêm os expoentes,
   * senão decora a cadeia e erra de novo na próxima grandeza parecida.
   */
  readonly definicao: string
}

export type GrandezaComUnidade = Grandeza & { readonly unidade: UnidadeSI }

/** Narrowing de verdade, para o jogo de unidades filtrar sem casts. */
export function temUnidade(g: Grandeza): g is GrandezaComUnidade {
  return g.unidade !== undefined
}

const SUPERESCRITOS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const

/**
 * "−2" → "⁻²". O expoente 1 vira string vazia, porque ninguém escreve `m¹`.
 *
 * Mora aqui, e não num utilitário do núcleo, porque `dimensoes.ts` é o único
 * outro arquivo que precisa dele e importa daqui. (`games/flashcards.ts` tem uma
 * cópia privada da mesma ideia; unificar as duas é refatoração de arquivo que
 * não é meu.)
 */
export function sobrescrito(n: number): string {
  if (n === 1) return ''
  const corpo = [...Math.abs(n).toString()].map((d) => SUPERESCRITOS[Number(d)] ?? '').join('')
  return n < 0 ? `⁻${corpo}` : corpo
}

/**
 * Os expoentes não nulos, na ordem do SI, com o dado conferido na saída.
 *
 * Quebra em vez de devolver algo plausível — mesma postura de `nox()`. Um
 * expoente fracionário ou um zero escrito à mão são erro de cadastro, e uma
 * unidade errada renderizada bonitinha é pior do que um teste vermelho.
 */
export function expoentes(g: Grandeza): readonly (readonly [BaseSI, number])[] {
  const saida: (readonly [BaseSI, number])[] = []

  for (const base of BASES_SI) {
    const e = g.base[base]
    if (e === undefined) continue
    if (!Number.isInteger(e)) {
      throw new Error(`${g.id}: expoente de ${base} não é inteiro (${e})`)
    }
    if (e === 0) {
      throw new Error(`${g.id}: expoente 0 de ${base} escrito à mão — ausente já é zero`)
    }
    saida.push([base, e])
  }

  if (saida.length === 0) {
    throw new Error(`${g.id}: sem nenhuma base — grandeza adimensional não entra aqui`)
  }
  return saida
}

/** "kg·m·s⁻²", "s·A", "kg⁻¹·m⁻²·s⁴·A²". */
export function emUnidadesBase(g: Grandeza): string {
  return expoentes(g)
    .map(([base, e]) => `${base}${sobrescrito(e)}`)
    .join('·')
}

/**
 * O gabarito completo de uma unidade com nome: "pascal (Pa) = kg·m⁻¹·s⁻²".
 *
 * Os três pedaços juntos porque separados não ensinam: quem errou "Pa" precisa
 * ver que o nome é pascal *e* que ele é newton por metro quadrado.
 */
export function gabaritoDaUnidade(g: GrandezaComUnidade): string {
  return `${g.unidade.nome} (${g.unidade.simbolo}) = ${emUnidadesBase(g)}`
}

/**
 * A tabela.
 *
 * Ordem: as sete de base, depois as derivadas com nome próprio (mecânicas,
 * elétricas, luminosas, de radiação), depois as que não têm nome nenhum. Dentro
 * de cada bloco, a ordem é a de quem aprende — força antes de pressão, carga
 * antes de tensão.
 */
export const GRANDEZAS: readonly Grandeza[] = [
  // --- as sete de base --------------------------------------------------------
  // Entram no baralho de unidades de propósito. "Unidade de massa" parece pergunta
  // boba até alguém responder "g": o quilograma é a única unidade de base com
  // prefixo embutido no nome, e é o erro mais comum de toda a tabela.
  {
    id: 'massa',
    nome: 'massa',
    base: { kg: 1 },
    unidade: { nome: 'quilograma', simbolo: 'kg', deNomeProprio: false },
    definicao: 'unidade de base — e a única cujo nome já traz um prefixo',
  },
  {
    id: 'comprimento',
    nome: 'comprimento',
    base: { m: 1 },
    unidade: { nome: 'metro', simbolo: 'm', deNomeProprio: false },
    definicao: 'unidade de base, fixada por c = 299 792 458 m/s',
  },
  {
    id: 'tempo',
    nome: 'tempo',
    base: { s: 1 },
    unidade: { nome: 'segundo', simbolo: 's', deNomeProprio: false },
    definicao: 'unidade de base, fixada pela transição do césio-133',
  },
  {
    id: 'corrente-eletrica',
    nome: 'corrente elétrica',
    base: { A: 1 },
    unidade: { nome: 'ampere', simbolo: 'A', deNomeProprio: true },
    definicao: 'i = ΔQ/Δt — unidade de base, fixada pela carga elementar',
  },
  {
    id: 'temperatura',
    nome: 'temperatura termodinâmica',
    base: { K: 1 },
    unidade: { nome: 'kelvin', simbolo: 'K', deNomeProprio: true },
    definicao: 'unidade de base, fixada pela constante de Boltzmann',
  },
  {
    id: 'quantidade-de-materia',
    nome: 'quantidade de matéria',
    base: { mol: 1 },
    unidade: { nome: 'mol', simbolo: 'mol', deNomeProprio: false },
    definicao: 'unidade de base: 6,022 140 76×10²³ entidades',
  },
  {
    id: 'intensidade-luminosa',
    nome: 'intensidade luminosa',
    base: { cd: 1 },
    unidade: { nome: 'candela', simbolo: 'cd', deNomeProprio: false },
    definicao: 'unidade de base, fixada pela eficácia luminosa a 540 THz',
  },

  // --- derivadas com nome próprio: mecânicas ---------------------------------
  {
    id: 'frequencia',
    nome: 'frequência',
    base: { s: -1 },
    unidade: { nome: 'hertz', simbolo: 'Hz', deNomeProprio: true },
    definicao: 'f = 1/T',
  },
  {
    id: 'forca',
    nome: 'força',
    base: { kg: 1, m: 1, s: -2 },
    unidade: { nome: 'newton', simbolo: 'N', deNomeProprio: true },
    definicao: 'F = m·a',
  },
  {
    id: 'pressao',
    nome: 'pressão',
    base: { kg: 1, m: -1, s: -2 },
    unidade: { nome: 'pascal', simbolo: 'Pa', deNomeProprio: true },
    definicao: 'p = F/A',
  },
  {
    id: 'energia',
    nome: 'energia',
    base: { kg: 1, m: 2, s: -2 },
    unidade: { nome: 'joule', simbolo: 'J', deNomeProprio: true },
    definicao: 'E = F·d — a mesma unidade de trabalho e de calor',
  },
  {
    id: 'potencia',
    nome: 'potência',
    base: { kg: 1, m: 2, s: -3 },
    unidade: { nome: 'watt', simbolo: 'W', deNomeProprio: true },
    definicao: 'P = E/Δt',
  },

  // --- derivadas com nome próprio: elétricas e magnéticas ---------------------
  {
    id: 'carga-eletrica',
    nome: 'carga elétrica',
    base: { s: 1, A: 1 },
    unidade: { nome: 'coulomb', simbolo: 'C', deNomeProprio: true },
    definicao: 'Q = i·Δt — repare: é ampere-segundo, não o contrário',
  },
  {
    id: 'tensao-eletrica',
    nome: 'tensão elétrica (ddp)',
    base: { kg: 1, m: 2, s: -3, A: -1 },
    unidade: { nome: 'volt', simbolo: 'V', deNomeProprio: true },
    definicao: 'U = P/i = E/Q',
  },
  {
    id: 'resistencia-eletrica',
    nome: 'resistência elétrica',
    base: { kg: 1, m: 2, s: -3, A: -2 },
    unidade: {
      nome: 'ohm',
      // U+03A9, o ômega grego: é o que o SI manda usar.
      simbolo: '\u03A9',
      // A única concessão de teclado do baralho, e ela é obrigatória: nenhum
      // teclado de celular tem ômega. Aceita-se o nome escrito por extenso nas
      // duas caixas, e também o U+2126 (OHM SIGN), que renderiza idêntico ao
      // ômega e compara diferente — a mesma armadilha invisível do micro sign
      // nos prefixos SI, e a razão de o canônico ser o grego. Os dois vão
      // escapados justamente porque a diferença é invisível em revisão de
      // código: colados como glifo, ninguém garante qual foi parar no arquivo.
      simbolosAceitos: ['\u2126', 'ohm', 'Ohm'],
      deNomeProprio: true,
    },
    definicao: 'R = U/i',
  },
  {
    id: 'capacitancia',
    nome: 'capacitância',
    base: { kg: -1, m: -2, s: 4, A: 2 },
    unidade: { nome: 'farad', simbolo: 'F', deNomeProprio: true },
    definicao: 'C = Q/U',
  },
  {
    id: 'condutancia-eletrica',
    nome: 'condutância elétrica',
    base: { kg: -1, m: -2, s: 3, A: 2 },
    // S maiúsculo é siemens, s minúsculo é segundo. Não há dataset melhor do que
    // este par para justificar `tipo: 'simbolo'` na resposta.
    unidade: { nome: 'siemens', simbolo: 'S', deNomeProprio: true },
    definicao: 'G = 1/R',
  },
  {
    id: 'fluxo-magnetico',
    nome: 'fluxo magnético',
    base: { kg: 1, m: 2, s: -2, A: -1 },
    unidade: { nome: 'weber', simbolo: 'Wb', deNomeProprio: true },
    definicao: 'Φ = B·A; ε = −ΔΦ/Δt',
  },
  {
    id: 'inducao-magnetica',
    nome: 'densidade de fluxo magnético (campo B)',
    base: { kg: 1, s: -2, A: -1 },
    unidade: { nome: 'tesla', simbolo: 'T', deNomeProprio: true },
    definicao: 'B = Φ/A = F/(q·v)',
  },
  {
    id: 'indutancia',
    nome: 'indutância',
    base: { kg: 1, m: 2, s: -2, A: -2 },
    unidade: { nome: 'henry', simbolo: 'H', deNomeProprio: true },
    definicao: 'L = Φ/i',
  },

  // --- derivadas com nome próprio: luz e radiação -----------------------------
  {
    id: 'fluxo-luminoso',
    nome: 'fluxo luminoso',
    base: { cd: 1 },
    unidade: { nome: 'lúmen', simbolo: 'lm', deNomeProprio: false },
    // lm = cd·sr, e o esterradiano é adimensional: por isso o lúmen tem os mesmos
    // expoentes da candela e unidade diferente. É o caso que mostra que unidade e
    // dimensão não são a mesma coisa — e ele existe de propósito nos dois jogos.
    definicao: 'Φᵥ = Iᵥ·Ω, com o esterradiano adimensional',
  },
  {
    id: 'iluminancia',
    nome: 'iluminância',
    base: { m: -2, cd: 1 },
    unidade: { nome: 'lux', simbolo: 'lx', deNomeProprio: false },
    definicao: 'E = Φᵥ/A',
  },
  {
    id: 'atividade-radioativa',
    nome: 'atividade radioativa',
    base: { s: -1 },
    unidade: { nome: 'becquerel', simbolo: 'Bq', deNomeProprio: true },
    // Mesmos expoentes do hertz, e unidade separada porque uma coisa é ciclo por
    // segundo e outra é desintegração por segundo. O SI manteve as duas de
    // propósito, justamente para não se confundir num laudo.
    definicao: 'A = |dN/dt| — uma desintegração por segundo',
  },
  {
    id: 'dose-absorvida',
    nome: 'dose de radiação absorvida',
    base: { m: 2, s: -2 },
    unidade: { nome: 'gray', simbolo: 'Gy', deNomeProprio: true },
    definicao: 'D = E/m — joule por quilograma',
  },
  {
    id: 'dose-equivalente',
    nome: 'dose equivalente de radiação',
    base: { m: 2, s: -2 },
    unidade: { nome: 'sievert', simbolo: 'Sv', deNomeProprio: true },
    definicao: 'H = D·w_R — mesma dimensão do gray, peso biológico à parte',
  },
  {
    id: 'atividade-catalitica',
    nome: 'atividade catalítica',
    base: { s: -1, mol: 1 },
    unidade: { nome: 'katal', simbolo: 'kat', deNomeProprio: false },
    definicao: 'a = dn/dt — um mol de reagente por segundo',
  },

  // --- sem unidade com nome próprio: só entram na análise dimensional ---------
  {
    id: 'velocidade',
    nome: 'velocidade',
    base: { m: 1, s: -1 },
    definicao: 'v = Δs/Δt',
  },
  {
    id: 'aceleracao',
    nome: 'aceleração',
    base: { m: 1, s: -2 },
    definicao: 'a = Δv/Δt',
  },
  {
    id: 'quantidade-de-movimento',
    nome: 'quantidade de movimento',
    base: { kg: 1, m: 1, s: -1 },
    definicao: 'p = m·v',
  },
  {
    id: 'impulso',
    nome: 'impulso',
    base: { kg: 1, m: 1, s: -1 },
    definicao: 'I = F·Δt — e o teorema diz que isso é ΔP, daí a mesma dimensão',
  },
  {
    id: 'torque',
    nome: 'torque (momento de uma força)',
    base: { kg: 1, m: 2, s: -2 },
    definicao: 'M = F·d — dimensão de energia, e não é energia: N·m não é joule',
  },
  {
    id: 'momento-de-inercia',
    nome: 'momento de inércia',
    base: { kg: 1, m: 2 },
    definicao: 'I = Σ m·r²',
  },
  {
    id: 'densidade',
    nome: 'densidade (massa específica)',
    base: { kg: 1, m: -3 },
    definicao: 'ρ = m/V',
  },
  {
    id: 'vazao',
    nome: 'vazão volumétrica',
    base: { m: 3, s: -1 },
    definicao: 'Q = V/Δt = A·v',
  },
  {
    id: 'viscosidade',
    nome: 'viscosidade dinâmica',
    base: { kg: 1, m: -1, s: -1 },
    definicao: 'τ = η·(dv/dy) — pascal-segundo',
  },
  {
    id: 'tensao-superficial',
    nome: 'tensão superficial',
    base: { kg: 1, s: -2 },
    definicao: 'γ = F/L — newton por metro',
  },
  {
    id: 'constante-elastica',
    nome: 'constante elástica de uma mola',
    base: { kg: 1, s: -2 },
    definicao: 'F = k·x — também newton por metro',
  },
  {
    id: 'campo-eletrico',
    nome: 'campo elétrico',
    base: { kg: 1, m: 1, s: -3, A: -1 },
    definicao: 'E = F/q — volt por metro',
  },
  {
    id: 'entropia',
    nome: 'entropia (e capacidade térmica)',
    base: { kg: 1, m: 2, s: -2, K: -1 },
    definicao: 'ΔS = Q/T — joule por kelvin',
  },
  {
    id: 'calor-especifico',
    nome: 'calor específico',
    base: { m: 2, s: -2, K: -1 },
    definicao: 'Q = m·c·ΔT',
  },
  {
    id: 'constante-dos-gases',
    nome: 'constante universal dos gases (R)',
    base: { kg: 1, m: 2, s: -2, K: -1, mol: -1 },
    definicao: 'p·V = n·R·T',
  },
  {
    id: 'constante-de-planck',
    nome: 'constante de Planck (h)',
    base: { kg: 1, m: 2, s: -1 },
    definicao: 'E = h·f — dimensão de energia × tempo, que é a de momento angular',
  },
  {
    id: 'constante-gravitacional',
    nome: 'constante da gravitação universal (G)',
    base: { kg: -1, m: 3, s: -2 },
    definicao: 'F = G·m₁·m₂/d²',
  },
]

/** As que têm unidade com nome próprio — o baralho do jogo de unidades. */
export const GRANDEZAS_COM_UNIDADE: readonly GrandezaComUnidade[] = GRANDEZAS.filter(temUnidade)
