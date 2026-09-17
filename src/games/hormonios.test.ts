import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Carta, Conteudo } from '@/core/types'
import { ENDOCRINOS, GLANDULAS, HORMONIOS, IRMAS, IRMAS_GLANDULA } from '@/data/hormonios'
import type { Endocrino } from '@/data/hormonios'
import { hormonios } from './hormonios'

const baralho = (seed: number): readonly Carta[] => hormonios.config().montarBaralho(mulberry32(seed))

/** Trinta sementes: com a direção sorteada, uma semente só mostra metade do jogo. */
const SEMENTES = Array.from({ length: 30 }, (_, i) => i + 1)

const escolhas = (seed: number) =>
  baralho(seed).map((c) => {
    if (c.tipo !== 'escolha') throw new Error(`${c.id} devia ser de escolha`)
    return c
  })

const valores = (c: { readonly alternativas: readonly Conteudo[] }): string[] =>
  c.alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))

const texto = (c: { readonly pergunta: Conteudo }): string =>
  c.pergunta.kind === 'texto' ? c.pergunta.valor : ''

const ehProducao = (id: string): boolean => !id.startsWith('hormonio-efeito-')
const doId = (id: string): Endocrino => {
  const nome = id.replace('hormonio-efeito-', '').replace('hormonio-', '')
  const h = ENDOCRINOS.find((x) => x.nome === nome)
  if (!h) throw new Error(`${id} sem hormônio`)
  return h
}

describe('baralho', () => {
  it('tem exatamente uma carta por hormônio, em qualquer das duas direções', () => {
    for (const seed of SEMENTES) {
      const cartas = escolhas(seed)
      expect(cartas, `@${seed}`).toHaveLength(ENDOCRINOS.length)
      expect(cartas.map((c) => doId(c.id).nome).sort()).toEqual([...HORMONIOS].sort())
    }
  })

  it('as duas direções acontecem para todo hormônio ao longo das sementes', () => {
    // Se o sorteio travasse numa direção só, metade do conteúdo do dataset
    // nunca chegaria à tela e nenhum outro teste acusaria.
    for (const h of ENDOCRINOS) {
      const direcoes = new Set(
        SEMENTES.map((seed) => {
          const carta = escolhas(seed).find((c) => doId(c.id).nome === h.nome)
          return carta && ehProducao(carta.id) ? 'producao' : 'efeito'
        }),
      )
      expect(direcoes, `${h.nome} só apareceu numa direção`).toEqual(
        new Set(['producao', 'efeito']),
      )
    }
  })

  it('monta quatro opções distintas, com a certa entre elas', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        expect(c.alternativas, `${c.id} @${seed}`).toHaveLength(4)
        const v = valores(c)
        expect(new Set(v).size, `${c.id} @${seed}: ${v.join(' | ')}`).toBe(4)

        const h = doId(c.id)
        expect(v[c.indiceCorreto], `${c.id} @${seed}`).toBe(ehProducao(c.id) ? h.glandula : h.nome)
      }
    }
  })

  it('o enunciado diz de que lado está a pergunta', () => {
    // Sem "Quem fabrica:" na tela, metade dos erros seria sobre o que a pergunta
    // queria dizer, e não sobre fisiologia. Ver o cabeçalho do módulo.
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        const h = doId(c.id)
        if (ehProducao(c.id)) {
          expect(texto(c), c.id).toMatch(/^Quem fabrica: /)
          expect(texto(c), c.id).toContain(h.nome)
          if (h.porExtenso) expect(texto(c), `${c.id} sem o nome por extenso`).toContain(h.porExtenso)
        } else {
          expect(texto(c), c.id).toBe(`Qual hormônio: ${h.efeito}`)
        }
      }
    }
  })
})

/**
 * O teste que justifica o jogo existir.
 *
 * Se um distrator puder ser qualquer glândula, a carta se resolve por
 * eliminação: ninguém oferece "pineal" para a insulina e espera que alguém
 * hesite. As três opções erradas têm de ser as que de fato se respondem no lugar
 * da certa — é o mesmo padrão das formas irmãs da geometria molecular.
 */
describe('distratores', () => {
  it('na carta de produção, todo errado é alvo do hormônio ou irmã da glândula', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        if (!ehProducao(c.id)) continue
        const h = doId(c.id)
        const admitidos: readonly string[] = [...h.alvos, ...IRMAS_GLANDULA[h.glandula]]
        for (const [i, alt] of c.alternativas.entries()) {
          if (i === c.indiceCorreto) continue
          const valor = alt.kind === 'texto' ? alt.valor : ''
          expect(admitidos, `${c.id} @${seed}: "${valor}" não tem nada a ver com ${h.nome}`).toContain(
            valor,
          )
        }
      }
    }
  })

  it('na carta de efeito, todo errado é um hormônio irmão', () => {
    for (const seed of SEMENTES) {
      for (const c of escolhas(seed)) {
        if (ehProducao(c.id)) continue
        const h = doId(c.id)
        for (const [i, alt] of c.alternativas.entries()) {
          if (i === c.indiceCorreto) continue
          const valor = alt.kind === 'texto' ? alt.valor : ''
          expect(
            IRMAS[h.nome] as readonly string[],
            `${c.id} @${seed}: "${valor}" não se confunde com ${h.nome}`,
          ).toContain(valor)
        }
      }
    }
  })

  it('a glândula-alvo é sempre oferecida ao trófico — é o erro que se quer pegar', () => {
    // O TSH sem "tireoide" na tela não mede nada: quem lê a sigla e responde
    // quem obedece precisa ter onde errar. Com o alvo na frente da fila de
    // candidatos, ele entra em toda carta, em toda semente.
    for (const h of ENDOCRINOS.filter((x) => x.alvos.length > 0)) {
      for (const seed of SEMENTES) {
        const carta = escolhas(seed).find((c) => c.id === `hormonio-${h.nome}`)
        if (!carta) continue
        const oferecidos = valores(carta)
        const temAlvo = h.alvos.some((a) => oferecidos.includes(a))
        expect(temAlvo, `${h.nome} @${seed} não ofereceu nenhum alvo: ${oferecidos.join(' | ')}`).toBe(
          true,
        )
      }
    }
  })

  it('o par antagonista aparece em alguma das sementes', () => {
    const pares = [
      ['insulina', 'glucagon'],
      ['calcitonina', 'paratormônio'],
      ['aldosterona', 'ADH'],
      ['prolactina', 'ocitocina'],
    ] as const

    for (const [nome, irmao] of pares) {
      const apareceu = SEMENTES.some((seed) =>
        escolhas(seed)
          .find((c) => c.id === `hormonio-efeito-${nome}`)
          ?.alternativas.some((a) => a.kind === 'texto' && a.valor === irmao),
      )
      expect(apareceu, `${nome} nunca ofereceu "${irmao}" em ${SEMENTES.length} sorteios`).toBe(true)
    }
  })

  it('não inventa nome fora das listas canônicas', () => {
    for (const seed of [3, 4, 5]) {
      for (const c of escolhas(seed)) {
        const lista: readonly string[] = ehProducao(c.id) ? GLANDULAS : HORMONIOS
        for (const v of valores(c)) expect(lista, c.id).toContain(v)
      }
    }
  })
})

describe('gabarito e explicação', () => {
  it('o gabarito abre pela resposta certa e explica por que é ela', () => {
    for (const seed of [7, 8]) {
      for (const c of escolhas(seed)) {
        const h = doId(c.id)
        expect(c.gabarito.startsWith(ehProducao(c.id) ? h.glandula : h.nome), c.id).toBe(true)
        expect(c.gabarito, c.id).toContain(h.detalhe)
        // A direção que não perguntou a glândula ainda assim a informa: é metade
        // do conteúdo da carta.
        if (!ehProducao(c.id)) expect(c.gabarito, c.id).toContain(h.glandula)
      }
    }
  })

  it('ocitocina e ADH avisam que a neuro-hipófise só armazena', () => {
    // A resposta "hipotálamo" parece arbitrária para quem decorou
    // "neuro-hipófise", e a explicação é o que impede o jogo de parecer errado.
    for (const seed of [7, 8, 9]) {
      for (const c of escolhas(seed)) {
        const h = doId(c.id)
        expect(c.explicacao, c.id).toBe(h.ressalva)
        if (h.glandula === 'hipotálamo') expect(c.explicacao, c.id).toMatch(/neuro-hipófise/)
      }
    }
  })
})

describe('declaração do jogo', () => {
  it('se declara como o registry espera', () => {
    expect(hormonios.id).toBe('hormonios')
    expect(hormonios.mecanica).toBe('flashcard')
    expect(hormonios.categoria).toBe('biologicas')
    expect(hormonios.config().fim).toBe('baralho')
  })

  it('o resumo e o comoJogar não prometem digitação', () => {
    // O jogo é de escolha por decisão explícita — ver o cabeçalho do módulo.
    const t = [hormonios.resumo, ...hormonios.comoJogar].join(' ')
    expect(t).not.toMatch(/escreva|digite/i)
  })

  it('o comoJogar separa quem fabrica de quem obedece', () => {
    // É a única ambiguidade capaz de fazer alguém errar sabendo a matéria, e por
    // isso ela é dita nas instruções além de estar em cada enunciado.
    const t = hormonios.comoJogar.join(' ')
    expect(t).toMatch(/fabrica/)
    expect(t).toMatch(/TSH/)
    expect(t).toMatch(/neuro-hipófise/)
  })

  it('não deixa a resposta certa parada na mesma posição', () => {
    // Um bug de embaralhamento que sempre pusesse a certa em primeiro lugar não
    // quebraria nenhum teste acima e destruiria o jogo em silêncio.
    const posicoes = new Set(SEMENTES.flatMap((s) => escolhas(s).map((c) => c.indiceCorreto)))
    expect(posicoes).toEqual(new Set([0, 1, 2, 3]))
  })

  it('a mesma semente dá o mesmo baralho', () => {
    // Regra do núcleo: nenhum jogo chama Math.random(). "Esse sorteio caiu mal"
    // precisa ser reproduzível — inclusive na direção sorteada de cada carta.
    const resumo = (seed: number) => escolhas(seed).map((c) => `${c.id}:${valores(c).join(',')}`)
    expect(resumo(11)).toEqual(resumo(11))
    expect(resumo(11)).not.toEqual(resumo(12))
  })
})
