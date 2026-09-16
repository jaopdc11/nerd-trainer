import { beforeEach, describe, expect, it } from 'vitest'
import {
  carregar,
  CHAVE,
  compararBancos,
  entradaDe,
  exportarJSON,
  juntar,
  lerBancoImportado,
  nomeArquivoExport,
  persistir,
  registrar,
  VERSAO_ATUAL,
} from './storage'
import type { Banco, Entrada, Partida, RunGravada } from './storage'
import type { ResultadoRun } from './types'

/** Exportar e importar recordes: preview, junção, substituição e arquivo ruim. */

interface Opcoes {
  readonly partidas?: number
  readonly emISO?: string
  readonly historico?: readonly Partida[]
  readonly runs?: readonly RunGravada[]
}

function ent(pontuacao: number, duracaoMs = 60_000, o: Opcoes = {}): Entrada {
  const emISO = o.emISO ?? '2026-09-01T10:00:00.000Z'
  return {
    recorde: { pontuacao, duracaoMs, erros: 0, completou: false, emISO },
    partidas: o.partidas ?? 1,
    ultimaPontuacao: pontuacao,
    ultimaEmISO: emISO,
    historico: o.historico ?? [{ pontuacao, duracaoMs, erros: 0, emISO, runId: `r${pontuacao}` }],
    ultimosRuns: o.runs ?? [],
  }
}

const banco = (entradas: Record<string, Entrada>): Banco => ({ versao: VERSAO_ATUAL, entradas })

beforeEach(() => {
  window.localStorage.clear()
})

describe('nomeArquivoExport', () => {
  it('usa a data local, não a UTC', () => {
    // 15/09 às 22h em Brasília já é 16/09 em UTC; o nome tem que dizer 15.
    const em = new Date(2026, 8, 15, 22, 30)
    expect(nomeArquivoExport(em)).toBe('nerd-trainer-2026-09-15.json')
  })

  it('preenche mês e dia com zero', () => {
    expect(nomeArquivoExport(new Date(2027, 0, 3))).toBe('nerd-trainer-2027-01-03.json')
  })
})

describe('lerBancoImportado', () => {
  it('lê de volta o que foi exportado', () => {
    const original = banco({ pi: ent(120), quimica: ent(30) })
    const leitura = lerBancoImportado(exportarJSON(original))
    expect(leitura.ok).toBe(true)
    if (!leitura.ok) return
    expect(leitura.banco.entradas.pi?.recorde.pontuacao).toBe(120)
    expect(leitura.descartadas).toBe(0)
  })

  it('diz que o texto está vazio', () => {
    const leitura = lerBancoImportado('   \n ')
    expect(leitura.ok).toBe(false)
    if (leitura.ok) return
    expect(leitura.erro).toMatch(/vazi/i)
  })

  it('diz quando não é JSON', () => {
    const leitura = lerBancoImportado('{ isso não é json')
    expect(leitura.ok).toBe(false)
    if (leitura.ok) return
    expect(leitura.erro).toMatch(/JSON válido/)
  })

  it('diz quando é JSON mas não é um backup', () => {
    const leitura = lerBancoImportado('{"jogos":[1,2,3]}')
    expect(leitura.ok).toBe(false)
    if (leitura.ok) return
    expect(leitura.erro).toMatch(/"entradas"/)
  })

  it('diz quando todas as entradas estão corrompidas', () => {
    const leitura = lerBancoImportado('{"entradas":{"pi":{"recorde":{"pontuacao":"muitas"}}}}')
    expect(leitura.ok).toBe(false)
    if (leitura.ok) return
    expect(leitura.erro).toMatch(/corrompidas/)
  })

  it('aproveita as entradas boas e conta as descartadas', () => {
    const texto = JSON.stringify({
      versao: VERSAO_ATUAL,
      entradas: { pi: ent(87), lixo: { recorde: null } },
    })
    const leitura = lerBancoImportado(texto)
    expect(leitura.ok).toBe(true)
    if (!leitura.ok) return
    expect(Object.keys(leitura.banco.entradas)).toEqual(['pi'])
    expect(leitura.descartadas).toBe(1)
  })

  it('JSON inválido não encosta no banco já salvo', () => {
    const atual = banco({ pi: ent(900) })
    persistir(atual)

    expect(lerBancoImportado('}{').ok).toBe(false)
    expect(lerBancoImportado('').ok).toBe(false)
    expect(lerBancoImportado('[]').ok).toBe(false)

    expect(entradaDe(carregar(), 'pi')?.recorde.pontuacao).toBe(900)
  })
})

describe('compararBancos', () => {
  const atual = banco({
    pi: ent(100, 60_000),
    quimica: ent(50, 30_000),
    fisica: ent(70, 20_000),
    historia: ent(10, 10_000),
  })
  const vindo = banco({
    pi: ent(140, 60_000, { partidas: 3 }), // sobe
    quimica: ent(20, 30_000, { partidas: 2 }), // pior
    fisica: ent(70, 20_000, { partidas: 1 }), // igual
    geografia: ent(5, 5_000, { partidas: 4 }), // novo
  })

  it('classifica cada jogo em sobe, pior, igual ou novo', () => {
    const p = compararBancos(atual, vindo)
    const por = Object.fromEntries(p.itens.map((i) => [i.chave, i.situacao]))
    expect(por).toEqual({ pi: 'sobe', quimica: 'pior', fisica: 'igual', geografia: 'novo' })
    expect(p.sobem).toBe(1)
    expect(p.piores).toBe(1)
    expect(p.iguais).toBe(1)
    expect(p.novos).toBe(1)
  })

  it('conta jogos e partidas que vêm no arquivo', () => {
    const p = compararBancos(atual, vindo)
    expect(p.jogos).toBe(4)
    expect(p.partidas).toBe(3 + 2 + 1 + 4)
  })

  it('avisa quantos jogos "substituir tudo" apagaria', () => {
    // `historia` só existe aqui: substituir tudo o perde.
    expect(compararBancos(atual, vindo).perdidos).toBe(1)
  })

  it('mostra o antes e o depois de cada linha', () => {
    const p = compararBancos(atual, vindo)
    const pi = p.itens.find((i) => i.chave === 'pi')
    expect(pi).toMatchObject({ atual: 100, vindo: 140 })
    // Jogo novo não tem "antes".
    expect(p.itens.find((i) => i.chave === 'geografia')?.atual).toBeNull()
  })

  it('usa o desempate por tempo do próprio jogo', () => {
    // Mesma pontuação, menos tempo: é recorde melhor, então sobe.
    const rapido = banco({ pi: ent(100, 40_000) })
    expect(compararBancos(atual, rapido).itens[0]?.situacao).toBe('sobe')

    const lento = banco({ pi: ent(100, 90_000) })
    expect(compararBancos(atual, lento).itens[0]?.situacao).toBe('pior')
  })

  it('põe o que melhora na frente e o que empata no fim', () => {
    const p = compararBancos(atual, vindo)
    expect(p.itens.map((i) => i.situacao)).toEqual(['sobe', 'novo', 'pior', 'igual'])
  })

  it('banco vazio de um lado: tudo é novo, nada se perde', () => {
    const p = compararBancos(banco({}), vindo)
    expect(p.novos).toBe(4)
    expect(p.perdidos).toBe(0)
  })
})

describe('juntar', () => {
  it('mantém o melhor de cada lado', () => {
    const aqui = banco({ pi: ent(100), quimica: ent(50) })
    const la = banco({ pi: ent(140), quimica: ent(20) })

    const junto = juntar(aqui, la)
    expect(junto.entradas.pi?.recorde.pontuacao).toBe(140)
    expect(junto.entradas.quimica?.recorde.pontuacao).toBe(50)
  })

  it('desempata pontuação igual pelo menor tempo, como no jogo', () => {
    const aqui = banco({ pi: ent(118, 90_000) })
    const la = banco({ pi: ent(118, 70_000) })
    expect(juntar(aqui, la).entradas.pi?.recorde.duracaoMs).toBe(70_000)
    expect(juntar(la, aqui).entradas.pi?.recorde.duracaoMs).toBe(70_000)
  })

  it('traz inteiro o jogo que só existe de um lado', () => {
    const junto = juntar(banco({ pi: ent(100) }), banco({ geografia: ent(5) }))
    expect(Object.keys(junto.entradas).sort()).toEqual(['geografia', 'pi'])
  })

  it('não perde nada do que já estava aqui', () => {
    const aqui = banco({ pi: ent(900), historia: ent(10) })
    const junto = juntar(aqui, banco({ pi: ent(3) }))
    expect(junto.entradas.pi?.recorde.pontuacao).toBe(900)
    expect(junto.entradas.historia?.recorde.pontuacao).toBe(10)
  })

  it('funde o histórico sem repetir a mesma partida', () => {
    const p = (pontuacao: number, emISO: string, runId: string): Partida => ({
      pontuacao,
      duracaoMs: 1000,
      erros: 0,
      emISO,
      runId,
    })
    const comum = p(50, '2026-09-02T00:00:00.000Z', 'run-comum')

    const aqui = banco({
      pi: ent(80, 1000, { historico: [p(80, '2026-09-03T00:00:00.000Z', 'a'), comum] }),
    })
    const la = banco({
      pi: ent(60, 1000, { historico: [comum, p(60, '2026-09-01T00:00:00.000Z', 'b')] }),
    })

    const historico = juntar(aqui, la).entradas.pi?.historico ?? []
    expect(historico.map((x) => x.runId)).toEqual(['a', 'run-comum', 'b'])
    expect(historico.map((x) => x.pontuacao)).toEqual([80, 50, 60])
  })

  it('a última pontuação vem de quem jogou por último', () => {
    const antigo = banco({ pi: ent(900, 1000, { emISO: '2026-01-01T00:00:00.000Z' }) })
    const novo = banco({ pi: ent(3, 1000, { emISO: '2026-09-10T00:00:00.000Z' }) })

    const junto = juntar(antigo, novo).entradas.pi
    expect(junto?.recorde.pontuacao).toBe(900)
    expect(junto?.ultimaPontuacao).toBe(3)
    expect(junto?.ultimaEmISO).toBe('2026-09-10T00:00:00.000Z')
  })

  it('soma as partidas sem contar duas vezes as que se repetem', () => {
    const comum: Partida = {
      pontuacao: 5,
      duracaoMs: 1000,
      erros: 0,
      emISO: '2026-09-02T00:00:00.000Z',
      runId: 'x',
    }
    const outra: Partida = { ...comum, emISO: '2026-09-03T00:00:00.000Z', runId: 'y' }

    const junto = juntar(
      banco({ pi: ent(5, 1000, { partidas: 2, historico: [comum, outra] }) }),
      banco({ pi: ent(5, 1000, { partidas: 1, historico: [comum] }) }),
    )
    expect(junto.entradas.pi?.partidas).toBe(2)
  })

  it('é idempotente: juntar o mesmo backup duas vezes não muda nada', () => {
    const aqui = banco({ pi: ent(100), quimica: ent(50) })
    const la = banco({ pi: ent(140) })
    expect(juntar(juntar(aqui, la), la)).toEqual(juntar(aqui, la))
  })
})

describe('substituir tudo', () => {
  it('troca o banco inteiro: o que não vem no arquivo some', () => {
    persistir(banco({ pi: ent(900), historia: ent(10) }))

    const leitura = lerBancoImportado(exportarJSON(banco({ pi: ent(3), geografia: ent(7) })))
    expect(leitura.ok).toBe(true)
    if (!leitura.ok) return
    persistir(leitura.banco)

    const depois = carregar()
    expect(Object.keys(depois.entradas).sort()).toEqual(['geografia', 'pi'])
    expect(depois.entradas.pi?.recorde.pontuacao).toBe(3)
    expect(depois.entradas.historia).toBeUndefined()
  })
})

describe('run sem pontuação', () => {
  /** Grava um banco cru, como o de uma versão antiga do app. */
  function salvarCru(ultimosRuns: unknown[]): void {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify({
        versao: VERSAO_ATUAL,
        entradas: {
          pi: {
            recorde: {
              pontuacao: 40,
              duracaoMs: 30_000,
              erros: 0,
              completou: false,
              emISO: '2026-09-01T00:00:00.000Z',
            },
            partidas: 1,
            ultimaPontuacao: 40,
            ultimaEmISO: '2026-09-01T00:00:00.000Z',
            historico: [],
            ultimosRuns,
          },
        },
      }),
    )
  }

  it('não vira MAX_SAFE_INTEGER: a run legada em texto é descartada', () => {
    salvarCru(['run-antiga'])
    const entrada = entradaDe(carregar(), 'pi')
    expect(entrada?.recorde.pontuacao).toBe(40)
    expect(entrada?.ultimosRuns).toEqual([])
  })

  it('descarta também a run já envenenada por versões anteriores', () => {
    salvarCru([
      { id: 'envenenada', pontuacao: Number.MAX_SAFE_INTEGER },
      { id: 'sem-pontuacao' },
      { id: 'boa', pontuacao: 12 },
    ])
    expect(entradaDe(carregar(), 'pi')?.ultimosRuns).toEqual([{ id: 'boa', pontuacao: 12 }])
  })

  it('o JSON exportado não carrega mais nenhum valor infinito', () => {
    salvarCru(['run-antiga', { id: 'envenenada', pontuacao: Number.MAX_SAFE_INTEGER }])
    expect(exportarJSON(carregar())).not.toContain(String(Number.MAX_SAFE_INTEGER))
  })

  it('não congela o recorde: regravar aquele runId ainda conta', () => {
    // Era este o estrago: com MAX_SAFE_INTEGER gravado, `registrar` via
    // `pontuacao <= jaGravada.pontuacao` e descartava o desfecho real.
    salvarCru([{ id: 'meia-partida', pontuacao: Number.MAX_SAFE_INTEGER }])

    const r: ResultadoRun = {
      jogoId: 'pi',
      pontuacao: 118,
      duracaoMs: 45_000,
      erros: 0,
      completou: false,
      runId: 'meia-partida',
    }
    const { recordeNovo, entrada } = registrar(carregar(), r)
    expect(recordeNovo).toBe(true)
    expect(entrada.recorde.pontuacao).toBe(118)
  })

  it('a idempotência do StrictMode continua valendo dentro da sessão', () => {
    const r: ResultadoRun = {
      jogoId: 'pi',
      pontuacao: 10,
      duracaoMs: 5_000,
      erros: 0,
      completou: false,
      runId: 'mesma',
    }
    const uma = registrar(banco({}), r)
    const outra = registrar(uma.banco, r)
    expect(outra.banco).toBe(uma.banco)
    expect(outra.entrada.partidas).toBe(1)
  })
})
