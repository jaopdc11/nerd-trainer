import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro } from '@/core/answer'
import {
  ERAS,
  INTERVALOS,
  TAMANHO_DOS_TRECHOS,
  exibirIdade,
  exibirIntervalo,
  exibirMa,
  intervaloDe,
} from './eras-geologicas'
import type { Intervalo, Nivel } from './eras-geologicas'

const doNivel = (nivel: Nivel): readonly Intervalo[] => INTERVALOS.filter((i) => i.nivel === nivel)

describe('dataset', () => {
  it('tem os dezoito intervalos, sem id nem nome repetido', () => {
    expect(INTERVALOS).toHaveLength(18)
    expect(new Set(INTERVALOS.map((i) => i.id)).size).toBe(18)
    expect(new Set(INTERVALOS.map((i) => i.nome)).size).toBe(18)
  })

  it('a lista é a canônica, na ordem canônica', () => {
    expect(INTERVALOS.map((i) => i.id)).toEqual([
      'hadeano',
      'arqueano',
      'proterozoico',
      'fanerozoico',
      'cambriano',
      'ordoviciano',
      'siluriano',
      'devoniano',
      'carbonifero',
      'permiano',
      'triassico',
      'jurassico',
      'cretaceo',
      'paleogeno',
      'neogeno',
      'quaternario',
      'pleistoceno',
      'holoceno',
    ])
  })

  it('os três trechos são contíguos e têm o tamanho anunciado', () => {
    expect(TAMANHO_DOS_TRECHOS).toEqual({ 'éon': 4, 'período': 12, 'época': 2 })
    expect(INTERVALOS.map((i) => i.nivel)).toEqual([
      ...Array(4).fill('éon'),
      ...Array(12).fill('período'),
      ...Array(2).fill('época'),
    ])
  })

  it('todo intervalo diz o que o define', () => {
    for (const i of INTERVALOS) expect(i.marco.length, i.id).toBeGreaterThan(20)
  })

  it('a primeira forma aceita é sempre o nome que aparece na fita', () => {
    for (const i of INTERVALOS) expect(i.aceitas[0], i.id).toBe(i.nome)
  })

  it('a guarda de id inexistente é barulhenta', () => {
    expect(() => intervaloDe('ediacarano')).toThrow(/não existe/)
  })
})

/**
 * O bloco de testes que dá sentido ao dataset inteiro, e a razão de ele ser mais
 * exigente que o de `periodos-brasil.ts`: lá havia uma escala só, aqui há três
 * encaixadas. Um dataset em que os períodos não cobrem o Fanerozoico inteiro
 * estaria ensinando que existe um pedaço do éon que não pertence a período
 * nenhum — e a costura é justamente o que a escala tem para ensinar.
 */
describe('continuidade', () => {
  it.each(['éon', 'período', 'época'] as const)(
    'dentro do trecho de %s não há buraco nem sobreposição',
    (nivel) => {
      const trecho = doNivel(nivel)
      for (let i = 0; i < trecho.length - 1; i++) {
        const atual = trecho[i]
        const proximo = trecho[i + 1]
        expect(
          atual?.fim,
          `${atual?.id} termina em ${atual?.fim} e ${proximo?.id} começa em ${proximo?.inicio}`,
        ).toBe(proximo?.inicio)
      }
    },
  )

  /**
   * A regra que costura os trechos: cada um abre exatamente o último item do
   * anterior. Se o Cambriano começasse 541 e o Fanerozoico 538,8, o jogo
   * mostraria duas datas para a mesma fronteira no mesmo gabarito.
   */
  it.each([
    ['fanerozoico', 'período'],
    ['quaternario', 'época'],
  ] as const)('o trecho de %s… cobre o pai de ponta a ponta', (paiId, nivel) => {
    const pai = intervaloDe(paiId)
    const trecho = doNivel(nivel)
    expect(trecho[0]?.inicio, `${trecho[0]?.id} não abre onde ${paiId} abre`).toBe(pai.inicio)
    expect(trecho.at(-1)?.fim, `${trecho.at(-1)?.id} não fecha onde ${paiId} fecha`).toBe(pai.fim)
    for (const i of trecho) expect(i.dentroDe, i.id).toBe(paiId)
  })

  it('todo intervalo anda para a frente no tempo, e só os éons não têm pai', () => {
    for (const i of INTERVALOS) expect(i.inicio, i.id).toBeGreaterThan(i.fim)
    expect(INTERVALOS.filter((i) => i.dentroDe === null).map((i) => i.id)).toEqual([
      'hadeano',
      'arqueano',
      'proterozoico',
      'fanerozoico',
    ])
  })

  /**
   * As eras não são itens da sequência, mas continuam sendo uma partição do
   * Fanerozoico: cada uma é um bloco contíguo de períodos e as três, juntas,
   * cobrem o éon. Um período marcado com a era errada passaria despercebido na
   * leitura e apareceria no gabarito como fato.
   */
  it('as três eras são blocos contíguos que cobrem o Fanerozoico', () => {
    const periodos = doNivel('período')
    expect(periodos.map((p) => p.era)).toEqual([
      'Paleozoico',
      'Paleozoico',
      'Paleozoico',
      'Paleozoico',
      'Paleozoico',
      'Paleozoico',
      'Mesozoico',
      'Mesozoico',
      'Mesozoico',
      'Cenozoico',
      'Cenozoico',
      'Cenozoico',
    ])
    expect(new Set(periodos.map((p) => p.era)).size).toBe(ERAS.length)

    // As fronteiras das eras são as duas extinções que todo mundo conhece.
    expect(intervaloDe('permiano').fim).toBe(251.902)
    expect(intervaloDe('triassico').inicio).toBe(251.902)
    expect(intervaloDe('cretaceo').fim).toBe(66.0)
    expect(intervaloDe('paleogeno').inicio).toBe(66.0)
  })

  it('os éons não carregam era: era é nível de dentro do Fanerozoico', () => {
    for (const i of doNivel('éon')) expect(i.era, i.id).toBeNull()
  })
})

/**
 * Âncoras conferidas à mão contra a tabela da ICS de 2023. Existem para que uma
 * "correção" para os valores das tabelas antigas (541, 145, 4.000) não entre
 * calada — se alguém quiser voltar atrás, que seja mudando um teste e lendo a
 * nota do topo do dataset.
 */
describe('os limites, conferidos à mão', () => {
  it.each([
    ['hadeano', 4567, 4031],
    ['arqueano', 4031, 2500],
    ['proterozoico', 2500, 538.8],
    ['fanerozoico', 538.8, 0],
    ['cambriano', 538.8, 486.85],
    ['ordoviciano', 486.85, 443.8],
    ['siluriano', 443.8, 419.2],
    ['devoniano', 419.2, 358.9],
    ['carbonifero', 358.9, 298.9],
    ['permiano', 298.9, 251.902],
    ['triassico', 251.902, 201.4],
    ['jurassico', 201.4, 143.1],
    ['cretaceo', 143.1, 66.0],
    ['paleogeno', 66.0, 23.03],
    ['neogeno', 23.03, 2.58],
    ['quaternario', 2.58, 0],
    ['pleistoceno', 2.58, 0.0117],
    ['holoceno', 0.0117, 0],
  ] as const)('%s vai de %s a %s Ma', (id, inicio, fim) => {
    expect(intervaloDe(id).inicio).toBe(inicio)
    expect(intervaloDe(id).fim).toBe(fim)
  })
})

describe('as formas aceitas', () => {
  it('nenhuma forma aceita serve a dois intervalos', () => {
    const dono = new Map<string, string>()
    for (const i of INTERVALOS) {
      for (const forma of i.aceitas) {
        const chave = chaveDeTexto(forma)
        const anterior = dono.get(chave)
        expect(anterior ?? i.id, `"${forma}" (${chave}) tem dois donos`).toBe(i.id)
        dono.set(chave, i.id)
      }
    }
  })

  it('as grafias alternativas de sala de aula valem', () => {
    expect(intervaloDe('siluriano').aceitas).toContain('Silúrico')
    expect(intervaloDe('devoniano').aceitas).toContain('Devônico')
    expect(intervaloDe('permiano').aceitas).toContain('Pérmico')
    expect(intervaloDe('cretaceo').aceitas).toContain('Cretácico')
    expect(intervaloDe('arqueano').aceitas).toContain('Arqueozoico')
  })

  /**
   * "Paleógeno" não está no dataset e mesmo assim vale: o acento cai na
   * normalização e as duas grafias viram a mesma chave. Registrar as duas seria
   * ruído se passando por generosidade — e este teste é o que garante que a
   * economia não custou nada ao jogador.
   */
  it('o acento de "Paleógeno" e "Neógeno" não precisa estar no dataset', () => {
    expect(chaveDeTexto('Paleógeno')).toBe(chaveDeTexto('Paleogeno'))
    expect(chaveDeTexto('Neógeno')).toBe(chaveDeTexto('Neogeno'))
  })

  /**
   * A medição que libera a decisão do jogo, e não o contrário.
   *
   * Na sequência não existe trava de vizinhança: a engine compara a resposta com
   * **um** item esperado e mais nada. Se dois nomes estivessem a um erro de
   * digitação de distância, digitar um pontuaria no lugar do outro — foi o que
   * derrubou três sinônimos em `periodos-brasil.ts`. Aqui a lista passa limpa,
   * e por isso a tolerância no jogo fica desligada por argumento (na morte
   * súbita 'quase' mata igual), não por emergência. Se um sinônimo novo
   * encostar em outro intervalo, é aqui que o problema aparece.
   */
  it('nenhuma forma aceita encosta na de outro intervalo', () => {
    const formas = INTERVALOS.flatMap((i) =>
      i.aceitas.map((a) => ({ chave: chaveDeTexto(a), id: i.id })),
    )

    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i]
        const b = formas[j]
        if (!a || !b || a.id === b.id) continue
        const limite = Math.max(limiteDeErro(a.chave.length), limiteDeErro(b.chave.length))
        expect(
          distancia(a.chave, b.chave, limite),
          `"${a.chave}" (${a.id}) e "${b.chave}" (${b.id}) estão perto demais`,
        ).toBeGreaterThan(limite)
      }
    }
  })
})

describe('exibição', () => {
  it('formata milhar com ponto e decimal com vírgula, sem depender de localidade', () => {
    expect(exibirMa(4567)).toBe('4.567')
    expect(exibirMa(538.8)).toBe('538,8')
    expect(exibirMa(251.902)).toBe('251,902')
    expect(exibirMa(66)).toBe('66')
  })

  /**
   * O Holoceno começa em 0,0117 Ma, e escrever isso assim é certo e ilegível.
   * A troca de unidade passa por inteiro para não devolver "11,700000000000001
   * mil anos", que é o que `0,0117 × 1000` dá em ponto flutuante.
   */
  it('troca de unidade abaixo de um milhão de anos, sem sujeira de ponto flutuante', () => {
    expect(exibirIdade(2.58)).toBe('2,58 Ma')
    expect(exibirIdade(0.0117)).toBe('11,7 mil anos')
    expect(exibirIdade(0)).toBe('hoje')
  })

  it('o intervalo sai com a unidade uma vez só, e a ponta aberta diz "até hoje"', () => {
    expect(exibirIntervalo(intervaloDe('cambriano'))).toBe('538,8–486,85 Ma')
    expect(exibirIntervalo(intervaloDe('hadeano'))).toBe('4.567–4.031 Ma')
    expect(exibirIntervalo(intervaloDe('fanerozoico'))).toBe('538,8 Ma até hoje')
    expect(exibirIntervalo(intervaloDe('pleistoceno'))).toBe('2,58 Ma a 11,7 mil anos')
    expect(exibirIntervalo(intervaloDe('holoceno'))).toBe('11,7 mil anos até hoje')
  })
})
