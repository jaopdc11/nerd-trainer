import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { normalizarTexto } from '@/core/answer/normalize'
import { ESTADOS_EUA } from '@/data/eua'
import { eua } from './eua'

/**
 * O tabuleiro dos estados dos EUA, medido como o dos países.
 *
 * O risco da mecânica livre é sempre o mesmo: uma resposta que serve a duas
 * células cai na primeira que o laço encontrar, e o jogador vê um estado
 * acendendo no lugar de outro. Aqui a armadilha mora nos sinônimos em inglês.
 */
const CONFIG = eua.config()
const CELULAS = CONFIG.celulas

describe('tabuleiro dos estados dos EUA', () => {
  it('tem uma célula por estado, com forma no mapa', () => {
    expect(CELULAS).toHaveLength(ESTADOS_EUA.length)
    for (const c of CELULAS) expect(c.forma, c.id).toBeDefined()
  })

  it('a canônica de cada célula é o nome do estado, e acerta ela mesma', () => {
    for (const c of CELULAS) {
      if (c.resposta.tipo !== 'texto') throw new Error(`${c.id}: resposta devia ser texto`)
      const e = ESTADOS_EUA.find((x) => x.sigla === c.id)
      expect(c.resposta.canonica, c.id).toBe(e?.nome)
      expect(validar(c.resposta.canonica, c.resposta, { rigor: 'estrito' }).veredito, c.id).toBe(
        'certo',
      )
    }
  })

  it('a sigla e cada sinônimo acertam a própria célula', () => {
    for (const e of ESTADOS_EUA) {
      const c = CELULAS.find((x) => x.id === e.sigla)
      if (!c || c.resposta.tipo !== 'texto') throw new Error(`${e.sigla}: sem célula de texto`)
      for (const forma of [e.sigla, ...e.sinonimos]) {
        expect(validar(forma, c.resposta, { rigor: 'estrito' }).veredito, `${forma} → ${e.sigla}`).toBe(
          'certo',
        )
      }
    }
  })

  it('nenhuma forma aceita serve a dois estados ao mesmo tempo', () => {
    const dono = new Map<string, string>()
    for (const c of CELULAS) {
      if (c.resposta.tipo !== 'texto') continue
      for (const forma of c.resposta.aceitas) {
        const chave = normalizarTexto(forma)
        const anterior = dono.get(chave)
        // Repetição DENTRO da mesma célula é só sinônimo que a normalização
        // achatou (Colúmbia/Columbia): tudo bem.
        expect(anterior ?? c.id, `"${forma}" serve a ${anterior} e a ${c.id}`).toBe(c.id)
        dono.set(chave, c.id)
      }
    }
  })

  it('diz o estado e a sigla no gabarito e no tooltip', () => {
    for (const e of ESTADOS_EUA) {
      const c = CELULAS.find((x) => x.id === e.sigla)
      expect(c?.gabarito, e.sigla).toContain(e.nome)
      expect(c?.gabarito, e.sigla).toContain(e.sigla)
      expect(c?.detalhe, e.sigla).toContain(e.nome)
    }
  })

  it('agrupa o gabarito por região', () => {
    for (const c of CELULAS) expect(c.secao, c.id).toBeTruthy()
    const regioes = new Set(CELULAS.map((c) => c.secao))
    expect(regioes).toEqual(new Set(['Nordeste', 'Meio-Oeste', 'Sul', 'Oeste']))
  })

  it('é cronometrado em cinco minutos e desenha no layout de mapa', () => {
    expect(CONFIG.limiteSegundos).toBe(300)
    expect(CONFIG.layout?.tipo).toBe('mapa')
    expect(CONFIG.ordem).toBe('livre')
  })
})
