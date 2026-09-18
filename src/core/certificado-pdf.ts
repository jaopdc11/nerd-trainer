import {
  CORES,
  cordasDoGuilloche,
  correnteDaBorda,
  denteadoDoSelo,
  estrela,
  faixa,
  fitasDoSelo,
  FOLHA,
  FRASE_MIUDA,
  moldura,
  rosetasDosCantos,
  separador,
} from './certificado-arte'
import type { Poligono, Segmento } from './certificado-arte'
import { A4_PAISAGEM, montarPdf, Pagina } from './pdf'
import type { Medidor } from './pdf'

/**
 * O diploma, desenhado em PDF.
 *
 * É o gêmeo da folha da tela em `components/Certificado.tsx`, e os dois existem
 * porque servem a coisas diferentes: a folha é o que a pessoa confere antes de
 * baixar, e precisa encolher com a janela; esta é o arquivo que ela guarda, e
 * tem 297 por 210 milímetros exatos. Gerar o PDF a partir do DOM é o caminho do
 * `html2canvas` — foto de documento, texto que não se seleciona, megabytes.
 *
 * O que impede os gêmeos de divergirem: o **texto** vem pronto de
 * `dadosDoCertificado` e a **geometria** vem de `certificado-arte`. Aqui só
 * mora a tipografia — onde cada frase pousa e em que corpo.
 */

/** Um dado do diploma: o rótulo miúdo em cima, o valor em destaque embaixo. */
export interface Ficha {
  readonly rotulo: string
  readonly valor: string
}

export interface DadosDoCertificado {
  readonly nome: string
  readonly elo: string
  readonly lema: string
  /**
   * Os números que o diploma atesta, já em pares.
   *
   * Eram cinco frases corridas — "nota 99 de 119 · elo 21 de 21", "em 4 de 72
   * jogos · 2 no máximo" — e liam como saída de terminal: tudo no mesmo corpo,
   * tudo na mesma cor, sem hierarquia entre o que é rótulo e o que é conquista.
   * Em pares, o valor pode ficar grande e o rótulo miúdo, que é como uma ficha
   * de documento se lê de relance.
   */
  readonly fichas: readonly Ficha[]
  /** As melhores matérias, já formatadas: `Biológicas 119`. */
  readonly materias: readonly string[]
  readonly emitidoEm: string
  readonly registro: string
}

const { largura: L, altura: A } = A4_PAISAGEM
const MEIO = L / 2

/** O selo, e o centro dele — usado também pela folha da tela. */
/**
 * O selo, e o centro dele — usado também pela folha da tela.
 *
 * Subiu de 448 para 432 quando as fitas entraram: elas descem 38 pontos abaixo
 * do disco, e no lugar antigo caíam exatamente sobre a linha das melhores
 * matérias.
 */
export const SELO = { cx: MEIO, cy: 432, raio: 52 } as const

export function desenharCertificado(dados: DadosDoCertificado, medir: Medidor): Uint8Array {
  const p = new Pagina(medir)

  // O papel. Sem isto o PDF sai com fundo branco, e o creme é metade da
  // aparência de diploma.
  p.retangulo(0, 0, L, A, { preenche: CORES.papel })

  for (const c of cordasDoGuilloche(MEIO, 318, 172)) traco(p, c, CORES.teia)
  for (const r of rosetasDosCantos()) traco(p, r, CORES.teiaForte)

  const borda = moldura()
  for (const f of borda.filetes) {
    p.retangulo(f.x, f.y, f.largura, f.altura, { traco: CORES.ouro, espessura: f.espessura })
  }
  for (const t of borda.tracos) traco(p, t, CORES.ouro)
  for (const l of borda.losangos) p.poligono(l, { preenche: CORES.ouro })

  const corrente = correnteDaBorda()
  for (const t of corrente.tracos) traco(p, t, CORES.ouro)
  for (const l of corrente.losangos) p.poligono(l, { preenche: CORES.ouro })

  microtexto(p)

  /*
    O peso é um recurso escasso aqui, e o uso dele é a diferença entre diploma e
    apresentação de slides.

    A versão anterior punha negrito no título, no nome, no elo, nos sete valores
    da ficha e nas matérias — ou seja, em tudo que importava, o que é o mesmo que
    em nada: sem um peso leve por perto, nenhum negrito se destaca. Agora só o
    elo é negrito. Ele é o clímax do documento, e todo o resto constrói até ele.
    A hierarquia dos outros vem de corpo, cor e espaçamento, que é como
    tipografia de documento formal sempre se organizou.
  */
  p.centrado('NERD TRAINER', MEIO, 62, { tamanho: 11, cor: CORES.ouroEscuro, espacamento: 4.5 })
  p.centrado('Certificado de Nerdice', MEIO, 84, { tamanho: 32, cor: CORES.tinta })

  const sep = separador(MEIO, 130, 150)
  for (const t of sep.tracos) traco(p, t, CORES.ouro)
  for (const l of sep.losangos) p.poligono(l, { preenche: CORES.ouro })

  p.centrado('Certificamos que', MEIO, 168, { tamanho: 13, cor: CORES.tinta })
  p.centrado(dados.nome, MEIO, 194, { tamanho: 36, cor: CORES.tinta })

  // A linha do nome acompanha a largura dele, com folga — uma régua fixa ficaria
  // curta em "Maria Eduarda" e comprida demais em "Jão".
  const regua = Math.min(L - 220, Math.max(180, p.largura(dados.nome, 'normal', 36) + 80))
  p.linha(MEIO - regua / 2, 240, MEIO + regua / 2, 240, { cor: CORES.ouro, espessura: 0.6 })

  p.centrado('alcançou, no ranking do Nerdômetro, a patente de', MEIO, 258, {
    tamanho: 13,
    cor: CORES.tinta,
  })

  // A faixa antes do elo, para o texto pousar sobre ela e não no vazio. A
  // largura segue o nome da patente: `Nerd V` numa faixa de `Ultra Virgem`
  // ficaria boiando no meio dela.
  const faixaLargura = Math.max(210, p.largura(dados.elo, 'negrito', 42) + 70)
  p.poligono(faixa(MEIO, 302, faixaLargura, 52), {
    preenche: CORES.faixa,
    traco: CORES.ouro,
    espessura: 0.6,
  })
  p.centrado(dados.elo, MEIO, 286, { fonte: 'negrito', tamanho: 42, cor: CORES.ouroEscuro })
  p.centrado(`“${dados.lema}”`, MEIO, 340, { fonte: 'italico', tamanho: 14, cor: CORES.tinta })

  selo(p, dados.elo)

  ficha(p, dados.fichas)

  if (dados.materias.length > 0) {
    // As matérias no rodapé central, abaixo do selo: elas são a única linha que
    // varia de tamanho conforme o jogador, e no meio da ficha empurrariam tudo.
    p.centrado('MELHORES MATÉRIAS', MEIO, 512, {
      tamanho: 6.5,
      cor: CORES.rotulo,
      espacamento: 1.4,
    })
    p.centrado(dados.materias.join('   ·   '), MEIO, 523, {
      tamanho: 10,
      cor: CORES.ouroEscuro,
    })
  }

  // Coluna da direita: a assinatura.
  p.aDireita(`emitido em ${dados.emitidoEm}`, L - 70, 430, { tamanho: 10, cor: CORES.tinta })
  p.aDireita(`registro ${dados.registro}`, L - 70, 446, { tamanho: 10, cor: CORES.tinta })
  p.linha(L - 230, 486, L - 70, 486, { cor: CORES.tinta, espessura: 0.6 })
  p.aDireita('Departamento de Assuntos Virgens', L - 70, 492, { tamanho: 9.5, cor: CORES.tinta })

  return montarPdf(p)
}

const traco = (p: Pagina, s: Segmento, cor: string) =>
  p.linha(s.x1, s.y1, s.x2, s.y2, { cor, espessura: s.espessura })

/** A geometria da ficha, compartilhada com a folha da tela. */
export const FICHA = {
  x: 70,
  y: 396,
  colunas: 2,
  larguraDaColuna: 142,
  alturaDaLinha: 30,
  /** Folga entre o último valor e o filete que fecha o bloco. */
  respiro: 8,
} as const

/**
 * A ficha técnica: rótulo miúdo em versalete, valor em destaque logo abaixo.
 *
 * Duas colunas e não uma lista corrida porque o bloco divide a faixa de rodapé
 * com o selo e a assinatura — em uma coluna ele desceria até a moldura, em três
 * os valores longos ("4 de 72 jogos") se encavalariam. O filete curto no topo
 * fecha o bloco e o separa do lema, que fica logo acima.
 */
function ficha(p: Pagina, fichas: readonly Ficha[]) {
  const { x, y, colunas, larguraDaColuna, alturaDaLinha } = FICHA
  const linhas = Math.ceil(fichas.length / colunas)

  p.linha(x, y - 12, x + colunas * larguraDaColuna - 20, y - 12, {
    cor: CORES.ouro,
    espessura: 0.5,
  })

  fichas.forEach((f, i) => {
    const cx = x + (i % colunas) * larguraDaColuna
    const cy = y + Math.floor(i / colunas) * alturaDaLinha
    p.texto(f.rotulo, cx, cy, { tamanho: 6.5, cor: CORES.rotulo, espacamento: 1.4 })
    // Valor em regular: a hierarquia contra o rótulo já está no corpo (quase o
    // dobro) e na cor (tinta cheia contra tinta lavada). Sete valores em negrito
    // faziam a ficha pesar mais que o nome da pessoa.
    p.texto(f.valor, cx, cy + 10, { tamanho: 12, cor: CORES.tinta })
  })

  const fecho = y + (linhas - 1) * alturaDaLinha + 22 + FICHA.respiro
  p.linha(x, fecho, x + colunas * larguraDaColuna - 20, fecho, {
    cor: CORES.ouro,
    espessura: 0.5,
  })
}

/**
 * O microtexto da borda: a linha miúda que documento de segurança carrega.
 *
 * 3,6pt é ilegível a olho nu e nítido no zoom — que é a graça. O número de
 * repetições sai da régua, e não de um chute: sem isso a última atravessa a
 * moldura. O teto de 12 é o cinto de segurança para quando a régua for o
 * fallback grosseiro, que subestima a largura e pediria repetições demais.
 */
function microtexto(p: Pagina) {
  const largura = p.largura(FRASE_MIUDA, 'normal', 3.6)
  const vezes = Math.max(1, Math.min(12, Math.floor((L - 130) / largura)))
  const fita = FRASE_MIUDA.repeat(vezes)

  // Logo abaixo do filete interno, e não na faixa da moldura: ali mora a
  // corrente, e as duas coisas juntas viravam um borrão de tinta.
  for (const y of [46, A - 51]) {
    p.centrado(fita, MEIO, y, { tamanho: 3.6, cor: CORES.miudo })
  }
}

/** O selo: anéis denteados, o átomo do app e o elo gravado embaixo. */
function selo(p: Pagina, elo: string) {
  const { cx, cy, raio } = SELO

  // As fitas vêm antes dos anéis: elas saem de baixo do selo, então quem
  // desenha depois cobre a junção e o lacre parece colado por cima.
  for (const fita of fitasDoSelo(cx, cy, raio)) {
    p.poligono(fita, { preenche: CORES.faixa, traco: CORES.ouro, espessura: 0.6 })
  }

  p.elipse(cx, cy, raio, raio, { preenche: CORES.papel, traco: CORES.ouro, espessura: 1.6 })
  p.elipse(cx, cy, raio - 5, raio - 5, { traco: CORES.ouro, espessura: 3 })
  for (const d of denteadoDoSelo(cx, cy, raio)) traco(p, d, CORES.ouro)

  for (const giro of [0, 60, 120]) {
    p.elipse(cx, cy - 8, 19, 8, { traco: CORES.ouroEscuro, espessura: 1.4, giro })
  }
  p.elipse(cx, cy - 8, 3.4, 3.4, { preenche: CORES.ouroEscuro })

  // As estrelas ficam fora da palavra, e a distância sai da largura dela: com um
  // afastamento fixo, `Ultra Virgem` encostava nas duas pontas enquanto `Nerd V`
  // ficava perdido no meio do selo.
  const afastamento = Math.min(38, p.largura(elo, 'negrito', 8.5) / 2 + 8)
  for (const lado of [-1, 1] as const) {
    p.poligono(estrela(cx + lado * afastamento, cy + 25, 3.4) as Poligono, {
      preenche: CORES.ouroEscuro,
    })
  }
  p.centrado(elo, cx, cy + 21, { fonte: 'negrito', tamanho: 8.5, cor: CORES.ouroEscuro })
}

export { FOLHA }
