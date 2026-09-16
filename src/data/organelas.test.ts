import { describe, expect, it } from 'vitest'
import { ESTRUTURAS, IRMAS, ORGANELAS } from './organelas'
import type { Ocorrencia, Organela } from './organelas'

/**
 * O gabarito, escrito à mão.
 *
 * A função e a ocorrência **estão** gravadas no dataset — ao contrário do nox,
 * que o jogo calcula —, e é por isso que elas não podem se autoaprovar: um campo
 * trocado produz uma carta perfeitamente bem-formada que ensina biologia errada
 * em silêncio, e nenhuma checagem estrutural pega "peroxissomo" no lugar de
 * "lisossomo" se a regra for escrita a partir do mesmo campo.
 *
 * A `chave` é o pedaço da função que **só** aquela estrutura pode ter: catalase
 * é peroxissomo, pH ácido é lisossomo, celulose é parede. Ela foi escrita
 * olhando a biologia, não o arquivo — se alguém reescrever a função e a chave
 * sumir, o teste quebra antes de a carta ficar ambígua na tela.
 */
const GABARITO: Readonly<
  Record<Organela, { readonly ocorrencia: Ocorrencia; readonly chave: string }>
> = {
  núcleo: { ocorrencia: 'ambas', chave: 'DNA' },
  nucléolo: { ocorrencia: 'ambas', chave: 'ribossômico' },
  'envoltório nuclear': { ocorrencia: 'ambas', chave: 'poros' },
  'membrana plasmática': { ocorrencia: 'ambas', chave: 'lipídios' },
  'parede celular': { ocorrencia: 'vegetal', chave: 'celulose' },
  mitocôndria: { ocorrencia: 'ambas', chave: 'ATP' },
  cloroplasto: { ocorrencia: 'vegetal', chave: 'glicose' },
  ribossomo: { ocorrencia: 'ambas', chave: 'aminoácidos' },
  'retículo endoplasmático rugoso': { ocorrencia: 'ambas', chave: 'exportado' },
  'retículo endoplasmático liso': { ocorrencia: 'ambas', chave: 'esteroides' },
  'complexo golgiense': { ocorrencia: 'ambas', chave: 'endereça' },
  lisossomo: { ocorrencia: 'ambas', chave: 'pH ácido' },
  peroxissomo: { ocorrencia: 'ambas', chave: 'catalase' },
  'vacúolo central': { ocorrencia: 'vegetal', chave: 'túrgida' },
  centríolo: { ocorrencia: 'animal', chave: 'fuso' },
  citoesqueleto: { ocorrencia: 'ambas', chave: 'microtúbulos' },
  'cílios e flagelos': { ocorrencia: 'ambas', chave: 'batem' },
}

describe('dataset', () => {
  it('bate com o gabarito conferido à mão, estrutura a estrutura', () => {
    for (const e of ESTRUTURAS) {
      const esperado = GABARITO[e.nome]
      expect(esperado, `${e.nome} não está no gabarito do teste`).toBeDefined()
      expect(e.ocorrencia, `${e.nome}`).toBe(esperado.ocorrencia)
      expect(e.funcao, `${e.nome} perdeu "${esperado.chave}" da função`).toContain(esperado.chave)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual([...ORGANELAS].sort())
  })

  it('tem uma entrada por estrutura da lista canônica, sem repetir nome', () => {
    expect(ESTRUTURAS.map((e) => e.nome).sort()).toEqual([...ORGANELAS].sort())
    expect(new Set(ESTRUTURAS.map((e) => e.nome)).size).toBe(ESTRUTURAS.length)
  })

  it('cobre as catorze estruturas que a prova cobra', () => {
    // A lista mínima do escopo do jogo. Um refactor que derrubasse o peroxissomo
    // ou o nucléolo passaria em todos os outros testes daqui.
    const obrigatorias: readonly Organela[] = [
      'núcleo',
      'nucléolo',
      'mitocôndria',
      'cloroplasto',
      'ribossomo',
      'retículo endoplasmático liso',
      'retículo endoplasmático rugoso',
      'complexo golgiense',
      'lisossomo',
      'peroxissomo',
      'vacúolo central',
      'centríolo',
      'citoesqueleto',
      'parede celular',
      'membrana plasmática',
    ]
    for (const o of obrigatorias) {
      expect(ORGANELAS, `${o} sumiu do baralho`).toContain(o)
    }
  })

  it('a função nunca contém o nome da própria estrutura', () => {
    // Seria entregar a resposta na pergunta. Citar uma irmã, ao contrário, é
    // deliberado: o nucléolo é definido por fabricar ribossomos, e é justamente
    // aí que quem estudou pela metade marca "ribossomo".
    for (const e of ESTRUTURAS) {
      expect(e.funcao.toLowerCase(), e.nome).not.toContain(e.nome.toLowerCase())
    }
  })

  it('toda estrutura explica o sinal, e o sinal não é a função repetida', () => {
    for (const e of ESTRUTURAS) {
      expect(e.sinal.length, e.nome).toBeGreaterThan(20)
      expect(e.sinal, e.nome).not.toBe(e.funcao)
    }
  })

  it('só quem é exclusivo explica a exclusividade — e todo exclusivo explica', () => {
    for (const e of ESTRUTURAS) {
      if (e.ocorrencia === 'ambas') {
        expect(e.exclusividade, `${e.nome} não é exclusiva e mesmo assim se explica`).toBeUndefined()
      } else {
        expect(e.exclusividade, `${e.nome} é exclusiva e não diz por quê`).toBeDefined()
        expect((e.exclusividade ?? '').length, e.nome).toBeGreaterThan(20)
      }
    }
  })

  it('tem exclusiva dos dois lados: sem isso a carta de ocorrência é um lado só', () => {
    const vegetais = ESTRUTURAS.filter((e) => e.ocorrencia === 'vegetal')
    const animais = ESTRUTURAS.filter((e) => e.ocorrencia === 'animal')
    expect(vegetais.length, 'nenhuma exclusiva de vegetal').toBeGreaterThanOrEqual(1)
    expect(animais.length, 'nenhuma exclusiva de animal').toBeGreaterThanOrEqual(1)
  })

  it('sobra gente sem ressalva para ser distrator de ocorrência', () => {
    // A carta de ocorrência só pode oferecer, como opção errada, estrutura que
    // existe nos dois tipos de célula **e** sobre a qual não há briga de livro.
    // Se essa lista encolher para menos de três, a carta não fecha quatro opções.
    const neutras = ESTRUTURAS.filter((e) => e.ocorrencia === 'ambas' && !e.ressalva)
    expect(neutras.length).toBeGreaterThanOrEqual(6)
  })

  it('a ressalva existe justamente onde o livro escolar simplifica', () => {
    // Se o lisossomo perder a ressalva, ele volta a ser distrator de "qual só
    // existe na célula animal?" — e aí o jogo passa a punir quem estudou pelo
    // livro que diz que ele é animal. É o caso que inventou o campo.
    const lisossomo = ESTRUTURAS.find((e) => e.nome === 'lisossomo')
    expect(lisossomo?.ressalva, 'lisossomo sem ressalva').toBeDefined()
  })
})

/**
 * O mapa de irmãs é o que faz a carta valer alguma coisa — se ele apodrecer, o
 * jogo continua rodando e passa a oferecer distratores idiotas sem avisar
 * ninguém. Daí a bateria inteira em cima dele.
 */
describe('mapa de estruturas que se confundem', () => {
  it('cobre exatamente as dezessete estruturas', () => {
    expect(Object.keys(IRMAS).sort()).toEqual([...ORGANELAS].sort())
  })

  it('nenhuma é irmã de si mesma, e nada se repete na lista', () => {
    for (const o of ORGANELAS) {
      expect(IRMAS[o], `${o} é irmã de si mesma`).not.toContain(o)
      expect(new Set(IRMAS[o]).size, `${o} repete uma irmã`).toBe(IRMAS[o].length)
    }
  })

  it('é simétrico: se A se confunde com B, B se confunde com A', () => {
    // Assimetria aqui é sempre esquecimento, nunca decisão — e ela faria a carta
    // de B nunca oferecer A, que é justamente o erro que se quer pegar.
    for (const o of ORGANELAS) {
      for (const irma of IRMAS[o]) {
        expect(IRMAS[irma], `${o} lista ${irma}, mas ${irma} não lista ${o}`).toContain(o)
      }
    }
  })

  it('toda estrutura tem três irmãs ou mais', () => {
    // É o que garante que os três distratores de qualquer carta de função saiam
    // só das irmãs, sem nunca cair no sorteio geral. Ver `cartaFuncao`.
    for (const o of ORGANELAS) {
      expect(IRMAS[o].length, `${o} tem ${IRMAS[o].length} irmã(s)`).toBeGreaterThanOrEqual(3)
    }
  })

  it('os pares que a prova cobra de propósito estão todos lá', () => {
    // Se um destes sumir, o jogo perdeu o distrator que justifica a carta
    // existir: são os três pares em que a resposta errada é a que se marca.
    expect(IRMAS['lisossomo']).toContain('peroxissomo')
    expect(IRMAS['retículo endoplasmático liso']).toContain('retículo endoplasmático rugoso')
    expect(IRMAS['complexo golgiense']).toContain('retículo endoplasmático rugoso')
    expect(IRMAS['complexo golgiense']).toContain('retículo endoplasmático liso')
  })

  it('os erros de parte pelo todo estão lá', () => {
    expect(IRMAS['núcleo']).toContain('nucléolo')
    expect(IRMAS['núcleo']).toContain('envoltório nuclear')
    expect(IRMAS['centríolo']).toContain('citoesqueleto')
    expect(IRMAS['ribossomo']).toContain('retículo endoplasmático rugoso')
  })
})
