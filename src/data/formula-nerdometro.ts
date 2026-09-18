// GERADO POR scripts/gen-formula-nerdometro.mjs — não edite à mão.
//
// MathML pré-renderizado: zero KaTeX em runtime. O expoente vem de `CURVA`, em
// `src/core/nerdometro.ts` — rode o script de novo se mudar a constante, e o
// teste avisa se você esquecer.

/** O valor de `CURVA` no momento em que este arquivo foi gerado. */
export const CURVA_NA_FORMULA = 0.65

/** O valor de `PARTIDAS_PARA_ENTRAR` no momento em que este arquivo foi gerado. */
export const PARTIDAS_NA_FORMULA = 2

/** Os valores da janela e da ferrugem no momento em que este arquivo foi gerado. */
export const JANELA_NA_FORMULA = 5
export const GRACA_NA_FORMULA = 7
export const PRAZO_NA_FORMULA = 90
export const PISO_NA_FORMULA = 0.7

/** O teto por jogo e o bônus de limpeza no momento da geração. */
export const TETO_NA_FORMULA = 1.3
export const BONUS_NA_FORMULA = 0.15

/** A nota: média dos pesos, com a fração passada pela curva. */
export const FORMULA_NOTA = "<math display=\"block\" xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>N</mi><mtext>  </mtext><mo>=</mo><mtext>  </mtext><mstyle scriptlevel=\"0\" displaystyle=\"true\"><mfrac><mrow><msub><mo>∑</mo><mrow><mi>i</mi><mo>∈</mo><mi>J</mi></mrow></msub><mtext> </mtext><msub><mi>p</mi><mi>i</mi></msub><mtext> </mtext><mo stretchy=\"false\">(</mo><msub><mi>f</mi><mi>i</mi></msub><mtext> </mtext><msub><mi>ρ</mi><mi>i</mi></msub><msup><mo stretchy=\"false\">)</mo><mrow><mtext> </mtext><mi>γ</mi></mrow></msup></mrow><mrow><msub><mo>∑</mo><mrow><mi>i</mi><mo>∈</mo><mi>J</mi></mrow></msub><mtext> </mtext><msub><mi>p</mi><mi>i</mi></msub></mrow></mfrac></mstyle></mrow><annotation encoding=\"application/x-tex\">\n    N \\;=\\; \\dfrac{\\sum\\nolimits_{i \\in J} \\, p_i \\, (f_i \\, \\rho_i)^{\\,\\gamma}}\n                  {\\sum\\nolimits_{i \\in J} \\, p_i}\n  </annotation></semantics></math>"

/** A fração de cada jogo, o placar vigente e o valor do expoente. */
export const FORMULA_FRACAO = "<math display=\"block\" xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>f</mi><mi>i</mi></msub><mtext>  </mtext><mo>=</mo><mtext>  </mtext><mi>min</mi><mo>⁡</mo><mtext> ⁣</mtext><mrow><mo fence=\"true\">(</mo><mn>1,3</mn><mo separator=\"true\">,</mo><mtext>  </mtext><mfrac><msub><mi>v</mi><mi>i</mi></msub><msub><mi>m</mi><mi>i</mi></msub></mfrac><mo>+</mo><mn>0,15</mn><mtext> </mtext><msub><mi mathvariant=\"normal\">ℓ</mi><mi>i</mi></msub><mo fence=\"true\">)</mo></mrow><mspace width=\"2em\"/><msub><mi>v</mi><mi>i</mi></msub><mtext>  </mtext><mo>=</mo><mtext>  </mtext><mi>max</mi><mo>⁡</mo><mo stretchy=\"false\">{</mo><mtext> </mtext><msub><mi>s</mi><mrow><mi>i</mi><mo separator=\"true\">,</mo><mn>1</mn></mrow></msub><mo separator=\"true\">,</mo><mtext> </mtext><mo>…</mo><mo separator=\"true\">,</mo><mtext> </mtext><msub><mi>s</mi><mrow><mi>i</mi><mo separator=\"true\">,</mo><mn>5</mn></mrow></msub><mo stretchy=\"false\">}</mo><mspace width=\"2em\"/><mi>γ</mi><mo>=</mo><mn>0,65</mn></mrow><annotation encoding=\"application/x-tex\">\n    f_i \\;=\\; \\min\\!\\left(1{,}3,\\; \\frac{v_i}{m_i} + 0{,}15\\,\\ell_i\\right)\n    \\qquad\n    v_i \\;=\\; \\max\\{\\, s_{i,1},\\, \\ldots,\\, s_{i,5} \\}\n    \\qquad\n    \\gamma = 0{,}65\n  </annotation></semantics></math>"

/** A ferrugem: o que o tempo parado faz com a fração. */
export const FORMULA_FERRUGEM = "<math display=\"block\" xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>ρ</mi><mi>i</mi></msub><mtext>  </mtext><mo>=</mo><mtext>  </mtext><mrow><mo fence=\"true\">{</mo><mtable rowspacing=\"0.36em\" columnalign=\"left left\" columnspacing=\"1em\"><mtr><mtd><mstyle scriptlevel=\"0\" displaystyle=\"false\"><mrow><mn>1</mn><mo separator=\"true\">,</mo></mrow></mstyle></mtd><mtd><mstyle scriptlevel=\"0\" displaystyle=\"false\"><mrow><msub><mi>d</mi><mi>i</mi></msub><mo>≤</mo><mn>7</mn></mrow></mstyle></mtd></mtr><mtr><mtd><mstyle scriptlevel=\"0\" displaystyle=\"false\"><mrow><mi>max</mi><mo>⁡</mo><mtext> ⁣</mtext><mrow><mo fence=\"true\">(</mo><mn>0,7</mn><mo separator=\"true\">,</mo><mtext>  </mtext><mn>1</mn><mo>−</mo><mn>0,3</mn><mtext> </mtext><mstyle scriptlevel=\"0\" displaystyle=\"true\"><mfrac><mrow><msub><mi>d</mi><mi>i</mi></msub><mo>−</mo><mn>7</mn></mrow><mn>83</mn></mfrac></mstyle><mo fence=\"true\">)</mo></mrow><mo separator=\"true\">,</mo></mrow></mstyle></mtd><mtd><mstyle scriptlevel=\"0\" displaystyle=\"false\"><mrow><msub><mi>d</mi><mi>i</mi></msub><mo>&gt;</mo><mn>7</mn></mrow></mstyle></mtd></mtr></mtable></mrow></mrow><annotation encoding=\"application/x-tex\">\n    \\rho_i \\;=\\;\n    \\begin{cases}\n      1, &amp; d_i \\le 7 \\\\[2pt]\n      \\max\\!\\left(0{,}7,\\; 1 - 0{,}3\\,\\dfrac{d_i - 7}{83}\\right), &amp; d_i &gt; 7\n    \\end{cases}\n  </annotation></semantics></math>"

/** A partida limpa, que é a outra porta para passar de 100. */
export const FORMULA_LIMPEZA = "<math display=\"block\" xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi mathvariant=\"normal\">ℓ</mi><mi>i</mi></msub><mtext>  </mtext><mo>=</mo><mtext>  </mtext><mrow><mo fence=\"true\">{</mo><mtable rowspacing=\"0.36em\" columnalign=\"left left\" columnspacing=\"1em\"><mtr><mtd><mstyle scriptlevel=\"0\" displaystyle=\"false\"><mrow><mn>1</mn><mo separator=\"true\">,</mo></mrow></mstyle></mtd><mtd><mstyle scriptlevel=\"0\" displaystyle=\"false\"><mrow><mtext>alguma das </mtext><mn>5</mn><mrow><mtext> </mtext><mover accent=\"true\"><mtext>u</mtext><mo>ˊ</mo></mover><mtext>ltimas bateu </mtext></mrow><msub><mi>m</mi><mi>i</mi></msub><mtext> sem erro</mtext></mrow></mstyle></mtd></mtr><mtr><mtd><mstyle scriptlevel=\"0\" displaystyle=\"false\"><mrow><mn>0</mn><mo separator=\"true\">,</mo></mrow></mstyle></mtd><mtd><mstyle scriptlevel=\"0\" displaystyle=\"false\"><mrow><mtext>caso contr</mtext><mover accent=\"true\"><mtext>a</mtext><mo>ˊ</mo></mover><mtext>rio</mtext></mrow></mstyle></mtd></mtr></mtable></mrow></mrow><annotation encoding=\"application/x-tex\">\n    \\ell_i \\;=\\;\n    \\begin{cases}\n      1, &amp; \\text{alguma das } 5 \\text{ últimas bateu } m_i \\text{ sem erro} \\\\[2pt]\n      0, &amp; \\text{caso contrário}\n    \\end{cases}\n  </annotation></semantics></math>"

/** Quem entra na soma: a carência de estreia, escrita como conjunto. */
export const FORMULA_CONJUNTO = "<math display=\"block\" xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>J</mi><mtext>  </mtext><mo>=</mo><mtext>  </mtext><mrow><mo fence=\"true\">{</mo><mtext> </mtext><mi>i</mi><mtext>  </mtext><mo>:</mo><mtext>  </mtext><msub><mi>v</mi><mi>i</mi></msub><mo>&gt;</mo><mn>0</mn><mtext>  </mtext><mo>∧</mo><mtext>  </mtext><mrow><mo fence=\"true\">(</mo><msub><mi>n</mi><mi>i</mi></msub><mo>≥</mo><mn>2</mn><mtext>  </mtext><mo>∨</mo><mtext>  </mtext><msub><mi>f</mi><mi>i</mi></msub><mo>=</mo><mn>1</mn><mo fence=\"true\">)</mo></mrow><mo fence=\"true\">}</mo></mrow></mrow><annotation encoding=\"application/x-tex\">\n    J \\;=\\; \\left\\{\\, i \\;:\\; v_i &gt; 0 \\;\\wedge\\; \\left(n_i \\geq 2 \\;\\vee\\; f_i = 1\\right) \\right\\}\n  </annotation></semantics></math>"

/** O que cada símbolo quer dizer. Fórmula sem legenda é charada. */
export const LEGENDA: readonly { readonly simbolo: string; readonly oQueE: string }[] = [
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>N</mi></mrow><annotation encoding=\"application/x-tex\">N</annotation></semantics></math>", oQueE: "a nota, de 0 a 100 (× 100 na exibição)" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>J</mi></mrow><annotation encoding=\"application/x-tex\">J</annotation></semantics></math>", oQueE: "os jogos que entram na conta" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>s</mi><mrow><mi>i</mi><mo separator=\"true\">,</mo><mi>j</mi></mrow></msub></mrow><annotation encoding=\"application/x-tex\">s_{i,j}</annotation></semantics></math>", oQueE: "a pontuação da j-ésima partida mais recente do jogo i" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>v</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">v_i</annotation></semantics></math>", oQueE: "seu placar vigente: o melhor das 5 últimas partidas" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>m</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">m_i</annotation></semantics></math>", oQueE: "a meta do jogo i" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>f</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">f_i</annotation></semantics></math>", oQueE: "sua fração da meta, no máximo 1,3" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi mathvariant=\"normal\">ℓ</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">\\ell_i</annotation></semantics></math>", oQueE: "vale 1 se você bateu a meta sem errar nada" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>d</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">d_i</annotation></semantics></math>", oQueE: "dias desde a última vez que você jogou o jogo i" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>ρ</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">\\rho_i</annotation></semantics></math>", oQueE: "a ferrugem: quanto daquilo ainda vale hoje" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>p</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">p_i</annotation></semantics></math>", oQueE: "o peso do jogo i" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msub><mi>n</mi><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">n_i</annotation></semantics></math>", oQueE: "quantas partidas você jogou do jogo i" },
  { simbolo: "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>γ</mi></mrow><annotation encoding=\"application/x-tex\">\\gamma</annotation></semantics></math>", oQueE: "o expoente do retorno decrescente" },
]
