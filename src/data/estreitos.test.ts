import countries from 'world-countries'
import { describe, expect, it } from 'vitest'
import { distancia, limiteDeErro, normalizarTexto } from '@/core/answer'
import { ALTURA_MAPA, FORMAS, INERTES, LARGURA_MAPA } from './paises-mapa'
import { PASSAGENS, pontoDe, projetar } from './estreitos'

/**
 * O teste que sustenta o arquivo inteiro: a projeção reimplementada em
 * `estreitos.ts` tem de dar exatamente o que o `d3-geo` deu quando gerou o
 * mapa-múndi.
 *
 * A prova vem de graça e de fora: `scripts/gen-paises.mjs` projetou a
 * coordenada de 29 micro-estados com o d3 e gravou o resultado em
 * `paises-mapa.ts`. As coordenadas de origem estão no `world-countries`, que é
 * a fonte que o gerador usou. Comparar as duas pontas é confrontar quinze
 * linhas de polinômio com a biblioteca de verdade, sem eu escolher nenhum dos
 * dois lados.
 *
 * Se um dia o gerador trocar de projeção ou de caixa, este teste quebra — e tem
 * de quebrar, porque os pontos dos estreitos iriam para o lugar errado em
 * silêncio.
 */
// Importado como módulo, e não lido de `node_modules` com `fs`: o tsconfig do
// app não declara os tipos do Node de propósito — nada em `src/` roda fora do
// navegador —, e o pacote já traz os seus.
const MUNDO: readonly { readonly cca2: string; readonly latlng: readonly number[] }[] = countries

describe('a projeção Natural Earth reimplementada', () => {
  it('reproduz os pontos que o d3 gerou para os micro-estados', () => {
    const pontos = Object.entries(FORMAS).filter(
      (par): par is [string, { x: number; y: number }] => !('d' in par[1]),
    )
    expect(pontos.length, 'o mapa-múndi tem micro-estados como ponto').toBeGreaterThan(20)

    let conferidos = 0
    for (const [id, esperado] of pontos) {
      const pais = MUNDO.find((c) => c.cca2.toLowerCase() === id)
      if (!pais) continue
      const lat = pais.latlng[0] as number
      const lon = pais.latlng[1] as number
      const nosso = projetar(lon, lat)
      // O arquivo gerado arredonda para uma casa decimal; a folga é essa e
      // nenhuma outra.
      expect(nosso.x, `${id}: x`).toBeCloseTo(esperado.x, 1)
      expect(nosso.y, `${id}: y`).toBeCloseTo(esperado.y, 1)
      conferidos++
    }
    expect(conferidos, 'nenhum ponto conferido é teste que não testa').toBeGreaterThan(20)
  })

  it('põe o equador e Greenwich onde o mapa os põe', () => {
    const centro = projetar(0, 0)
    expect(centro.x).toBeCloseTo(LARGURA_MAPA / 2, 6)
    // Não é a metade da altura: a Natural Earth corta em ±90° e a caixa foi
    // ajustada ao contorno do mundo, que vai da Antártida ao Ártico canadense.
    expect(centro.y).toBeGreaterThan(200)
    expect(centro.y).toBeLessThan(300)
  })

  it('o hemisfério norte fica em cima e o leste à direita', () => {
    // Trocar o sinal do y é o erro silencioso mais fácil de cometer aqui.
    expect(projetar(0, 60).y).toBeLessThan(projetar(0, -60).y)
    expect(projetar(-120, 0).x).toBeLessThan(projetar(120, 0).x)
  })
})

describe('as passagens', () => {
  it('são trinta, com id único e em kebab-case', () => {
    expect(PASSAGENS).toHaveLength(30)
    expect(new Set(PASSAGENS.map((p) => p.id)).size).toBe(PASSAGENS.length)
    for (const p of PASSAGENS) expect(p.id, p.nome).toMatch(/^[a-z][a-z-]*$/)
  })

  it('têm coordenada plausível e caem dentro da caixa do mapa', () => {
    for (const p of PASSAGENS) {
      expect(p.lon, p.nome).toBeGreaterThanOrEqual(-180)
      expect(p.lon, p.nome).toBeLessThanOrEqual(180)
      expect(p.lat, p.nome).toBeGreaterThanOrEqual(-85)
      expect(p.lat, p.nome).toBeLessThanOrEqual(85)

      const { x, y } = pontoDe(p)
      // Margem de 3 px: o marcador tem raio 2,6 e não pode nascer cortado pela
      // borda do SVG.
      expect(x, `${p.nome}: x`).toBeGreaterThan(3)
      expect(x, `${p.nome}: x`).toBeLessThan(LARGURA_MAPA - 3)
      expect(y, `${p.nome}: y`).toBeGreaterThan(3)
      expect(y, `${p.nome}: y`).toBeLessThan(ALTURA_MAPA - 3)
    }
  })

  it('nenhum par de marcadores se sobrepõe na tela', () => {
    // Dois pontos a menos de 5 px viram um borrão só, e o jogador não tem como
    // saber qual dos dois acendeu. É o limite prático de quantos estreitos
    // cabem num mapa-múndi desta largura.
    for (const a of PASSAGENS) {
      for (const b of PASSAGENS) {
        if (a.id >= b.id) continue
        const pa = pontoDe(a)
        const pb = pontoDe(b)
        const d = Math.hypot(pa.x - pb.x, pa.y - pb.y)
        expect(d, `${a.nome} e ${b.nome} a ${d.toFixed(1)} px`).toBeGreaterThan(5)
      }
    }
  })

  it('não repetem nome nem sinônimo entre passagens diferentes', () => {
    const dono = new Map<string, string>()
    for (const p of PASSAGENS) {
      for (const forma of [p.nome, ...p.sinonimos]) {
        const chave = normalizarTexto(forma, true)
        const anterior = dono.get(chave)
        expect(anterior ?? p.id, `"${forma}" serve a ${anterior} e a ${p.id}`).toBe(p.id)
        dono.set(chave, p.id)
      }
    }
  })

  it('nenhum par de nomes cabe dentro do raio de perdão do outro', () => {
    // A mesma medida que o mapa dos estados faz. Sem ela, "Bass" ganharia o
    // ponto de "Bab" e o jogador veria o marcador errado acender.
    const formas = PASSAGENS.flatMap((p) =>
      [p.nome, ...p.sinonimos].map((f) => ({ id: p.id, chave: normalizarTexto(f, true) })),
    )
    for (const a of formas) {
      for (const b of formas) {
        if (a.id === b.id) continue
        const limite = Math.max(limiteDeErro(a.chave.length), limiteDeErro(b.chave.length))
        if (limite === 0) continue
        expect(
          distancia(a.chave, b.chave, limite),
          `"${a.chave}" (${a.id}) e "${b.chave}" (${b.id})`,
        ).toBeGreaterThan(limite)
      }
    }
  })

  it('os escavados são quatro, e são esses quatro', () => {
    const obras = PASSAGENS.filter((p) => p.tipo === 'escavado').map((p) => p.id)
    expect(obras.sort()).toEqual(['corinto', 'kiel', 'panama', 'suez'])
  })

  it('toda passagem diz o que liga, o que separa e em que bacia está', () => {
    const bacias = new Map<string, number>()
    for (const p of PASSAGENS) {
      expect(p.liga.length, p.nome).toBeGreaterThan(8)
      expect(p.separa.length, p.nome).toBeGreaterThan(8)
      bacias.set(p.bacia, (bacias.get(p.bacia) ?? 0) + 1)
    }
    // Cinco seções no gabarito, nenhuma com uma passagem só: seção de um item
    // não agrupa nada, só ocupa linha.
    expect(bacias.size).toBe(5)
    for (const [b, n] of bacias) expect(n, b).toBeGreaterThan(2)
  })
})

// ---------------------------------------------------------------------------
// O que a resolução do mapa não dá conta de mostrar
// ---------------------------------------------------------------------------

type Anel = readonly (readonly [number, number])[]

/**
 * Converte um `d` de `paises-mapa.ts` em anéis. Só há `M`, `L` e `Z` ali — o
 * gerador do d3 emite polígono puro —, então o parser pode ser este.
 */
function aneis(d: string): readonly Anel[] {
  return d
    .split('M')
    .filter((s) => s.trim() !== '')
    .map((sub) =>
      sub
        .replace(/Z\s*$/, '')
        .split('L')
        .map((par) => par.split(',').map(Number) as [number, number]),
    )
}

/** Cruzamentos por raio, regra par-ímpar: buraco de polígono conta como fora. */
function dentro(x: number, y: number, anel: Anel): boolean {
  let bate = false
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i] as [number, number]
    const [xj, yj] = anel[j] as [number, number]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) bate = !bate
  }
  return bate
}

const TERRA: readonly Anel[] = [
  ...Object.values(FORMAS).flatMap((f) => ('d' in f ? aneis(f.d) : [])),
  ...INERTES.flatMap((t) => aneis(t.d)),
]

function caiEmTerraDesenhada(lon: number, lat: number): boolean {
  const { x, y } = projetar(lon, lat)
  let dentroDeAlgum = false
  for (const anel of TERRA) {
    if (dentro(x, y, anel)) dentroDeAlgum = !dentroDeAlgum
  }
  return dentroDeAlgum
}

describe('o marcador contra o contorno do mapa', () => {
  it('o parser de contorno entende o que o gerador escreveu', () => {
    // Controle: sem isto, um parser quebrado devolveria "nada em terra" e o
    // teste de baixo passaria dizendo o contrário do que mede.
    expect(TERRA.length).toBeGreaterThan(200)
    expect(caiEmTerraDesenhada(-47.9, -15.8), 'Brasília é terra').toBe(true)
    expect(caiEmTerraDesenhada(2.35, 48.86), 'Paris é terra').toBe(true)
    expect(caiEmTerraDesenhada(-30, -25), 'meio do Atlântico Sul é água').toBe(false)
    expect(caiEmTerraDesenhada(-140, 0), 'meio do Pacífico é água').toBe(false)
  })

  /**
   * A lista congelada das passagens que o Natural Earth 110m não consegue
   * desenhar abertas.
   *
   * Não é defeito de coordenada, é a resolução da fonte: o Bósforo tem 700 m de
   * largura e o Canal de Suez tem 200 m, contra os ~400 m que um pixel deste
   * mapa vale no equador. A costa se fecha por cima e o marcador aparece sobre
   * terra cinza. Dito no `comoJogar` do jogo, e congelado aqui: se a lista
   * mudar, ou alguém errou uma coordenada, ou o mapa trocou de resolução — e
   * das duas uma tem de ser decisão, não surpresa.
   */
  it('só estas caem sobre terra desenhada, e é por largura, não por erro', () => {
    const emTerra = PASSAGENS.filter((p) => caiEmTerraDesenhada(p.lon, p.lat))
      .map((p) => p.id)
      .sort()
    expect(emTerra).toEqual(['corinto', 'dardanelos', 'kiel', 'oresund', 'panama', 'suez'].sort())
  })

  it('e o que sobra é coerente: quem fecha é o canal mais estreito que o pixel', () => {
    // Bósforo, Kerch e Messina passam porque o Natural Earth desenha essas três
    // como polígonos separados — Sicília não é a Itália, a Crimeia não é Taman
    // —, e a fresta entre eles sobrou aberta. Não é sorte nossa: é o dado
    // dizendo onde ele ainda consegue separar duas terras.
    for (const id of ['bosforo', 'kerch', 'messina']) {
      const p = PASSAGENS.find((x) => x.id === id)
      if (!p) throw new Error(`passagem sumiu: ${id}`)
      expect(caiEmTerraDesenhada(p.lon, p.lat), p.nome).toBe(false)
    }
  })

  it('as passagens largas caem na água, como têm de cair', () => {
    // Drake tem 800 km, Moçambique 400, Bering 82. Se um destes for parar em
    // terra, a coordenada está errada de verdade — aqui a resolução não tem
    // desculpa a dar.
    for (const id of ['drake', 'mocambique', 'bering', 'mancha', 'bass', 'davis', 'malaca']) {
      const p = PASSAGENS.find((x) => x.id === id)
      if (!p) throw new Error(`passagem sumiu: ${id}`)
      expect(caiEmTerraDesenhada(p.lon, p.lat), p.nome).toBe(false)
    }
  })
})
