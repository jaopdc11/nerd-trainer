import { describe, expect, it } from 'vitest'
import { chaveDeTexto, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { ECONOMIA } from '@/data/economia'
import { economia } from './economia'

const baralho = (seed: number): readonly Carta[] =>
  economia.config().montarBaralho(mulberry32(seed))

const digitadas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'digitada') throw new Error(`${c.id} devia ser digitada`)
    return c
  })

/**
 * Responde uma carta como a engine responderia: rigor estrito e a vizinhança
 * montada com as formas cruas das outras cartas do mesmo baralho. Sem a
 * vizinhança, o teste mediria uma tolerância mais frouxa que a do jogo real.
 */
function responder(id: string, texto: string): string {
  const cartas = digitadas(7)
  const alvo = cartas.find((c) => c.id === `econ-${id}`)
  if (!alvo) throw new Error(`carta ${id} não encontrada`)

  const vizinhanca = new Set(
    cartas.flatMap((c) =>
      c.id !== alvo.id && c.resposta.tipo === 'texto' ? c.resposta.aceitas : [],
    ),
  )
  return validar(texto, alvo.resposta, { rigor: 'estrito', vizinhanca }).veredito
}

describe('baralho', () => {
  it('tem uma carta por item, todas digitadas e em texto', () => {
    const cartas = baralho(7)
    expect(cartas).toHaveLength(ECONOMIA.length)
    expect(cartas.map((c) => c.id.replace('econ-', '')).sort()).toEqual(
      ECONOMIA.map((i) => i.id).sort(),
    )
    for (const c of digitadas(7)) {
      expect(c.pergunta.kind, c.id).toBe('texto')
      expect(c.resposta.tipo, c.id).toBe('texto')
    }
  })

  it('a dica diz só se é conceito ou obra', () => {
    // A dica é o placeholder do campo. Ela pode falar da *forma* da carta; se
    // falasse do conteúdo — "economista austríaco" — entregaria a resposta.
    for (const c of digitadas(7)) {
      expect(['conceito', 'obra'], c.id).toContain(c.dica)
      const item = ECONOMIA.find((i) => `econ-${i.id}` === c.id)
      expect(c.dica, c.id).toBe(item?.tipo)
    }
  })

  it('nenhuma forma aceita é compartilhada por duas cartas', () => {
    // O teste mais valioso de qualquer baralho: se duas cartas aceitam o mesmo
    // texto, a partida vira loteria. Aqui a colisão é esperada *dentro* de um
    // autor (Smith tem três cartas), então o dono registrado é o autor.
    const dono = new Map<string, string>()
    for (const c of digitadas(7)) {
      if (c.resposta.tipo !== 'texto') continue
      const autor = c.resposta.canonica
      for (const forma of new Set(c.resposta.aceitas.map((a) => chaveDeTexto(a)))) {
        const anterior = dono.get(forma)
        expect(
          anterior === undefined || anterior === autor,
          `"${forma}" é aceito por ${anterior} e por ${autor}`,
        ).toBe(true)
        dono.set(forma, autor)
      }
    }
  })

  /**
   * A tolerância a erro de digitação fica ligada, mas ela só alcança quem
   * aparece **uma vez** no baralho — e isso não é escolha minha, é como a
   * engine monta a vizinhança.
   *
   * `useFlashcard` monta a vizinhança filtrando as outras cartas por `id`, não
   * por resposta. Então, num autor com três cartas, as outras duas entram na
   * vizinhança da que está na tela com a resposta certa dentro: o texto
   * digitado encosta na carta atual *e* na vizinha, a engine chama isso de
   * ambiguidade e recusa. Ou seja, "Schumpetter" é recusado porque Schumpeter
   * tem duas cartas aqui.
   *
   * Registro isto como teste em vez de contornar porque a correção seria mexer
   * no núcleo — deduplicar a vizinhança por resposta canônica —, e o núcleo não
   * é deste jogo. É a mesma situação de filosofia e sociologia, onde Kant tem
   * três cartas e Nietzsche quatro; só que lá ninguém escreveu.
   */
  it('perdoa o dedo escorregado em quem tem uma carta só', () => {
    expect(responder('perspectiva', 'Kahnemann')).toBe('quase')
    expect(responder('termos-troca', 'Prebish')).toBe('quase')
    // E o perdão escala com o tamanho: "Ostrom" tem seis letras, abaixo dos
    // sete que valem um erro, então ali não há tolerância nenhuma.
    expect(responder('bens-comuns', 'Ostron')).toBe('errado')
  })

  it('não perdoa o typo de quem tem mais de uma carta — a vizinhança recusa', () => {
    expect(responder('destruicao-criadora', 'Schumpeter')).toBe('certo')
    expect(responder('destruicao-criadora', 'Schumpetter')).toBe('errado')
  })

  it('aceita o nome completo e ignora acento e caixa', () => {
    expect(responder('mao-invisivel', 'adam smith')).toBe('certo')
    expect(responder('ordem-espontanea', 'Friedrich von Hayek')).toBe('certo')
    expect(responder('termos-troca', 'raul prebisch')).toBe('certo')
  })

  it('não dá o ponto de um autor a outro', () => {
    expect(responder('demanda-efetiva', 'Hayek')).toBe('errado')
    expect(responder('ordem-espontanea', 'Keynes')).toBe('errado')
    expect(responder('monetarismo', 'Friedrich Hayek')).toBe('errado')
    // Sen e Say ficam a dois caracteres, e os dois estão no mesmo baralho.
    expect(responder('capacidades', 'Say')).toBe('errado')
    expect(responder('lei-say', 'Sen')).toBe('errado')
  })

  it('a mesma semente dá o mesmo baralho', () => {
    // Regra do núcleo: nenhum jogo chama Math.random().
    const ordem = (seed: number) => baralho(seed).map((c) => c.id)
    expect(ordem(11)).toEqual(ordem(11))
    expect(ordem(11)).not.toEqual(ordem(12))
  })
})

describe('declaração do jogo', () => {
  it('se declara como o registry espera', () => {
    expect(economia.id).toBe('economia')
    expect(economia.mecanica).toBe('flashcard')
    expect(economia.categoria).toBe('humanas')
    expect(economia.config().fim).toBe('baralho')
    expect(economia.config().teclado).toBe('texto')
  })

  it('o comoJogar promete digitar, porque o jogo é digitado', () => {
    const texto = [economia.resumo, ...economia.comoJogar].join(' ')
    expect(texto).toMatch(/escreve|escreva|digite/i)
    expect(texto).not.toMatch(/alternativa|escolha a/i)
  })
})
