/**
 * A escala de cor do Nerdômetro: uma brasa esquentando, do vermelho fundo ao
 * dourado.
 *
 * Fica no core, e não no componente, porque é matemática com um jeito silencioso
 * de quebrar: pedir croma que o sRGB não tem não dá erro nenhum, o navegador
 * reduz sozinho e o único sintoma é a cor ficar pior. Aqui dá para medir.
 *
 * Duas coisas que a versão anterior errava e que explicam estes números:
 *
 * 1. **O topo era o ponto mais apagado.** O `L` ia 0,72 → 0,75 → 0,74 → 0,72 →
 *    0,70 → 0,66: a nota 100 saía mais escura que a nota 20, e subir na escala
 *    *apagava* a recompensa. Aqui o `L` só cresce, de 0,58 a 0,91 — a nota não
 *    muda de cor, ela acende.
 * 2. **Girar o matiz não compra saturação; a luminosidade compra.** Em OKLCH
 *    cada matiz atinge croma máximo numa luminosidade diferente: azul lá pelos
 *    0,55, magenta 0,63, âmbar 0,80. Passear de 248° a 388° com `L` preso em
 *    ~0,72, como antes, pede no azul e no violeta um croma que não existe — e o
 *    resultado é lavado. Por isso o matiz quase não anda (20° → 100°, tudo
 *    dentro do quente) e quem conta a história é o par luminosidade+croma.
 *
 * O matiz sobe junto com o `L` pelo mesmo motivo: o teto de croma desaba no
 * laranja conforme clareia. Em `L 0,84` o matiz 72° sustenta só `C 0,126`,
 * enquanto o 95° sustenta `0,175`. Segurar o tom alaranjado até o topo abria um
 * buraco morto entre as notas 55 e 90, com o croma exibido caindo a `0,131` —
 * exatamente a aparência seca que esta escala existe para resolver.
 */
export interface Stop {
  readonly em: number
  readonly l: number
  readonly c: number
  readonly h: number
}

export const ESCALA: readonly Stop[] = [
  { em: 0, l: 0.58, c: 0.13, h: 20 },
  { em: 20, l: 0.64, c: 0.19, h: 24 },
  { em: 40, l: 0.7, c: 0.19, h: 34 },
  { em: 60, l: 0.77, c: 0.16, h: 62 },
  { em: 80, l: 0.84, c: 0.17, h: 95 },
  { em: 100, l: 0.91, c: 0.185, h: 100 },
]

export function interpolar(nota: number): Stop {
  const n = Math.max(0, Math.min(100, nota))
  const fim = ESCALA.findIndex((s) => s.em >= n)
  const b = ESCALA[fim === -1 ? ESCALA.length - 1 : fim] as Stop
  const a = (fim <= 0 ? b : ESCALA[fim - 1]) as Stop

  const t = b.em === a.em ? 0 : (n - a.em) / (b.em - a.em)
  return {
    em: n,
    l: a.l + (b.l - a.l) * t,
    c: a.c + (b.c - a.c) * t,
    h: a.h + (b.h - a.h) * t,
  }
}

/**
 * Teto e piso do ajuste de luminosidade: acima de 0,95 a cor desbota para
 * branco e perde justamente o que ela existe para mostrar; abaixo de 0,25 o
 * texto some no fundo.
 *
 * Os ajustes são pequenos de propósito. Com o topo da escala já em `L 0,91`,
 * "mais claro" praticamente deixou de ser um recurso — os `+0,12` e `+0,06` de
 * antes foram desenhados para uma escala que morava em `L ≈ 0,72` e tinha folga.
 */
export function corDaNota(nota: number, ajusteL = 0): string {
  const s = interpolar(nota)
  const l = Math.min(0.95, Math.max(0.25, s.l + ajusteL))
  return `oklch(${l.toFixed(3)} ${s.c.toFixed(3)} ${(s.h % 360).toFixed(1)})`
}

/** As duas pontas são vizinhas *na escala*, não o mesmo tom mais claro e mais escuro. */
const VIZINHO = 16

export function gradienteDaNota(nota: number): string {
  const de = corDaNota(Math.max(0, nota - VIZINHO), 0.02)
  const ate = corDaNota(Math.min(100, nota + VIZINHO), -0.02)
  return `linear-gradient(100deg, ${de}, ${ate})`
}
