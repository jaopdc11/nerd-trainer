import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro, validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import type { Carta } from '@/core/types'
import { SIMBOLOS_MATEMATICOS } from '@/data/simbolos-matematicos'
import { simbolosMatematicos } from './simbolos-matematicos'

/**
 * A regra do jogo inteira, não a da função.
 *
 * A engine de flashcard monta a vizinhança com as formas cruas de **todas as
 * outras cartas** do baralho e valida em rigor estrito. Reproduzir isso aqui é
 * o que permite afirmar que ligar a tolerância a erro de digitação não dá ponto
 * pelo símbolo errado — testar `validar` isolado mediria outra coisa.
 */
const CARTAS = simbolosMatematicos.config().montarBaralho(mulberry32(7))

function digitada(id: string) {
  const c = CARTAS.find((k) => k.id === `simbolo-${id}`)
  if (c?.tipo !== 'digitada' || c.resposta.tipo !== 'texto') {
    throw new Error(`carta ${id} não encontrada`)
  }
  return c
}

/** Responde `texto` na carta de `id`, com a vizinhança que a engine montaria. */
function responder(id: string, texto: string) {
  const alvo = digitada(id)
  const vizinhanca = new Set(
    CARTAS.flatMap((c: Carta) =>
      c.id !== alvo.id && c.tipo === 'digitada' && c.resposta.tipo === 'texto'
        ? c.resposta.aceitas
        : [],
    ),
  )
  return validar(texto, alvo.resposta, { rigor: 'estrito', vizinhanca }).veredito
}

/** Em qual carta este texto pontuaria, se alguma. Percorre o baralho inteiro. */
function ondePontua(texto: string): string[] {
  return CARTAS.filter((c) => c.tipo === 'digitada' && responder(c.id.slice(8), texto) !== 'errado')
    .map((c) => c.id)
}

describe('baralho', () => {
  it('tem uma carta por símbolo, todas digitadas e com o glifo na pergunta', () => {
    expect(CARTAS).toHaveLength(SIMBOLOS_MATEMATICOS.length)
    for (const c of CARTAS) {
      expect(c.tipo, c.id).toBe('digitada')
      expect(c.pergunta.kind, c.id).toBe('texto')
    }
  })

  it('a pergunta é o glifo cru — sem MathML e sem imagem', () => {
    // O projeto pré-renderiza notação no build quando ela tem estrutura em duas
    // dimensões. Símbolo solto não tem, e um `<math><mi>∂</mi></math>` daria o
    // mesmo pixel com um script gerador a mais para manter em sincronia.
    const porGlifo = new Set(SIMBOLOS_MATEMATICOS.map((s) => s.glifo))
    for (const c of CARTAS) {
      expect(c.pergunta.kind === 'texto' && porGlifo.has(c.pergunta.valor), c.id).toBe(true)
    }
  })

  it('a dica é a área, e nunca o nome', () => {
    const nomes = new Set(SIMBOLOS_MATEMATICOS.map((s) => s.nome))
    for (const c of CARTAS) {
      if (c.tipo !== 'digitada') continue
      expect(c.dica, c.id).toBeDefined()
      expect(nomes.has(c.dica as string), `${c.id}: a dica entrega a resposta`).toBe(false)
    }
  })
})

describe('o que cada resposta vale', () => {
  it('todo nome canônico pontua na própria carta', () => {
    for (const s of SIMBOLOS_MATEMATICOS) {
      expect(responder(s.id, s.nome), `${s.glifo} ← "${s.nome}"`).toBe('certo')
    }
  })

  it('todo sinônimo declarado pontua na própria carta', () => {
    for (const s of SIMBOLOS_MATEMATICOS) {
      for (const sin of s.sinonimos) {
        expect(responder(s.id, sin), `${s.glifo} ← "${sin}"`).toBe('certo')
      }
    }
  })

  it('e nenhuma forma aceita pontua em carta alheia', () => {
    // O teste mais valioso do arquivo: se "gradiente" pontuasse também em ∂, o
    // jogo viraria loteria conforme a carta que caísse.
    for (const s of SIMBOLOS_MATEMATICOS) {
      for (const forma of [s.nome, ...s.sinonimos]) {
        expect(ondePontua(forma), `"${forma}" (de ${s.glifo})`).toEqual([`simbolo-${s.id}`])
      }
    }
  })

  it('continua pontuando sem acento, sem caixa e sem espaço', () => {
    for (const s of SIMBOLOS_MATEMATICOS) {
      const colado = s.nome
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^0-9a-zA-Z]/g, '')
        .toUpperCase()
      expect(responder(s.id, colado), `${s.glifo} ← "${colado}"`).toBe('certo')
    }
  })

  it('não aceita o que não é nome de símbolo nenhum', () => {
    for (const lixo of ['asdfghjkl', 'trigonometria', 'derivada']) {
      expect(ondePontua(lixo), lixo).toEqual([])
    }
  })
})

/**
 * A medição que decidiu ligar a tolerância a erro de digitação.
 *
 * O grego e os prefixos SI desligam porque suas respostas são curtas e
 * parecidas entre si. Aqui a mediana do nome passa de dez caracteres e há
 * "está contido ou é igual" — desligar puniria o dedo escorregado exatamente
 * onde digitar dá mais trabalho, que é o erro que países e bandeiras já
 * cometeram uma vez.
 *
 * Então a decisão não é de gosto: é este par de laços. Ele compara forma contra
 * forma de cartas diferentes com o mesmo `limiteDeErro` do validador, e a lista
 * do que sobra é uma asserção — hoje, vazia. Quem acrescentar um símbolo cujo
 * nome encoste em outro vê o teste quebrar, lê este comentário e decide de novo
 * — em vez de descobrir em produção.
 */
describe('medição da tolerância a erro de digitação', () => {
  function paresDentroDaTolerancia(): string[] {
    const formas = SIMBOLOS_MATEMATICOS.map((s) => ({
      id: s.id,
      // Arrow e não `.map(chaveDeTexto)`: o índice do `map` entraria como
      // `ignorarArtigos` e a medição compararia chaves de duas réguas diferentes.
      chaves: [s.nome, ...s.sinonimos].map((forma) => chaveDeTexto(forma)),
    }))

    const pares: string[] = []
    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i] as (typeof formas)[number]
        const b = formas[j] as (typeof formas)[number]
        for (const x of a.chaves) {
          for (const y of b.chaves) {
            // O validador perdoa pelo tamanho da forma que perdoou, e a trava de
            // vizinhança usa o maior dos dois limites. Aqui vale o maior, que é
            // a régua mais conservadora.
            const limite = Math.max(limiteDeErro(x.length), limiteDeErro(y.length))
            if (limite > 0 && distancia(x, y, limite) <= limite) {
              pares.push(`${x} ~ ${y}`)
            }
          }
        }
      }
    }
    return [...new Set(pares)].sort()
  }

  it('nenhum par do baralho cabe dentro da tolerância', () => {
    expect(paresDentroDaTolerancia()).toEqual([])
  })

  it('nem o par que eu jurava que ia colidir — ≪ e ≫', () => {
    // A aposta antes de medir era que "muito menor" × "muito maior" caísse
    // dentro do perdão de um caractere. Cai por dois: "menor" e "maior" diferem
    // em duas letras, não em uma. Fica o registro para ninguém "consertar" o
    // dataset por causa de uma intuição que a medição já derrubou.
    expect(distancia('muitomenor', 'muitomaior', 3)).toBe(2)
    expect(limiteDeErro('muitomenor'.length)).toBe(1)
    expect(responder('muito-maior', 'muito menor')).toBe('errado')
    expect(responder('muito-menor', 'muito maior')).toBe('errado')
    expect(ondePontua('muito menor')).toEqual(['simbolo-muito-menor'])
  })

  it('perdoa o dedo escorregado nos nomes longos, que é o que ela existe para fazer', () => {
    expect(responder('produto-tensorial', 'produto tensroial')).toBe('quase')
    expect(responder('fim-da-demonstracao', 'fim da demosntração')).toBe('quase')
    expect(responder('aproximado', 'aproximadamente igaul')).toBe('quase')
  })

  it('mas não perdoa nome curto, porque ali um caractere já é outro símbolo', () => {
    // `limiteDeErro` só começa a perdoar em sete caracteres: "piso" e "teto"
    // não ganham folga nenhuma, e é assim que tem de ser.
    expect(limiteDeErro('piso'.length)).toBe(0)
    expect(responder('piso', 'pisa')).toBe('errado')
    expect(responder('teto', 'peto')).toBe('errado')
  })
})
