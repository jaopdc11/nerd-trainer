import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro, normalizarTexto } from '@/core/answer'
import { CRITERIOS } from '@/core/nerdometro'
import { FILOSOFIA, SOCIOLOGIA } from './pensadores'
import { ECONOMIA } from './economia'

describe('dataset', () => {
  it('não tem id repetido', () => {
    const ids = ECONOMIA.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('não tem duas cartas com a mesma pergunta', () => {
    // Pergunta repetida com autores diferentes tornaria uma delas impossível.
    const perguntas = ECONOMIA.map((i) => normalizarTexto(i.pergunta, true))
    expect(new Set(perguntas).size).toBe(perguntas.length)
  })

  it('o autor canônico está entre as formas aceitas', () => {
    for (const i of ECONOMIA) {
      expect(i.aceitas, i.id).toContain(i.autor)
    }
  })

  it('só pergunta autoria, nunca interpretação', () => {
    // A mesma trava do baralho de filosofia. Em economia ela pesa ainda mais:
    // quase todo conceito daqui tem uma leitura de direita e uma de esquerda, e
    // uma pergunta aberta daria a impressão de que existe uma só.
    for (const i of ECONOMIA) {
      expect(i.pergunta, i.id).not.toMatch(/^(o que|por que|qual|como|defina|explique)\b/i)
      expect(['conceito', 'obra']).toContain(i.tipo)
    }
  })

  it('mistura conceito e obra', () => {
    expect(ECONOMIA.some((i) => i.tipo === 'conceito')).toBe(true)
    expect(ECONOMIA.filter((i) => i.tipo === 'obra').length).toBeGreaterThan(3)
  })
})

/**
 * A trava que impede a tolerância a erro de digitação de dar o ponto do
 * vizinho.
 *
 * A comparação é **autor contra autor**, e não forma contra forma. A diferença
 * não é acadêmica: "Hayek" e "Friedrich Hayek" ficam a nove caracteres um do
 * outro e "Kahneman" e "Kahneman e Tversky" a dez, mas são a mesma pessoa —
 * comparar todas as formas contra todas acusaria conflitos que não existem.
 * Foi exatamente o erro que as bandeiras cometeram e tiveram de refazer país
 * contra país.
 *
 * O limite usado é o mesmo que a engine usa na trava de ambiguidade: o maior
 * entre o que cada uma das duas formas perdoaria. Na dúvida sobre qual régua
 * vale, vale a que rejeita.
 */
describe('nenhum autor encosta em outro', () => {
  const porAutor = new Map<string, string[]>()
  for (const i of ECONOMIA) {
    const formas = porAutor.get(i.autor) ?? []
    // Só a chave principal: é ela que a engine põe na distância de edição e na
    // vizinhança. Comparar a variante com artigos inventaria pares.
    for (const a of i.aceitas) formas.push(chaveDeTexto(a))
    porAutor.set(i.autor, [...new Set(formas)])
  }

  it('cada par de autores fica fora da tolerância um do outro', () => {
    const autores = [...porAutor.entries()]
    for (let x = 0; x < autores.length; x++) {
      for (let y = x + 1; y < autores.length; y++) {
        const [nomeA, formasA] = autores[x] as [string, string[]]
        const [nomeB, formasB] = autores[y] as [string, string[]]
        for (const a of formasA) {
          for (const b of formasB) {
            const limite = Math.max(limiteDeErro(a.length), limiteDeErro(b.length))
            expect(
              distancia(a, b, limite),
              `"${a}" (${nomeA}) e "${b}" (${nomeB}) estão perto demais`,
            ).toBeGreaterThan(limite)
          }
        }
      }
    }
  })

  it('duas formas diferentes nunca colapsam na mesma chave', () => {
    // Se dois autores normalizassem para a mesma coisa, uma das cartas seria
    // impossível de acertar e a outra daria ponto de graça.
    const dono = new Map<string, string>()
    for (const [autor, formas] of porAutor) {
      for (const f of formas) {
        const anterior = dono.get(f)
        expect(anterior === undefined || anterior === autor, `"${f}": ${anterior} e ${autor}`).toBe(
          true,
        )
        dono.set(f, autor)
      }
    }
  })
})

/**
 * A regra de convivência com `pensadores.ts`.
 *
 * Economia é irmã de filosofia e de sociologia e as três rodam no mesmo
 * Nerdômetro, que soma jogo a jogo. Uma carta repetida em dois baralhos não
 * mede duas coisas: mede a mesma duas vezes e infla a nota de quem decorou uma.
 * Foi por isto que "mais-valia → Marx" saiu desta lista — ela já é carta de
 * sociologia.
 */
describe('convivência com filosofia e sociologia', () => {
  const vizinhos = new Set(
    [...FILOSOFIA, ...SOCIOLOGIA].map((i) => normalizarTexto(i.pergunta, true)),
  )

  it('nenhuma pergunta se repete nos outros dois baralhos de humanas', () => {
    for (const i of ECONOMIA) {
      const chave = normalizarTexto(i.pergunta, true)
      expect(vizinhos.has(chave), `"${i.pergunta}" já existe em pensadores.ts`).toBe(false)
    }
  })

  it('mais-valia continua fora — é carta de sociologia', () => {
    // Guarda nominal, e não só a genérica acima: o pedido original deste jogo
    // trazia mais-valia, e quem reintroduzir merece um teste que diga o porquê.
    const perguntas = ECONOMIA.map((i) => normalizarTexto(i.pergunta, true))
    expect(perguntas).not.toContain(normalizarTexto('mais-valia', true))
    expect(SOCIOLOGIA.some((i) => i.id === 'mais-valia')).toBe(true)
  })

  it('Marx continua no baralho, por outros conceitos', () => {
    // Tirar a carta repetida não podia custar o autor: Marx é economista antes
    // de ser sociólogo.
    expect(ECONOMIA.filter((i) => i.autor === 'Marx').length).toBeGreaterThanOrEqual(3)
  })
})

describe('cobertura', () => {
  it('traz os nomes que o baralho prometeu', () => {
    const autores = new Set(ECONOMIA.map((i) => i.autor))
    for (const quem of [
      'Smith',
      'Marx',
      'Schumpeter',
      'Ricardo',
      'Keynes',
      'Hayek',
      'Friedman',
      'Sen',
      'Piketty',
    ]) {
      expect(autores.has(quem), `falta ${quem}`).toBe(true)
    }
  })

  it('não é um baralho só do Atlântico Norte', () => {
    // Prebisch e Furtado não são enfeite regional: a tese dos termos de troca é
    // o que a periferia produziu de teoria própria, e cai em prova.
    const autores = new Set(ECONOMIA.map((i) => i.autor))
    for (const quem of ['Prebisch', 'Furtado']) {
      expect(autores.has(quem), `falta ${quem}`).toBe(true)
    }
  })

  it('a meta cabe no baralho e não é frouxa, se já houver critério', () => {
    // O critério é acrescentado em `nerdometro.ts`, que este jogo não edita —
    // a integração é de outra mão. Enquanto ela não chega, o teste não tem o
    // que checar; quando chegar, a regra é a mesma de filosofia e sociologia.
    const criterio = CRITERIOS.find((c) => c.jogoId === 'economia')
    if (!criterio) return
    expect(criterio.meta).toBeGreaterThan(ECONOMIA.length * 0.6)
    expect(criterio.meta).toBeLessThanOrEqual(ECONOMIA.length)
  })
})
