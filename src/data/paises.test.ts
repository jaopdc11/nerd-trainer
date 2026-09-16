import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro, normalizarTexto } from '@/core/answer'
import { ALTURA_MAPA, FORMAS, INERTES, LARGURA_MAPA } from './paises-mapa'
import { PAISES } from './paises'

describe('o conjunto', () => {
  it('os SOBERANOS são 195: os 193 da ONU mais Vaticano e Palestina', () => {
    // O total cresceu com os territórios, mas a lista da ONU não muda. Contar
    // só os soberanos é o que impede um território entrar de contrabando.
    expect(PAISES.filter((p) => p.soberano)).toHaveLength(195)
    const ids = PAISES.map((p) => p.id)
    expect(ids).toContain('va')
    expect(ids).toContain('ps')
  })

  it('não repete id nem nome', () => {
    expect(new Set(PAISES.map((p) => p.id)).size).toBe(PAISES.length)
    expect(new Set(PAISES.map((p) => normalizarTexto(p.nome, true))).size).toBe(PAISES.length)
  })

  it('todo continente tem país, e nenhum país ficou sem continente', () => {
    const porContinente = new Map<string, number>()
    for (const p of PAISES) porContinente.set(p.continente, (porContinente.get(p.continente) ?? 0) + 1)
    for (const c of ['África', 'América', 'Ásia', 'Europa', 'Oceania']) {
      expect(porContinente.get(c), `${c} está vazio`).toBeGreaterThan(9)
    }
    expect([...porContinente.values()].reduce((a, b) => a + b, 0)).toBe(PAISES.length)
  })
})

/**
 * A contaminação de português europeu, de novo.
 *
 * Nos elementos ela vinha da Wikipédia lusófona; aqui vem do próprio pacote de
 * dados, cujo `translations.por` é de Portugal. É o mesmo teste de regressão do
 * "Azoto" por Nitrogênio, agora com a regra -ónia/-ônia e uma lista do que não
 * segue regra nenhuma.
 */
describe('português do Brasil', () => {
  it('nada de -ónia, -ónio, -énia ou -énio', () => {
    for (const p of PAISES) {
      expect(p.nome, `${p.id}: ${p.nome}`).not.toMatch(/[óé]n[ia]/)
    }
  })

  it('nenhuma das formas lusitanas conhecidas', () => {
    const lusitanas = [
      'Irão', 'Vietname', 'Iémen', 'Zimbabué', 'Zimbabwe', 'Chéquia', 'Perú',
      'Madagáscar', 'Turquemenistão', 'Trinidade e Tobago', 'Suazilândia',
      'Djibouti', 'Bielorússia', 'Holanda', 'Botswana', 'Azerbeijão',
      'São Vincente e Granadinas', 'Cidade do Vaticano',
    ]
    const nomes = new Set(PAISES.map((p) => p.nome))
    for (const errada of lusitanas) {
      expect(nomes.has(errada), `"${errada}" é a forma de Portugal, ou erro do pacote`).toBe(false)
    }
  })

  it('as correções conferidas à mão estão lá', () => {
    const nome = (id: string) => PAISES.find((p) => p.id === id)?.nome
    expect(nome('ir')).toBe('Irã')
    expect(nome('vn')).toBe('Vietnã')
    expect(nome('pl')).toBe('Polônia')
    expect(nome('ke')).toBe('Quênia')
    expect(nome('nl')).toBe('Países Baixos')
    expect(nome('cz')).toBe('Tchéquia')
    expect(nome('zw')).toBe('Zimbábue')
    expect(nome('pe')).toBe('Peru')
  })

  it('a forma que caiu em desuso continua valendo como sinônimo', () => {
    // Quem digita "Holanda" sabe o país; recusar seria pedantismo.
    const sinonimos = (id: string) => PAISES.find((p) => p.id === id)?.sinonimos ?? []
    expect(sinonimos('nl')).toContain('Holanda')
    expect(sinonimos('sz')).toContain('Suazilândia')
    expect(sinonimos('mm')).toContain('Myanmar')
    expect(sinonimos('us')).toContain('EUA')
  })
})

describe('geometria', () => {
  it('todo país tem forma — nenhum fica fora do tabuleiro', () => {
    for (const p of PAISES) {
      expect(FORMAS[p.id], `${p.nome} não tem nem contorno nem ponto`).toBeDefined()
    }
  })

  it('não sobra forma sem país', () => {
    const ids = new Set(PAISES.map((p) => p.id))
    for (const id of Object.keys(FORMAS)) expect(ids.has(id), id).toBe(true)
  })

  it('os micro-estados viraram ponto, dentro da caixa da projeção', () => {
    const pontos = PAISES.filter((p) => !('d' in (FORMAS[p.id] ?? {})))
    // 29 dos 195 são menores que um pixel no 110m.
    expect(pontos.length).toBeGreaterThan(20)
    for (const p of pontos) {
      const f = FORMAS[p.id] as { x: number; y: number }
      expect(f.x, p.nome).toBeGreaterThanOrEqual(0)
      expect(f.x, p.nome).toBeLessThanOrEqual(LARGURA_MAPA)
      expect(f.y, p.nome).toBeGreaterThanOrEqual(0)
      expect(f.y, p.nome).toBeLessThanOrEqual(ALTURA_MAPA)
    }
  })

  it('Singapura, Malta e Vaticano estão entre os pontos', () => {
    for (const id of ['sg', 'mt', 'va']) expect(FORMAS[id]).not.toHaveProperty('d')
  })

  it('os grandes têm contorno', () => {
    for (const id of ['br', 'ru', 'us', 'cn', 'au']) expect(FORMAS[id]).toHaveProperty('d')
  })

  it('os inertes não colidem com país respondível', () => {
    const respondiveis = new Set(PAISES.map((p) => p.id))
    for (const t of INERTES) {
      expect(respondiveis.has(t.id), `${t.id} está nos dois lados`).toBe(false)
    }
  })
})

describe('bandeiras', () => {
  /**
   * A existência do arquivo é garantida no gerador, não aqui: ele copia uma
   * bandeira por país e o `copyFileSync` lança se a origem não existir. O que
   * sobra para este teste é o contrato do nome — o id É o nome do arquivo, e um
   * id fora do formato viraria um 404 silencioso em cima da carta.
   */
  it('o id serve de nome de arquivo: duas letras minúsculas', () => {
    for (const p of PAISES) {
      expect(p.id, `${p.nome} tem id inválido`).toMatch(/^[a-z]{2}$/)
    }
  })
})

/**
 * A medição que libera a tolerância a erro de digitação nos dois jogos de país.
 *
 * A versão anterior deste teste concluía o contrário — "há pares perigosos, logo
 * `tolerarTypo: false`" — e estava errada por um motivo bobo: ela varria todas as
 * formas contra todas **sem separar por país**, então os cinco pares que
 * encontrava eram sinônimos do mesmo país (Bielorrússia/Bielorússia,
 * Tchéquia/Chéquia, Mianmar/Myanmar, Timor-Leste/Timor Leste e uma duplicata do
 * Congo). Nenhum deles era ambíguo coisa nenhuma: casar os dois lados preenche a
 * mesma célula.
 *
 * Refeita país contra país, já com as chaves compactadas e o limite escalado por
 * tamanho, a conta dá zero. O teste falha se algum dia parar de dar.
 */
describe('ambiguidade entre nomes', () => {
  const formas = PAISES.flatMap((p) =>
    [p.nome, ...p.sinonimos].map((n) => ({ id: p.id, chave: chaveDeTexto(n, true) })),
  )

  it('nenhum texto cai dentro da tolerância de dois países diferentes', () => {
    const perigosos: string[] = []

    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i] as (typeof formas)[number]
        const b = formas[j] as (typeof formas)[number]
        if (a.id === b.id) continue
        // Mesma régua da validação: na dúvida sobre qual limite vale, o maior.
        const limite = Math.max(limiteDeErro(a.chave.length), limiteDeErro(b.chave.length))
        if (limite === 0) continue
        if (distancia(a.chave, b.chave, limite) <= limite) {
          perigosos.push(`${a.id}:${a.chave} / ${b.id}:${b.chave}`)
        }
      }
    }

    expect(perigosos, 'religar a tolerância só é seguro enquanto isto estiver vazio').toEqual([])
  })

  it('o par mais próximo é Áustria/Austrália, e ainda sobra uma folga', () => {
    // A folga é de um caractere: distância 2 com limite 1. Não é muito — é por
    // isso que a trava de vizinhança existe, e é ela que decide os casos em que
    // o texto digitado encosta nos dois.
    expect(distancia('austria', 'australia', 3)).toBe(2)
    expect(limiteDeErro('austria'.length)).toBe(1)
  })

  it('"Congo" vale para os dois Congos, de propósito', () => {
    const aceita = (id: string) => {
      const p = PAISES.find((k) => k.id === id)
      return [p?.nome ?? '', ...(p?.sinonimos ?? [])].map((n) => chaveDeTexto(n, true))
    }
    expect(aceita('cg')).toContain('congo')
    expect(aceita('cd')).toContain('congo')
    // Na grade, cada "congo" digitado preenche o primeiro Congo ainda vazio.
  })

  it('Coreia, Sudão, Guiné e Irlanda não ganharam forma curta ambígua', () => {
    const chaves = new Set(formas.map((f) => f.chave))
    // "Coreia" sozinho não é nome de país nenhum: aceitar daria ponto por meia
    // resposta, e não há como escolher qual das duas metades.
    expect(chaves.has('coreia'), '"Coreia" não deveria ser aceito sozinho').toBe(false)
    // Estes três já são o nome oficial de um país: não há nada a acrescentar.
    for (const [chave, id] of [['sudao', 'sd'], ['guine', 'gn'], ['irlanda', 'ie']] as const) {
      expect(formas.filter((f) => f.chave === chave).map((f) => f.id)).toEqual([id])
    }
  })
})
