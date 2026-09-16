import { describe, expect, it } from 'vitest'
import { distancia, normalizarTexto } from '@/core/answer'
import { CAPITAIS, formasAceitas } from './capitais'
import type { Capital } from './capitais'
import { PAISES } from './paises'

describe('o conjunto', () => {
  it('todo país tem capital — nenhum fica sem resposta possível', () => {
    for (const p of PAISES) {
      expect(CAPITAIS[p.id], `${p.nome} (${p.id}) está sem capital`).toBeDefined()
    }
    expect(Object.keys(CAPITAIS)).toHaveLength(PAISES.length)
  })

  it('não sobra capital sem país', () => {
    const ids = new Set(PAISES.map((p) => p.id))
    for (const id of Object.keys(CAPITAIS)) {
      expect(ids.has(id), `${id} tem capital mas não é um dos 195`).toBe(true)
    }
  })

  it('a canônica está entre as formas aceitas, e nenhuma forma é vazia', () => {
    for (const [id, c] of Object.entries(CAPITAIS)) {
      const aceitas = formasAceitas(c)
      expect(aceitas, `${id}: a canônica ficou de fora`).toContain(c.nome)
      for (const forma of aceitas) expect(forma.trim(), id).not.toBe('')
      expect(new Set(aceitas).size, `${id} repete uma forma`).toBe(aceitas.length)
    }
  })
})

/**
 * O teste que justifica o módulo existir.
 *
 * A lista crua do `world-countries` é em inglês, e importá-la direto poria o
 * jogo ensinando "Warsaw" no lugar de Varsóvia. Estas âncoras são as que mais
 * doeriam se escapassem — e são exatamente as que um "só copiei o dataset"
 * deixaria passar.
 */
describe('português do Brasil', () => {
  const EM_INGLES = [
    'Moscow', 'Beijing', 'London', 'Rome', 'Lisbon', 'Athens',
    'Vienna', 'Copenhagen', 'Warsaw', 'Tokyo', 'Seoul', 'Bern',
  ]

  it('nenhuma canônica ficou em inglês', () => {
    const canonicas = new Set(Object.values(CAPITAIS).map((c) => c.nome))
    for (const nome of EM_INGLES) {
      expect(canonicas.has(nome), `"${nome}" é o nome em inglês — falta traduzir`).toBe(false)
    }
  })

  /**
   * Como sinônimo, algumas formas em inglês são legítimas: é o mesmo princípio
   * do "Holanda" e do "Myanmar" em `paises.ts` — quem digita "Beijing" sabe a
   * resposta, e recusá-la seria pedantismo. O que não pode é isso ser acidente,
   * então a exceção é nominal: qualquer âncora nova aparecendo entre os
   * sinônimos quebra aqui.
   */
  it('em inglês, só as grafias que o brasileiro de fato digita', () => {
    const anchors = new Set(EM_INGLES)
    const achadas = Object.values(CAPITAIS)
      .flatMap((c) => c.sinonimos)
      .filter((s) => anchors.has(s))
      .sort()
    expect(achadas).toEqual(['Beijing', 'Seoul', 'Tokyo'])
  })

  it('as âncoras conferidas à mão', () => {
    const cap = (id: string) => CAPITAIS[id]?.nome
    expect(cap('br')).toBe('Brasília')
    expect(cap('fr')).toBe('Paris')
    expect(cap('jp')).toBe('Tóquio')
    expect(cap('ru')).toBe('Moscou')
    expect(cap('cn')).toBe('Pequim')
    expect(cap('pt')).toBe('Lisboa')
    expect(cap('us')).toBe('Washington')
    expect(cap('au')).toBe('Canberra')
    expect(cap('eg')).toBe('Cairo')
    expect(cap('ar')).toBe('Buenos Aires')
  })

  it('as traduções que o pacote erraria feio', () => {
    const cap = (id: string) => CAPITAIS[id]?.nome
    expect(cap('pl')).toBe('Varsóvia')
    expect(cap('dk')).toBe('Copenhague')
    expect(cap('ch')).toBe('Berna')
    expect(cap('at')).toBe('Viena')
    expect(cap('gr')).toBe('Atenas')
    expect(cap('kr')).toBe('Seul')
    expect(cap('is')).toBe('Reiquiavique')
    expect(cap('mx')).toBe('Cidade do México')
    expect(cap('uy')).toBe('Montevidéu')
    expect(cap('py')).toBe('Assunção')
  })
})

/**
 * Capital é decisão, não fato — e o cabeçalho de `capitais.ts` explica cada
 * escolha. Este teste é o que impede alguém de "corrigir" uma delas em silêncio:
 * mudar a canônica de Pretória para Cidade do Cabo é uma decisão legítima, mas
 * tem que ser tomada aqui também.
 */
describe('as sedes múltiplas', () => {
  const aceita = (id: string, forma: string) => formasAceitas(CAPITAIS[id] as Capital).includes(forma)

  it('África do Sul: Pretória é a canônica, as outras duas valem', () => {
    expect(CAPITAIS['za']?.nome).toBe('Pretória')
    expect(aceita('za', 'Cidade do Cabo')).toBe(true)
    expect(aceita('za', 'Bloemfontein')).toBe(true)
  })

  it('Bolívia: Sucre é a constitucional, La Paz vale', () => {
    expect(CAPITAIS['bo']?.nome).toBe('Sucre')
    expect(aceita('bo', 'La Paz')).toBe(true)
  })

  it('Países Baixos: Amsterdã é a capital, Haia vale', () => {
    expect(CAPITAIS['nl']?.nome).toBe('Amsterdã')
    expect(aceita('nl', 'Haia')).toBe(true)
  })

  it('Israel e Palestina: as duas leituras valem', () => {
    expect(CAPITAIS['il']?.nome).toBe('Jerusalém')
    expect(aceita('il', 'Tel Aviv')).toBe(true)
    expect(CAPITAIS['ps']?.nome).toBe('Ramallah')
    expect(aceita('ps', 'Jerusalém Oriental')).toBe(true)
  })

  it('as outras sedes duplas documentadas continuam aceitas', () => {
    expect(aceita('sz', 'Lobamba')).toBe(true) // Essuatíni, canônica Mbabane
    expect(aceita('ci', 'Abidjã')).toBe(true) // Costa do Marfim, canônica Yamoussoukro
    expect(aceita('bj', 'Cotonu')).toBe(true) // Benin, canônica Porto-Novo
    expect(aceita('tz', 'Dar es Salaam')).toBe(true) // Tanzânia, canônica Dodoma
    expect(aceita('lk', 'Sri Jayawardenepura Kotte')).toBe(true) // Sri Lanka, canônica Colombo
    expect(aceita('my', 'Putrajaia')).toBe(true) // Malásia, canônica Kuala Lumpur
    expect(aceita('bi', 'Bujumbura')).toBe(true) // Burundi, canônica Gitega
    expect(aceita('kz', 'Nur-Sultan')).toBe(true) // Cazaquistão, canônica Astana
    expect(aceita('us', 'Washington, D.C.')).toBe(true)
  })
})

/**
 * A mesma medição de `paises.test.ts`, e aqui ela deu outro resultado: entre as
 * 195 capitais e todos os sinônimos existe **um** par a um caractere de
 * distância — Kingston (Jamaica) e Kingstown (São Vicente e Granadinas).
 *
 * Por isso o jogo roda com a tolerância a typo **ligada**, ao contrário do mapa
 * de países: um par não justifica tirar a misericórdia de "Antananarivo" e
 * "Bandar Seri Begawan". Quem quer o par é a trava de vizinhança do validador,
 * que recebe as formas das outras cartas do baralho e recusa "kingstow" nas
 * duas — ambiguidade não se resolve a favor do jogador.
 *
 * Se esse número crescer, a conta muda: é este teste que avisa.
 */
describe('ambiguidade entre capitais', () => {
  it('só Kingston e Kingstown estão a um caractere de distância', () => {
    const formas = Object.entries(CAPITAIS).flatMap(([id, c]) =>
      formasAceitas(c).map((f) => ({ id, texto: normalizarTexto(f, true) })),
    )
    const perigosos: string[] = []

    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i] as { id: string; texto: string }
        const b = formas[j] as { id: string; texto: string }
        // Duas formas do mesmo país nunca competem: qualquer uma dá o ponto.
        if (a.id === b.id) continue
        if (a.texto.length < 7 && b.texto.length < 7) continue
        if (distancia(a.texto, b.texto) <= 1) perigosos.push(`${a.texto} / ${b.texto}`)
      }
    }

    expect(perigosos).toEqual(['kingston / kingstown'])
  })
})
