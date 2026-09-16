import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro, normalizarTexto } from '@/core/answer'
import { CRITERIOS } from '@/core/nerdometro'
import { AUSENTES_DE_PROPOSITO, QUADROS } from './pinturas'

describe('dataset', () => {
  it('não tem id repetido', () => {
    const ids = QUADROS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('não tem duas cartas com a mesma obra', () => {
    // Título repetido com pintores diferentes tornaria uma das duas impossível.
    // É o risco real deste assunto: "O Beijo" tem dono em Klimt e em Munch.
    const obras = QUADROS.map((q) => normalizarTexto(q.obra, true))
    expect(new Set(obras).size).toBe(obras.length)
  })

  it('o pintor canônico está entre as formas aceitas', () => {
    for (const q of QUADROS) {
      expect(q.aceitas, q.id).toContain(q.pintor)
    }
  })

  it('todo ano é plausível e bate com a obra', () => {
    for (const q of QUADROS) {
      expect(q.ano, q.id).toBeGreaterThan(1400)
      expect(q.ano, q.id).toBeLessThan(2000)
    }
    // Conferência à mão de algumas datas que este dataset afirma.
    const ano = (id: string) => QUADROS.find((q) => q.id === id)?.ano
    expect(ano('abaporu')).toBe(1928)
    expect(ano('operarios')).toBe(1933)
    expect(ano('guernica')).toBe(1937)
    expect(ano('grito')).toBe(1893)
    expect(ano('as-meninas')).toBe(1656)
    expect(ano('noite-estrelada')).toBe(1889)
  })

  it('o enunciado não entrega o pintor', () => {
    // "A Última Ceia, de Leonardo" seria uma carta que se lê e se responde.
    for (const q of QUADROS) {
      const obra = normalizarTexto(q.obra, true)
      for (const forma of q.aceitas) {
        expect(obra, `${q.id} cita "${forma}"`).not.toContain(normalizarTexto(forma, true))
      }
    }
  })
})

/**
 * A trava que segura a tolerância a erro de digitação.
 *
 * Comparação **pintor contra pintor**, nunca forma contra forma: "Rafael" e
 * "Raphael" ficam a um caractere e são a mesma pessoa, e o mesmo vale para
 * "Velázquez"/"Velazquez" e "Dalí"/"Dali". Uma varredura ingênua acusaria três
 * conflitos que não existem — foi exatamente o erro que as bandeiras tiveram de
 * refazer país contra país.
 */
describe('nenhum pintor encosta em outro', () => {
  const porPintor = new Map<string, string[]>()
  for (const q of QUADROS) {
    const formas = porPintor.get(q.pintor) ?? []
    for (const a of q.aceitas) formas.push(chaveDeTexto(a))
    porPintor.set(q.pintor, [...new Set(formas)])
  }

  it('cada par de pintores fica fora da tolerância um do outro', () => {
    const pintores = [...porPintor.entries()]
    for (let x = 0; x < pintores.length; x++) {
      for (let y = x + 1; y < pintores.length; y++) {
        const [nomeA, formasA] = pintores[x] as [string, string[]]
        const [nomeB, formasB] = pintores[y] as [string, string[]]
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
    const dono = new Map<string, string>()
    for (const [pintor, formas] of porPintor) {
      for (const f of formas) {
        const anterior = dono.get(f)
        expect(anterior === undefined || anterior === pintor, `"${f}": ${anterior} e ${pintor}`).toBe(
          true,
        )
        dono.set(f, pintor)
      }
    }
  })

  /**
   * Manet fica fora, e o teste existe para que a ausência seja uma decisão
   * documentada em vez de um esquecimento que alguém "conserta".
   */
  it('Manet continua fora do baralho — Monet está dentro', () => {
    const pintores = new Set(QUADROS.map((q) => q.pintor))
    expect(pintores.has('Monet')).toBe(true)
    expect(pintores.has('Manet')).toBe(false)
    expect(AUSENTES_DE_PROPOSITO['Manet']).toBeTruthy()

    // E a razão continua verdadeira, não é folclore: os dois ficam mesmo a um
    // caractere de distância.
    expect(distancia('manet', 'monet', 1)).toBe(1)
  })
})

describe('os títulos que confundem', () => {
  it('as cartas ambíguas trazem aviso', () => {
    // O campo `aviso` existe para o jogo ter uma posição sobre a resposta sem
    // deixar de aceitá-la. Aqui ele desfaz as duas confusões de título que este
    // assunto tem de verdade.
    for (const id of ['grito', 'independencia', 'beijo-klimt']) {
      const q = QUADROS.find((x) => x.id === id)
      expect(q?.aviso, `${id} precisa de aviso`).toBeTruthy()
    }
  })

  it('"O Beijo" e "O Grito" vêm desambiguados no próprio título', () => {
    const beijo = QUADROS.find((q) => q.id === 'beijo-klimt')
    // Klimt, Munch e Rodin têm "O Beijo": o título sozinho não identifica nada.
    expect(beijo?.obra).toMatch(/ouro/i)

    const grito = QUADROS.find((q) => q.id === 'grito')
    const ipiranga = QUADROS.find((q) => q.id === 'independencia')
    expect(grito?.pintor).toBe('Munch')
    expect(ipiranga?.obra).toBe('Independência ou Morte')
  })
})

describe('cobertura', () => {
  it('traz as obras que o baralho prometeu', () => {
    const obras = new Set(QUADROS.map((q) => q.obra))
    for (const quadro of ['Guernica', 'A Noite Estrelada', 'O Grito', 'Abaporu', 'Operários', 'As Meninas']) {
      expect(obras.has(quadro), `falta ${quadro}`).toBe(true)
    }
    // Mona Lisa vem com o apelido junto, então casa por prefixo.
    expect(QUADROS.some((q) => q.obra.startsWith('Mona Lisa'))).toBe(true)
  })

  it('os brasileiros pesam de verdade', () => {
    // Não é cota simbólica: Tarsila, Portinari, Di Cavalcanti e Anita Malfatti
    // caem em vestibular tanto quanto Van Gogh.
    const brasileiros = QUADROS.filter((q) => q.brasileiro)
    expect(brasileiros.length / QUADROS.length).toBeGreaterThan(0.35)

    const pintores = new Set(brasileiros.map((q) => q.pintor))
    for (const quem of ['Tarsila do Amaral', 'Portinari', 'Di Cavalcanti', 'Anita Malfatti']) {
      expect(pintores.has(quem), `falta ${quem}`).toBe(true)
    }
  })

  it('a bandeira de brasileiro bate com o pintor, não com o quadro', () => {
    // Guarda contra o erro de digitar `brasileiro: true` na carta errada: a
    // marca é do pintor, então todas as cartas de um pintor concordam.
    const porPintor = new Map<string, Set<boolean>>()
    for (const q of QUADROS) {
      const marcas = porPintor.get(q.pintor) ?? new Set<boolean>()
      marcas.add(q.brasileiro)
      porPintor.set(q.pintor, marcas)
    }
    for (const [pintor, marcas] of porPintor) {
      expect(marcas.size, `${pintor} está marcado dos dois jeitos`).toBe(1)
    }
  })

  it('cobre mais de quatro séculos', () => {
    const anos = QUADROS.map((q) => q.ano)
    expect(Math.min(...anos)).toBeLessThan(1600)
    expect(Math.max(...anos)).toBeGreaterThan(1950)
  })

  it('a meta cabe no baralho e não é frouxa, se já houver critério', () => {
    const criterio = CRITERIOS.find((c) => c.jogoId === 'pinturas')
    if (!criterio) return
    expect(criterio.meta).toBeGreaterThan(QUADROS.length * 0.6)
    expect(criterio.meta).toBeLessThanOrEqual(QUADROS.length)
  })
})
