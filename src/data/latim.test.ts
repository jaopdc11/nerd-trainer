import { describe, expect, it } from 'vitest'
import { CONFUNDEM, DOMINIOS, EXPRESSOES } from './latim'

/**
 * O gabarito, escrito à mão — e escrito de um jeito diferente do dataset de
 * propósito.
 *
 * Copiar os 49 significados para cá não conferiria nada: seriam as mesmas frases
 * duas vezes, e um par trocado continuaria trocado nas duas. O que esta tabela
 * guarda é **uma palavra-chave por expressão, do que a expressão significa**,
 * escrita a partir do que cada uma quer dizer e não do arquivo. Trocar `ex nunc`
 * por `ex tunc` — que é o erro mais provável deste dataset inteiro — estoura aqui
 * na hora, porque "retroativo" iria parar na expressão errada.
 *
 * O teste ainda exige que a palavra-chave apareça **só** no significado dela. Uma
 * chave que casasse com duas frases não provaria nada sobre qual é qual.
 */
const CHAVE: Readonly<Record<string, string>> = {
  'habeas corpus': 'preso',
  'data venia': 'licença',
  'in dubio pro reo': 'a favor do réu',
  'ex nunc': 'de agora em diante',
  'ex tunc': 'retroativo',
  'rebus sic stantibus': 'circunstâncias',
  'pacta sunt servanda': 'combinado',
  'ad hoc': 'este caso',
  'ad referendum': 'aprovação posterior',
  'bis in idem': 'duas vezes',
  'erga omnes': 'contra todos',
  'inter partes': 'partes envolvidas',
  'de facto': 'existe na prática',
  'de jure': 'a lei estabelece',
  'dura lex, sed lex': 'cumpre-se',
  'pro bono': 'de graça',

  'a priori': 'antes da experiência',
  'a posteriori': 'depois da experiência',
  'ad hominem': 'quem fala',
  'ad infinitum': 'indefinidamente',
  'reductio ad absurdum': 'absurdo',
  'non sequitur': 'não decorre',
  'petitio principii': 'aquilo que se quer provar',
  'quod erat demonstrandum': 'ponto-final',
  'ceteris paribus': 'constante',
  'a fortiori': 'caso fraco',

  apud: 'citado por',
  'et al.': 'demais autores',
  ibidem: 'mesma obra',
  idem: 'mesmo autor',
  'ipsis litteris': 'mesmas palavras',
  'in vitro': 'laboratório',
  'in vivo': 'no organismo vivo',
  'stricto sensu': 'sentido estrito',
  'lato sensu': 'sentido amplo',

  'sine qua non': 'sem a qual',
  'ipso facto': 'próprio fato',
  'sui generis': 'único no gênero',
  'modus operandi': 'jeito característico',
  'status quo': 'estado em que as coisas estão',
  'per se': 'por si mesmo',
  'carpe diem': 'dia de hoje',
  'alea jacta est': 'voltar atrás',
  'persona non grata': 'indesejada',
  'grosso modo': 'aproximado',
  'mutatis mutandis': 'mudado o que precisa',
  'in loco': 'próprio lugar',
  'ad nauseam': 'enjoar',
  'memento mori': 'morrer',
}

describe('dataset', () => {
  it('cada expressão significa o que o gabarito à mão diz', () => {
    for (const e of EXPRESSOES) {
      const chave = CHAVE[e.expressao]
      expect(chave, `"${e.expressao}" não está no gabarito do teste`).toBeDefined()
      expect(e.significado, e.id).toContain(chave)
    }
    expect(EXPRESSOES).toHaveLength(Object.keys(CHAVE).length)
  })

  it('nenhuma palavra-chave serve para duas expressões', () => {
    // Se "retroativo" casasse com ex nunc e com ex tunc, o teste acima passaria
    // com o par invertido — e o baralho ensinaria o contrário em silêncio.
    for (const e of EXPRESSOES) {
      const chave = CHAVE[e.expressao] as string
      const casam = EXPRESSOES.filter((x) => x.significado.includes(chave))
      expect(casam.map((x) => x.id), `"${chave}" casa com mais de uma`).toEqual([e.id])
    }
  })

  it('não tem id nem expressão repetida', () => {
    expect(new Set(EXPRESSOES.map((e) => e.id)).size).toBe(EXPRESSOES.length)
    expect(new Set(EXPRESSOES.map((e) => e.expressao)).size).toBe(EXPRESSOES.length)
  })

  it('não tem dois significados iguais', () => {
    // Significado repetido tornaria uma das duas cartas impossível: a alternativa
    // certa apareceria duas vezes na tela, e uma delas contaria como erro.
    expect(new Set(EXPRESSOES.map((e) => e.significado)).size).toBe(EXPRESSOES.length)
  })

  it('o significado é uma linha autossuficiente, não um parágrafo', () => {
    // Ele vai virar alternativa de múltipla escolha, inclusive de outras cartas:
    // não pode depender de contexto nem ocupar três linhas do celular.
    for (const e of EXPRESSOES) {
      expect(e.significado.length, `${e.id}: "${e.significado}"`).toBeLessThan(95)
      expect(e.significado, e.id).not.toMatch(/^(quando|se |usado|diz-se|refere)/i)
      expect(e.significado, e.id).not.toMatch(/\.$/)
      expect(e.literal.length, e.id).toBeGreaterThan(2)
    }
  })

  it('o literal nunca é igual ao significado', () => {
    // Se fossem iguais, o gabarito repetiria a mesma frase duas vezes e o campo
    // `literal` deixaria de ensinar de onde a expressão veio.
    for (const e of EXPRESSOES) expect(e.literal, e.id).not.toBe(e.significado)
  })

  it('todo domínio tem pelo menos quatro expressões', () => {
    // É o que garante que os três distratores saiam sempre da primeira ou da
    // segunda camada, sem cair no sorteio geral — a mesma condição que as funções
    // orgânicas impõem às irmãs.
    for (const d of DOMINIOS) {
      const quantas = EXPRESSOES.filter((e) => e.dominio === d).length
      expect(quantas, `domínio ${d}`).toBeGreaterThanOrEqual(4)
    }
    expect(new Set(EXPRESSOES.map((e) => e.dominio))).toEqual(new Set(DOMINIOS))
  })

  it('cobre as que todo mundo encontra pela frente', () => {
    const tem = new Set(EXPRESSOES.map((e) => e.expressao))
    for (const x of [
      'habeas corpus',
      'sine qua non',
      'ex nunc',
      'ad hoc',
      'a priori',
      'ipso facto',
      'data venia',
      'in dubio pro reo',
      'modus operandi',
      'sui generis',
      'rebus sic stantibus',
    ]) {
      expect(tem.has(x), `falta ${x}`).toBe(true)
    }
  })
})

describe('mapa de confusão', () => {
  it('só aponta para expressões que existem, e nunca para si mesma', () => {
    const ids = new Set(EXPRESSOES.map((e) => e.id))
    for (const [id, lista] of Object.entries(CONFUNDEM)) {
      expect(ids.has(id), `${id} não é expressão`).toBe(true)
      for (const alvo of lista) {
        expect(ids.has(alvo), `${id} aponta para ${alvo}, que não existe`).toBe(true)
        expect(alvo, id).not.toBe(id)
      }
      expect(new Set(lista).size, `${id} repete alvo`).toBe(lista.length)
    }
  })

  it('é simétrico', () => {
    // "A se confunde com B" e "B se confunde com A" são a mesma afirmação. Uma
    // assimetria aqui seria esquecimento, nunca decisão.
    for (const [id, lista] of Object.entries(CONFUNDEM)) {
      for (const alvo of lista) {
        expect(CONFUNDEM[alvo] ?? [], `${alvo} não retribui ${id}`).toContain(id)
      }
    }
  })

  it('declara os pares opositivos, que são os distratores que importam', () => {
    // Estes são os que alguém erra de verdade: sabe que existe o par e troca a
    // metade. Se um deles sair daqui, a carta perde a única opção tentadora.
    const pares: readonly (readonly [string, string])[] = [
      ['ex-nunc', 'ex-tunc'],
      ['a-priori', 'a-posteriori'],
      ['de-facto', 'de-jure'],
      ['stricto-sensu', 'lato-sensu'],
      ['erga-omnes', 'inter-partes'],
      ['in-vitro', 'in-vivo'],
      ['pacta-sunt-servanda', 'rebus-sic-stantibus'],
    ]
    for (const [a, b] of pares) {
      expect(CONFUNDEM[a] ?? [], `${a} não declara ${b}`).toContain(b)
      expect(CONFUNDEM[b] ?? [], `${b} não declara ${a}`).toContain(a)
    }
  })

  it('a confusão declarada fica dentro do mesmo domínio', () => {
    // Não é regra de ouro — é um sinal: expressão de citação acadêmica não se
    // confunde com prazo processual, e se um dia isso aparecer, é sinal de que
    // alguém classificou o domínio errado.
    const dominio = new Map(EXPRESSOES.map((e) => [e.id, e.dominio]))
    for (const [id, lista] of Object.entries(CONFUNDEM)) {
      for (const alvo of lista) {
        expect(dominio.get(alvo), `${id} × ${alvo} atravessam domínios`).toBe(dominio.get(id))
      }
    }
  })
})
