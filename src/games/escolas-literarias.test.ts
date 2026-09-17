import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { AUTORES, ESCOLAS, INDICE_DA_ESCOLA } from '@/data/escolas-literarias'
import type { Escola } from '@/data/escolas-literarias'
import { escolasLiterarias } from './escolas-literarias'

const baralho = (seed: number): readonly Carta[] =>
  escolasLiterarias.config().montarBaralho(mulberry32(seed))

/** Trinta sementes: uma carta só é conferida de verdade sob vários sorteios. */
const SEMENTES = Array.from({ length: 30 }, (_, i) => i + 1)

const escolhas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'escolha') throw new Error(`${c.id} devia ser de escolha`)
    return c
  })

const texto = (c: { kind: string; valor?: string }) => (c.kind === 'texto' ? (c.valor ?? '') : '')
const autorDa = (id: string) => {
  const a = AUTORES.find((x) => `escola-${x.id}` === id)
  if (!a) throw new Error(`${id} sem autor`)
  return a
}
const distancia = (a: Escola, b: Escola) =>
  Math.abs((INDICE_DA_ESCOLA.get(a) as number) - (INDICE_DA_ESCOLA.get(b) as number))

describe('baralho', () => {
  it('tem uma carta por autor', () => {
    const cartas = baralho(7)
    expect(cartas).toHaveLength(AUTORES.length)
    expect(cartas.map((c) => c.id.replace('escola-', '')).sort()).toEqual(
      AUTORES.map((a) => a.id).sort(),
    )
  })

  it('monta quatro opções distintas, com a certa entre elas', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        expect(c.alternativas, `${c.id} @${seed}`).toHaveLength(4)
        const valores = c.alternativas.map(texto)
        expect(new Set(valores).size, `${c.id} @${seed}: ${valores.join(' | ')}`).toBe(4)
        expect(valores[c.indiceCorreto], `${c.id} @${seed}`).toBe(autorDa(c.id).escola)
      }
    }
  })

  /**
   * O teste que justifica o jogo existir.
   *
   * Se o distrator puder ser qualquer escola, a carta se resolve por eliminação:
   * ninguém oferece Barroco para Drummond e espera hesitação. As três erradas têm
   * de ser as escolas que encostam na certa na linha do tempo — três posições é o
   * máximo, e só acontece nas pontas, onde não há vizinho dos dois lados.
   */
  it('todo distrator é escola vizinha no tempo, nunca uma escola qualquer', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        const certa = autorDa(c.id).escola
        for (const [i, alt] of c.alternativas.entries()) {
          if (i === c.indiceCorreto) continue
          const errada = texto(alt) as Escola
          expect(
            distancia(certa, errada),
            `${c.id} @${seed}: "${errada}" está longe demais de ${certa}`,
          ).toBeLessThanOrEqual(3)
        }
      }
    }
  })

  it('no miolo da linha do tempo os distratores ficam a duas posições', () => {
    // Os três mais próximos de uma escola do meio são ±1 e ±2. Distância 3 só é
    // aceitável nas pontas, e este teste é o que impede a regra de afrouxar em
    // silêncio para todo mundo.
    const pontas: readonly Escola[] = ['Barroco', 'Arcadismo', 'Modernismo (3ª fase)', 'Contemporâneo']
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        const certa = autorDa(c.id).escola
        if (pontas.includes(certa)) continue
        for (const [i, alt] of c.alternativas.entries()) {
          if (i === c.indiceCorreto) continue
          expect(distancia(certa, texto(alt) as Escola), `${c.id} @${seed}`).toBeLessThanOrEqual(2)
        }
      }
    }
  })

  it('oferece o par que de fato se confunde', () => {
    // Machado tem de ver Naturalismo na tela, e Bilac tem de ver Simbolismo: são
    // as opções que a pessoa marca quando sabe a época e não sabe a estética.
    const pares: readonly (readonly [string, Escola])[] = [
      ['machado-realista', 'Naturalismo'],
      ['aluisio', 'Realismo'],
      ['bilac', 'Simbolismo'],
      ['cruz-e-sousa', 'Parnasianismo'],
      ['mario', 'Modernismo (2ª fase)'],
      ['graciliano', 'Modernismo (1ª fase)'],
    ]

    for (const [id, vizinha] of pares) {
      const apareceu = SEMENTES.some((seed) =>
        escolhas(seed)
          .find((c) => c.id === `escola-${id}`)
          ?.alternativas.some((a) => texto(a) === vizinha),
      )
      expect(apareceu, `${id} nunca ofereceu "${vizinha}" em ${SEMENTES.length} sorteios`).toBe(true)
    }
  })

  it('varia o trio de distratores entre sementes', () => {
    // Empate de distância resolvido pelo sorteio: a escola anterior e a seguinte
    // estão à mesma distância, e as duas têm de aparecer ao longo das partidas.
    // Sem isso o jogador decoraria o trio em vez da matéria.
    const trios = new Set(
      SEMENTES.map((seed) => {
        const c = escolhas(seed).find((k) => k.id === 'escola-graciliano')
        return c?.alternativas.map(texto).sort().join('|') ?? ''
      }),
    )
    expect(trios.size).toBeGreaterThan(1)
  })

  it('só oferece escolas que existem na linha do tempo', () => {
    const nomes = new Set<string>(ESCOLAS.map((e) => e.nome))
    for (const c of escolhas(3)) {
      for (const a of c.alternativas) expect(nomes, c.id).toContain(texto(a))
    }
  })

  it('não deixa a resposta certa parada na mesma posição', () => {
    // Um bug de embaralhamento que sempre pusesse a certa em primeiro lugar não
    // quebraria nenhum teste acima e destruiria o jogo em silêncio.
    const posicoes = new Set(SEMENTES.flatMap((s) => escolhas(s).map((c) => c.indiceCorreto)))
    expect(posicoes).toEqual(new Set([0, 1, 2, 3]))
  })

  it('a mesma semente dá o mesmo baralho', () => {
    const resumo = (seed: number) =>
      escolhas(seed).map((c) => `${c.id}:${c.alternativas.map(texto).join(',')}`)
    expect(resumo(11)).toEqual(resumo(11))
    expect(resumo(11)).not.toEqual(resumo(12))
  })
})

describe('perguntas e gabarito', () => {
  it('põe a obra na pergunta só de quem atravessa escolas, e avisa por quê', () => {
    const cartas = escolhas(5)
    const romantico = cartas.find((c) => c.id === 'escola-machado-romantico')
    const realista = cartas.find((c) => c.id === 'escola-machado-realista')
    expect(texto(romantico?.pergunta ?? { kind: 'texto', valor: '' })).toBe(
      'Machado de Assis (Helena)',
    )
    expect(texto(realista?.pergunta ?? { kind: 'texto', valor: '' })).toBe(
      'Machado de Assis (Memórias Póstumas de Brás Cubas)',
    )
    expect(romantico?.explicacao).toContain('atravessou mais de uma')

    // E ninguém mais carrega parênteses: seria meia-resposta de graça.
    for (const c of cartas) {
      const a = autorDa(c.id)
      if (!a.precisaDaObra) {
        expect(texto(c.pergunta), c.id).toBe(a.nome)
        expect(c.explicacao, c.id).toBeUndefined()
      }
    }
  })

  it('duas perguntas nunca são iguais', () => {
    const perguntas = escolhas(9).map((c) => texto(c.pergunta))
    expect(new Set(perguntas).size).toBe(perguntas.length)
  })

  it('o gabarito diz a escola, quando ela foi e o que a define', () => {
    const c = escolhas(5).find((k) => k.id === 'escola-graciliano')
    expect(c?.gabarito).toContain('Modernismo (2ª fase)')
    expect(c?.gabarito).toContain('1930–1945')
    expect(c?.gabarito).toContain('Vidas Secas, 1938')
    expect(c?.gabarito).toContain('romance de 30')
  })

  it('não inventa ano para a obra que não tem data', () => {
    // Gregório só foi impresso em 1882, quase dois séculos depois de morrer.
    const c = escolhas(5).find((k) => k.id === 'escola-gregorio')
    expect(c?.gabarito).toContain('Boca do Inferno')
    // O período da escola continua ali; o que não pode existir é data colada na
    // obra, que é onde a invenção apareceria.
    expect(c?.gabarito).toMatch(/Inferno":/)
    expect(c?.gabarito).not.toMatch(/Inferno",\s*\d/)
  })
})

describe('declaração do jogo', () => {
  it('se declara como o registry espera', () => {
    expect(escolasLiterarias.id).toBe('escolas-literarias')
    expect(escolasLiterarias.mecanica).toBe('flashcard')
    expect(escolasLiterarias.categoria).toBe('humanas')
    expect(escolasLiterarias.config().fim).toBe('baralho')
  })

  it('o resumo e o comoJogar não prometem digitação', () => {
    // O jogo é de escolha por decisão explícita — ver o cabeçalho do módulo.
    const t = [escolasLiterarias.resumo, ...escolasLiterarias.comoJogar].join(' ')
    expect(t).not.toMatch(/escreva|digite/i)
  })
})
