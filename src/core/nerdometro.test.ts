import { describe, expect, it } from 'vitest'
import { JOGOS } from './registry'
import {
  calcular as medir,
  CRITERIOS,
  CURVA,
  BONUS_DE_LIMPEZA,
  degrauDe,
  DIAS_ATE_O_PISO,
  DIAS_DE_GRACA,
  ESCALA_DE_PESO,
  FAIXAS,
  ferrugemEm,
  NOTA_MAXIMA,
  ofensiva,
  PARTIDAS_NA_JANELA,
  PATENTES,
  PISO_DA_FERRUGEM,
  TETO_DO_JOGO,
} from './nerdometro'
import type { Faixa, PassoParaSubir } from './nerdometro'
import type { Banco, Entrada, Partida } from './storage'
import { CATEGORIAS } from './types'

/**
 * O relógio dos testes.
 *
 * Desde que a ferrugem entrou, a nota depende de que dia é hoje — e um teste que
 * chama `new Date()` de verdade passa hoje e falha em dezembro, quando as
 * partidas fixadas aqui tiverem três meses. Todo teste mede a partir deste
 * instante; quem precisa de outro dia passa a data explicitamente.
 */
const AGORA = new Date('2026-09-16T12:00:00.000Z')

const calcular = (b: Banco, agora: Date = AGORA) => medir(b, agora)

const DIA = 24 * 60 * 60 * 1000

/** O mesmo instante, `dias` depois. */
const daqui = (dias: number) => new Date(AGORA.getTime() + dias * DIA)

/** Uma data ISO de `dias` atrás — para montar entrada já enferrujada. */
const emDias = (dias: number) => new Date(AGORA.getTime() - dias * DIA).toISOString()

/**
 * Jogo já estabelecido: duas partidas.
 *
 * Duas, e não uma, por causa da carência de estreia — a primeira partida não
 * entra na nota (ver `PARTIDAS_PARA_ENTRAR`). Quem testa a carência usa
 * `estreia()` logo abaixo; todo o resto quer um jogo que já conta, senão cada
 * teste de fórmula estaria medindo a carência sem querer.
 */
function entrada(pontuacao: number, erros = 1): Entrada {
  return {
    recorde: { pontuacao, duracaoMs: 1000, erros, completou: false, emISO: '2026-09-15T12:00:00.000Z' },
    partidas: 2,
    ultimaPontuacao: pontuacao,
    ultimaEmISO: '2026-09-15T12:00:00.000Z',
    historico: [{ pontuacao, duracaoMs: 1000, erros, emISO: '2026-09-15T12:00:00.000Z', runId: `r-${pontuacao}` }],
    ultimosRuns: [{ id: `r-${pontuacao}`, pontuacao }],
  }
}

/**
 * A mesma partida, sem nenhum erro — a que ganha `BONUS_DE_LIMPEZA` quando
 * também bate a meta.
 *
 * O padrão de `entrada` é **um** erro de propósito: com zero, todo teste que
 * leva um jogo à meta ganharia 15% de bônus sem pedir, e o número esperado de
 * meia dúzia de testes de fórmula passaria a medir o bônus sem que o nome deles
 * dissesse isso.
 */
const entradaLimpa = (pontuacao: number) => entrada(pontuacao, 0)

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

/**
 * A nota deixou de ser catraca.
 *
 * Duas peças, e os testes daqui existem para cobrar cada uma no que ela tem de
 * diferente: a **janela** faz jogar mal custar, a **ferrugem** faz sumir custar.
 * O que se protege acima de tudo é que o recorde histórico saiu da conta sem
 * sair da tela — ele continua sendo a marca da pessoa, só parou de ser a régua.
 */
describe('a nota não é catraca', () => {
  /** Uma entrada com placares dados, o mais recente primeiro, todos de hoje. */
  function comHistorico(pontuacoes: number[], diasAtras = 0): Entrada {
    const emISO = new Date(AGORA.getTime() - diasAtras * DIA).toISOString()
    const historico: Partida[] = pontuacoes.map((pontuacao, i) => ({
      pontuacao,
      duracaoMs: 1000,
      erros: 0,
      emISO,
      runId: `r-${i}-${pontuacao}`,
    }))

    return {
      // O recorde é o maior de todos os tempos, como o `storage` o mantém: é
      // justamente a divergência entre ele e a janela que estes testes medem.
      recorde: {
        pontuacao: Math.max(...pontuacoes),
        duracaoMs: 1000,
        erros: 0,
        completou: false,
        emISO,
      },
      partidas: pontuacoes.length,
      ultimaPontuacao: pontuacoes[0] as number,
      ultimaEmISO: emISO,
      historico,
      ultimosRuns: [],
    }
  }

  const meta = (id: string) => CRITERIOS.find((c) => c.jogoId === id)?.meta as number
  const linhaDe = (b: Banco, id: string, agora?: Date) =>
    calcular(b, agora).linhas.find((l) => l.jogoId === id)

  describe('a janela das últimas partidas', () => {
    it('o que conta é o melhor das cinco últimas, não o recorde de sempre', () => {
      // 100 casas de π um dia, e as cinco últimas sessões na casa dos 30. A nota
      // não pode continuar dizendo 100: quem esqueceu, esqueceu.
      const alto = meta('pi')
      const b: Banco = { versao: 1, entradas: { pi: comHistorico([30, 28, 33, 31, 29, alto]) } }
      const l = linhaDe(b, 'pi')

      expect(l?.recorde).toBe(alto)
      expect(l?.vigente).toBe(33)
      expect(l?.fracao).toBeCloseTo(33 / alto, 5)
      expect(l?.dominado).toBe(false)
    })

    it('uma sessão ruim no meio de boas não derruba nada', () => {
      // O ponto de cinco partidas em vez de três: a nota mede repertório, não
      // humor. Uma noite ruim entre quatro boas é ruído.
      const b: Banco = { versao: 1, entradas: { pi: comHistorico([12, 80, 78, 82, 79]) } }
      expect(linhaDe(b, 'pi')?.vigente).toBe(82)
    })

    it('mas cinco ruins seguidas apagam o recorde antigo', () => {
      const b: Banco = { versao: 1, entradas: { pi: comHistorico([12, 11, 14, 10, 13, 100]) } }
      const l = linhaDe(b, 'pi')
      expect(l?.recorde).toBe(100)
      expect(l?.vigente).toBe(14)
    })

    it('a janela é exatamente PARTIDAS_NA_JANELA', () => {
      // A partida boa está na posição N+1: dentro da janela ela contaria, fora
      // dela não. É o teste que pega um `slice` com o número errado.
      const dentro = Array(PARTIDAS_NA_JANELA - 1).fill(20).concat([90])
      const fora = Array(PARTIDAS_NA_JANELA).fill(20).concat([90])
      const banquinho = (h: number[]): Banco => ({ versao: 1, entradas: { pi: comHistorico(h) } })

      expect(linhaDe(banquinho(dentro), 'pi')?.vigente).toBe(90)
      expect(linhaDe(banquinho(fora), 'pi')?.vigente).toBe(20)
    })

    it('banco antigo, sem histórico, ainda vale pelo recorde', () => {
      // O formato de 2025 não guardava partidas. Zerar a nota dessa gente seria
      // punir por uma migração de formato.
      const b: Banco = { versao: 1, entradas: { pi: { ...entrada(60), historico: [] } } }
      expect(linhaDe(b, 'pi')?.vigente).toBe(60)
    })
  })

  describe('a ferrugem', () => {
    it('a primeira semana não custa nada', () => {
      const b = banco(['pi', 0.8])
      expect(linhaDe(b, 'pi', daqui(DIAS_DE_GRACA - 1))?.ferrugem).toBe(1)
      expect(calcular(b).nota).toBe(calcular(b, daqui(DIAS_DE_GRACA - 1)).nota)
    })

    it('depois dela, cai em linha reta até o piso — e para ali', () => {
      const b = banco(['pi', 0.8])
      const em = (dias: number) => linhaDe(b, 'pi', daqui(dias))?.ferrugem as number

      expect(em(DIAS_DE_GRACA + 1)).toBeLessThan(1)
      expect(em(DIAS_ATE_O_PISO)).toBeCloseTo(PISO_DA_FERRUGEM, 5)
      // Largado para sempre não vale zero: quem sumiu ainda sabe o que sabia.
      expect(em(DIAS_ATE_O_PISO * 10)).toBe(PISO_DA_FERRUGEM)
      expect(em(3650)).toBe(PISO_DA_FERRUGEM)

      // Monótona: nenhum dia parado devolve nota.
      for (let d = 0; d < 200; d += 7) expect(em(d)).toBeGreaterThanOrEqual(em(d + 7))
    })

    it('uma semana sumido custa perto de um ponto e meio de nota', () => {
      // O número que o dono do app escolheu, cobrado onde ele é sentido: a nota.
      // Se alguém mexer na graça, no piso ou no prazo sem querer, é aqui que
      // aparece.
      const b = banco(...CRITERIOS.map((c) => [c.jogoId, 0.9] as [string, number]))
      const hoje = calcular(b).nota
      const semana = calcular(b, daqui(DIAS_DE_GRACA + 7)).nota

      expect(hoje - semana).toBeGreaterThanOrEqual(1)
      expect(hoje - semana).toBeLessThanOrEqual(2)
    })

    it('o elo desce junto: é para isso que a ferrugem existe', () => {
      const b = banco(...CRITERIOS.map((c) => [c.jogoId, 0.95] as [string, number]))
      const agora = calcular(b)
      const depois = calcular(b, daqui(DIAS_ATE_O_PISO))

      expect(agora.faixa.indice).toBeGreaterThan(depois.faixa.indice)
      expect(depois.custoDaFerrugem).toBeGreaterThan(0)
    })

    it('data ilegível ou relógio para trás não derrubam ninguém', () => {
      // `Date.parse` devolve NaN para lixo, e máquina com relógio errado manda
      // data no futuro. Nos dois casos o erro não pode custar nota.
      const lixo: Banco = {
        versao: 1,
        entradas: { pi: { ...entrada(50), ultimaEmISO: 'ontem de tarde' } },
      }
      expect(linhaDe(lixo, 'pi')?.ferrugem).toBe(1)

      const futuro = banco(['pi', 0.5])
      expect(linhaDe(futuro, 'pi', daqui(-400))?.ferrugem).toBe(1)
    })

    it('a lista de enferrujados é a lista de tarefas, na ordem do prejuízo', () => {
      // Ordenada por quanto cada um está custando — fração perdida vezes peso —,
      // porque "revisite estes" só vale se disser por onde começar.
      const b: Banco = {
        versao: 1,
        entradas: {
          'tabela-periodica': { ...entrada(100), ultimaEmISO: emDias(120) },
          aritmetica: { ...entrada(30), ultimaEmISO: emDias(120) },
          pi: entrada(70),
        },
      }
      const m = calcular(b)

      expect(m.enferrujados.map((l) => l.jogoId)).toEqual(['tabela-periodica', 'aritmetica'])
      expect(m.enferrujados.every((l) => l.ferrugem < 1)).toBe(true)
      // O que está fresco não entra, e o custo é a diferença para a nota sem
      // ferrugem nenhuma.
      expect(m.enferrujados.map((l) => l.jogoId)).not.toContain('pi')
      expect(m.custoDaFerrugem).toBeGreaterThan(0)
    })

    it('ferrugemEm é contínua na borda da graça', () => {
      // Um degrau aqui seria a nota caindo de uma vez no oitavo dia, e ninguém
      // entenderia por quê.
      expect(ferrugemEm(DIAS_DE_GRACA)).toBe(1)
      expect(ferrugemEm(DIAS_DE_GRACA + 0.001)).toBeCloseTo(1, 4)
    })
  })

  describe('o que a recomendação passa a pedir', () => {
    it('o alvo é contado do placar vigente, não do recorde enterrado', () => {
      // Quem fez 100 em π um dia e anda fazendo 30 precisa ouvir "faltam 20",
      // não "faltam 0 porque você já fez isso uma vez".
      const b: Banco = {
        versao: 1,
        entradas: {
          pi: comHistorico([30, 28, 33, 31, 29, 100]),
          formulas: entrada(Math.round(meta('formulas') * 0.5)),
        },
      }
      const m = calcular(b)
      const passo = m.comoSubir.find((p) => p.jogoId === 'pi')

      if (passo) {
        expect(passo.alvo).toBeGreaterThan(33)
        expect(passo.faltam).toBe(passo.alvo - 33)
      }
      // E o jogo volta a ser candidato mesmo tendo batido a meta um dia.
      expect(m.linhas.find((l) => l.jogoId === 'pi')?.dominado).toBe(false)
    })

    it('cumprir o alvo alcança o elo de verdade — inclusive zerando a ferrugem', () => {
      // A promessa da tela, agora com duas coisas mexendo ao mesmo tempo: a
      // partida nova entra na janela e o relógio daquele jogo volta a zero.
      const base: Banco = {
        versao: 1,
        entradas: {
          pi: { ...entrada(50), ultimaEmISO: emDias(60) },
          formulas: { ...entrada(27), ultimaEmISO: emDias(60) },
        },
      }
      const m = calcular(base)
      const minimo = m.proximaFaixa?.faixa.minimo as number

      for (const p of m.comoSubir) {
        const cumprido: Banco = {
          ...base,
          entradas: { ...base.entradas, [p.jogoId]: entrada(p.alvo) },
        }
        expect(calcular(cumprido).nota, p.jogoId).toBeGreaterThanOrEqual(minimo)
      }
    })
  })
})

/**
 * A escala aberta: a meta é onde o valor cheio começa, não onde acaba.
 *
 * O que se protege aqui são os dois limites que seguram a coisa de pé — o teto
 * por jogo, sem o qual π (meta 100 num baralho de dez mil casas) viraria o app
 * inteiro; e a exigência de a partida limpa ter batido a meta, sem a qual o
 * bônus sairia de graça para quem abandona a partida na terceira carta.
 */
describe('passar de 100', () => {
  const meta = (id: string) => CRITERIOS.find((c) => c.jogoId === id)?.meta as number

  it('superar a meta rende mais, até o teto', () => {
    const alvo = meta('pi')
    const emCima = calcular({ versao: 1, entradas: { pi: entrada(Math.round(alvo * 1.15)) } })
    const noTeto = calcular({ versao: 1, entradas: { pi: entrada(alvo * 10) } })

    expect(emCima.linhas.find((l) => l.jogoId === 'pi')?.fracao).toBeCloseTo(1.15, 2)
    expect(emCima.nota).toBeGreaterThan(100)
    // Dez vezes a meta não vale dez vezes: o teto é o que impede um dataset
    // grande de comprar a nota inteira.
    expect(noTeto.linhas.find((l) => l.jogoId === 'pi')?.fracao).toBe(TETO_DO_JOGO)
    expect(noTeto.nota).toBe(NOTA_MAXIMA)
  })

  it('a meta batida sem errar nada vale o bônus — inclusive onde não dá para superar', () => {
    // A tabela periódica tem meta 118 num baralho de 118: sem o bônus de
    // limpeza, o jogo mais pesado do catálogo seria o único sem teto a alcançar.
    const alvo = meta('tabela-periodica')
    const suja = calcular({ versao: 1, entradas: { 'tabela-periodica': entrada(alvo) } })
    const limpa = calcular({ versao: 1, entradas: { 'tabela-periodica': entradaLimpa(alvo) } })

    expect(suja.linhas.find((l) => l.jogoId === 'tabela-periodica')?.fracao).toBe(1)
    expect(limpa.linhas.find((l) => l.jogoId === 'tabela-periodica')?.fracao).toBeCloseTo(
      1 + BONUS_DE_LIMPEZA,
      5,
    )
    expect(limpa.linhas.find((l) => l.jogoId === 'tabela-periodica')?.limpa).toBe(true)
    expect(limpa.nota).toBeGreaterThan(suja.nota)
  })

  it('partida sem erro que não bateu a meta não ganha bônus nenhum', () => {
    // Sair na terceira carta sem errar não é maestria, é uma partida curta.
    const alvo = meta('tabela-periodica')
    const m = calcular({
      versao: 1,
      entradas: { 'tabela-periodica': entradaLimpa(Math.round(alvo * 0.5)) },
    })
    const linha = m.linhas.find((l) => l.jogoId === 'tabela-periodica')

    expect(linha?.limpa).toBe(false)
    expect(linha?.fracao).toBeCloseTo(0.5, 2)
  })

  it('o bônus também enferruja, como todo o resto', () => {
    // Ele vive dentro da janela e é multiplicado pela ferrugem: uma limpeza de
    // quatro meses atrás não segura a nota de quem sumiu.
    const alvo = meta('tabela-periodica')
    const b: Banco = { versao: 1, entradas: { 'tabela-periodica': entradaLimpa(alvo) } }
    expect(calcular(b, daqui(DIAS_ATE_O_PISO)).nota).toBeLessThan(calcular(b).nota)
  })

  it('quem passou da meta não vira candidato a subir, e o potencial dele é zero', () => {
    // A recomendação pede pontuação até a meta; para quem já passou dela não há
    // o que pedir, e simular "chegue à meta" baixaria a nota — o potencial tem
    // de ser zero, nunca negativo.
    const m = calcular({ versao: 1, entradas: { nox: entrada(43), pi: entrada(30) } })
    const linha = m.linhas.find((l) => l.jogoId === 'nox')

    expect(linha?.superado).toBe(true)
    expect(linha?.potencial).toBe(0)
    expect(m.comoSubir.map((p) => p.jogoId)).not.toContain('nox')
  })

  it('a nota máxima é o teto de todos os jogos, e a escala não passa dela', () => {
    const tudo = calcular({
      versao: 1,
      entradas: Object.fromEntries(CRITERIOS.map((c) => [c.jogoId, entrada(c.meta * 5)])),
    })
    expect(tudo.nota).toBe(NOTA_MAXIMA)
    expect(NOTA_MAXIMA).toBeGreaterThan(100)
  })
})

/**
 * A ofensiva: dias seguidos jogando.
 *
 * Duas regras que só aparecem na virada do dia, e por isso são as que mais dão
 * errado: a sequência conta em **dia local** (senão quem joga à noite no Brasil
 * quebra a própria sequência pelo fuso) e **não morre à meia-noite** — se a
 * última partida foi ontem, ela está de pé e vence hoje.
 */
describe('a ofensiva', () => {
  /** Uma entrada com partidas nos dias dados, contados para trás a partir de hoje. */
  function nosDias(...diasAtras: number[]): Entrada {
    const historico: Partida[] = diasAtras.map((d, i) => ({
      pontuacao: 10,
      duracaoMs: 1000,
      erros: 1,
      // Meio-dia local: a partida fica no dia que o teste diz, em qualquer fuso.
      emISO: new Date(new Date(AGORA).setHours(12, 0, 0, 0) - d * DIA).toISOString(),
      runId: `r${d}-${i}`,
    }))

    return {
      recorde: { pontuacao: 10, duracaoMs: 1000, erros: 1, completou: false, emISO: (historico[0] as Partida).emISO },
      partidas: historico.length,
      ultimaPontuacao: 10,
      ultimaEmISO: (historico[0] as Partida).emISO,
      historico,
      ultimosRuns: [],
    }
  }

  const comPartidas = (...diasAtras: number[]): Banco => ({
    versao: 1,
    entradas: { pi: nosDias(...diasAtras) },
  })

  it('conta os dias seguidos até hoje', () => {
    const o = ofensiva(comPartidas(0, 1, 2, 3), AGORA)
    expect(o.dias).toBe(4)
    expect(o.hoje).toBe(true)
  })

  it('um buraco quebra a sequência', () => {
    // Jogou hoje, ontem e anteontem não: a sequência é de um dia, por mais
    // partidas que existam antes do buraco.
    expect(ofensiva(comPartidas(0, 3, 4, 5, 6), AGORA).dias).toBe(1)
  })

  it('jogou ontem e ainda não hoje: a sequência está viva e vence hoje', () => {
    // Zerar à meia-noite puniria quem acordou e ainda não jogou. A tela cobra
    // pelo `hoje: false` em vez de apagar o número.
    const o = ofensiva(comPartidas(1, 2, 3), AGORA)
    expect(o.dias).toBe(3)
    expect(o.hoje).toBe(false)
  })

  it('dois dias sem jogar: a sequência acabou', () => {
    const o = ofensiva(comPartidas(2, 3, 4), AGORA)
    expect(o.dias).toBe(0)
    // Mas o recorde é memória, não estado atual: ele fica.
    expect(o.recorde).toBe(3)
  })

  it('várias partidas no mesmo dia contam como um dia só', () => {
    expect(ofensiva(comPartidas(0, 0, 0, 1), AGORA).dias).toBe(2)
  })

  it('a sequência atravessa jogos diferentes', () => {
    // O hábito é de abrir o app, não de jogar sempre o mesmo jogo.
    const b: Banco = { versao: 1, entradas: { pi: nosDias(0, 1), formulas: nosDias(2, 3) } }
    expect(ofensiva(b, AGORA).dias).toBe(4)
  })

  it('o recorde guarda a maior sequência de todas, mesmo a de meses atrás', () => {
    const b = comPartidas(0, 1, 60, 61, 62, 63, 64)
    const o = ofensiva(b, AGORA)
    expect(o.dias).toBe(2)
    expect(o.recorde).toBe(5)
  })

  it('banco vazio não tem ofensiva, e isso não é zero de mentira', () => {
    const o = ofensiva({ versao: 1, entradas: {} }, AGORA)
    expect(o).toEqual({ dias: 0, recorde: 0, hoje: false })
  })

  it('sai igual em `calcular`, que é de onde a tela lê', () => {
    expect(calcular(comPartidas(0, 1, 2)).ofensiva).toEqual(ofensiva(comPartidas(0, 1, 2), AGORA))
  })
})

/**
 * O ranking: cinco patentes, vinte e um elos.
 *
 * O que se protege aqui é a escada — que ela seja uma escada mesmo. Os títulos
 * são derivados de `PATENTES` justamente porque `Nerd IIII` e dois elos com o
 * mesmo mínimo passam por qualquer revisão de código e só aparecem na tela de
 * alguém; e o dia em que alguém esticar o ranking outra vez, é aqui que a conta
 * de romanos, graus e mínimos é cobrada.
 */
describe('o ranking', () => {
  it('é uma escada: mínimos estritamente crescentes, do 0 ao topo', () => {
    // Estritamente: dois elos com o mesmo mínimo fariam um deles inalcançável —
    // `degrauDe` devolveria sempre o de cima, e o de baixo viraria letra morta.
    expect(FAIXAS.length).toBe(21)
    expect(FAIXAS[0]?.minimo).toBe(0)
    for (let i = 1; i < FAIXAS.length; i++) {
      const anterior = FAIXAS[i - 1] as Faixa
      const atual = FAIXAS[i] as Faixa
      expect(atual.minimo, `${atual.titulo} não sobe em relação a ${anterior.titulo}`).toBeGreaterThan(
        anterior.minimo,
      )
      expect(atual.indice).toBe(i)
    }
  })

  it('cada elo custa mais conhecimento que o anterior', () => {
    // A promessa da decisão 2: em pontos de nota os elos crescem de 3 para 7, e
    // em fração das metas — o conhecimento de verdade, depois da curva — a
    // distância entre vizinhos só aumenta. É isso que faz o topo ser caro sem
    // que a tabela precise abrir buracos na escala.
    const fracaoDe = (nota: number) => (nota / 100) ** (1 / CURVA)
    let anterior = 0

    for (let i = 1; i < FAIXAS.length; i++) {
      const salto = fracaoDe((FAIXAS[i] as Faixa).minimo) - fracaoDe((FAIXAS[i - 1] as Faixa).minimo)
      expect(salto, `${(FAIXAS[i] as Faixa).titulo} custa menos que o elo anterior`).toBeGreaterThan(0)
      // Uma folga de 0,005 porque `Virgem IV → V` (6 pontos) vem logo depois de
      // `III → IV` (7): a tabela é redonda em pontos de nota, não em fração.
      expect(salto).toBeGreaterThan(anterior - 0.015)
      anterior = salto
    }
  })

  it('o título é patente e romano, e o romano segue o grau', () => {
    const romanos = ['I', 'II', 'III', 'IV', 'V']

    for (const p of PATENTES) {
      const elos = FAIXAS.filter((f) => f.patente === p.nome)
      expect(elos.length, p.nome).toBe(p.graus.length)

      elos.forEach((f, i) => {
        if (p.graus.length === 1) {
          // A patente de elo único não ganha "I": `Ultra Virgem I` prometeria um
          // `II` que não existe.
          expect(f.grau).toBeNull()
          expect(f.romano).toBeNull()
          expect(f.titulo).toBe(p.nome)
          return
        }
        expect(f.grau).toBe(i + 1)
        expect(f.romano).toBe(romanos[i])
        expect(f.titulo).toBe(`${p.nome} ${romanos[i]}`)
      })
    }

    expect(new Set(FAIXAS.map((f) => f.titulo)).size).toBe(FAIXAS.length)
    expect(FAIXAS.every((f) => f.lema.length > 0)).toBe(true)
  })

  it('degrauDe acha o elo, e a borda pertence ao elo de cima', () => {
    // O mínimo é inclusivo: quem tirou exatamente 37 é `Nerd I`, não `CDF V`.
    // A borda é o lugar onde um `>` no lugar de `>=` passaria despercebido.
    for (const f of FAIXAS) {
      expect(FAIXAS[degrauDe(f.minimo)]?.titulo, `${f.titulo} no próprio mínimo`).toBe(f.titulo)
      if (f.indice > 0) {
        expect(degrauDe(f.minimo - 1), `um ponto abaixo de ${f.titulo}`).toBe(f.indice - 1)
      }
    }

    // Fora da escala dos dois lados: a nota é sempre 0 a 100, mas o piso e o
    // teto não podem depender disso para não devolver `undefined`.
    expect(degrauDe(-5)).toBe(0)
    expect(degrauDe(1000)).toBe(FAIXAS.length - 1)
  })

  it('o arco mede o elo, não a nota', () => {
    // `progressoNoDegrau` é o que o medidor desenha. Ele tem de bater com o
    // "faltam N para o próximo" exibido logo ao lado: os dois saem do mesmo par
    // de mínimos, e divergir seria a tela dizer duas coisas sobre a mesma
    // conquista.
    for (const f of [0.2, 0.35, 0.5, 0.65, 0.8, 0.95]) {
      const m = calcular(banco(...CRITERIOS.map((c) => [c.jogoId, f] as [string, number])))
      expect(m.progressoNoDegrau).toBeGreaterThanOrEqual(0)
      expect(m.progressoNoDegrau).toBeLessThanOrEqual(100)

      const proxima = m.proximaFaixa
      if (!proxima) continue

      const largura = proxima.faixa.minimo - m.faixa.minimo
      expect(m.progressoNoDegrau).toBe(Math.round(((largura - proxima.falta) / largura) * 100))
      expect(proxima.falta).toBeGreaterThan(0)
      expect(proxima.faixa.indice).toBe(m.faixa.indice + 1)
    }
  })

  it('banco vazio é o primeiro elo; nota cheia é o último', () => {
    const zerado = calcular({ versao: 1, entradas: {} })
    expect(zerado.nota).toBe(0)
    expect(zerado.faixa.titulo).toBe('Curioso I')
    expect(zerado.progressoNoDegrau).toBe(0)

    const topo = calcular(banco(['pi', 1]))
    expect(topo.nota).toBe(100)
    expect(topo.faixa.titulo).toBe('Ultra Virgem')
    expect(topo.faixa.indice).toBe(FAIXAS.length - 1)
    // No topo não há próximo elo, mas há para onde crescer: o arco passa a medir
    // o caminho de `Ultra Virgem` até `NOTA_MAXIMA`. Com nota 100 ele está no
    // começo dessa última reta, não cheio.
    expect(topo.proximaFaixa).toBeNull()
    expect(topo.progressoNoDegrau).toBe(
      Math.round(((100 - topo.faixa.minimo) / (NOTA_MAXIMA - topo.faixa.minimo)) * 100),
    )
    expect(topo.progressoNoDegrau).toBeLessThan(100)

    // E enche de verdade só no teto da escala.
    const teto = calcular({ versao: 1, entradas: { pi: entradaLimpa(130) } })
    expect(teto.nota).toBe(NOTA_MAXIMA)
    expect(teto.progressoNoDegrau).toBe(100)
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
    /**
     * Doze critérios na metade da meta: ninguém sozinho sobe, um trio sobe.
     *
     * Eram oito até o ranking de 21 elos entrar. Com as faixas antigas, de 10 a
     * 15 pontos de largura, oito jogos já bastavam para nenhum deles sozinho
     * cruzar; com elos de 3 a 7 pontos, um jogo grande sozinho volta a dar conta
     * e o caso deixa de ser este. O cenário é o mesmo — o que mudou foi quantos
     * jogos jogados são precisos para produzi-lo.
     */
    const doze = () =>
      banco(...CRITERIOS.slice(0, 12).map((c) => [c.jogoId, 0.5] as [string, number]))

    it('o plano somado alcança a faixa — e é isso que a tela promete', () => {
      const base = doze()
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
      const m = calcular(doze())
      const parciais = m.comoSubir.filter(
        (p) => p.alvo < (CRITERIOS.find((c) => c.jogoId === p.jogoId)?.meta as number),
      )
      expect(parciais.length, 'o plano inteiro está pedindo a meta cheia').toBeGreaterThan(0)
    })

    it('todo passo pede mais do que o recorde, e nunca mais que a meta', () => {
      // Um passo com `faltam: 0` seria uma linha na tela mandando fazer o que já
      // está feito; um alvo acima da meta seria pedir além do que dá nota.
      const m = calcular(doze())
      for (const p of m.comoSubir) {
        const linha = m.linhas.find((l) => l.jogoId === p.jogoId)
        expect(p.faltam, p.jogoId).toBeGreaterThan(0)
        expect(p.alvo, p.jogoId).toBeGreaterThan(linha?.recorde as number)
        expect(p.alvo, p.jogoId).toBeLessThanOrEqual(linha?.meta as number)
      }
    })
  })

  it('quando nem três jogos no máximo bastam, diz isso em vez de inventar um alvo', () => {
    // Catálogo inteiro em 75% da meta: o peso de qualquer jogo é pequeno demais
    // diante da soma de todos, e nem maxar os três maiores cruza o elo. Aqui o
    // alvo volta a ser a meta cheia — é o "mais perto que dá", não promessa.
    //
    // Eram 30% quando as faixas tinham de 10 a 15 pontos. O elo de 3 pontos que
    // mora ali agora se cruza com um jogo só, então o caso de fallback mudou de
    // endereço: ele vive na parte alta da escada, onde os elos custam 6 e 7.
    const base = banco(...CRITERIOS.map((c) => [c.jogoId, 0.75] as [string, number]))
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

  it('passar da meta na estreia vale, e vale mais que 100', () => {
    // Antes este teste afirmava o contrário — "recorde acima de 100% conta
    // igual" —, porque a fração era `min(1, …)`. O teto virou `TETO_DO_JOGO`:
    // 43 numa meta de 25 é 172%, que a escala corta em 130% e a curva converte
    // na nota máxima.
    const m = calcular({ versao: 1, entradas: { nox: estreia(43) } })
    const linha = m.linhas.find((l) => l.jogoId === 'nox')

    expect(linha?.naNota).toBe(true)
    expect(linha?.fracao).toBe(TETO_DO_JOGO)
    expect(linha?.superado).toBe(true)
    expect(m.nota).toBe(NOTA_MAXIMA)
    expect(m.nota).toBeGreaterThan(100)
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
