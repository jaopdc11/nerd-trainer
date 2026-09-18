import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { calcular, FAIXAS, NOTA_MAXIMA } from '@/core/nerdometro'
import { VERSAO_ATUAL } from '@/core/storage'
import type { Banco, Entrada } from '@/core/storage'
import { Nerdometro } from './Nerdometro'

/**
 * O que se protege aqui é a promessa da etiqueta: **"N em experiência" tem de
 * poder dizer quais N**.
 *
 * Como em `MetaNerdometro.test`, os dados saem de `calcular()` sobre um banco de
 * verdade — a lista da tela e o número da etiqueta têm de ser a mesma coisa
 * contada duas vezes, e um literal escrito na mão esconderia justamente a
 * divergência que o teste existe para pegar.
 *
 * O projeto não usa jest-dom, então as asserções são sobre `textContent` cru.
 */

afterEach(cleanup)

const EM_EXPERIENCIA = ['ordem-de-grandeza', 'formulas']
const NA_NOTA = 'alfabeto-grego'

/**
 * A data é relativa a agora: com a ferrugem na fórmula, uma data fixa escrita
 * aqui envelhece sozinha e um dia estes testes passariam a medir tempo parado
 * sem querer. Dois dias atrás é "jogado ontem" para qualquer efeito.
 */
function entrada(pontuacao: number, partidas: number): Entrada {
  const emISO = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  return {
    recorde: { pontuacao, duracaoMs: 60_000, erros: 0, completou: false, emISO },
    partidas,
    ultimaPontuacao: pontuacao,
    ultimaEmISO: emISO,
    historico: [],
    ultimosRuns: [],
  }
}

const BANCO: Banco = {
  versao: VERSAO_ATUAL,
  entradas: {
    [NA_NOTA]: entrada(10, 3),
    // Uma partida só e longe da meta: é a definição de "em experiência".
    [EM_EXPERIENCIA[0] as string]: entrada(3, 1),
    [EM_EXPERIENCIA[1] as string]: entrada(4, 1),
  },
}

const nomeDe = (jogoId: string) =>
  calcular(BANCO).linhas.find((l) => l.jogoId === jogoId)?.nome as string

/**
 * A trilha é o ranking inteiro em dois centímetros, e o que se protege dela é a
 * contagem: são vinte e um elos, e uma trilha que desenhe vinte ou vinte e dois
 * pontos não quebra nada — só mente sobre o tamanho da escada, calada.
 */
describe('o ranking', () => {
  it('diz em que elo você está, e o quanto isso é da escada', () => {
    const m = calcular(BANCO)
    render(<Nerdometro banco={BANCO} />)

    // O título grande e o lema, que é o que a pessoa lê primeiro.
    expect(screen.getByText(m.faixa.titulo)).toBeDefined()
    expect(screen.getByText(m.faixa.lema)).toBeDefined()
    // E a posição na escada, por extenso: "Nerd I" sozinho não diz se são cinco
    // elos ou cinquenta.
    expect(
      screen.getByText(new RegExp(`elo ${m.faixa.indice + 1} de ${FAIXAS.length}`)),
    ).toBeDefined()
  })

  it('desenha a escada inteira: um ponto por elo, marcando os conquistados', () => {
    render(<Nerdometro banco={BANCO} />)

    const pontos = within(screen.getByRole('list', { name: 'Ranking' })).getAllByTitle(/·/)
    expect(pontos).toHaveLength(FAIXAS.length)
    // Cada ponto carrega o nome do elo e o que ele custa — é assim que dá para
    // ver para onde o ranking vai sem ter chegado lá.
    expect(pontos.map((p) => p.getAttribute('title'))).toEqual(
      FAIXAS.map((f) => `${f.titulo} · ${f.minimo} pontos`),
    )
  })

  it('o medidor anuncia o elo, não só o número', () => {
    const m = calcular(BANCO)
    render(<Nerdometro banco={BANCO} />)

    // O arco virou progresso dentro do elo, então o rótulo acessível tem de
    // trazer as duas coisas: onde você está na escada e a nota de onde ela sai.
    const medidor = screen.getByRole('img', { name: new RegExp(m.faixa.titulo) })
    expect(medidor.getAttribute('aria-label')).toContain(`nota ${m.nota} de ${NOTA_MAXIMA}`)
  })
})

/**
 * A ofensiva na tela. O que importa aqui é a cobrança: uma sequência viva mas
 * sem partida hoje morre à meia-noite, e o único momento em que dizer isso
 * adianta alguma coisa é enquanto ainda dá tempo.
 */
describe('a etiqueta da ofensiva', () => {
  const DIA = 24 * 60 * 60 * 1000

  /** Um banco com partidas nos dias dados, contados para trás a partir de hoje. */
  const comDias = (...diasAtras: number[]): Banco => ({
    versao: VERSAO_ATUAL,
    entradas: {
      [NA_NOTA]: {
        ...entrada(10, 4),
        historico: diasAtras.map((d, i) => ({
          pontuacao: 10,
          duracaoMs: 1000,
          erros: 1,
          emISO: new Date(new Date().setHours(12, 0, 0, 0) - d * DIA).toISOString(),
          runId: `r${d}-${i}`,
        })),
      },
    },
  })

  it('mostra os dias seguidos quando já jogou hoje', () => {
    render(<Nerdometro banco={comDias(0, 1, 2)} />)
    const etiqueta = screen.getByText(/3 dias/)
    expect(etiqueta.textContent).not.toContain('jogue hoje')
  })

  it('jogou ontem e ainda não hoje: a etiqueta cobra', () => {
    render(<Nerdometro banco={comDias(1, 2)} />)
    expect(screen.getByText(/2 dias/).textContent).toContain('jogue hoje')
  })

  it('sem sequência, não há etiqueta nenhuma', () => {
    // Zero dias não vira "🔥 0": um contador de hábito zerado só ocupa espaço e
    // cobra de quem acabou de chegar.
    render(<Nerdometro banco={comDias(5, 6)} />)
    expect(screen.queryByText(/dias?$/)).toBeNull()
  })
})

describe('a etiqueta "em experiência"', () => {
  it('conta os mesmos jogos que a regra pôs em experiência', () => {
    expect(calcular(BANCO).emExperiencia.map((l) => l.jogoId).sort()).toEqual(
      [...EM_EXPERIENCIA].sort(),
    )
  })

  it('começa fechada, dizendo só quantos são', () => {
    render(<Nerdometro banco={BANCO} />)

    const botao = screen.getByRole('button', { name: /em experiência/ })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('region', { name: 'Jogos em experiência' })).toBeNull()
  })

  it('aberta, diz quais são e leva a cada um deles', () => {
    render(<Nerdometro banco={BANCO} />)
    fireEvent.click(screen.getByRole('button', { name: /em experiência/ }))

    const lista = within(screen.getByRole('region', { name: 'Jogos em experiência' }))
    for (const jogoId of EM_EXPERIENCIA) {
      const link = lista.getByRole('link', { name: new RegExp(nomeDe(jogoId)) })
      expect(link.getAttribute('href')).toContain(jogoId)
    }
  })

  it('não lista o jogo que já pesa na nota', () => {
    render(<Nerdometro banco={BANCO} />)
    fireEvent.click(screen.getByRole('button', { name: /em experiência/ }))

    const lista = within(screen.getByRole('region', { name: 'Jogos em experiência' }))
    expect(lista.queryByRole('link', { name: new RegExp(nomeDe(NA_NOTA)) })).toBeNull()
    expect(lista.getAllByRole('link')).toHaveLength(EM_EXPERIENCIA.length)
  })

  it('sem nenhum em experiência, a etiqueta não existe', () => {
    render(
      <Nerdometro banco={{ versao: VERSAO_ATUAL, entradas: { [NA_NOTA]: entrada(10, 3) } }} />,
    )
    expect(screen.queryByRole('button', { name: /em experiência/ })).toBeNull()
  })
})
