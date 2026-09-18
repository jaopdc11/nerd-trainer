import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nomeDoArquivo } from '@/core/certificado'
import { calcular, CRITERIOS, ELO_DO_CERTIFICADO, FAIXAS, NOTA_MAXIMA } from '@/core/nerdometro'
import { VERSAO_ATUAL } from '@/core/storage'
import type { Banco, Entrada } from '@/core/storage'
import { Nerdometro } from './Nerdometro'

/**
 * O diploma, testado de fora: pelo botão do medidor, como o jogador chega nele.
 *
 * Renderizar `<Certificado>` direto com um `Nerdometro` montado à mão testaria o
 * layout e não a regra — e a regra é a parte que importa aqui, porque ela é uma
 * promessa: **o certificado existe do `Nerd V` para cima e não antes**. Por isso
 * os dois bancos abaixo saem de `calcular()` de verdade, e o teste confere que
 * eles caem dos lados opostos da linha antes de olhar a tela.
 */

afterEach(cleanup)

beforeEach(() => {
  localStorage.clear()
})

const DOIS_DIAS = 2 * 24 * 60 * 60 * 1000

function entrada(pontuacao: number): Entrada {
  const emISO = new Date(Date.now() - DOIS_DIAS).toISOString()
  const p = { pontuacao, duracaoMs: 60_000, erros: 0, emISO, runId: `r-${pontuacao}` }
  return {
    recorde: { pontuacao, duracaoMs: 60_000, erros: 0, completou: false, emISO },
    partidas: 4,
    ultimaPontuacao: pontuacao,
    ultimaEmISO: emISO,
    historico: [p],
    ultimosRuns: [],
  }
}

/** O catálogo inteiro na fração pedida da meta. */
const banco = (fracao: number): Banco => ({
  versao: VERSAO_ATUAL,
  entradas: Object.fromEntries(
    CRITERIOS.map((c) => [c.jogoId, entrada(Math.round(c.meta * fracao))]),
  ),
})

const MINIMO = FAIXAS.find((f) => f.titulo === ELO_DO_CERTIFICADO)?.minimo as number
const FORTE = banco(0.6)
const FRACO = banco(0.1)

const abrir = (b: Banco) => {
  render(<Nerdometro banco={b} />)
  fireEvent.click(screen.getByRole('button', { name: /certificado de nerdice/i }))
  return within(screen.getByRole('dialog'))
}

describe('o certificado', () => {
  it('os dois bancos do teste caem dos lados opostos da linha', () => {
    // Se um dia o balanceamento mudar e os dois caírem do mesmo lado, é este
    // teste que avisa — em vez de os outros virarem verdes sem medir nada.
    expect(calcular(FORTE).nota).toBeGreaterThanOrEqual(MINIMO)
    expect(calcular(FRACO).nota).toBeLessThan(MINIMO)
  })

  it(`não existe abaixo de ${ELO_DO_CERTIFICADO}`, () => {
    render(<Nerdometro banco={FRACO} />)
    expect(calcular(FRACO).podeCertificar).toBe(false)
    // Sem botão e sem cadeado: anunciar o que está travado é propaganda, e a
    // trilha do ranking já mostra o caminho inteiro.
    expect(screen.queryByRole('button', { name: /certificado/ })).toBeNull()
  })

  it('daí para cima, emite uma folha com o elo, a nota e o registro', () => {
    const m = calcular(FORTE)
    const dialogo = abrir(FORTE)

    // Duas vezes: em letra grande no meio da folha e gravado no selo.
    expect(dialogo.getAllByText(m.faixa.titulo)).toHaveLength(2)
    expect(dialogo.getByText(m.faixa.lema, { exact: false })).toBeDefined()
    // Pelo texto corrido do diálogo: a ficha é uma grade de rótulos e valores em
    // elementos separados, e um matcher por elemento não enxerga o par junto.
    const folha = screen.getByRole('dialog').textContent ?? ''
    expect(folha).toContain(`NOTA${m.nota} / ${NOTA_MAXIMA}`)
    expect(folha).toContain(`COBERTURA${m.jogados} de ${m.total} jogos`)
    expect(folha).toContain(`ELO${m.faixa.indice + 1} de ${FAIXAS.length}`)
    // O registro é decorativo, mas tem de existir e ter forma de registro.
    expect(folha).toMatch(/registro NT-[0-9A-F]{4}-[0-9A-F]{4}/)
  })

  it('sem nome digitado, sai em nome de Anônimo', () => {
    // Um diploma com um espaço em branco no meio parece defeito; "Anônimo" é
    // uma escolha, e ainda combina com um app que não tem conta nem login.
    expect(abrir(FORTE).getByText('Anônimo')).toBeDefined()
  })

  it('o nome digitado vai para a folha e fica guardado para a próxima vez', () => {
    const dialogo = abrir(FORTE)
    fireEvent.change(dialogo.getByPlaceholderText(/como você quer ser chamado/), {
      target: { value: 'Jão' },
    })

    expect(dialogo.getByText('Jão')).toBeDefined()
    // No `localStorage` e não no banco de recordes: o banco é o que as pessoas
    // exportam e trocam entre dispositivos, e o nome não pode pegar carona.
    expect(localStorage.getItem('nerd-trainer:nome-no-certificado')).toBe('Jão')
  })

  it('baixa o arquivo direto, sem passar pelo diálogo de impressão', () => {
    // Era `window.print()` e o diálogo do sistema, onde a pessoa tinha de achar
    // "Salvar como PDF" no meio das impressoras. O teste guarda o caminho novo:
    // blob de PDF, link com `download`, clique, e a URL devolvida em seguida —
    // sem `revokeObjectURL`, cada emissão deixa o arquivo preso na memória da
    // aba até ela fechar.
    const criar = vi.fn((_blob: Blob) => 'blob:certificado')
    const revogar = vi.fn()
    const antes = { criar: URL.createObjectURL, revogar: URL.revokeObjectURL }
    URL.createObjectURL = criar as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = revogar as unknown as typeof URL.revokeObjectURL

    let baixado: { href: string; nome: string } | null = null
    const clique = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        baixado = { href: this.href, nome: this.download }
      })

    fireEvent.click(abrir(FORTE).getByRole('button', { name: /baixar PDF/i }))

    expect(clique).toHaveBeenCalledOnce()
    // O nome do arquivo sai do elo — nada de "documento.pdf" na pasta de
    // downloads de quem emitir dois.
    expect(baixado).toEqual({
      href: 'blob:certificado',
      nome: nomeDoArquivo(calcular(FORTE).faixa.titulo),
    })
    expect(criar).toHaveBeenCalledOnce()
    expect(revogar).toHaveBeenCalledWith('blob:certificado')

    // O que foi para o blob é um PDF de verdade, e não um arquivo vazio.
    const blob = criar.mock.calls[0]?.[0] as unknown as Blob
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(2000)

    clique.mockRestore()
    URL.createObjectURL = antes.criar
    URL.revokeObjectURL = antes.revogar
  })
})
