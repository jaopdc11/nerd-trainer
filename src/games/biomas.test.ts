import { describe, expect, it } from 'vitest'
import { distancia, limiteDeErro, normalizarTexto, validar } from '@/core/answer'
import { ESTADOS } from '@/data/estados'
import { FORMAS } from '@/data/estados-mapa'
import { BIOMAS, FICHAS, dominantes } from '@/data/biomas'
import { biomas, regioes } from './biomas'

const MAPA = regioes.config()
const CELULAS = MAPA.celulas
const BARALHO = biomas.config().montarBaralho({
  next: () => 0,
  int: (min) => min,
  pick: <T,>(itens: readonly T[]) => itens[0] as T,
  shuffle: <T,>(itens: readonly T[]) => [...itens],
  chance: () => false,
})

describe('regiões no mapa', () => {
  it('são cinco células, uma por região do IBGE', () => {
    expect(CELULAS).toHaveLength(5)
    expect(CELULAS.map((c) => c.id).sort()).toEqual(
      ['Centro-Oeste', 'Nordeste', 'Norte', 'Sudeste', 'Sul'].sort(),
    )
  })

  /*
   * O invariante que sustenta o jogo inteiro: a região é a união EXATA das suas
   * UFs. Não é aproximação nem simplificação — é a definição do IBGE, e é a
   * única coisa que este mapa pode dizer sobre biomas sem inventar contorno.
   */
  it('o contorno de cada região é a soma dos contornos das suas UFs', () => {
    for (const celula of CELULAS) {
      const forma = celula.forma
      if (!forma || !('d' in forma)) throw new Error(`${celula.id}: região sem contorno`)

      const ufs = ESTADOS.filter((e) => e.regiao === celula.id)
      expect(ufs.length, celula.id).toBeGreaterThan(0)
      expect(forma.d, celula.id).toBe(ufs.map((e) => FORMAS[e.sigla]?.d).join(''))
    }
  })

  it('as cinco regiões cobrem as 27 UFs, cada uma uma vez só', () => {
    // Um estado repetido em duas regiões desenharia por cima; um estado de fora
    // deixaria um buraco branco no meio do Brasil.
    const juntos = CELULAS.flatMap((c) => ESTADOS.filter((e) => e.regiao === c.id))
    expect(juntos).toHaveLength(27)
    expect(new Set(juntos.map((e) => e.sigla)).size).toBe(27)
  })

  it('todo contorno é polígono fechado e cabe na caixa da projeção', () => {
    for (const celula of CELULAS) {
      const forma = celula.forma
      if (!forma || !('d' in forma)) throw new Error(`${celula.id}: região sem contorno`)
      // Subcaminho aberto quebraria a regra `nonzero` e a região preencheria
      // errado — é o que torna a concatenação legítima em vez de sorte.
      expect(forma.d.startsWith('M'), celula.id).toBe(true)
      expect(forma.d.endsWith('Z'), celula.id).toBe(true)
      expect(forma.d, celula.id).toMatch(/^[MLZ0-9.,-]+$/)
    }
  })

  it('cada célula acerta a própria resposta canônica', () => {
    for (const c of CELULAS) {
      if (c.resposta.tipo !== 'texto') throw new Error(`${c.id}: resposta devia ser texto`)
      expect(validar(c.resposta.canonica, c.resposta, { rigor: 'estrito' }).veredito, c.id).toBe(
        'certo',
      )
    }
  })

  it('"Região Norte" e "centro oeste" também valem', () => {
    const acha = (id: string) => CELULAS.find((c) => c.id === id)?.resposta
    const norte = acha('Norte')
    const co = acha('Centro-Oeste')
    if (!norte || !co) throw new Error('célula sumiu')
    expect(validar('Região Norte', norte, { rigor: 'estrito' }).veredito).toBe('certo')
    expect(validar('centro oeste', co, { rigor: 'estrito' }).veredito).toBe('certo')
    expect(validar('CENTRO-OESTE', co, { rigor: 'estrito' }).veredito).toBe('certo')
  })

  it('nenhuma forma aceita serve a duas regiões', () => {
    const dono = new Map<string, string>()
    for (const c of CELULAS) {
      if (c.resposta.tipo !== 'texto') continue
      for (const forma of c.resposta.aceitas) {
        const chave = normalizarTexto(forma, true)
        const anterior = dono.get(chave)
        expect(anterior ?? c.id, `"${forma}" serve a ${anterior} e a ${c.id}`).toBe(c.id)
        dono.set(chave, c.id)
      }
    }
  })

  /*
   * A tolerância a erro de digitação fica no padrão — ligada —, e isso é
   * medido, não sentido. "Norte" e "Nordeste" começam igual e assustam; a conta
   * mostra que estão a três edições de distância, com perdão de no máximo uma.
   */
  it('nenhum par de regiões cabe dentro do raio de perdão do outro', () => {
    const formas = CELULAS.flatMap((c) =>
      c.resposta.tipo === 'texto'
        ? c.resposta.aceitas.map((a) => ({ id: c.id, chave: normalizarTexto(a, true) }))
        : [],
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

  it('é partida sem relógio, em ordem livre, sobre o mapa', () => {
    expect(MAPA.limiteSegundos).toBeUndefined()
    expect(MAPA.ordem).toBe('livre')
    expect(MAPA.layout?.tipo).toBe('mapa')
  })
})

describe('baralho de biomas', () => {
  it('tem uma carta por UF mais as pistas, sem id repetido', () => {
    const pistas = FICHAS.reduce((s, f) => s + f.pistas.length, 0)
    expect(BARALHO).toHaveLength(ESTADOS.length + pistas)
    expect(new Set(BARALHO.map((c) => c.id)).size).toBe(BARALHO.length)
  })

  it('toda carta é digitada e acerta a própria canônica', () => {
    for (const carta of BARALHO) {
      if (carta.tipo !== 'digitada') throw new Error(`${carta.id}: devia ser digitada`)
      const r = carta.resposta
      if (r.tipo !== 'texto') throw new Error(`${carta.id}: resposta devia ser texto`)
      expect(validar(r.canonica, r, { rigor: 'estrito' }).veredito, carta.id).toBe('certo')
    }
  })

  it('nenhuma resposta aceita algo que não seja nome de bioma', () => {
    const conhecidas = new Set(
      FICHAS.flatMap((f) => [f.nome, ...f.sinonimos]).map((n) => normalizarTexto(n, true)),
    )
    for (const carta of BARALHO) {
      if (carta.tipo !== 'digitada') continue
      if (carta.resposta.tipo !== 'texto') continue
      for (const a of carta.resposta.aceitas) {
        expect(conhecidas.has(normalizarTexto(a, true)), `${carta.id}: "${a}"`).toBe(true)
      }
    }
  })

  /*
   * A razão de existir das cartas de pista. O Pantanal não é predominante em UF
   * nenhuma: sem elas, o jogo se anunciaria como "os seis biomas" e cobraria
   * cinco. Se alguém apagar as pistas, este teste é o que avisa.
   */
  it('os seis biomas aparecem como resposta, o Pantanal inclusive', () => {
    const respondidos = new Set(
      BARALHO.map((c) => (c.tipo === 'digitada' ? c.resposta : null))
        .filter((r) => r?.tipo === 'texto')
        .map((r) => (r as { canonica: string }).canonica),
    )
    for (const b of BIOMAS) expect(respondidos, b).toContain(b)
  })

  it('a carta do estado aceita todos os predominantes e só eles', () => {
    for (const e of ESTADOS) {
      const carta = BARALHO.find((c) => c.id === `bioma-uf-${e.sigla}`)
      if (carta?.tipo !== 'digitada' || carta.resposta.tipo !== 'texto') {
        throw new Error(`${e.sigla}: carta sumiu`)
      }
      for (const b of dominantes(e.sigla)) {
        expect(validar(b, carta.resposta, { rigor: 'estrito' }).veredito, `${e.sigla} ${b}`).toBe(
          'certo',
        )
      }
      // E o que NÃO é predominante tem de ser recusado: aceitar "Pantanal" em
      // Mato Grosso do Sul porque o Pantanal está lá dentro esvaziaria a
      // pergunta.
      const fora = BIOMAS.filter((b) => !dominantes(e.sigla).includes(b))
      for (const b of fora) {
        expect(validar(b, carta.resposta, { rigor: 'estrito' }).veredito, `${e.sigla} ${b}`).toBe(
          'errado',
        )
      }
    }
  })

  it('o gabarito das duas UFs empatadas diz as duas respostas', () => {
    for (const uf of ['AL', 'SE']) {
      const carta = BARALHO.find((c) => c.id === `bioma-uf-${uf}`)
      expect(carta?.gabarito, uf).toContain(' ou ')
    }
  })

  /*
   * Onde o dado é dividido, a carta fala. Sete UFs: as duas empatadas e as
   * cinco em que o segundo bioma passa de 30% do estado. Congelar a lista aqui
   * é o que impede o jogo de virar quiz de pegadinha — se aparecer uma oitava
   * sem aviso, alguém mexeu na composição e não mexeu no recado.
   */
  it('avisa exatamente nas UFs em que o dado é dividido', () => {
    const comAviso = BARALHO.filter((c) => c.aviso !== undefined)
      .map((c) => c.id.replace('bioma-uf-', ''))
      .sort()
    expect(comAviso).toEqual(['AL', 'MA', 'MG', 'MT', 'PI', 'RS', 'SE'].sort())
    for (const c of BARALHO) {
      if (c.aviso) expect(c.aviso.length, c.id).toBeGreaterThan(40)
    }
  })

  it('a carta de pista mostra a frase e cobra o nome do bioma', () => {
    for (const ficha of FICHAS) {
      for (const pista of ficha.pistas) {
        const carta = BARALHO.find(
          (c) => c.pergunta.kind === 'texto' && c.pergunta.valor === pista,
        )
        expect(carta?.gabarito, pista).toBe(ficha.nome)
      }
    }
  })

  it('vai até o fim do baralho, e não em morte súbita', () => {
    // Com seis respostas possíveis, uma em seis é chute bom demais para custar
    // a partida inteira.
    expect(biomas.config().fim).toBe('baralho')
  })
})
