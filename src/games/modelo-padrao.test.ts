import { describe, expect, it } from 'vitest'
import { completaSemAmbiguidade, formasDeAutoCommit, normalizarTexto, validar } from '@/core/answer'
import { formasAceitas, PARTICULAS } from '@/data/modelo-padrao'
import type { CelulaGrade } from '@/core/types'
import { modeloPadrao } from './modelo-padrao'

const config = modeloPadrao.config()
const celulas = config.celulas

/**
 * A busca que `useGrid` faz no modo livre, reproduzida aqui.
 *
 * Reproduzir em vez de montar o hook é decisão consciente: o que precisa ser
 * provado é que **o dataset** não confunde duas células, e isso é uma
 * propriedade das respostas, não do React. Montar o motor traria relógio, rng e
 * storage para dentro de um teste que não fala de nenhum dos três.
 *
 * A única parte que importa copiar fielmente é a vizinhança: sem ela a
 * tolerância a erro de digitação deixaria "neutrino muônico" cair na célula do
 * neutrino do tau, e o teste passaria justamente onde o jogo quebraria.
 */
const TODAS_AS_FORMAS = new Set(
  celulas.flatMap((c) =>
    c.resposta.tipo === 'texto' ? c.resposta.aceitas.map((a) => normalizarTexto(a)) : [],
  ),
)

function celulaQueAceita(texto: string, vazias: readonly CelulaGrade[] = celulas): string | null {
  for (const celula of vazias) {
    const outras = new Set(TODAS_AS_FORMAS)
    if (celula.resposta.tipo === 'texto') {
      for (const a of celula.resposta.aceitas) outras.delete(normalizarTexto(a))
    }
    const r = validar(texto, celula.resposta, { rigor: 'estrito', vizinhanca: outras })
    if (r.veredito !== 'errado') return celula.id
  }
  return null
}

describe('a grade', () => {
  it('tem as 17 células no quadro 4×5', () => {
    expect(celulas).toHaveLength(17)
    expect(config.linhas).toBe(4)
    expect(config.colunas).toBe(5)
  })

  it('é de ordem livre, com rótulo à mostra', () => {
    expect(config.ordem).toBe('livre')
    expect(config.mostrarRotulos).toBe(true)
    expect(config.teclado).toBe('texto')
  })

  /**
   * A decisão que o arquivo do jogo defende por extenso. Está aqui como teste
   * porque "sem relógio" é o tipo de coisa que alguém adiciona um dia achando
   * que é melhoria — e aí a defesa vira uma falha vermelha, não um comentário
   * que ninguém leu.
   */
  it('não é cronometrado', () => {
    expect(config.limiteSegundos).toBeUndefined()
  })

  it('dá a toda célula rótulo, grupo, seção e tooltip', () => {
    for (const c of celulas) {
      expect(c.rotulo, c.id).toBeTruthy()
      expect(c.grupo, c.id).toBeTruthy()
      expect(c.secao, c.id).toBeTruthy()
      expect(c.detalhe, c.id).toContain('spin')
    }
  })

  it('agrupa o gabarito do fim nas quatro famílias', () => {
    const secoes = new Set(celulas.map((c) => c.secao))
    expect(secoes).toEqual(new Set(['Quarks', 'Léptons', 'Bósons de gauge', 'Bóson escalar']))
  })

  it('tem os dois marcos, cobrindo 12 férmions e 5 bósons, sem sobra', () => {
    expect(config.marcos).toHaveLength(2)
    const [materia, forca] = config.marcos ?? []
    expect(materia?.ids).toHaveLength(12)
    expect(forca?.ids).toHaveLength(5)
    // Juntos são o quadro inteiro e não se cruzam: um marco sempre fecha antes
    // do outro, e nunca os dois na mesma resposta.
    const todos = [...(materia?.ids ?? []), ...(forca?.ids ?? [])]
    expect(new Set(todos).size).toBe(17)
  })
})

describe('roteamento das respostas', () => {
  /**
   * O teste central do jogo: **toda grafia aceita cai na célula certa**.
   *
   * Os pares perigosos aqui não são teóricos. "neutrino muônico" e "neutrino
   * tauônico" ficam a duas edições um do outro, e duas edições é exatamente o
   * que a tolerância perdoa num texto de 15 caracteres — quem segura é a trava
   * de vizinhança. "Quark up" e "Quark top" ficam a duas; "Bóson W" e "Bóson Z"
   * a uma, e só não passam porque texto de 6 caracteres não perdoa nada.
   */
  it('manda cada forma aceita para a sua própria célula', () => {
    for (const p of PARTICULAS) {
      for (const forma of formasAceitas(p)) {
        expect(celulaQueAceita(forma), `"${forma}" deveria ser ${p.id}`).toBe(p.id)
      }
    }
  })

  it('continua mandando certo mesmo com a célula vizinha ainda vazia', () => {
    // O caso acima com a ordem invertida: se `ντ` for testada antes de `νμ`, a
    // tolerância tem a chance de morder primeiro. Só a vizinhança impede.
    const invertida = [...celulas].reverse()
    for (const p of PARTICULAS) {
      for (const forma of formasAceitas(p)) {
        expect(celulaQueAceita(forma, invertida), `"${forma}" invertido`).toBe(p.id)
      }
    }
  })

  it('recusa o símbolo, que está visível na célula', () => {
    for (const p of PARTICULAS) {
      expect(celulaQueAceita(p.simbolo), `símbolo "${p.simbolo}"`).toBeNull()
    }
  })

  it('recusa partícula que não está no Modelo Padrão', () => {
    // Nêutron e próton são compostos; o gráviton não está no quadro. Aceitar
    // qualquer um deles por tolerância seria pior do que recusar um acerto.
    for (const fora of ['nêutron', 'próton', 'gráviton', 'píon', 'méson']) {
      expect(celulaQueAceita(fora), fora).toBeNull()
    }
  })

  it('aceita sem acento e sem caixa, como o resto do app', () => {
    expect(celulaQueAceita('muon')).toBe('muon')
    expect(celulaQueAceita('GLUON')).toBe('gluon')
    expect(celulaQueAceita('neutrino do eletron')).toBe('neutrino-eletron')
  })
})

describe('auto-commit', () => {
  /**
   * A tabela periódica aceita o nome assim que ele fica inequívoco, sem Enter, e
   * é o que dá fluidez à mecânica. Aqui vale conferir quem tem esse privilégio,
   * porque duas respostas deste baralho são prefixo de outra do mesmo baralho.
   */
  const universo = celulas.flatMap((c) => formasDeAutoCommit(c.resposta)?.formas ?? [])

  /**
   * Todas as células são do tipo `texto` com as mesmas opções, então qualquer
   * uma serve de fonte do normalizador — é o mesmo que a engine usa, e pegá-lo
   * de uma célula real em vez de reimplementá-lo é o que mantém o teste honesto.
   */
  const commita = (texto: string): boolean => {
    const primeira = celulas[0]
    if (!primeira) throw new Error('grade vazia')
    const forma = formasDeAutoCommit(primeira.resposta)
    if (!forma) throw new Error('célula sem forma de auto-commit')
    return completaSemAmbiguidade(forma.normalizar(texto), universo)
  }

  it('commita sozinho o que é inequívoco', () => {
    expect(commita('fóton')).toBe(true)
    expect(commita('bóson Z')).toBe(true)
    expect(commita('quark up')).toBe(true)
  })

  it('espera o Enter onde uma resposta é prefixo de outra', () => {
    // "tau" continua em "táuon"; "charm" continua em "charme". Nos dois casos as
    // duas formas são da MESMA partícula, então não há risco de célula errada —
    // só o custo de uma tecla, que é o preço de aceitar as duas grafias.
    expect(commita('tau')).toBe(false)
    expect(commita('charm')).toBe(false)
  })
})

describe('cartão do jogo', () => {
  it('declara id, categoria e mecânica estáveis', () => {
    // O id é a chave do storage: mudar aqui apaga o recorde de todo mundo.
    expect(modeloPadrao.id).toBe('modelo-padrao')
    expect(modeloPadrao.categoria).toBe('fisica')
    expect(modeloPadrao.mecanica).toBe('grade')
  })

  it('avisa em comoJogar que o símbolo não vale como resposta', () => {
    expect(modeloPadrao.comoJogar.join(' ')).toContain('"W" não vale')
  })
})
