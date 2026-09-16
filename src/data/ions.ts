/**
 * Cátions e ânions: a tabela de íons que a química do ensino médio cobra.
 *
 * **Por que este dataset existe separado de `nox.ts`.** Treze dos íons daqui já
 * aparecem lá — sulfato, nitrato, permanganato, dicromato... — e a tentação era
 * derivar o baralho de `COMPOSTOS`. Não dá, e por três motivos que não são de
 * gosto:
 *
 * 1. **A seleção é outra.** `COMPOSTOS` só admite íon cujo átomo central tenha
 *    nox interessante de perguntar. Cl⁻, Ca²⁺, OH⁻ e CN⁻ não têm — o nox deles é
 *    a própria carga, e a pergunta seria uma tautologia. Mas são justamente os
 *    que aparecem em toda equação de precipitação, e um jogo de íons sem eles é
 *    um jogo pela metade.
 * 2. **A forma é outra.** Lá o íon carrega `alvo`, `atomos`, `carga` e `nivel`
 *    porque a engine resolve uma equação com isso. Aqui nada disso é usado: o
 *    jogo pergunta o nome, e nome não se calcula.
 * 3. **O campo `nome` lá não é sempre o nome do íon.** `COMPOSTOS` mistura íons
 *    e moléculas neutras, então `nome` é ora "sulfato", ora "ácido sulfúrico".
 *
 * O que **é** reusado, e de verdade, é a informação: `ions.test.ts` cruza este
 * dataset com `COMPOSTOS` e com `ELEMENTOS` e exige que nome e carga batam onde
 * os dois se encontram. Divergir passa a ser um teste vermelho, não uma
 * descoberta de quem jogar daqui a seis meses.
 *
 * **A carga não está escrita na fórmula.** A fórmula exibida é montada por
 * `formulaDoIon()` a partir de `nucleo` + `carga`, pelo mesmo princípio de
 * `nox.ts`: guardar "SO₄²⁻" e `carga: -2` lado a lado é guardar a mesma
 * informação duas vezes, e um dia elas discordam. Aqui o sobrescrito é
 * consequência do número, e um dedo errado no número muda a fórmula na tela —
 * fica visível em vez de silencioso.
 */

const SOBRESCRITO = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const

/**
 * "²⁻", "⁺", "³⁺". O módulo 1 não se escreve, pela mesma convenção do índice 1
 * numa fórmula: é Cl⁻, nunca Cl¹⁻.
 */
export function sufixoCarga(carga: number): string {
  if (carga === 0) throw new Error('carga zero: isso não é um íon')

  const modulo = Math.abs(carga)
  const sinal = carga > 0 ? '⁺' : '⁻'
  if (modulo === 1) return sinal

  const digito = SOBRESCRITO[modulo]
  if (digito === undefined) throw new Error(`carga ${carga} fora da faixa que existe em química`)
  return `${digito}${sinal}`
}

export interface Ion {
  /**
   * A fórmula **sem a carga**: 'Ca', 'SO₄', 'CH₃COO'. Índices em Unicode, como
   * no resto do app — "SO4" com o 4 na linha de base destoaria da carta ao lado.
   */
  readonly nucleo: string
  /** O nome que o jogo cobra, na tradição que a escola ensina hoje. */
  readonly nome: string
  /** Nunca zero. O sinal decide se é cátion ou ânion — ver `tipoDoIon`. */
  readonly carga: number
  /**
   * A outra tradição, quando existe: ferroso para ferro(II), bicarbonato para
   * hidrogenocarbonato. É aceita como resposta **e** aparece no gabarito —
   * quem aprendeu por um dos dois nomes precisa ver o outro, senão o jogo vira
   * uma disputa sobre qual livro o professor adotou.
   */
  readonly outroNome?: string
  /**
   * Variantes de digitação, aceitas em silêncio: 'ferro 2', 'cobre II',
   * 'hidrogenosulfato' com um s só. Não entram no gabarito porque não são nomes,
   * são grafias.
   */
  readonly sinonimos?: readonly string[]
}

export const ehCation = (ion: Ion): boolean => ion.carga > 0

/** 'cátion' ou 'ânion'. Sai do sinal da carga; não é campo. */
export const tipoDoIon = (ion: Ion): string => (ehCation(ion) ? 'cátion' : 'ânion')

export const formulaDoIon = (ion: Ion): string => `${ion.nucleo}${sufixoCarga(ion.carga)}`

/** Monoatômico é o íon cujo núcleo é um símbolo de elemento e nada mais. */
export const ehMonoatomico = (ion: Ion): boolean => /^[A-Z][a-z]?$/.test(ion.nucleo)

/** Todas as formas que valem ponto para um íon. */
export const formasDoIon = (ion: Ion): readonly string[] => [
  ion.nome,
  ...(ion.outroNome === undefined ? [] : [ion.outroNome]),
  ...(ion.sinonimos ?? []),
]

/**
 * Os íons que de fato aparecem, em ordem de família.
 *
 * O corte é o do ensino médio mais o primeiro ano de graduação: o que cai em
 * equação iônica, em solubilidade e em titulação. Fica de fora o que só existe
 * em ementa de inorgânica avançada (Hg₂²⁺, VO₂⁺, os complexos) — não porque seja
 * difícil, mas porque ninguém encontra esses íons antes de precisar deles.
 */
export const IONS: readonly Ion[] = [
  // --- cátions monoatômicos de carga única ----------------------------------
  // Metal alcalino é sempre +1, alcalinoterroso sempre +2: aqui o nome do íon é
  // o nome do elemento, e o teste cobra isso contra `ELEMENTOS`.
  { nucleo: 'Li', nome: 'lítio', carga: 1 },
  { nucleo: 'Na', nome: 'sódio', carga: 1 },
  { nucleo: 'K', nome: 'potássio', carga: 1 },
  { nucleo: 'Ag', nome: 'prata', carga: 1 },
  { nucleo: 'Mg', nome: 'magnésio', carga: 2 },
  { nucleo: 'Ca', nome: 'cálcio', carga: 2 },
  { nucleo: 'Ba', nome: 'bário', carga: 2 },
  { nucleo: 'Zn', nome: 'zinco', carga: 2 },
  { nucleo: 'Al', nome: 'alumínio', carga: 3 },

  // --- cátions de carga variável --------------------------------------------
  // Aqui o número romano *é* a resposta: "ferro" sozinho não diz qual dos dois.
  // As duas tradições valem — Stock (ferro II) e a clássica (ferroso) — e as
  // grafias datilografáveis entram como sinônimo, porque cobrar o parêntese
  // seria cobrar teclado.
  {
    nucleo: 'Fe', nome: 'ferro(II)', carga: 2, outroNome: 'ferroso',
    sinonimos: ['ferro II', 'ferro 2'],
  },
  {
    nucleo: 'Fe', nome: 'ferro(III)', carga: 3, outroNome: 'férrico',
    sinonimos: ['ferro III', 'ferro 3'],
  },
  {
    nucleo: 'Cu', nome: 'cobre(I)', carga: 1, outroNome: 'cuproso',
    sinonimos: ['cobre I', 'cobre 1'],
  },
  {
    nucleo: 'Cu', nome: 'cobre(II)', carga: 2, outroNome: 'cúprico',
    sinonimos: ['cobre II', 'cobre 2'],
  },
  {
    nucleo: 'Pb', nome: 'chumbo(II)', carga: 2, outroNome: 'plumboso',
    sinonimos: ['chumbo II', 'chumbo 2'],
  },

  // --- cátions poliatômicos --------------------------------------------------
  { nucleo: 'NH₄', nome: 'amônio', carga: 1 },
  { nucleo: 'H₃O', nome: 'hidrônio', carga: 1, outroNome: 'hidroxônio', sinonimos: ['oxônio'] },

  // --- ânions monoatômicos ---------------------------------------------------
  // O sufixo é -eto (ou -ido no óxido): é a primeira regra de nomenclatura que
  // se aprende, e ela é o motivo de sulfeto, sulfito e sulfato serem três coisas.
  { nucleo: 'F', nome: 'fluoreto', carga: -1 },
  { nucleo: 'Cl', nome: 'cloreto', carga: -1 },
  { nucleo: 'Br', nome: 'brometo', carga: -1 },
  { nucleo: 'I', nome: 'iodeto', carga: -1 },
  { nucleo: 'H', nome: 'hidreto', carga: -1 },
  { nucleo: 'O', nome: 'óxido', carga: -2 },
  { nucleo: 'S', nome: 'sulfeto', carga: -2 },
  { nucleo: 'N', nome: 'nitreto', carga: -3 },
  { nucleo: 'P', nome: 'fosfeto', carga: -3 },

  // --- ânions poliatômicos sem série ----------------------------------------
  { nucleo: 'OH', nome: 'hidróxido', carga: -1 },
  { nucleo: 'CN', nome: 'cianeto', carga: -1 },
  { nucleo: 'SCN', nome: 'tiocianato', carga: -1 },
  // O peróxido é o mesmo bicho do nível 2 do jogo de nox: dois oxigênios ligados
  // entre si, dividindo −2 — por isso O₂²⁻ e não dois O²⁻.
  { nucleo: 'O₂', nome: 'peróxido', carga: -2 },
  { nucleo: 'CH₃COO', nome: 'acetato', carga: -1, outroNome: 'etanoato' },
  { nucleo: 'C₂O₄', nome: 'oxalato', carga: -2 },

  // --- oxiânions de nitrogênio, enxofre e carbono ----------------------------
  // -ito e -ato: menos oxigênio e mais oxigênio. É a mesma série do jogo de
  // nomenclatura de ácidos vista do outro lado — nitrito vem do nitroso,
  // nitrato do nítrico.
  { nucleo: 'NO₂', nome: 'nitrito', carga: -1 },
  { nucleo: 'NO₃', nome: 'nitrato', carga: -1 },
  { nucleo: 'SO₃', nome: 'sulfito', carga: -2 },
  { nucleo: 'SO₄', nome: 'sulfato', carga: -2 },
  {
    nucleo: 'HSO₄', nome: 'hidrogenossulfato', carga: -1, outroNome: 'bissulfato',
    sinonimos: ['hidrogenosulfato', 'hidrogeno sulfato'],
  },
  { nucleo: 'S₂O₃', nome: 'tiossulfato', carga: -2, sinonimos: ['tiosulfato'] },
  { nucleo: 'CO₃', nome: 'carbonato', carga: -2 },
  {
    nucleo: 'HCO₃', nome: 'hidrogenocarbonato', carga: -1, outroNome: 'bicarbonato',
    sinonimos: ['hidrogeno carbonato'],
  },

  // --- oxiânions de fósforo --------------------------------------------------
  // A série dos fosfatos ácidos existe porque o H₃PO₄ tem três hidrogênios para
  // perder, e cada perda tem nome. Sem os três, o jogador aprende "fosfato" e
  // trava na primeira tabela de tampão.
  { nucleo: 'PO₄', nome: 'fosfato', carga: -3 },
  {
    nucleo: 'HPO₄', nome: 'hidrogenofosfato', carga: -2,
    sinonimos: ['mono-hidrogenofosfato', 'hidrogeno fosfato'],
  },
  {
    nucleo: 'H₂PO₄', nome: 'di-hidrogenofosfato', carga: -1,
    sinonimos: ['dihidrogenofosfato', 'di hidrogeno fosfato'],
  },

  // --- a série completa do cloro ---------------------------------------------
  // Os quatro, e não dois: hipoclorito/clorito/clorato/perclorato é a mesma
  // regra de hipocloroso/cloroso/clórico/perclórico, e meia série não ensina
  // regra nenhuma. Quem sabe contar os oxigênios acerta os quatro de uma vez.
  { nucleo: 'ClO', nome: 'hipoclorito', carga: -1 },
  { nucleo: 'ClO₂', nome: 'clorito', carga: -1 },
  { nucleo: 'ClO₃', nome: 'clorato', carga: -1 },
  { nucleo: 'ClO₄', nome: 'perclorato', carga: -1 },

  // --- oxiânions de metal de transição ---------------------------------------
  { nucleo: 'MnO₄', nome: 'permanganato', carga: -1 },
  { nucleo: 'CrO₄', nome: 'cromato', carga: -2 },
  { nucleo: 'Cr₂O₇', nome: 'dicromato', carga: -2 },
]
