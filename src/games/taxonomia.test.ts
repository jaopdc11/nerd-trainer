import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import { GRUPOS, SERES_VIVOS, armadilhas, confusoesDe } from '@/data/taxonomia'
import type { Grupo } from '@/data/taxonomia'
import { taxonomia } from './taxonomia'
import type { Carta } from '@/core/types'

/**
 * O jogo sorteia opção e ordem, então nada aqui pode ser conferido numa partida
 * só: uma carta que oferece distrator aleatório uma vez em dez passaria batida.
 * As propriedades são verificadas em dez baralhos de sementes diferentes, que é
 * o que transforma "deu certo" em "vale sempre".
 */
const SEMENTES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
const BARALHOS = SEMENTES.map((s) => taxonomia.config().montarBaralho(mulberry32(s)))
const BARALHO = BARALHOS[0] as readonly Carta[]

/** O baralho vem embaralhado; achar pelo id é a única forma estável de olhar uma carta. */
function carta(baralho: readonly Carta[], id: string): Carta {
  const achada = baralho.find((c) => c.id === `taxon-${id}`)
  if (!achada) throw new Error(`carta sumiu: ${id}`)
  return achada
}

function alternativas(c: Carta): readonly string[] {
  if (c.tipo !== 'escolha') throw new Error(`${c.id}: devia ser carta de escolha`)
  return c.alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))
}

describe('baralho de taxonomia', () => {
  it('tem uma carta por ser vivo, sem id repetido', () => {
    expect(BARALHO).toHaveLength(SERES_VIVOS.length)
    expect(new Set(BARALHO.map((c) => c.id)).size).toBe(BARALHO.length)
  })

  it('toda carta é de escolha, com quatro alternativas distintas', () => {
    for (const baralho of BARALHOS) {
      for (const c of baralho) {
        const opcoes = alternativas(c)
        expect(opcoes, c.id).toHaveLength(4)
        expect(new Set(opcoes).size, `${c.id}: alternativa repetida`).toBe(4)
      }
    }
  })

  it('o índice correto aponta para o grupo do dataset', () => {
    for (const baralho of BARALHOS) {
      for (const s of SERES_VIVOS) {
        const c = carta(baralho, s.id)
        if (c.tipo !== 'escolha') throw new Error(`${c.id}: devia ser escolha`)
        expect(alternativas(c)[c.indiceCorreto], s.id).toBe(s.grupo)
      }
    }
  })

  it('a pergunta é o nome do bicho, capitalizado, e nunca o grupo', () => {
    for (const s of SERES_VIVOS) {
      const c = carta(BARALHO, s.id)
      expect(c.pergunta.kind === 'texto' ? c.pergunta.valor : '', s.id).toBe(
        s.nome.charAt(0).toUpperCase() + s.nome.slice(1),
      )
    }
  })
})

/*
 * O coração do jogo. Se estes três testes caírem, o baralho continua rodando e
 * deixa de medir alguma coisa: com distrator sorteado entre vinte grupos, o
 * golfinho passa a disputar com porífero e miriápode e a carta vira leitura.
 */
describe('os distratores', () => {
  it('saem sempre do mapa de confusões, nunca de sorteio', () => {
    for (const baralho of BARALHOS) {
      for (const s of SERES_VIVOS) {
        const c = carta(baralho, s.id)
        const errados = alternativas(c).filter((o) => o !== s.grupo)
        for (const e of errados) {
          expect(confusoesDe(s.grupo), `${s.id}: ofereceu "${e}"`).toContain(e as Grupo)
        }
      }
    }
  })

  it('a armadilha declarada está sempre entre as opções', () => {
    // Não basta que ela *possa* aparecer: se o sorteio a deixar de fora numa
    // partida, a carta daquela partida não é o jogo que foi prometido.
    for (const baralho of BARALHOS) {
      for (const s of armadilhas()) {
        expect(alternativas(carta(baralho, s.id)), s.id).toContain(s.confundeCom as string)
      }
    }
  })

  it('peixe está na mesa do golfinho e inseto na da aranha, em todas as sementes', () => {
    for (const baralho of BARALHOS) {
      expect(alternativas(carta(baralho, 'golfinho'))).toContain('peixe')
      expect(alternativas(carta(baralho, 'aranha'))).toContain('inseto')
      expect(alternativas(carta(baralho, 'cogumelo'))).toContain('planta')
      expect(alternativas(carta(baralho, 'tubarao'))).toContain('mamífero')
    }
  })

  it('nenhuma opção é um grupo que não existe', () => {
    for (const baralho of BARALHOS) {
      for (const c of baralho) {
        for (const o of alternativas(c)) expect(GRUPOS, `${c.id}: "${o}"`).toContain(o as Grupo)
      }
    }
  })
})

describe('gabarito e recados', () => {
  it('o gabarito traz o grupo e a régua que decide, não só a resposta', () => {
    for (const s of SERES_VIVOS) {
      const c = carta(BARALHO, s.id)
      expect(c.gabarito, s.id).toContain(s.grupo)
      expect(c.gabarito, s.id).toContain(s.pista)
    }
  })

  it('a explicação da alga-parda chega à carta', () => {
    // O recado sobre o reino Protista é a contraparte honesta de cobrar uma
    // resposta num ponto em que a classificação mudou: perdê-lo no caminho
    // entre o dataset e a carta transformaria a ressalva em silêncio.
    const c = carta(BARALHO, 'alga-parda')
    expect(c.explicacao).toBeDefined()
    expect(BARALHO.filter((x) => x.explicacao !== undefined)).toHaveLength(1)
  })
})

describe('metadados', () => {
  it('é flashcard de biológicas, com o id que o registry espera', () => {
    expect(taxonomia.id).toBe('taxonomia')
    expect(taxonomia.categoria).toBe('biologicas')
    expect(taxonomia.mecanica).toBe('flashcard')
  })

  it('vai até o fim do baralho, e não em morte súbita', () => {
    // Uma em quatro é chute bom demais para custar a partida inteira — e o que
    // se quer é justamente que o jogador veja as 53 cartas, porque metade delas
    // ele achava que sabia.
    expect(taxonomia.config().fim).toBe('baralho')
  })

  it('o comoJogar ensina os oito níveis, que não viram jogo próprio', () => {
    const texto = taxonomia.comoJogar.join(' ')
    for (const nivel of ['domínio', 'reino', 'filo', 'classe', 'ordem', 'família', 'gênero', 'espécie']) {
      expect(texto, nivel).toContain(nivel)
    }
  })
})
