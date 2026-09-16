import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { CORES_VISIVEL, FAIXAS } from '@/data/espectro'
import { espectro } from './espectro'

/**
 * O teste que importa aqui não é "os itens são estes" — isso já é conferido em
 * `data/espectro.test.ts`, que é onde o gabarito mora. É que a sequência **é
 * jogável pela engine que existe**: foi a descoberta de que `useSequence` julga
 * tudo como número que redesenhou o jogo, e um dia alguém vai querer trocar os
 * itens por nomes de faixa sem saber disso.
 */

describe('compatibilidade com a mecânica de sequência', () => {
  const config = espectro.config()

  it('entrega a sequência pronta, e não geração preguiçosa', () => {
    // Onze itens constantes: `itemEm` existe para os dez mil primos, não para
    // isto, e usá-lo aqui só esconderia a lista de quem lê o arquivo.
    expect(config.itens).toBeDefined()
    expect(config.itemEm).toBeUndefined()
    expect(config.total).toBe(config.itens?.length)
  })

  /**
   * A trava de verdade. `useSequence` valida cada termo com
   * `{ tipo: 'inteiroGrande' }` quando `entrada === 'termo'`, e `limparInteiro`
   * devolve `null` para qualquer coisa que não seja dígito. Se alguém trocar um
   * item por "infravermelho", este teste fica vermelho antes de o jogo chegar a
   * alguém — que é bem melhor do que a partida morrer no primeiro Enter.
   */
  it('tem todo item aceito pelo validador que a engine vai usar', () => {
    expect(config.entrada).toBe('termo')
    for (const item of config.itens ?? []) {
      const r = validar(item, { tipo: 'inteiroGrande', valor: item }, { rigor: 'estrito' })
      expect(r.veredito, `"${item}" não passa por inteiroGrande`).toBe('certo')
    }
  })

  it('aceita o separador de milhar que o jogador vai digitar sem pensar', () => {
    // A promessa está escrita em `comoJogar`; aqui ela vira contrato.
    const r = validar(
      '1.000.000',
      { tipo: 'inteiroGrande', valor: '1000000' },
      { rigor: 'estrito' },
    )
    expect(r.veredito).toBe('certo')
  })

  it('usa teclado numérico, que é o que os itens permitem', () => {
    // Nenhum sinal, nenhuma vírgula: se um dia entrar um expoente negativo na
    // escada, o teclado tem que mudar junto — no iOS o menos não existe no
    // `inputMode="numeric"`.
    expect(config.teclado).toBe('numerico')
    for (const item of config.itens ?? []) expect(item).toMatch(/^\d+$/)
  })
})

describe('o que a sequência cobra', () => {
  const itens = espectro.config().itens ?? []

  it('desce monotonicamente — é o que o jogador usa para se conferir', () => {
    for (let i = 0; i < itens.length - 1; i++) {
      expect(Number(itens[i]), `${itens[i]} → ${itens[i + 1]}`).toBeGreaterThan(
        Number(itens[i + 1]),
      )
    }
  })

  it('cobre as fronteiras das faixas e as das cores no mesmo trecho', () => {
    const conjunto = new Set(itens.map(Number))
    // Faixas: as duas gigantes do começo e a saída para o ultravioleta.
    expect(conjunto.has(FAIXAS[1]?.maiorNm as number)).toBe(true) // 1 m
    expect(conjunto.has(FAIXAS[2]?.maiorNm as number)).toBe(true) // 1 mm
    expect(conjunto.has(FAIXAS[4]?.menorNm as number)).toBe(true) // 10 nm
    // Cores: toda fronteira interna do visível está na escada.
    for (const c of CORES_VISIVEL) {
      expect(conjunto.has(c.maiorNm), `${c.nome} (maior)`).toBe(true)
      expect(conjunto.has(c.menorNm), `${c.nome} (menor)`).toBe(true)
    }
  })

  it('é longa o bastante para a morte súbita ter graça', () => {
    // Sete termos era o problema original. Onze não é muito, mas é o que há de
    // fronteira de verdade no espectro — inflar a lista com valores inventados
    // seria pior do que um jogo curto.
    expect(itens.length).toBeGreaterThanOrEqual(11)
  })
})

describe('cartão do jogo', () => {
  it('declara id, categoria e mecânica estáveis', () => {
    // O id é a chave do storage: mudar aqui apaga o recorde de todo mundo.
    expect(espectro.id).toBe('espectro')
    expect(espectro.categoria).toBe('fisica')
    expect(espectro.mecanica).toBe('sequencia')
  })

  it('explica em comoJogar as duas coisas que o jogador não adivinha', () => {
    const texto = espectro.comoJogar.join(' ')
    expect(texto).toContain('nanômetros')
    expect(texto).toMatch(/maior para o menor/)
  })
})
