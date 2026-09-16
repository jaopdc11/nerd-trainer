import { describe, expect, it } from 'vitest'
import {
  AMINOACIDOS,
  BASES_DNA,
  BASES_RNA,
  CODONS,
  CODON_INICIO,
  NOME_PARADA,
  codificadoraParaRna,
  codonsDe,
  complementarDna,
  distratores,
  distratoresDeCodificadora,
  distratoresDeMolde,
  moldeDe,
  rotulo,
  transcrever,
  traduzir,
  vizinhos,
} from './codigo-genetico'

/**
 * O código genético, escrito à mão códon a códon.
 *
 * O dataset guarda dezesseis blocos de quatro letras e expande os 64 códons por
 * função — o que é a decisão certa e é exatamente por isso que ele não pode se
 * autoaprovar. Um `AG: 'SSRR'` digitado como `AG: 'RRSS'` passa por todas as
 * guardas de `expandir()`: são quatro caracteres, as duas letras existem, os 20
 * aminoácidos continuam presentes. O jogo rodaria ensinando que AGA é serina.
 *
 * Estes 64 nomes vieram da tabela padrão (NCBI translation table 1) um a um, e
 * estão por extenso e não por letra de propósito: `L` e `I` colados numa fita de
 * 64 caracteres se trocam sem ninguém notar, "leucina" e "isoleucina" não.
 */
const GABARITO: Readonly<Record<string, string>> = {
  UUU: 'fenilalanina', UUC: 'fenilalanina', UUA: 'leucina', UUG: 'leucina',
  UCU: 'serina', UCC: 'serina', UCA: 'serina', UCG: 'serina',
  UAU: 'tirosina', UAC: 'tirosina', UAA: 'parada', UAG: 'parada',
  UGU: 'cisteína', UGC: 'cisteína', UGA: 'parada', UGG: 'triptofano',

  CUU: 'leucina', CUC: 'leucina', CUA: 'leucina', CUG: 'leucina',
  CCU: 'prolina', CCC: 'prolina', CCA: 'prolina', CCG: 'prolina',
  CAU: 'histidina', CAC: 'histidina', CAA: 'glutamina', CAG: 'glutamina',
  CGU: 'arginina', CGC: 'arginina', CGA: 'arginina', CGG: 'arginina',

  AUU: 'isoleucina', AUC: 'isoleucina', AUA: 'isoleucina', AUG: 'metionina',
  ACU: 'treonina', ACC: 'treonina', ACA: 'treonina', ACG: 'treonina',
  AAU: 'asparagina', AAC: 'asparagina', AAA: 'lisina', AAG: 'lisina',
  AGU: 'serina', AGC: 'serina', AGA: 'arginina', AGG: 'arginina',

  GUU: 'valina', GUC: 'valina', GUA: 'valina', GUG: 'valina',
  GCU: 'alanina', GCC: 'alanina', GCA: 'alanina', GCG: 'alanina',
  GAU: 'ácido aspártico', GAC: 'ácido aspártico',
  GAA: 'ácido glutâmico', GAG: 'ácido glutâmico',
  GGU: 'glicina', GGC: 'glicina', GGA: 'glicina', GGG: 'glicina',
}

/**
 * Quantos códons cada aminoácido tem, contados na tabela impressa e não no
 * `GABARITO` acima.
 *
 * Parece a mesma asserção duas vezes e não é: o gabarito confere *qual* é a
 * resposta de cada códon, esta lista confere a *forma* do código. Um par de
 * linhas trocadas entre dois aminoácidos de mesma multiplicidade — AAU/AAC por
 * AAA/AAG, digamos — passaria pelo gabarito se eu tivesse errado o gabarito do
 * mesmo jeito, e a redundância é o fato que estes três jogos existem para
 * ensinar. Seis para leucina, seis para serina, seis para arginina; um só para
 * metionina e um só para triptofano; três paradas.
 */
const QUANTOS_CODONS: Readonly<Record<string, number>> = {
  alanina: 4, arginina: 6, asparagina: 2, 'ácido aspártico': 2, cisteína: 2,
  glutamina: 2, 'ácido glutâmico': 2, glicina: 4, histidina: 2, isoleucina: 3,
  leucina: 6, lisina: 2, metionina: 1, fenilalanina: 2, prolina: 4, serina: 6,
  treonina: 4, triptofano: 1, tirosina: 2, valina: 4,
  parada: 3,
}

describe('a tabela', () => {
  it('tem os 64 códons, cada um exatamente uma vez', () => {
    expect(CODONS).toHaveLength(64)
    expect(new Set(CODONS).size).toBe(64)
  })

  it('está na ordem da tabela impressa, e não em ordem alfabética', () => {
    // U, C, A, G nas três posições: é a ordem de Nirenberg, e é ela que põe os
    // blocos degenerados lado a lado. Em ordem alfabética (A, C, G, U) o
    // primeiro códon seria AAA, e `BLOCOS` teria de ser reescrito inteiro.
    const esperados = BASES_RNA.flatMap((b1) =>
      BASES_RNA.flatMap((b2) => BASES_RNA.map((b3) => `${b1}${b2}${b3}`)),
    )
    expect([...CODONS]).toEqual(esperados)
    expect(CODONS[0]).toBe('UUU')
    expect(CODONS[63]).toBe('GGG')
  })

  it('bate com o gabarito conferido à mão, códon a códon', () => {
    for (const codon of CODONS) {
      const esperado = GABARITO[codon]
      expect(esperado, `${codon} não está no gabarito do teste`).toBeDefined()
      expect(rotulo(traduzir(codon)), codon).toBe(esperado)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual([...CODONS].sort())
  })
})

describe('a redundância', () => {
  it('dá a cada aminoácido a contagem conferida à mão', () => {
    for (const a of AMINOACIDOS) {
      const esperado = QUANTOS_CODONS[a.nome]
      expect(esperado, `${a.nome} não está na contagem do teste`).toBeDefined()
      expect(codonsDe(a).length, `${a.nome} (${a.sigla})`).toBe(esperado)
    }
    expect(codonsDe(null).length, NOME_PARADA).toBe(QUANTOS_CODONS[NOME_PARADA])
  })

  it('e as contagens somam 64 — nenhum códon fica sem dono nem com dois', () => {
    const soma = Object.values(QUANTOS_CODONS).reduce((s, n) => s + n, 0)
    expect(soma).toBe(64)
    expect(Object.keys(QUANTOS_CODONS)).toHaveLength(21)
  })

  it('seis códons para leucina, serina e arginina — a graça do código', () => {
    // Os três de multiplicidade 6 são os únicos que ocupam dois blocos
    // diferentes da tabela, e é por isso que eles são o fato mais citado do
    // assunto. Se algum dia um deles cair para 4, alguém partiu um bloco.
    expect(codonsDe(porNome('leucina'))).toEqual(['UUA', 'UUG', 'CUU', 'CUC', 'CUA', 'CUG'])
    expect(codonsDe(porNome('serina'))).toEqual(['UCU', 'UCC', 'UCA', 'UCG', 'AGU', 'AGC'])
    expect(codonsDe(porNome('arginina'))).toEqual(['CGU', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'])
  })

  it('e um só para metionina e triptofano — os dois sem rede', () => {
    expect(codonsDe(porNome('metionina'))).toEqual(['AUG'])
    expect(codonsDe(porNome('triptofano'))).toEqual(['UGG'])
  })

  it('oito blocos são degenerados nos quatro, seis se partem ao meio, dois são irregulares', () => {
    // A aritmética que o comentário de `BLOCOS` afirma, virada em asserção. Sem
    // isto, `UA: 'YY**'` digitado como `UA: 'Y***'` passaria por `expandir()`
    // inteiro: a tirosina continuaria no código pelo UAC, e a parada também.
    const formas = { quatro: 0, doisEDois: 0, irregular: 0 }
    for (let i = 0; i < 64; i += 4) {
      const bloco = CODONS.slice(i, i + 4).map((c) => rotulo(traduzir(c)))
      const distintos = new Set(bloco).size
      if (distintos === 1) formas.quatro++
      else if (distintos === 2 && bloco[0] === bloco[1] && bloco[2] === bloco[3]) {
        formas.doisEDois++
      } else formas.irregular++
    }
    expect(formas).toEqual({ quatro: 8, doisEDois: 6, irregular: 2 })
  })

  it('e os dois irregulares são exatamente os do triptofano e da metionina', () => {
    expect(['UGU', 'UGC', 'UGA', 'UGG'].map((c) => rotulo(traduzir(c)))).toEqual([
      'cisteína', 'cisteína', 'parada', 'triptofano',
    ])
    expect(['AUU', 'AUC', 'AUA', 'AUG'].map((c) => rotulo(traduzir(c)))).toEqual([
      'isoleucina', 'isoleucina', 'isoleucina', 'metionina',
    ])
  })
})

describe('início e parada', () => {
  it('AUG é o início, e é metionina', () => {
    expect(CODON_INICIO).toBe('AUG')
    expect(rotulo(traduzir(CODON_INICIO))).toBe('metionina')
  })

  it('UAA, UAG e UGA param, e mais ninguém', () => {
    const paradas = CODONS.filter((c) => traduzir(c) === null)
    expect(paradas).toEqual(['UAA', 'UAG', 'UGA'])
  })

  it('a parada é null e não um vigésimo-primeiro aminoácido', () => {
    // Enfiá-la em AMINOACIDOS faria `.length` valer 21, e todo consumidor teria
    // de filtrá-la de volta — e algum esqueceria.
    expect(AMINOACIDOS).toHaveLength(20)
    expect(AMINOACIDOS.some((a) => a.nome === NOME_PARADA)).toBe(false)
    expect(rotulo(null)).toBe(NOME_PARADA)
  })
})

describe('os 20 aminoácidos', () => {
  it('têm letra, sigla e nome, todos distintos entre si', () => {
    expect(new Set(AMINOACIDOS.map((a) => a.letra)).size).toBe(20)
    expect(new Set(AMINOACIDOS.map((a) => a.sigla)).size).toBe(20)
    expect(new Set(AMINOACIDOS.map((a) => a.nome)).size).toBe(20)
  })

  it('usam a sigla internacional capitalizada — Trp, nunca TRP nem trp', () => {
    // A caixa é a informação no jogo de siglas, então ela é dado e não estilo.
    for (const a of AMINOACIDOS) {
      expect(a.sigla, a.nome).toMatch(/^[A-Z][a-z]{2}$/)
      expect(a.letra, a.nome).toMatch(/^[A-Z]$/)
    }
    expect(AMINOACIDOS.map((a) => a.sigla)).toContain('Trp')
  })

  it('e não as abreviações do português — Gly, e não Gli', () => {
    // A sigla de três letras não é uma abreviação do nome: é símbolo
    // padronizado (IUPAC-IUB), e é o que está escrito em todo PDB e UniProt.
    // 'Gli', 'Cis', 'Fen', 'Lis', 'Tir' não passam em lugar nenhum fora da prova.
    const siglas = new Set(AMINOACIDOS.map((a) => a.sigla))
    for (const errada of ['Gli', 'Cis', 'Fen', 'Lis', 'Tir', 'Trip']) {
      expect(siglas.has(errada), `${errada} é abreviação do português, não sigla`).toBe(false)
    }
    expect(siglas).toContain('Gly')
    expect(siglas).toContain('Cys')
    expect(siglas).toContain('Phe')
    expect(siglas).toContain('Lys')
    expect(siglas).toContain('Tyr')
  })

  it('estão em ordem de letra, que é a ordem de qualquer tabela de referência', () => {
    const letras = AMINOACIDOS.map((a) => a.letra)
    expect([...letras]).toEqual([...letras].sort())
  })

  it('escrevem o nome em português com acento', () => {
    // 'cisteina' e 'acido aspartico' sem acento entrariam calados e apareceriam
    // na tela do jogador.
    expect(AMINOACIDOS.map((a) => a.nome)).toContain('cisteína')
    expect(AMINOACIDOS.map((a) => a.nome)).toContain('ácido aspártico')
    expect(AMINOACIDOS.map((a) => a.nome)).toContain('ácido glutâmico')
  })

  it('só os dois ácidos têm sinônimo, e é o nome do ânion', () => {
    for (const a of AMINOACIDOS) {
      const esperado = a.nome.startsWith('ácido ')
      expect(a.sinonimos.length > 0, `${a.nome}`).toBe(esperado)
    }
    expect(porNome('ácido aspártico').sinonimos).toEqual(['aspartato'])
    expect(porNome('ácido glutâmico').sinonimos).toEqual(['glutamato'])
  })
})

describe('vizinhos', () => {
  it('são nove, distintos, e cada um a exatamente um nucleotídeo', () => {
    for (const codon of CODONS) {
      const perto = vizinhos(codon)
      expect(perto, codon).toHaveLength(9)
      expect(new Set(perto).size, codon).toBe(9)
      for (const v of perto) {
        const diferencas = [...v].filter((base, i) => base !== codon[i]).length
        expect(diferencas, `${codon} → ${v}`).toBe(1)
      }
    }
  })

  it('vêm com a terceira posição primeiro — é a oscilante, e é a que engana', () => {
    // Quem decorou "o terceiro nucleotídeo não muda o aminoácido" acerta os oito
    // blocos degenerados e cai justamente em UGA e AUA. Se esta ordem inverter,
    // os distratores deixam de cobrar a degenerescência.
    expect(vizinhos('UGG').slice(0, 3)).toEqual(['UGU', 'UGC', 'UGA'])
    expect(vizinhos('AUG').slice(0, 3)).toEqual(['AUU', 'AUC', 'AUA'])
  })
})

describe('distratores de códon', () => {
  it('dão pelo menos três opções erradas só com os vizinhos — a cauda nunca é usada hoje', () => {
    // A cauda de `distratores` percorre os 20 aminoácidos e existe para o caso
    // de a tabela mudar. Este teste registra que ela está morta: se algum dia um
    // códon precisar dela, é sinal de que alguém achatou um bloco.
    for (const codon of CODONS) {
      const certo = traduzir(codon)
      const deVizinhos = new Set(vizinhos(codon).map((v) => traduzir(v)))
      deVizinhos.delete(certo)
      expect(deVizinhos.size, `${codon} tem menos de três vizinhos distintos`)
        .toBeGreaterThanOrEqual(3)
    }
  })

  it('nunca repetem a resposta certa nem a si mesmos', () => {
    for (const codon of CODONS) {
      const errados = distratores(codon)
      expect(errados.length, codon).toBeGreaterThanOrEqual(3)
      expect(new Set(errados).size, codon).toBe(errados.length)
      expect(errados, codon).not.toContain(traduzir(codon))
    }
  })

  it('põem a parada na tela do triptofano, e o triptofano na da parada', () => {
    // UGG e UGA são vizinhos de um nucleotídeo, e é o par de troca mais caro do
    // código: um deles termina a proteína. Se sumir daqui, o jogo parou de
    // perguntar a única coisa que o bloco UG tem a ensinar.
    expect(distratores('UGG').slice(0, 3)).toContain(null)
    expect(distratores('UGA').slice(0, 3)).toContain(porNome('triptofano'))
  })

  it('e a metionina na tela da isoleucina', () => {
    expect(distratores('AUA').slice(0, 3)).toContain(porNome('metionina'))
    expect(distratores('AUG').slice(0, 3)).toContain(porNome('isoleucina'))
  })
})

describe('transcrição', () => {
  it('a fita molde complementa e troca T por U', () => {
    expect(transcrever('TAC')).toBe('AUG')
    expect(transcrever('ATTACG')).toBe('UAAUGC')
  })

  it('a fita codificadora só troca T por U — é a armadilha inteira do assunto', () => {
    expect(codificadoraParaRna('ATG')).toBe('AUG')
    expect(codificadoraParaRna('TAC')).toBe('UAC')
    // O mesmo texto na tela dá duas respostas diferentes conforme a fita, e é
    // por isso que são duas funções e não uma com bandeira.
    expect(transcrever('ATG')).not.toBe(codificadoraParaRna('ATG'))
  })

  it('molde e mRNA voltam um do outro', () => {
    for (const codon of CODONS) {
      expect(transcrever(moldeDe(codon)), codon).toBe(codon)
    }
  })

  it('a fita irmã em DNA é a codificadora, e ela tem o mesmo texto do mRNA com T', () => {
    const molde = 'TACGGA'
    expect(complementarDna(molde)).toBe('ATGCCT')
    expect(codificadoraParaRna(complementarDna(molde))).toBe(transcrever(molde))
  })

  it('as quatro bases do DNA têm par nas três tabelas, e o U não entra em nenhuma', () => {
    // O caso que uma tabela incompleta produziria é uma fita sorteada que
    // explode no meio da partida, e só na base que faltasse.
    for (const base of BASES_DNA) {
      expect(() => transcrever(base), base).not.toThrow()
      expect(() => codificadoraParaRna(base), base).not.toThrow()
      expect(() => complementarDna(base), base).not.toThrow()
    }
    expect(BASES_DNA).toHaveLength(4)
    expect([...BASES_DNA]).not.toContain('U')
    expect([...BASES_RNA]).not.toContain('T')
  })

  it('quebram em base que não existe, em vez de devolverem fita plausível', () => {
    // 'U' numa fita de DNA e 'T' numa de RNA são o erro de programa mais fácil
    // deste assunto. Devolver algo seria devolver biologia inventada.
    expect(() => transcrever('TAU')).toThrow(/não é nucleotídeo de DNA/)
    expect(() => moldeDe('ATG')).toThrow(/não é nucleotídeo de RNA/)
    expect(() => traduzir('ATG')).toThrow(/não é um códon de mRNA/)
    expect(() => traduzir('AXG')).toThrow(/não é um códon de mRNA/)
  })
})

describe('distratores de fita', () => {
  /** Todas as fitas de DNA de três bases: 64 casos, que é o espaço inteiro. */
  const FITAS_DNA = BASES_DNA.flatMap((b1) =>
    BASES_DNA.flatMap((b2) => BASES_DNA.map((b3) => `${b1}${b2}${b3}`)),
  )

  it('dão sempre três opções distintas e nenhuma igual à certa, em toda fita possível', () => {
    // A cauda de `umaBaseTrocada` existe justamente para os casos degenerados —
    // fita sem A, fita palindrômica —, e este teste percorre o espaço inteiro
    // para garantir que nenhum sorteio devolva uma carta de duas alternativas.
    for (const fita of FITAS_DNA) {
      for (const [nome, errados, certo] of [
        ['molde', distratoresDeMolde(fita), transcrever(fita)],
        ['codificadora', distratoresDeCodificadora(fita), codificadoraParaRna(fita)],
      ] as const) {
        expect(errados.length, `${nome} ${fita}`).toBeGreaterThanOrEqual(3)
        expect(new Set(errados).size, `${nome} ${fita}`).toBe(errados.length)
        expect(errados, `${nome} ${fita}`).not.toContain(certo)
      }
    }
  })

  it('o primeiro erro da molde é ter lido a fita como codificadora', () => {
    // Nenhuma fita escapa: A→U contra A, T→A contra U, C→G contra C, G→C contra
    // G — as duas leituras nunca coincidem, então este distrator existe sempre.
    for (const fita of FITAS_DNA) {
      expect(distratoresDeMolde(fita)[0], fita).toBe(codificadoraParaRna(fita))
    }
    expect(distratoresDeMolde('TACGGA')[0]).toBe('UACGGA')
  })

  it('e o primeiro erro da codificadora é ter complementado sem precisar', () => {
    for (const fita of FITAS_DNA) {
      expect(distratoresDeCodificadora(fita)[0], fita).toBe(transcrever(fita))
    }
  })

  it('a opção com timina fica por último — é a que se elimina sozinha', () => {
    // Um T na tela denuncia a opção para quem sabe que RNA não tem timina. Ela
    // fica mesmo assim, pelo motivo do nox: é o erro com nome, e quem o comete
    // precisa vê-lo escrito. Mas fica em terceiro, não em primeiro.
    const errados = distratoresDeMolde('TACGGA')
    const comT = errados.findIndex((e) => e.includes('T'))
    expect(comT).toBe(2)
    expect(errados[comT]).toBe('ATGCCT')
    expect(errados.slice(0, 2).some((e) => e.includes('T'))).toBe(false)
  })

  it('e o erro do meio é o complemento reverso', () => {
    expect(distratoresDeMolde('TACGGA')[1]).toBe('UCCGUA')
  })
})

/** Atalho de leitura dos testes. Lança no nome errado, que é o que se quer. */
function porNome(nome: string) {
  const achado = AMINOACIDOS.find((a) => a.nome === nome)
  if (!achado) throw new Error(`não existe aminoácido "${nome}"`)
  return achado
}
