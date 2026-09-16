import { describe, expect, it } from 'vitest'
import { CURVA } from '@/core/nerdometro'
import { CURVA_NA_FORMULA, FORMULA_FRACAO, FORMULA_NOTA } from './formula-nerdometro'

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
    const semTags = FORMULA_NOTA.replace(/<[^>]+>/g, '')
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

  it('nomeia as mesmas coisas que a explicação em prosa usa', () => {
    const texto = `${FORMULA_NOTA}${FORMULA_FRACAO}`.replace(/<[^>]+>/g, '')
    for (const palavra of ['nota', 'fração', 'peso', 'recorde', 'meta']) {
      expect(texto, `a fórmula não fala em "${palavra}"`).toContain(palavra)
    }
  })
})
