import { describe, expect, it } from 'vitest'
import { ROTULO_AREA_SIMBOLO, SIMBOLOS_MATEMATICOS } from './simbolos-matematicos'

/**
 * Guardas do dataset. O teste que importa de verdade — o de ambiguidade entre
 * respostas — mora em `src/games/simbolos-matematicos.test.ts`, porque depende
 * da regra de validação do jogo e não do formato dos dados.
 */
describe('coerência do dataset', () => {
  it('não repete id, glifo nem nome', () => {
    for (const campo of ['id', 'glifo', 'nome'] as const) {
      const vistos = SIMBOLOS_MATEMATICOS.map((s) => s[campo])
      expect(new Set(vistos).size, `${campo} repetido`).toBe(vistos.length)
    }
  })

  it('o glifo é notação, não palavra', () => {
    for (const s of SIMBOLOS_MATEMATICOS) {
      // Nenhum glifo cabe em ASCII: se coubesse, o jogo estaria mostrando texto
      // datilografado onde devia mostrar o símbolo (`|-` em vez de `⊢`).
      expect(/[^\x20-\x7e]/.test(s.glifo), `${s.id}: "${s.glifo}" é só ASCII`).toBe(true)
      // Os poucos compostos são ℵ₀, ∃!, ⌊x⌋ e ⌈x⌉. Mais que isso já é fórmula,
      // e fórmula é assunto de outro jogo.
      expect([...s.glifo].length, `${s.id}: "${s.glifo}" é grande demais`).toBeLessThanOrEqual(3)
    }
  })

  it('o nome canônico é minúsculo — a carta não pergunta ortografia', () => {
    for (const s of SIMBOLOS_MATEMATICOS) {
      expect(s.nome, s.id).toBe(s.nome.toLocaleLowerCase('pt-BR'))
    }
  })

  it('nenhuma forma aceita vem vazia ou com espaço sobrando', () => {
    for (const s of SIMBOLOS_MATEMATICOS) {
      for (const forma of [s.nome, ...s.sinonimos]) {
        expect(forma.trim(), `${s.id}: "${forma}"`).toBe(forma)
        expect(forma.length, s.id).toBeGreaterThan(0)
      }
    }
  })

  it('nenhum símbolo repete um sinônimo dentro de si', () => {
    for (const s of SIMBOLOS_MATEMATICOS) {
      const formas = [s.nome, ...s.sinonimos]
      expect(new Set(formas).size, `${s.id}: ${formas.join(' | ')}`).toBe(formas.length)
    }
  })

  it('as quatro áreas estão povoadas', () => {
    for (const area of Object.keys(ROTULO_AREA_SIMBOLO) as (keyof typeof ROTULO_AREA_SIMBOLO)[]) {
      const quantos = SIMBOLOS_MATEMATICOS.filter((s) => s.area === area).length
      expect(quantos, `área "${area}" vazia`).toBeGreaterThan(0)
    }
  })

  it('a glosa é uma linha, não um parágrafo', () => {
    // Ela entra no gabarito depois de um travessão, e o gabarito é uma frase na
    // tela do erro. Passar disso vira texto que ninguém lê no meio da partida.
    for (const s of SIMBOLOS_MATEMATICOS) {
      if (!s.glosa) continue
      expect(s.glosa.length, `${s.id}: glosa longa demais`).toBeLessThanOrEqual(80)
      expect(s.glosa, s.id).not.toContain('\n')
    }
  })

  /*
   * Gabarito conferido à mão: estes são os símbolos cujo nome eu digitaria de
   * olhos fechados e cuja troca seria erro de conteúdo, não de cadastro. Se
   * alguém renomear ∂ para "del" ou trocar ⊢ por ⊨, isto quebra.
   */
  it('o gabarito conferido à mão bate', () => {
    const esperado: Record<string, string> = {
      '∂': 'derivada parcial',
      '∇': 'nabla',
      '∮': 'integral de contorno',
      '⊗': 'produto tensorial',
      '⊕': 'soma direta',
      'ℵ₀': 'aleph zero',
      '⊨': 'satisfaz',
      '⊢': 'deduz',
      '∅': 'conjunto vazio',
      '∎': 'fim da demonstração',
      '⌊x⌋': 'piso',
      '∴': 'portanto',
    }
    for (const [glifo, nome] of Object.entries(esperado)) {
      const s = SIMBOLOS_MATEMATICOS.find((x) => x.glifo === glifo)
      expect(s?.nome, `${glifo} sumiu ou mudou de nome`).toBe(nome)
    }
  })

  it('⊢ e ⊨ continuam sendo símbolos distintos, com glosas que os separam', () => {
    // O par que dá sentido ao baralho: um é sintaxe, o outro é semântica. Se as
    // duas cartas passarem a dizer a mesma coisa, o jogo perde o item mais
    // valioso que tem.
    const deduz = SIMBOLOS_MATEMATICOS.find((s) => s.id === 'deduz')
    const satisfaz = SIMBOLOS_MATEMATICOS.find((s) => s.id === 'satisfaz')
    expect(deduz?.glosa).toContain('sintaxe')
    expect(satisfaz?.glosa).toContain('semântica')
  })
})
