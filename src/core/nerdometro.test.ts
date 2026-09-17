import { describe, expect, it } from 'vitest'
import { JOGOS } from './registry'
import { calcular, CRITERIOS, CURVA, ESCALA_DE_PESO } from './nerdometro'
import type { PassoParaSubir } from './nerdometro'
import type { Banco, Entrada } from './storage'
import { CATEGORIAS } from './types'

/**
 * Jogo já estabelecido: duas partidas.
 *
 * Duas, e não uma, por causa da carência de estreia — a primeira partida não
 * entra na nota (ver `PARTIDAS_PARA_ENTRAR`). Quem testa a carência usa
 * `estreia()` logo abaixo; todo o resto quer um jogo que já conta, senão cada
 * teste de fórmula estaria medindo a carência sem querer.
 */
function entrada(pontuacao: number): Entrada {
  return {
    recorde: { pontuacao, duracaoMs: 1000, erros: 0, completou: false, emISO: '2026-09-15T12:00:00.000Z' },
    partidas: 2,
    ultimaPontuacao: pontuacao,
    ultimaEmISO: '2026-09-15T12:00:00.000Z',
    historico: [{ pontuacao, duracaoMs: 1000, erros: 0, emISO: '2026-09-15T12:00:00.000Z', runId: `r-${pontuacao}` }],
    ultimosRuns: [{ id: `r-${pontuacao}`, pontuacao }],
  }
}

/** Uma partida só: o jogo recém-aberto, ainda em experiência. */
function estreia(pontuacao: number): Entrada {
  return { ...entrada(pontuacao), partidas: 1 }
}

/** Banco com os jogos dados na fração pedida da própria meta. */
function banco(...jogos: [string, number][]): Banco {
  const entradas: Record<string, Entrada> = {}
  for (const [jogoId, fracao] of jogos) {
    const c = CRITERIOS.find((x) => x.jogoId === jogoId)
    if (!c) throw new Error(`critério inexistente: ${jogoId}`)
    entradas[jogoId] = entrada(Math.round(c.meta * fracao))
  }
  return { versao: 1, entradas }
}

describe('nota', () => {
  it('é o desempenho no que foi jogado, não no catálogo inteiro', () => {
    // Dois jogos na metade da meta. Com 20 critérios intocados, a régua antiga
    // daria uma fração do catálogo; a nova olha só estes dois — e a metade vale
    // mais que 50 por causa da curva de retorno decrescente.
    const m = calcular(banco(['tabela-periodica', 0.5], ['formulas', 0.5]))
    expect(m.nota).toBe(Math.round(0.5 ** CURVA * 100))
    expect(m.nota).toBeGreaterThan(50)
  })

  it('jogo intocado não entra nem no numerador nem no denominador', () => {
    const so = calcular(banco(['pi', 0.4]))
    expect(so.nota).toBe(Math.round(0.4 ** CURVA * 100))
    expect(so.jogados).toBe(1)
    expect(so.total).toBe(CRITERIOS.length)
  })

  it('pondera pelo que o jogo diz sobre alguém', () => {
    // Os pesos vêm de CRITERIOS e mudam com o balanceamento; o teste calcula a
    // expectativa a partir deles em vez de fixar um número que envelhece.
    const peso = (id: string) => CRITERIOS.find((c) => c.jogoId === id)?.peso ?? 0
    const pg = peso('alfabeto-grego')
    const pp = peso('pi')
    const esperado = Math.round(((1 * pg + 0.5 ** CURVA * pp) * 100) / (pg + pp))
    expect(calcular(banco(['alfabeto-grego', 1], ['pi', 0.5])).nota).toBe(esperado)
  })

  it('cálculo rápido é o critério mais leve, e os grandes repertórios os mais pesados', () => {
    const peso = (id: string) => CRITERIOS.find((c) => c.jogoId === id)?.peso ?? 0
    const pesos = CRITERIOS.map((c) => c.peso)
    expect(peso('aritmetica')).toBe(Math.min(...pesos))
    for (const id of ['tabela-periodica', 'paises', 'bandeiras']) {
      expect(peso(id), id).toBe(Math.max(...pesos))
    }
    // π e as constantes valem mais que uma sequência curta qualquer.
    expect(peso('pi')).toBeGreaterThan(peso('phi'))
    expect(peso('constantes-fisicas')).toBeGreaterThan(peso('aritmetica'))
  })

  it('nenhum critério inventa um degrau de peso fora da escala', () => {
    // O compilador já cobra isto — `peso` é tipado por `ESCALA_DE_PESO` —, e o
    // teste cobra de novo porque o tipo some no primeiro `as` de quem tiver
    // pressa. O que se quer impedir é o `peso: 2.5` de quem acha que o jogo dele
    // merece um pouco mais que 2: a partir daí a escala é uma opinião por
    // arquivo, e a régua da nota muda de forma sem ninguém ter decidido nada.
    for (const c of CRITERIOS) {
      expect(ESCALA_DE_PESO, `${c.jogoId} usa peso ${c.peso}, fora da escala`).toContain(c.peso)
    }
  })

  it('a escala declarada é a escala em uso — sem degrau morto nem fora de ordem', () => {
    // Degrau documentado e não usado é documentação mentindo, que é exatamente
    // o defeito que esta auditoria achou: o comentário anunciava "três degraus,
    // de 1 a 3" enquanto a tabela já usava cinco valores, de 0,5 a 4.
    const emUso = new Set<number>(CRITERIOS.map((c) => c.peso))
    for (const p of ESCALA_DE_PESO) {
      expect(emUso.has(p), `a escala anuncia o peso ${p} e nenhum critério usa`).toBe(true)
    }
    expect([...ESCALA_DE_PESO]).toEqual([...ESCALA_DE_PESO].sort((a, b) => b - a))
    expect(new Set(ESCALA_DE_PESO).size).toBe(ESCALA_DE_PESO.length)
  })

  it('o peso é amplificador relativo: a fatia dos grandes é a do banco, não a do catálogo', () => {
    // A auditoria de setembro de 2026: quando o catálogo foi de 26 para 69
    // critérios, os quatro grandes repertórios caíram de 31,7% para 12,4% do
    // peso **somado do catálogo**, e a leitura natural disso é "a nota deixou de
    // ser sobre os grandes feitos". Ela está errada, e é este teste que diz por
    // quê: esse total não entra na conta. O denominador é o dos jogos jogados,
    // então quem joga os grandes continua tendo os grandes como a maior parte da
    // própria nota — foi o que os 31,2% do banco real do dono mostraram.
    const maior = Math.max(...CRITERIOS.map((c) => c.peso))
    const grandes = CRITERIOS.filter((c) => c.peso === maior)
    const noCatalogo =
      grandes.reduce((s, c) => s + c.peso, 0) / CRITERIOS.reduce((s, c) => s + c.peso, 0)

    const m = calcular(
      banco(
        ...grandes.map((c) => [c.jogoId, 0.8] as [string, number]),
        ['pi', 0.6],
        ['aritmetica', 0.6],
        ['alfabeto-grego', 0.6],
        ['formulas', 0.6],
      ),
    )
    const naNota = m.linhas.filter((l) => l.naNota)
    const noBanco =
      naNota.filter((l) => l.peso === maior).reduce((s, l) => s + l.peso, 0) /
      naNota.reduce((s, l) => s + l.peso, 0)

    expect(noCatalogo).toBeLessThan(0.2)
    expect(noBanco).toBeGreaterThan(0.6)
  })

  it('a nota de área também só olha o que foi jogado nela', () => {
    const m = calcular(banco(['pi', 0.6]))
    const seq = m.areas.find((a) => a.area === 'sequencia')
    const mem = m.areas.find((a) => a.area === 'memoria')
    const esperado = Math.round(0.6 ** CURVA * 100)
    expect(seq?.nota).toBe(esperado)
    // Nada de repertório jogado: a área fica em zero, não arrasta a nota geral.
    expect(mem?.nota).toBe(0)
    expect(m.nota).toBe(esperado)
  })
})

describe('nota por categoria', () => {
  const categoriaDe = (jogoId: string) => JOGOS.find((j) => j.id === jogoId)?.categoria
  const peso = (id: string) => CRITERIOS.find((c) => c.jogoId === id)?.peso ?? 0

  it('usa a mesma curva e os mesmos pesos da nota geral', () => {
    // Dois jogos de geografia com frações e pesos diferentes: se a nota da
    // matéria tivesse fórmula própria (média simples, sem curva), este número
    // não bateria.
    expect(categoriaDe('paises')).toBe('geografia')
    expect(categoriaDe('estados')).toBe('geografia')

    const m = calcular(banco(['paises', 0.4], ['estados', 0.8]))
    const geo = m.categorias.find((c) => c.categoria === 'geografia')

    const pp = peso('paises')
    const pe = peso('estados')
    const esperado = Math.round(
      ((0.4 ** CURVA * pp + 0.8 ** CURVA * pe) * 100) / (pp + pe),
    )

    expect(geo?.nota).toBe(esperado)
    expect(geo?.jogados).toBe(2)
  })

  it('categoria sem jogo jogado não vira 0 disfarçado', () => {
    const m = calcular(banco(['paises', 0.5]))

    for (const c of m.categorias) {
      if (c.categoria === 'geografia') {
        expect(c.nota).not.toBeNull()
        expect(c.jogados).toBeGreaterThan(0)
      } else {
        // `null` e não 0: zero é ir mal, isto é não ter ido.
        expect(c.nota, c.categoria).toBeNull()
        expect(c.jogados, c.categoria).toBe(0)
      }
      // A cobertura existe mesmo sem nota, senão o mostrador não tem o "de M".
      //
      // A exceção é a categoria recém-aberta: ela entra em `CATEGORIAS` antes
      // dos jogos dela existirem — foi assim que Biológicas nasceu —, e nesse
      // intervalo o certo é justamente não ter nota nem cobertura, em vez de um
      // zero que se confunde com desempenho ruim.
      if (c.jogos === 0) expect(c.nota, c.categoria).toBeNull()
      else expect(c.jogos, c.categoria).toBeGreaterThan(0)
    }
  })

  it('jogar mal é diferente de não jogar', () => {
    // Uma partida de 1 ponto dá nota baixa, mas nota; a matéria vizinha segue
    // sem nota nenhuma.
    const m = calcular({ versao: 1, entradas: { paises: entrada(1) } })
    const geo = m.categorias.find((c) => c.categoria === 'geografia')
    expect(geo?.nota).toBeGreaterThan(0)
    expect(geo?.nota).toBeLessThan(20)
    expect(m.categorias.find((c) => c.categoria === 'quimica')?.nota).toBeNull()
  })

  it('bate com a nota geral quando só há jogos de uma categoria', () => {
    const m = calcular(banco(['paises', 0.4], ['estados', 0.8], ['capitais', 1]))
    const geo = m.categorias.find((c) => c.categoria === 'geografia')
    expect(geo?.nota).toBe(m.nota)
  })

  it('toda categoria do menu aparece, e cada critério cai em exatamente uma', () => {
    const m = calcular({ versao: 1, entradas: {} })
    expect(m.categorias.map((c) => c.categoria)).toEqual([...CATEGORIAS])
    expect(m.categorias.reduce((s, c) => s + c.jogos, 0)).toBe(CRITERIOS.length)
    // Sem jogar nada, nenhuma matéria inventa uma nota.
    expect(m.categorias.every((c) => c.nota === null)).toBe(true)
  })
})

/**
 * O denominador, recalculado aqui por fora.
 *
 * É o coração da mudança, então não dá para conferir comparando `calcular` com
 * ele mesmo — isso passaria com qualquer fórmula. `pesoJogado` soma só os
 * critérios presentes no banco; `pesoDoCatalogo` soma todos, que era a régua
 * antiga. O teste exige o primeiro e proíbe o segundo.
 */
function pesos(jogos: [string, number][]) {
  let soma = 0
  let pesoJogado = 0

  for (const [jogoId, fracao] of jogos) {
    const c = CRITERIOS.find((x) => x.jogoId === jogoId)
    if (!c) throw new Error(`critério inexistente: ${jogoId}`)
    const pontos = Math.round(c.meta * fracao)
    if (pontos === 0) continue
    soma += Math.min(1, pontos / c.meta) ** CURVA * c.peso
    pesoJogado += c.peso
  }

  const pesoDoCatalogo = CRITERIOS.reduce((s, c) => s + c.peso, 0)
  return {
    pelaRegraNova: pesoJogado === 0 ? 0 : Math.round((soma * 100) / pesoJogado),
    pelaRegraAntiga: Math.round((soma * 100) / pesoDoCatalogo),
  }
}

describe('o denominador é só o que foi jogado', () => {
  // É isto que faz lançar jogo novo não derrubar a nota de ninguém: o tamanho
  // do catálogo não aparece na conta.
  const casos: [string, [string, number][]][] = [
    ['dois de repertório pela metade', [['tabela-periodica', 0.5], ['formulas', 0.5]]],
    ['um de sequência só', [['pi', 0.4]]],
    ['mistura de áreas e pesos', [['tabela-periodica', 0.9], ['pi', 0.3], ['aritmetica', 0.6]]],
    ['tudo no máximo', [['alfabeto-grego', 1], ['prefixos-si', 1]]],
  ]

  for (const [nome, jogos] of casos) {
    it(nome, () => {
      const { pelaRegraNova, pelaRegraAntiga } = pesos(jogos)
      expect(calcular(banco(...jogos)).nota).toBe(pelaRegraNova)
      // Sem isto o caso passaria por coincidência quando as duas réguas batem.
      expect(pelaRegraNova).toBeGreaterThan(pelaRegraAntiga)
    })
  }

  it('maxar um jogo só dá 100, e a cobertura é quem denuncia', () => {
    const m = calcular(banco(['pi', 1]))
    expect(m.nota).toBe(100)
    expect(m.jogados).toBe(1)
    expect(m.total).toBe(CRITERIOS.length)
  })
})

describe('potencial', () => {
  it('nunca é negativo: levar um jogo ao máximo jamais baixa a nota', () => {
    for (const b of [
      banco(['pi', 0.9]),
      banco(['pi', 1], ['formulas', 1]),
      banco(['tabela-periodica', 0.3], ['aritmetica', 0.95], ['phi', 0.1]),
    ]) {
      for (const l of calcular(b).linhas) {
        expect(l.potencial, `${l.jogoId} tem potencial negativo`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('é zero quando tudo que foi jogado já está no teto', () => {
    const m = calcular(banco(['pi', 1]))
    expect(m.linhas.find((l) => l.jogoId === 'pi')?.potencial).toBe(0)
  })

  it('aponta o próximo passo para onde há mais nota a ganhar', () => {
    const m = calcular(banco(['tabela-periodica', 0.9], ['pi', 0.1]))
    expect(m.proximoPasso?.jogoId).toBe('pi')
  })
})

describe('como subir de faixa', () => {
  /** O mesmo banco, com um jogo levado exatamente ao alvo recomendado. */
  function cumprindo(base: Banco, p: PassoParaSubir): Banco {
    return { ...base, entradas: { ...base.entradas, [p.jogoId]: entrada(p.alvo) } }
  }

  it('o alvo recomendado realmente alcança a faixa — todos eles', () => {
    // Este é o teste que importa: a recomendação promete "faça isto e você
    // sobe". Se o alvo estivesse um ponto abaixo, a frase seria mentira.
    const base = banco(['pi', 0.5], ['formulas', 0.5])
    const m = calcular(base)
    const minimo = m.proximaFaixa?.faixa.minimo

    expect(minimo).toBeDefined()
    expect(m.subirPedeMaisDeUmJogo).toBe(false)
    expect(m.comoSubir.length).toBeGreaterThan(0)
    expect(m.comoSubir.length).toBeLessThanOrEqual(3)

    for (const p of m.comoSubir) {
      expect(calcular(cumprindo(base, p)).nota, p.jogoId).toBeGreaterThanOrEqual(minimo as number)
      expect(p.faltam, p.jogoId).toBeGreaterThan(0)
      expect(p.alvo - p.faltam, p.jogoId).toBe(
        m.linhas.find((l) => l.jogoId === p.jogoId)?.recorde,
      )
    }
  })

  it('o alvo é o mínimo: um ponto a menos já não sobe', () => {
    const base = banco(['pi', 0.5], ['formulas', 0.5])
    const m = calcular(base)
    const minimo = m.proximaFaixa?.faixa.minimo as number

    for (const p of m.comoSubir) {
      const quaseLa = { ...p, alvo: p.alvo - 1 }
      expect(calcular(cumprindo(base, quaseLa)).nota, p.jogoId).toBeLessThan(minimo)
    }
  })

  it('um jogo nunca jogado pode ser recomendado, contando a entrada no denominador', () => {
    // Ele muda os dois lados da divisão ao entrar, então um alvo calculado com
    // o peso total congelado sairia errado.
    const base = banco(['pi', 0.5], ['formulas', 0.5])
    const m = calcular(base)
    const minimo = m.proximaFaixa?.faixa.minimo as number

    const novo = m.comoSubir.find((p) => p.partidas === 0)
    expect(novo, 'nenhum jogo intocado entrou na recomendação').toBeDefined()
    expect(calcular(cumprindo(base, novo as PassoParaSubir)).nota).toBeGreaterThanOrEqual(minimo)
  })

  it('jogo já no máximo não é recomendado', () => {
    const m = calcular(banco(['pi', 1], ['formulas', 0.3]))
    expect(m.linhas.find((l) => l.jogoId === 'pi')?.dominado).toBe(true)
    expect(m.comoSubir.map((p) => p.jogoId)).not.toContain('pi')
    for (const p of m.comoSubir) {
      const linha = m.linhas.find((l) => l.jogoId === p.jogoId)
      expect(p.alvo, p.jogoId).toBeLessThanOrEqual(linha?.meta as number)
    }
  })

  it('na faixa mais alta não há o que recomendar', () => {
    const m = calcular(banco(['pi', 1]))
    expect(m.nota).toBe(100)
    expect(m.proximaFaixa).toBeNull()
    expect(m.comoSubir).toEqual([])
    expect(m.subirPedeMaisDeUmJogo).toBe(false)
  })

  /**
   * O plano de mais de um jogo — o que a auditoria do catálogo crescido mexeu.
   *
   * Com 26 critérios, quase sempre existia um jogo que sozinho cruzava a faixa.
   * Com 69 não existe mais: em perfis sintéticos com mais de vinte jogos
   * jogados, de 74% a 96% caem no caso "nenhum jogo sozinho chega lá". O que o
   * medidor fazia então era listar os três de maior `potencial` com o alvo na
   * meta cheia — no banco real do dono do app, "chegue a 195 em países (faltam
   * 54)". Agora, quando um punhado de jogos fecha a conta, os três vêm com
   * alvos proporcionais que somados alcançam mesmo.
   */
  describe('quando nenhum jogo sozinho basta', () => {
    /** Oito critérios na metade da meta: ninguém sozinho sobe, um trio sobe. */
    const oito = () =>
      banco(...CRITERIOS.slice(0, 8).map((c) => [c.jogoId, 0.5] as [string, number]))

    it('o plano somado alcança a faixa — e é isso que a tela promete', () => {
      const base = oito()
      const m = calcular(base)
      const minimo = m.proximaFaixa?.faixa.minimo as number

      expect(m.subirPedeMaisDeUmJogo).toBe(true)
      expect(m.comoSubir.length).toBeGreaterThan(1)

      // Nenhum deles sozinho: se algum sozinho bastasse, o caso seria o outro.
      for (const p of m.comoSubir) {
        expect(calcular(cumprindo(base, p)).nota, p.jogoId).toBeLessThan(minimo)
      }

      // Todos juntos, sim.
      let todos = base
      for (const p of m.comoSubir) todos = cumprindo(todos, p)
      expect(calcular(todos).nota).toBeGreaterThanOrEqual(minimo)
    })

    it('pede o que falta, não a meta cheia', () => {
      // O ponto da mudança. "Zere os três" não é um pedido que alguém faz; o
      // esforço é repartido igual entre os jogos do plano, em fração do que
      // falta em cada um.
      const m = calcular(oito())
      const parciais = m.comoSubir.filter(
        (p) => p.alvo < (CRITERIOS.find((c) => c.jogoId === p.jogoId)?.meta as number),
      )
      expect(parciais.length, 'o plano inteiro está pedindo a meta cheia').toBeGreaterThan(0)
    })

    it('todo passo pede mais do que o recorde, e nunca mais que a meta', () => {
      // Um passo com `faltam: 0` seria uma linha na tela mandando fazer o que já
      // está feito; um alvo acima da meta seria pedir além do que dá nota.
      const m = calcular(oito())
      for (const p of m.comoSubir) {
        const linha = m.linhas.find((l) => l.jogoId === p.jogoId)
        expect(p.faltam, p.jogoId).toBeGreaterThan(0)
        expect(p.alvo, p.jogoId).toBeGreaterThan(linha?.recorde as number)
        expect(p.alvo, p.jogoId).toBeLessThanOrEqual(linha?.meta as number)
      }
    })
  })

  it('quando nem três jogos no máximo bastam, diz isso em vez de inventar um alvo', () => {
    // Catálogo inteiro em 30% da meta: o peso de qualquer jogo é pequeno demais
    // diante da soma de todos, e nem maxar os três maiores cruza a faixa. Aqui
    // o alvo volta a ser a meta cheia — é o "mais perto que dá", não promessa.
    const base = banco(...CRITERIOS.map((c) => [c.jogoId, 0.3] as [string, number]))
    const m = calcular(base)
    const minimo = m.proximaFaixa?.faixa.minimo as number

    expect(m.subirPedeMaisDeUmJogo).toBe(true)
    expect(m.comoSubir.length).toBe(3)

    for (const p of m.comoSubir) {
      // O alvo vira a meta cheia, e mesmo assim não chega — é o "mais perto que
      // dá", não uma promessa.
      expect(p.alvo, p.jogoId).toBe(CRITERIOS.find((c) => c.jogoId === p.jogoId)?.meta)
      expect(calcular(cumprindo(base, p)).nota, p.jogoId).toBeLessThan(minimo)
    }
  })

  it('prioriza o jogo mais jogado quando o esforço é parecido', () => {
    // Mesmo peso, mesma meta, mesma fração: só as partidas diferem.
    const base: Banco = {
      versao: 1,
      entradas: {
        pi: entrada(50),
        e: { ...entrada(15), partidas: 1 },
        phi: { ...entrada(15), partidas: 40 },
      },
    }
    const ids = calcular(base).comoSubir.map((p) => p.jogoId)
    expect(ids).toContain('phi')
    if (ids.includes('e')) expect(ids.indexOf('phi')).toBeLessThan(ids.indexOf('e'))
  })
})

describe('um jogo recém-lançado', () => {
  /**
   * Regressão da queixa "fiz 12 em geometria molecular e não contou ponto".
   *
   * Cobre a cadeia inteira de um jogo novo: ele existe no registry, tem
   * critério com meta igual ao tamanho do baralho, e uma partida gravada
   * aparece no Nerdômetro. Um jogo registrado sem critério — ou com o id
   * escrito diferente nos dois lugares — pontuaria na tela do jogo e sumiria
   * da nota, sem erro nenhum.
   */
  it('todo jogo do registry tem critério, e todo critério tem jogo', () => {
    const doRegistry = new Set(JOGOS.map((j) => j.id))
    const dosCriterios = new Set(CRITERIOS.map((c) => c.jogoId))
    for (const id of doRegistry) {
      expect(dosCriterios.has(id), `${id} está no registry e fora do Nerdômetro`).toBe(true)
    }
    for (const id of dosCriterios) {
      expect(doRegistry.has(id), `${id} tem critério mas não existe como jogo`).toBe(true)
    }
  })

  it('12 pontos num baralho de 32 entram na nota', () => {
    const b = { versao: 1 as const, entradas: { 'geometria-molecular': entrada(12) } }
    const m = calcular(b)
    const linha = m.linhas.find((l) => l.jogoId === 'geometria-molecular')
    expect(linha?.recorde).toBe(12)
    expect(linha?.meta).toBe(32)
    expect(m.jogados).toBe(1)
    expect(m.nota).toBe(Math.round((12 / 32) ** CURVA * 100))
  })
})

describe('banco vazio', () => {
  it('não divide por zero', () => {
    const m = calcular({ versao: 1, entradas: {} })
    expect(m.nota).toBe(0)
    expect(m.jogados).toBe(0)
  })

  it('run inteira com zero ponto não matricula o jogo', () => {
    // Senão jogar mal doeria mais do que nunca ter aberto o jogo.
    const m = calcular({ versao: 1, entradas: { pi: entrada(0) } })
    expect(m.jogados).toBe(0)
    expect(m.nota).toBe(0)
  })
})

describe('a estreia não conta', () => {
  it('uma partida só não entra na nota, e a tela diz que ele existe', () => {
    // A queixa que isto resolve: abrir a notação científica, fazer 3 de 25 e ver
    // a nota cair. Experimentar não pode custar nota.
    const m = calcular({ versao: 1, entradas: { pi: entrada(50), 'ordem-de-grandeza': estreia(3) } })
    const so = calcular({ versao: 1, entradas: { pi: entrada(50) } })

    expect(m.nota).toBe(so.nota)
    expect(m.jogados).toBe(1)
    expect(m.emExperiencia.map((l) => l.jogoId)).toEqual(['ordem-de-grandeza'])
    expect(m.linhas.find((l) => l.jogoId === 'ordem-de-grandeza')?.naNota).toBe(false)
  })

  it('a segunda partida matricula o jogo, para o bem e para o mal', () => {
    const ruim = calcular({ versao: 1, entradas: { pi: entrada(50), 'ordem-de-grandeza': entrada(3) } })
    const so = calcular({ versao: 1, entradas: { pi: entrada(50) } })

    expect(ruim.nota).toBeLessThan(so.nota)
    expect(ruim.emExperiencia).toHaveLength(0)
    expect(ruim.jogados).toBe(2)
  })

  it('quem fecha o baralho na estreia entra na hora', () => {
    // A regra crua dizia "fez 24 de 24 do alfabeto grego e não contou", que é
    // pior que o problema que ela resolve. Chegou à meta, já provou.
    const m = calcular({ versao: 1, entradas: { 'alfabeto-grego': estreia(24) } })
    expect(m.linhas.find((l) => l.jogoId === 'alfabeto-grego')?.naNota).toBe(true)
    expect(m.nota).toBe(100)
    expect(m.emExperiencia).toHaveLength(0)
    expect(m.jogados).toBe(1)
  })

  it('passar da meta na estreia também vale — recorde acima de 100% conta igual', () => {
    const m = calcular({ versao: 1, entradas: { nox: estreia(43) } })
    expect(m.linhas.find((l) => l.jogoId === 'nox')?.naNota).toBe(true)
    expect(m.nota).toBe(100)
  })

  it('a área e a matéria seguem a mesma régua da nota geral', () => {
    const m = calcular({ versao: 1, entradas: { 'derivadas-rapidas': entrada(25), nox: estreia(5) } })
    expect(m.areas.find((a) => a.area === 'velocidade')?.nota).toBe(100)
    expect(m.categorias.find((c) => c.categoria === 'quimica')?.nota).toBeNull()
    expect(m.categorias.find((c) => c.categoria === 'quimica')?.jogados).toBe(0)
  })

  it('o que subir a nota pode ser justamente voltar a um jogo em experiência', () => {
    // Ele está fora da conta, mas pode ser recomendado: alcançar o alvo custa
    // uma partida, e é ela que o matricula.
    const base: Banco = { versao: 1, entradas: { pi: entrada(50), formulas: estreia(20) } }
    const m = calcular(base)
    const passo = m.comoSubir.find((p) => p.jogoId === 'formulas')
    if (passo) {
      const cumprido = {
        ...base,
        entradas: { ...base.entradas, formulas: entrada(passo.alvo) },
      }
      expect(calcular(cumprido).nota).toBeGreaterThanOrEqual(
        m.proximaFaixa?.faixa.minimo as number,
      )
    }
    expect(m.emExperiencia).toHaveLength(1)
  })
})

describe('o catálogo cresceu', () => {
  /**
   * O medidor nasceu com 15 jogos, está com 60 e vai a 72 com Biológicas.
   *
   * São dois riscos diferentes, e os dois têm teste aqui: a nota mudar de
   * significado quando o catálogo cresce (a razão de `media` só olhar o que foi
   * jogado) e `calcular` ficar caro — `alvoParaFaixa` faz busca binária por
   * jogo, então o custo cresce com o número de critérios vezes o tamanho da
   * maior meta.
   */
  const CHEIO: Banco = {
    versao: 1,
    entradas: Object.fromEntries(
      CRITERIOS.map((c) => [c.jogoId, entrada(Math.round(c.meta * 0.5))]),
    ),
  }

  it('entrada de jogo que não é critério não mexe na nota', () => {
    // É o mesmo invariante de lançar jogo novo, visto do outro lado: o banco de
    // quem jogou uma versão anterior do app carrega ids que já não existem.
    const comLixo: Banco = {
      ...CHEIO,
      entradas: { ...CHEIO.entradas, 'jogo-que-nao-existe-mais': entrada(999) },
    }
    expect(calcular(comLixo).nota).toBe(calcular(CHEIO).nota)
    expect(calcular(comLixo).total).toBe(CRITERIOS.length)
  })

  it('a nota com o catálogo inteiro na metade é a metade pela curva, e não outra coisa', () => {
    // Todos na mesma fração: o peso some da conta (média ponderada de valores
    // iguais é o próprio valor), então o resultado tem de ser exatamente a
    // curva aplicada a 0,5 — qualquer desvio aqui é bug de ponderação.
    expect(calcular(CHEIO).nota).toBe(Math.round(0.5 ** CURVA * 100))
  })

  it('calcular o medidor inteiro é barato', () => {
    // Inclui `comoSubir`, que é a parte cara. O limite é generoso de propósito:
    // o que se quer pegar é a regressão de ordem de grandeza — uma busca linear
    // no lugar da binária, ou `media` recalculada dentro do laço.
    const inicio = performance.now()
    for (let i = 0; i < 20; i++) calcular(CHEIO)
    const porChamada = (performance.now() - inicio) / 20
    expect(porChamada, `${porChamada.toFixed(1)} ms por chamada`).toBeLessThan(150)
  })
})
