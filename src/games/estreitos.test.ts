import { describe, expect, it } from 'vitest'
import { normalizarTexto, validar } from '@/core/answer'
import { ALTURA_MAPA, FORMAS, LARGURA_MAPA } from '@/data/paises-mapa'
import { PASSAGENS, pontoDe } from '@/data/estreitos'
import { estreitos } from './estreitos'

const CONFIG = estreitos.config()
const CELULAS = CONFIG.celulas

describe('tabuleiro de estreitos', () => {
  it('tem uma célula por passagem, e toda célula é um ponto', () => {
    expect(CELULAS).toHaveLength(PASSAGENS.length)
    for (const c of CELULAS) {
      const forma = c.forma
      if (!forma) throw new Error(`${c.id}: célula sem forma`)
      // Contorno aqui seria mentira: nenhum destes tem desenho no dataset, e
      // inventar um é exatamente o que este jogo existe para não fazer.
      expect('d' in forma, `${c.id} virou contorno`).toBe(false)
    }
  })

  it('o ponto da célula é a projeção da coordenada da passagem', () => {
    for (const p of PASSAGENS) {
      const c = CELULAS.find((x) => x.id === p.id)
      expect(c?.forma, p.nome).toEqual(pontoDe(p))
    }
  })

  it('cada célula acerta a própria resposta canônica e as formas curtas', () => {
    for (const p of PASSAGENS) {
      const c = CELULAS.find((x) => x.id === p.id)
      if (!c || c.resposta.tipo !== 'texto') throw new Error(`${p.id}: célula sumiu`)
      for (const forma of [p.nome, ...p.sinonimos]) {
        expect(validar(forma, c.resposta, { rigor: 'estrito' }).veredito, `${p.id}: ${forma}`).toBe(
          'certo',
        )
      }
    }
  })

  it('nenhuma forma aceita serve a duas passagens', () => {
    // Colisão exata a trava de vizinhança não resolve: ela recusa o ambíguo, e
    // o jogador ficaria sem conseguir preencher nenhuma das duas células.
    const dono = new Map<string, string>()
    for (const c of CELULAS) {
      if (c.resposta.tipo !== 'texto') continue
      for (const forma of c.resposta.aceitas) {
        const chave = normalizarTexto(forma, true)
        const anterior = dono.get(chave)
        expect(anterior ?? c.id, `"${forma}" serve a ${anterior} e a ${c.id}`).toBe(c.id)
        dono.set(chave, c.id)
      }
    }
  })

  it('o gabarito diz o que a passagem liga, e o tooltip o que ela separa', () => {
    // Quem errou "Estreito de Palk" não aprende nada lendo "Estreito de Palk".
    for (const p of PASSAGENS) {
      const c = CELULAS.find((x) => x.id === p.id)
      expect(c?.gabarito, p.id).toContain(p.nome)
      expect(c?.gabarito, p.id).toContain(p.liga)
      expect(c?.detalhe, p.id).toBe(p.separa)
    }
  })

  it('agrupa o gabarito por bacia e marca os quatro canais escavados', () => {
    for (const c of CELULAS) expect(c.secao, c.id).toBeTruthy()
    const marco = CONFIG.marcos?.[0]
    expect(marco?.ids.length).toBe(4)
    expect([...(marco?.ids ?? [])].sort()).toEqual(['corinto', 'kiel', 'panama', 'suez'])
    // Marco que aponta para célula inexistente nunca fecha, e o jogador nunca
    // descobre por quê.
    for (const id of marco?.ids ?? []) {
      expect(
        CELULAS.some((c) => c.id === id),
        id,
      ).toBe(true)
    }
  })
})

describe('o planeta ao fundo', () => {
  const layout = CONFIG.layout
  if (layout?.tipo !== 'mapa') throw new Error('o jogo tem de ser de mapa')

  it('desenha os continentes inteiros, e nenhum deles vale ponto', () => {
    const comContorno = Object.values(FORMAS).filter((f) => 'd' in f).length
    // Os países desenháveis mais os dois inertes do mapa-múndi.
    expect(layout.inertes.length).toBe(comContorno + 2)

    const respondiveis = new Set(CELULAS.map((c) => c.id))
    for (const t of layout.inertes) {
      expect(respondiveis.has(t.id), `${t.id} é país e está valendo ponto`).toBe(false)
      expect(t.d.length, t.id).toBeGreaterThan(0)
    }
  })

  it('não repete id entre as peças inertes', () => {
    // Dois `path` com a mesma chave quebram a reconciliação do React e uma das
    // peças some do mapa.
    expect(new Set(layout.inertes.map((t) => t.id)).size).toBe(layout.inertes.length)
  })

  it('usa a caixa do mapa-múndi, e não outra', () => {
    expect(layout.largura).toBe(LARGURA_MAPA)
    expect(layout.altura).toBe(ALTURA_MAPA)
  })
})

describe('o formato da partida', () => {
  it('é cronometrada em cinco minutos, em ordem livre', () => {
    expect(CONFIG.limiteSegundos).toBe(300)
    expect(CONFIG.ordem).toBe('livre')
    expect(CONFIG.teclado).toBe('texto')
  })

  it('não mostra rótulo: rótulo no mapa entregaria a resposta', () => {
    expect(CONFIG.mostrarRotulos).toBe(false)
    for (const c of CELULAS) expect(c.rotulo, c.id).toBeUndefined()
  })
})
