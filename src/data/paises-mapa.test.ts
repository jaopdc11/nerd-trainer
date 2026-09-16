import { describe, expect, it } from 'vitest'
import { PAISES } from './paises'
import { ALTURA_MAPA, FORMAS, INERTES, LARGURA_MAPA } from './paises-mapa'

/**
 * Invariantes do arquivo gerado.
 *
 * Ele sai de `scripts/gen-paises.mjs`, e é justamente por ser gerado que precisa
 * de teste: trocar a fonte, a projeção ou a resolução do Natural Earth muda este
 * arquivo inteiro de uma vez, sem ninguém ler linha por linha.
 */
describe('contornos do mapa-múndi', () => {
  it('cobre todos os países, sem sobra', () => {
    // O baralho de capitais desenha o país da carta: um id sem contorno viraria
    // pergunta sem figura.
    expect(Object.keys(FORMAS).sort()).toEqual(PAISES.map((p) => p.id).sort())
  })

  it('tem contorno para todo país grande e ponto para os minúsculos', () => {
    // Um país sem forma nenhuma some do tabuleiro: fica valendo ponto e não tem
    // onde acender.
    const pontos = Object.values(FORMAS).filter((f) => !('d' in f))
    expect(pontos.length, 'micro-estados viraram ponto').toBeGreaterThan(0)
    expect(INERTES.length, 'Groenlândia e Antártida seguram os buracos').toBeGreaterThan(0)
    for (const [id, f] of Object.entries(FORMAS)) {
      if ('d' in f) expect(f.d.length, id).toBeGreaterThan(0)
    }
  })

  it('não põe nada fora da caixa da projeção', () => {
    for (const [id, forma] of Object.entries(FORMAS)) {
      const numeros =
        'd' in forma ? (forma.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number) : [forma.x, forma.y]
      for (let i = 0; i + 1 < numeros.length; i += 2) {
        expect(numeros[i], `${id}: x`).toBeGreaterThanOrEqual(0)
        expect(numeros[i], `${id}: x`).toBeLessThanOrEqual(LARGURA_MAPA)
        expect(numeros[i + 1], `${id}: y`).toBeGreaterThanOrEqual(0)
        expect(numeros[i + 1], `${id}: y`).toBeLessThanOrEqual(ALTURA_MAPA)
      }
    }
  })
})
