import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { COMPOSTOS, FUNCOES, IRMAS } from '@/data/funcoes-organicas'
import { funcoesOrganicas } from './funcoes-organicas'

const baralho = (seed: number): readonly Carta[] =>
  funcoesOrganicas.config().montarBaralho(mulberry32(seed))

/** Trinta sementes: uma carta só é conferida de verdade sob vários sorteios. */
const SEMENTES = Array.from({ length: 30 }, (_, i) => i + 1)

const escolhas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'escolha') throw new Error(`${c.id} devia ser de escolha`)
    return c
  })

describe('baralho', () => {
  it('tem uma carta por composto, e a pergunta é a fórmula', () => {
    const cartas = baralho(7)
    expect(cartas).toHaveLength(COMPOSTOS.length)

    const formulas = COMPOSTOS.map((c) => c.formula).sort()
    expect(cartas.map((c) => c.id.replace('organica-', '')).sort()).toEqual(formulas)

    for (const c of escolhas(7)) {
      expect(c.pergunta.kind, c.id).toBe('texto')
      // O nome do composto não pode vazar para a pergunta: ele entrega a função
      // no sufixo, e o jogo passaria a medir nomenclatura.
      expect(formulas, c.id).toContain(c.pergunta.kind === 'texto' ? c.pergunta.valor : '')
    }
  })

  it('monta quatro opções distintas, com a certa entre elas', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        expect(c.alternativas, `${c.id} @${seed}`).toHaveLength(4)
        const valores = c.alternativas.map((a) =>
          a.kind === 'texto' ? a.valor : '',
        )
        expect(new Set(valores).size, `${c.id} @${seed}: ${valores.join(' | ')}`).toBe(4)

        const composto = COMPOSTOS.find((x) => `organica-${x.formula}` === c.id)
        expect(valores[c.indiceCorreto], `${c.id} @${seed}`).toBe(composto?.funcao)
      }
    }
  })

  /**
   * O teste que justifica o jogo existir.
   *
   * Se um distrator puder ser qualquer função, a carta se resolve por
   * eliminação: ninguém oferece "nitrila" para `CH₃-CH₂-OH` e espera que alguém
   * hesite. As três opções erradas têm de ser as funções que de fato se
   * confundem com a certa — é o mesmo padrão das formas irmãs da geometria
   * molecular, e sem ele o card entrega a resposta por reconhecimento.
   */
  it('todo distrator é uma função irmã, nunca uma função qualquer', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        const composto = COMPOSTOS.find((x) => `organica-${x.formula}` === c.id)
        if (!composto) throw new Error(`${c.id} sem composto`)

        const irmas = IRMAS[composto.funcao]
        for (const [i, alt] of c.alternativas.entries()) {
          if (i === c.indiceCorreto) continue
          const valor = alt.kind === 'texto' ? alt.valor : ''
          expect(
            irmas as readonly string[],
            `${c.id} @${seed}: "${valor}" não se confunde com ${composto.funcao}`,
          ).toContain(valor)
        }
      }
    }
  })

  it('oferece o isômero de função quando ele existe — o distrator que importa', () => {
    // Etanol e éter metílico são os dois C₂H₆O. Em alguma das sementes, a carta
    // do etanol tem de pôr "éter" na tela: é a opção que a pessoa marca quando
    // só procurou o oxigênio.
    const pares: readonly (readonly [string, string])[] = [
      ['CH₃-CH₂-OH', 'éter'],
      ['CH₃-CHO', 'cetona'],
      ['CH₃-COOH', 'éster'],
      ['C₆H₅-OH', 'álcool'],
      ['CH₃-CONH₂', 'amina'],
    ]

    for (const [formula, irma] of pares) {
      const apareceu = SEMENTES.some((seed) =>
        escolhas(seed)
          .find((c) => c.id === `organica-${formula}`)
          ?.alternativas.some((a) => a.kind === 'texto' && a.valor === irma),
      )
      expect(apareceu, `${formula} nunca ofereceu "${irma}" em ${SEMENTES.length} sorteios`).toBe(
        true,
      )
    }
  })

  it('o gabarito diz a função e o porquê, não só a função', () => {
    for (const c of escolhas(7)) {
      const composto = COMPOSTOS.find((x) => `organica-${x.formula}` === c.id)
      if (!composto) throw new Error(`${c.id} sem composto`)
      expect(c.gabarito, c.id).toContain(composto.funcao)
      expect(c.gabarito, c.id).toContain(composto.nome)
      expect(c.gabarito, c.id).toContain(composto.sinal)
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
    const resumo = (seed: number) =>
      escolhas(seed).map((c) => `${c.id}:${c.alternativas.map((a) => a.kind === 'texto' ? a.valor : '').join(',')}`)
    expect(resumo(11)).toEqual(resumo(11))
    expect(resumo(11)).not.toEqual(resumo(12))
  })
})

describe('declaração do jogo', () => {
  it('se declara como o registry espera', () => {
    expect(funcoesOrganicas.id).toBe('funcoes-organicas')
    expect(funcoesOrganicas.mecanica).toBe('flashcard')
    expect(funcoesOrganicas.categoria).toBe('quimica')
    expect(funcoesOrganicas.config().fim).toBe('baralho')
  })

  it('o resumo e o comoJogar não prometem digitação', () => {
    // O jogo é de escolha por decisão explícita — ver o cabeçalho do módulo. Um
    // texto dizendo "escreva a função" mandaria o jogador para o teclado.
    const texto = [funcoesOrganicas.resumo, ...funcoesOrganicas.comoJogar].join(' ')
    expect(texto).not.toMatch(/escreva|digite/i)
  })

  it('não inventa função fora da lista canônica', () => {
    for (const c of escolhas(3)) {
      for (const a of c.alternativas) {
        expect(FUNCOES as readonly string[], c.id).toContain(a.kind === 'texto' ? a.valor : '')
      }
    }
  })
})
