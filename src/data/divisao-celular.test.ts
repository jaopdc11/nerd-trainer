import { describe, expect, it } from 'vitest'
import { chaveDeTexto, distancia, limiteDeErro } from '@/core/answer'
import { FASES, TAMANHO_DO_TRECHO_DE_MITOSE, exibirPloidia, faseDe } from './divisao-celular'
import type { Fase } from './divisao-celular'

const indiceDe = (id: string): number => FASES.findIndex((f) => f.id === id)

describe('dataset', () => {
  it('tem as vinte e três fases, sem id nem nome repetido', () => {
    expect(FASES).toHaveLength(23)
    expect(new Set(FASES.map((f) => f.id)).size).toBe(23)
    expect(new Set(FASES.map((f) => f.nome)).size).toBe(23)
  })

  it('a lista é a canônica, na ordem canônica', () => {
    expect(FASES.map((f) => f.id)).toEqual([
      'g1',
      's',
      'g2',
      'profase',
      'metafase',
      'anafase',
      'telofase',
      'citocinese',
      'leptoteno',
      'zigoteno',
      'paquiteno',
      'diploteno',
      'diacinese',
      'metafase-i',
      'anafase-i',
      'telofase-i',
      'citocinese-i',
      'intercinese',
      'profase-ii',
      'metafase-ii',
      'anafase-ii',
      'telofase-ii',
      'citocinese-ii',
    ])
  })

  it('os dois trechos são contíguos e o corte cai depois da citocinese', () => {
    expect(TAMANHO_DO_TRECHO_DE_MITOSE).toBe(8)
    expect(FASES[7]?.id).toBe('citocinese')
    expect(FASES[8]?.id).toBe('leptoteno')
    for (const [i, f] of FASES.entries()) {
      expect(f.trecho, f.id).toBe(i < TAMANHO_DO_TRECHO_DE_MITOSE ? 'mitose' : 'meiose')
    }
  })

  /**
   * A intérfase não é mitose, e o dataset tem de continuar dizendo isso. Se
   * alguém marcar G1 como bloco 'mitose' para "arrumar", o gabarito passa a
   * ensinar que a duplicação do DNA acontece durante a divisão.
   */
  it('cada bloco é um pedaço contíguo, e a intérfase é um bloco à parte', () => {
    expect(FASES.map((f) => f.bloco)).toEqual([
      'intérfase',
      'intérfase',
      'intérfase',
      'mitose',
      'mitose',
      'mitose',
      'mitose',
      'mitose',
      'meiose I',
      'meiose I',
      'meiose I',
      'meiose I',
      'meiose I',
      'meiose I',
      'meiose I',
      'meiose I',
      'meiose I',
      'intercinese',
      'meiose II',
      'meiose II',
      'meiose II',
      'meiose II',
      'meiose II',
    ])
  })

  it('toda fase diz o que acontece nela', () => {
    for (const f of FASES) expect(f.acontece.length, f.id).toBeGreaterThan(20)
  })

  it('a primeira forma aceita é sempre o nome que aparece na fita', () => {
    for (const f of FASES) expect(f.aceitas[0], f.id).toBe(f.nome)
  })

  it('a guarda de id inexistente é barulhenta', () => {
    expect(() => faseDe('profase-iii')).toThrow(/não existe/)
  })
})

/**
 * O núcleo do dataset. Ploidia e quantidade de DNA são dois números diferentes,
 * e o conteúdo inteiro vive de não confundir os dois.
 */
describe('ploidia e DNA', () => {
  it('a mitose conserva a ploidia do começo ao fim', () => {
    for (const f of FASES.filter((x) => x.trecho === 'mitose')) {
      expect(f.ploidia, f.id).toBe(2)
    }
  })

  /**
   * A comparação anda **dentro** de cada trecho, e não pela lista inteira, por
   * um motivo que é do dataset e não do teste: a fronteira entre os trechos é um
   * recomeço. A citocinese da mitose termina em 2C e o leptóteno começa em 4C
   * porque a meiose também é precedida de uma intérfase — a mesma G1/S/G2 já
   * listada, que o dataset não repete. Somar as duas listas como se fossem uma
   * célula só faria a fronteira parecer uma duplicação espontânea.
   */
  it('dentro de cada trecho, a fase S é o único ponto em que o DNA sobe', () => {
    const subidas = FASES.filter((f, i) => {
      const anterior = FASES[i - 1]
      return anterior !== undefined && f.trecho === anterior.trecho && f.dna > anterior.dna
    })
    expect(subidas.map((f) => f.id)).toEqual(['s'])
    expect(faseDe('g1').dna).toBe(2)
    expect(faseDe('s').dna).toBe(4)
    // A fronteira é o recomeço, e é o único salto para cima da lista inteira.
    expect(faseDe('citocinese').dna).toBe(2)
    expect(faseDe('leptoteno').dna).toBe(4)
  })

  /**
   * A afirmação que o jogo existe para ensinar, e a razão de este teste existir:
   * **a ploidia cai na anáfase I, não na II.** Quem decora "a meiose divide por
   * dois" sem saber onde erra as duas pontas — e um dataset com um 1 no lugar
   * errado ensinaria o erro com autoridade de gabarito.
   */
  it('a ploidia cai uma vez só, e é na anáfase I', () => {
    const quedas = FASES.filter((f, i) => i > 0 && f.ploidia < (FASES[i - 1] as Fase).ploidia)
    expect(quedas.map((f) => f.id)).toEqual(['anafase-i'])

    expect(faseDe('metafase-i').ploidia).toBe(2)
    expect(faseDe('anafase-i').ploidia).toBe(1)
    // E não cai de novo: da anáfase I em diante é tudo haploide.
    for (const f of FASES.slice(indiceDe('anafase-i'))) expect(f.ploidia, f.id).toBe(1)
  })

  it('na anáfase II o que cai é o C, e a ploidia fica onde estava', () => {
    expect(faseDe('metafase-ii').ploidia).toBe(1)
    expect(faseDe('metafase-ii').dna).toBe(2)
    expect(faseDe('anafase-ii').ploidia).toBe(1)
    expect(faseDe('anafase-ii').dna).toBe(1)
  })

  it('a ploidia nunca sobe: divisão não junta cromossomo', () => {
    for (const [i, f] of FASES.entries()) {
      if (i === 0) continue
      const anterior = FASES[i - 1] as Fase
      expect(f.ploidia, `${anterior.id} → ${f.id}`).toBeLessThanOrEqual(anterior.ploidia)
    }
  })

  /**
   * A intercinese é o item que carrega o fato inteiro: sem fase S entre as duas
   * divisões, a prófase II começa com o mesmo DNA com que a citocinese I
   * terminou. Um 4 aqui seria o erro mais caro do dataset.
   */
  it('entre as duas divisões não há duplicação', () => {
    expect(faseDe('citocinese-i').dna).toBe(2)
    expect(faseDe('intercinese').dna).toBe(2)
    expect(faseDe('profase-ii').dna).toBe(2)
  })

  it('a conta fecha nas duas pontas: 2n/2C entra, n/1C sai', () => {
    expect(exibirPloidia(faseDe('g1'))).toBe('2n, 2C')
    expect(exibirPloidia(faseDe('citocinese'))).toBe('2n, 2C')
    expect(exibirPloidia(faseDe('anafase-i'))).toBe('n, 2C')
    expect(exibirPloidia(faseDe('citocinese-ii'))).toBe('n, 1C')
  })
})

describe('as formas aceitas', () => {
  /**
   * Nenhuma chave pode ter dois donos, e o caso que motivou o teste é
   * tipográfico: "G₁" e "G₂" escritos com subscrito compactam para "g" — o
   * indicador não é letra nem dígito e `compactar` o descarta —, e as duas
   * fases passariam a aceitar a resposta uma da outra. Numa sequência de morte
   * súbita isso não é frouxidão, é o jogo ensinando errado.
   */
  it('nenhuma forma aceita serve a duas fases', () => {
    const dono = new Map<string, string>()
    for (const f of FASES) {
      for (const forma of f.aceitas) {
        const chave = chaveDeTexto(forma)
        const anterior = dono.get(chave)
        expect(anterior ?? f.id, `"${forma}" (${chave}) tem dois donos`).toBe(f.id)
        dono.set(chave, f.id)
      }
    }
  })

  it('a nomenclatura em -nema vale tanto quanto a em -teno', () => {
    expect(faseDe('leptoteno').aceitas).toContain('Leptonema')
    expect(faseDe('paquiteno').aceitas).toContain('Paquinema')
    expect(faseDe('diploteno').aceitas).toContain('Diplonema')
  })

  it('os algarismos romanos das duas divisões também valem em arábico', () => {
    expect(chaveDeTexto('Anáfase I')).toBe('anafasei')
    expect(chaveDeTexto('Anáfase 1')).toBe('anafase1')
    expect(faseDe('anafase-i').aceitas).toEqual(['Anáfase I', 'Anáfase 1'])
  })

  /**
   * A medição que obriga a tolerância a erro de digitação a ficar **desligada**
   * no jogo, e o motivo de ela ser um teste e não uma nota de rodapé: na
   * sequência não existe trava de vizinhança, e "prófase II" está a um caractere
   * de "prófase I". Com a tolerância ligada, digitar uma valeria pela outra —
   * exatamente a distinção que o jogo existe para cobrar.
   */
  it('há par de fases perto demais para perdoar erro de digitação', () => {
    const um = chaveDeTexto('Prófase I')
    const outro = chaveDeTexto('Prófase II')
    const limite = Math.max(limiteDeErro(um.length), limiteDeErro(outro.length))
    expect(limite).toBeGreaterThan(0)
    expect(distancia(um, outro, limite)).toBeLessThanOrEqual(limite)
  })
})
