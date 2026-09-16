import { describe, expect, it } from 'vitest'
import { distancia, normalizarTexto } from '@/core/answer'
import {
  IDIOMAS,
  IDIOMAS_DE_PAIS,
  formasAceitas,
  formasDoIdioma,
  idiomasDoPais,
  paisesDoIdioma,
} from './idiomas'
import { PAISES } from './paises'

const SOBERANOS = PAISES.filter((p) => p.soberano)
const TERRITORIOS = PAISES.filter((p) => !p.soberano)

const nomes = (paisId: string) => idiomasDoPais(paisId).map((i) => i.nome)

describe('o conjunto', () => {
  it('todo soberano tem pelo menos um idioma', () => {
    for (const p of SOBERANOS) {
      const lista = IDIOMAS_DE_PAIS[p.id]
      expect(lista, `${p.nome} (${p.id}) está sem idioma`).toBeDefined()
      expect(lista?.length, `${p.nome} tem lista vazia`).toBeGreaterThan(0)
    }
    expect(Object.keys(IDIOMAS_DE_PAIS)).toHaveLength(SOBERANOS.length)
    expect(SOBERANOS).toHaveLength(195)
  })

  /**
   * Mesmo recorte de `moedas.ts`, e a mesma razão para ele estar num teste: o
   * Saara Ocidental e a Somalilândia não têm resposta que dê para assinar, e o
   * resto dos territórios responderia com a língua de quem administra. Mudar isso
   * é legítimo; mudar em silêncio, não.
   */
  it('nenhum território entrou pela porta dos fundos', () => {
    for (const p of TERRITORIOS) {
      expect(IDIOMAS_DE_PAIS[p.id], `${p.nome} (${p.id}) não devia ter idioma`).toBeUndefined()
    }
    expect(TERRITORIOS).toHaveLength(9)
  })

  it('não sobra país sem país', () => {
    const ids = new Set(PAISES.map((p) => p.id))
    for (const id of Object.keys(IDIOMAS_DE_PAIS)) {
      expect(ids.has(id), `${id} tem idioma mas não é um dos 204`).toBe(true)
    }
  })

  it('toda chave usada existe no catálogo, e todo catálogo é usado', () => {
    for (const [id, lista] of Object.entries(IDIOMAS_DE_PAIS)) {
      for (const chave of lista) {
        expect(IDIOMAS[chave], `${id} cita "${chave}", que não está no catálogo`).toBeDefined()
      }
      expect(new Set(lista).size, `${id} repete um idioma na própria lista`).toBe(lista.length)
      // `idiomasDoPais` filtra chave desconhecida em silêncio; se ela existisse,
      // a carta perderia uma forma aceita sem ninguém notar.
      expect(idiomasDoPais(id), id).toHaveLength(lista.length)
    }
    const usados = new Set(Object.values(IDIOMAS_DE_PAIS).flat())
    for (const chave of Object.keys(IDIOMAS)) {
      expect(usados.has(chave), `${chave} está no catálogo e nenhum país o usa`).toBe(true)
    }
  })

  it('nenhuma forma é vazia, repetida dentro da língua, ou nome de duas línguas', () => {
    const canonicas = new Set<string>()
    for (const [chave, i] of Object.entries(IDIOMAS)) {
      const formas = formasDoIdioma(i)
      expect(formas, `${chave}: a canônica ficou de fora`).toContain(i.nome)
      for (const f of formas) expect(f.trim(), chave).not.toBe('')
      expect(new Set(formas).size, `${chave} repete uma forma`).toBe(formas.length)
      expect(canonicas.has(i.nome), `"${i.nome}" é nome canônico de duas línguas`).toBe(false)
      canonicas.add(i.nome)
    }
  })

  /**
   * A união por país tem de ser limpa: "crioulo" é forma aceita de três línguas e
   * um país com duas delas traria a forma duas vezes. `formasAceitas` deduplica —
   * este teste é quem garante que ela continua fazendo isso.
   */
  it('as formas aceitas de cada país vêm sem repetição, e a primeira é a canônica', () => {
    for (const p of SOBERANOS) {
      const idiomas = idiomasDoPais(p.id)
      const formas = formasAceitas(idiomas)
      expect(new Set(formas).size, `${p.nome} repete uma forma aceita`).toBe(formas.length)
      expect(formas[0], p.nome).toBe(idiomas[0]?.nome)
    }
  })
})

/**
 * O teste que justifica o módulo existir. A lista crua de qualquer pacote vem em
 * inglês — "German", "Dutch", "Mandarin Chinese" — e importá-la direto poria o
 * jogo ensinando a língua errada para falar de língua.
 */
describe('português do Brasil', () => {
  const EM_INGLES = ['german', 'dutch', 'french', 'spanish', 'portuguese', 'greek', 'swedish']

  it('nenhuma canônica ficou em inglês', () => {
    const canonicas = new Set(Object.values(IDIOMAS).map((i) => i.nome.toLowerCase()))
    for (const nome of EM_INGLES) {
      expect(canonicas.has(nome), `"${nome}" é o nome em inglês — falta traduzir`).toBe(false)
    }
  })

  it('as âncoras conferidas à mão', () => {
    expect(nomes('br')).toEqual(['português'])
    expect(nomes('ar')).toEqual(['espanhol'])
    expect(nomes('fr')).toEqual(['francês'])
    expect(nomes('de')).toEqual(['alemão'])
    expect(nomes('jp')).toEqual(['japonês'])
    expect(nomes('cn')).toEqual(['mandarim'])
    expect(nomes('ru')).toEqual(['russo'])
    expect(nomes('eg')).toEqual(['árabe'])
    expect(nomes('nl')).toEqual(['neerlandês'])
  })

  it('os que o brasileiro chuta errado', () => {
    // Não é "brasileiro" nem "austríaco": é a mesma língua do vizinho grande.
    expect(nomes('at')).toEqual(['alemão'])
    // Não é espanhol, e o país existe por causa disso.
    expect(nomes('br')).toEqual(['português'])
    // Não é português: é a única ex-colônia espanhola da África.
    expect(nomes('gq')).toEqual(['espanhol', 'francês', 'português'])
    // Não é inglês nem espanhol: é o único neerlandês das Américas.
    expect(nomes('sr')).toEqual(['neerlandês'])
    // Não é o "iraniano" nem o "afegão": persa, e pashto com dari.
    expect(nomes('ir')).toEqual(['persa'])
    // Não é o "austríaco" da Oceania: catalão é do principado nos Pirineus.
    expect(nomes('ad')).toEqual(['catalão'])
  })
})

/**
 * Os casos difíceis do cabeçalho, um teste por decisão.
 *
 * É o gêmeo de "as sedes múltiplas" em `capitais.test.ts`, e existe pelo mesmo
 * motivo: trocar a primeira língua da África do Sul de zulu para inglês é uma
 * decisão defensável, mas tem de ser tomada aqui também, não no susto.
 */
describe('os países de vários idiomas', () => {
  const aceita = (id: string, forma: string) => formasAceitas(idiomasDoPais(id)).includes(forma)

  it('África do Sul: doze desde 2023, abrindo por zulu', () => {
    expect(idiomasDoPais('za')).toHaveLength(12)
    expect(nomes('za')[0]).toBe('zulu')
    for (const f of ['inglês', 'africâner', 'xhosa', 'língua de sinais sul-africana']) {
      expect(aceita('za', f), f).toBe(true)
    }
  })

  it('Suíça: quatro, na ordem da Constituição', () => {
    expect(nomes('ch')).toEqual(['alemão', 'francês', 'italiano', 'romanche'])
  })

  it('Bélgica e Canadá: as duas leituras valem', () => {
    expect(nomes('be')).toEqual(['neerlandês', 'francês', 'alemão'])
    expect(aceita('be', 'flamengo')).toBe(true)
    expect(nomes('ca')).toEqual(['inglês', 'francês'])
  })

  it('Índia: as duas da União, e nenhuma "língua nacional"', () => {
    expect(nomes('in')).toEqual(['hindi', 'inglês'])
  })

  it('Irlanda: irlandês primeiro porque a Constituição diz, inglês vale', () => {
    expect(nomes('ie')).toEqual(['irlandês', 'inglês'])
    expect(aceita('ie', 'gaélico')).toBe(true)
  })

  it('Singapura: quatro, abrindo por inglês e não pelo malaio nacional', () => {
    expect(nomes('sg')).toEqual(['inglês', 'malaio', 'mandarim', 'tâmil'])
  })

  it('Haiti: crioulo primeiro, francês vale', () => {
    expect(nomes('ht')).toEqual(['crioulo haitiano', 'francês'])
    expect(aceita('ht', 'crioulo')).toBe(true)
  })

  it('Israel: só hebraico desde 2018, e é o único caso em que aceitamos menos', () => {
    expect(nomes('il')).toEqual(['hebraico'])
    // A lista É o gabarito: pôr o árabe aqui para ser generoso faria a tela
    // afirmar que Israel tem duas oficiais, o que a lei de 2018 desfez.
    expect(aceita('il', 'árabe')).toBe(false)
    expect(nomes('ps')).toEqual(['árabe'])
  })

  it('Timor-Leste e Vaticano: os dois pares improváveis', () => {
    expect(nomes('tl')).toEqual(['tétum', 'português'])
    expect(nomes('va')).toEqual(['italiano', 'latim'])
  })

  it('Moldávia: a língua virou "romeno" em 2023, e "moldavo" continua valendo', () => {
    expect(nomes('md')).toEqual(['romeno'])
    expect(aceita('md', 'moldavo')).toBe(true)
  })

  it('Mali, Burkina e Níger: francês na frente, as nacionais aceitas', () => {
    expect(nomes('ml')[0]).toBe('francês')
    expect(aceita('ml', 'bambara')).toBe(true)
    expect(aceita('bf', 'moré')).toBe(true)
    expect(aceita('ne', 'hauçá')).toBe(true)
  })

  it('Etiópia e Eritreia: onde nem "oficial" é palavra fácil', () => {
    expect(nomes('et')[0]).toBe('amárico')
    expect(aceita('et', 'oromo')).toBe(true)
    expect(nomes('er')).toEqual(['tigrínia', 'árabe', 'inglês'])
  })

  it('Nova Zelândia, Maurício e Belarus', () => {
    expect(nomes('nz')).toEqual(['inglês', 'maori'])
    expect(nomes('mu')).toEqual(['inglês', 'francês', 'crioulo mauriciano'])
    expect(nomes('by')).toEqual(['bielorrusso', 'russo'])
  })

  it('69 países têm mais de um oficial, e três têm mais de quatro', () => {
    const listas = Object.values(IDIOMAS_DE_PAIS)
    expect(listas.filter((l) => l.length > 1)).toHaveLength(69)
    expect(listas.filter((l) => l.length > 4)).toHaveLength(3) // Etiópia, RDC, África do Sul
  })
})

/**
 * Os blocos grandes, escritos por extenso pelo mesmo motivo do euro em
 * `moedas.test.ts`: são o que o jogo de fato cobra, e uma mudança neles é notícia.
 */
describe('as línguas mais espalhadas', () => {
  it('o português: nove soberanos, e a Guiné Equatorial entre eles', () => {
    expect([...paisesDoIdioma('portugues')].sort()).toEqual([
      'ao', 'br', 'cv', 'gq', 'gw', 'mz', 'pt', 'st', 'tl',
    ])
  })

  it('o inglês é oficial em mais países que qualquer outra', () => {
    const ranking = Object.keys(IDIOMAS)
      .map((c) => [c, paisesDoIdioma(c).length] as const)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
    expect(ranking).toEqual([
      ['ingles', 59],
      ['frances', 30],
      ['arabe', 24],
      ['espanhol', 20],
      ['portugues', 9],
    ])
  })
})

/**
 * A mesma medição de `capitais.test.ts`, e ela achou **um** par: "islandês" e
 * "irlandês" estão a um caractere de distância. É um par de verdade e não um
 * sinônimo disfarçado — são dois países diferentes com respostas diferentes.
 *
 * Não muda a decisão de rodar com a tolerância ligada, pelo mesmo motivo de
 * Kingston e Kingstown nas capitais: quem resolve esse par é a trava de
 * vizinhança do validador, que recebe as formas das outras cartas e recusa a
 * entrada que encosta nas duas. Tirar a tolerância por causa de um par custaria a
 * misericórdia com "crioulo seichelense" e "língua de sinais sul-africana".
 *
 * Se esse número crescer, a conta muda: é este teste que avisa.
 */
describe('ambiguidade entre idiomas', () => {
  it('só islandês e irlandês estão a um caractere de distância', () => {
    const formas = Object.entries(IDIOMAS).flatMap(([chave, i]) =>
      formasDoIdioma(i).map((f) => ({ chave, texto: normalizarTexto(f, true) })),
    )
    const perigosos: string[] = []

    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i] as { chave: string; texto: string }
        const b = formas[j] as { chave: string; texto: string }
        // Duas formas da mesma língua nunca competem.
        if (a.chave === b.chave) continue
        // Texto idêntico entre línguas diferentes ("crioulo") casa exato e
        // pontua: não há o que desempatar.
        if (a.texto === b.texto) continue
        if (a.texto.length < 7 && b.texto.length < 7) continue
        if (distancia(a.texto, b.texto) <= 1) perigosos.push(`${a.texto} / ${b.texto}`)
      }
    }

    expect(perigosos).toEqual(['irlandes / islandes'])
  })
})
