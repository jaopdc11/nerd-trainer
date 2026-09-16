// GERADO POR scripts/gen-formula-nerdometro.mjs — não edite à mão.
//
// MathML pré-renderizado: zero KaTeX em runtime. O expoente vem de `CURVA`, em
// `src/core/nerdometro.ts` — rode o script de novo se mudar a constante, e o
// teste avisa se você esquecer.

/** O valor de `CURVA` no momento em que este arquivo foi gerado. */
export const CURVA_NA_FORMULA = 0.65

/** A nota: média dos pesos, com a fração passada pela curva. */
export const FORMULA_NOTA = "<math display=\"block\" xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>N</mi><mtext>  </mtext><mo>=</mo><mtext>  </mtext><mfrac><mstyle scriptlevel=\"0\" displaystyle=\"true\"><munder><mo>∑</mo><mrow><mi>i</mi><mo>∈</mo><mi>J</mi></mrow></munder><msub><mi>p</mi><mi>i</mi></msub><mtext> </mtext><msubsup><mi>f</mi><mi>i</mi><mrow><mtext> </mtext><mi>γ</mi></mrow></msubsup></mstyle><mstyle scriptlevel=\"0\" displaystyle=\"true\"><munder><mo>∑</mo><mrow><mi>i</mi><mo>∈</mo><mi>J</mi></mrow></munder><msub><mi>p</mi><mi>i</mi></msub></mstyle></mfrac></mrow><annotation encoding=\"application/x-tex\">\n    N \\;=\\; \\frac{\\displaystyle\\sum_{i \\in J} p_i \\, f_i^{\\,\\gamma}}\n                 {\\displaystyle\\sum_{i \\in J} p_i}\n  </annotation></semantics></math>"

/** A fração de cada jogo, e o valor do expoente. */
export const FORMULA_FRACAO = "<math display=\"block\" xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>f</mi><mi>i</mi></msub><mtext>  </mtext><mo>=</mo><mtext>  </mtext><mi>min</mi><mo>⁡</mo><mtext> ⁣</mtext><mrow><mo fence=\"true\">(</mo><mn>1</mn><mo separator=\"true\">,</mo><mtext>  </mtext><mfrac><msub><mi>r</mi><mi>i</mi></msub><msub><mi>m</mi><mi>i</mi></msub></mfrac><mo fence=\"true\">)</mo></mrow><mspace width=\"2em\"/><mi>γ</mi><mo>=</mo><mn>0,65</mn></mrow><annotation encoding=\"application/x-tex\">\n    f_i \\;=\\; \\min\\!\\left(1,\\; \\frac{r_i}{m_i}\\right)\n    \\qquad\n    \\gamma = 0{,}65\n  </annotation></semantics></math>"

/** O que cada símbolo quer dizer. Fórmula sem legenda é charada. */
export const LEGENDA: readonly { readonly simbolo: string; readonly oQueE: string }[] = [
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>N</mi></mrow><annotation encoding=\"application/x-tex\">N</annotation></semantics></math>", oQueE: "a nota, de 0 a 100 (× 100 na exibição)" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>J</mi></mrow><annotation encoding=\"application/x-tex\">J</annotation></semantics></math>", oQueE: "o conjunto dos jogos que você já jogou" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>r</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">r_i</annotation></semantics></math>", oQueE: "seu recorde no jogo i" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>m</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">m_i</annotation></semantics></math>", oQueE: "a meta do jogo i" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>f</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">f_i</annotation></semantics></math>", oQueE: "sua fração da meta, no máximo 1" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>p</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">p_i</annotation></semantics></math>", oQueE: "o peso do jogo i" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>γ</mi></mrow><annotation encoding=\"application/x-tex\">\\gamma</annotation></semantics></math>", oQueE: "o expoente do retorno decrescente" },
]
