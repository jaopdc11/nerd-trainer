import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro } from '@/core/answer'
import { SERES_VIVOS, serVivo } from './taxonomia'
import {
  ESPECIES,
  GRAFIA_BINOMIAL,
  abreviar,
  comGrafia,
  especie,
  variantesDeCaixa,
} from './nomes-cientificos'

/**
 * O gabarito conferido à mão, escrito de novo e na ordem contrária — **do nome
 * popular para o científico**, que é a direção que o jogo não pergunta. Um
 * binômio trocado de bicho no dataset aparece aqui como uma linha que não fecha.
 *
 * Não é a mesma lista copiada: é a mesma afirmação feita do outro lado, que é a
 * única forma de a conferência valer alguma coisa.
 */
const GABARITO: Readonly<Record<string, string>> = {
  'onça-pintada': 'Panthera onca',
  'ser humano': 'Homo sapiens',
  cachorro: 'Canis lupus familiaris',
  gato: 'Felis catus',
  leão: 'Panthera leo',
  tigre: 'Panthera tigris',
  'baleia-azul': 'Balaenoptera musculus',
  ornitorrinco: 'Ornithorhynchus anatinus',
  cavalo: 'Equus caballus',
  boi: 'Bos taurus',
  camundongo: 'Mus musculus',
  chimpanzé: 'Pan troglodytes',
  'elefante-africano': 'Loxodonta africana',
  avestruz: 'Struthio camelus',
  galinha: 'Gallus gallus domesticus',
  pombo: 'Columba livia',
  'tartaruga-verde': 'Chelonia mydas',
  'sapo-cururu': 'Rhinella marina',
  'tubarão-branco': 'Carcharodon carcharias',
  abelha: 'Apis mellifera',
  'mosca-das-frutas': 'Drosophila melanogaster',
  'mosquito-da-dengue': 'Aedes aegypti',
  'tatuzinho-de-jardim': 'Armadillidium vulgare',
  lombriga: 'Ascaris lumbricoides',
  'polvo-comum': 'Octopus vulgaris',
  levedura: 'Saccharomyces cerevisiae',
  milho: 'Zea mays',
  arroz: 'Oryza sativa',
  café: 'Coffea arabica',
  tomate: 'Solanum lycopersicum',
  cacau: 'Theobroma cacao',
  'bacilo de Koch': 'Mycobacterium tuberculosis',
}

describe('acervo de espécies', () => {
  it('bate com o gabarito escrito na direção contrária', () => {
    expect(ESPECIES).toHaveLength(Object.keys(GABARITO).length)
    for (const e of ESPECIES) {
      expect(GABARITO[e.popular], `${e.popular} → ${e.binomio}`).toBe(e.binomio)
    }
  })

  it('id, binômio e nome popular são únicos', () => {
    for (const campo of ['id', 'binomio', 'popular'] as const) {
      const valores = ESPECIES.map((e) => e[campo])
      expect(new Set(valores).size, campo).toBe(valores.length)
    }
  })

  it('id é ascii e kebab-case', () => {
    for (const e of ESPECIES) expect(e.id, e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  /*
   * O dataset tem de obedecer à regra que o jogo cobra. Um "Panthera Onca"
   * digitado aqui apareceria na tela como pergunta, e o jogo passaria a ensinar
   * exatamente o erro que a carta de grafia existe para pegar.
   */
  it('todo binômio segue a regra: gênero maiúsculo, espécie minúscula', () => {
    for (const e of ESPECIES) {
      expect(e.binomio, e.id).toMatch(GRAFIA_BINOMIAL)
      const [genero, epiteto] = e.binomio.split(' ')
      expect(genero?.[0], `${e.id}: gênero`).toBe(genero?.[0]?.toUpperCase())
      expect(epiteto, `${e.id}: epíteto`).toBe(epiteto?.toLowerCase())
    }
  })

  it('há trinômio no baralho, senão a regra ensinada vira "são duas palavras"', () => {
    const trinomios = ESPECIES.filter((e) => e.binomio.split(' ').length === 3)
    expect(trinomios.map((e) => e.id).sort()).toEqual([
      'canis-lupus-familiaris',
      'gallus-gallus-domesticus',
    ])
    // E eles têm de estar entre as cartas de grafia: é ali que a subespécie em
    // minúscula é cobrada.
    for (const t of trinomios) expect(t.grafia, t.id).toBe(true)
  })

  it('o nome popular e os sinônimos vêm em minúscula, menos o Koch do bacilo', () => {
    for (const e of ESPECIES) {
      const capitalizadas = [e.popular, ...e.sinonimos].filter((n) => /^[A-ZÀ-Ý]/.test(n))
      expect(capitalizadas, e.id).toEqual([])
    }
  })

  it('as cartas de grafia são poucas e conhecidas', () => {
    // Oito de 32. A regra é uma só: cobrar em toda carta encheria metade do
    // baralho de repetição, e cobrar em duas não gruda.
    expect(comGrafia().map((e) => e.id).sort()).toEqual(
      [
        'apis-mellifera',
        'canis-lupus-familiaris',
        'drosophila-melanogaster',
        'felis-catus',
        'gallus-gallus-domesticus',
        'homo-sapiens',
        'panthera-onca',
        'solanum-lycopersicum',
      ].sort(),
    )
  })
})

describe('a regra da caixa, como máquina', () => {
  it('abrevia o gênero e nunca o epíteto', () => {
    expect(abreviar('Panthera onca')).toBe('P. onca')
    expect(abreviar('Canis lupus familiaris')).toBe('C. lupus familiaris')
    expect(() => abreviar('Panthera')).toThrow()
  })

  it('gera três grafias erradas ou mais para todo nome do acervo', () => {
    for (const e of ESPECIES) {
      const erradas = variantesDeCaixa(e.binomio)
      expect(erradas.length, e.id).toBeGreaterThanOrEqual(3)
      expect(new Set(erradas).size, `${e.id}: variante repetida`).toBe(erradas.length)
      for (const f of erradas) {
        expect(f, `${e.id}: "${f}" devia estar errada`).not.toBe(e.binomio)
        // Erro de caixa e nada além: se a variante mudar uma letra, a carta
        // deixa de perguntar sobre nomenclatura e passa a perguntar sobre
        // ortografia latina.
        expect(f.toLowerCase(), e.id).toBe(e.binomio.toLowerCase())
        expect(f, `${e.id}: "${f}" passou pela regra`).not.toMatch(GRAFIA_BINOMIAL)
      }
    }
  })

  it('o trinômio tem uma variante a mais que o binômio', () => {
    // No binômio, "capitalizar tudo" e "capitalizar a última" são a mesma
    // string; no trinômio são erros diferentes, e o de quem sabe a regra pela
    // metade é justamente o segundo.
    expect(variantesDeCaixa('Panthera onca')).toHaveLength(3)
    expect(variantesDeCaixa('Canis lupus familiaris')).toHaveLength(4)
    expect(variantesDeCaixa('Canis lupus familiaris')).toContain('Canis lupus Familiaris')
  })

  it('reclama de nome incompleto em vez de montar carta torta', () => {
    expect(() => variantesDeCaixa('Panthera')).toThrow()
  })
})

describe('coerência com taxonomia.ts', () => {
  it('toda espécie ligada existe lá, com o mesmo nome e o mesmo grupo', () => {
    const ligadas = ESPECIES.filter((e) => e.serVivo)
    expect(ligadas.map((e) => e.serVivo)).toEqual([
      'baleia-azul',
      'ornitorrinco',
      'avestruz',
      'mosquito-da-dengue',
      'tatuzinho-de-jardim',
      'lombriga',
      'levedura',
    ])

    for (const e of ligadas) {
      const s = serVivo(e.serVivo as string)
      expect(s.nome, `${e.id}: nome popular divergiu`).toBe(e.popular)
      expect(s.grupo, `${e.id}: grupo divergiu`).toBe(e.grupo)
    }
  })

  /*
   * A trava contra a cópia silenciosa. Se alguém acrescentar aqui uma espécie
   * cujo nome popular já é carta de taxonomia sem declarar o link, os dois
   * arquivos passam a afirmar a mesma coisa em separado — e uma correção num
   * deles não chega ao outro.
   */
  it('nenhum nome popular repete carta de taxonomia sem declarar o link', () => {
    const nomesDeLa = new Set(SERES_VIVOS.map((s) => s.nome))
    for (const e of ESPECIES) {
      if (e.serVivo) continue
      expect(nomesDeLa.has(e.popular), `${e.id}: "${e.popular}" também é carta de taxonomia`).toBe(
        false,
      )
    }
  })
})

describe('respostas digitáveis', () => {
  it('nenhuma forma aceita serve a duas espécies', () => {
    const dono = new Map<string, string>()
    for (const e of ESPECIES) {
      for (const forma of [e.popular, ...e.sinonimos]) {
        const chave = chaveDeTexto(forma)
        const anterior = dono.get(chave)
        expect(anterior ?? e.id, `"${forma}" serve a ${anterior} e a ${e.id}`).toBe(e.id)
        dono.set(chave, e.id)
      }
    }
  })

  /*
   * A tolerância a erro de digitação fica ligada — "tatuzinho-de-jardim" tem 17
   * caracteres e ninguém merece perder o ponto por uma letra. Isso só é seguro
   * se nenhuma resposta couber dentro do raio de perdão de outra, e isso se
   * mede, não se sente: "gato", "gado" e "galo" estão a uma edição de distância,
   * mas com quatro letras o perdão é zero.
   */
  it('nenhum par de espécies cabe dentro do raio de perdão do outro', () => {
    const formas = ESPECIES.flatMap((e) =>
      [e.popular, ...e.sinonimos].map((f) => ({ id: e.id, chave: chaveDeTexto(f) })),
    )

    for (const a of formas) {
      for (const b of formas) {
        if (a.id === b.id) continue
        const limite = Math.max(limiteDeErro(a.chave.length), limiteDeErro(b.chave.length))
        if (limite === 0) continue
        expect(
          distancia(a.chave, b.chave, limite),
          `"${a.chave}" (${a.id}) e "${b.chave}" (${b.id}) a ${limite} de distância`,
        ).toBeGreaterThan(limite)
      }
    }
  })
})

describe('guardas e avisos', () => {
  it('a busca por id reclama em vez de devolver vazio', () => {
    expect(especie('panthera-onca').binomio).toBe('Panthera onca')
    expect(() => especie('panthera-atrox')).toThrow()
  })

  it('os avisos estão onde a classificação ou o nome mudaram', () => {
    // Cada um deles é um caso em que a carta cobra uma resposta e a realidade
    // tem uma ressalva: nome revisto, subespécie disputada, popular que muda de
    // bicho conforme o país. Calar seria ensinar meia verdade.
    expect(ESPECIES.filter((e) => e.aviso).map((e) => e.id).sort()).toEqual(
      ['canis-lupus-familiaris', 'mus-musculus', 'rhinella-marina', 'solanum-lycopersicum'].sort(),
    )
    for (const e of ESPECIES) {
      if (e.aviso) expect(e.aviso.length, e.id).toBeGreaterThan(80)
    }
  })
})
