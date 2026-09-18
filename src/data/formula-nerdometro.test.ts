import { describe, expect, it } from 'vitest'
import {
  BONUS_DE_LIMPEZA,
  CURVA,
  DIAS_ATE_O_PISO,
  DIAS_DE_GRACA,
  PARTIDAS_NA_JANELA,
  PARTIDAS_PARA_ENTRAR,
  PISO_DA_FERRUGEM,
  TETO_DO_JOGO,
} from '@/core/nerdometro'
import {
  BONUS_NA_FORMULA,
  CURVA_NA_FORMULA,
  FORMULA_CONJUNTO,
  FORMULA_FERRUGEM,
  FORMULA_FRACAO,
  FORMULA_NOTA,
  GRACA_NA_FORMULA,
  JANELA_NA_FORMULA,
  LEGENDA,
  PARTIDAS_NA_FORMULA,
  PISO_NA_FORMULA,
  PRAZO_NA_FORMULA,
  TETO_NA_FORMULA,
} from './formula-nerdometro'

/**
 * A página que explica o Nerdômetro não pode mentir sobre o Nerdômetro.
 *
 * O MathML é pré-renderizado no build a partir de `CURVA`, exatamente como as
 * fórmulas de física são pré-renderizadas do LaTeX — nenhum KaTeX em runtime.
 * O risco disso é o arquivo gerado envelhecer em silêncio: alguém muda o
 * expoente no código, esquece de rodar `scripts/gen-formula-nerdometro.mjs`, e
 * a tela passa a exibir com toda a autoridade uma conta que o programa não faz.
 */
describe('a fórmula exibida', () => {
  it('foi gerada com a CURVA que o código usa hoje', () => {
    expect(
      CURVA_NA_FORMULA,
      'CURVA mudou — rode `node scripts/gen-formula-nerdometro.mjs`',
    ).toBe(CURVA)
  })

  it('foi gerada com a carência de estreia que o código usa hoje', () => {
    expect(
      PARTIDAS_NA_FORMULA,
      'PARTIDAS_PARA_ENTRAR mudou — rode `node scripts/gen-formula-nerdometro.mjs`',
    ).toBe(PARTIDAS_PARA_ENTRAR)
  })

  it('foi gerada com a janela e a ferrugem que o código usa hoje', () => {
    // Quatro constantes novas, e todas aparecem escritas na fórmula da tela: a
    // janela em `v_i`, e a graça, o prazo e o piso dentro de `ρ_i`. Mexer numa
    // delas sem rodar o gerador põe um número falso numa página que o jogador
    // abre justamente para conferir a conta.
    const recado = 'a regra mudou — rode `node scripts/gen-formula-nerdometro.mjs`'
    expect(JANELA_NA_FORMULA, recado).toBe(PARTIDAS_NA_JANELA)
    expect(GRACA_NA_FORMULA, recado).toBe(DIAS_DE_GRACA)
    expect(PRAZO_NA_FORMULA, recado).toBe(DIAS_ATE_O_PISO)
    expect(PISO_NA_FORMULA, recado).toBe(PISO_DA_FERRUGEM)
    expect(TETO_NA_FORMULA, recado).toBe(TETO_DO_JOGO)
    expect(BONUS_NA_FORMULA, recado).toBe(BONUS_DE_LIMPEZA)
  })

  it('a fração mostra o teto acima de 1, e não o `min(1, …)` de antes', () => {
    // A escala aberta é a mudança mais fácil de esquecer aqui: a fórmula
    // continuaria linda dizendo que o teto é 1, e a tela mostraria 112.
    const texto = FORMULA_FRACAO.replace(/<[^>]+>/g, '')
    expect(texto).toContain(String(TETO_DO_JOGO).replace('.', ','))
    expect(texto).toContain(String(BONUS_DE_LIMPEZA).replace('.', ','))
  })

  it('escreve a ferrugem como função do tempo parado, com os dois ramos', () => {
    // Sem os dois ramos a fórmula esconderia justamente a parte generosa da
    // regra: a primeira semana não custa nada, e a queda tem piso.
    const texto = FORMULA_FERRUGEM.replace(/<[^>]+>/g, '')
    expect(FORMULA_FERRUGEM.startsWith('<math')).toBe(true)
    expect(texto, 'faltou a variável de dias parados').toContain('d')
    expect(texto, 'faltou a graça').toContain(String(DIAS_DE_GRACA))
    expect(texto, 'faltou o piso').toContain(String(PISO_DA_FERRUGEM).replace('.', ','))
    expect(texto, 'faltou o trecho da queda').toContain(String(DIAS_ATE_O_PISO - DIAS_DE_GRACA))
  })

  it('a nota multiplica a fração pela ferrugem antes da curva', () => {
    // A ordem importa e é a coisa mais fácil de escrever errado aqui: elevar
    // antes de multiplicar dá outro número. A anotação LaTeX guarda a fonte.
    const latex = FORMULA_NOTA.match(/x-tex">([\s\S]*?)<\/annotation>/)?.[1] ?? ''
    expect(latex.replace(/\s+/g, ' ')).toContain('(f_i \\, \\rho_i)^{\\,\\gamma}')
  })

  it('escreve quem entra na soma, em vez de deixar J subentendido', () => {
    // A carência é a parte da conta que o jogador sente na pele: ele joga, a
    // nota não mexe. Se ela não estiver escrita, a página mente por omissão.
    const texto = FORMULA_CONJUNTO.replace(/<[^>]+>/g, '')
    expect(texto, 'faltou definir J').toContain('J')
    expect(texto, 'faltou a contagem de partidas').toContain('n')
    expect(texto, 'faltou a condição de meta cheia').toContain('1')
    expect(FORMULA_CONJUNTO.startsWith('<math')).toBe(true)
  })

  it('mostra o expoente com vírgula decimal, que é como se escreve em português', () => {
    // 0.65 -> "0,65". KaTeX parte o número em <mn>, então a busca é pela vírgula
    // acompanhada dos dígitos, não pela string inteira.
    // O expoente saiu da fórmula da nota (que agora usa γ) e vive onde γ é
    // definido — que é o lugar certo dele.
    const semTags = FORMULA_FRACAO.replace(/<[^>]+>/g, '')
    expect(semTags).toContain(String(CURVA).replace('.', ','))
    expect(semTags, 'ponto decimal não é português').not.toContain(String(CURVA))
  })

  it('é MathML de verdade, e não texto fingindo de fórmula', () => {
    for (const f of [FORMULA_NOTA, FORMULA_FRACAO]) {
      expect(f.startsWith('<math')).toBe(true)
      expect(f).toContain('</math>')
      expect(f).toContain('display="block"')
    }
    // A nota é uma divisão; a fração, um mínimo. Se o LaTeX degradar para texto
    // corrido, estes some.
    expect(FORMULA_NOTA).toContain('<mfrac>')
    expect(FORMULA_FRACAO.replace(/<[^>]+>/g, '')).toContain('min')
  })

  it('é somatório de verdade: tem índice e conjunto', () => {
    // A primeira versão escrevia `Σ(fração × peso)`, sem índice — o que não
    // soma coisa nenhuma. Somatório sem índice é ilustração, não fórmula.
    const texto = FORMULA_NOTA.replace(/<[^>]+>/g, '')
    expect(texto, 'faltou o operador de somatório').toContain('∑')
    expect(texto, 'faltou o índice i').toContain('i')
    expect(texto, 'faltou o conjunto J dos jogos jogados').toContain('J')
    // Nada de palavra por extenso fazendo as vezes de variável.
    for (const palavra of ['fração', 'peso', 'recorde', 'meta', 'nota']) {
      expect(texto, `"${palavra}" por extenso dentro da fórmula`).not.toContain(palavra)
    }
  })

  it('os limites do somatório ficam ao lado do sigma, não embaixo', () => {
    // `<munder>` empilha o "i ∈ J" sob o Σ, e o MathML nativo do navegador
    // renderiza isso colado — ilegível. `\\nolimits` força `<msub>`. Tirar o
    // `\\displaystyle` não bastou: `\\dfrac` reimpõe display style nos dois lados.
    // É a única parte da legibilidade que dá para verificar sem olhar a tela.
    expect(FORMULA_NOTA, 'somatório com limites empilhados').not.toContain('<munder')
    expect(FORMULA_NOTA).toContain('<msub')
  })

  it('todo símbolo da fórmula está na legenda', () => {
    expect(LEGENDA.length).toBeGreaterThanOrEqual(10)
    const naLegenda = LEGENDA.map((l) => l.simbolo.replace(/<[^>]+>/g, '')).join(' ')
    for (const s of ['N', 'J', 'f', 'p', 'v', 'm', 'd', 'γ']) {
      expect(naLegenda, `símbolo ${s} sem explicação`).toContain(s)
    }
    for (const l of LEGENDA) expect(l.oQueE.length).toBeGreaterThan(5)
  })
})
