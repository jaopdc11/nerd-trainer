/**
 * As 17 partículas do Modelo Padrão, dispostas como no quadro canônico.
 *
 * **Por que este dataset copia o layout do diagrama, e não inventa um.** O
 * quadro do Modelo Padrão é tão fixo quanto a tabela periódica: três colunas de
 * gerações, quarks em cima, léptons embaixo, os bósons de gauge numa coluna à
 * direita e o Higgs sozinho na quinta. Quem estudou a coisa memorizou *a
 * posição*, não só o nome — saber que o charm fica acima do strange e à direita
 * do up é metade do que o diagrama ensina. Reagrupar por conta própria (por
 * spin, por carga, em ordem de descoberta) daria um quadro mais arrumado e
 * jogaria fora exatamente essa metade.
 *
 * **Carga e spin são inteiros, em terços e em meios.** A carga do up é +2/3 e o
 * spin do elétron é 1/2; guardar 0.6666666666666666 e 0.5 seria pedir para um
 * teste de igualdade falhar por ponto flutuante num dataset em que *todos* os
 * valores são frações exatas de denominador conhecido. Em terços de `e` e meios
 * de `ħ` a aritmética volta a ser exata, e a paridade do spin passa a ser a
 * definição de férmion — que é o que o teste verifica.
 *
 * **O símbolo nunca é resposta aceita.** É a decisão que estrutura o jogo
 * inteiro: o símbolo fica visível na célula como rótulo, do mesmo jeito que o
 * número atômico na tabela periódica. Aceitar "W" para o bóson W seria mandar o
 * jogador copiar o que já está na tela. Por isso as respostas do W e do Z são
 * "bóson W" e "bóson Z", e há teste para que nenhum nome coincida com o rótulo.
 *
 * **Nomes: os ingleses, com os portugueses como sinônimo.** "Quark strange" é
 * como se fala em sala de aula no Brasil, e "quark estranho" é como se escreve
 * em livro traduzido. As duas valem. A ordem importa só para o gabarito do fim,
 * e ali vale a forma que o jogador vai ouvir de um professor, não a mais
 * vernácula — este é um dataset de física, não de política linguística.
 */

export type Familia = 'quark' | 'lepton' | 'gauge' | 'escalar'

export const ROTULO_FAMILIA: Record<Familia, string> = {
  quark: 'Quarks',
  lepton: 'Léptons',
  gauge: 'Bósons de gauge',
  escalar: 'Bóson escalar',
}

export interface Particula {
  /** kebab-case, estável: é o id da célula na grade. */
  readonly id: string
  /** O que aparece como rótulo na célula. Nunca é resposta aceita. */
  readonly simbolo: string
  /** A resposta canônica, em pt-BR. */
  readonly nome: string
  /** A forma curta que cabe dentro da célula quadrada. */
  readonly curto: string
  /** Outras grafias aceitas. O nome canônico não se repete aqui. */
  readonly sinonimos: readonly string[]
  readonly familia: Familia
  /** 1, 2 ou 3 para os férmions; `null` para os bósons, que não têm geração. */
  readonly geracao: 1 | 2 | 3 | null
  /**
   * Carga elétrica em terços da carga elementar: +2 é +2/3, −3 é −1.
   *
   * O W vale +3 e o símbolo traz o `±`: W⁺ e W⁻ são a mesma entrada do quadro,
   * uma partícula e a sua antipartícula, e abrir duas células para elas quebraria
   * a contagem de 17 que é o próprio ponto do diagrama.
   */
  readonly cargaTercos: number
  /** Spin em meios: 1 é 1/2, 2 é 1, 0 é 0. Ímpar ⟺ férmion. */
  readonly spinMeios: number
  /** 1-based, como em CSS grid — a mesma convenção da tabela periódica. */
  readonly linha: number
  readonly coluna: number
}

export const LINHAS_GRADE = 4
export const COLUNAS_GRADE = 5

/**
 * A ordem do array é a ordem de leitura do quadro: linha a linha, da esquerda
 * para a direita. Não é a ordem em que o jogo pergunta — a grade é de ordem
 * livre —, mas é a ordem do gabarito do fim, e ali ela tem que ser a do diagrama.
 */
export const PARTICULAS: readonly Particula[] = [
  // Linha 1 — quarks de carga +2/3, uma geração por coluna, e as duas células
  // que não pertencem a geração nenhuma: o glúon e o Higgs.
  { id: 'up', simbolo: 'u', nome: 'Quark up', curto: 'up', sinonimos: ['Up', 'Quark cima'], familia: 'quark', geracao: 1, cargaTercos: 2, spinMeios: 1, linha: 1, coluna: 1 },
  { id: 'charm', simbolo: 'c', nome: 'Quark charm', curto: 'charm', sinonimos: ['Charm', 'Quark charme', 'Charme'], familia: 'quark', geracao: 2, cargaTercos: 2, spinMeios: 1, linha: 1, coluna: 2 },
  { id: 'top', simbolo: 't', nome: 'Quark top', curto: 'top', sinonimos: ['Top', 'Quark topo'], familia: 'quark', geracao: 3, cargaTercos: 2, spinMeios: 1, linha: 1, coluna: 3 },
  { id: 'gluon', simbolo: 'g', nome: 'Glúon', curto: 'glúon', sinonimos: [], familia: 'gauge', geracao: null, cargaTercos: 0, spinMeios: 2, linha: 1, coluna: 4 },
  { id: 'higgs', simbolo: 'H', nome: 'Bóson de Higgs', curto: 'Higgs', sinonimos: ['Higgs'], familia: 'escalar', geracao: null, cargaTercos: 0, spinMeios: 0, linha: 1, coluna: 5 },

  // Linha 2 — quarks de carga −1/3, e o fóton.
  { id: 'down', simbolo: 'd', nome: 'Quark down', curto: 'down', sinonimos: ['Down', 'Quark baixo'], familia: 'quark', geracao: 1, cargaTercos: -1, spinMeios: 1, linha: 2, coluna: 1 },
  { id: 'strange', simbolo: 's', nome: 'Quark strange', curto: 'strange', sinonimos: ['Strange', 'Quark estranho'], familia: 'quark', geracao: 2, cargaTercos: -1, spinMeios: 1, linha: 2, coluna: 2 },
  { id: 'bottom', simbolo: 'b', nome: 'Quark bottom', curto: 'bottom', sinonimos: ['Bottom', 'Quark fundo', 'Quark beleza'], familia: 'quark', geracao: 3, cargaTercos: -1, spinMeios: 1, linha: 2, coluna: 3 },
  { id: 'foton', simbolo: 'γ', nome: 'Fóton', curto: 'fóton', sinonimos: [], familia: 'gauge', geracao: null, cargaTercos: 0, spinMeios: 2, linha: 2, coluna: 4 },

  // Linha 3 — léptons carregados, e o Z.
  { id: 'eletron', simbolo: 'e', nome: 'Elétron', curto: 'elétron', sinonimos: [], familia: 'lepton', geracao: 1, cargaTercos: -3, spinMeios: 1, linha: 3, coluna: 1 },
  { id: 'muon', simbolo: 'μ', nome: 'Múon', curto: 'múon', sinonimos: ['Lépton múon'], familia: 'lepton', geracao: 2, cargaTercos: -3, spinMeios: 1, linha: 3, coluna: 2 },
  { id: 'tau', simbolo: 'τ', nome: 'Tau', curto: 'tau', sinonimos: ['Táuon', 'Lépton tau'], familia: 'lepton', geracao: 3, cargaTercos: -3, spinMeios: 1, linha: 3, coluna: 3 },
  { id: 'boson-z', simbolo: 'Z', nome: 'Bóson Z', curto: 'bóson Z', sinonimos: [], familia: 'gauge', geracao: null, cargaTercos: 0, spinMeios: 2, linha: 3, coluna: 4 },

  // Linha 4 — neutrinos, e o W.
  { id: 'neutrino-eletron', simbolo: 'νe', nome: 'Neutrino do elétron', curto: 'ν elétron', sinonimos: ['Neutrino eletrônico'], familia: 'lepton', geracao: 1, cargaTercos: 0, spinMeios: 1, linha: 4, coluna: 1 },
  { id: 'neutrino-muon', simbolo: 'νμ', nome: 'Neutrino do múon', curto: 'ν múon', sinonimos: ['Neutrino muônico'], familia: 'lepton', geracao: 2, cargaTercos: 0, spinMeios: 1, linha: 4, coluna: 2 },
  { id: 'neutrino-tau', simbolo: 'ντ', nome: 'Neutrino do tau', curto: 'ν tau', sinonimos: ['Neutrino tauônico', 'Neutrino do táuon'], familia: 'lepton', geracao: 3, cargaTercos: 0, spinMeios: 1, linha: 4, coluna: 3 },
  { id: 'boson-w', simbolo: 'W±', nome: 'Bóson W', curto: 'bóson W', sinonimos: [], familia: 'gauge', geracao: null, cargaTercos: 3, spinMeios: 2, linha: 4, coluna: 4 },
]

/** Todas as grafias que valem para uma partícula, canônica na frente. */
export const formasAceitas = (p: Particula): readonly string[] => [p.nome, ...p.sinonimos]

/**
 * A carga elétrica escrita como fração, para o tooltip: "+2/3", "−1", "0".
 *
 * O menos é U+2212, e não o hífen do teclado: a célula está em fonte mono e o
 * hífen ali fica curto demais para ser lido como sinal. O `±` do W é o único
 * caso em que o sinal não é um só, e vem do símbolo, não daqui.
 */
export function cargaEmFracao(p: Particula): string {
  const { cargaTercos } = p
  if (cargaTercos === 0) return '0'

  const sinal = p.id === 'boson-w' ? '±' : cargaTercos > 0 ? '+' : '−'
  const modulo = Math.abs(cargaTercos)
  return modulo % 3 === 0 ? `${sinal}${modulo / 3}` : `${sinal}${modulo}/3`
}

/** O spin como fração: "1/2", "1", "0". Mesmo motivo de `cargaEmFracao`. */
export const spinEmFracao = (p: Particula): string =>
  p.spinMeios % 2 === 0 ? String(p.spinMeios / 2) : `${p.spinMeios}/2`
