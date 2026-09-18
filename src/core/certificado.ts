import { FAIXAS, NOTA_MAXIMA } from './nerdometro'
import type { Nerdometro } from './nerdometro'
import type { DadosDoCertificado } from './certificado-pdf'
import { ROTULO_CATEGORIA } from './types'

/**
 * O texto do diploma, num lugar só.
 *
 * Ele é desenhado duas vezes — em HTML, para conferir na tela, e em PDF, para
 * guardar — e essas duas telas divergiriam no primeiro ajuste de frase se cada
 * uma montasse as próprias linhas. Aqui as duas recebem as mesmas strings
 * prontas; o que cada uma decide é só tipografia e posição.
 *
 * Por isso também não há `<strong>` no meio das frases: negrito parcial existe
 * em HTML e não no desenho do PDF, e a diferença apareceria justamente na linha
 * mais lida do documento, a da nota.
 */

const DATA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })

/**
 * O número de registro.
 *
 * É decorativo e não promete verificação nenhuma — não há servidor onde
 * consultar. O que ele faz de útil é ser **determinístico**: o mesmo estado, no
 * mesmo dia, gera o mesmo código, então dois PDFs saem idênticos e um print
 * adulterado no editor de imagem deixa de bater com o que o app emite. FNV-1a de
 * 32 bits porque cabe em seis linhas e não precisa ser melhor que isso.
 */
export function registro(semente: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, '0')
  return `NT-${hex.slice(0, 4)}-${hex.slice(4)}`
}

export function formatarTempo(ms: number): string {
  const min = Math.round(ms / 60_000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  return `${h}h${String(min % 60).padStart(2, '0')}`
}

export function dadosDoCertificado(
  m: Nerdometro,
  nome: string,
  agora: Date = new Date(),
): DadosDoCertificado {
  // Sem nome, "Anônimo": um espaço em branco no meio de um diploma parece
  // defeito, e anônimo ainda combina com um app que não tem conta nem login.
  const quem = nome.trim() || 'Anônimo'

  const materias = [...m.categorias]
    .filter((c) => c.nota !== null)
    .sort((a, b) => (b.nota as number) - (a.nota as number))
    .slice(0, 3)
    .map((c) => `${ROTULO_CATEGORIA[c.categoria]} ${c.nota}`)

  /**
   * A ordem é a da leitura, não a da importância: primeiro o que a pessoa
   * conquistou (nota, elo), depois o que ela cobriu (jogos, máximos), por fim o
   * quanto isso custou (partidas, tempo, ofensiva). Em duas colunas, isso põe
   * conquista à esquerda e esforço à direita.
   */
  const fichas = [
    { rotulo: 'NOTA', valor: `${m.nota} / ${NOTA_MAXIMA}` },
    { rotulo: 'PARTIDAS', valor: String(m.partidas) },
    { rotulo: 'ELO', valor: `${m.faixa.indice + 1} de ${FAIXAS.length}` },
    { rotulo: 'TEMPO DE VIDA', valor: formatarTempo(m.tempoMs) },
    { rotulo: 'COBERTURA', valor: `${m.jogados} de ${m.total} jogos` },
    // A maior ofensiva, e não a atual: o diploma é um retrato para guardar, e a
    // sequência de hoje pode morrer antes do fim da semana.
    ...(m.ofensiva.recorde > 1
      ? [{ rotulo: 'MAIOR OFENSIVA', valor: `${m.ofensiva.recorde} dias` }]
      : []),
    { rotulo: 'NO MÁXIMO', valor: `${m.dominados} ${m.dominados === 1 ? 'jogo' : 'jogos'}` },
  ]

  return {
    nome: quem,
    elo: m.faixa.titulo,
    lema: m.faixa.lema,
    fichas,
    materias,
    emitidoEm: DATA.format(agora),
    registro: registro(`${quem}|${m.faixa.titulo}|${m.nota}|${agora.toDateString()}`),
  }
}

/** `Ultra Virgem` → `certificado-ultra-virgem.pdf`. */
export function nomeDoArquivo(elo: string): string {
  const limpo = elo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `certificado-${limpo}.pdf`
}
