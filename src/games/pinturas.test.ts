import { describe, expect, it } from 'vitest'
import { chaveDeTexto, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { QUADROS } from '@/data/pinturas'
import { pinturas } from './pinturas'

const baralho = (seed: number): readonly Carta[] =>
  pinturas.config().montarBaralho(mulberry32(seed))

const digitadas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'digitada') throw new Error(`${c.id} devia ser digitada`)
    return c
  })

/** Responde como a engine: rigor estrito e a vizinhança das outras cartas. */
function responder(id: string, texto: string): string {
  const cartas = digitadas(7)
  const alvo = cartas.find((c) => c.id === `pintura-${id}`)
  if (!alvo) throw new Error(`carta ${id} não encontrada`)

  const vizinhanca = new Set(
    cartas.flatMap((c) =>
      c.id !== alvo.id && c.resposta.tipo === 'texto' ? c.resposta.aceitas : [],
    ),
  )
  return validar(texto, alvo.resposta, { rigor: 'estrito', vizinhanca }).veredito
}

describe('baralho', () => {
  it('tem uma carta por quadro, todas digitadas', () => {
    const cartas = baralho(7)
    expect(cartas).toHaveLength(QUADROS.length)
    expect(cartas.map((c) => c.id.replace('pintura-', '')).sort()).toEqual(
      QUADROS.map((q) => q.id).sort(),
    )
    for (const c of digitadas(7)) {
      expect(c.resposta.tipo, c.id).toBe('texto')
    }
  })

  /**
   * A decisão de escopo, em forma de teste — e ela mudou.
   *
   * Este jogo nasceu textual porque não havia reprodução que o projeto pudesse
   * usar. Agora há, para 33 das 38: `scripts/gen-pinturas.mjs` baixa do Wikimedia
   * e do acervo do MAC USP e escreve em `public/pinturas/`. As outras cinco
   * continuam de título, e o teste cobra as duas formas — se alguém apagar a
   * flag `imagem` de um quadro que tem arquivo, a carta piora em silêncio.
   */
  it('mostra o quadro onde há reprodução, e o título onde não há', () => {
    for (const c of digitadas(7)) {
      const quadro = QUADROS.find((q) => `pintura-${q.id}` === c.id)
      if (!quadro) throw new Error(`${c.id} sem quadro`)

      if (quadro.imagem) {
        expect(c.pergunta.kind, c.id).toBe('imagem')
        expect(c.pergunta.valor, c.id).toContain(`pinturas/${quadro.id}.jpg`)
        // Genérico como nas bandeiras: o `alt` não pode entregar o que a
        // imagem existe para cobrar.
        if (c.pergunta.kind === 'imagem') {
          expect(c.pergunta.alt, c.id).not.toContain(quadro.pintor)
          expect(c.pergunta.alt, c.id).not.toContain(quadro.obra)
        }
      } else {
        expect(c.pergunta.kind, c.id).toBe('texto')
        expect(c.pergunta.valor, c.id).toBe(`${quadro.obra}, ${quadro.ano}`)
      }
    }
  })

  it('a maioria do baralho tem imagem, senão o jogo não é o que promete', () => {
    const comImagem = QUADROS.filter((q) => q.imagem).length
    expect(comImagem).toBeGreaterThan(QUADROS.length * 0.75)
    // E as cinco sem imagem são exatamente as que o script registra como
    // procuradas e não encontradas.
    expect(QUADROS.filter((q) => !q.imagem).map((q) => q.id).sort()).toEqual(
      ['antropofagia', 'cafe', 'guerra-e-paz', 'homem-amarelo', 'retirantes'],
    )
  })

  it('a dica pede o pintor, não a data', () => {
    // Placeholder com o ano faria o jogador achar que a resposta é o ano.
    for (const c of digitadas(7)) {
      expect(c.dica, c.id).toBe('pintor')
    }
  })

  it('o gabarito diz pintor, obra e ano', () => {
    for (const c of digitadas(7)) {
      const quadro = QUADROS.find((q) => `pintura-${q.id}` === c.id)
      if (!quadro) throw new Error(`${c.id} sem quadro`)
      expect(c.gabarito, c.id).toContain(quadro.pintor)
      expect(c.gabarito, c.id).toContain(quadro.obra)
      expect(c.gabarito, c.id).toContain(String(quadro.ano))
    }
  })

  it('leva o aviso das cartas que confundem', () => {
    const cartas = digitadas(7)
    const comAviso = cartas.filter((c) => c.aviso !== undefined).map((c) => c.id)
    expect(comAviso.sort()).toEqual(
      QUADROS.filter((q) => q.aviso).map((q) => `pintura-${q.id}`).sort(),
    )
    expect(comAviso).toContain('pintura-grito')
  })

  it('nenhuma forma aceita é compartilhada por dois pintores', () => {
    // Um pintor tem várias cartas de propósito (Tarsila tem quatro), então o
    // dono registrado é o pintor e não a carta.
    const dono = new Map<string, string>()
    for (const c of digitadas(7)) {
      if (c.resposta.tipo !== 'texto') continue
      const pintor = c.resposta.canonica
      for (const forma of new Set(c.resposta.aceitas.map((a) => chaveDeTexto(a)))) {
        const anterior = dono.get(forma)
        expect(
          anterior === undefined || anterior === pintor,
          `"${forma}" é aceito por ${anterior} e por ${pintor}`,
        ).toBe(true)
        dono.set(forma, pintor)
      }
    }
  })
})

describe('respostas', () => {
  it('aceita o sobrenome, o nome completo e ignora acento e caixa', () => {
    expect(responder('guernica', 'Picasso')).toBe('certo')
    expect(responder('guernica', 'pablo picasso')).toBe('certo')
    expect(responder('abaporu', 'tarsila do amaral')).toBe('certo')
    expect(responder('abaporu', 'Tarsila')).toBe('certo')
    expect(responder('as-meninas', 'velazquez')).toBe('certo')
    expect(responder('mona-lisa', 'da vinci')).toBe('certo')
  })

  /**
   * A tolerância a erro de digitação só alcança quem tem **uma carta só** no
   * baralho — e isso vem da engine, não daqui: `useFlashcard` monta a vizinhança
   * filtrando as outras cartas por `id`, não por resposta. Num pintor com duas
   * cartas, a irmã entra na vizinhança com a resposta certa dentro, o texto
   * encosta nas duas e a engine chama de ambiguidade.
   *
   * Fica registrado como teste em vez de contornado porque a correção seria
   * deduplicar a vizinhança por resposta canônica, no núcleo, que não é deste
   * jogo. Vale igual para filosofia, sociologia e economia.
   */
  it('perdoa o dedo escorregado em quem tem uma carta só', () => {
    expect(responder('criacao-adao', 'Michelangello')).toBe('quase')
    expect(responder('as-meninas', 'Velasquez')).toBe('quase')
    expect(responder('nascimento-venus', 'Boticelli')).toBe('quase')
  })

  it('não perdoa o typo de quem tem mais de uma carta — a vizinhança recusa', () => {
    expect(responder('abaporu', 'Tarsila do Amaral')).toBe('certo')
    expect(responder('abaporu', 'Tarsila do Amaraul')).toBe('errado')
  })

  it('não dá o ponto de um pintor a outro', () => {
    expect(responder('guernica', 'Dalí')).toBe('errado')
    expect(responder('noite-estrelada', 'Munch')).toBe('errado')
    expect(responder('grito', 'Van Gogh')).toBe('errado')
    // A confusão nacional: "O Grito" não é o do Ipiranga.
    expect(responder('grito', 'Pedro Américo')).toBe('errado')
    expect(responder('independencia', 'Munch')).toBe('errado')
  })

  it('Monet continua acertável, que é o motivo de Manet estar fora', () => {
    expect(responder('impressao', 'Monet')).toBe('certo')
    expect(responder('impressao', 'Claude Monet')).toBe('certo')
    // E "Manet" não vale ponto em lugar nenhum: cinco letras não toleram erro.
    expect(responder('impressao', 'Manet')).toBe('errado')
  })
})

describe('declaração do jogo', () => {
  it('se declara como o registry espera', () => {
    expect(pinturas.id).toBe('pinturas')
    expect(pinturas.mecanica).toBe('flashcard')
    expect(pinturas.categoria).toBe('humanas')
    expect(pinturas.config().fim).toBe('baralho')
    expect(pinturas.config().teclado).toBe('texto')
  })

  it('o comoJogar avisa que cinco cartas vêm sem imagem', () => {
    // O contrário do que este teste cobrava antes, e pelo mesmo princípio:
    // prometer imagem em todas e mostrar título em cinco seria pior que não
    // prometer nada.
    const texto = [pinturas.resumo, ...pinturas.comoJogar].join(' ')
    expect(texto).toMatch(/sem imagem/i)
    expect(texto).toMatch(/escreve|escreva|digite/i)
  })

  it('a mesma semente dá o mesmo baralho', () => {
    const ordem = (seed: number) => baralho(seed).map((c) => c.id)
    expect(ordem(11)).toEqual(ordem(11))
    expect(ordem(11)).not.toEqual(ordem(12))
  })
})
