import { describe, expect, it } from 'vitest'
import { CONFUNDE_COM, GRUPOS, SERES_VIVOS, armadilhas, confusoesDe, serVivo } from './taxonomia'
import type { Grupo } from './taxonomia'

/**
 * O gabarito conferido à mão, escrito de novo e **agrupado por grupo**, que é a
 * ordem contrária à do dataset (lá as cartas vêm na ordem em que foram
 * pensadas). Um bicho trocado de grupo lá aparece aqui como um nome sobrando num
 * grupo e faltando noutro — erro que uma cópia da mesma lista jamais pegaria.
 *
 * Esta é a regra do projeto: o dado não pode se autoaprovar.
 */
const GABARITO: Readonly<Record<Grupo, readonly string[]>> = {
  'mamífero': ['golfinho', 'baleia-azul', 'morcego', 'peixe-boi', 'ornitorrinco'],
  'ave': ['pinguim', 'avestruz'],
  'réptil': ['tartaruga-marinha', 'jacare', 'cascavel'],
  'anfíbio': ['salamandra', 'sapo'],
  'peixe': ['tubarao', 'cavalo-marinho', 'enguia'],
  'inseto': ['formiga', 'mosquito-da-dengue'],
  'aracnídeo': ['aranha', 'escorpiao', 'carrapato', 'acaro'],
  'crustáceo': ['caranguejo', 'camarao', 'tatuzinho-de-jardim', 'craca'],
  'miriápode': ['centopeia', 'piolho-de-cobra'],
  'molusco': ['polvo', 'lesma', 'ostra', 'caracol'],
  'anelídeo': ['minhoca', 'sanguessuga'],
  'platelminto': ['tenia', 'planaria'],
  'nematoide': ['lombriga'],
  'equinodermo': ['estrela-do-mar', 'ourico-do-mar', 'pepino-do-mar'],
  'cnidário': ['coral', 'anemona-do-mar', 'agua-viva'],
  'porífero': ['esponja-do-mar'],
  'fungo': ['cogumelo', 'levedura', 'bolor-do-pao'],
  'planta': ['musgo', 'samambaia'],
  'bactéria': ['cianobacteria', 'lactobacilo'],
  'protista': ['ameba', 'euglena', 'alga-parda'],
}

/**
 * As armadilhas que vieram do pedido, na forma "id → grupo certo".
 *
 * **Este é o teste que impede o jogo de perder a razão de ser.** Se alguém um
 * dia "limpar" o dataset — tirar o polvo, promover o tubarão, achar que
 * cogumelo é planta e corrigir para lá —, sobra um baralho de cartas que
 * ninguém erra, e um card de quatro opções que ninguém erra não mede nada.
 * Nomear caso a caso aqui é dizer que estas cartas são o produto, não exemplos.
 */
const ARMADILHAS_FUNDADORAS: Readonly<Record<string, Grupo>> = {
  golfinho: 'mamífero',
  'baleia-azul': 'mamífero',
  morcego: 'mamífero',
  pinguim: 'ave',
  aranha: 'aracnídeo',
  caranguejo: 'crustáceo',
  minhoca: 'anelídeo',
  'estrela-do-mar': 'equinodermo',
  polvo: 'molusco',
  coral: 'cnidário',
  cogumelo: 'fungo',
}

describe('baralho de seres vivos', () => {
  it('bate com o gabarito escrito por grupo, sem sobra e sem falta', () => {
    for (const grupo of GRUPOS) {
      const noDataset = SERES_VIVOS.filter((s) => s.grupo === grupo).map((s) => s.id)
      expect([...noDataset].sort(), grupo).toEqual([...(GABARITO[grupo] as string[])].sort())
    }
    const total = Object.values(GABARITO).reduce((s, l) => s + l.length, 0)
    expect(SERES_VIVOS).toHaveLength(total)
  })

  it('id é único, em ascii e kebab-case', () => {
    const ids = SERES_VIVOS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    // Id é chave, não texto de tela: acento aqui viraria armadilha de digitação
    // em import, teste e link com o dataset de nomes científicos.
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('nome é único e vem em minúscula, porque quem capitaliza é o jogo', () => {
    const nomes = SERES_VIVOS.map((s) => s.nome)
    expect(new Set(nomes).size).toBe(nomes.length)
    for (const n of nomes) expect(n[0], n).toBe(n[0]?.toLowerCase())
  })

  it('todo grupo aparece como resposta pelo menos uma vez', () => {
    // Um grupo que nunca é a resposta vira distrator eterno, e o jogador aprende
    // a eliminá-lo por estatística em vez de por biologia.
    const respondidos = new Set(SERES_VIVOS.map((s) => s.grupo))
    for (const g of GRUPOS) expect(respondidos, g).toContain(g)
  })

  it('toda pista é frase de verdade e nenhuma se repete', () => {
    const vistas = new Set<string>()
    for (const s of SERES_VIVOS) {
      // A pista vai para o gabarito no lugar do "porque" do nox: ela tem de
      // ensinar a régua, e régua não cabe em cinco palavras.
      expect(s.pista.length, `${s.id}: pista curta demais`).toBeGreaterThan(40)
      expect(vistas.has(s.pista), `pista repetida: ${s.pista}`).toBe(false)
      vistas.add(s.pista)
    }
  })
})

describe('armadilhas', () => {
  it('as armadilhas fundadoras continuam existindo, com o grupo certo', () => {
    for (const [id, grupo] of Object.entries(ARMADILHAS_FUNDADORAS)) {
      const s = serVivo(id)
      expect(s.grupo, id).toBe(grupo)
      expect(s.confundeCom, `${id} tem de estar marcado como armadilha`).toBeDefined()
    }
  })

  it('o golfinho é confundido com peixe e a aranha com inseto, e não com um grupo qualquer', () => {
    // O pedido é literal: o distrator sai do grupo que engana. Se estas duas
    // linhas mudarem, o jogo virou outro.
    expect(serVivo('golfinho').confundeCom).toBe('peixe')
    expect(serVivo('aranha').confundeCom).toBe('inseto')
    expect(serVivo('cogumelo').confundeCom).toBe('planta')
  })

  it('a maior parte do baralho é armadilha', () => {
    // Não é meta estética: um baralho majoritariamente de cartas óbvias mede
    // leitura, não classificação. Dois terços é o piso.
    expect(armadilhas().length * 3).toBeGreaterThan(SERES_VIVOS.length * 2)
  })

  it('ninguém é confundido com o próprio grupo', () => {
    for (const s of armadilhas()) expect(s.confundeCom, s.id).not.toBe(s.grupo)
  })

  it('toda confusão declarada na carta existe também no mapa de confusões', () => {
    // O par é um julgamento sobre o que se parece com o quê. Escrito em dois
    // lugares e mantido em um só, ele apodrece do lado que ninguém lê.
    for (const s of armadilhas()) {
      const grupo = s.confundeCom as Grupo
      expect(confusoesDe(s.grupo), `${s.id}: ${s.grupo} × ${grupo}`).toContain(grupo)
    }
  })
})

describe('mapa de confusões', () => {
  it('cobre todos os grupos e só usa grupo conhecido', () => {
    expect(Object.keys(CONFUNDE_COM).sort()).toEqual([...GRUPOS].sort())
    for (const g of GRUPOS) {
      for (const outro of confusoesDe(g)) expect(GRUPOS, `${g} → ${outro}`).toContain(outro)
    }
  })

  it('é simétrico', () => {
    // "A se confunde com B" e "B se confunde com A" são a mesma afirmação sobre
    // biologia: uma assimetria aqui é sempre esquecimento, nunca decisão.
    for (const g of GRUPOS) {
      for (const outro of confusoesDe(g)) {
        expect(confusoesDe(outro), `${outro} devia listar ${g} de volta`).toContain(g)
      }
    }
  })

  it('não tem auto-referência nem repetição', () => {
    for (const g of GRUPOS) {
      const lista = confusoesDe(g)
      expect(lista, g).not.toContain(g)
      expect(new Set(lista).size, g).toBe(lista.length)
    }
  })

  it('todo grupo tem três confusões ou mais', () => {
    // É o que garante que os três distratores de qualquer carta saiam daqui. Se
    // uma lista encolher para dois, a montagem cai no sorteio geral e volta a
    // oferecer "porífero" para o golfinho.
    for (const g of GRUPOS) expect(confusoesDe(g).length, g).toBeGreaterThanOrEqual(3)
  })
})

describe('guardas', () => {
  it('reclamam em vez de devolver vazio', () => {
    expect(() => serVivo('unicornio')).toThrow()
    expect(() => confusoesDe('marsupial' as Grupo)).toThrow()
  })

  it('o único aviso é o da alga-parda, e ele assume o problema do reino Protista', () => {
    const comAviso = SERES_VIVOS.filter((s) => s.aviso)
    expect(comAviso.map((s) => s.id)).toEqual(['alga-parda'])
    expect(comAviso[0]?.aviso?.length).toBeGreaterThan(80)
  })
})
