/**
 * Gera `src/data/formulas.ts`, pré-renderizando cada fórmula para MathML.
 *
 * Por que pré-renderizar: o KaTeX custa ~270 KB de JS mais as fontes, e aqui ele
 * só precisa rodar uma vez, no build. O MathML sai com ~300 bytes por fórmula e
 * é renderizado nativamente pelo navegador — o runtime não carrega nada.
 *
 * O campo `confundeCom` é o que dá valor ao modo de múltipla escolha: são as
 * confusões que realmente acontecem (Gauss elétrica × magnética, E=hf × λ=h/p),
 * curadas à mão. Distrator sorteado ao acaso é eliminado por eliminação visual e
 * o exercício deixa de medir conhecimento.
 *
 * Uso: node scripts/gen-formulas.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'

/**
 * id, nome pt-BR, sinônimos, LaTeX, domínio, tags de silhueta, ids que se
 * confundem com esta, e formas equivalentes da MESMA lei (nunca viram distrator).
 */
const FORMULAS = [
  // --- mecânica ---
  ['newton-2', 'Segunda lei de Newton', ['princípio fundamental da dinâmica', 'lei fundamental da dinâmica'],
    '\\vec{F} = m\\vec{a}', 'mecanica', ['vetorial'], ['momento-linear', 'impulso'], ['\\vec{F} = \\frac{d\\vec{p}}{dt}']],
  ['gravitacao', 'Lei da gravitação universal', ['gravitação universal', 'lei de newton da gravitação'],
    'F = G\\frac{m_1 m_2}{r^2}', 'mecanica', ['fracao'], ['coulomb'], []],
  ['energia-cinetica', 'Energia cinética', ['energia cinetica'],
    'K = \\tfrac{1}{2}mv^2', 'mecanica', ['fracao', 'expoente'], ['momento-linear', 'energia-potencial'], []],
  ['energia-potencial', 'Energia potencial gravitacional', ['energia potencial'],
    'U = mgh', 'mecanica', [], ['energia-cinetica'], []],
  ['momento-linear', 'Quantidade de movimento', ['momento linear', 'quantidade de movimento'],
    '\\vec{p} = m\\vec{v}', 'mecanica', ['vetorial'], ['newton-2', 'energia-cinetica'], []],
  ['trabalho', 'Trabalho de uma força', ['trabalho'],
    'W = Fd\\cos\\theta', 'mecanica', ['constante-grega'], ['potencia'], []],
  ['potencia', 'Potência mecânica', ['potência'],
    'P = \\frac{W}{\\Delta t}', 'mecanica', ['fracao'], ['trabalho', 'potencia-eletrica'], []],
  ['torque', 'Torque', ['momento de uma força', 'torque'],
    '\\vec{\\tau} = \\vec{r} \\times \\vec{F}', 'mecanica', ['vetorial', 'constante-grega'], ['momento-angular'], []],
  ['hooke', 'Lei de Hooke', ['lei de hooke'],
    'F = -kx', 'mecanica', [], ['newton-2'], []],
  ['pendulo', 'Período do pêndulo simples', ['pêndulo simples', 'período do pêndulo'],
    'T = 2\\pi\\sqrt{\\frac{L}{g}}', 'mecanica', ['raiz', 'fracao', 'constante-grega'], ['massa-mola'], []],
  ['massa-mola', 'Período do sistema massa-mola', ['massa mola'],
    'T = 2\\pi\\sqrt{\\frac{m}{k}}', 'mecanica', ['raiz', 'fracao', 'constante-grega'], ['pendulo'], []],
  ['centripeta', 'Força centrípeta', ['força centrípeta'],
    'F_c = \\frac{mv^2}{r}', 'mecanica', ['fracao', 'expoente'], ['energia-cinetica'], []],
  ['torricelli', 'Equação de Torricelli', ['torricelli'],
    'v^2 = v_0^2 + 2a\\Delta s', 'mecanica', ['expoente'], ['bernoulli'], []],
  ['impulso', 'Impulso', ['teorema do impulso'],
    '\\vec{J} = \\vec{F}\\Delta t', 'mecanica', ['vetorial'], ['newton-2', 'momento-linear'], []],
  ['momento-angular', 'Momento angular', ['momento angular'],
    '\\vec{L} = I\\vec{\\omega}', 'mecanica', ['vetorial', 'constante-grega'], ['torque'], []],

  // --- fluidos e termodinâmica ---
  ['arquimedes', 'Empuxo', ['princípio de arquimedes', 'empuxo'],
    'E = \\rho_f V_d g', 'termodinamica', ['constante-grega'], ['bernoulli', 'pressao-hidrostatica'], []],
  ['pressao-hidrostatica', 'Pressão hidrostática', ['lei de stevin', 'stevin'],
    'p = p_0 + \\rho g h', 'termodinamica', ['constante-grega'], ['arquimedes'], []],
  ['bernoulli', 'Equação de Bernoulli', ['bernoulli'],
    'p + \\tfrac{1}{2}\\rho v^2 + \\rho g h = \\text{const}', 'termodinamica', ['fracao', 'expoente', 'constante-grega'], ['torricelli', 'arquimedes'], []],
  ['gas-ideal', 'Equação dos gases ideais', ['gás ideal', 'clapeyron', 'equação de clapeyron'],
    'PV = nRT', 'termodinamica', [], ['primeira-lei-termo'], []],
  ['primeira-lei-termo', 'Primeira lei da termodinâmica', ['1ª lei da termodinâmica', 'primeira lei'],
    '\\Delta U = Q - W', 'termodinamica', [], ['gas-ideal', 'carnot'], []],
  ['boltzmann-entropia', 'Entropia de Boltzmann', ['entropia de boltzmann'],
    'S = k_B \\ln W', 'termodinamica', [], ['primeira-lei-termo'], []],
  ['stefan-boltzmann', 'Lei de Stefan-Boltzmann', ['stefan boltzmann'],
    'P = \\sigma A T^4', 'termodinamica', ['expoente', 'constante-grega'], ['planck-einstein'], []],
  ['calorimetria', 'Equação fundamental da calorimetria', ['calor sensível', 'calorimetria'],
    'Q = mc\\Delta T', 'termodinamica', [], ['primeira-lei-termo'], []],
  ['carnot', 'Rendimento de Carnot', ['ciclo de carnot', 'rendimento de carnot'],
    '\\eta = 1 - \\frac{T_f}{T_q}', 'termodinamica', ['fracao', 'constante-grega'], ['primeira-lei-termo'], []],

  // --- eletromagnetismo ---
  ['coulomb', 'Lei de Coulomb', ['lei de coulomb'],
    'F = k_e\\frac{q_1 q_2}{r^2}', 'eletromagnetismo', ['fracao'], ['gravitacao'], []],
  ['ohm', 'Primeira lei de Ohm', ['lei de ohm'],
    'V = RI', 'eletromagnetismo', [], ['potencia-eletrica'], []],
  ['potencia-eletrica', 'Potência elétrica', ['potência elétrica'],
    'P = VI', 'eletromagnetismo', [], ['ohm', 'potencia'], []],
  ['gauss-eletrica', 'Lei de Gauss para o campo elétrico', ['lei de gauss elétrica', 'gauss elétrica'],
    '\\oint \\vec{E}\\cdot d\\vec{A} = \\frac{Q_{int}}{\\varepsilon_0}', 'eletromagnetismo', ['integral', 'vetorial', 'fracao', 'produto-escalar'], ['gauss-magnetica', 'ampere-maxwell'], []],
  ['gauss-magnetica', 'Lei de Gauss para o campo magnético', ['gauss magnética', 'inexistência de monopolos'],
    '\\oint \\vec{B}\\cdot d\\vec{A} = 0', 'eletromagnetismo', ['integral', 'vetorial', 'produto-escalar'], ['gauss-eletrica', 'ampere-maxwell'], []],
  ['faraday', 'Lei de Faraday-Lenz', ['lei de faraday', 'indução eletromagnética', 'lenz'],
    '\\varepsilon = -\\frac{d\\Phi_B}{dt}', 'eletromagnetismo', ['derivada', 'fracao', 'constante-grega'], ['ampere-maxwell', 'gauss-eletrica'], []],
  ['ampere-maxwell', 'Lei de Ampère-Maxwell', ['lei de ampère', 'ampere maxwell'],
    '\\oint \\vec{B}\\cdot d\\vec{\\ell} = \\mu_0 I + \\mu_0\\varepsilon_0\\frac{d\\Phi_E}{dt}', 'eletromagnetismo', ['integral', 'vetorial', 'fracao', 'derivada', 'constante-grega'], ['faraday', 'gauss-magnetica'], []],
  ['lorentz', 'Força de Lorentz', ['força de lorentz'],
    '\\vec{F} = q(\\vec{E} + \\vec{v}\\times\\vec{B})', 'eletromagnetismo', ['vetorial'], ['coulomb', 'newton-2'], []],
  ['velocidade-luz', 'Velocidade da luz no vácuo', ['velocidade da luz'],
    'c = \\frac{1}{\\sqrt{\\varepsilon_0\\mu_0}}', 'eletromagnetismo', ['fracao', 'raiz', 'constante-grega'], ['ondulatoria'], []],
  ['capacitancia', 'Capacitância', ['capacitância'],
    'C = \\frac{Q}{V}', 'eletromagnetismo', ['fracao'], ['ohm'], []],

  // --- ondas e física moderna ---
  ['ondulatoria', 'Equação fundamental da ondulatória', ['equação da onda', 'ondulatória'],
    'v = \\lambda f', 'ondas', ['constante-grega'], ['planck-einstein', 'de-broglie'], []],
  ['massa-energia', 'Equivalência massa-energia', ['e = mc²', 'einstein', 'massa energia'],
    'E = mc^2', 'relatividade', ['expoente'], ['energia-relativistica', 'planck-einstein'], []],
  ['planck-einstein', 'Relação de Planck-Einstein', ['energia do fóton', 'planck einstein'],
    'E = hf', 'quantica', [], ['de-broglie', 'fotoeletrico'], []],
  ['de-broglie', 'Comprimento de onda de De Broglie', ['de broglie'],
    '\\lambda = \\frac{h}{p}', 'quantica', ['fracao', 'constante-grega'], ['planck-einstein', 'heisenberg'], []],
  ['heisenberg', 'Princípio da incerteza de Heisenberg', ['incerteza', 'heisenberg'],
    '\\Delta x \\, \\Delta p \\geq \\frac{\\hbar}{2}', 'quantica', ['fracao'], ['de-broglie', 'schrodinger'], []],
  ['schrodinger', 'Equação de Schrödinger', ['schrodinger', 'schroedinger'],
    'i\\hbar\\frac{\\partial \\Psi}{\\partial t} = \\hat{H}\\Psi', 'quantica', ['derivada', 'fracao', 'constante-grega'], ['heisenberg', 'de-broglie'], []],
  ['lorentz-fator', 'Fator de Lorentz', ['fator de lorentz', 'gama de lorentz'],
    '\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}', 'relatividade', ['fracao', 'raiz', 'constante-grega'], ['energia-relativistica'], []],
  ['energia-relativistica', 'Energia relativística total', ['energia relativística'],
    'E^2 = (pc)^2 + (mc^2)^2', 'relatividade', ['expoente'], ['massa-energia', 'lorentz-fator'], []],
  ['fotoeletrico', 'Efeito fotoelétrico', ['equação do efeito fotoelétrico', 'fotoelétrico'],
    'K_{max} = hf - \\phi', 'quantica', ['constante-grega'], ['planck-einstein'], []],

  // --- matemática ---
  ['euler-identidade', 'Identidade de Euler', ['identidade de euler'],
    'e^{i\\pi} + 1 = 0', 'algebra', ['expoente', 'constante-grega'], ['euler-poliedros'], []],
  ['pitagoras', 'Teorema de Pitágoras', ['pitágoras'],
    'a^2 = b^2 + c^2', 'geometria', ['expoente'], ['lei-cossenos'], []],
  ['bhaskara', 'Fórmula de Bhaskara', ['bháskara', 'baskara', 'fórmula quadrática', 'fórmula resolvente'],
    'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', 'algebra', ['fracao', 'raiz', 'expoente'], ['pitagoras'], []],
  ['relacao-trigonometrica', 'Relação fundamental da trigonometria', ['relação fundamental'],
    '\\sin^2\\theta + \\cos^2\\theta = 1', 'geometria', ['expoente', 'constante-grega'], ['lei-cossenos'], []],
  ['lei-cossenos', 'Lei dos cossenos', ['lei dos cossenos'],
    'a^2 = b^2 + c^2 - 2bc\\cos\\hat{A}', 'geometria', ['expoente'], ['pitagoras', 'relacao-trigonometrica'], []],
  ['euler-poliedros', 'Relação de Euler para poliedros', ['relação de euler', 'euler poliedros'],
    'V - A + F = 2', 'geometria', [], ['euler-identidade'], []],
  ['tfc', 'Teorema fundamental do cálculo', ['teorema fundamental do cálculo'],
    '\\int_a^b f\'(x)\\,dx = f(b) - f(a)', 'calculo', ['integral'], ['integral-gaussiana'], []],
  ['integral-gaussiana', 'Integral de Gauss', ['integral gaussiana'],
    '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}', 'calculo', ['integral', 'raiz', 'expoente', 'constante-grega'], ['tfc'], []],
  ['soma-pa', 'Soma dos termos de uma PA', ['soma da pa', 'progressão aritmética'],
    'S_n = \\frac{n(a_1 + a_n)}{2}', 'algebra', ['fracao'], ['serie-geometrica'], []],
  ['serie-geometrica', 'Soma da série geométrica infinita', ['série geométrica', 'soma da pg infinita'],
    '\\sum_{n=0}^{\\infty} ar^n = \\frac{a}{1-r}', 'algebra', ['somatorio', 'fracao', 'expoente'], ['soma-pa'], []],
  ['bayes', 'Teorema de Bayes', ['bayes'],
    'P(A|B) = \\frac{P(B|A)P(A)}{P(B)}', 'algebra', ['fracao'], ['serie-geometrica'], []],
]

/** Renderiza para MathML e joga fora o wrapper do KaTeX — só o <math> importa. */
function paraMathML(latex) {
  const html = katex.renderToString(latex, { output: 'mathml', throwOnError: false })
  const casa = html.match(/<math[\s\S]*<\/math>/)
  if (!casa) throw new Error(`não consegui extrair o MathML de: ${latex}`)
  return casa[0]
}

const linhas = FORMULAS.map(
  ([id, nome, sinonimos, latex, dominio, tags, confundeCom, equivalentes]) => {
    const lista = (xs) => xs.map((x) => `'${x.replace(/'/g, "\\'")}'`).join(', ')
    return `  {
    id: '${id}',
    nome: '${nome.replace(/'/g, "\\'")}',
    sinonimos: [${lista(sinonimos)}],
    latex: '${latex.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',
    mathml: '${paraMathML(latex).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',
    dominio: '${dominio}',
    tags: [${lista(tags)}],
    confundeCom: [${lista(confundeCom)}],
    equivalentes: [${lista(equivalentes.map((e) => paraMathML(e)))}],
  },`
  },
)

const conteudo = `// GERADO POR scripts/gen-formulas.mjs — não edite à mão.
//
// O MathML já vem renderizado: o KaTeX roda no build e some do bundle de
// runtime, que economiza ~270 KB de JS mais as fontes. O LaTeX fica aqui como
// fonte editável — mexa nele no script, não neste arquivo.

export type Dominio =
  | 'mecanica'
  | 'eletromagnetismo'
  | 'termodinamica'
  | 'quantica'
  | 'relatividade'
  | 'ondas'
  | 'calculo'
  | 'algebra'
  | 'geometria'

export interface Formula {
  readonly id: string
  readonly nome: string
  readonly sinonimos: readonly string[]
  readonly latex: string
  /** Pré-renderizado no build. Conteúdo estático — nunca vem do jogador. */
  readonly mathml: string
  readonly dominio: Dominio
  /** Silhueta visual: tem integral, tem fração, tem letra grega. */
  readonly tags: readonly string[]
  /** Confusões que acontecem de verdade — a melhor fonte de distrator. */
  readonly confundeCom: readonly string[]
  /** Outras formas da MESMA lei. Nunca podem virar distrator dela. */
  readonly equivalentes: readonly string[]
}

export const FORMULAS: readonly Formula[] = [
${linhas.join('\n')}
]
`

const destino = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'formulas.ts')
writeFileSync(destino, conteudo)

const bytes = FORMULAS.reduce((s, f) => s + paraMathML(f[3]).length, 0)
console.log(`${FORMULAS.length} fórmulas · ${(bytes / 1024).toFixed(1)} KB de MathML`)
