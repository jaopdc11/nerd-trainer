import { describe, expect, it } from 'vitest'
import { chaveDeTexto, normalizarTexto } from '@/core/answer'
import {
  cargaEmFracao,
  COLUNAS_GRADE,
  formasAceitas,
  LINHAS_GRADE,
  PARTICULAS,
  ROTULO_FAMILIA,
  spinEmFracao,
} from './modelo-padrao'
import type { Familia, Particula } from './modelo-padrao'

/** Lança em vez de devolver `undefined`: id errado num teste é erro do teste. */
function por(id: string): Particula {
  const p = PARTICULAS.find((q) => q.id === id)
  if (!p) throw new Error(`não existe partícula "${id}"`)
  return p
}

describe('integridade do quadro', () => {
  it('tem as 17 partículas, com id único', () => {
    expect(PARTICULAS).toHaveLength(17)
    expect(new Set(PARTICULAS.map((p) => p.id)).size).toBe(17)
  })

  it('divide as 17 nas quatro famílias na proporção certa', () => {
    const conta = (f: Familia) => PARTICULAS.filter((p) => p.familia === f).length
    expect(conta('quark')).toBe(6)
    expect(conta('lepton')).toBe(6)
    expect(conta('gauge')).toBe(4)
    expect(conta('escalar')).toBe(1)
  })

  it('não põe duas partículas na mesma célula', () => {
    const ocupadas = new Set<string>()
    for (const p of PARTICULAS) {
      const chave = `${p.linha}:${p.coluna}`
      expect(ocupadas.has(chave), `${chave} ocupada duas vezes (${p.id})`).toBe(false)
      ocupadas.add(chave)
    }
  })

  it('mantém toda célula dentro da grade declarada', () => {
    for (const p of PARTICULAS) {
      expect(p.linha, p.id).toBeGreaterThanOrEqual(1)
      expect(p.linha, p.id).toBeLessThanOrEqual(LINHAS_GRADE)
      expect(p.coluna, p.id).toBeGreaterThanOrEqual(1)
      expect(p.coluna, p.id).toBeLessThanOrEqual(COLUNAS_GRADE)
    }
  })

  /**
   * O layout é a metade do conteúdo — ver a nota no topo do dataset. Este é o
   * gabarito de posição, conferido contra o quadro canônico célula a célula.
   */
  it('reproduz o quadro canônico, linha a linha', () => {
    const grade = Array.from({ length: LINHAS_GRADE }, (_, l) =>
      Array.from(
        { length: COLUNAS_GRADE },
        (_, c) => PARTICULAS.find((p) => p.linha === l + 1 && p.coluna === c + 1)?.simbolo ?? '',
      ),
    )
    expect(grade).toEqual([
      ['u', 'c', 't', 'g', 'H'],
      ['d', 's', 'b', 'γ', ''],
      ['e', 'μ', 'τ', 'Z', ''],
      ['νe', 'νμ', 'ντ', 'W±', ''],
    ])
  })

  it('põe as colunas 1 a 3 nas três gerações, e só elas', () => {
    for (const p of PARTICULAS) {
      if (p.coluna <= 3) expect(p.geracao, p.id).toBe(p.coluna)
      else expect(p.geracao, p.id).toBeNull()
    }
  })

  it('dá a cada geração dois quarks e dois léptons', () => {
    for (const g of [1, 2, 3]) {
      const dela = PARTICULAS.filter((p) => p.geracao === g)
      expect(dela.filter((p) => p.familia === 'quark'), `geração ${g}`).toHaveLength(2)
      expect(dela.filter((p) => p.familia === 'lepton'), `geração ${g}`).toHaveLength(2)
    }
  })

  it('nomeia as quatro famílias para o gabarito do fim', () => {
    for (const p of PARTICULAS) expect(ROTULO_FAMILIA[p.familia], p.id).toBeTruthy()
  })
})

describe('física', () => {
  /**
   * A definição, não um detalhe: férmion é spin semi-inteiro, bóson é inteiro.
   * Guardar o spin em meios é o que permite escrever isto como paridade em vez
   * de comparar 0.5 com ponto flutuante.
   */
  it('faz spin semi-inteiro coincidir exatamente com matéria', () => {
    for (const p of PARTICULAS) {
      const fermion = p.familia === 'quark' || p.familia === 'lepton'
      expect(p.spinMeios % 2 === 1, `${p.id} (spin ${spinEmFracao(p)})`).toBe(fermion)
    }
  })

  it('dá spin 1 aos bósons de gauge e 0 ao Higgs', () => {
    for (const p of PARTICULAS.filter((q) => q.familia === 'gauge')) {
      expect(p.spinMeios, p.id).toBe(2)
    }
    expect(por('higgs').spinMeios).toBe(0)
  })

  it('alterna as cargas dos quarks por linha: +2/3 em cima, −1/3 embaixo', () => {
    for (const p of PARTICULAS.filter((q) => q.familia === 'quark')) {
      expect(p.cargaTercos, p.id).toBe(p.linha === 1 ? 2 : -1)
    }
  })

  it('dá carga −1 aos léptons carregados e 0 aos neutrinos', () => {
    for (const p of PARTICULAS.filter((q) => q.familia === 'lepton')) {
      const neutrino = p.id.startsWith('neutrino')
      expect(p.cargaTercos, p.id).toBe(neutrino ? 0 : -3)
    }
  })

  it('deixa neutro todo bóson menos o W', () => {
    for (const p of PARTICULAS.filter((q) => q.familia === 'gauge' || q.familia === 'escalar')) {
      expect(p.cargaTercos, p.id).toBe(p.id === 'boson-w' ? 3 : 0)
    }
  })

  it('escreve carga e spin como fração legível', () => {
    expect(cargaEmFracao(por('up'))).toBe('+2/3')
    expect(cargaEmFracao(por('down'))).toBe('−1/3')
    expect(cargaEmFracao(por('eletron'))).toBe('−1')
    expect(cargaEmFracao(por('neutrino-tau'))).toBe('0')
    // O W é o único em que o sinal não é um só: W⁺ e W⁻ são a mesma célula.
    expect(cargaEmFracao(por('boson-w'))).toBe('±1')
    expect(spinEmFracao(por('top'))).toBe('1/2')
    expect(spinEmFracao(por('gluon'))).toBe('1')
    expect(spinEmFracao(por('higgs'))).toBe('0')
  })
})

describe('as respostas', () => {
  /**
   * A trava que sustenta o jogo: o rótulo mostra o símbolo, então nenhum símbolo
   * pode ser resposta aceita. Sem isto, "W" preencheria a célula do W copiando o
   * que está escrito nela.
   */
  it('nunca aceita o símbolo que está visível na célula', () => {
    const simbolos = new Set(PARTICULAS.map((p) => chaveDeTexto(p.simbolo)))
    for (const p of PARTICULAS) {
      for (const forma of formasAceitas(p)) {
        expect(simbolos.has(chaveDeTexto(forma)), `"${forma}" é símbolo de alguém`).toBe(false)
      }
    }
  })

  /**
   * Mesma trava da tabela periódica: duas partículas que aceitem a mesma forma
   * normalizada fariam uma digitação preencher a célula errada.
   */
  it('nenhuma partícula aceita o nome de outra', () => {
    const dono = new Map<string, string>()
    for (const p of PARTICULAS) {
      for (const forma of new Set(formasAceitas(p).map((f) => normalizarTexto(f)))) {
        const anterior = dono.get(forma)
        expect(anterior, `"${forma}" serve para ${anterior} e ${p.id}`).toBeUndefined()
        dono.set(forma, p.id)
      }
    }
  })

  it('não repete a canônica dentro dos sinônimos', () => {
    for (const p of PARTICULAS) {
      const sinonimos = p.sinonimos.map((s) => normalizarTexto(s))
      expect(sinonimos, p.id).not.toContain(normalizarTexto(p.nome))
    }
  })

  /**
   * A regressão mais provável: alguém copia nome de material em pt-PT. A regra
   * mecânica é o sufixo -ão onde o pt-BR usa -on, e o -ó/-é fechado.
   */
  it('não deixa passar grafia de português europeu', () => {
    for (const p of PARTICULAS) {
      for (const forma of formasAceitas(p)) {
        expect(forma, p.id).not.toMatch(/(ão|ões)$/)
        expect(forma, p.id).not.toMatch(/[óé]nio$/)
      }
    }
    // Os quatro que a tradução automática erra com mais frequência.
    expect(por('eletron').nome).toBe('Elétron') // não "eletrão"
    expect(por('foton').nome).toBe('Fóton') // não "fotão"
    expect(por('gluon').nome).toBe('Glúon') // não "gluão"
    expect(por('muon').nome).toBe('Múon') // não "muão"
  })

  it('mantém o nome curto curto o bastante para caber na célula', () => {
    // A célula é quadrada e pequena: `curto` é o que o motor escreve dentro
    // dela, e "Neutrino do elétron" não cabe em nenhum tamanho de fonte usável.
    for (const p of PARTICULAS) expect(p.curto.length, `${p.id}: "${p.curto}"`).toBeLessThanOrEqual(10)
  })

  it('aceita as duas tradições de nome dos quarks', () => {
    // Inglês em sala de aula, português em livro traduzido: as duas valem.
    const formas = (id: string) => formasAceitas(por(id)).map((f) => normalizarTexto(f))
    expect(formas('strange')).toContain('quark strange')
    expect(formas('strange')).toContain('quark estranho')
    expect(formas('bottom')).toContain('quark fundo')
    expect(formas('charm')).toContain('quark charme')
  })
})
