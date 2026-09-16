import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { mulberry32 } from '@/core/rng'
import { CORPOS, PLANETAS, exibirGravidade, exibirPeriodo } from '@/data/sistema-solar'
import type { Carta } from '@/core/types'
import { montarBaralhoSolar, sistemaSolar } from './sistema-solar'

/**
 * O baralho, medido em várias sementes.
 *
 * Um baralho montado com RNG tem um modo de falhar que não aparece em teste de
 * uma rodada só: a carta que sai quebrada uma vez em vinte sorteios. Aqui o
 * risco concreto é a alternativa duplicada — Vênus e Urano têm a mesma
 * gravidade, Mercúrio e Marte quase — então tudo que é sorteado é conferido em
 * doze sementes, não em uma.
 */
const SEMENTES = [1, 2, 3, 7, 11, 42, 99, 123, 777, 2024, 31337, 65535]
const BARALHOS = SEMENTES.map((s) => montarBaralhoSolar(mulberry32(s)))
const PRIMEIRO = BARALHOS[0] as readonly Carta[]

const corpoPorNome = new Map(CORPOS.map((c) => [c.nome, c]))
const textos = (c: Extract<Carta, { tipo: 'escolha' }>) =>
  c.alternativas.map((a) => (a.kind === 'texto' ? a.valor : ''))

describe('baralho', () => {
  it('tem as 38 cartas das quatro famílias', () => {
    // 8 de ordem + 10 janelas de tamanho + 12 de ano (todos menos a Terra) + 8
    // de gravidade. Se este número mudar sem alguém mexer de propósito, ou o
    // dataset ganhou corpo ou uma família parou de render carta.
    expect(PRIMEIRO).toHaveLength(38)
    const conta = (p: string) => PRIMEIRO.filter((c) => c.id.startsWith(p)).length
    expect(conta('solar-ordem-')).toBe(8)
    expect(conta('solar-maior-')).toBe(10)
    expect(conta('solar-ano-')).toBe(12)
    expect(conta('solar-g-')).toBe(8)
  })

  it('o mesmo conjunto de cartas em qualquer semente — só a ordem muda', () => {
    const referencia = [...PRIMEIRO.map((c) => c.id)].sort()
    for (const b of BARALHOS) expect([...b.map((c) => c.id)].sort()).toEqual(referencia)
    expect(new Set(referencia).size).toBe(referencia.length)
  })

  it('a Terra não vira carta de ano, mas segue sendo distrator', () => {
    expect(PRIMEIRO.some((c) => c.id === 'solar-ano-terra')).toBe(false)
    const marte = acharEscolha(PRIMEIRO, 'solar-ano-marte')
    expect(textos(marte)).toContain('1 ano')
  })
})

describe('cartas de escolha', () => {
  it('sempre quatro alternativas distintas, com a certa entre elas', () => {
    // A duplicata é o defeito que mataria a carta: a resposta certa apareceria
    // duas vezes e o jogador acertaria clicando em qualquer uma das duas — ou
    // erraria clicando na cópia, o que é pior.
    for (const baralho of BARALHOS) {
      for (const carta of baralho) {
        if (carta.tipo !== 'escolha') continue
        const opcoes = textos(carta)
        expect(opcoes, carta.id).toHaveLength(4)
        expect(new Set(opcoes).size, `${carta.id}: ${opcoes.join(' | ')}`).toBe(4)
        expect(carta.indiceCorreto, carta.id).toBeGreaterThanOrEqual(0)
        expect(carta.indiceCorreto, carta.id).toBeLessThan(4)
        // O gabarito começa pela resposta: é o que a UI mostra depois do erro.
        expect(carta.gabarito, carta.id).toContain(opcoes[carta.indiceCorreto] as string)
      }
    }
  })

  it('na carta de tamanho, a resposta é mesmo o maior dos quatro', () => {
    for (const baralho of BARALHOS) {
      for (const carta of baralho) {
        if (carta.tipo !== 'escolha' || !carta.id.startsWith('solar-maior-')) continue
        const corpos = textos(carta).map((n) => corpoPorNome.get(n))
        for (const c of corpos) expect(c, carta.id).toBeDefined()
        const maior = corpos.reduce((a, b) =>
          (a?.raioKm ?? 0) >= (b?.raioKm ?? 0) ? a : b,
        )
        expect(textos(carta)[carta.indiceCorreto], carta.id).toBe(maior?.nome)
      }
    }
  })

  it('a alternativa certa é o valor real do corpo, não um número montado', () => {
    for (const c of CORPOS) {
      if (c.id === 'terra') continue
      const ano = acharEscolha(PRIMEIRO, `solar-ano-${c.id}`)
      expect(textos(ano)[ano.indiceCorreto], c.id).toBe(exibirPeriodo(c.periodoAnos))
    }
    for (const p of PLANETAS) {
      const g = acharEscolha(PRIMEIRO, `solar-g-${p.id}`)
      expect(textos(g)[g.indiceCorreto], p.id).toBe(exibirGravidade(p.gravidade as number))
    }
  })

  it('os distratores são vizinhos de ranking, não números quaisquer', () => {
    // Todo texto que aparece numa carta de ano é o ano de algum corpo da lista.
    // Distrator inventado — "200 anos" — mediria só se a pessoa reconhece um
    // número redondo.
    const anosReais = new Set(CORPOS.map((c) => exibirPeriodo(c.periodoAnos)))
    for (const baralho of BARALHOS) {
      for (const carta of baralho) {
        if (carta.tipo !== 'escolha' || !carta.id.startsWith('solar-ano-')) continue
        for (const t of textos(carta)) expect(anosReais.has(t), `${carta.id}: ${t}`).toBe(true)
      }
    }
  })

  it('Urano contra Netuno cai na mesma carta — é o par que engana', () => {
    // A janela de tamanho existe para isto: quem acha que "mais longe é menor"
    // erra aqui, e só descobre se os dois estiverem na tela juntos.
    const carta = acharEscolha(PRIMEIRO, 'solar-maior-urano')
    expect(textos(carta)).toContain('Netuno')
    expect(textos(carta)[carta.indiceCorreto]).toBe('Urano')
  })
})

describe('cartas digitadas', () => {
  const digitadas = PRIMEIRO.filter((c) => c.tipo === 'digitada')

  it('são as oito posições, e cada uma aceita o próprio planeta', () => {
    expect(digitadas).toHaveLength(8)
    for (const carta of digitadas) {
      if (carta.tipo !== 'digitada' || carta.resposta.tipo !== 'texto') {
        throw new Error(`${carta.id}: devia ser texto digitado`)
      }
      const r = validar(carta.resposta.canonica, carta.resposta, { rigor: 'estrito' })
      expect(r.veredito, carta.id).toBe('certo')
      // Sem acento e em caixa baixa também vale: a normalização é a mesma do
      // resto do app, e "jupiter" não é menos saber do que "Júpiter".
      const semAcento = carta.resposta.canonica
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
      expect(validar(semAcento, carta.resposta, { rigor: 'estrito' }).veredito, semAcento).toBe(
        'certo',
      )
    }
  })

  it('o nome de um planeta nunca vale ponto na carta de outro', () => {
    // Com a tolerância a typo ligada, este é o teste que importa: se algum par
    // de nomes estivesse a um caractere de distância, a carta do 5º planeta
    // aceitaria o 6º e o jogo perderia o sentido.
    for (const carta of digitadas) {
      if (carta.tipo !== 'digitada' || carta.resposta.tipo !== 'texto') continue
      // Ligado a uma constante porque o estreitamento de `carta.resposta.tipo`
      // não sobrevive ao callback do filter.
      const resposta = carta.resposta
      const vizinhanca = new Set(PLANETAS.map((p) => p.nome).filter((n) => n !== resposta.canonica))
      for (const outro of vizinhanca) {
        expect(
          validar(outro, resposta, { rigor: 'estrito', vizinhanca }).veredito,
          `${carta.id} aceitou "${outro}"`,
        ).toBe('errado')
      }
    }
  })
})

describe('declaração do jogo', () => {
  it('é flashcard de baralho completo, em física, com teclado de texto', () => {
    expect(sistemaSolar.id).toBe('sistema-solar')
    expect(sistemaSolar.mecanica).toBe('flashcard')
    expect(sistemaSolar.categoria).toBe('fisica')
    const config = sistemaSolar.config()
    expect(config.fim).toBe('baralho')
    expect(config.teclado).toBe('texto')
    expect(config.montarBaralho(mulberry32(5))).toHaveLength(38)
  })
})

function acharEscolha(
  baralho: readonly Carta[],
  id: string,
): Extract<Carta, { tipo: 'escolha' }> {
  const carta = baralho.find((c) => c.id === id)
  if (!carta || carta.tipo !== 'escolha') throw new Error(`carta de escolha ${id} não existe`)
  return carta
}
