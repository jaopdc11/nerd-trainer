import { describe, expect, it } from 'vitest'
import { CURVA } from '@/core/nerdometro'
import { CURVA_NA_FORMULA, FORMULA_FRACAO, FORMULA_NOTA, LEGENDA } from './formula-nerdometro'

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

  it('todo símbolo da fórmula está na legenda', () => {
    expect(LEGENDA.length).toBeGreaterThanOrEqual(7)
    const naLegenda = LEGENDA.map((l) => l.simbolo.replace(/<[^>]+>/g, '')).join(' ')
    for (const s of ['N', 'J', 'f', 'p', 'r', 'm', 'γ']) {
      expect(naLegenda, `símbolo ${s} sem explicação`).toContain(s)
    }
    for (const l of LEGENDA) expect(l.oQueE.length).toBeGreaterThan(5)
  })
})
