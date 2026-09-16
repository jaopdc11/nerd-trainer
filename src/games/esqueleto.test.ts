import { describe, expect, it } from 'vitest'
import { normalizarTexto, validar } from '@/core/answer'
import { ALTURA_CORPO, LARGURA_CORPO, OSSOS, SILHUETA } from '@/data/esqueleto'
import { esqueleto } from './esqueleto'

const CONFIG = esqueleto.config()
const CELULAS = CONFIG.celulas

describe('tabuleiro do esqueleto', () => {
  it('tem uma célula por osso, e toda célula é um contorno', () => {
    expect(CELULAS).toHaveLength(OSSOS.length)
    for (const c of CELULAS) {
      const forma = c.forma
      if (!forma) throw new Error(`${c.id}: célula sem forma`)
      // Ponto aqui seria errado: osso tem tamanho nesta escala, ao contrário do
      // estreito de Gibraltar no mapa-múndi. Um círculo no lugar do fêmur não
      // diria onde o fêmur começa nem onde termina.
      expect('d' in forma, `${c.id} virou ponto`).toBe(true)
    }
  })

  it('a forma da célula é a forma que o dataset desenhou', () => {
    for (const o of OSSOS) {
      const c = CELULAS.find((x) => x.id === o.id)
      expect(c?.forma, o.nome).toEqual(o.forma)
    }
  })

  it('cada célula acerta o próprio nome e os sinônimos de escola', () => {
    for (const o of OSSOS) {
      const c = CELULAS.find((x) => x.id === o.id)
      if (!c || c.resposta.tipo !== 'texto') throw new Error(`${o.id}: célula sumiu`)
      for (const forma of [o.nome, ...o.sinonimos]) {
        expect(validar(forma, c.resposta, { rigor: 'estrito' }).veredito, `${o.id}: ${forma}`).toBe(
          'certo',
        )
      }
    }
  })

  it('o nome de um osso nunca acerta a célula de outro', () => {
    // Com a vizinhança inteira em jogo, que é como a engine chama a validação:
    // é aqui que "metatarso" contra a célula do metacarpo tem de dar errado.
    const vizinhanca = new Set(
      CELULAS.flatMap((c) => (c.resposta.tipo === 'texto' ? [c.resposta.canonica] : [])),
    )
    for (const alvo of CELULAS) {
      if (alvo.resposta.tipo !== 'texto') continue
      for (const outro of OSSOS) {
        if (outro.id === alvo.id) continue
        for (const forma of [outro.nome, ...outro.sinonimos]) {
          expect(
            validar(forma, alvo.resposta, { rigor: 'estrito', vizinhanca }).veredito,
            `"${forma}" (${outro.id}) acertou a célula de ${alvo.id}`,
          ).not.toBe('certo')
        }
      }
    }
  })

  it('nenhuma forma aceita serve a duas células', () => {
    // Colisão exata a trava de vizinhança não resolve: ela recusa o ambíguo, e o
    // jogador ficaria sem conseguir preencher nenhuma das duas.
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

  it('o gabarito diz quantos são, e o tooltip ensina alguma coisa', () => {
    // Quem errou "costelas" não aprende nada lendo "costelas"; aprende lendo que
    // são doze pares, e que dois deles não chegam à frente.
    for (const o of OSSOS) {
      const c = CELULAS.find((x) => x.id === o.id)
      expect(c?.gabarito, o.id).toContain(o.nome)
      expect(c?.gabarito, o.id).toContain(String(o.quantidade))
      expect(c?.detalhe, o.id).toBe(o.detalhe)
    }
  })

  it('agrupa o gabarito por região e marca o crânio e o osso do quadril', () => {
    for (const c of CELULAS) expect(c.secao, c.id).toBeTruthy()
    const secoes = new Set(CELULAS.map((c) => c.secao))
    expect(secoes.size).toBe(6)

    const marcos = CONFIG.marcos ?? []
    expect(marcos).toHaveLength(2)
    expect([...(marcos[0]?.ids ?? [])].sort()).toEqual(
      OSSOS.filter((o) => o.regiao === 'Crânio')
        .map((o) => o.id)
        .sort(),
    )
    expect([...(marcos[1]?.ids ?? [])].sort()).toEqual(['ilio', 'isquio', 'pubis'])

    // Marco que aponta para célula inexistente nunca fecha, e o jogador nunca
    // descobre por quê.
    for (const marco of marcos) {
      for (const id of marco.ids) {
        expect(
          CELULAS.some((c) => c.id === id),
          id,
        ).toBe(true)
      }
    }
  })
})

describe('o corpo ao fundo', () => {
  const layout = CONFIG.layout
  if (layout?.tipo !== 'mapa') throw new Error('o jogo tem de ser de mapa')

  it('usa a caixa do desenho, e não outra', () => {
    expect(layout.largura).toBe(LARGURA_CORPO)
    expect(layout.altura).toBe(ALTURA_CORPO)
  })

  it('desenha a silhueta inteira, e nenhuma peça dela vale ponto', () => {
    expect(layout.inertes).toEqual(SILHUETA)
    const respondiveis = new Set(CELULAS.map((c) => c.id))
    for (const t of layout.inertes) {
      expect(respondiveis.has(t.id), `${t.id} é osso e está de fundo`).toBe(false)
      expect(t.d.length, t.id).toBeGreaterThan(0)
    }
    // Dois `path` com a mesma chave quebram a reconciliação do React e uma das
    // peças some do desenho.
    expect(new Set(layout.inertes.map((t) => t.id)).size).toBe(layout.inertes.length)
  })
})

describe('o formato da partida', () => {
  it('é cronometrada em quatro minutos, em ordem livre', () => {
    // 240 s para 32 células dão 7,5 s por osso: entre os 6,7 s das 27 UFs, que
    // é rajada, e os 10 s dos trinta estreitos, que é garimpo.
    expect(CONFIG.limiteSegundos).toBe(240)
    expect(CONFIG.ordem).toBe('livre')
    expect(CONFIG.teclado).toBe('texto')
  })

  it('não mostra rótulo: rótulo no desenho entregaria a resposta', () => {
    expect(CONFIG.mostrarRotulos).toBe(false)
    for (const c of CELULAS) expect(c.rotulo, c.id).toBeUndefined()
  })

  it('se apresenta como jogo de biológicas, e diz ao jogador o que o desenho é', () => {
    expect(esqueleto.id).toBe('esqueleto')
    expect(esqueleto.mecanica).toBe('grade')
    expect(esqueleto.categoria).toBe('biologicas')
    expect(esqueleto.comoJogar.length).toBeGreaterThanOrEqual(3)
    // A vista mista não pode ser segredo do código-fonte: quem joga vê uma
    // cabeça de perfil num corpo de frente e tem direito a saber por quê.
    expect(esqueleto.comoJogar.join(' ')).toMatch(/perfil/)
    expect(esqueleto.comoJogar.join(' ')).toMatch(/rótula|omoplata|perônio|cúbito/)
  })
})
