import { describe, expect, it } from 'vitest'
import { distancia, normalizarTexto } from '@/core/answer'
import { FILOSOFIA, SOCIOLOGIA } from './pensadores'
import { OBRAS, exibirAno } from './obras'

/**
 * O gabarito, escrito à mão.
 *
 * Um campo `autor` digitado errado produz uma carta perfeitamente bem-formada
 * que ensina literatura errada em silêncio, e nenhuma checagem estrutural pega
 * "Alencar" no lugar de "Machado" — as duas são strings igualmente válidas. Esta
 * tabela veio título a título, e não do arquivo: é a única coisa aqui que
 * confere o conteúdo, e não a forma.
 */
const GABARITO: Readonly<Record<string, string>> = {
  'Marília de Dirceu': 'Tomás Antônio Gonzaga',
  'Memórias de um Sargento de Milícias': 'Manuel Antônio de Almeida',
  'O Guarani': 'José de Alencar',
  Iracema: 'José de Alencar',
  Senhora: 'José de Alencar',
  'O Navio Negreiro': 'Castro Alves',
  'Memórias Póstumas de Brás Cubas': 'Machado de Assis',
  'O Alienista': 'Machado de Assis',
  'O Ateneu': 'Raul Pompeia',
  'O Cortiço': 'Aluísio Azevedo',
  'Quincas Borba': 'Machado de Assis',
  'Dom Casmurro': 'Machado de Assis',

  'Os Sertões': 'Euclides da Cunha',
  'Triste Fim de Policarpo Quaresma': 'Lima Barreto',
  'Paulicéia Desvairada': 'Mário de Andrade',
  'Memórias Sentimentais de João Miramar': 'Oswald de Andrade',
  Macunaíma: 'Mário de Andrade',
  'Alguma Poesia': 'Carlos Drummond de Andrade',
  Libertinagem: 'Manuel Bandeira',
  'São Bernardo': 'Graciliano Ramos',
  'Capitães da Areia': 'Jorge Amado',
  'Vidas Secas': 'Graciliano Ramos',

  'Perto do Coração Selvagem': 'Clarice Lispector',
  Sagarana: 'Guimarães Rosa',
  'Morte e Vida Severina': 'João Cabral de Melo Neto',
  'Grande Sertão: Veredas': 'Guimarães Rosa',
  'A Hora da Estrela': 'Clarice Lispector',

  Odisseia: 'Homero',
  'Édipo Rei': 'Sófocles',
  'A Divina Comédia': 'Dante',
  'Os Lusíadas': 'Camões',
  'Romeu e Julieta': 'Shakespeare',
  Hamlet: 'Shakespeare',
  'Dom Quixote': 'Cervantes',
  Fausto: 'Goethe',

  'Orgulho e Preconceito': 'Jane Austen',
  'Madame Bovary': 'Flaubert',
  'Os Miseráveis': 'Victor Hugo',
  'Crime e Castigo': 'Dostoiévski',
  'Guerra e Paz': 'Tolstói',
  'Anna Kariênina': 'Tolstói',
  'Os Irmãos Karamázov': 'Dostoiévski',

  'Em Busca do Tempo Perdido': 'Proust',
  'A Metamorfose': 'Kafka',
  Ulisses: 'Joyce',
  'Mrs. Dalloway': 'Virginia Woolf',
  'O Processo': 'Kafka',
  Mensagem: 'Fernando Pessoa',
  'O Estrangeiro': 'Camus',
  '1984': 'George Orwell',
  'O Velho e o Mar': 'Hemingway',
  'Cem Anos de Solidão': 'García Márquez',
  'Memorial do Convento': 'Saramago',
}

describe('dataset', () => {
  it('bate com o gabarito conferido à mão, título a título', () => {
    for (const o of OBRAS) {
      const esperado = GABARITO[o.titulo]
      expect(esperado, `"${o.titulo}" não está no gabarito do teste`).toBeDefined()
      expect(o.autor, o.titulo).toBe(esperado)
    }
    expect(OBRAS).toHaveLength(Object.keys(GABARITO).length)
  })

  it('não tem id repetido', () => {
    const ids = OBRAS.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('não tem dois títulos iguais', () => {
    // Título repetido com autores diferentes tornaria uma das duas cartas
    // impossível: a mesma pergunta na tela, duas respostas certas.
    const titulos = OBRAS.map((o) => normalizarTexto(o.titulo, true))
    expect(new Set(titulos).size).toBe(titulos.length)
  })

  it('o autor canônico está entre as formas aceitas', () => {
    for (const o of OBRAS) expect(o.aceitas, o.id).toContain(o.autor)
  })

  it('o mesmo autor é escrito igual em todas as cartas dele', () => {
    // Machado aparece quatro vezes. Se uma carta dissesse "Machado de Assis" e
    // outra "Assis", a segunda viraria um autor novo aos olhos da vizinhança e
    // a trava de ambiguidade passaria a proteger um fantasma.
    const formas = new Map<string, string>()
    for (const o of OBRAS) {
      const anterior = formas.get(o.autor)
      const atual = [...o.aceitas].sort().join('|')
      if (anterior) expect(atual, o.autor).toBe(anterior)
      else formas.set(o.autor, atual)
    }
  })

  /**
   * A trava que importa num baralho digitado.
   *
   * `validar` perdoa um caractere a cada sete. Se dois autores do mesmo deck
   * estiverem a essa distância, digitar um aceitaria o outro e a partida daria
   * ponto por resposta errada. A mesma medida que os pensadores fazem, pelo
   * mesmo motivo.
   */
  it('nenhum par de autores fica a um caractere de distância', () => {
    const autores = [...new Set(OBRAS.flatMap((o) => o.aceitas).map((a) => normalizarTexto(a, true)))]
    for (let x = 0; x < autores.length; x++) {
      for (let y = x + 1; y < autores.length; y++) {
        const a = autores[x] as string
        const b = autores[y] as string
        if (a.length < 7 && b.length < 7) continue
        expect(distancia(a, b), `"${a}" e "${b}" são quase iguais`).toBeGreaterThan(1)
      }
    }
  })

  it('não aceita sobrenome que identifica mais de um autor', () => {
    // "Andrade" é Mário, é Oswald e é Drummond. Aceitá-lo solto daria ponto por
    // uma resposta que não distingue os três — e a carta deixaria de medir nada.
    const proibidos = ['andrade', 'assis', 'ramos', 'azevedo', 'cunha']
    for (const o of OBRAS) {
      for (const forma of o.aceitas) {
        expect(proibidos, `${o.id} aceita "${forma}" sozinho`).not.toContain(
          normalizarTexto(forma, true),
        )
      }
    }
  })

  it('cobre o cânone brasileiro que cai em prova', () => {
    const titulos = new Set(OBRAS.map((o) => o.titulo))
    for (const t of [
      'Dom Casmurro',
      'Memórias Póstumas de Brás Cubas',
      'Grande Sertão: Veredas',
      'Vidas Secas',
      'Macunaíma',
      'Iracema',
      'O Cortiço',
      'Os Sertões',
    ]) {
      expect(titulos.has(t), `falta ${t}`).toBe(true)
    }
  })

  it('não é só literatura brasileira nem só cânone de fora', () => {
    // Prova daqui cobra as duas metades, e um baralho torto ensinaria metade.
    const brasileiras = OBRAS.filter((o) => o.origem === 'brasileira').length
    expect(brasileiras).toBeGreaterThan(OBRAS.length * 0.35)
    expect(brasileiras).toBeLessThan(OBRAS.length * 0.65)
  })

  it('mistura gêneros, não é só romance', () => {
    const generos = new Set(OBRAS.map((o) => o.genero))
    expect(generos).toEqual(new Set(['romance', 'conto', 'poesia', 'teatro', 'ensaio']))
  })

  it('o ano é plausível e a exibição não inventa precisão', () => {
    for (const o of OBRAS) {
      expect(o.ano, o.id).toBeLessThanOrEqual(new Date().getFullYear())
      expect(Number.isInteger(o.ano), o.id).toBe(true)
    }
    expect(exibirAno(1899)).toBe('1899')
    expect(exibirAno(-750)).toBe('séc. VIII a.C.')
    expect(exibirAno(-429)).toBe('séc. V a.C.')
  })
})

/**
 * A fronteira com `pensadores.ts`.
 *
 * Os dois baralhos perguntam autoria e poderiam facilmente virar um só com duas
 * capas. A divisão é de gênero — tratado lá, literatura aqui —, e é uma decisão
 * que só vale enquanto alguém confere. Estes testes conferem.
 */
describe('convivência com o baralho de pensadores', () => {
  const PENSADORES = [...FILOSOFIA, ...SOCIOLOGIA]

  it('nenhum título daqui já é perguntado lá', () => {
    const perguntasDeLa = new Set(PENSADORES.map((i) => normalizarTexto(i.pergunta, true)))
    for (const o of OBRAS) {
      expect(
        perguntasDeLa.has(normalizarTexto(o.titulo, true)),
        `"${o.titulo}" já é carta em pensadores`,
      ).toBe(false)
    }
  })

  it('o único autor que os dois decks compartilham é Camus', () => {
    // E é de propósito: lá ele é o filósofo do absurdo, aqui é o romancista de
    // "O Estrangeiro". A pessoa se repete, a pergunta não. Qualquer outro nome
    // aparecendo nesta lista é sinal de que um tratado entrou por engano — ou de
    // que alguém pôs um romance no baralho errado.
    const deLa = new Set(PENSADORES.map((i) => i.autor))
    const repetidos = [...new Set(OBRAS.map((o) => o.autor))].filter((a) => deLa.has(a))
    expect(repetidos).toEqual(['Camus'])
  })
})
