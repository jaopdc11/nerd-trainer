import { describe, expect, it } from 'vitest'
import { ELEMENTOS } from './tabela-periodica'
import {
  EXCECOES,
  GASES_NOBRES,
  PRIMEIRO_PREVISTO,
  Z_MAX,
  aplicarExcecao,
  configuracao,
  distratores,
  exibir,
  madelungPuro,
  totalDeEletrons,
} from './configuracao-eletronica'

/**
 * O gabarito, escrito à mão.
 *
 * `configuracao()` monta tudo a partir da diagonal, e é justamente por isso que
 * ela não pode se autoaprovar: um erro na ordem de Madelung, ou uma exceção com
 * o subnível de origem trocado, devolveria uma cadeia perfeitamente plausível e
 * o jogo ensinaria química errada em silêncio. Estas linhas vieram da tabela,
 * uma a uma, e não da função.
 *
 * As âncoras foram escolhidas para cobrir cada decisão do arquivo: um átomo de
 * um elétron só, o carbono e o oxigênio (p incompleto), o neônio (camada
 * fechada), o cloro e o cálcio (antes do d), o escândio e o ferro (a inversão
 * 4s/3d), o cromo e o cobre (meio preenchido e cheio), o zinco (o d fechado
 * *sem* exceção, que é o contraste), a prata, o gadolínio, o ouro e o urânio
 * (as exceções longe do começo da tabela).
 */
const GABARITO: Readonly<Record<number, string>> = {
  1: '1s¹',
  6: '1s² 2s² 2p²',
  8: '1s² 2s² 2p⁴',
  10: '1s² 2s² 2p⁶',
  17: '1s² 2s² 2p⁶ 3s² 3p⁵',
  20: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s²',
  21: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹',
  24: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹ 3d⁵',
  26: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶',
  29: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹ 3d¹⁰',
  30: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰',
  47: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s¹ 4d¹⁰',
  64: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f⁷ 5d¹',
  79: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s¹ 4f¹⁴ 5d¹⁰',
  92: '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f³ 6d¹',
}

/** As mesmas âncoras na forma que o jogo mostra dali em diante. */
const GABARITO_ABREVIADO: Readonly<Record<number, string>> = {
  24: '[Ar] 4s¹ 3d⁵',
  26: '[Ar] 4s² 3d⁶',
  46: '[Kr] 4d¹⁰',
  47: '[Kr] 5s¹ 4d¹⁰',
  57: '[Xe] 6s² 5d¹',
  64: '[Xe] 6s² 4f⁷ 5d¹',
  79: '[Xe] 6s¹ 4f¹⁴ 5d¹⁰',
  90: '[Rn] 7s² 6d²',
  92: '[Rn] 7s² 5f³ 6d¹',
  103: '[Rn] 7s² 5f¹⁴ 7p¹',
  118: '[Rn] 7s² 5f¹⁴ 6d¹⁰ 7p⁶',
}

/**
 * As vinte exceções experimentais, escritas aqui de novo e de propósito.
 *
 * É a lista que separa este jogo de um que ensina "Cr: 4s² 3d⁴". Se alguém
 * apagar uma linha do mapa, o teste acusa; se alguém acrescentar uma exceção
 * nova sem conferir na literatura, o teste também acusa, que é o ponto.
 */
const Z_DAS_EXCECOES = [
  24, 29, 41, 42, 44, 45, 46, 47, 57, 58, 64, 78, 79, 89, 90, 91, 92, 93, 96, 103,
] as const

describe('configuração eletrônica', () => {
  it('bate com o gabarito conferido à mão, elemento a elemento', () => {
    for (const [z, esperado] of Object.entries(GABARITO)) {
      expect(exibir(configuracao(Number(z))), `Z=${z}`).toBe(esperado)
    }
  })

  it('bate com o gabarito abreviado', () => {
    for (const [z, esperado] of Object.entries(GABARITO_ABREVIADO)) {
      expect(exibir(configuracao(Number(z)), 'abreviada'), `Z=${z}`).toBe(esperado)
    }
  })

  it('a soma dos elétrons é o Z, nos 118', () => {
    // A guarda mais barata e a mais importante: qualquer erro de capacidade, de
    // ordem ou de transferência aparece aqui como um átomo com elétron a mais
    // ou a menos.
    for (let z = 1; z <= Z_MAX; z++) {
      expect(totalDeEletrons(configuracao(z)), `Z=${z}`).toBe(z)
      expect(totalDeEletrons(madelungPuro(z)), `Madelung puro, Z=${z}`).toBe(z)
    }
  })

  it('nenhum subnível repetido nem estourado, nos 118', () => {
    const teto: Readonly<Record<string, number>> = { s: 2, p: 6, d: 10, f: 14 }
    for (let z = 1; z <= Z_MAX; z++) {
      const c = configuracao(z)
      const vistos = new Set<string>()
      for (const o of c) {
        const k = `${o.n}${o.sub}`
        expect(vistos.has(k), `Z=${z}: ${k} repetido`).toBe(false)
        vistos.add(k)
        expect(o.eletrons, `Z=${z}: ${k}`).toBeGreaterThan(0)
        expect(o.eletrons, `Z=${z}: ${k}`).toBeLessThanOrEqual(teto[o.sub] as number)
      }
    }
  })

  it('o último subnível é o bloco declarado na tabela periódica', () => {
    // Fora do bloco f a correspondência é exata, e é o teste que pega uma
    // diagonal fora de ordem: se o 3d entrasse antes do 4s, o cálcio terminaria
    // em d e o escândio em s.
    //
    // O bloco f fica de fora porque o próprio lugar do La, do Lu, do Ac e do Lr
    // na tabela é disputado — `tabela-periodica.ts` os põe nas faixas de baixo,
    // e a configuração do Lu termina em 5d e a do Lr em 7p.
    for (const e of ELEMENTOS) {
      if (e.bloco === 'f') continue
      const c = configuracao(e.z)
      const fim = c[c.length - 1]
      expect(fim?.sub, `${e.simbolo} (Z=${e.z})`).toBe(e.bloco)
    }
  })

  it('recusa Z fora da tabela', () => {
    for (const z of [0, -1, 119, 1.5]) {
      expect(() => configuracao(z), `Z=${z}`).toThrow(/fora de 1/)
    }
  })
})

describe('exceções', () => {
  it('são exatamente as vinte medidas, sem sobra nem falta', () => {
    const doMapa = Object.keys(EXCECOES).map(Number).sort((a, b) => a - b)
    expect(doMapa).toEqual([...Z_DAS_EXCECOES])
  })

  it('todas mudam mesmo a configuração', () => {
    // Uma exceção que devolve o Aufbau ingênuo é linha morta — ou pior, sinal de
    // que a transferência foi descrita ao contrário e se anulou.
    for (const z of Z_DAS_EXCECOES) {
      expect(exibir(configuracao(z)), `Z=${z}`).not.toBe(exibir(madelungPuro(z)))
    }
  })

  it('todas explicam o porquê, e nenhuma explicação se repete', () => {
    const porques = Object.values(EXCECOES).map((e) => e.porque)
    for (const p of porques) expect(p.length).toBeGreaterThan(20)
    expect(new Set(porques).size).toBe(porques.length)
  })

  it('todas transferem 1 ou 2 elétrons, do s ou do f para o d — menos o laurêncio', () => {
    for (const [z, ex] of Object.entries(EXCECOES)) {
      expect(ex.quantos, `Z=${z}`).toBeGreaterThanOrEqual(1)
      expect(ex.quantos, `Z=${z}`).toBeLessThanOrEqual(2)
      if (Number(z) === 103) {
        expect(ex.de).toBe('6d')
        expect(ex.para).toBe('7p')
        continue
      }
      expect(ex.de[1], `Z=${z}: cede do ${ex.de}`).toMatch(/[sf]/)
      expect(ex.para[1], `Z=${z}: recebe no ${ex.para}`).toBe('d')
    }
  })

  it('nenhuma é declarada para elemento de configuração só prevista', () => {
    for (const z of Object.keys(EXCECOES)) {
      expect(Number(z), `Z=${z}`).toBeLessThan(PRIMEIRO_PREVISTO)
    }
  })

  it('o cromo é 4s¹ 3d⁵ e o cobre é 4s¹ 3d¹⁰ — o erro que este jogo existe para não cometer', () => {
    expect(exibir(configuracao(24), 'abreviada')).toBe('[Ar] 4s¹ 3d⁵')
    expect(exibir(configuracao(29), 'abreviada')).toBe('[Ar] 4s¹ 3d¹⁰')
    // E o vizinho comportado continua comportado: a exceção não vazou.
    expect(exibir(configuracao(25), 'abreviada')).toBe('[Ar] 4s² 3d⁵')
    expect(exibir(configuracao(28), 'abreviada')).toBe('[Ar] 4s² 3d⁸')
  })
})

describe('guardas da transferência', () => {
  it('quebra quando a origem não tem o elétron', () => {
    // O ferro não tem nada no 4p; ceder de lá é exceção escrita errada, e
    // devolver uma configuração plausível seria pior que falhar.
    expect(() =>
      aplicarExcecao(26, { de: '4p', para: '3d', quantos: 1, porque: 'inventada' }),
    ).toThrow(/não dá para ceder/)
  })

  it('quebra quando o destino estoura a capacidade', () => {
    expect(() =>
      aplicarExcecao(30, { de: '4s', para: '3d', quantos: 1, porque: 'inventada' }),
    ).toThrow(/estouraria a capacidade/)
  })

  it('quebra quando o subnível não existe', () => {
    expect(() =>
      aplicarExcecao(24, { de: 's4', para: '3d', quantos: 1, porque: 'inventada' }),
    ).toThrow(/subnível desconhecido/)
    expect(() =>
      aplicarExcecao(24, { de: '4s', para: '9z', quantos: 1, porque: 'inventada' }),
    ).toThrow(/subnível desconhecido/)
  })
})

describe('exibição', () => {
  it('usa expoente Unicode e nunca dígito ASCII no expoente', () => {
    // "3d10" na linha de base destoaria do resto do app, e "10" colado no "d"
    // ainda seria ambíguo com um subnível.
    for (let z = 1; z <= Z_MAX; z++) {
      expect(exibir(configuracao(z)), `Z=${z}`).toMatch(/^(\d[spdf][⁰¹²³⁴⁵⁶⁷⁸⁹]+ )*\d[spdf][⁰¹²³⁴⁵⁶⁷⁸⁹]+$/)
    }
  })

  it('o caroço abreviado é sempre um gás nobre de verdade', () => {
    const simbolos = new Set(GASES_NOBRES.map(([, s]) => s))
    for (let z = 3; z <= Z_MAX; z++) {
      const texto = exibir(configuracao(z), 'abreviada')
      const nucleo = texto.match(/^\[(\w+)\] /)?.[1]
      if (!nucleo) continue
      expect(simbolos.has(nucleo), `Z=${z}: [${nucleo}]`).toBe(true)
    }
  })

  it('os gases nobres do caroço batem com a tabela periódica', () => {
    // A lista está escrita duas vezes no projeto; se divergir, "[Ar]" passa a
    // significar outra coisa e ninguém percebe.
    for (const [z, simbolo] of GASES_NOBRES) {
      expect(ELEMENTOS.find((e) => e.z === z)?.simbolo, `Z=${z}`).toBe(simbolo)
      expect(ELEMENTOS.find((e) => e.z === z)?.grupo, `Z=${z}`).toBe(18)
    }
  })

  it('abrevia exatamente os elétrons do gás nobre', () => {
    // O caroço tem de valer o Z do gás: "[Ar] 4s² 3d⁶" só é o ferro se [Ar]
    // valer 18, e essa conta é a que o jogador faz de cabeça.
    for (let z = 1; z <= Z_MAX; z++) {
      const texto = exibir(configuracao(z), 'abreviada')
      const nucleo = texto.match(/^\[(\w+)\] /)?.[1]
      if (!nucleo) continue
      const zGas = GASES_NOBRES.find(([, s]) => s === nucleo)?.[0] as number
      const resto = texto
        .replace(/^\[\w+\] /, '')
        .split(' ')
        .reduce((soma, t) => soma + Number([...t.slice(2)].map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d)).join('')), 0)
      expect(zGas + resto, `Z=${z}: ${texto}`).toBe(z)
    }
  })

  it('nunca abrevia o átomo com ele mesmo', () => {
    // O criptônio virando "[Kr]" seria uma opção vazia na tela: ele tem de cair
    // no gás anterior, "[Ar] 4s² 3d¹⁰ 4p⁶". O hélio não tem gás anterior e sai
    // inteiro, que é o certo.
    for (const [z, simbolo] of GASES_NOBRES) {
      const texto = exibir(configuracao(z), 'abreviada')
      expect(texto, simbolo).not.toMatch(new RegExp(`^\\[${simbolo}\\]`))
      expect(texto.replace(/^\[\w+\] /, ''), simbolo).not.toBe('')
    }
    expect(exibir(configuracao(36), 'abreviada')).toBe('[Ar] 4s² 3d¹⁰ 4p⁶')
    expect(exibir(configuracao(2), 'abreviada')).toBe('1s²')
  })
})

describe('distratores', () => {
  it('dão pelo menos três opções distintas e nenhuma igual à resposta', () => {
    for (let z = 1; z < PRIMEIRO_PREVISTO; z++) {
      const errados = distratores(z).map((c) => exibir(c))
      expect(errados.length, `Z=${z}`).toBeGreaterThanOrEqual(3)
      expect(new Set(errados).size, `Z=${z}`).toBe(errados.length)
      expect(errados, `Z=${z}`).not.toContain(exibir(configuracao(z)))
    }
  })

  it('oferecem o Aufbau ingênuo em toda exceção — é a opção que a pessoa marca', () => {
    // Em Cr o certo é 4s¹ 3d⁵, e 4s² 3d⁴ tem de estar na tela: é o que o livro
    // diria se o cromo fosse comportado. Sem isso, o nível das exceções não
    // cobra nada.
    for (const z of Z_DAS_EXCECOES) {
      const errados = distratores(z).slice(0, 3).map((c) => exibir(c))
      expect(errados, `Z=${z}`).toContain(exibir(madelungPuro(z)))
    }
  })

  it('nunca oferecem a resposta certa escrita na outra convenção', () => {
    // `3d¹⁰ 4s¹` é o cobre em ordem de n, e qualquer livro aceita. Marcar isso
    // como errado puniria quem sabe mais, não quem sabe menos — e é o que sai
    // sozinho do distrator de camada em todo elemento de d fechado.
    const conjunto = (c: readonly { n: number; sub: string; eletrons: number }[]) =>
      c.map((o) => `${o.n}${o.sub}${o.eletrons}`).sort().join(' ')

    for (let z = 1; z < PRIMEIRO_PREVISTO; z++) {
      const certo = conjunto(configuracao(z))
      for (const d of distratores(z)) {
        expect(conjunto(d), `Z=${z}: ${exibir(d)} é o mesmo átomo`).not.toBe(certo)
      }
    }
    expect(distratores(29).map((c) => exibir(c, 'abreviada'))).not.toContain('[Ar] 3d¹⁰ 4s¹')
  })

  it('preferem o distrator que cabe no mesmo caroço', () => {
    // No ouro, "[Kr] 4d¹⁰ 4f¹⁴ 5s² 5p⁶ 5d¹⁰ 5f¹" é erro de verdade, mas se
    // denuncia pelo comprimento ao lado de três opções em "[Xe]". Vai para o
    // fim da fila e cede a vaga aos vizinhos de Z, que obrigam a contar.
    for (const t of distratores(79).slice(0, 3).map((c) => exibir(c, 'abreviada'))) {
      expect(t, t).toMatch(/^\[Xe\] /)
    }
    // O mesmo no criptônio, onde o vizinho de cima abriria um caroço novo:
    // "[Kr] 5s¹" como opção da pergunta sobre o próprio criptônio é pista.
    for (const t of distratores(36).slice(0, 3).map((c) => exibir(c, 'abreviada'))) {
      expect(t, t).toMatch(/^\[Ar\] /)
    }
  })

  it('oferecem o erro de quem preencheu camada por camada', () => {
    // Ferro: o certo é [Ar] 4s² 3d⁶; quem ignora a diagonal escreve 3d⁸ e não
    // põe nada no 4s.
    const errados = distratores(26).slice(0, 3).map((c) => exibir(c, 'abreviada'))
    expect(errados).toContain('[Ar] 3d⁸')
  })

  it('oferecem a promoção s→p nos leves, onde não há d para errar', () => {
    // Carbono: o 1s² 2s¹ 2p³ é o erro de quem ouviu falar de hibridização antes
    // de fechar o Aufbau.
    const errados = distratores(6).slice(0, 3).map((c) => exibir(c))
    expect(errados).toContain('1s² 2s¹ 2p³')
  })

  it('oferecem o erro de contagem, com total diferente do Z', () => {
    for (const z of [1, 8, 26, 47]) {
      const totais = distratores(z).slice(0, 3).map(totalDeEletrons)
      expect(totais.some((t) => t !== z), `Z=${z}`).toBe(true)
    }
  })
})
