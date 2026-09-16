import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import { FAIXAS, gerarCronologia } from '@/games/cronologia'
import { EVENTOS, exibirAno } from './cronologia'

describe('dataset', () => {
  it('não tem id repetido', () => {
    const ids = EVENTOS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('não tem evento repetido pelo nome', () => {
    const nomes = EVENTOS.map((e) => e.nome)
    expect(new Set(nomes).size).toBe(nomes.length)
  })

  it('tem Brasil e mundo em quantidade comparável', () => {
    const brasil = EVENTOS.filter((e) => e.onde === 'brasil').length
    const mundo = EVENTOS.length - brasil
    // Nenhum dos dois pode virar figurante: um jogo só de Brasil ou só de
    // Europa ensina metade do século.
    expect(brasil).toBeGreaterThan(EVENTOS.length * 0.3)
    expect(mundo).toBeGreaterThan(EVENTOS.length * 0.3)
  })

  it('cobre da antiguidade ao século XXI', () => {
    const anos = EVENTOS.map((e) => e.ano)
    expect(Math.min(...anos)).toBeLessThan(-500)
    expect(Math.max(...anos)).toBeGreaterThan(2000)
  })

  it('a.C. aparece como ano negativo e é exibido com sufixo', () => {
    expect(exibirAno(-44)).toBe('44 a.C.')
    expect(exibirAno(1789)).toBe('1789')
  })

  it('anos plausíveis: nada de dígito trocado', () => {
    for (const e of EVENTOS) {
      expect(e.ano, e.id).toBeGreaterThan(-3000)
      expect(e.ano, e.id).toBeLessThanOrEqual(2026)
    }
  })

  it('âncoras conferidas à mão', () => {
    const ano = (id: string) => EVENTOS.find((e) => e.id === id)?.ano
    expect(ano('cabral')).toBe(1500)
    expect(ano('independencia')).toBe(1822)
    expect(ano('lei-aurea')).toBe(1888)
    expect(ano('republica')).toBe(1889)
    expect(ano('revolucao-francesa')).toBe(1789)
    expect(ano('muro-queda')).toBe(1989)
    expect(ano('cesar')).toBe(-44)
  })
})

describe('gerador', () => {
  /**
   * A pergunta "qual veio antes?" não tem resposta quando os dois eventos são
   * do mesmo ano, e o dataset tem pares assim de propósito — Inconfidência
   * Mineira e Revolução Francesa são ambas de 1789. Gerar esse par daria um
   * exercício sem gabarito, então a varredura tem de excluí-lo em todo nível.
   */
  it('nunca sorteia dois eventos do mesmo ano', () => {
    const rng = mulberry32(12345)
    const porNome = new Map(EVENTOS.map((e) => [e.nome, e]))

    for (let nivel = 0; nivel <= 2; nivel++) {
      for (let i = 0; i < 800; i++) {
        const ex = gerarCronologia(rng, nivel)
        if (ex.tipo !== 'escolha') throw new Error('deveria ser de escolha')
        const [a, b] = ex.alternativas.map((alt) => porNome.get(alt.valor))
        expect(a, ex.chave).toBeDefined()
        expect(b, ex.chave).toBeDefined()
        expect(a?.ano, `${a?.id} e ${b?.id} empatam no ano`).not.toBe(b?.ano)
      }
    }
  })

  it('a alternativa correta é sempre a mais antiga', () => {
    const rng = mulberry32(777)
    const porNome = new Map(EVENTOS.map((e) => [e.nome, e]))

    for (let nivel = 0; nivel <= 2; nivel++) {
      for (let i = 0; i < 500; i++) {
        const ex = gerarCronologia(rng, nivel)
        if (ex.tipo !== 'escolha') throw new Error('deveria ser de escolha')
        const anos = ex.alternativas.map((alt) => porNome.get(alt.valor)?.ano ?? 0)
        const certo = anos[ex.indiceCorreto] as number
        expect(certo, ex.chave).toBe(Math.min(...anos))
      }
    }
  })

  it('a ordem na tela é sorteada, não sempre a resposta em cima', () => {
    const rng = mulberry32(42)
    let emCima = 0
    const n = 400
    for (let i = 0; i < n; i++) {
      const ex = gerarCronologia(rng, 1)
      if (ex.tipo === 'escolha' && ex.indiceCorreto === 0) emCima++
    }
    // Sem o sorteio isto daria 0 ou n, e o jogo seria vencível sem ler.
    expect(emCima).toBeGreaterThan(n * 0.35)
    expect(emCima).toBeLessThan(n * 0.65)
  })

  /**
   * A regressão do "César contra Lei Áurea".
   *
   * Enquanto o nível era só um mínimo de distância, o fácil sorteava 1.932 anos
   * de intervalo e a pergunta não media nada. O teto é o conserto, e este teste
   * é o que impede ele de voltar — inclusive no nível mais alto, que acumula os
   * anteriores e por isso também tem um teto próprio: o do nível 0.
   */
  it('nenhum nível estoura o próprio teto de distância', () => {
    const rng = mulberry32(2024)
    const porNome = new Map(EVENTOS.map((e) => [e.nome, e]))

    for (let nivel = 0; nivel < FAIXAS.length; nivel++) {
      // Acumular os anteriores significa que o teto efetivo é o maior deles.
      const teto = Math.max(...FAIXAS.slice(0, nivel + 1).map((f) => f.ate))
      for (let i = 0; i < 1000; i++) {
        const ex = gerarCronologia(rng, nivel)
        if (ex.tipo !== 'escolha') continue
        const anos = ex.alternativas.map((a) => porNome.get(a.valor)?.ano ?? 0)
        const d = Math.abs((anos[0] as number) - (anos[1] as number))
        expect(d, `nível ${nivel}: ${ex.chave} tem ${d} anos de intervalo`).toBeLessThanOrEqual(teto)
        expect(d, `nível ${nivel}: ${ex.chave}`).toBeGreaterThan(0)
      }
    }
  })

  it('o nível 0 é grosseiro e o nível 2 é fino', () => {
    const rng = mulberry32(99)
    const porNome = new Map(EVENTOS.map((e) => [e.nome, e]))
    const distancia = (nivel: number) => {
      let soma = 0
      const n = 300
      for (let i = 0; i < n; i++) {
        const ex = gerarCronologia(rng, nivel)
        if (ex.tipo !== 'escolha') continue
        const anos = ex.alternativas.map((a) => porNome.get(a.valor)?.ano ?? 0)
        soma += Math.abs((anos[0] as number) - (anos[1] as number))
      }
      return soma / n
    }
    expect(distancia(2)).toBeLessThan(distancia(0))
  })

  it('a chave do par é estável: mesma dupla, mesma chave', () => {
    // A anti-repetição da engine usa a chave; se ela dependesse da ordem
    // sorteada, o mesmo par apareceria duas vezes seguidas.
    const rng = mulberry32(5)
    const vistas = new Map<string, string>()
    for (let i = 0; i < 600; i++) {
      const ex = gerarCronologia(rng, 2)
      if (ex.tipo !== 'escolha') continue
      const dupla = [...ex.alternativas.map((a) => a.valor)].sort().join('|')
      const anterior = vistas.get(dupla)
      if (anterior) expect(ex.chave).toBe(anterior)
      else vistas.set(dupla, ex.chave)
    }
    expect(vistas.size).toBeGreaterThan(50)
  })
})
