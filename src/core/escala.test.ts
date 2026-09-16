import { describe, expect, it } from 'vitest'
import { corDaNota, ESCALA, gradienteDaNota, interpolar } from './escala'

/**
 * A conversão OKLCH → sRGB, escrita aqui em vez de importada da escala.
 *
 * Mesma regra dos datasets: o teste não pode ser o próprio código se
 * autoaprovando. A escala só declara L, C e H; quem diz se aquilo cabe numa
 * tela é esta conta, por um caminho independente.
 */
function paraRgb(L: number, C: number, H: number): [number, number, number] {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const noGamute = (L: number, C: number, H: number) =>
  paraRgb(L, C, H).every((v) => v >= -0.001 && v <= 1.001)

/** Luminância relativa, para o contraste WCAG contra o fundo do app. */
function luminancia(L: number, C: number, H: number): number {
  const [r, g, b] = paraRgb(L, C, H)
    .map((v) => {
      const c = Math.min(1, Math.max(0, v))
      return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
    })
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** `--color-fundo` do tema. */
const LUM_FUNDO = luminancia(0.15, 0.018, 265)
const contraste = (L: number, C: number, H: number) =>
  (luminancia(L, C, H) + 0.05) / (LUM_FUNDO + 0.05)

/** Lê de volta o `oklch(...)` que a escala produz. */
function ler(css: string): [number, number, number] {
  const m = css.match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/)
  if (!m) throw new Error(`não é oklch: ${css}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

const NOTAS = Array.from({ length: 101 }, (_, i) => i)

describe('escala do Nerdômetro', () => {
  it('todo stop cabe no sRGB', () => {
    for (const s of ESCALA) {
      expect(noGamute(s.l, s.c, s.h), `stop ${s.em} estoura o gamute`).toBe(true)
    }
  })

  it('nenhuma nota inteira estoura o gamute', () => {
    for (const n of NOTAS) {
      const [l, c, h] = ler(corDaNota(n))
      expect(noGamute(l, c, h), `nota ${n} estoura o gamute`).toBe(true)
    }
  })

  it('a escala clareia do começo ao fim — o topo não pode ser o ponto apagado', () => {
    // O defeito da escala anterior: L caía de 0,75 na nota 20 para 0,66 na 100,
    // então subir na escala escurecia a recompensa.
    for (const n of NOTAS.slice(1)) {
      expect(interpolar(n).l).toBeGreaterThanOrEqual(interpolar(n - 1).l)
    }
    expect(interpolar(100).l).toBeGreaterThan(interpolar(0).l + 0.25)
  })

  it('não abre buraco morto: o croma nunca desaba no meio da escala', () => {
    // O croma pode ceder um pouco onde o gamute aperta, mas uma queda grande
    // vira um trecho visivelmente sem cor. Antes da correção dos matizes a nota
    // 80 exibia 0,131 contra 0,205 na nota 35 — um tombo de 36%.
    const pico = Math.max(...NOTAS.map((n) => interpolar(n).c))
    for (const n of NOTAS) {
      expect(interpolar(n).c, `nota ${n} perde muito croma`).toBeGreaterThan(pico * 0.65)
    }
  })

  it('o título continua legível: texto grande pede 3:1 contra o fundo', () => {
    for (const n of NOTAS) {
      const [l, c, h] = ler(corDaNota(n))
      expect(contraste(l, c, h), `nota ${n} tem pouco contraste`).toBeGreaterThan(3)
    }
  })

  it('as pontas do gradiente vêm de notas diferentes, não do mesmo tom', () => {
    // O gradiente antigo era o mesmo matiz mais claro e mais escuro, e por isso
    // não lia como gradiente. As pontas agora precisam diferir em matiz.
    for (const n of [20, 50, 80]) {
      const [de, ate] = gradienteDaNota(n).match(/oklch\([^)]+\)/g) as [string, string]
      expect(ler(de)[2]).not.toBeCloseTo(ler(ate)[2], 1)
    }
  })
})
