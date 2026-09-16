import { describe, expect, it } from 'vitest'
import { PROPOSICOES } from './linguagem-matematica'
import type { ErroClassico } from './linguagem-matematica'

/**
 * Guardas do dataset — e, aqui, guardas do *conteúdo*: num jogo de escolha o
 * item vale o que valem os distratores, então o teste cobra que cada um deles
 * continue sendo uma leitura errada declarada, e não uma frase qualquer.
 */

/** Toda classe de erro que o dataset promete cobrir. Ver `ErroClassico`. */
const CLASSES: readonly ErroClassico[] = [
  'ordem-dos-quantificadores',
  'quantificador-trocado',
  'pertence-por-contido',
  'reciproca',
  'inversa',
  'imagem-por-dominio',
  'negacao-mal-feita',
  'operacao-trocada',
  'ordem-dos-operandos',
  'perde-a-unicidade',
  'cardinalidade-trocada',
  'simbolo-lido-como-igualdade',
  'confunde-com-caso-trivial',
]

describe('coerência do dataset', () => {
  it('não repete id nem notação', () => {
    for (const campo of ['id', 'notacao'] as const) {
      const vistos = PROPOSICOES.map((p) => p[campo])
      expect(new Set(vistos).size, `${campo} repetido`).toBe(vistos.length)
    }
  })

  it('toda proposição tem pelo menos três distratores', () => {
    // Menos que três e a carta não fecha as quatro alternativas.
    for (const p of PROPOSICOES) {
      expect(p.distratores.length, p.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('nenhum distrator repete outro, nem repete a leitura certa', () => {
    for (const p of PROPOSICOES) {
      const textos = p.distratores.map((d) => d.texto)
      expect(new Set(textos).size, `${p.id}: distrator repetido`).toBe(textos.length)
      expect(textos, `${p.id}: distrator igual à resposta`).not.toContain(p.leitura)
    }
  })

  it('todo distrator declara a classe de erro que ele explora', () => {
    // A etiqueta não é documentação: é o que o embaralhador usa para não pôr
    // três variações da mesma armadilha na mesma tela.
    for (const p of PROPOSICOES) {
      for (const d of p.distratores) {
        expect(CLASSES, `${p.id}: "${d.texto}" tem erro desconhecido`).toContain(d.erro)
      }
    }
  })

  it('e toda classe declarada é usada por alguém', () => {
    // Classe sem uso é promessa que o baralho não cumpre — ou é o rastro de um
    // distrator que alguém apagou.
    const usadas = new Set(PROPOSICOES.flatMap((p) => p.distratores.map((d) => d.erro)))
    for (const classe of CLASSES) {
      expect(usadas.has(classe), `ninguém explora "${classe}"`).toBe(true)
    }
  })

  it('as cartas de quantificador oferecem mesmo a ordem trocada', () => {
    /*
     * O gabarito conferido à mão do jogo inteiro. Estas quatro cartas existem
     * *por causa* do distrator: sem a leitura com os quantificadores invertidos,
     * `∀x∃y` vira uma frase bonita que ninguém erra. Se alguém tirar esse
     * distrator por achá-lo "capcioso demais", o item deixa de medir a única
     * coisa que ele mede.
     */
    for (const id of ['existe-maior', 'maximo-dos-reais', 'limite-epsilon-delta', 'convergencia']) {
      const p = PROPOSICOES.find((x) => x.id === id)
      expect(p, `${id} sumiu`).toBeDefined()
      expect(
        p?.distratores.some((d) => d.erro === 'ordem-dos-quantificadores'),
        `${id} perdeu o distrator de ordem dos quantificadores`,
      ).toBe(true)
    }
  })

  it('a contrapositiva oferece a recíproca e a inversa, que é o par que se confunde', () => {
    const p = PROPOSICOES.find((x) => x.id === 'contrapositiva')
    const erros = p?.distratores.map((d) => d.erro) ?? []
    expect(erros).toContain('reciproca')
    expect(erros).toContain('inversa')
  })

  it('⊆ e ∈ se oferecem um ao outro como distrator', () => {
    for (const id of ['subconjunto', 'elemento', 'vazio-contido', 'vazio-elemento']) {
      const p = PROPOSICOES.find((x) => x.id === id)
      expect(
        p?.distratores.some((d) => d.erro === 'pertence-por-contido'),
        `${id} não oferece a confusão entre ∈ e ⊆`,
      ).toBe(true)
    }
  })

  it('a carta de tipo de função oferece confundir imagem com contradomínio', () => {
    const p = PROPOSICOES.find((x) => x.id === 'tipo-da-funcao')
    expect(p?.distratores.filter((d) => d.erro === 'imagem-por-dominio').length).toBeGreaterThan(1)
  })
})

describe('a notação é Unicode, nunca ASCII improvisado', () => {
  it('não usa <=, >=, !=, -> nem =>', () => {
    // Existe ≤, ≥, ≠, → e ⟹. Deixar passar um `->` numa carta faria a notação
    // da tela destoar de todas as outras — e este é um jogo *sobre* notação.
    for (const p of PROPOSICOES) {
      expect(p.notacao, p.id).not.toMatch(/<=|>=|!=|->|=>/)
    }
  })

  it('não usa hífen ASCII no lugar do sinal de menos', () => {
    // `−` é U+2212. `-` é o hífen do teclado, e num `|x-a|` ele fica curto e
    // colado.
    for (const p of PROPOSICOES) {
      expect(p.notacao, `${p.id}: "${p.notacao}"`).not.toContain('-')
    }
  })

  it('não usa ^ nem _ para expoente e índice', () => {
    // O Unicode tem x², xₙ e f⁻¹. `x^2` é LaTeX mal digitado.
    for (const p of PROPOSICOES) {
      expect(p.notacao, p.id).not.toMatch(/[\^_]/)
    }
  })

  it('e toda proposição tem símbolo — ou é um operador que se escreve por extenso', () => {
    /*
     * `sup A` não tem um caractere fora do ASCII e está certo assim: parte da
     * linguagem matemática é operador escrito como palavra — sup, inf, lim,
     * mod, ker. A lista é explícita para que "escapou um ASCII" continue sendo
     * um erro, e só deixe de ser quando alguém decidir que deixou.
     */
    const PALAVRA_E_OPERADOR = new Set(['supremo'])
    for (const p of PROPOSICOES) {
      if (PALAVRA_E_OPERADOR.has(p.id)) continue
      expect(/[^\x20-\x7e]/.test(p.notacao), `${p.id}: "${p.notacao}" é só ASCII`).toBe(true)
    }
  })

  it('a notação é curta: ela aparece em corpo grande, numa linha só', () => {
    // A engine desenha a pergunta em `text-3xl`. Proposição comprida vira cinco
    // linhas num telefone, e aí o jogo mede paciência.
    for (const p of PROPOSICOES) {
      expect([...p.notacao].length, `${p.id}: "${p.notacao}"`).toBeLessThanOrEqual(46)
    }
  })
})

describe('as leituras estão no mesmo registro', () => {
  it('nenhuma alternativa termina em ponto', () => {
    // São complementos de "esta proposição afirma que...", não frases soltas.
    for (const p of PROPOSICOES) {
      for (const texto of [p.leitura, ...p.distratores.map((d) => d.texto)]) {
        expect(texto.trim(), `${p.id}: "${texto}"`).toBe(texto)
        expect(texto.endsWith('.'), `${p.id}: "${texto}"`).toBe(false)
      }
    }
  })

  it('e o distrator não se denuncia por ser curto demais ao lado da resposta', () => {
    /*
     * Numa carta de escolha, comprimento é pista. Se a certa tem 78 caracteres
     * e as erradas têm 20, dá para acertar sem ler — a alternativa "caprichada"
     * é a certa. A régua é frouxa de propósito (nenhum distrator abaixo de 40%
     * do tamanho da resposta): apertar mais obrigaria a encher linguiça.
     */
    const curtos = PROPOSICOES.flatMap((p) =>
      p.distratores
        .filter((d) => d.texto.length / p.leitura.length <= 0.4)
        .map((d) => `${p.id}: "${d.texto}"`),
    )
    expect(curtos).toEqual([])
  })
})
