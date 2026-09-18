import { describe, expect, it } from 'vitest'
import { distancia, normalizarTexto } from '@/core/answer'
import { MOEDAS, MOEDA_DE_PAIS, formasAceitas, moedaDoPais, paisesDaMoeda } from './moedas'
import type { Moeda } from './moedas'
import { PAISES } from './paises'

const SOBERANOS = PAISES.filter((p) => p.soberano)
const TERRITORIOS = PAISES.filter((p) => !p.soberano)

describe('o conjunto', () => {
  it('todo soberano tem moeda — nenhum fica sem resposta possível', () => {
    for (const p of SOBERANOS) {
      expect(MOEDA_DE_PAIS[p.id], `${p.nome} (${p.id}) está sem moeda`).toBeDefined()
    }
    expect(Object.keys(MOEDA_DE_PAIS)).toHaveLength(SOBERANOS.length)
    expect(SOBERANOS).toHaveLength(195)
  })

  /**
   * A recusa deliberada dos nove territórios, e não um esquecimento. Sete deles
   * usariam o dinheiro de quem administra e dois não têm resposta honesta; o
   * cabeçalho de `moedas.ts` explica. Se alguém achar que a cobertura deve mudar,
   * que mude aqui também — em silêncio, não.
   */
  it('nenhum território entrou pela porta dos fundos', () => {
    for (const p of TERRITORIOS) {
      expect(MOEDA_DE_PAIS[p.id], `${p.nome} (${p.id}) não devia ter moeda`).toBeUndefined()
    }
    expect(TERRITORIOS).toHaveLength(9)
  })

  it('não sobra moeda sem país', () => {
    const ids = new Set(PAISES.map((p) => p.id))
    for (const id of Object.keys(MOEDA_DE_PAIS)) {
      expect(ids.has(id), `${id} tem moeda mas não é um dos 204`).toBe(true)
    }
  })

  it('toda atribuição aponta para uma moeda do catálogo, e todo catálogo é usado', () => {
    for (const [id, chave] of Object.entries(MOEDA_DE_PAIS)) {
      expect(MOEDAS[chave], `${id} aponta para "${chave}", que não está no catálogo`).toBeDefined()
    }
    const usadas = new Set(Object.values(MOEDA_DE_PAIS))
    for (const chave of Object.keys(MOEDAS)) {
      expect(usadas.has(chave), `${chave} está no catálogo e nenhum país a usa`).toBe(true)
    }
  })

  it('a canônica está entre as aceitas, e nenhuma forma é vazia ou repetida', () => {
    for (const [chave, m] of Object.entries(MOEDAS)) {
      const aceitas = formasAceitas(m)
      expect(aceitas, `${chave}: a canônica ficou de fora`).toContain(m.nome)
      for (const forma of aceitas) expect(forma.trim(), chave).not.toBe('')
      expect(new Set(aceitas).size, `${chave} repete uma forma`).toBe(aceitas.length)
    }
  })

  it('os códigos são ISO 4217 bem formados e únicos', () => {
    const vistos = new Set<string>()
    for (const [chave, m] of Object.entries(MOEDAS)) {
      expect(m.codigo, `${chave}: código fora do padrão`).toMatch(/^[A-Z]{3}$/)
      expect(m.codigo.toLowerCase(), `${chave}: chave e código discordam`).toBe(chave)
      expect(vistos.has(m.codigo), `${m.codigo} aparece duas vezes`).toBe(false)
      vistos.add(m.codigo)
    }
  })
})

/**
 * O teste que justifica o módulo existir: o nome tem de estar em português do
 * Brasil, não em inglês nem em português europeu. É o mesmo cuidado de
 * `capitais.test.ts` com "Warsaw" — importar a lista do ISO 4217 direto poria o
 * jogo ensinando "pound sterling" e "Japanese yen".
 */
describe('português do Brasil', () => {
  const EM_INGLES = ['pound', 'yen', 'dollar', 'krona', 'krone', 'shilling', 'ruble', 'zloty']

  it('nenhuma canônica ficou em inglês', () => {
    const canonicas = new Set(Object.values(MOEDAS).map((m) => m.nome.toLowerCase()))
    for (const nome of EM_INGLES) {
      // "zloty" é exceção nominal: é assim que se escreve em português também.
      if (nome === 'zloty') continue
      expect(canonicas.has(nome), `"${nome}" é o nome em inglês — falta traduzir`).toBe(false)
    }
  })

  it('as âncoras conferidas à mão', () => {
    const moeda = (id: string) => moedaDoPais(id)?.nome
    expect(moeda('br')).toBe('real')
    expect(moeda('ar')).toBe('peso argentino')
    expect(moeda('jp')).toBe('iene')
    expect(moeda('gb')).toBe('libra esterlina')
    expect(moeda('us')).toBe('dólar americano')
    expect(moeda('cn')).toBe('yuan')
    expect(moeda('in')).toBe('rupia indiana')
    expect(moeda('ru')).toBe('rublo')
    expect(moeda('ch')).toBe('franco suíço')
    expect(moeda('za')).toBe('rand')
    expect(moeda('pt')).toBe('euro')
    expect(moeda('se')).toBe('coroa sueca')
  })

  it('as que o brasileiro chuta errado', () => {
    const moeda = (id: string) => moedaDoPais(id)?.nome
    // Não usam o euro, e é isso que a carta cobra.
    expect(moeda('pl')).toBe('zloty')
    expect(moeda('cz')).toBe('coroa tcheca')
    expect(moeda('hu')).toBe('forint')
    expect(moeda('dk')).toBe('coroa dinamarquesa')
    expect(moeda('no')).toBe('coroa norueguesa')
    // Não é peso nem real: é o único "boliviano" do mundo.
    expect(moeda('bo')).toBe('boliviano')
    expect(moeda('pe')).toBe('sol')
    expect(moeda('py')).toBe('guarani')
    expect(moeda('cr')).toBe('colón costarriquenho')
  })
})

/**
 * Os blocos compartilhados são o conteúdo do jogo, não ruído — saber quem está na
 * zona do euro e quem não está é a pergunta. Por isso cada bloco está escrito por
 * extenso aqui: acrescentar um país ao euro é uma notícia, e notícia se confere.
 */
describe('as moedas compartilhadas', () => {
  const paises = (chave: string) => [...paisesDaMoeda(chave)].sort()

  it('o euro: 21 da zona do euro, 4 por acordo, 1 unilateral', () => {
    expect(paises('eur')).toEqual([
      // Zona do euro (21) — a Bulgária entrou em 1º de janeiro de 2026.
      'ad', 'at', 'be', 'bg', 'cy', 'de', 'ee', 'es', 'fi', 'fr', 'gr', 'hr',
      'ie', 'it', 'lt', 'lu', 'lv', 'mc', 'me', 'mt', 'nl', 'pt', 'si', 'sk',
      'sm', 'va',
    ])
    // Andorra, Mônaco, San Marino e Vaticano usam por acordo monetário;
    // Montenegro adotou unilateralmente em 2002.
    expect(paisesDaMoeda('eur')).toHaveLength(26)
  })

  it('o franco CFA são dois: oito na BCEAO, seis na BEAC', () => {
    expect(paises('xof')).toEqual(['bf', 'bj', 'ci', 'gw', 'ml', 'ne', 'sn', 'tg'])
    expect(paises('xaf')).toEqual(['cf', 'cg', 'cm', 'ga', 'gq', 'td'])
  })

  it('o dólar americano fora dos Estados Unidos', () => {
    expect(paises('usd')).toEqual(['ec', 'fm', 'mh', 'pw', 'sv', 'tl', 'us', 'zw'])
  })

  it('o dólar do Caribe Oriental: os seis membros caribenhos da OECO', () => {
    expect(paises('xcd')).toEqual(['ag', 'dm', 'gd', 'kn', 'lc', 'vc'])
  })

  it('os blocos pequenos', () => {
    expect(paises('aud')).toEqual(['au', 'ki', 'nr', 'tv'])
    expect(paises('chf')).toEqual(['ch', 'li'])
    expect(paises('ils')).toEqual(['il', 'ps'])
  })

  it('141 moedas para 195 países — a colisão é a regra, não a exceção', () => {
    expect(Object.keys(MOEDAS)).toHaveLength(141)
  })
})

/**
 * A regra da forma curta, decisão 3 do cabeçalho — e ela não tem exceção.
 *
 * O país está escrito na carta, então o qualificador que falta é dedução: quem
 * sabe que o Senegal usa franco sabe qual franco é, porque não existe outro
 * candidato. Isto já valeu só para a moeda própria, com o argumento de que
 * "franco" no Senegal esconde o CFA; o que o argumento produzia era o jogador que
 * sabe a resposta apanhando da digitação em 34 das 195 cartas. Quem cobra o fato
 * é o gabarito, que devolve o nome inteiro e o tamanho do bloco.
 */
describe('a forma curta', () => {
  const FAMILIAS = ['dólar', 'franco', 'peso', 'coroa', 'rupia', 'dinar', 'rial', 'libra', 'xelim', 'lira']
  const aceita = (chave: string, forma: string) =>
    formasAceitas(MOEDAS[chave] as Moeda).includes(forma)

  it('vale nas moedas próprias', () => {
    expect(aceita('cad', 'dólar')).toBe(true)
    expect(aceita('sek', 'coroa')).toBe(true)
    expect(aceita('clp', 'peso')).toBe(true)
    expect(aceita('npr', 'rupia')).toBe(true)
    expect(aceita('kes', 'xelim')).toBe(true)
  })

  it('vale também nas compartilhadas e nas emprestadas — as seis que resistiam', () => {
    const compartilhadas = Object.keys(MOEDAS).filter((c) => paisesDaMoeda(c).length > 1)
    // Euro e shekel não entram na conta: não são nome de família, são a resposta.
    expect(compartilhadas.sort()).toEqual(['aud', 'chf', 'eur', 'ils', 'usd', 'xaf', 'xcd', 'xof'])

    expect(aceita('usd', 'dólar')).toBe(true)
    expect(aceita('xcd', 'dólar')).toBe(true)
    expect(aceita('aud', 'dólar')).toBe(true)
    expect(aceita('xof', 'franco')).toBe(true)
    expect(aceita('xaf', 'franco')).toBe(true)
    expect(aceita('chf', 'franco')).toBe(true)
  })

  /**
   * O invariante, e é ele que impede a regra de voltar a ter exceção sem ninguém
   * decidir nada: canônica que começa com nome de família aceita a família
   * sozinha, sem olhar se a moeda é própria, emprestada ou de bloco.
   */
  it('nenhuma moeda de família fica sem a forma curta', () => {
    for (const [chave, m] of Object.entries(MOEDAS)) {
      const primeira = m.nome.split(' ')[0] as string
      if (!m.nome.includes(' ') || !FAMILIAS.includes(primeira)) continue
      expect(aceita(chave, primeira), `${chave} não aceita "${primeira}" sozinho`).toBe(true)
    }
  })
})

/**
 * Onde o dado é instável, a decisão está registrada — e registrada é aqui, não só
 * no comentário. Mudar qualquer uma destas é legítimo; mudar em silêncio não.
 */
describe('os casos que não são fato limpo', () => {
  const aceita = (id: string, forma: string) =>
    formasAceitas(moedaDoPais(id) as Moeda).includes(forma)

  it('Zimbábue: canônica o dólar americano, ZiG e dólar zimbabuano valem', () => {
    expect(moedaDoPais('zw')?.nome).toBe('dólar americano')
  })

  it('Panamá: balboa é a canônica, o dólar vale', () => {
    expect(moedaDoPais('pa')?.nome).toBe('balboa')
    expect(aceita('pa', 'dólar americano')).toBe(true)
  })

  it('Palestina: o shekel israelense, que é o que circula', () => {
    expect(moedaDoPais('ps')?.nome).toBe('novo shekel israelense')
  })

  it('Lesoto, Essuatíni e Namíbia: moeda própria canônica, rand aceito', () => {
    expect(moedaDoPais('ls')?.nome).toBe('loti')
    expect(moedaDoPais('sz')?.nome).toBe('lilangeni')
    expect(moedaDoPais('na')?.nome).toBe('dólar namibiano')
    for (const id of ['ls', 'sz', 'na']) expect(aceita(id, 'rand'), id).toBe(true)
  })

  it('Butão: ngultrum, com a rupia indiana aceita', () => {
    expect(moedaDoPais('bt')?.nome).toBe('ngultrum')
    expect(aceita('bt', 'rupia indiana')).toBe(true)
  })

  it('as duas kwachas são moedas diferentes, e "kwacha" vale nas duas', () => {
    expect(moedaDoPais('zm')?.nome).toBe('kwacha zambiano')
    expect(moedaDoPais('mw')?.nome).toBe('kwacha malawiano')
    expect(aceita('zm', 'kwacha')).toBe(true)
    expect(aceita('mw', 'kwacha')).toBe(true)
  })
})

/**
 * A mesma medição de `capitais.test.ts`, com uma diferença que vem do desenho:
 * aqui muitas cartas compartilham a resposta *literal* ("dólar" é forma aceita de
 * dezenove moedas, "franco" de nove), e isso não é ambiguidade nenhuma — o validador casa a forma
 * exata antes de chegar na tolerância a typo, então texto idêntico sempre pontua.
 * O que interessa medir é o par *parecido mas diferente*, que é o que a tolerância
 * poderia confundir.
 *
 * Deu zero. Por isso o jogo roda com a tolerância ligada: ela é pura misericórdia
 * com "dólar de Trinidad e Tobago" e "franco CFA da África Ocidental", sem risco
 * de aceitar a resposta da carta vizinha.
 */
describe('ambiguidade entre moedas', () => {
  it('nenhum par de moedas distintas está a um caractere de distância', () => {
    const formas = Object.entries(MOEDAS).flatMap(([chave, m]) =>
      formasAceitas(m).map((f) => ({ chave, texto: normalizarTexto(f, true) })),
    )
    const perigosos: string[] = []

    for (let i = 0; i < formas.length; i++) {
      for (let j = i + 1; j < formas.length; j++) {
        const a = formas[i] as { chave: string; texto: string }
        const b = formas[j] as { chave: string; texto: string }
        // Duas formas da mesma moeda nunca competem.
        if (a.chave === b.chave) continue
        // Texto idêntico casa exato e pontua: "dólar" vale em toda carta que o
        // aceita, não há o que desempatar.
        if (a.texto === b.texto) continue
        if (a.texto.length < 7 && b.texto.length < 7) continue
        if (distancia(a.texto, b.texto) <= 1) perigosos.push(`${a.texto} / ${b.texto}`)
      }
    }

    expect(perigosos).toEqual([])
  })
})
