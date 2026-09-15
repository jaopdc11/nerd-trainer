import { describe, expect, it } from 'vitest'
import { validar } from './index'
import { arredondarMantissa, interpretarNumero, limparInteiro } from './number'
import { distancia, normalizarTexto } from './normalize'
import type { Contexto, EspecResposta } from './types'

const TREINO: Contexto = { rigor: 'indulgente' }
const RECORDE: Contexto = { rigor: 'estrito' }

describe('normalizarTexto', () => {
  it('ignora acento, caixa e espaço sobrando', () => {
    for (const forma of ['lítio', 'Litio', 'LÍTIO', '  lítio  ', 'LiTiO']) {
      expect(normalizarTexto(forma)).toBe('litio')
    }
  })

  it('preserva o ç decomposto como c', () => {
    expect(normalizarTexto('açúcar')).toBe('acucar')
  })

  it('normaliza ordinais para o algarismo puro', () => {
    expect(normalizarTexto('2ª lei', true)).toBe(normalizarTexto('2 lei', true))
  })

  it('remove artigos só quando pedido', () => {
    expect(normalizarTexto('a segunda lei de Newton', true)).toBe('segunda lei newton')
    expect(normalizarTexto('a segunda lei de Newton', false)).toBe('a segunda lei de newton')
  })
})

describe('distancia', () => {
  it('conta uma troca, uma inserção e uma remoção como 1', () => {
    expect(distancia('cobre', 'cobra')).toBe(1)
    expect(distancia('cobre', 'cobree')).toBe(1)
    expect(distancia('cobre', 'cobe')).toBe(1)
  })

  it('corta cedo quando passa do limite', () => {
    expect(distancia('cobre', 'ferro')).toBeGreaterThan(1)
    expect(distancia('a', 'abcdef')).toBeGreaterThan(1)
  })
})

describe('interpretarNumero', () => {
  const casos: [string, string, number, number][] = [
    // entrada, mantissa, expoente, significativos
    ['299792458', '299792458', 8, 9],
    ['3,14', '314', 0, 3],
    ['3.14', '314', 0, 3],
    ['1.234,56', '123456', 3, 6],
    ['3e8', '3', 8, 1],
    ['3E8', '3', 8, 1],
    ['3,00e8', '300', 8, 3],
    ['2,998×10⁸', '2998', 8, 4],
    ['2,998x10^8', '2998', 8, 4],
    ['6,02·10²³', '602', 23, 3],
    ['10⁸', '1', 8, 1],
    ['0,0821', '821', -2, 3],
    ['1,380649e-23', '1380649', -23, 7],
  ]

  it.each(casos)('lê %s', (entrada, mantissa, expoente, significativos) => {
    const lido = interpretarNumero(entrada)
    expect(lido).not.toBeNull()
    expect(lido?.mantissa).toBe(mantissa)
    expect(lido?.expoente).toBe(expoente)
    expect(lido?.significativos).toBe(significativos)
  })

  it('lê o sinal, inclusive o menos tipográfico', () => {
    expect(interpretarNumero('−1,6e-19')?.negativo).toBe(true)
    expect(interpretarNumero('1,6e-19')?.negativo).toBe(false)
  })

  it('trata zero em qualquer grafia', () => {
    expect(interpretarNumero('0')).toMatchObject({ mantissa: '0', significativos: 1 })
    expect(interpretarNumero('0,000')).toMatchObject({ mantissa: '0' })
  })

  it('recusa o que não é número', () => {
    for (const lixo of ['', 'abc', '3,,14', '3,1,4', '--3']) {
      expect(interpretarNumero(lixo)).toBeNull()
    }
  })
})

describe('arredondarMantissa', () => {
  it('arredonda para cima e sobe a casa quando estoura', () => {
    expect(arredondarMantissa('299792458', 4)).toEqual({ mantissa: '2998', ajusteExpoente: 0 })
    expect(arredondarMantissa('299792458', 1)).toEqual({ mantissa: '3', ajusteExpoente: 0 })
    expect(arredondarMantissa('999', 2)).toEqual({ mantissa: '10', ajusteExpoente: 1 })
  })

  it('completa com zeros quando pedem mais casas do que existem', () => {
    expect(arredondarMantissa('3', 3).mantissa).toBe('300')
  })
})

describe('limparInteiro', () => {
  it('trata todo separador como agrupamento', () => {
    expect(limparInteiro('1.024')).toBe('1024')
    expect(limparInteiro('1,024')).toBe('1024')
    expect(limparInteiro('1 024')).toBe('1024')
    expect(limparInteiro('18.446.744.073.709.551.616')).toBe('18446744073709551616')
  })

  it('recusa entrada não inteira', () => {
    expect(limparInteiro('12a')).toBeNull()
  })
})

describe('validar: texto', () => {
  const litio: EspecResposta = {
    tipo: 'texto',
    canonica: 'Lítio',
    aceitas: ['Lítio'],
  }

  it('aceita a mesma palavra sem acento e em qualquer caixa', () => {
    expect(validar('litio', litio, TREINO).veredito).toBe('certo')
    expect(validar('LÍTIO', litio, TREINO).veredito).toBe('certo')
  })

  it('não tolera typo em palavra curta', () => {
    // "Lítio" tem 5 letras: abaixo do mínimo para misericórdia.
    expect(validar('litia', litio, TREINO).veredito).toBe('errado')
  })

  it('tolera um caractere em palavra longa, como quase', () => {
    const molibdenio: EspecResposta = {
      tipo: 'texto',
      canonica: 'Molibdênio',
      aceitas: ['Molibdênio'],
    }
    const r = validar('molibidenio', molibdenio, TREINO)
    expect(r.veredito).toBe('quase')
    expect(r.motivo).toBe('typo')
  })

  it('não perdoa transposição, que é distância 2 em Levenshtein', () => {
    const molibdenio: EspecResposta = {
      tipo: 'texto',
      canonica: 'Molibdênio',
      aceitas: ['Molibdênio'],
    }
    expect(validar('molibdenoi', molibdenio, TREINO).veredito).toBe('errado')
  })

  it('recusa o typo quando ele também encosta em outro item do baralho', () => {
    const rutherfordio: EspecResposta = {
      tipo: 'texto',
      canonica: 'Rutherfórdio',
      aceitas: ['Rutherfórdio'],
    }
    const comVizinho: Contexto = {
      rigor: 'indulgente',
      // "rutherfordia" está a 1 de "rutherfordio" e a 1 de "rutherfordim"
      vizinhanca: new Set(['rutherfordim']),
    }
    expect(validar('rutherfordia', rutherfordio, comVizinho).veredito).toBe('errado')
  })

  it('aceita sinônimo e marca como tal', () => {
    const newton: EspecResposta = {
      tipo: 'texto',
      canonica: 'Segunda lei de Newton',
      aceitas: ['Segunda lei de Newton', 'Princípio fundamental da dinâmica', '2ª lei de Newton'],
    }
    expect(validar('principio fundamental da dinamica', newton, TREINO).motivo).toBe('sinonimo')
    expect(validar('2a lei de newton', newton, TREINO).veredito).toBe('certo')
  })
})

describe('validar: símbolo', () => {
  const cobalto: EspecResposta = { tipo: 'simbolo', canonica: 'Co' }

  it('exige a caixa exata', () => {
    expect(validar('Co', cobalto, TREINO).veredito).toBe('certo')
  })

  it('distingue Co de CO — cobalto não é monóxido de carbono', () => {
    expect(validar('CO', cobalto, RECORDE).veredito).toBe('errado')
    expect(validar('co', cobalto, RECORDE).veredito).toBe('errado')
  })

  it('perdoa a caixa só em treino, e ainda assim como quase', () => {
    const r = validar('CO', cobalto, TREINO)
    expect(r.veredito).toBe('quase')
    expect(r.motivo).toBe('caixa-errada')
  })

  it('separa quilo de kelvin', () => {
    const quilo: EspecResposta = { tipo: 'simbolo', canonica: 'k' }
    expect(validar('k', quilo, RECORDE).veredito).toBe('certo')
    expect(validar('K', quilo, RECORDE).veredito).toBe('errado')
  })
})

describe('validar: número por algarismos significativos', () => {
  // c = 299 792 458 m/s, exato por definição desde o SI de 2019.
  const c: EspecResposta = { tipo: 'numero', mantissa: '299792458', expoente: 8, sigMin: 3 }

  it('aceita o valor cheio e o truncado, com contagem de dígitos', () => {
    expect(validar('299792458', c, TREINO)).toMatchObject({
      veredito: 'certo',
      digitosCorretos: 9,
    })
    expect(validar('2,998×10⁸', c, TREINO)).toMatchObject({
      veredito: 'certo',
      digitosCorretos: 4,
    })
    expect(validar('3,00e8', c, TREINO)).toMatchObject({ veredito: 'certo', digitosCorretos: 3 })
  })

  it('trata precisão de menos como quase, não como erro', () => {
    const r = validar('3e8', c, TREINO)
    expect(r.veredito).toBe('quase')
    expect(r.motivo).toBe('precisao-insuficiente')
  })

  it('separa erro de ordem de grandeza de erro de dígito', () => {
    expect(validar('2,99×10⁹', c, TREINO).motivo).toBe('expoente-errado')
    expect(validar('2,88×10⁸', c, TREINO).motivo).toBe('diferente')
  })

  it('aceita a vírgula decimal brasileira', () => {
    const g: EspecResposta = { tipo: 'numero', mantissa: '667430', expoente: -11, sigMin: 3 }
    expect(validar('6,6743e-11', g, TREINO).veredito).toBe('certo')
    expect(validar('6.6743e-11', g, TREINO).veredito).toBe('certo')
  })
})

describe('validar: inteiro grande e dígito', () => {
  it('compara 2^64 exato, com ou sem separador', () => {
    const potencia: EspecResposta = { tipo: 'inteiroGrande', valor: '18446744073709551616' }
    expect(validar('18446744073709551616', potencia, RECORDE).veredito).toBe('certo')
    expect(validar('18.446.744.073.709.551.616', potencia, RECORDE).veredito).toBe('certo')
    // O que Number(2**64) produziria — errado nos últimos dígitos.
    expect(validar('18446744073709552000', potencia, RECORDE).veredito).toBe('errado')
  })

  it('não perdoa nada num dígito de pi', () => {
    const digito: EspecResposta = { tipo: 'digito', valor: '5' }
    expect(validar('5', digito, RECORDE).veredito).toBe('certo')
    expect(validar('6', digito, RECORDE).veredito).toBe('errado')
  })
})
