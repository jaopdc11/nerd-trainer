/**
 * Os seis biomas brasileiros e como eles se repartem dentro de cada UF.
 *
 * **Por que a composição é uma lista e não um campo `bioma` por estado.** O
 * dado real é uma repartição: Minas Gerais é Cerrado *e* Mata Atlântica *e* um
 * pedaço de Caatinga. Guardar só o predominante caberia numa linha a menos e
 * mentiria por omissão — a pergunta "qual o bioma de Minas?" não tem resposta
 * única, e um dataset que finge que tem empurra a mentira para dentro do jogo,
 * onde ninguém mais consegue ver. Guardando a repartição inteira, quem quer o
 * predominante chama `dominantes()` e recebe **um ou dois** nomes, conforme o
 * dado permita.
 *
 * **Fonte.** Mapa de Biomas do Brasil do IBGE, escala 1:250.000 (revisão de
 * 2019) — o mesmo recorte oficial que o Código Florestal e o PRODES usam. Os
 * percentuais estão arredondados ao inteiro e servem para **ordenar**, não para
 * citar: o jogo nunca os exibe, e o teste só cobra que somem 100 e que a ordem
 * decrescente se sustente. Não há aqui uma vírgula de precisão que a fonte não
 * dê.
 *
 * **O que este arquivo deliberadamente NÃO tem: geometria.** Bioma não é união
 * de UF — a linha entre Cerrado e Mata Atlântica corta Minas no meio, e não
 * existe contorno de bioma em `estados-mapa.ts` nem vai passar a existir por
 * conveniência de jogo. Ver `src/games/biomas.ts` para o que isso custou ao
 * desenho da mecânica.
 */

import { ESTADOS } from './estados'

export const BIOMAS = [
  'Amazônia',
  'Cerrado',
  'Mata Atlântica',
  'Caatinga',
  'Pampa',
  'Pantanal',
] as const

export type Bioma = (typeof BIOMAS)[number]

export interface FichaBioma {
  readonly nome: Bioma
  /** Outros nomes correntes. A tolerância a erro de digitação é assunto do jogo. */
  readonly sinonimos: readonly string[]
  /**
   * Percentual do território brasileiro (IBGE 2019). Existe para **ordenar** —
   * "o maior", "o menor" — e é isso que o teste cobra. Nenhuma tela mostra este
   * número.
   */
  readonly fracaoBrasil: number
  /**
   * Frases que identificam o bioma sozinhas, viram carta no baralho.
   *
   * Regra para entrar aqui: a frase tem de ser verdadeira **e** falsa para os
   * outros cinco. "Tem árvore" não entra; "só existe no Rio Grande do Sul"
   * entra, e o teste confere essa segunda metade contra a própria composição.
   */
  readonly pistas: readonly string[]
}

/**
 * Áreas: Amazônia 49,5%, Cerrado 23,9%, Mata Atlântica 13,0%, Caatinga 9,9%,
 * Pampa 2,1%, Pantanal 1,8% do território (IBGE 2019). Somam 100,2 pelo
 * arredondamento da fonte, e o teste aceita essa folga em vez de eu "consertar"
 * um número para fechar a conta — corrigir o dado para agradar o teste é
 * exatamente o vício que o teste existe para pegar.
 */
export const FICHAS: readonly FichaBioma[] = [
  {
    nome: 'Amazônia',
    // "Amazônia Legal" NÃO entra: são nove estados inteiros por definição de lei
    // federal, um recorte administrativo que inclui todo o Tocantins e todo o
    // Maranhão a oeste do meridiano 44 — terra que é Cerrado. Aceitá-la aqui
    // ensinaria a confundir bioma com política de desenvolvimento regional.
    sinonimos: ['Floresta Amazônica'],
    fracaoBrasil: 49.5,
    pistas: [
      'Ocupa quase metade do território brasileiro e aparece em nove das 27 UFs.',
      'Bioma que cobre sozinho o Acre, o Amazonas, o Amapá, o Pará e Roraima inteiros.',
    ],
  },
  {
    nome: 'Cerrado',
    sinonimos: ['Savana brasileira'],
    fracaoBrasil: 23.9,
    pistas: [
      'Segundo maior bioma do país: árvores baixas de casca grossa e tronco retorcido.',
      'É o bioma do Distrito Federal, de Goiás e do Tocantins — a "caixa d\'água" de três grandes bacias.',
    ],
  },
  {
    nome: 'Mata Atlântica',
    sinonimos: ['Floresta Atlântica'],
    fracaoBrasil: 13.0,
    pistas: [
      'Bioma que cobre o Rio de Janeiro, o Espírito Santo e Santa Catarina por inteiro.',
      'Acompanha a costa de norte a sul e é onde mora a maior parte da população brasileira.',
    ],
  },
  {
    nome: 'Caatinga',
    // "Sertão" fica de fora pelo mesmo motivo da Amazônia Legal: é recorte de
    // paisagem e de cultura, não nome de bioma — há sertão dentro do Cerrado,
    // e o Grande Sertão de Guimarães Rosa é veredas, não caatinga.
    sinonimos: [],
    fracaoBrasil: 9.9,
    pistas: [
      'Único bioma que existe só no Brasil: nenhum pedaço dele cai em outro país.',
      'Vegetação espinhosa que derruba a folha na seca — mandacaru, juazeiro, umbuzeiro.',
    ],
  },
  {
    nome: 'Pampa',
    sinonimos: ['Campos Sulinos', 'Pampas'],
    fracaoBrasil: 2.1,
    pistas: [
      'No Brasil só existe no Rio Grande do Sul, e é lá o bioma de maior área.',
      'Campo de gramíneas do extremo sul, que continua no Uruguai e na Argentina.',
    ],
  },
  {
    nome: 'Pantanal',
    sinonimos: ['Pantanal Mato-Grossense', 'Complexo do Pantanal'],
    fracaoBrasil: 1.8,
    pistas: [
      'Menor bioma brasileiro em área: uma planície que alaga e seca todo ano.',
      'Só aparece em dois estados, Mato Grosso e Mato Grosso do Sul, e não é o maior em nenhum dos dois.',
    ],
  },
]

/** Uma fatia da área de uma UF. `pct` em pontos percentuais, inteiro. */
export interface Fatia {
  readonly bioma: Bioma
  readonly pct: number
}

/**
 * Repartição de biomas por UF, em ordem decrescente de área.
 *
 * Fatias abaixo de 1% não entram: no 1:250.000 elas são ruído de fronteira, e
 * listá-las daria ao dataset uma resolução que ele não tem. É por isso que
 * algumas linhas somam 100 com dois biomas e outras com três.
 */
export const COMPOSICAO: Readonly<Record<string, readonly Fatia[]>> = {
  AC: [{ bioma: 'Amazônia', pct: 100 }],
  AL: [
    { bioma: 'Mata Atlântica', pct: 52 },
    { bioma: 'Caatinga', pct: 48 },
  ],
  AP: [{ bioma: 'Amazônia', pct: 100 }],
  AM: [{ bioma: 'Amazônia', pct: 100 }],
  BA: [
    { bioma: 'Caatinga', pct: 54 },
    { bioma: 'Cerrado', pct: 27 },
    { bioma: 'Mata Atlântica', pct: 19 },
  ],
  CE: [
    { bioma: 'Caatinga', pct: 93 },
    { bioma: 'Mata Atlântica', pct: 7 },
  ],
  DF: [{ bioma: 'Cerrado', pct: 100 }],
  ES: [{ bioma: 'Mata Atlântica', pct: 100 }],
  GO: [
    { bioma: 'Cerrado', pct: 97 },
    { bioma: 'Mata Atlântica', pct: 3 },
  ],
  MA: [
    { bioma: 'Cerrado', pct: 65 },
    { bioma: 'Amazônia', pct: 34 },
    { bioma: 'Caatinga', pct: 1 },
  ],
  MT: [
    { bioma: 'Amazônia', pct: 54 },
    { bioma: 'Cerrado', pct: 39 },
    { bioma: 'Pantanal', pct: 7 },
  ],
  MS: [
    { bioma: 'Cerrado', pct: 61 },
    { bioma: 'Pantanal', pct: 25 },
    { bioma: 'Mata Atlântica', pct: 14 },
  ],
  MG: [
    { bioma: 'Cerrado', pct: 57 },
    { bioma: 'Mata Atlântica', pct: 41 },
    { bioma: 'Caatinga', pct: 2 },
  ],
  PA: [{ bioma: 'Amazônia', pct: 100 }],
  PB: [
    { bioma: 'Caatinga', pct: 92 },
    { bioma: 'Mata Atlântica', pct: 8 },
  ],
  PR: [
    { bioma: 'Mata Atlântica', pct: 98 },
    { bioma: 'Cerrado', pct: 2 },
  ],
  PE: [
    { bioma: 'Caatinga', pct: 83 },
    { bioma: 'Mata Atlântica', pct: 17 },
  ],
  PI: [
    { bioma: 'Caatinga', pct: 64 },
    { bioma: 'Cerrado', pct: 36 },
  ],
  RJ: [{ bioma: 'Mata Atlântica', pct: 100 }],
  RN: [
    { bioma: 'Caatinga', pct: 95 },
    { bioma: 'Mata Atlântica', pct: 5 },
  ],
  RS: [
    { bioma: 'Pampa', pct: 63 },
    { bioma: 'Mata Atlântica', pct: 37 },
  ],
  RO: [
    { bioma: 'Amazônia', pct: 99 },
    { bioma: 'Cerrado', pct: 1 },
  ],
  RR: [{ bioma: 'Amazônia', pct: 100 }],
  SC: [{ bioma: 'Mata Atlântica', pct: 100 }],
  SP: [
    { bioma: 'Mata Atlântica', pct: 78 },
    { bioma: 'Cerrado', pct: 22 },
  ],
  SE: [
    { bioma: 'Mata Atlântica', pct: 51 },
    { bioma: 'Caatinga', pct: 49 },
  ],
  TO: [
    { bioma: 'Cerrado', pct: 91 },
    { bioma: 'Amazônia', pct: 9 },
  ],
}

/**
 * Diferença, em pontos percentuais, abaixo da qual dois biomas são considerados
 * **empatados** numa UF.
 *
 * Dez pontos, e o número não é estético. Alagoas está em 52/48 e Sergipe em
 * 51/49 entre Mata Atlântica e Caatinga; a fonte arredonda ao inteiro e mapas
 * de biomas de edições diferentes já inverteram essas duas UFs. Cobrar um único
 * nome ali seria cobrar de qual edição do mapa o jogador se lembra. Acima de
 * dez pontos — Minas em 57/41, Mato Grosso em 54/39, Rio Grande do Sul em 63/37
 * — a ordem é estável entre edições e o predominante é um fato dizível.
 */
export const MARGEM_DE_EMPATE = 10

/**
 * O bioma predominante de uma UF, ou **os dois** quando a diferença cabe dentro
 * de `MARGEM_DE_EMPATE`.
 *
 * Devolve lista, e não um nome, porque é isso que o dado é. A alternativa —
 * devolver sempre o primeiro da lista — deixaria o chamador achando que recebeu
 * um fato quando em Alagoas recebeu um desempate de quatro pontos percentuais.
 */
export function dominantes(sigla: string): readonly Bioma[] {
  const fatias = COMPOSICAO[sigla]
  if (!fatias || fatias.length === 0) throw new Error(`UF sem composição de biomas: ${sigla}`)

  const lider = fatias[0] as Fatia
  return fatias.filter((f) => lider.pct - f.pct < MARGEM_DE_EMPATE).map((f) => f.bioma)
}

/** Todos os biomas presentes na UF, inclusive as fatias pequenas. */
export function biomasDaUf(sigla: string): readonly Bioma[] {
  const fatias = COMPOSICAO[sigla]
  if (!fatias) throw new Error(`UF sem composição de biomas: ${sigla}`)
  return fatias.map((f) => f.bioma)
}

/** As UFs onde o bioma aparece, em qualquer proporção. Ordem de `ESTADOS`. */
export function ufsDoBioma(bioma: Bioma): readonly string[] {
  return ESTADOS.map((e) => e.sigla).filter((s) => biomasDaUf(s).includes(bioma))
}

export function fichaDo(bioma: Bioma): FichaBioma {
  const ficha = FICHAS.find((f) => f.nome === bioma)
  if (!ficha) throw new Error(`bioma sem ficha: ${bioma}`)
  return ficha
}
