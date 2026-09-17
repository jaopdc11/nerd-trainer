import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta, Conteudo } from '@/core/types'
import { ESTRUTURAS, IRMAS, ORGANELAS } from '@/data/organelas'
import type { Organela } from '@/data/organelas'
import { organelas } from './organelas'

const baralho = (seed: number): readonly Carta[] => organelas.config().montarBaralho(mulberry32(seed))

/** Trinta sementes: uma carta só é conferida de verdade sob vários sorteios. */
const SEMENTES = Array.from({ length: 30 }, (_, i) => i + 1)

const escolhas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'escolha') throw new Error(`${c.id} devia ser de escolha`)
    return c
  })

const valores = (c: { readonly alternativas: readonly Conteudo[] }): string[] =>
  c.alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))

const EXCLUSIVAS = ESTRUTURAS.filter((e) => e.ocorrencia !== 'ambas')
const NEUTRAS = ESTRUTURAS.filter((e) => e.ocorrencia === 'ambas' && !e.ressalva).map((e) => e.nome)

describe('baralho', () => {
  it('tem uma carta de função por estrutura e uma de ocorrência por exclusiva', () => {
    const cartas = baralho(7)
    expect(cartas).toHaveLength(ESTRUTURAS.length + EXCLUSIVAS.length)

    const esperados = [
      ...ESTRUTURAS.map((e) => `organela-${e.nome}`),
      ...EXCLUSIVAS.map((e) => `organela-onde-${e.nome}`),
    ].sort()
    expect(cartas.map((c) => c.id).sort()).toEqual(esperados)
  })

  it('a carta de função pergunta a função, nunca o nome', () => {
    const funcoes = ESTRUTURAS.map((e) => e.funcao)
    for (const c of escolhas(7)) {
      if (c.id.startsWith('organela-onde-')) continue
      const valor = c.pergunta.kind === 'texto' ? c.pergunta.valor : ''
      expect(funcoes, c.id).toContain(valor)
      // E o nome da resposta não pode vazar para o enunciado: a carta ficaria
      // resolvida antes de o jogador ler as opções.
      const nome = c.id.replace('organela-', '')
      expect(valor.toLowerCase(), c.id).not.toContain(nome.toLowerCase())
    }
  })

  it('monta quatro opções distintas, com a certa entre elas', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        expect(c.alternativas, `${c.id} @${seed}`).toHaveLength(4)
        const v = valores(c)
        expect(new Set(v).size, `${c.id} @${seed}: ${v.join(' | ')}`).toBe(4)

        const nome = c.id.replace('organela-onde-', '').replace('organela-', '')
        expect(v[c.indiceCorreto], `${c.id} @${seed}`).toBe(nome)
      }
    }
  })

  /**
   * O teste que justifica o jogo existir.
   *
   * Se um distrator puder ser qualquer estrutura, a carta se resolve por
   * eliminação: ninguém oferece "parede celular" para "digestão em pH ácido" e
   * espera que alguém hesite. As três opções erradas têm de ser as que de fato se
   * confundem com a certa — é o mesmo padrão das formas irmãs da geometria
   * molecular, e sem ele o card entrega a resposta por reconhecimento.
   */
  it('todo distrator de função é uma irmã, nunca uma estrutura qualquer', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        if (c.id.startsWith('organela-onde-')) continue
        const nome = c.id.replace('organela-', '') as Organela
        const irmas = IRMAS[nome]
        for (const [i, alt] of c.alternativas.entries()) {
          if (i === c.indiceCorreto) continue
          const valor = alt.kind === 'texto' ? alt.valor : ''
          expect(
            irmas as readonly string[],
            `${c.id} @${seed}: "${valor}" não se confunde com ${nome}`,
          ).toContain(valor)
        }
      }
    }
  })

  it('oferece o par que a prova cobra, em alguma das sementes', () => {
    // Se a carta do lisossomo nunca puser "peroxissomo" na tela, o jogo perdeu
    // justamente a opção que a pessoa marca quando só decorou "quebra coisa".
    const pares: readonly (readonly [Organela, Organela])[] = [
      ['lisossomo', 'peroxissomo'],
      ['retículo endoplasmático liso', 'retículo endoplasmático rugoso'],
      ['complexo golgiense', 'retículo endoplasmático rugoso'],
      ['ribossomo', 'retículo endoplasmático rugoso'],
      ['núcleo', 'nucléolo'],
    ]

    for (const [nome, irma] of pares) {
      const apareceu = SEMENTES.some((seed) =>
        escolhas(seed)
          .find((c) => c.id === `organela-${nome}`)
          ?.alternativas.some((a) => a.kind === 'texto' && a.valor === irma),
      )
      expect(apareceu, `${nome} nunca ofereceu "${irma}" em ${SEMENTES.length} sorteios`).toBe(true)
    }
  })

  it('o gabarito da função diz o que separa a certa da vizinha', () => {
    for (const c of escolhas(7)) {
      if (c.id.startsWith('organela-onde-')) continue
      const nome = c.id.replace('organela-', '')
      const e = ESTRUTURAS.find((x) => x.nome === nome)
      if (!e) throw new Error(`${c.id} sem estrutura`)
      expect(c.gabarito, c.id).toContain(e.nome)
      expect(c.gabarito, c.id).toContain(e.sinal)
    }
  })

  it('a ressalva do livro vira explicação, e só onde ela existe', () => {
    for (const c of escolhas(7)) {
      if (c.id.startsWith('organela-onde-')) continue
      const e = ESTRUTURAS.find((x) => `organela-${x.nome}` === c.id)
      expect(c.explicacao, c.id).toBe(e?.ressalva)
    }
  })
})

describe('carta de ocorrência', () => {
  const deOcorrencia = (seed: number) => escolhas(seed).filter((c) => c.id.startsWith('organela-onde-'))

  it('pergunta o tipo de célula em que a resposta é exclusiva', () => {
    for (const c of deOcorrencia(7)) {
      const nome = c.id.replace('organela-onde-', '')
      const e = ESTRUTURAS.find((x) => x.nome === nome)
      if (!e) throw new Error(`${c.id} sem estrutura`)
      const valor = c.pergunta.kind === 'texto' ? c.pergunta.valor : ''
      expect(valor, c.id).toBe(`Qual destas só existe na célula ${e.ocorrencia}?`)
      expect(c.gabarito, c.id).toContain(e.exclusividade ?? '(sem explicação)')
    }
  })

  /**
   * A regra que impede a carta de ter duas respostas certas.
   *
   * Duas armadilhas diferentes moram aqui. A primeira é oferecer outra
   * exclusiva: cloroplasto e vacúolo central são irmãos e os dois são vegetais,
   * então a irmandade sozinha produziria uma carta com dois acertos. A segunda é
   * oferecer uma estrutura sobre a qual o livro escolar briga — o lisossomo, que
   * quatro livros em cinco chamam de animal. As duas custam o ponto de quem
   * estudou, que é o pior tipo de erro que um jogo de treino pode cometer.
   */
  it('nunca oferece outra exclusiva nem uma estrutura contestada', () => {
    for (const seed of SEMENTES) {
      for (const c of deOcorrencia(seed)) {
        for (const [i, alt] of c.alternativas.entries()) {
          if (i === c.indiceCorreto) continue
          const valor = alt.kind === 'texto' ? alt.valor : ''
          expect(NEUTRAS as readonly string[], `${c.id} @${seed}: "${valor}"`).toContain(valor)
        }
      }
    }
  })

  it('cobre os dois lados: vegetal e animal', () => {
    const perguntas = new Set(
      deOcorrencia(7).map((c) => (c.pergunta.kind === 'texto' ? c.pergunta.valor : '')),
    )
    expect(perguntas).toContain('Qual destas só existe na célula vegetal?')
    expect(perguntas).toContain('Qual destas só existe na célula animal?')
  })

  it('prefere a irmã quando ela é neutra', () => {
    // O sorteio geral existe para completar as quatro opções, não para
    // substituir a irmandade: a carta do cloroplasto tem de oferecer
    // "mitocôndria" — a outra organela de dupla membrana e DNA próprio — em
    // alguma das sementes.
    const apareceu = SEMENTES.some((seed) =>
      deOcorrencia(seed)
        .find((c) => c.id === 'organela-onde-cloroplasto')
        ?.alternativas.some((a) => a.kind === 'texto' && a.valor === 'mitocôndria'),
    )
    expect(apareceu).toBe(true)
  })
})

describe('declaração do jogo', () => {
  it('se declara como o registry espera', () => {
    expect(organelas.id).toBe('organelas')
    expect(organelas.mecanica).toBe('flashcard')
    expect(organelas.categoria).toBe('biologicas')
    expect(organelas.config().fim).toBe('baralho')
  })

  it('o resumo e o comoJogar não prometem digitação', () => {
    // O jogo é de escolha por decisão explícita — ver o cabeçalho do módulo. Um
    // texto dizendo "escreva a organela" mandaria o jogador para o teclado.
    const texto = [organelas.resumo, ...organelas.comoJogar].join(' ')
    expect(texto).not.toMatch(/escreva|digite/i)
  })

  it('o comoJogar avisa que existem cartas de ocorrência', () => {
    // Sem isso, a primeira carta de "qual destas só existe na célula vegetal?"
    // parece um bug: o jogador entrou para responder funções.
    const texto = organelas.comoJogar.join(' ')
    expect(texto).toMatch(/vegetal/)
    expect(texto).toMatch(/animal/)
  })

  it('não inventa nome fora da lista canônica', () => {
    for (const c of escolhas(3)) {
      for (const a of c.alternativas) {
        expect(ORGANELAS as readonly string[], c.id).toContain(a.kind === 'texto' ? a.valor : '')
      }
    }
  })

  it('não deixa a resposta certa parada na mesma posição', () => {
    // Um bug de embaralhamento que sempre pusesse a certa em primeiro lugar não
    // quebraria nenhum teste acima e destruiria o jogo em silêncio.
    const posicoes = new Set(SEMENTES.flatMap((s) => escolhas(s).map((c) => c.indiceCorreto)))
    expect(posicoes).toEqual(new Set([0, 1, 2, 3]))
  })

  it('a mesma semente dá o mesmo baralho', () => {
    // Regra do núcleo: nenhum jogo chama Math.random(). "Esse sorteio caiu mal"
    // precisa ser reproduzível.
    const resumo = (seed: number) => escolhas(seed).map((c) => `${c.id}:${valores(c).join(',')}`)
    expect(resumo(11)).toEqual(resumo(11))
    expect(resumo(11)).not.toEqual(resumo(12))
  })
})
