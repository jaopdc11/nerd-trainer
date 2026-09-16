import { describe, expect, it } from 'vitest'
import { normalizarTexto } from '@/core/answer'
import { ESTADOS } from './estados'
import {
  BIOMAS,
  COMPOSICAO,
  FICHAS,
  MARGEM_DE_EMPATE,
  biomasDaUf,
  dominantes,
  fichaDo,
  ufsDoBioma,
} from './biomas'
import type { Bioma } from './biomas'

/**
 * A conferência por caminho independente, que é a regra do projeto: o dado não
 * pode se autoaprovar.
 *
 * Esta tabela foi escrita de novo, agrupada **por bioma** e não por UF, que é a
 * ordem contrária à de `COMPOSICAO`. Uma linha trocada de lugar lá aparece aqui
 * como um estado sobrando num bioma e faltando noutro — erro que uma cópia da
 * mesma lista jamais pegaria.
 *
 * É a lista de **presença**, não de predominância: Mato Grosso aparece em três
 * biomas porque tem os três dentro dele.
 */
const PRESENCA: Readonly<Record<Bioma, readonly string[]>> = {
  Amazônia: ['AC', 'AM', 'AP', 'MA', 'MT', 'PA', 'RO', 'RR', 'TO'],
  Cerrado: ['BA', 'DF', 'GO', 'MA', 'MG', 'MS', 'MT', 'PI', 'PR', 'RO', 'SP', 'TO'],
  'Mata Atlântica': [
    'AL', 'BA', 'CE', 'ES', 'GO', 'MG', 'MS', 'PB', 'PE', 'PR',
    'RJ', 'RN', 'RS', 'SC', 'SE', 'SP',
  ],
  Caatinga: ['AL', 'BA', 'CE', 'MA', 'MG', 'PB', 'PE', 'PI', 'RN', 'SE'],
  Pampa: ['RS'],
  Pantanal: ['MS', 'MT'],
}

describe('composição de biomas por UF', () => {
  it('cobre as 27 UFs e mais nenhuma sigla', () => {
    expect(Object.keys(COMPOSICAO).sort()).toEqual(ESTADOS.map((e) => e.sigla).sort())
  })

  it('cada UF soma 100 e vem em ordem decrescente', () => {
    for (const [sigla, fatias] of Object.entries(COMPOSICAO)) {
      expect(fatias.length, sigla).toBeGreaterThan(0)
      expect(
        fatias.reduce((s, f) => s + f.pct, 0),
        `${sigla}: as fatias têm de fechar a área do estado`,
      ).toBe(100)

      for (let i = 1; i < fatias.length; i++) {
        const anterior = fatias[i - 1] as { pct: number }
        const atual = fatias[i] as { pct: number }
        // `dominantes()` lê a primeira posição como líder. Se a ordem quebrar,
        // ele passa a devolver o bioma errado sem nenhum sintoma visível.
        expect(atual.pct, `${sigla}: fatia ${i} maior que a anterior`).toBeLessThanOrEqual(
          anterior.pct,
        )
      }
    }
  })

  it('não repete bioma dentro da mesma UF, e só usa nome de bioma conhecido', () => {
    for (const [sigla, fatias] of Object.entries(COMPOSICAO)) {
      const nomes = fatias.map((f) => f.bioma)
      expect(new Set(nomes).size, sigla).toBe(nomes.length)
      for (const n of nomes) expect(BIOMAS, `${sigla}: ${n}`).toContain(n)
    }
  })

  it('nenhuma fatia abaixo de 1%: o 1:250.000 não tem essa resolução', () => {
    for (const [sigla, fatias] of Object.entries(COMPOSICAO)) {
      for (const f of fatias) expect(f.pct, `${sigla}/${f.bioma}`).toBeGreaterThanOrEqual(1)
    }
  })

  it('bate com a tabela escrita por bioma', () => {
    for (const bioma of BIOMAS) {
      expect([...ufsDoBioma(bioma)].sort(), bioma).toEqual([...(PRESENCA[bioma] as string[])].sort())
    }
  })

  it('a tabela por bioma não tem sobra: toda UF citada existe', () => {
    const siglas = new Set(ESTADOS.map((e) => e.sigla))
    for (const [bioma, ufs] of Object.entries(PRESENCA)) {
      for (const uf of ufs) expect(siglas.has(uf), `${bioma}: ${uf}`).toBe(true)
    }
  })
})

describe('predominância', () => {
  it('toda UF tem pelo menos um predominante', () => {
    for (const e of ESTADOS) expect(dominantes(e.sigla).length, e.sigla).toBeGreaterThan(0)
  })

  it('devolve dois nomes só onde a diferença é menor que a margem', () => {
    for (const e of ESTADOS) {
      const fatias = COMPOSICAO[e.sigla] as readonly { bioma: Bioma; pct: number }[]
      const lider = fatias[0] as { pct: number }
      const segundo = fatias[1]
      const empatou = segundo !== undefined && lider.pct - segundo.pct < MARGEM_DE_EMPATE
      expect(dominantes(e.sigla).length, e.sigla).toBe(empatou ? 2 : 1)
    }
  })

  /*
   * Este é o teste que impede o jogo de ficar mentiroso sem ninguém notar. Se
   * um dia alguém "arredondar" Alagoas para 55/45, o empate some e o jogo passa
   * a cobrar um nome onde a fonte não dá um. Nomear as duas UFs aqui é dizer
   * que o empate é conhecido e intencional — não um acidente do arredondamento.
   */
  it('os empates conhecidos são Alagoas e Sergipe, e mais ninguém', () => {
    const empatadas = ESTADOS.filter((e) => dominantes(e.sigla).length > 1).map((e) => e.sigla)
    expect(empatadas.sort()).toEqual(['AL', 'SE'])
    for (const uf of empatadas) {
      expect([...dominantes(uf)].sort(), uf).toEqual(['Caatinga', 'Mata Atlântica'])
    }
  })

  it('o Pantanal não é predominante em nenhuma UF', () => {
    // Não é curiosidade: é a razão de o baralho precisar das cartas de pista.
    // Um deck só de "estado → bioma" nunca teria o Pantanal como resposta.
    for (const e of ESTADOS) expect(dominantes(e.sigla), e.sigla).not.toContain('Pantanal')
  })

  it('o predominante é sempre um bioma presente na UF', () => {
    for (const e of ESTADOS) {
      for (const b of dominantes(e.sigla)) expect(biomasDaUf(e.sigla), e.sigla).toContain(b)
    }
  })

  it('reclama de sigla que não existe em vez de devolver vazio', () => {
    expect(() => dominantes('XX')).toThrow()
    expect(() => biomasDaUf('XX')).toThrow()
  })
})

describe('fichas', () => {
  it('há uma ficha por bioma, sem sobra e sem falta', () => {
    expect(FICHAS.map((f) => f.nome).sort()).toEqual([...BIOMAS].sort())
  })

  it('as áreas fecham o território, dentro do arredondamento da fonte', () => {
    const soma = FICHAS.reduce((s, f) => s + f.fracaoBrasil, 0)
    expect(soma).toBeGreaterThan(99)
    expect(soma).toBeLessThan(101)
  })

  it('nenhum nome nem sinônimo colide com o de outro bioma', () => {
    // Colisão exata não é coisa que a trava de vizinhança resolva: ela recusa o
    // ambíguo, e o jogador ficaria sem conseguir responder nenhuma das cartas.
    const dono = new Map<string, Bioma>()
    for (const f of FICHAS) {
      for (const forma of [f.nome, ...f.sinonimos]) {
        const chave = normalizarTexto(forma, true)
        const anterior = dono.get(chave)
        expect(anterior ?? f.nome, `"${forma}" serve a ${anterior} e a ${f.nome}`).toBe(f.nome)
        dono.set(chave, f.nome)
      }
    }
  })

  it('toda ficha tem pista, e nenhuma pista se repete entre biomas', () => {
    const vistas = new Set<string>()
    for (const f of FICHAS) {
      expect(f.pistas.length, f.nome).toBeGreaterThanOrEqual(2)
      for (const p of f.pistas) {
        expect(p.length, `${f.nome}: pista curta demais`).toBeGreaterThan(30)
        expect(vistas.has(p), `pista repetida: ${p}`).toBe(false)
        vistas.add(p)
      }
    }
  })

  /*
   * As pistas fazem afirmações de área e de presença. Como elas viram pergunta
   * de jogo, cada afirmação verificável é conferida aqui contra a própria
   * composição — uma pista que envelheceu porque o dado mudou é uma pergunta
   * errada servida como certa.
   */
  it('as afirmações de tamanho batem com a ordem das áreas', () => {
    const porArea = [...FICHAS].sort((a, b) => b.fracaoBrasil - a.fracaoBrasil)
    expect(porArea[0]?.nome, 'a Amazônia é o maior').toBe('Amazônia')
    expect(porArea[1]?.nome, 'o Cerrado é o segundo').toBe('Cerrado')
    expect(porArea.at(-1)?.nome, 'o Pantanal é o menor').toBe('Pantanal')
    expect(fichaDo('Amazônia').fracaoBrasil, 'quase metade do país').toBeGreaterThan(45)
  })

  it('as afirmações de presença batem com a composição', () => {
    expect(ufsDoBioma('Amazônia'), 'a pista diz nove UFs').toHaveLength(9)
    expect(ufsDoBioma('Pampa'), 'a pista diz: só no Rio Grande do Sul').toEqual(['RS'])
    expect(ufsDoBioma('Pantanal'), 'a pista diz: só MT e MS').toEqual(['MT', 'MS'])
    expect(dominantes('RS'), 'a pista diz que no RS o Pampa é o maior').toContain('Pampa')

    for (const uf of ['AC', 'AM', 'AP', 'PA', 'RR']) {
      expect(biomasDaUf(uf), `a pista diz ${uf} 100% Amazônia`).toEqual(['Amazônia'])
    }
    for (const uf of ['RJ', 'ES', 'SC']) {
      expect(biomasDaUf(uf), `a pista diz ${uf} 100% Mata Atlântica`).toEqual(['Mata Atlântica'])
    }
    for (const uf of ['DF', 'GO', 'TO']) {
      expect(dominantes(uf), `a pista diz ${uf} de Cerrado`).toEqual(['Cerrado'])
    }
  })

  it('a Caatinga só aparece no Nordeste e no norte de Minas', () => {
    // Sustenta a pista do bioma exclusivamente brasileiro: um dia em que a
    // Caatinga aparecer no Paraná, alguém errou a digitação da composição.
    const regiao = new Map(ESTADOS.map((e) => [e.sigla, e.regiao]))
    for (const uf of ufsDoBioma('Caatinga')) {
      expect(uf === 'MG' ? 'Sudeste' : regiao.get(uf), uf).toBe(uf === 'MG' ? 'Sudeste' : 'Nordeste')
    }
  })
})
