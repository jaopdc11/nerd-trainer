import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import { ESPECIES, GRAFIA_BINOMIAL, comGrafia } from '@/data/nomes-cientificos'
import { nomesCientificos } from './nomes-cientificos'
import type { Carta } from '@/core/types'

/**
 * Dez sementes, como no baralho de taxonomia: a carta de grafia sorteia quais
 * três erros entram (no trinômio há quatro candidatos), e uma propriedade que
 * vale numa partida e falha noutra é pior que uma que nunca vale — ela passa no
 * teste e quebra no jogador.
 */
const SEMENTES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
const BARALHOS = SEMENTES.map((s) => nomesCientificos.config().montarBaralho(mulberry32(s)))
const BARALHO = BARALHOS[0] as readonly Carta[]

function carta(baralho: readonly Carta[], id: string): Carta {
  const achada = baralho.find((c) => c.id === id)
  if (!achada) throw new Error(`carta sumiu: ${id}`)
  return achada
}

describe('baralho de nomes científicos', () => {
  it('são 32 espécies mais 8 cartas de grafia, sem id repetido', () => {
    expect(BARALHO).toHaveLength(ESPECIES.length + comGrafia().length)
    expect(new Set(BARALHO.map((c) => c.id)).size).toBe(BARALHO.length)
    expect(BARALHO.filter((c) => c.tipo === 'digitada')).toHaveLength(ESPECIES.length)
    expect(BARALHO.filter((c) => c.tipo === 'escolha')).toHaveLength(comGrafia().length)
  })

  it('a pergunta digitada é o binômio e a dica é o grupo', () => {
    for (const e of ESPECIES) {
      const c = carta(BARALHO, `nome-${e.id}`)
      if (c.tipo !== 'digitada') throw new Error(`${c.id}: devia ser digitada`)
      expect(c.pergunta.kind === 'texto' ? c.pergunta.valor : '', e.id).toBe(e.binomio)
      expect(c.dica, e.id).toBe(e.grupo)
    }
  })

  it('cada carta aceita a própria canônica e todos os sinônimos', () => {
    for (const e of ESPECIES) {
      const c = carta(BARALHO, `nome-${e.id}`)
      if (c.tipo !== 'digitada' || c.resposta.tipo !== 'texto') {
        throw new Error(`${c.id}: resposta devia ser texto`)
      }
      for (const forma of [e.popular, ...e.sinonimos]) {
        expect(validar(forma, c.resposta, { rigor: 'estrito' }).veredito, `${e.id}: "${forma}"`).toBe(
          'certo',
        )
      }
    }
  })

  it('nenhuma carta aceita o nome popular de outra espécie', () => {
    // A tolerância a erro de digitação é o que torna isto uma pergunta de
    // verdade: "gato", "gado" e "galo" estão a uma edição um do outro, e são
    // três espécies diferentes do baralho.
    for (const e of ESPECIES) {
      const c = carta(BARALHO, `nome-${e.id}`)
      if (c.tipo !== 'digitada' || c.resposta.tipo !== 'texto') continue
      for (const outra of ESPECIES) {
        if (outra.id === e.id) continue
        expect(
          validar(outra.popular, c.resposta, { rigor: 'estrito' }).veredito,
          `${e.id} aceitou "${outra.popular}"`,
        ).toBe('errado')
      }
    }
  })

  it('a explicação da espécie chega à carta digitada, e só a ela', () => {
    const comExplicacao = BARALHO.filter((c) => c.explicacao !== undefined).map((c) => c.id)
    expect(comExplicacao.sort()).toEqual(
      ESPECIES.filter((e) => e.aviso)
        .map((e) => `nome-${e.id}`)
        .sort(),
    )
    // O tomate tem carta de grafia e aviso; o recado sobre o nome revisto não
    // tem nada a ver com a pergunta sobre maiúscula, e repeti-lo ali seria ruído.
    expect(carta(BARALHO, 'grafia-solanum-lycopersicum').explicacao).toBeUndefined()
  })
})

describe('as cartas de grafia', () => {
  it('oferecem quatro grafias do mesmo nome, e só uma segue a regra', () => {
    for (const baralho of BARALHOS) {
      for (const e of comGrafia()) {
        const c = carta(baralho, `grafia-${e.id}`)
        if (c.tipo !== 'escolha') throw new Error(`${c.id}: devia ser escolha`)

        const opcoes = c.alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))
        expect(opcoes, e.id).toHaveLength(4)
        expect(new Set(opcoes).size, `${e.id}: opção repetida`).toBe(4)
        expect(opcoes[c.indiceCorreto], e.id).toBe(e.binomio)

        for (const o of opcoes) {
          // Todas as quatro são o mesmo nome: a pergunta é sobre caixa, e nada
          // mais. Se uma variante mudasse uma letra, a carta viraria um teste de
          // ortografia latina sem avisar.
          expect(o.toLowerCase(), `${e.id}: "${o}"`).toBe(e.binomio.toLowerCase())
          expect(o === e.binomio, `${e.id}: "${o}" passou pela regra`).toBe(
            GRAFIA_BINOMIAL.test(o),
          )
        }
      }
    }
  })

  it('a pergunta não mostra o binômio nem o nome popular', () => {
    // As duas cartas da mesma espécie convivem no baralho: uma pergunta do tipo
    // "qual a grafia certa do nome da onça-pintada?" entregaria de graça a
    // resposta da outra.
    for (const e of comGrafia()) {
      const c = carta(BARALHO, `grafia-${e.id}`)
      const texto = c.pergunta.kind === 'texto' ? c.pergunta.valor : ''
      expect(texto.toLowerCase(), e.id).not.toContain(e.binomio.toLowerCase())
      expect(texto.toLowerCase(), e.id).not.toContain(e.popular.toLowerCase())
    }
  })

  it('o gabarito enuncia a regra, em vez de repetir a alternativa', () => {
    for (const e of comGrafia()) {
      const c = carta(BARALHO, `grafia-${e.id}`)
      expect(c.gabarito, e.id).toContain(e.binomio)
      expect(c.gabarito, e.id).toContain('maiúscula')
      expect(c.gabarito, e.id).toContain('itálico')
    }
  })
})

describe('metadados', () => {
  it('é flashcard de biológicas, com o id que o registry espera', () => {
    expect(nomesCientificos.id).toBe('nomes-cientificos')
    expect(nomesCientificos.categoria).toBe('biologicas')
    expect(nomesCientificos.mecanica).toBe('flashcard')
  })

  it('vai até o fim do baralho, com teclado de texto', () => {
    const config = nomesCientificos.config()
    expect(config.fim).toBe('baralho')
    expect(config.teclado).toBe('texto')
  })

  it('o comoJogar avisa que o itálico não é cobrado', () => {
    // A convenção tipográfica tem duas metades e a tela só mostra uma. Dizer
    // isso é a diferença entre uma simplificação assumida e uma omissão.
    expect(nomesCientificos.comoJogar.join(' ')).toContain('itálico')
  })
})
