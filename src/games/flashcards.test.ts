import { describe, expect, it } from 'vitest'
import { normalizarTexto, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'
import { ALFABETO_GREGO } from '@/data/alfabeto-grego'
import { CONSTANTES_FISICAS } from '@/data/constantes-fisicas'
import { PREFIXOS_SI } from '@/data/prefixos-si'
import { alfabetoGrego, constantesFisicas, prefixosSI } from './flashcards'

const ESTRITO = { rigor: 'estrito' } as const

function baralho(jogo: JogoFlashcard, modoId?: string): readonly Carta[] {
  return jogo.config(modoId).montarBaralho(mulberry32(7))
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
function semColisao(jogo: JogoFlashcard, modoId?: string) {
  const cartas = baralho(jogo, modoId)
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

  it('nenhuma forma aceita é compartilhada entre letras, em nenhum modo', () => {
    for (const modo of ['nome', 'minuscula', 'maiuscula']) semColisao(alfabetoGrego, modo)
  })

  it('não confunde csi com qui — o par mais perigoso do dataset', () => {
    const csi = ALFABETO_GREGO.find((l) => l.nome === 'csi')
    const qui = ALFABETO_GREGO.find((l) => l.nome === 'qui')
    const formas = (l?: (typeof ALFABETO_GREGO)[number]) =>
      new Set([l?.nome, ...(l?.sinonimos ?? [])])
    const cruzamento = [...formas(csi)].filter((f) => formas(qui).has(f))
    expect(cruzamento).toEqual([])
  })

  it('aceita as variantes do glifo só onde elas existem', () => {
    const cartas = baralho(alfabetoGrego, 'minuscula')
    const fi = cartas.find((c) => c.id.endsWith('-21'))
    if (fi?.tipo !== 'digitada') throw new Error('carta de fi não encontrada')
    // ϕ e φ são a mesma letra, desenhada de dois jeitos.
    expect(validar('ϕ', fi.resposta, ESTRITO).veredito).toBe('certo')
    expect(validar('φ', fi.resposta, ESTRITO).veredito).toBe('certo')
  })

  it('exige a caixa certa no modo símbolo', () => {
    const cartas = baralho(alfabetoGrego, 'minuscula')
    const sigma = cartas.find((c) => c.id.endsWith('-18'))
    if (sigma?.tipo !== 'digitada') throw new Error('carta de sigma não encontrada')
    expect(validar('σ', sigma.resposta, ESTRITO).veredito).toBe('certo')
    expect(validar('Σ', sigma.resposta, ESTRITO).veredito).toBe('errado')
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

  it('nenhuma forma aceita é compartilhada, em nenhum modo', () => {
    for (const modo of ['expoente', 'simbolo', 'nome']) semColisao(prefixosSI, modo)
  })

  it('separa quilo de kelvin pela caixa do símbolo', () => {
    const cartas = baralho(prefixosSI, 'simbolo')
    const quilo = cartas.find((c) => c.id === 'si-simbolo-quilo')
    if (quilo?.tipo !== 'digitada') throw new Error('carta de quilo não encontrada')
    expect(validar('k', quilo.resposta, ESTRITO).veredito).toBe('certo')
    expect(validar('K', quilo.resposta, ESTRITO).veredito).toBe('errado')
  })

  it('aceita o micro sign e o mu grego como a mesma coisa', () => {
    const cartas = baralho(prefixosSI, 'simbolo')
    const micro = cartas.find((c) => c.id === 'si-simbolo-micro')
    if (micro?.tipo !== 'digitada') throw new Error('carta de micro não encontrada')
    // µ (U+00B5) e μ (U+03BC) renderizam igual e são codepoints diferentes.
    expect('µ'.codePointAt(0)).not.toBe('μ'.codePointAt(0))
    for (const forma of ['μ', 'µ', 'u']) {
      expect(validar(forma, micro.resposta, ESTRITO).veredito, forma).toBe('certo')
    }
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

  it('aceita a velocidade da luz em qualquer precisão a partir de 3 algarismos', () => {
    const cartas = baralho(constantesFisicas)
    const c = cartas.find((k) => k.id === 'const-c')
    if (c?.tipo !== 'digitada') throw new Error('carta de c não encontrada')

    for (const forma of ['299792458', '2,998e8', '3,00×10⁸', '2,9979e8']) {
      expect(validar(forma, c.resposta, ESTRITO).veredito, forma).toBe('certo')
    }
    // Um algarismo só: ordem certa, precisão insuficiente.
    expect(validar('3e8', c.resposta, ESTRITO).veredito).toBe('quase')
    // Ordem de grandeza errada é outro tipo de erro, com mensagem própria.
    expect(validar('3e9', c.resposta, ESTRITO).motivo).toBe('expoente-errado')
  })

  it('nenhuma constante aceita o valor de outra', () => {
    semColisao(constantesFisicas)
  })
})
