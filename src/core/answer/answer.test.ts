import { describe, expect, it } from 'vitest'
import { completaSemAmbiguidade, formasDeAutoCommit, validar } from './index'
import { arredondarMantissa, interpretarNumero, limparInteiro } from './number'
import { chaveDeTexto, chavesDeTexto, distancia, limiteDeErro, normalizarTexto } from './normalize'
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

describe('chaves de comparação', () => {
  it('cola tudo: espaço não faz parte da resposta', () => {
    expect(chaveDeTexto('República Centro-Africana')).toBe('republicacentroafricana')
    expect(chaveDeTexto('  REPÚBLICA   centro africana ')).toBe('republicacentroafricana')
    expect(chaveDeTexto('Timor-Leste')).toBe(chaveDeTexto('Timor Leste'))
    expect(chaveDeTexto('Papua-Nova Guiné')).toBe('papuanovaguine')
  })

  it('guarda também a variante com artigo, para quem digita tudo junto', () => {
    // Em "republicademocraticadocongo" não há fronteira de palavra para o
    // `semArtigos` achar o "do" — então a forma aceita tem que existir dos dois
    // jeitos, ou o jogador é punido por não apertar a barra de espaço.
    const chaves = chavesDeTexto('República Democrática do Congo')
    expect(chaves).toContain('republicademocraticacongo')
    expect(chaves).toContain('republicademocraticadocongo')
  })

  it('não inventa uma chave a mais quando não há artigo a tirar', () => {
    expect(chavesDeTexto('Brasil')).toEqual(['brasil'])
  })
})

describe('limiteDeErro', () => {
  it('escala um erro a cada sete caracteres, com teto em três', () => {
    expect(limiteDeErro(0)).toBe(0)
    expect(limiteDeErro(6)).toBe(0)
    expect(limiteDeErro(7)).toBe(1)
    expect(limiteDeErro(13)).toBe(1)
    expect(limiteDeErro(14)).toBe(2)
    expect(limiteDeErro(21)).toBe(3)
    // "republicacentroafricana" tem 23: três erros, e nem um a mais.
    expect(limiteDeErro(23)).toBe(3)
    expect(limiteDeErro(60)).toBe(3)
  })
})

describe('distancia', () => {
  it('conta uma troca, uma inserção e uma remoção como 1', () => {
    expect(distancia('cobre', 'cobra')).toBe(1)
    expect(distancia('cobre', 'cobree')).toBe(1)
    expect(distancia('cobre', 'cobe')).toBe(1)
  })

  it('conta a transposição de adjacentes como 1, não como 2', () => {
    expect(distancia('molibdenoi', 'molibdenio')).toBe(1)
    expect(distancia('brasli', 'brasil')).toBe(1)
    // Em Levenshtein puro cada uma destas custaria 2.
    expect(distancia('nigeria', 'nigeira')).toBe(1)
  })

  it('duas transposições custam 2 — "rebpulica" não é um dedo só', () => {
    // "pub" → "bpu" é rotação, não troca simples: dois pares fora de ordem.
    expect(distancia('rebpulica', 'republica', 3)).toBe(2)
  })

  it('não confunde transposição com troca a distância', () => {
    // 'ab' → 'ba' é 1; 'axb' → 'bxa' não é adjacente e custa 2.
    expect(distancia('axb', 'bxa', 3)).toBe(2)
  })

  it('corta cedo quando passa do limite', () => {
    expect(distancia('cobre', 'ferro')).toBeGreaterThan(1)
    expect(distancia('a', 'abcdef')).toBeGreaterThan(1)
    // O corte não muda a resposta quando ela cabe no limite.
    expect(distancia('austria', 'australia', 3)).toBe(2)
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

  it('perdoa transposição: trocar dois dedos de ordem é um erro só', () => {
    const molibdenio: EspecResposta = {
      tipo: 'texto',
      canonica: 'Molibdênio',
      aceitas: ['Molibdênio'],
    }
    const r = validar('molibdenoi', molibdenio, TREINO)
    expect(r.veredito).toBe('quase')
    expect(r.motivo).toBe('typo')
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

  const centroAfricana: EspecResposta = {
    tipo: 'texto',
    canonica: 'República Centro-Africana',
    aceitas: ['República Centro-Africana'],
  }

  it('aceita o nome colado, sem espaço e sem acento, como acerto cheio', () => {
    for (const forma of [
      'republicacentroafricana',
      'República Centro-Africana',
      'republica centroafricana',
      'REPUBLICACENTROAFRICANA',
    ]) {
      expect(validar(forma, centroAfricana, RECORDE), forma).toMatchObject({
        veredito: 'certo',
        motivo: 'exato',
      })
    }
  })

  it('perdoa o caso que o jogador reclamou: "rebpulicacentroafricana"', () => {
    const r = validar('rebpulicacentroafricana', centroAfricana, RECORDE)
    expect(r.veredito).toBe('quase')
    expect(r.motivo).toBe('typo')
  })

  it('escala a tolerância pelo tamanho, em vez de perdoar sempre um só', () => {
    // 23 caracteres: dois dedos errados ainda é erro de digitação.
    expect(validar('republicacentruafrikana', centroAfricana, TREINO).veredito).toBe('quase')
    // Nome curto continua sem misericórdia nenhuma.
    const cuba: EspecResposta = { tipo: 'texto', canonica: 'Cuba', aceitas: ['Cuba'] }
    expect(validar('cubo', cuba, TREINO).veredito).toBe('errado')
  })

  it('casa o artigo que ficou preso no meio da palavra colada', () => {
    const rdc: EspecResposta = {
      tipo: 'texto',
      canonica: 'República Democrática do Congo',
      aceitas: ['República Democrática do Congo', 'RDC', 'Congo'],
    }
    for (const forma of ['republicademocraticadocongo', 'republicademocraticacongo', 'congo']) {
      expect(validar(forma, rdc, RECORDE).veredito, forma).toBe('certo')
    }
  })

  it('a trava de vizinhança continua barrando o país errado', () => {
    const australia: EspecResposta = {
      tipo: 'texto',
      canonica: 'Austrália',
      aceitas: ['Austrália'],
    }
    // A vizinhança chega crua, do jeito que as engines montam.
    const comAustria: Contexto = { rigor: 'estrito', vizinhanca: new Set(['Áustria']) }

    // "australya" está a 1 da Austrália e longe demais da Áustria: passa.
    expect(validar('australya', australia, comAustria).veredito).toBe('quase')
    // "austria" É a Áustria: nem de longe vira ponto de Austrália.
    expect(validar('austria', australia, comAustria).veredito).toBe('errado')
    // E "austrlia" está a 1 das duas: ninguém leva.
    expect(validar('austrlia', australia, comAustria).veredito).toBe('errado')
  })

  it('barra o par real Irlanda / Islândia', () => {
    const irlanda: EspecResposta = { tipo: 'texto', canonica: 'Irlanda', aceitas: ['Irlanda'] }
    const comIslandia: Contexto = { rigor: 'estrito', vizinhanca: new Set(['Islândia']) }
    // "irlandia" está a um caractere das duas — é justamente o que não pode valer.
    expect(validar('irlandia', irlanda, comIslandia).veredito).toBe('errado')
    // Sem o vizinho em jogo, o mesmo texto é só um dedo escorregado.
    expect(validar('irlandia', irlanda, TREINO).veredito).toBe('quase')
  })

  it('a trava usa o limite do vizinho quando ele é o maior dos dois', () => {
    // Nomes inventados, para isolar a regra: a resposta tem 13 caracteres
    // (limite 1) e o vizinho tem 14 (limite 2). O texto está a 1 da resposta e
    // a 2 do vizinho — se a trava usasse só o limite da resposta, passaria.
    const curta: EspecResposta = {
      tipo: 'texto',
      canonica: 'Abacaxilândia',
      aceitas: ['Abacaxilândia'],
    }
    const ctx: Contexto = { rigor: 'estrito', vizinhanca: new Set(['Abacaxilandias']) }
    expect(validar('abacaxilandio', curta, TREINO).veredito).toBe('quase')
    expect(validar('abacaxilandio', curta, ctx).veredito).toBe('errado')
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

/**
 * O caso do Sudão, relatado assim: "eu precisei digitar sudão do sul pra depois
 * ir sudão, sendo que sudão já pegava sudão".
 *
 * Não é a validação: com Enter, "sudao" sempre valeu Sudão. É o auto-commit, que
 * segura o texto enquanto alguma outra forma ainda em jogo continua a partir
 * dele — e "Sudão do Sul" continua a partir de "Sudão". A regra fica: ela existe
 * por um bug real (no modo símbolo, "N" nunca deixaria digitar "Na") e trocar
 * "espera o Enter" por "commita o país errado" seria um mau negócio.
 */
describe('auto-commit', () => {
  const sudao: EspecResposta = { tipo: 'texto', canonica: 'Sudão', aceitas: ['Sudão'] }
  const auto = formasDeAutoCommit(sudao)
  const universoCheio = ['sudao', 'sudaosul', 'sudaodosul']

  it('normaliza para a mesma chave compactada da validação', () => {
    expect(auto?.normalizar('  SUDÃO ')).toBe('sudao')
    expect(formasDeAutoCommit(sudao)?.formas).toEqual(['sudao'])
  })

  it('não commita sozinho enquanto "Sudão do Sul" continua a partir do texto', () => {
    expect(completaSemAmbiguidade('sudao', universoCheio)).toBe(false)
  })

  it('mas o Enter sempre valeu — e vale', () => {
    expect(validar('sudao', sudao, RECORDE).veredito).toBe('certo')
    expect(validar('Sudão', sudao, RECORDE).veredito).toBe('certo')
  })

  it('volta a commitar sozinho quando o Sudão do Sul sai de jogo', () => {
    expect(completaSemAmbiguidade('sudao', ['sudao'])).toBe(true)
  })

  it('commita o nome colado, sem espaço', () => {
    const rdc: EspecResposta = {
      tipo: 'texto',
      canonica: 'República Democrática do Congo',
      aceitas: ['República Democrática do Congo'],
    }
    const a = formasDeAutoCommit(rdc)
    expect(a?.formas).toContain('republicademocraticacongo')
    expect(completaSemAmbiguidade(a?.normalizar('republicademocraticadocongo') ?? '', a?.formas ?? [])).toBe(true)
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
