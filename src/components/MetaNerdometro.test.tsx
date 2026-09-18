import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { calcular, DIAS_DE_GRACA, PARTIDAS_NA_JANELA, PARTIDAS_PARA_ENTRAR } from '@/core/nerdometro'
import { VERSAO_ATUAL } from '@/core/storage'
import type { Banco, Entrada } from '@/core/storage'
import { MetaNerdometro } from './MetaNerdometro'

/**
 * O que este teste protege é uma promessa, não um layout: **a tela de abertura
 * não pode dizer nada diferente do que a nota vai fazer**.
 *
 * Por isso as linhas vêm de `calcular()` sobre um banco de verdade, e não de um
 * objeto `LinhaNerdometro` escrito na mão. Um literal poderia existir com
 * `naNota: true` num caso em que a regra real diz `false`, e o teste ficaria
 * verde justamente na divergência que ele existe para pegar — que é a mesma
 * razão de o componente não recalcular regra nenhuma.
 *
 * O projeto não usa jest-dom, então as asserções são sobre `textContent` cru.
 */

// Sem `globals: true` no vitest, a limpeza automática da testing-library não se
// registra sozinha e uma tela fica montada sobre a outra.
afterEach(cleanup)

const JOGO = 'alfabeto-grego'

const bancoCom = (entradas: Record<string, Entrada>): Banco => ({
  versao: VERSAO_ATUAL,
  entradas,
})

/** Monta o banco, roda a regra de verdade e entrega a linha daquele jogo. */
const linhaCom = (entradas: Record<string, Entrada>) =>
  calcular(bancoCom(entradas)).linhas.find((l) => l.jogoId === JOGO) ?? null

/** A meta real do jogo, tirada do próprio critério — nunca de um 24 digitado. */
const META = linhaCom({})?.meta as number

/**
 * A data é relativa a agora, e não uma constante como era antes.
 *
 * Desde que a ferrugem entrou, uma data fixa escrita no teste envelhece: o
 * `2026-09-01` cravado aqui passava a valer menos a cada semana real, e em dois
 * meses estes casos — que são sobre carência e meta, não sobre tempo parado —
 * começariam a falhar sozinhos. Quem quer testar a ferrugem passa `diasAtras`.
 */
function entrada(pontuacao: number, partidas: number, diasAtras = 0): Entrada {
  const emISO = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString()
  return {
    recorde: { pontuacao, duracaoMs: 60_000, erros: 0, completou: false, emISO },
    partidas,
    ultimaPontuacao: pontuacao,
    ultimaEmISO: emISO,
    historico: [],
    ultimosRuns: [],
  }
}

function texto(entradas: Record<string, Entrada>): string {
  render(<MetaNerdometro linha={linhaCom(entradas)} />)
  return screen.getByLabelText('Meta no Nerdômetro').textContent ?? ''
}

describe('MetaNerdometro', () => {
  it('nunca jogado: diz a meta e que a estreia só conta se bater a meta', () => {
    const t = texto({})

    expect(t).toContain(`nerdômetro · meta ${META}`)
    expect(t).toContain('nunca jogado')
    expect(t).toContain(`entra na ${PARTIDAS_PARA_ENTRAR}ª partida`)
  })

  it('uma partida só e abaixo da meta: avisa que a próxima é a que matricula', () => {
    const t = texto({ [JOGO]: entrada(META - 10, 1) })

    // É a mesma etiqueta do medidor do menu: quem lê aqui tem de reconhecer lá.
    expect(t).toContain('em experiência')
    expect(t).toContain('ainda não pesa na nota')
    expect(t).toContain('a próxima matricula o jogo')
  })

  it('já na nota e abaixo da meta: diz o quanto falta do placar vigente até a meta', () => {
    const t = texto({ [JOGO]: entrada(META - 4, PARTIDAS_PARA_ENTRAR) })

    expect(t).toContain(`nerdômetro · meta ${META}`)
    expect(t).toContain('já pesa na nota')
    // O placar vigente, e por extenso de onde ele vem: o recorde de sempre
    // parou de ser a régua, e a tela tem de dizer isso antes da partida.
    expect(t).toContain(`com ${META - 4}`)
    expect(t).toContain(`melhor das ${PARTIDAS_NA_JANELA} últimas`)
    expect(t).toContain('faltam 4 para a nota cheia')
    expect(t).not.toContain('em experiência')
  })

  it('meta batida: diz que já dá nota cheia e que dali não sobe mais', () => {
    const t = texto({ [JOGO]: entrada(META, 1) })

    expect(t).toContain(`meta ${META} batida`)
    expect(t).toContain('nota cheia')
    // E que isso não é para sempre: a nota deixou de ser catraca, então a tela
    // que anuncia o máximo é a mesma que avisa o preço de sumir.
    expect(t).toContain(`${DIAS_DE_GRACA} dias parado`)
    // Bater a meta na estreia dispensa a segunda partida — se este texto
    // aparecesse aqui, a tela estaria contando uma carência que não existe.
    expect(t).not.toContain('em experiência')
  })

  it('parado há tempo: diz quanto o jogo vale hoje e que uma partida conserta', () => {
    const t = texto({ [JOGO]: entrada(META - 4, 5, 60) })

    expect(t).toContain('enferrujado')
    expect(t).toContain('parado há 60 dias')
    expect(t).toContain('devolve o valor cheio')
  })

  it('jogou e não pontuou: fora da nota, mas sem chamar isso de estreia', () => {
    const t = texto({ [JOGO]: entrada(0, 3) })

    expect(t).toContain('fora da nota')
    expect(t).toContain('zero não entra na nota')
    expect(t).not.toContain('nunca jogado')
  })

  it('sem meta (jogo fora dos critérios) não inventa nada', () => {
    const { container } = render(<MetaNerdometro linha={null} />)
    expect(container.innerHTML).toBe('')
  })
})
