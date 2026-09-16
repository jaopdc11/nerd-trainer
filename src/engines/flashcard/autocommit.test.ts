import { describe, expect, it } from 'vitest'
import { chavesDeTexto, completaSemAmbiguidade, formasDeAutoCommit } from '@/core/answer'
import { JOGOS } from '@/core/registry'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'

/**
 * A varredura que faltava: o auto-commit dos baralhos digitados, carta a carta,
 * em todos os jogos do registry.
 *
 * **O defeito.** `podeAutoCommitar` monta o universo com as formas *da própria
 * carta* — ao contrário da grade, onde o universo são as células ainda abertas.
 * Aí `completaSemAmbiguidade` aplica a regra dela: se qualquer forma do universo
 * continua a partir do que foi digitado, segura o commit à espera da
 * continuação. Resultado: **uma forma aceita que seja prefixo estrito de outra
 * da mesma carta mata o auto-commit daquela carta, e mata em silêncio** — o jogo
 * não reclama, só passa a exigir Enter. Foi o que aconteceu com `⊥`: "ortogonal
 * a" existia na lista, "ortogonal" e "perpendicular" pararam de commitar, e
 * ninguém tinha como saber por quê olhando a tela.
 *
 * **O que esta varredura cobra, e o que ela deliberadamente não cobra.** Medido
 * no baralho inteiro do registry, o prefixo estrito cru dava **402 pares em 12
 * jogos** (389 depois deste conserto), e a esmagadora maioria é a trava
 * trabalhando certo: "franco" é
 * prefixo de "franco congolês", "machado" de "machado de assis", "pampa" de
 * "pampas". Commitar em "franco" dali seria pontuar certo e **roubar o resto da
 * digitação para a carta seguinte** — quem sabe o nome completo começa a
 * escrevê-lo, e " congolês" cairia no campo da próxima pergunta. Cobrar esses
 * 402 seria pedir para apagar resposta legítima do dataset em nome de um Enter.
 *
 * Então a asserção é sobre o subconjunto em que o prefixo **não compra nada**:
 * pares em que as duas chaves saem da *mesma forma aceita*. Isso só acontece por
 * um motivo — a forma termina em artigo ou preposição solta. `chavesDeTexto`
 * registra as duas leituras ("perpendicular a" → "perpendicular" e
 * "perpendiculara", ver `semArtigos`), e a segunda existe unicamente para
 * bloquear a primeira: quem digita "perpendicular a" já é aceito pela forma
 * "perpendicular", porque a normalização come a preposição final antes de
 * comparar. É prefixo que não defende resposta nenhuma e custa o auto-commit da
 * carta — inclusive quando a forma está sozinha na carta, caso em que ela
 * sabota a si mesma.
 *
 * A alternativa descartada era consertar no núcleo: deixar o flashcard commitar
 * em qualquer casamento exato, já que todas as formas da carta respondem a
 * mesma pergunta e o commit precoce sempre dá ponto. Foi descartada justamente
 * pelos 389 pares legítimos — em moedas, obras e pinturas ela trocaria um Enter
 * a menos por texto derramado na carta seguinte, dezenas de vezes por partida.
 */

/** Chaves que o motor compara, e de qual forma aceita cada uma saiu. */
function chavesPorForma(carta: Carta): Map<string, string[]> {
  const porChave = new Map<string, string[]>()
  if (carta.tipo !== 'digitada') return porChave

  // `null` nos tipos em que aceitar cedo seria errado ('numero'): lá não há
  // auto-commit para perder, logo não há prefixo para cobrar.
  if (!formasDeAutoCommit(carta.resposta)) return porChave

  const registrar = (chave: string, forma: string) => {
    const lista = porChave.get(chave)
    if (lista) lista.push(forma)
    else porChave.set(chave, [forma])
  }

  if (carta.resposta.tipo === 'texto') {
    const ignorarArtigos = carta.resposta.opcoes?.ignorarArtigos ?? true
    for (const forma of carta.resposta.aceitas) {
      for (const chave of chavesDeTexto(forma, ignorarArtigos)) registrar(chave, forma)
    }
  } else if (carta.resposta.tipo === 'simbolo') {
    // Sem normalizar: no símbolo a caixa é a informação, e a forma é a chave.
    for (const forma of [carta.resposta.canonica, ...(carta.resposta.aceitas ?? [])]) {
      registrar(forma.trim(), forma)
    }
  } else {
    const auto = formasDeAutoCommit(carta.resposta)
    for (const forma of auto?.formas ?? []) registrar(forma, forma)
  }

  return porChave
}

/**
 * Os pares em que a chave curta perde o auto-commit sem que a longa acrescente
 * resposta nenhuma — as duas saem da mesma forma aceita.
 */
function prefixosInuteis(porChave: Map<string, string[]>): string[] {
  const chaves = [...porChave.keys()]
  const achados: string[] = []

  for (const curta of chaves) {
    for (const longa of chaves) {
      if (longa === curta || !longa.startsWith(curta)) continue
      const mesmaForma = (porChave.get(curta) ?? []).filter((f) =>
        (porChave.get(longa) ?? []).includes(f),
      )
      for (const forma of mesmaForma) {
        achados.push(`"${forma}" registra "${curta}" e "${longa}", e a segunda só trava a primeira`)
      }
    }
  }
  return achados
}

const BARALHOS = JOGOS.filter((j) => j.mecanica === 'flashcard').map(
  (jogo) => [jogo.id, jogo.config().montarBaralho(mulberry32(11))] as const,
)

describe('auto-commit dos baralhos digitados', () => {
  it('varre o registry inteiro, e não só o jogo do dia', () => {
    // Sem isto a varredura poderia estar passando por estar vazia — foi assim
    // que um refactor de `mecanica` já deixou meia dúzia de jogos fora de um
    // teste de catálogo sem ninguém notar.
    expect(BARALHOS.length).toBeGreaterThan(5)
    expect(BARALHOS.every(([, baralho]) => baralho.length > 0)).toBe(true)
  })

  it('nenhuma forma aceita termina em partícula que a normalização já come', () => {
    const achados: string[] = []

    for (const [jogoId, baralho] of BARALHOS) {
      for (const carta of baralho) {
        for (const queixa of prefixosInuteis(chavesPorForma(carta))) {
          achados.push(`${jogoId}/${carta.id}: ${queixa}`)
        }
      }
    }

    // A mensagem nomeia jogo, carta e par porque o conserto é sempre uma linha
    // de dataset, e quem lê a falha precisa saber qual linha abrir. O conserto é
    // tirar a partícula final (ou a forma inteira, se outra já a cobre): nada do
    // que era aceito deixa de ser.
    expect(achados, `auto-commit morto por ruído em ${achados.length} forma(s):\n${achados.join('\n')}`)
      .toEqual([])
  })

  it('e o ⊥ que começou tudo commita sozinho de novo', () => {
    // Regressão pelo caminho do motor, não pelo dataset: é este par de funções
    // que `podeAutoCommitar` chama.
    const baralho = BARALHOS.find(([id]) => id === 'simbolos-matematicos')?.[1] ?? []
    const carta = baralho.find((c) => c.id === 'simbolo-perpendicular')
    if (carta?.tipo !== 'digitada') throw new Error('a carta do ⊥ sumiu do baralho')

    const auto = formasDeAutoCommit(carta.resposta)
    if (!auto) throw new Error('a carta do ⊥ deixou de ter auto-commit')

    for (const texto of ['perpendicular', 'ortogonal', 'perpendicular a', 'PERPENDICULAR']) {
      expect(completaSemAmbiguidade(auto.normalizar(texto), auto.formas), texto).toBe(true)
    }
    // E o que ainda está no meio da palavra continua esperando, como deve.
    expect(completaSemAmbiguidade(auto.normalizar('perpendic'), auto.formas)).toBe(false)
  })
})
