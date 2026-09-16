import { describe, expect, it } from 'vitest'
import { CONFUNDEM, DISTRATORES_FIXOS, LUAS, NOME_PLANETA, distratores } from './luas'
import type { PlanetaComLua } from './luas'

/**
 * O gabarito, conferido à mão contra o Gazetteer da IAU.
 *
 * Aqui não há fórmula que confira nada — "Reia é de Saturno" é um fato bruto, e
 * um fato bruto errado num jogo de memorização é a pior falha possível: a
 * pessoa decora com confiança a coisa errada. Então o gabarito é escrito duas
 * vezes, de duas maneiras independentes: a dona de cada lua, e a contagem por
 * planeta. Um erro de digitação que mude a dona quebra uma das duas listas.
 */
const DONA: Readonly<Record<string, PlanetaComLua>> = {
  lua: 'terra',
  fobos: 'marte', deimos: 'marte',
  io: 'jupiter', europa: 'jupiter', ganimedes: 'jupiter', calisto: 'jupiter',
  tita: 'saturno', encelado: 'saturno', reia: 'saturno', japeto: 'saturno',
  dione: 'saturno', tetis: 'saturno', mimas: 'saturno',
  miranda: 'urano', ariel: 'urano', umbriel: 'urano', titania: 'urano', oberon: 'urano',
  tritao: 'netuno', nereida: 'netuno', proteu: 'netuno',
}

/** A mesma informação por outro ângulo: quantas cada planeta põe no baralho. */
const QUANTAS: Readonly<Record<PlanetaComLua, number>> = {
  terra: 1, marte: 2, jupiter: 4, saturno: 7, urano: 5, netuno: 3,
}

/** Descobertas, uma a uma. Ver o comentário do campo no dataset. */
const DESCOBERTA: Readonly<Record<string, number>> = {
  fobos: 1877, deimos: 1877,
  io: 1610, europa: 1610, ganimedes: 1610, calisto: 1610,
  tita: 1655, japeto: 1671, reia: 1672, dione: 1684, tetis: 1684,
  mimas: 1789, encelado: 1789,
  titania: 1787, oberon: 1787, ariel: 1851, umbriel: 1851, miranda: 1948,
  tritao: 1846, nereida: 1949, proteu: 1989,
}

describe('luas', () => {
  it('cada lua é do planeta certo, conferido à mão', () => {
    for (const l of LUAS) {
      expect(DONA[l.id], `${l.id} não está no gabarito do teste`).toBeDefined()
      expect(l.planeta, `${l.nome}`).toBe(DONA[l.id])
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(DONA).sort()).toEqual(LUAS.map((l) => l.id).sort())
  })

  it('a contagem por planeta bate, e nenhum planeta fica sem lua', () => {
    // Planeta sem lua no baralho seria uma resposta que nunca é certa e só
    // aparece como distrator: injusto e, pior, aprendível.
    for (const planeta of Object.keys(NOME_PLANETA) as PlanetaComLua[]) {
      const n = LUAS.filter((l) => l.planeta === planeta).length
      expect(n, planeta).toBe(QUANTAS[planeta])
      expect(n, `${planeta} não tem lua nenhuma`).toBeGreaterThan(0)
    }
    expect(LUAS).toHaveLength(22)
  })

  it('nomes na forma em português, com acento', () => {
    // A tentação de copiar da Wikipédia inglesa é enorme e o erro é invisível
    // para quem revisa rápido: "Iapetus" e "Jápeto" são a mesma lua.
    const nome = (id: string) => LUAS.find((l) => l.id === id)?.nome
    expect(nome('ganimedes')).toBe('Ganimedes')
    expect(nome('calisto')).toBe('Calisto')
    expect(nome('tita')).toBe('Titã')
    expect(nome('encelado')).toBe('Encélado')
    expect(nome('japeto')).toBe('Jápeto')
    expect(nome('tetis')).toBe('Tétis')
    expect(nome('titania')).toBe('Titânia')
    expect(nome('tritao')).toBe('Tritão')
    expect(nome('proteu')).toBe('Proteu')
  })

  it('id sem acento e sem espaço; nome e id únicos', () => {
    for (const l of LUAS) expect(l.id, l.nome).toMatch(/^[a-z]+$/)
    expect(new Set(LUAS.map((l) => l.id)).size).toBe(LUAS.length)
    expect(new Set(LUAS.map((l) => l.nome)).size).toBe(LUAS.length)
  })

  it('Europa é lua e não planeta — e Titã não é Titânia', () => {
    // As duas confusões que este dataset existe para desfazer, fixadas em
    // teste para ninguém "consertar" por engano.
    expect(LUAS.find((l) => l.nome === 'Europa')?.planeta).toBe('jupiter')
    expect(LUAS.find((l) => l.nome === 'Titã')?.planeta).toBe('saturno')
    expect(LUAS.find((l) => l.nome === 'Titânia')?.planeta).toBe('urano')
  })

  it('a data de descoberta bate, e só a Lua não tem', () => {
    for (const l of LUAS) {
      if (l.id === 'lua') {
        expect(l.descoberta, 'ninguém descobriu a Lua').toBeUndefined()
        continue
      }
      expect(l.descoberta, l.nome).toBe(DESCOBERTA[l.id])
      expect(l.descoberta as number, l.nome).toBeGreaterThanOrEqual(1610)
      expect(l.descoberta as number, l.nome).toBeLessThanOrEqual(1989)
    }
  })

  it('as quatro galileanas são de 1610 e só elas', () => {
    const de1610 = LUAS.filter((l) => l.descoberta === 1610).map((l) => l.nome)
    expect(de1610.sort()).toEqual(['Calisto', 'Europa', 'Ganimedes', 'Io'])
    for (const l of LUAS) {
      if (l.descoberta === 1610) expect(l.planeta, l.nome).toBe('jupiter')
    }
  })

  it('toda lua diz o que faz dela uma carta', () => {
    for (const l of LUAS) expect(l.nota.length, l.nome).toBeGreaterThan(15)
  })
})

describe('distratores', () => {
  it('todo planeta tem candidatos suficientes para fechar quatro alternativas', () => {
    for (const planeta of Object.keys(NOME_PLANETA) as PlanetaComLua[]) {
      const lista = distratores(planeta)
      // Dois fixos mais pelo menos um sorteável: abaixo disso o terceiro
      // distrator deixaria de girar e o conjunto de opções viraria constante.
      expect(lista.length, planeta).toBeGreaterThan(DISTRATORES_FIXOS)
      expect(new Set(lista).size, planeta).toBe(lista.length)
      expect(lista, planeta).not.toContain(planeta)
      for (const d of lista) expect(NOME_PLANETA[d], `${planeta} → ${d}`).toBeDefined()
    }
  })

  it('Mercúrio e Vênus não existem neste arquivo — e não podem existir', () => {
    // Os dois não têm lua. Como distrator seriam eliminação de graça; como
    // resposta, uma mentira. O tipo já impede, e este teste é o lembrete de
    // por quê para quem pensar em "completar" a lista dos oito.
    expect(Object.keys(NOME_PLANETA)).toHaveLength(6)
    expect(Object.keys(NOME_PLANETA)).not.toContain('mercurio')
    expect(Object.keys(NOME_PLANETA)).not.toContain('venus')
    for (const lista of Object.values(CONFUNDEM)) {
      expect(lista).not.toContain('mercurio')
      expect(lista).not.toContain('venus')
    }
  })

  it('os dois primeiros de cada lista são os que de fato confundem', () => {
    // Gigante gasoso puxa gigante gasoso; rochoso puxa rochoso. Se algum dia
    // isto virar "Júpiter, Terra", a carta de Encélado deixou de perguntar
    // alguma coisa.
    expect(distratores('jupiter').slice(0, 2)).toEqual(['saturno', 'urano'])
    expect(distratores('saturno').slice(0, 2)).toEqual(['jupiter', 'urano'])
    expect(distratores('urano').slice(0, 2)).toEqual(['netuno', 'saturno'])
    expect(distratores('netuno').slice(0, 2)).toEqual(['urano', 'saturno'])
    expect(distratores('marte').slice(0, 2)).toEqual(['terra', 'jupiter'])
    expect(distratores('terra').slice(0, 2)).toEqual(['marte', 'jupiter'])
  })
})
