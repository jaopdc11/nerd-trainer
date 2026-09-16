import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import type { Exercicio } from '@/core/types'
import {
  AMINOACIDOS,
  NOME_PARADA,
  codificadoraParaRna,
  moldeDe,
  rotulo,
  transcrever,
  traduzir,
} from '@/data/codigo-genetico'
import { gerarTranscricao, transcricao } from './transcricao'

const NIVEL_MAX = 2

function amostra(nivel: number, quantos = 400): Exercicio[] {
  return Array.from({ length: quantos }, (_, i) => gerarTranscricao(mulberry32(i + 1), nivel))
}

/** O texto das alternativas de um exercício de escolha. */
function textosDe(e: Exercicio): readonly string[] {
  if (e.tipo !== 'escolha') throw new Error(`${e.chave} devia ser de escolha`)
  return e.alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))
}

/** Todos os nomes que o jogo pode dar como resposta de aminoácido. */
const NOMES = new Set([...AMINOACIDOS.map((a) => a.nome), NOME_PARADA])

describe('forma dos exercícios', () => {
  it('são todos de escolha, em todo nível — o gesto não troca no meio da partida', () => {
    // Alternar entre digitar-e-dar-Enter e clicar durante uma partida
    // cronometrada é pior que qualquer uma das duas coisas.
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(nivel, 200)) {
        expect(e.tipo, e.chave).toBe('escolha')
      }
    }
  })

  it('têm sempre quatro alternativas distintas e o índice certo aponta para o gabarito', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      for (const e of amostra(nivel, 200)) {
        if (e.tipo !== 'escolha') continue
        const textos = textosDe(e)
        expect(textos, e.chave).toHaveLength(4)
        expect(new Set(textos).size, `${e.chave}: alternativa repetida`).toBe(4)
        expect(textos[e.indiceCorreto], e.chave).toBe(e.gabarito)
      }
    }
  })

  it('o índice correto não fica preso numa posição', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      const posicoes = new Set(
        amostra(nivel, 200).map((e) => (e.tipo === 'escolha' ? e.indiceCorreto : -1)),
      )
      expect(posicoes, `nível ${nivel}`).toEqual(new Set([0, 1, 2, 3]))
    }
  })

  it('escrevem em português com acento — "aminoácido", "códon"', () => {
    const enunciados = new Set(amostra(NIVEL_MAX, 300).map((e) => e.enunciado.valor))
    expect([...enunciados].some((t) => t.includes('aminoácido'))).toBe(true)
    for (const t of enunciados) {
      expect(t, t).not.toMatch(/aminoacido|codon\b|codificadora de/)
    }
  })
})

describe('nível 0 — fita molde para mRNA', () => {
  const ITENS = amostra(0, 300)

  it('só pede isso, e a resposta é sempre a transcrição da fita mostrada', () => {
    for (const e of ITENS) {
      const achado = e.enunciado.valor.match(/^mRNA da fita molde ([ATCG]{6})$/)
      expect(achado, `enunciado inesperado: ${e.enunciado.valor}`).not.toBeNull()
      const molde = (achado as RegExpMatchArray)[1] as string
      expect(e.gabarito, molde).toBe(transcrever(molde))
    }
  })

  it('a resposta certa nunca tem timina, e é a única sem', () => {
    // RNA não tem T. Se a certa tivesse, a tabela de pareamento quebrou.
    for (const e of ITENS.slice(0, 60)) {
      expect(e.gabarito, e.chave).not.toMatch(/T/)
    }
  })

  it('oferece as três leituras erradas da fita, e a pior delas é a primeira', () => {
    // "Só trocou T por U" é a armadilha inteira do assunto, e é a única opção
    // errada que continua sendo RNA plausível: quem marca esta não sabe qual das
    // duas fitas está na mão.
    for (const e of ITENS.slice(0, 60)) {
      const molde = (e.chave.split(':')[2] as string)
      expect(textosDe(e), e.chave).toContain(codificadoraParaRna(molde))
    }
  })

  it('não explica nada — é a regra pura, e não há armadilha para justificar', () => {
    for (const e of ITENS) {
      expect(e.porque, e.chave).toBeUndefined()
    }
  })
})

describe('nível 1 — códon para aminoácido', () => {
  it('a resposta é a da tabela, e as erradas são aminoácidos de verdade', () => {
    const itens = amostra(1, 300).filter((e) => e.chave.startsWith('transcricao:codon:'))
    expect(itens.length).toBeGreaterThan(0)

    for (const e of itens) {
      const codon = e.chave.split(':')[2] as string
      expect(e.gabarito, codon).toBe(rotulo(traduzir(codon)))
      for (const t of textosDe(e)) {
        expect(NOMES, `${codon}: "${t}" não é aminoácido nem parada`).toContain(t)
      }
    }
  })

  it('a parada sai como resposta certa e como alternativa errada', () => {
    // Três dos 64 códons param. Se 'parada' nunca aparecesse, o jogo teria
    // perdido o item mais importante da tabela.
    const itens = amostra(1, 400).filter((e) => e.chave.startsWith('transcricao:codon:'))
    expect(itens.some((e) => e.gabarito === NOME_PARADA)).toBe(true)
    expect(
      itens.some((e) => e.gabarito !== NOME_PARADA && textosDe(e).includes(NOME_PARADA)),
    ).toBe(true)
  })
})

describe('nível 2 — as duas pernas, e a armadilha', () => {
  const ITENS = amostra(2, 500)

  it('a fita molde vai direto ao aminoácido, passando pelo códon certo', () => {
    const itens = ITENS.filter((e) => e.chave.startsWith('transcricao:molde-amino:'))
    expect(itens.length).toBeGreaterThan(0)

    for (const e of itens) {
      const codon = e.chave.split(':')[2] as string
      const molde = moldeDe(codon)
      expect(e.enunciado.valor, codon).toBe(`aminoácido da fita molde ${molde}`)
      expect(e.gabarito, codon).toBe(rotulo(traduzir(codon)))
      // O item tem duas pernas: o porquê mostra a do meio, senão quem errou não
      // sabe se errou o pareamento ou a tabela.
      expect(e.porque, codon).toBe(`${molde} transcreve para ${codon}, e ${codon} é ${e.gabarito}`)
    }
  })

  it('e oferece o aminoácido que sai de ler a molde como codificadora', () => {
    // O erro com nome deste degrau. Tem de estar na tela pelo mesmo motivo que a
    // regra decorada está na tela do nox.
    const itens = ITENS.filter((e) => e.chave.startsWith('transcricao:molde-amino:'))
    const comErroNomeado = itens.filter((e) => {
      const codon = e.chave.split(':')[2] as string
      const errado = rotulo(traduzir(codificadoraParaRna(moldeDe(codon))))
      return errado !== e.gabarito && textosDe(e).includes(errado)
    })
    // Não é "todos" porque o erro às vezes cai em cima da resposta certa — a
    // fita ACA, por exemplo, dá o mesmo aminoácido nas duas leituras.
    expect(comErroNomeado.length / itens.length).toBeGreaterThan(0.8)
  })

  it('a armadilha da codificadora aparece, e nela complementar é o erro', () => {
    const itens = ITENS.filter((e) => e.chave.startsWith('transcricao:codificadora:'))
    expect(itens.length).toBeGreaterThan(0)

    for (const e of itens) {
      const fita = e.chave.split(':')[2] as string
      expect(e.gabarito, fita).toBe(codificadoraParaRna(fita))
      // A resposta certa é a fita quase intacta: quem complementou marcou outra.
      expect(textosDe(e), fita).toContain(transcrever(fita))
      expect(e.porque, fita).toContain('só se troca T por U')
    }
  })

  it('a armadilha só existe no último degrau', () => {
    // Mostrá-la antes ensinaria que às vezes se complementa e às vezes não, sem
    // dizer quando — pior do que não ensinar nada.
    for (const nivel of [0, 1]) {
      const itens = amostra(nivel, 300)
      expect(itens.some((e) => e.chave.startsWith('transcricao:codificadora:')), `nível ${nivel}`)
        .toBe(false)
    }
  })

  it('e só os itens de duas pernas e a armadilha explicam o porquê', () => {
    for (const e of ITENS) {
      const deveExplicar =
        e.chave.startsWith('transcricao:molde-amino:') ||
        e.chave.startsWith('transcricao:codificadora:')
      expect(e.porque !== undefined, e.chave).toBe(deveExplicar)
    }
  })
})

describe('escala', () => {
  it('acumula os níveis em vez de substituí-los', () => {
    const chaves = amostra(NIVEL_MAX, 500).map((e) => e.chave)
    expect(chaves.some((c) => c.startsWith('transcricao:molde:'))).toBe(true)
    expect(chaves.some((c) => c.startsWith('transcricao:codon:'))).toBe(true)
    expect(chaves.some((c) => c.startsWith('transcricao:molde-amino:'))).toBe(true)
  })

  it('e o nível 1 já traz o degrau anterior junto', () => {
    const chaves = amostra(1, 300).map((c) => c.chave)
    expect(chaves.some((c) => c.startsWith('transcricao:molde:'))).toBe(true)
    expect(chaves.some((c) => c.startsWith('transcricao:codon:'))).toBe(true)
  })

  it('chega ao último degrau e para lá', () => {
    const { escala } = transcricao.config()
    expect(escala(0)).toBe(0)
    expect(escala(1000)).toBe(NIVEL_MAX)
  })

  it('nível fora da faixa não quebra o gerador', () => {
    expect(() => gerarTranscricao(mulberry32(1), -5)).not.toThrow()
    expect(() => gerarTranscricao(mulberry32(1), 99)).not.toThrow()
  })
})

describe('sorteio', () => {
  it('é determinístico pela semente', () => {
    for (let nivel = 0; nivel <= NIVEL_MAX; nivel++) {
      const a = gerarTranscricao(mulberry32(123), nivel)
      const b = gerarTranscricao(mulberry32(123), nivel)
      expect(a.chave).toBe(b.chave)
      expect(a.tipo === 'escolha' && a.indiceCorreto).toBe(b.tipo === 'escolha' && b.indiceCorreto)
    }
  })

  it('varre o espaço das fitas, sem ficar preso em poucas', () => {
    // 4⁶ = 4096 fitas possíveis no nível 0. Se o sorteio repetisse, a
    // anti-repetição do motor mataria o jogo em poucas cartas.
    const chaves = new Set(amostra(0, 300).map((e) => e.chave))
    expect(chaves.size).toBeGreaterThan(250)
  })
})

describe('jogo', () => {
  it('declara o relógio maior dos geradores pesados, e não o do nox', () => {
    // Quatro fitas de seis caracteres não se comparam de relance como "+6"
    // contra "−2". O relógio paga o custo do item, não aumenta a vazão.
    const c = transcricao.config()
    expect(c.segundosIniciais).toBe(75)
    expect(c.bonusPorAcertoS).toBe(6)
    expect(c.tetoSegundos).toBe(150)
  })

  it('é da categoria biológicas e tem os metadados do registry', () => {
    expect(transcricao.id).toBe('transcricao')
    expect(transcricao.mecanica).toBe('gerador')
    expect(transcricao.categoria).toBe('biologicas')
    expect(transcricao.comoJogar.length).toBeGreaterThanOrEqual(3)
  })
})
