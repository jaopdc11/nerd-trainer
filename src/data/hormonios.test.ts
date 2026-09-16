import { describe, expect, it } from 'vitest'
import { ENDOCRINOS, GLANDULAS, HORMONIOS, IRMAS, IRMAS_GLANDULA } from './hormonios'
import type { Glandula, Hormonio } from './hormonios'

/**
 * O gabarito, escrito à mão.
 *
 * A glândula e o alvo **estão** gravados no dataset — ao contrário do nox, que o
 * jogo calcula —, e é por isso que eles não podem se autoaprovar: trocar
 * `glandula` por `alvos` num hormônio trófico produz uma carta perfeitamente
 * bem-formada que ensina fisiologia invertida em silêncio, que é exatamente o
 * erro que este jogo existe para corrigir.
 *
 * A `chave` é o pedaço do efeito que **só** aquele hormônio pode ter, escrito
 * olhando a fisiologia e não o arquivo: se alguém reescrever o efeito e a chave
 * sumir, o teste quebra antes de a carta ficar ambígua na tela.
 */
const GABARITO: Readonly<
  Record<
    Hormonio,
    { readonly glandula: Glandula; readonly alvos: readonly Glandula[]; readonly chave: string }
  >
> = {
  insulina: { glandula: 'pâncreas', alvos: [], chave: 'baixa a glicemia' },
  glucagon: { glandula: 'pâncreas', alvos: [], chave: 'levanta a glicemia' },
  adrenalina: { glandula: 'medula da suprarrenal', alvos: [], chave: 'lutar ou fugir' },
  cortisol: { glandula: 'córtex da suprarrenal', alvos: [], chave: 'resposta imune' },
  aldosterona: { glandula: 'córtex da suprarrenal', alvos: [], chave: 'sódio' },
  tiroxina: { glandula: 'tireoide', alvos: [], chave: 'metabolismo basal' },
  calcitonina: { glandula: 'tireoide', alvos: [], chave: 'deposita no osso' },
  paratormônio: { glandula: 'paratireoides', alvos: [], chave: 'tira cálcio do osso' },
  // Os quatro tróficos: a fábrica é a hipófise, e o nome de cada um cita quem
  // obedece. É a razão de ser do baralho.
  TSH: { glandula: 'hipófise', alvos: ['tireoide'], chave: 'T3 e T4' },
  ACTH: { glandula: 'hipófise', alvos: ['córtex da suprarrenal'], chave: 'cortisol' },
  FSH: { glandula: 'hipófise', alvos: ['ovários', 'testículos'], chave: 'folículo ovariano' },
  LH: { glandula: 'hipófise', alvos: ['ovários', 'testículos'], chave: 'ovulação' },
  GH: { glandula: 'hipófise', alvos: [], chave: 'ossos longos' },
  prolactina: { glandula: 'hipófise', alvos: [], chave: 'produzir leite' },
  // Produzidos no hipotálamo, estocados na neuro-hipófise. Ver o cabeçalho do
  // dataset: é a decisão mais delicada do jogo.
  ocitocina: { glandula: 'hipotálamo', alvos: [], chave: 'ejeta o leite' },
  ADH: { glandula: 'hipotálamo', alvos: [], chave: 'concentrar a urina' },
  melatonina: { glandula: 'pineal', alvos: [], chave: 'ciclo do sono' },
  testosterona: { glandula: 'testículos', alvos: [], chave: 'caracteres sexuais masculinos' },
  estrogênio: { glandula: 'ovários', alvos: [], chave: 'primeira metade do ciclo' },
  progesterona: { glandula: 'ovários', alvos: [], chave: 'depois da ovulação' },
}

describe('dataset', () => {
  it('bate com o gabarito conferido à mão, hormônio a hormônio', () => {
    for (const h of ENDOCRINOS) {
      const esperado = GABARITO[h.nome]
      expect(esperado, `${h.nome} não está no gabarito do teste`).toBeDefined()
      expect(h.glandula, `${h.nome}`).toBe(esperado.glandula)
      expect([...h.alvos].sort(), `${h.nome}: alvos`).toEqual([...esperado.alvos].sort())
      expect(h.efeito, `${h.nome} perdeu "${esperado.chave}" do efeito`).toContain(esperado.chave)
    }
  })

  it('o gabarito não tem sobra — nenhuma linha morta', () => {
    expect(Object.keys(GABARITO).sort()).toEqual([...HORMONIOS].sort())
  })

  it('tem uma entrada por hormônio da lista canônica, sem repetir nome', () => {
    expect(ENDOCRINOS.map((h) => h.nome).sort()).toEqual([...HORMONIOS].sort())
    expect(new Set(ENDOCRINOS.map((h) => h.nome)).size).toBe(ENDOCRINOS.length)
  })

  it('cobre os dezessete hormônios que a prova cobra', () => {
    const obrigatorios: readonly Hormonio[] = [
      'insulina',
      'glucagon',
      'adrenalina',
      'cortisol',
      'tiroxina',
      'TSH',
      'FSH',
      'LH',
      'ocitocina',
      'ADH',
      'GH',
      'melatonina',
      'testosterona',
      'estrogênio',
      'progesterona',
      'paratormônio',
      'calcitonina',
    ]
    for (const h of obrigatorios) {
      expect(HORMONIOS, `${h} sumiu do baralho`).toContain(h)
    }
  })

  it('nenhuma glândula é órfã: toda uma delas fabrica alguma coisa', () => {
    // Uma glândula que só aparecesse como distrator seria uma opção que nunca é
    // resposta — e, depois de duas partidas, uma que dá para eliminar de olho
    // fechado.
    for (const g of GLANDULAS) {
      const quantos = ENDOCRINOS.filter((h) => h.glandula === g).length
      expect(quantos, `${g} não fabrica nada`).toBeGreaterThanOrEqual(1)
    }
  })

  it('nenhum hormônio comanda a própria glândula', () => {
    // Seria um alvo igual à resposta certa, ou seja, uma carta com duas opções
    // idênticas na tela.
    for (const h of ENDOCRINOS) {
      expect(h.alvos, `${h.nome} comanda a si mesmo`).not.toContain(h.glandula)
    }
  })

  it('só os tróficos da hipófise têm alvo', () => {
    // Se um hormônio periférico ganhar alvo, a carta dele passa a oferecer uma
    // glândula sem relação nenhuma como o distrator mais tentador.
    for (const h of ENDOCRINOS) {
      if (h.alvos.length > 0) expect(h.glandula, `${h.nome} é trófico`).toBe('hipófise')
    }
    const troficos = ENDOCRINOS.filter((h) => h.alvos.length > 0).map((h) => h.nome)
    expect(troficos.sort()).toEqual(['ACTH', 'FSH', 'LH', 'TSH'])
  })

  it('toda sigla vem por extenso', () => {
    // "FSH" sozinho na tela é um enigma; com "hormônio folículo-estimulante" ao
    // lado, a carta pergunta fisiologia em vez de memória de sigla.
    for (const h of ENDOCRINOS) {
      if (h.nome === h.nome.toUpperCase()) {
        expect(h.porExtenso, `${h.nome} sem nome por extenso`).toBeDefined()
      }
    }
  })

  it('o efeito nunca contém o nome do próprio hormônio', () => {
    // Seria entregar a resposta da carta que pergunta o efeito. Citar um irmão,
    // ao contrário, é deliberado: o ACTH é definido por mandar liberar cortisol.
    for (const h of ENDOCRINOS) {
      expect(h.efeito.toLowerCase(), h.nome).not.toContain(h.nome.toLowerCase())
    }
  })

  it('quem produz fora de onde libera carrega a ressalva, e só ele', () => {
    // É o caso da ocitocina e do ADH, e é o motivo de o campo existir: sem a
    // ressalva no gabarito, a resposta "hipotálamo" parece arbitrária para quem
    // decorou "neuro-hipófise".
    for (const h of ENDOCRINOS) {
      expect(Boolean(h.ressalva), `${h.nome}`).toBe(h.glandula === 'hipotálamo')
    }
  })

  it('todo hormônio explica o detalhe, e o detalhe não é o efeito repetido', () => {
    for (const h of ENDOCRINOS) {
      expect(h.detalhe.length, h.nome).toBeGreaterThan(20)
      expect(h.detalhe, h.nome).not.toBe(h.efeito)
    }
  })
})

describe('mapa de glândulas que se respondem no lugar uma da outra', () => {
  it('cobre exatamente as dez glândulas', () => {
    expect(Object.keys(IRMAS_GLANDULA).sort()).toEqual([...GLANDULAS].sort())
  })

  it('nenhuma é irmã de si mesma, e nada se repete na lista', () => {
    for (const g of GLANDULAS) {
      expect(IRMAS_GLANDULA[g], `${g} é irmã de si mesma`).not.toContain(g)
      expect(new Set(IRMAS_GLANDULA[g]).size, `${g} repete uma irmã`).toBe(IRMAS_GLANDULA[g].length)
    }
  })

  it('toda glândula tem três irmãs ou mais', () => {
    // É o que garante que os três distratores saiam da lista, sem nunca cair no
    // sorteio geral. Ver `cartaProducao`.
    for (const g of GLANDULAS) {
      expect(IRMAS_GLANDULA[g].length, `${g} tem ${IRMAS_GLANDULA[g].length}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('nenhuma lista vira a lista inteira', () => {
    // O mapa é assimétrico de propósito — ver o comentário dele. Se a hipófise
    // listar as nove outras, as seis cartas dela passam a sortear "pineal,
    // ovários, pâncreas", um trio que se elimina sozinho.
    for (const g of GLANDULAS) {
      expect(IRMAS_GLANDULA[g].length, `${g} lista quase todo mundo`).toBeLessThanOrEqual(5)
    }
  })

  it('o eixo do crânio e os pares vizinhos estão lá', () => {
    // Para ADH e ocitocina, "hipófise" é o erro canônico e precisa ser oferecido.
    expect(IRMAS_GLANDULA['hipotálamo']).toContain('hipófise')
    // Calcitonina × paratormônio vira tireoide × paratireoides na carta.
    expect(IRMAS_GLANDULA['paratireoides']).toContain('tireoide')
    expect(IRMAS_GLANDULA['tireoide']).toContain('paratireoides')
    // Cortisol × adrenalina vira córtex × medula.
    expect(IRMAS_GLANDULA['córtex da suprarrenal']).toContain('medula da suprarrenal')
    expect(IRMAS_GLANDULA['medula da suprarrenal']).toContain('córtex da suprarrenal')
  })
})

describe('mapa de hormônios que se confundem', () => {
  it('cobre exatamente os vinte hormônios', () => {
    expect(Object.keys(IRMAS).sort()).toEqual([...HORMONIOS].sort())
  })

  it('nenhum é irmão de si mesmo, e nada se repete na lista', () => {
    for (const h of HORMONIOS) {
      expect(IRMAS[h], `${h} é irmão de si mesmo`).not.toContain(h)
      expect(new Set(IRMAS[h]).size, `${h} repete um irmão`).toBe(IRMAS[h].length)
    }
  })

  it('é simétrico: se A se confunde com B, B se confunde com A', () => {
    // Aqui, ao contrário do mapa de glândulas, a confusão é mesmo mútua: quem
    // troca insulina por glucagon troca glucagon por insulina.
    for (const h of HORMONIOS) {
      for (const irmao of IRMAS[h]) {
        expect(IRMAS[irmao], `${h} lista ${irmao}, mas ${irmao} não lista ${h}`).toContain(h)
      }
    }
  })

  it('todo hormônio tem três irmãos ou mais', () => {
    for (const h of HORMONIOS) {
      expect(IRMAS[h].length, `${h} tem ${IRMAS[h].length} irmão(s)`).toBeGreaterThanOrEqual(3)
    }
  })

  it('os pares antagonistas estão todos lá', () => {
    // Se um destes sumir, o jogo perdeu o distrator que a fisiologia dá de
    // graça: a opção errada é a que faz exatamente o contrário.
    expect(IRMAS['insulina']).toContain('glucagon')
    expect(IRMAS['calcitonina']).toContain('paratormônio')
    expect(IRMAS['aldosterona']).toContain('ADH')
    expect(IRMAS['prolactina']).toContain('ocitocina')
  })

  it('as quatro siglas tróficas se confundem entre si', () => {
    for (const a of ['TSH', 'ACTH', 'FSH', 'LH'] as const) {
      const outras = (['TSH', 'ACTH', 'FSH', 'LH'] as const).filter((x) => x !== a)
      const quantas = outras.filter((x) => IRMAS[a].includes(x)).length
      expect(quantas, `${a} só se confunde com ${quantas} das outras siglas`).toBeGreaterThanOrEqual(2)
    }
  })
})
