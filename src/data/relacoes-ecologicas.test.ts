import { describe, expect, it } from 'vitest'
import {
  CASOS,
  FICHAS,
  RELACOES,
  descreverCaso,
  distratoresDe,
  escopoDe,
  fichaDe,
  harmoniaDe,
} from './relacoes-ecologicas'
import type { Caso, Relacao } from './relacoes-ecologicas'

/**
 * O gabarito, escrito à mão, caso a caso.
 *
 * É a única parte deste arquivo que não é derivada: classificação de relação
 * ecológica não sai de nenhuma conta, e um `relacao:` trocado no dataset produz
 * uma carta perfeitamente plausível e errada, que ninguém pega jogando. A
 * segunda metade, depois da barra, é o escopo — e ela só existe onde o escopo é
 * decisão do caso, que é justamente o lugar onde `escopoDe()` não tem como
 * conferir nada sozinho.
 *
 * Os disputados carregam a escolha do projeto, não a do livro que o leitor tem
 * na mão: anêmona é protocooperação, rêmora é comensalismo, formiga-e-pulgão é
 * esclavagismo. O cabeçalho do dataset diz por quê; aqui a lista serve para que
 * mudar de ideia sobre um deles exija mudar dois arquivos.
 */
const GABARITO: Readonly<Record<string, string>> = {
  // mutualismo — os dois ganham e nenhum vive sozinho
  'cupim-protozoario': 'Mutualismo',
  liquen: 'Mutualismo',
  micorriza: 'Mutualismo',
  rizobio: 'Mutualismo',
  rumen: 'Mutualismo',
  'figo-vespa': 'Mutualismo',

  // protocooperação — os dois ganham e cada um vive sozinho
  'anemona-peixe-palhaco': 'Protocooperação',
  'eremita-anemona': 'Protocooperação',
  'anu-boi': 'Protocooperação',
  'peixe-limpador': 'Protocooperação',
  'abelha-flor': 'Protocooperação',

  // comensalismo — um come o que sobra, o outro é indiferente
  'remora-tubarao': 'Comensalismo',
  'urubu-onca': 'Comensalismo',
  'entamoeba-coli': 'Comensalismo',
  'cracas-baleia': 'Comensalismo',

  // inquilinismo — abrigo ou suporte, sem alimento e sem prejuízo
  'fierasfer-pepino': 'Inquilinismo',
  'peixe-ourico': 'Inquilinismo',
  'sapo-bromelia': 'Inquilinismo',
  'joao-de-barro': 'Inquilinismo',

  // epifitismo — planta sobre planta, atrás de luz
  'orquidea-arvore': 'Epifitismo',
  'bromelia-galho': 'Epifitismo',
  'samambaia-tronco': 'Epifitismo',

  // parasitismo — vive à custa do corpo do outro
  'carrapato-boi': 'Parasitismo',
  lombriga: 'Parasitismo',
  'pulga-cao': 'Parasitismo',
  'cipo-chumbo': 'Parasitismo',
  'erva-de-passarinho': 'Parasitismo',
  'mosquito-hematofago': 'Parasitismo',
  'chupim-tico-tico': 'Parasitismo',

  // predatismo — mata para comer; o escopo é do caso
  'onca-capivara': 'Predatismo/interespecífica',
  'joaninha-pulgao': 'Predatismo/interespecífica',
  'dioneia-mosca': 'Predatismo/interespecífica',
  'louva-a-deus': 'Predatismo/intraespecífica',

  // competição — os dois disputam e os dois perdem; o escopo é do caso
  'leao-hiena': 'Competição/interespecífica',
  'capim-soja': 'Competição/interespecífica',
  'veados-territorio': 'Competição/intraespecífica',
  'eucalipto-adensado': 'Competição/intraespecífica',

  // amensalismo — um inibe o outro sem ganhar nada
  penicillium: 'Amensalismo',
  'mare-vermelha': 'Amensalismo',
  'nogueira-juglona': 'Amensalismo',

  // herbivoria — come a planta viva
  'gafanhotos-milho': 'Herbivoria',
  'lagarta-repolho': 'Herbivoria',
  'vaca-capim': 'Herbivoria',

  // esclavagismo — apropria-se do trabalho ou do produto alheio
  'formiga-pulgao': 'Esclavagismo',
  'formiga-amazona': 'Esclavagismo',
}

/** 'Predatismo/intraespecífica' onde o caso decide o escopo, 'Mutualismo' onde não. */
function assinatura(caso: Caso): string {
  return fichaDe(caso.relacao).escopos.length > 1
    ? `${caso.relacao}/${escopoDe(caso)}`
    : caso.relacao
}

/**
 * Os radicais que não podem aparecer em enunciado nenhum.
 *
 * São longos de propósito: "proto" pegaria "protozoário", que é palavra do caso
 * do cupim e não vazamento nenhum. O que se procura é a relação escrita por
 * extenso, ou quase — "planta epífita presa ao tronco" responde a própria
 * pergunta.
 */
const RADICAIS = [
  'mutual',
  'protocooper',
  'comensal',
  'inquilin',
  'epifit',
  'epífit',
  'parasit',
  'predat',
  'predaç',
  'predad',
  'competi',
  'amensal',
  'herbivor',
  'herbívor',
  'esclavag',
  'sinfil',
  'escrav',
] as const

const semAcentoMinusculo = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

describe('fichas', () => {
  it('há uma ficha para cada relação, e nenhuma sobrando', () => {
    expect(FICHAS.map((f) => f.nome)).toEqual([...RELACOES])
  })

  it('toda ficha declara ao menos um escopo, e nenhum repetido', () => {
    for (const f of FICHAS) {
      expect(f.escopos.length, f.nome).toBeGreaterThan(0)
      expect(new Set(f.escopos).size, f.nome).toBe(f.escopos.length)
    }
  })

  it('toda relação tem pelo menos três confusões, distintas e nunca ela mesma', () => {
    // Três é o que a carta consome. Menos que isso não é dataset incompleto: é
    // carta de duas alternativas, que pontua igual e não parece defeito.
    for (const f of FICHAS) {
      expect(f.confundeCom.length, f.nome).toBeGreaterThanOrEqual(3)
      expect(new Set(f.confundeCom).size, f.nome).toBe(f.confundeCom.length)
      expect(f.confundeCom, f.nome).not.toContain(f.nome)
      for (const r of f.confundeCom) {
        expect(RELACOES, `${f.nome} → ${r}`).toContain(r)
      }
    }
  })

  /**
   * Os três pares que o jogo existe para desfazer, nos dois sentidos.
   *
   * Mutualismo e protocooperação diferem só por a associação ser obrigatória ou
   * facultativa; comensalismo e inquilinismo, por haver alimento ou só abrigo;
   * inquilinismo e epifitismo, por o inquilino ser planta em planta. Se algum
   * desses pares sumir da lista de confusões, o baralho passa a oferecer
   * alternativas que ninguém marca e o jogo vira questão de eliminação.
   */
  it('os três pares vizinhos se confundem nos dois sentidos', () => {
    const pares: readonly (readonly [Relacao, Relacao])[] = [
      ['Mutualismo', 'Protocooperação'],
      ['Comensalismo', 'Inquilinismo'],
      ['Inquilinismo', 'Epifitismo'],
    ]
    for (const [a, b] of pares) {
      expect(fichaDe(a).confundeCom, `${a} → ${b}`).toContain(b)
      expect(fichaDe(b).confundeCom, `${b} → ${a}`).toContain(a)
    }
  })

  /**
   * As duas de escopo duplo precisam uma da outra: é delas que a carta do eixo é
   * feita — as duas relações, cada uma nos dois escopos.
   */
  it('as relações de escopo duplo se confundem entre si', () => {
    const duplas = FICHAS.filter((f) => f.escopos.length > 1)
    expect(duplas.map((f) => f.nome)).toEqual(['Predatismo', 'Competição'])
    for (const f of duplas) {
      expect(
        f.confundeCom.some((r) => fichaDe(r).escopos.length > 1),
        `${f.nome} não se confunde com nenhuma de escopo duplo`,
      ).toBe(true)
    }
  })

  it('marca em minúscula e sem ponto final: ela entra no meio da frase do gabarito', () => {
    for (const f of FICHAS) {
      expect(f.marca.length, f.nome).toBeGreaterThan(20)
      expect(f.marca[0], f.nome).toBe(f.marca[0]?.toLowerCase())
      expect(f.marca.endsWith('.'), f.nome).toBe(false)
    }
  })
})

describe('casos', () => {
  it('bate com o gabarito conferido à mão, caso a caso', () => {
    for (const caso of CASOS) {
      const esperado = GABARITO[caso.id]
      expect(esperado, `${caso.id} não está no gabarito do teste`).toBeDefined()
      expect(assinatura(caso), caso.id).toBe(esperado)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual(CASOS.map((c) => c.id).sort())
  })

  it('nenhum id repetido', () => {
    expect(new Set(CASOS.map((c) => c.id)).size).toBe(CASOS.length)
  })

  /**
   * O vazamento mais fácil de cometer e o mais difícil de ver na revisão: "o
   * cupim e o protozoário que vive em mutualismo com ele" é uma carta que se
   * responde sem saber biologia nenhuma.
   */
  it('nenhum enunciado contém o nome da relação nem o radical dele', () => {
    for (const caso of CASOS) {
      const texto = semAcentoMinusculo(caso.enunciado)
      for (const radical of RADICAIS) {
        expect(texto.includes(semAcentoMinusculo(radical)), `${caso.id}: "${radical}"`).toBe(false)
      }
    }
  })

  it('todo enunciado é uma cena, não uma definição', () => {
    for (const caso of CASOS) {
      // Definição começa com "relação em que", "quando um" e termina em ponto.
      expect(caso.enunciado.length, caso.id).toBeGreaterThan(25)
      expect(caso.enunciado.endsWith('.'), caso.id).toBe(false)
      expect(caso.enunciado[0], caso.id).toBe(caso.enunciado[0]?.toUpperCase())
    }
  })

  it('toda relação tem pelo menos dois casos', () => {
    // Com um caso só, a relação vira a carta que se decora pelo enunciado.
    for (const r of RELACOES) {
      expect(CASOS.filter((c) => c.relacao === r).length, r).toBeGreaterThanOrEqual(2)
    }
  })

  it('a disputa, quando existe, é texto de verdade e diz qual é a outra leitura', () => {
    const disputados = CASOS.filter((c) => c.disputa !== undefined)
    // Onze dos disputados estão nomeados no cabeçalho do dataset; o número exato
    // pode crescer, mas cair perto de zero significaria que alguém apagou a parte
    // honesta do arquivo.
    expect(disputados.length).toBeGreaterThanOrEqual(8)
    for (const c of disputados) {
      expect((c.disputa as string).length, c.id).toBeGreaterThan(80)
    }
  })

  it('os quatro casos mais disputados carregam a justificativa', () => {
    // Estes são os que a literatura escolar de fato divide. Sair sem texto seria
    // o jogo cobrando uma certeza que não existe.
    for (const id of ['anemona-peixe-palhaco', 'remora-tubarao', 'formiga-pulgao', 'louva-a-deus']) {
      const caso = CASOS.find((c) => c.id === id)
      expect(caso?.disputa, id).toBeDefined()
    }
  })
})

describe('escopoDe', () => {
  it('resolve todo caso do dataset', () => {
    for (const caso of CASOS) {
      expect(['intraespecífica', 'interespecífica'], caso.id).toContain(escopoDe(caso))
    }
  })

  it('exige escopo onde a relação tem dois, e recusa onde tem um', () => {
    expect(() => escopoDe({ id: 'x', enunciado: 'y', relacao: 'Competição' })).toThrow(
      /tem de declarar/,
    )
    expect(() =>
      escopoDe({
        id: 'x',
        enunciado: 'y',
        relacao: 'Mutualismo',
        escopo: 'interespecífica',
      }),
    ).toThrow(/não declare escopo/)
  })

  it('recusa escopo que a relação não admite', () => {
    // Herbivoria intraespecífica seria um animal comendo a própria espécie, que
    // é canibalismo — outra relação, e não esta com outro rótulo.
    expect(() =>
      escopoDe({
        id: 'x',
        enunciado: 'y',
        relacao: 'Herbivoria',
        escopo: 'intraespecífica',
      }),
    ).toThrow(/não existe como/)
  })
})

describe('distratoresDe', () => {
  it('dá pelo menos três, distintos, e nunca a resposta certa', () => {
    for (const caso of CASOS) {
      const errados = distratoresDe(caso)
      expect(errados.length, caso.id).toBeGreaterThanOrEqual(3)
      expect(new Set(errados).size, caso.id).toBe(errados.length)
      expect(errados, caso.id).not.toContain(caso.relacao)
    }
  })

  it('a confusão do caso vem antes da confusão da relação', () => {
    // O cipó-chumbo existe para desfazer o par com o epifitismo: se ele cair
    // fora das três primeiras, o caso mais instrutivo do dataset vira o mais
    // fácil, porque parasitismo contra predatismo qualquer um separa.
    const cipo = CASOS.find((c) => c.id === 'cipo-chumbo') as Caso
    expect(distratoresDe(cipo).slice(0, 3)).toContain('Epifitismo')

    const chupim = CASOS.find((c) => c.id === 'chupim-tico-tico') as Caso
    expect(distratoresDe(chupim).slice(0, 3)).toContain('Esclavagismo')
  })

  it('recusa confusão declarada em caso de relação de escopo duplo', () => {
    // Ali a carta é o cruzamento dos eixos e não sobra alternativa para ela:
    // aceitar o campo em silêncio seria guardar um dado que ninguém lê.
    expect(() =>
      distratoresDe({
        id: 'x',
        enunciado: 'y',
        relacao: 'Predatismo',
        escopo: 'interespecífica',
        confundeCom: ['Herbivoria'],
      }),
    ).toThrow(/não usa confundeCom/)
  })
})

describe('descreverCaso', () => {
  it('traz nome, os dois eixos e a marca', () => {
    const louva = CASOS.find((c) => c.id === 'louva-a-deus') as Caso
    expect(descreverCaso(louva)).toBe(
      'Predatismo — desarmônica e intraespecífica: um mata o outro para comer',
    )
  })

  it('a harmonia sai da ficha, nunca do caso', () => {
    // É definição: parasitismo é desarmônico em todo caso possível. Se um dia
    // dois casos da mesma relação discordarem, o dataset se contradiz.
    for (const caso of CASOS) {
      expect(descreverCaso(caso), caso.id).toContain(harmoniaDe(caso))
      expect(descreverCaso(caso), caso.id).toContain(escopoDe(caso))
    }
  })
})

describe('fichaDe', () => {
  it('quebra em relação não cadastrada: carta sem ficha é carta sem gabarito', () => {
    expect(() => fichaDe('Simbiose' as Relacao)).toThrow(/sem ficha/)
  })
})
