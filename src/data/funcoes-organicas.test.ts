import { describe, expect, it } from 'vitest'
import { COMPOSTOS, FUNCOES, IRMAS } from './funcoes-organicas'
import type { Funcao } from './funcoes-organicas'

/**
 * O gabarito, escrito à mão.
 *
 * Aqui a função **está** gravada no dataset — ao contrário do nox, que o jogo
 * calcula —, e é exatamente por isso que ela não pode se autoaprovar: um campo
 * `funcao` digitado errado produz uma carta perfeitamente bem-formada que ensina
 * química errada em silêncio, e nenhuma checagem estrutural pega "cetona" no
 * lugar de "aldeído" se as regras de estrutura forem escritas a partir do mesmo
 * campo. Esta tabela veio composto a composto, olhando a fórmula, não o arquivo.
 */
const GABARITO: Readonly<Record<string, Funcao>> = {
  'CH₃-CH₂-CH₃': 'hidrocarboneto',
  'CH₃-CH=CH₂': 'hidrocarboneto',
  'C₆H₆': 'hidrocarboneto',

  'CH₃-CH₂-Cl': 'haleto de alquila',
  'CH₂Cl₂': 'haleto de alquila',
  'CH₃-CH₂-CH₂-Br': 'haleto de alquila',

  'CH₃-CH₂-OH': 'álcool',
  'CH₃-CH(OH)-CH₃': 'álcool',
  'HO-CH₂-CH₂-OH': 'álcool',

  'C₆H₅-OH': 'fenol',
  'CH₃-C₆H₄-OH': 'fenol',
  'HO-C₆H₄-OH': 'fenol',

  'CH₃-O-CH₃': 'éter',
  'CH₃-CH₂-O-CH₂-CH₃': 'éter',
  'CH₃-O-C₆H₅': 'éter',

  'HCHO': 'aldeído',
  'CH₃-CHO': 'aldeído',
  'C₆H₅-CHO': 'aldeído',

  'CH₃-CO-CH₃': 'cetona',
  'CH₃-CO-CH₂-CH₃': 'cetona',
  'C₆H₅-CO-CH₃': 'cetona',

  'HCOOH': 'ácido carboxílico',
  'CH₃-COOH': 'ácido carboxílico',
  'C₆H₅-COOH': 'ácido carboxílico',

  'HCOO-CH₃': 'éster',
  'CH₃-COO-CH₂-CH₃': 'éster',
  'C₆H₅-COO-CH₃': 'éster',

  'CH₃-NH₂': 'amina',
  'CH₃-NH-CH₃': 'amina',
  'C₆H₅-NH₂': 'amina',

  'HCONH₂': 'amida',
  'CH₃-CONH₂': 'amida',
  'CH₃-CO-NH-CH₃': 'amida',

  'CH₃-C≡N': 'nitrila',
  'CH₃-CH₂-C≡N': 'nitrila',
  'C₆H₅-C≡N': 'nitrila',
}

describe('dataset', () => {
  it('bate com o gabarito conferido à mão, composto a composto', () => {
    for (const c of COMPOSTOS) {
      const esperada = GABARITO[c.formula]
      expect(esperada, `${c.formula} não está no gabarito do teste`).toBeDefined()
      expect(c.funcao, `${c.formula} (${c.nome})`).toBe(esperada)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual(COMPOSTOS.map((c) => c.formula).sort())
  })

  it('nenhuma fórmula e nenhum nome repetidos', () => {
    expect(new Set(COMPOSTOS.map((c) => c.formula)).size).toBe(COMPOSTOS.length)
    expect(new Set(COMPOSTOS.map((c) => c.nome)).size).toBe(COMPOSTOS.length)
  })

  it('toda função tem pelo menos três compostos', () => {
    // Menos que isso e a função vira uma carta só, sempre a mesma: quem joga
    // duas vezes decora a fórmula, não a função.
    for (const f of FUNCOES) {
      const quantos = COMPOSTOS.filter((c) => c.funcao === f).length
      expect(quantos, `${f} tem ${quantos} composto(s)`).toBeGreaterThanOrEqual(3)
    }
  })

  it('nenhuma função do tipo fica sem carta', () => {
    const usadas = new Set(COMPOSTOS.map((c) => c.funcao))
    for (const f of FUNCOES) {
      expect(usadas.has(f), `nenhum composto é ${f}`).toBe(true)
    }
    // E o contrário: nada de função fora da lista canônica.
    for (const c of COMPOSTOS) {
      expect(FUNCOES.includes(c.funcao), `${c.formula}: ${c.funcao}`).toBe(true)
    }
  })

  it('todo composto explica o sinal, e o sinal não é a resposta repetida', () => {
    for (const c of COMPOSTOS) {
      expect(c.sinal.length, c.formula).toBeGreaterThan(10)
      // "aldeído — etanal, aldeído" não ensina nada a quem errou.
      expect(c.sinal, c.formula).not.toBe(c.funcao)
    }
  })

  it('índices em Unicode, nunca em ASCII', () => {
    // "CH3-CH2-OH" com o 3 na linha de base destoaria das fórmulas do nox e da
    // geometria molecular, que dividem a mesma tela de química.
    for (const c of COMPOSTOS) {
      expect(c.formula, `${c.formula} tem dígito ASCII`).not.toMatch(/\d/)
      expect(c.grupo, `${c.grupo} tem dígito ASCII`).not.toMatch(/\d/)
    }
  })

  it('a ligação é sempre o hífen ASCII, nunca travessão ou meia-risca', () => {
    // Um "–" infiltrado por copiar e colar de PDF passaria despercebido na tela
    // e quebraria toda regex de estrutura daqui de baixo.
    for (const c of COMPOSTOS) {
      expect(c.formula, `${c.formula} tem traço que não é hífen`).not.toMatch(/[–—−]/)
    }
  })
})

/**
 * As regras de estrutura.
 *
 * Elas não conferem a função a partir do campo `funcao` — conferem a **fórmula**
 * contra o que aquela função obriga. É a segunda trava, independente do gabarito
 * escrito à mão: o gabarito pega o campo trocado, estas pegam a fórmula trocada.
 * Juntas, só passa o composto cuja fórmula e cuja função dizem a mesma coisa.
 */
describe('coerência entre fórmula e função', () => {
  const daFuncao = (f: Funcao) => COMPOSTOS.filter((c) => c.funcao === f)

  it('hidrocarboneto tem só carbono e hidrogênio', () => {
    for (const c of daFuncao('hidrocarboneto')) {
      expect(c.formula, c.formula).toMatch(/^[CH₀-₉=≡()-]+$/)
    }
  })

  it('haleto de alquila tem halogênio e nenhum outro heteroátomo', () => {
    for (const c of daFuncao('haleto de alquila')) {
      expect(c.formula, c.formula).toMatch(/Cl|Br|I(?![a-z])|F/)
      expect(c.formula, `${c.formula} tem oxigênio`).not.toMatch(/O/)
      expect(c.formula, `${c.formula} tem nitrogênio`).not.toMatch(/N/)
    }
  })

  it('álcool tem hidroxila e ela não está no anel — senão seria fenol', () => {
    for (const c of daFuncao('álcool')) {
      expect(c.formula, c.formula).toMatch(/OH/)
      expect(c.formula, `${c.formula} tem OH no anel: é fenol`).not.toMatch(/C₆H[₄₅]-OH/)
      expect(c.formula, `${c.formula} tem oxigênio de éter`).not.toMatch(/-O-/)
      expect(c.formula, `${c.formula} tem carbonila`).not.toMatch(/CO/)
    }
  })

  it('fenol tem a hidroxila colada no anel aromático', () => {
    // É a definição inteira da função, e é a fronteira que o jogo mais cobra.
    for (const c of daFuncao('fenol')) {
      expect(c.formula, c.formula).toMatch(/C₆H[₄₅]-OH/)
    }
  })

  it('éter tem oxigênio entre carbonos e nenhuma hidroxila', () => {
    for (const c of daFuncao('éter')) {
      expect(c.formula, c.formula).toMatch(/-O-/)
      expect(c.formula, `${c.formula} tem hidroxila`).not.toMatch(/OH/)
    }
  })

  it('aldeído tem a carbonila na ponta, e cetona não', () => {
    for (const c of daFuncao('aldeído')) {
      expect(c.formula, c.formula).toMatch(/CHO$/)
      expect(c.formula, `${c.formula} tem carbonila interna: é cetona`).not.toMatch(/-CO-/)
    }
    for (const c of daFuncao('cetona')) {
      expect(c.formula, c.formula).toMatch(/-CO-/)
      expect(c.formula, `${c.formula} termina em CHO: é aldeído`).not.toMatch(/CHO$/)
    }
  })

  it('ácido carboxílico termina em COOH, éster troca esse H por carbono', () => {
    for (const c of daFuncao('ácido carboxílico')) {
      expect(c.formula, c.formula).toMatch(/COOH/)
      expect(c.formula, `${c.formula} é éster`).not.toMatch(/COO-/)
    }
    for (const c of daFuncao('éster')) {
      expect(c.formula, c.formula).toMatch(/COO-/)
      expect(c.formula, `${c.formula} é ácido`).not.toMatch(/COOH/)
    }
  })

  it('amina tem nitrogênio sem carbonila; amida tem nitrogênio na carbonila', () => {
    for (const c of daFuncao('amina')) {
      expect(c.formula, c.formula).toMatch(/N/)
      expect(c.formula, `${c.formula} tem carbonila: é amida`).not.toMatch(/CO/)
      expect(c.formula, `${c.formula} tem tripla: é nitrila`).not.toMatch(/≡/)
    }
    for (const c of daFuncao('amida')) {
      expect(c.formula, c.formula).toMatch(/CONH|CO-NH/)
    }
  })

  it('nitrila tem a tripla com nitrogênio', () => {
    for (const c of daFuncao('nitrila')) {
      expect(c.formula, c.formula).toMatch(/C≡N/)
    }
  })
})

/**
 * O mapa de irmãs é o que faz a carta valer alguma coisa — se ele apodrecer, o
 * jogo continua rodando e passa a oferecer distratores idiotas sem avisar
 * ninguém. Daí a bateria inteira em cima dele.
 */
describe('mapa de funções que se confundem', () => {
  it('cobre exatamente as doze funções', () => {
    expect(Object.keys(IRMAS).sort()).toEqual([...FUNCOES].sort())
  })

  it('nenhuma função é irmã de si mesma, e nada se repete na lista', () => {
    for (const f of FUNCOES) {
      const irmas = IRMAS[f]
      expect(irmas, `${f} é irmã de si mesma`).not.toContain(f)
      expect(new Set(irmas).size, `${f} repete uma irmã`).toBe(irmas.length)
    }
  })

  it('é simétrico: se A se confunde com B, B se confunde com A', () => {
    // Assimetria aqui é sempre esquecimento, nunca decisão — e ela faria a carta
    // de B nunca oferecer A, que é justamente o erro que se quer pegar.
    for (const f of FUNCOES) {
      for (const irma of IRMAS[f]) {
        expect(IRMAS[irma], `${f} lista ${irma}, mas ${irma} não lista ${f}`).toContain(f)
      }
    }
  })

  it('toda função tem três irmãs ou mais', () => {
    // É o que garante que os três distratores de qualquer carta saiam só das
    // irmãs, sem nunca cair no sorteio geral. Ver `cartaFuncao`.
    for (const f of FUNCOES) {
      expect(IRMAS[f].length, `${f} tem ${IRMAS[f].length} irmã(s)`).toBeGreaterThanOrEqual(3)
    }
  })

  it('os pares de isomeria de função estão todos lá', () => {
    // Álcool × éter, aldeído × cetona, ácido × éster: mesma fórmula molecular,
    // função diferente. Se um destes sumir do mapa, o jogo perdeu o melhor
    // distrator que a química oferece de graça.
    expect(IRMAS['álcool']).toContain('éter')
    expect(IRMAS['aldeído']).toContain('cetona')
    expect(IRMAS['ácido carboxílico']).toContain('éster')
  })

  it('as fronteiras de posição estão todas lá', () => {
    // Mesmo átomo, lugar diferente: é o que a carta cobra quando o composto é
    // aromático ou tem nitrogênio.
    expect(IRMAS['fenol']).toContain('álcool')
    expect(IRMAS['amina']).toContain('amida')
    expect(IRMAS['hidrocarboneto']).toContain('haleto de alquila')
  })
})
