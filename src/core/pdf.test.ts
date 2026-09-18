import { describe, expect, it } from 'vitest'
import { desenharCertificado } from './certificado-pdf'
import type { DadosDoCertificado } from './certificado-pdf'
import { A4_PAISAGEM, montarPdf, Pagina, paraWinAnsi } from './pdf'
import type { Medidor } from './pdf'

/**
 * O PDF é escrito byte a byte aqui dentro, sem biblioteca — então os invariantes
 * do **formato** são responsabilidade nossa, e é isso que este arquivo cobra.
 *
 * O que mais dá errado num PDF feito à mão é a tabela `xref`: ela lista o
 * deslocamento em bytes de cada objeto, e um leitor estrito recusa o arquivo
 * inteiro se um número estiver errado. Como o conteúdo tem acentos, contar
 * caracteres de string em vez de bytes produziria offsets curtos — e o defeito
 * só apareceria em quem abrisse o diploma num leitor rígido, não no Chrome.
 *
 * O teste mede os offsets relendo o arquivo, que é o que um leitor faz.
 */

/** Uma régua previsível: meio em por caractere, como o fallback sem Canvas. */
const medir: Medidor = (texto, _fonte, tamanho) => texto.length * tamanho * 0.5

const texto = (pdf: Uint8Array) => new TextDecoder('latin1').decode(pdf)

const DADOS: DadosDoCertificado = {
  nome: 'Jão',
  elo: 'Ultra Virgem',
  lema: 'cara, vai arrumar uma namorada',
  fichas: [
    { rotulo: 'NOTA', valor: '99 / 119' },
    { rotulo: 'PARTIDAS', valor: '141' },
    { rotulo: 'ELO', valor: '21 de 21' },
    { rotulo: 'TEMPO DE VIDA', valor: '9h12' },
    { rotulo: 'COBERTURA', valor: '40 de 72 jogos' },
    { rotulo: 'MAIOR OFENSIVA', valor: '9 dias' },
    { rotulo: 'NO MÁXIMO', valor: '12 jogos' },
  ],
  materias: ['Química 88', 'Exatas 81'],
  emitidoEm: '18 de setembro de 2026',
  registro: 'NT-1A2B-3C4D',
}

describe('o arquivo PDF', () => {
  const pdf = desenharCertificado(DADOS, medir)
  const cru = texto(pdf)

  it('abre e fecha como PDF', () => {
    expect(cru.startsWith('%PDF-1.4')).toBe(true)
    expect(cru.trimEnd().endsWith('%%EOF')).toBe(true)
  })

  it('a xref aponta para o byte certo de cada objeto', () => {
    // O teste que justifica montar tudo em bytes. Relê os offsets da tabela e
    // confere que em cada um começa mesmo a declaração daquele objeto.
    const inicio = Number(cru.match(/startxref\n(\d+)/)?.[1])
    expect(Number.isFinite(inicio)).toBe(true)
    expect(cru.slice(inicio, inicio + 4)).toBe('xref')

    const entradas = [...cru.slice(inicio).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) =>
      Number(m[1]),
    )
    expect(entradas.length).toBe(7)
    entradas.forEach((posicao, i) => {
      expect(cru.slice(posicao, posicao + 8), `objeto ${i + 1}`).toContain(`${i + 1} 0 obj`)
    })
  })

  it('é uma página A4 deitada', () => {
    expect(cru).toContain(`/MediaBox [0 0 ${A4_PAISAGEM.largura} ${A4_PAISAGEM.altura}]`)
    expect(cru).toContain('/Count 1')
  })

  it('usa as fontes que não precisam ser embarcadas', () => {
    // As base-14 são o motivo de o arquivo ter poucos quilobytes. Se alguém
    // trocar por uma fonte embarcada sem embarcar o arquivo dela, o diploma abre
    // com o texto invisível em alguns leitores.
    for (const fonte of ['Times-Roman', 'Times-Bold', 'Times-Italic']) {
      expect(cru).toContain(`/BaseFont /${fonte}`)
    }
    expect(cru).toContain('/Encoding /WinAnsiEncoding')
  })

  it('cabe em algumas dezenas de quilobytes', () => {
    // A alternativa que este arquivo existe para evitar — rasterizar a folha com
    // html2canvas — produz megabytes. Um teto solto, mas que denuncia se alguém
    // enfiar uma imagem aqui dentro.
    //
    // Eram 5 KB antes dos ornamentos; a corrente da borda, as rosetas de canto e
    // o guilhochê são umas oitocentas linhas de vetor e levaram o arquivo a uns
    // 57 KB. Continua sendo uma ordem de grandeza abaixo de qualquer captura de
    // tela, e é tudo texto: o PDF comprime sozinho na maioria dos leitores.
    expect(pdf.byteLength).toBeLessThan(120_000)
  })

  it('leva os dados do diploma, com acento e tudo', () => {
    // Em latin1, porque é assim que o WinAnsi grava: se alguém trocar para UTF-8
    // sem trocar o `/Encoding`, "Jão" vira "JÃ£o" dentro do arquivo.
    expect(cru).toContain('Jão')
    expect(cru).toContain('Ultra Virgem')
    expect(cru).toContain('NT-1A2B-3C4D')
    expect(cru).toContain('Certificado de Nerdice')
    expect(cru).toContain('alcançou, no ranking do Nerdômetro, a patente de')
  })
})

describe('a codificação WinAnsi', () => {
  it('passa o latim direto', () => {
    expect(paraWinAnsi('Jão')).toEqual([0x4a, 0xe3, 0x6f])
    expect(paraWinAnsi('ç é ü')).toEqual([0xe7, 0x20, 0xe9, 0x20, 0xfc])
  })

  it('traduz a tipografia que o Latin-1 não tem', () => {
    // A faixa 0x80–0x9F é onde o WinAnsi difere do Latin-1, e é justamente onde
    // moram as aspas curvas que o lema usa.
    expect(paraWinAnsi('“”—…')).toEqual([0x93, 0x94, 0x97, 0x85])
  })

  it('o que não existe na tabela vira ?, e não some', () => {
    // Um buraco silencioso no meio de uma frase é pior que um sinal visível.
    expect(paraWinAnsi('★')).toEqual([0x3f])
    expect(paraWinAnsi('🎓')).toEqual([0x3f])
  })
})

describe('o desenho da página', () => {
  it('escapa os parênteses, que são sintaxe de string no PDF', () => {
    // Sem escape, um nome com parêntese fecharia a string no meio e o resto do
    // desenho viraria comando — o arquivo inteiro se perde por causa de um
    // apelido entre parênteses.
    const p = new Pagina(medir)
    p.texto('Jão (o nerd) \\ ok', 10, 10)
    expect(texto(montarPdf(p))).toContain('(Jão \\(o nerd\\) \\\\ ok) Tj')
  })

  it('centraliza usando a régua que recebeu', () => {
    // A centralização depende de medir o texto, e medir é do chamador: aqui a
    // régua devolve meio em por caractere, então o x é previsível.
    const p = new Pagina(medir)
    p.centrado('abcd', 400, 10, { tamanho: 10 })
    // 4 caracteres × 5pt = 20pt de largura, então começa 10pt antes do centro.
    expect(texto(montarPdf(p))).toContain('1 0 0 1 390 ')
  })

  it('converte o y de cima para baixo, como o resto do app', () => {
    // A origem do PDF é o canto inferior esquerdo. A conversão acontece num
    // lugar só; se ela sumir, o diploma sai de cabeça para baixo.
    const p = new Pagina(medir, 100)
    p.linha(0, 10, 50, 10)
    expect(texto(montarPdf(p))).toContain('0 90 m 50 90 l S')
  })
})
