import { describe, expect, it } from 'vitest'
import { distancia, limiteDeErro, normalizarTexto } from '@/core/answer'
import {
  ALTURA_CORPO,
  EIXO,
  LARGURA_CORPO,
  OSSOS,
  OSSOS_DO_CORPO,
  REGIOES,
  SILHUETA,
  espelhar,
} from './esqueleto'
import type { Osso, Ponto, Regiao } from './esqueleto'

/**
 * Este arquivo é a contrapartida da licença que o cabeçalho de `esqueleto.ts`
 * toma: lá está escrito que um esqueleto didático é um esquema e pode ser
 * desenhado à mão; aqui está medido o que esse esquema é obrigado a acertar.
 *
 * Sem isto, "desenhei à mão" seria só uma desculpa. Com isto, é uma afirmação
 * verificável: se alguém arrastar o fêmur para cima da clavícula, ou espelhar
 * meio osso, ou deixar um dedo fora da tela, o teste quebra.
 */

// ---------------------------------------------------------------------------
// Um leitor de `d` — o mesmo que `espelhar` pressupõe
// ---------------------------------------------------------------------------

const COMANDOS = /[A-Za-z][^A-Za-z]*/g
const NUMERO = /-?\d+(?:\.\d+)?/g

/**
 * Todos os pontos de um `d`, controles de Bézier inclusive.
 *
 * Incluir os controles é conservador e proposital: num arco de elipse escrito em
 * cúbicas os controles ficam dentro da caixa da própria elipse, então a medida de
 * "saiu da caixa" fica correta; e onde um controle ficasse fora, é porque o
 * desenho está passando perto demais da borda de qualquer jeito.
 */
function pontos(d: string): readonly Ponto[] {
  const saida: Ponto[] = []
  for (const trecho of d.match(COMANDOS) ?? []) {
    const numeros = trecho.slice(1).match(NUMERO) ?? []
    for (let i = 0; i < numeros.length; i += 2) {
      saida.push([Number(numeros[i]), Number(numeros[i + 1])])
    }
  }
  return saida
}

interface Caixa {
  readonly minX: number
  readonly maxX: number
  readonly minY: number
  readonly maxY: number
  readonly centroY: number
}

function caixa(ds: readonly string[]): Caixa {
  const todos = ds.flatMap((d) => [...pontos(d)])
  if (todos.length === 0) throw new Error('caixa de nada')
  const xs = todos.map(([x]) => x)
  const ys = todos.map(([, y]) => y)
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    // Média dos vértices, e não centro da caixa: um osso com uma ponta fina
    // longe (a mandíbula, o ísquio) tem massa onde estão os vértices.
    centroY: ys.reduce((a, b) => a + b, 0) / ys.length,
  }
}

const de = (id: string): Osso => {
  const osso = OSSOS.find((o) => o.id === id)
  if (!osso) throw new Error(`osso sumiu do dataset: ${id}`)
  return osso
}

const caixaDe = (id: string): Caixa => caixa([de(id).forma.d])

const caixaDaRegiao = (regiao: Regiao): Caixa =>
  caixa(OSSOS.filter((o) => o.regiao === regiao).map((o) => o.forma.d))

/** Chave de um ponto, para comparar conjunto com conjunto. */
const chave = ([x, y]: Ponto): string => `${x},${y}`

// ---------------------------------------------------------------------------

describe('o dado', () => {
  it('são 32 ossos, com id único em kebab-case e região conhecida', () => {
    expect(OSSOS).toHaveLength(32)
    expect(new Set(OSSOS.map((o) => o.id)).size).toBe(OSSOS.length)
    for (const o of OSSOS) {
      expect(o.id, o.nome).toMatch(/^[a-z][a-z-]*$/)
      expect(REGIOES, o.nome).toContain(o.regiao)
      expect(o.quantidade, o.nome).toBeGreaterThan(0)
      // Detalhe é o que se lê depois de errar: repetir o nome não ensina nada.
      expect(o.detalhe.length, o.nome).toBeGreaterThan(30)
      expect(normalizarTexto(o.detalhe), o.nome).not.toBe(normalizarTexto(o.nome))
    }
  })

  it('nenhuma região tem menos de dois ossos', () => {
    // Seção de um item no gabarito não agrupa nada, só ocupa linha.
    for (const r of REGIOES) {
      const n = OSSOS.filter((o) => o.regiao === r).length
      expect(n, r).toBeGreaterThan(1)
    }
  })

  it('fecha a conta dos 206 ossos do corpo', () => {
    const nomeados = OSSOS.reduce((soma, o) => soma + o.quantidade, 0)

    // Ílio, ísquio e púbis são **três** peças aqui e **uma** na contagem de
    // adulto: os três se fundem no osso do quadril por volta dos 15 anos, e o
    // manual conta o resultado (2 ossos do quadril, um de cada lado). O jogo
    // nomeia os três porque é assim que a escola ensina, então a conta tem de
    // devolver as quatro peças a mais que isso cria.
    const excedenteDoQuadril = 6 - 2

    // E ficam de fora, por decisão: onze ossos do crânio que a escola não cobra
    // (nasal, lacrimal, palatino, concha nasal inferior, vômer, etmoide,
    // esfenoide), os seis ossículos do ouvido e o hioide.
    const naoNomeados = 11 + 6 + 1

    expect(nomeados).toBe(192)
    expect(nomeados - excedenteDoQuadril + naoNomeados).toBe(OSSOS_DO_CORPO)
  })

  it('aceita os nomes que a escola brasileira ainda usa', () => {
    const esperado: Record<string, string> = {
      rótula: 'patela',
      omoplata: 'escapula',
      perônio: 'fibula',
      cúbito: 'ulna',
      'maxilar inferior': 'mandibula',
      'maxilar superior': 'maxila',
      'vértebras dorsais': 'vertebras-toracicas',
      canela: 'tibia',
    }
    for (const [forma, id] of Object.entries(esperado)) {
      const dono = OSSOS.filter((o) =>
        [o.nome, ...o.sinonimos].some((f) => normalizarTexto(f, true) === normalizarTexto(forma, true)),
      )
      expect(dono.map((o) => o.id), forma).toEqual([id])
    }
  })

  it('não repete nome nem sinônimo entre dois ossos', () => {
    const dono = new Map<string, string>()
    for (const o of OSSOS) {
      for (const forma of [o.nome, ...o.sinonimos]) {
        const k = normalizarTexto(forma, true)
        const anterior = dono.get(k)
        expect(anterior ?? o.id, `"${forma}" serve a ${anterior} e a ${o.id}`).toBe(o.id)
        dono.set(k, o.id)
      }
    }
  })

  it('nenhum par de nomes cabe dentro do raio de perdão do outro', () => {
    // A mesma medida dos mapas. É ela que autoriza deixar `tolerarTypo` ligado:
    // sem ela, "metatarso" poderia acender o metacarpo.
    const formas = OSSOS.flatMap((o) =>
      [o.nome, ...o.sinonimos].map((f) => ({ id: o.id, chave: normalizarTexto(f, true) })),
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
})

// ---------------------------------------------------------------------------
// Geometria: o que o desenho à mão é obrigado a acertar
// ---------------------------------------------------------------------------

describe('o traço', () => {
  const TODOS = [...OSSOS.map((o) => o.forma.d), ...SILHUETA.map((s) => s.d)]

  it('só usa comandos absolutos que o espelho entende', () => {
    // Um `A`, um `h` ou um `c` minúsculo no meio de um `d` faria `espelhar`
    // produzir meio osso no lugar errado — e em silêncio, se não fosse o
    // `throw` de lá e este teste aqui.
    for (const d of TODOS) {
      for (const trecho of d.match(COMANDOS) ?? []) {
        expect(['M', 'L', 'C', 'Q', 'Z'], d.slice(0, 40)).toContain(trecho[0])
      }
    }
  })

  it('não põe um único ponto fora da caixa', () => {
    // Margem de 2 px: o traço do SVG tem 0,3 de largura e é centrado no
    // contorno, então encostar na borda já corta.
    for (const o of OSSOS) {
      const c = caixaDe(o.id)
      expect(c.minX, `${o.nome}: esquerda`).toBeGreaterThan(2)
      expect(c.maxX, `${o.nome}: direita`).toBeLessThan(LARGURA_CORPO - 2)
      expect(c.minY, `${o.nome}: topo`).toBeGreaterThan(2)
      expect(c.maxY, `${o.nome}: base`).toBeLessThan(ALTURA_CORPO - 2)
    }
    for (const s of SILHUETA) {
      const c = caixa([s.d])
      expect(c.minX, s.id).toBeGreaterThan(2)
      expect(c.maxX, s.id).toBeLessThan(LARGURA_CORPO - 2)
      expect(c.minY, s.id).toBeGreaterThan(2)
      expect(c.maxY, s.id).toBeLessThan(ALTURA_CORPO - 2)
    }
  })

  it('espelhar é a sua própria inversa, e explode no que não sabe espelhar', () => {
    for (const o of OSSOS) {
      expect(espelhar(espelhar(o.forma.d)), o.nome).toBe(o.forma.d)
    }
    expect(() => espelhar('M10,10A5,5 0 0 1 20,20Z')).toThrow(/espelh/)
    expect(() => espelhar('m10,10l5,5z')).toThrow(/espelh/)
  })
})

describe('a simetria do boneco', () => {
  /** O conjunto de pontos é igual ao conjunto de pontos refletidos no eixo. */
  const simetrico = (d: string): boolean => {
    const originais = pontos(d).map(chave).sort()
    const refletidos = pontos(espelhar(d)).map(chave).sort()
    return originais.join(';') === refletidos.join(';')
  }

  it('todo osso par é exatamente o espelho de si mesmo', () => {
    const pares = OSSOS.filter((o) => o.simetria === 'par')
    expect(pares.length).toBeGreaterThan(18)
    for (const o of pares) expect(simetrico(o.forma.d), o.nome).toBe(true)
  })

  it('todo osso ímpar de linha média também é, e está centrado no eixo', () => {
    const medianos = OSSOS.filter((o) => o.simetria === 'mediana')
    expect(medianos.map((o) => o.id)).toEqual([
      'vertebras-cervicais',
      'vertebras-toracicas',
      'vertebras-lombares',
      'sacro',
      'coccix',
      'esterno',
    ])
    for (const o of medianos) {
      expect(simetrico(o.forma.d), o.nome).toBe(true)
      const c = caixaDe(o.id)
      expect((c.minX + c.maxX) / 2, `${o.nome}: centro`).toBeCloseTo(EIXO, 6)
    }
  })

  it('os do crânio são os únicos assimétricos, e é porque a cabeça está de perfil', () => {
    // Controle do teste acima: se `simetrico` devolvesse `true` para tudo, ele
    // não estaria medindo nada. Estes sete têm de dar `false`.
    for (const o of OSSOS) {
      const esperado = o.simetria !== 'perfil'
      expect(simetrico(o.forma.d), `${o.nome} (${o.simetria})`).toBe(esperado)
    }
    const perfil = OSSOS.filter((o) => o.simetria === 'perfil')
    expect(perfil.every((o) => o.regiao === 'Crânio')).toBe(true)
    expect(perfil).toHaveLength(7)
  })

  it('o corpo da silhueta é simétrico; a cabeça dela, não', () => {
    const corpo = SILHUETA.find((s) => s.id === 'silhueta-corpo')
    const cabeca = SILHUETA.find((s) => s.id === 'silhueta-cabeca')
    expect(simetrico(corpo?.d ?? ''), 'o corpo').toBe(true)
    expect(simetrico(cabeca?.d ?? ''), 'a cabeça').toBe(false)
  })
})

describe('a ordem vertical', () => {
  it('crânio acima do tórax, tórax acima da pelve, pelve acima das pernas', () => {
    const cranio = caixaDaRegiao('Crânio')
    const torax = caixaDaRegiao('Tórax')
    const pelve = caixaDaRegiao('Pelve')
    const pernas = caixaDaRegiao('Membros inferiores')

    expect(cranio.centroY).toBeLessThan(torax.centroY)
    expect(torax.centroY).toBeLessThan(pelve.centroY)
    expect(pelve.centroY).toBeLessThan(pernas.centroY)

    // E não é só o centro: nada do crânio desce até o tórax, e nada do tórax
    // sobe até o crânio.
    expect(cranio.maxY).toBeLessThan(torax.minY)
    expect(torax.maxY).toBeLessThan(pelve.maxY)
  })

  it('a coluna desce na ordem: cervicais, torácicas, lombares, sacro, cóccix', () => {
    const ordem = [
      'vertebras-cervicais',
      'vertebras-toracicas',
      'vertebras-lombares',
      'sacro',
      'coccix',
    ]
    const caixas = ordem.map((id) => ({ id, c: caixaDe(id) }))
    for (let i = 1; i < caixas.length; i++) {
      const acima = caixas[i - 1] as { id: string; c: Caixa }
      const abaixo = caixas[i] as { id: string; c: Caixa }
      expect(acima.c.maxY, `${acima.id} tem de acabar antes de ${abaixo.id}`).toBeLessThanOrEqual(
        abaixo.c.minY,
      )
    }
    // A coluna inteira, do atlas ao cóccix, cobre metade do boneco.
    const inteira = caixa(ordem.map((id) => de(id).forma.d))
    expect(inteira.maxY - inteira.minY).toBeGreaterThan(ALTURA_CORPO * 0.35)
  })

  it('a clavícula fica acima das costelas e a escápula não passa da última', () => {
    const clavicula = caixaDe('clavicula')
    const costelas = caixaDe('costelas')
    expect(clavicula.centroY).toBeLessThan(costelas.centroY)
    expect(clavicula.maxY).toBeLessThan(costelas.minY + 12)
    expect(caixaDe('escapula').maxY).toBeLessThan(costelas.maxY)
  })

  it('o ílio fica acima do ísquio e do púbis, que é a ordem do osso do quadril', () => {
    const ilio = caixaDe('ilio')
    expect(ilio.centroY).toBeLessThan(caixaDe('isquio').centroY)
    expect(ilio.centroY).toBeLessThan(caixaDe('pubis').centroY)
    // A crista ilíaca sobe acima do sacro: é o que se apalpa na cintura.
    expect(ilio.minY).toBeLessThan(caixaDe('sacro').minY)
  })

  it('a patela fica sobre o joelho, entre a ponta do fêmur e a da tíbia', () => {
    const femur = caixaDe('femur')
    const patela = caixaDe('patela')
    const tibia = caixaDe('tibia')

    // O vão entre a ponta do fêmur e o platô da tíbia é a articulação; a patela
    // tem de estar centrada nele. A folga é de 4 px numa caixa de 1000 — o que
    // se cobra é "está sobre o joelho", não a posição ao décimo.
    const joelho = (femur.maxY + tibia.minY) / 2
    const centroDaPatela = (patela.minY + patela.maxY) / 2
    expect(Math.abs(centroDaPatela - joelho), 'a patela saiu do vão do joelho').toBeLessThan(4)

    // E no mesmo x da ponta do fêmur, senão ela flutuaria ao lado do joelho.
    //
    // Só a perna esquerda entra na conta: com as duas, os dois centros cairiam
    // no eixo por simetria e o teste passaria sem medir nada — seria possível
    // pôr as patelas na virilha que ele não acusaria.
    const esquerda = (d: string, filtro: (p: Ponto) => boolean): number => {
      const xs = pontos(d)
        .filter((p) => p[0] < EIXO && filtro(p))
        .map(([x]) => x)
      return (Math.min(...xs) + Math.max(...xs)) / 2
    }
    const centroDaPonta = esquerda(de('femur').forma.d, ([, y]) => y > femur.maxY - 6)
    const patelaEsquerda = esquerda(de('patela').forma.d, () => true)
    expect(Math.abs(patelaEsquerda - centroDaPonta), 'a patela ao lado do fêmur').toBeLessThan(4)
  })

  it('a fíbula não chega ao joelho, e é lateral à tíbia', () => {
    const tibia = caixaDe('tibia')
    const fibula = caixaDe('fibula')
    expect(fibula.minY).toBeGreaterThan(tibia.minY)
    // Lateral = mais longe do eixo. Comparado no lado esquerdo do desenho, onde
    // "mais longe" quer dizer x menor.
    expect(fibula.minX).toBeLessThan(tibia.minX)
  })

  it('o rádio é lateral à ulna, que é o que faz "o do lado do polegar" ser verdade', () => {
    expect(caixaDe('radio').minX).toBeLessThan(caixaDe('ulna').minX)
    // E a mão vem depois das duas.
    expect(caixaDe('carpo').minY).toBeGreaterThan(caixaDe('ulna').maxY - 4)
    expect(caixaDe('falanges-mao').minY).toBeGreaterThan(caixaDe('metacarpo').minY)
  })
})

describe('as proporções que o esquema promete', () => {
  const comprimento = (id: string): number => {
    const c = caixaDe(id)
    return c.maxY - c.minY
  }

  it('o fêmur é o osso mais longo do desenho, como é no corpo', () => {
    const maior = OSSOS.map((o) => ({ id: o.id, h: comprimento(o.id) })).sort((a, b) => b.h - a.h)
    expect(maior[0]?.id).toBe('femur')
    expect(maior[1]?.id).toBe('tibia')
  })

  it('e é uns 20% mais longo que a tíbia, que é a razão do corpo de verdade', () => {
    // Fêmur ≈ 26,7% da estatura, tíbia ≈ 22,2%: razão 1,20. Aqui a folga é
    // larga de propósito — o que se promete é a ordem de grandeza, não a medida.
    const razao = comprimento('femur') / comprimento('tibia')
    expect(razao).toBeGreaterThan(1.1)
    expect(razao).toBeLessThan(1.35)
  })

  it('o úmero é mais longo que a ulna, e a ulna que o metacarpo', () => {
    expect(comprimento('umero')).toBeGreaterThan(comprimento('ulna'))
    expect(comprimento('ulna')).toBeGreaterThan(comprimento('metacarpo'))
  })

  it('a cabeça cabe em pouco mais de um sétimo do boneco', () => {
    // Regra de desenho de figura humana: adulto tem sete cabeças e meia de
    // altura. Aqui a caixa do crânio vai do alto ao queixo.
    const cranio = caixaDaRegiao('Crânio')
    const alturaDaCabeca = cranio.maxY - cranio.minY
    expect(ALTURA_CORPO / alturaDaCabeca).toBeGreaterThan(6.5)
    expect(ALTURA_CORPO / alturaDaCabeca).toBeLessThan(8.5)
  })

  it('o boneco ocupa a caixa toda, sem sobrar tarja', () => {
    const tudo = caixa(SILHUETA.map((s) => s.d))
    expect(tudo.maxY - tudo.minY).toBeGreaterThan(ALTURA_CORPO * 0.97)
    expect(tudo.maxX - tudo.minX).toBeGreaterThan(LARGURA_CORPO * 0.8)
  })
})

describe('a silhueta ao fundo', () => {
  it('não vale ponto: nenhum id dela é osso', () => {
    const respondiveis = new Set(OSSOS.map((o) => o.id))
    for (const s of SILHUETA) {
      expect(respondiveis.has(s.id), `${s.id} é osso e está de fundo`).toBe(false)
      expect(s.d.length).toBeGreaterThan(0)
    }
    expect(new Set(SILHUETA.map((s) => s.id)).size).toBe(SILHUETA.length)
  })

  it('cobre o esqueleto inteiro, e com folga de pele', () => {
    // O osso dentro do corpo é o mínimo que se pede de um desenho de corpo: um
    // fêmur saindo pela coxa seria visível de longe, e nenhum teste de ordem
    // vertical pegaria.
    const fundo = caixa(SILHUETA.map((s) => s.d))
    const ossos = caixa(OSSOS.map((o) => o.forma.d))
    expect(fundo.minX).toBeLessThanOrEqual(ossos.minX)
    expect(fundo.maxX).toBeGreaterThanOrEqual(ossos.maxX)
    expect(fundo.minY).toBeLessThanOrEqual(ossos.minY)
    expect(fundo.maxY).toBeGreaterThanOrEqual(ossos.maxY)
  })
})
