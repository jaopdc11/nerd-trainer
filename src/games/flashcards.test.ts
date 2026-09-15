import { describe, expect, it } from 'vitest'
import { normalizarTexto, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'
import { ALFABETO_GREGO } from '@/data/alfabeto-grego'
import { CONSTANTES_FISICAS } from '@/data/constantes-fisicas'
import { PREFIXOS_SI } from '@/data/prefixos-si'
import { alfabetoGrego, constantesFisicas, prefixosSI } from './flashcards'

const ESTRITO = { rigor: 'estrito' } as const

function baralho(jogo: JogoFlashcard): readonly Carta[] {
  return jogo.config().montarBaralho(mulberry32(7))
}

/** Todas as formas que uma carta aceita, normalizadas conforme o tipo dela. */
function formasAceitas(carta: Carta): string[] {
  if (carta.tipo !== 'digitada') return []
  const r = carta.resposta
  switch (r.tipo) {
    case 'texto':
      return r.aceitas.map((a) => normalizarTexto(a, r.opcoes?.ignorarArtigos ?? true))
    case 'simbolo':
      return [r.canonica, ...(r.aceitas ?? [])]
    case 'inteiroGrande':
      return [r.valor]
    case 'numero':
      return [`${r.mantissa}e${r.expoente}`]
    default:
      return []
  }
}

/**
 * O teste mais valioso do projeto, e roda em milissegundos.
 *
 * Se duas cartas do mesmo baralho aceitam a mesma resposta, o jogo vira
 * loteria: o jogador digita "xi" e ora acerta ora erra, dependendo de qual
 * carta caiu. É exatamente o risco do grego, onde "csi"/"xi" e "qui"/"chi"
 * convivem, e da tabela periódica, onde "Índio" e "Irídio" quase colidem.
 */
function semColisao(jogo: JogoFlashcard) {
  const cartas = baralho(jogo)
  const dono = new Map<string, string>()

  for (const carta of cartas) {
    // Dedup dentro da carta: uma mesma carta pode listar grafias que colapsam
    // na normalização, e isso é inofensivo. O que não pode é colidir entre cartas.
    for (const forma of new Set(formasAceitas(carta))) {
      const anterior = dono.get(forma)
      expect(
        anterior,
        `"${forma}" é aceito por duas cartas: ${anterior} e ${carta.id}`,
      ).toBeUndefined()
      dono.set(forma, carta.id)
    }
  }
}

describe('alfabeto grego', () => {
  it('tem as 24 letras, sem furo na ordem', () => {
    expect(ALFABETO_GREGO).toHaveLength(24)
    expect(ALFABETO_GREGO.map((l) => l.ordem)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    )
  })

  it('nenhuma forma aceita é compartilhada entre letras', () => {
    semColisao(alfabetoGrego)
  })

  it('não confunde csi com qui — o par mais perigoso do dataset', () => {
    const csi = ALFABETO_GREGO.find((l) => l.nome === 'csi')
    const qui = ALFABETO_GREGO.find((l) => l.nome === 'qui')
    const formas = (l?: (typeof ALFABETO_GREGO)[number]) =>
      new Set([l?.nome, ...(l?.sinonimos ?? [])])
    const cruzamento = [...formas(csi)].filter((f) => formas(qui).has(f))
    expect(cruzamento).toEqual([])
  })

})

describe('prefixos SI', () => {
  it('tem os 24 prefixos, incluindo os quatro de 2022', () => {
    expect(PREFIXOS_SI).toHaveLength(24)
    for (const novo of ['ronna', 'quetta', 'ronto', 'quecto']) {
      expect(PREFIXOS_SI.map((p) => p.nome)).toContain(novo)
    }
  })

  it('tem expoentes únicos e simétricos', () => {
    const expoentes = PREFIXOS_SI.map((p) => p.expoente)
    expect(new Set(expoentes).size).toBe(expoentes.length)
    // Todo expoente grande tem o simétrico pequeno.
    for (const e of expoentes.filter((x) => Math.abs(x) >= 3)) {
      expect(expoentes, `falta o simétrico de ${e}`).toContain(-e)
    }
  })

  it('nenhuma forma aceita é compartilhada entre prefixos', () => {
    semColisao(prefixosSI)
  })

})

describe('constantes físicas', () => {
  it('não afirma que μ₀ e ε₀ são exatos — deixaram de ser em 2019', () => {
    for (const id of ['mu-0', 'epsilon-0', 'g', 'm-e', 'm-p']) {
      const k = CONSTANTES_FISICAS.find((c) => c.id === id)
      expect(k?.exato, `${id} não pode estar marcado como exato`).toBe(false)
      expect(k?.fonte).toBe('CODATA-2022')
    }
  })

  it('marca como exatas só as definidoras do SI e suas derivadas', () => {
    const exatas = CONSTANTES_FISICAS.filter((c) => c.exato).map((c) => c.id)
    expect(exatas.sort()).toEqual(
      ['c', 'e', 'g-terra', 'h', 'h-barra', 'k-b', 'n-a', 'r', 'sigma'].sort(),
    )
    for (const c of CONSTANTES_FISICAS.filter((k) => k.exato)) {
      expect(c.fonte, c.id).toBe('SI-2019')
    }
  })

  it('tem mantissa só de dígitos e sem zero à esquerda', () => {
    for (const c of CONSTANTES_FISICAS) {
      expect(c.mantissa, c.id).toMatch(/^[1-9]\d*$/)
      expect(c.sigMin, c.id).toBeLessThanOrEqual(c.mantissa.length)
    }
  })

  it('monta quatro opções, com a certa entre elas', () => {
    for (const carta of baralho(constantesFisicas)) {
      if (carta.tipo !== 'escolha') throw new Error(`${carta.id} devia ser de escolha`)
      expect(carta.alternativas, carta.id).toHaveLength(4)
      expect(carta.alternativas[carta.indiceCorreto]?.valor, carta.id).toBe(carta.gabarito)
    }
  })

  it('nunca repete uma opção dentro da mesma carta', () => {
    for (const carta of baralho(constantesFisicas)) {
      if (carta.tipo !== 'escolha') continue
      const valores = carta.alternativas.map((a) => a.valor)
      expect(new Set(valores).size, `${carta.id}: ${valores.join(' | ')}`).toBe(4)
    }
  })

  it('usa a unidade certa em todas as opções, para não entregar a resposta', () => {
    // Se só a opção certa tivesse a unidade da constante, dava para acertar sem
    // saber o valor.
    for (const carta of baralho(constantesFisicas)) {
      if (carta.tipo !== 'escolha') continue
      const unidades = carta.alternativas.map((a) => a.valor.replace(/^\S+\s/, ''))
      expect(new Set(unidades).size, carta.id).toBe(1)
    }
  })

  it('oferece a mesma mantissa com expoente trocado — o erro que importa', () => {
    const cartas = baralho(constantesFisicas)
    const c = cartas.find((k) => k.id === 'const-c')
    if (c?.tipo !== 'escolha') throw new Error('carta de c não encontrada')

    // O valor certo de c começa em 2,99792458; um distrator deve ter a mesma
    // cabeça e outra potência de 10.
    const cabeca = c.gabarito.split('×')[0]
    const mesmosDigitos = c.alternativas.filter((a) => a.valor.startsWith(`${cabeca}×`))
    expect(mesmosDigitos.length).toBeGreaterThan(1)
  })

  it('aceita as duas grafias de nome que o dataset declara', () => {
    const cartas = baralho(alfabetoGrego)
    const mi = cartas.find((c) => c.id === 'grego-nome-12')
    if (mi?.tipo !== 'digitada') throw new Error('carta de mi não encontrada')
    for (const forma of ['mi', 'mu', 'MU']) {
      expect(validar(forma, mi.resposta, ESTRITO).veredito, forma).toBe('certo')
    }
  })
})
