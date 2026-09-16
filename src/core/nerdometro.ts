import { JOGOS } from './registry'
import type { Banco } from './storage'
import { CATEGORIAS } from './types'
import type { Categoria } from './types'

/**
 * A nota de nerd: 0 a 100.
 *
 * O desenho tem três decisões que importam:
 *
 * 1. **Cada jogo tem uma meta, não o total.** Decorar 118 elementos vale 100%,
 *    mas ninguém decora 10 mil casas de π — a meta de π é 100 casas, que já é
 *    coisa de gente obsessiva. Usar o total como denominador faria a nota
 *    depender de quantas casas eu resolvi embutir no dataset, o que é arbitrário.
 * 2. **Conhecimento pesa mais que velocidade.** Saber a tabela periódica diz
 *    mais sobre alguém do que somar rápido. O peso vai de 1 a 3; ver o
 *    comentário de `CRITERIOS`, que explica por que peso e meta não são a mesma
 *    alavanca.
 * 3. **Só jogo jogado entra na conta.** A nota é o desempenho no que foi
 *    jogado, e jogo intocado fica fora do numerador *e* do denominador.
 *
 *    Era o contrário: jogo não jogado contava zero, o que fazia a nota medir
 *    "quanto do Nerd Trainer você domina". Parece inocente e não é — o
 *    denominador era a soma dos pesos de todos os critérios, então **lançar um
 *    jogo novo derrubava a nota de todo mundo retroativamente**. Três jogos de
 *    química a mais levavam um 62 para 48 sem ninguém jogar um dia pior, e a
 *    nota deixava de ser comparável com ela mesma entre duas versões do app.
 *
 *    O que se perde é a trava que impedia tirar 100 maxando um jogo só. Ela
 *    agora vive no mostrador, não na fórmula: a nota anda sempre acompanhada de
 *    "em N de M jogos", e um "100 · em 1 de 15 jogos" se denuncia sozinho.
 *    Misturar cobertura dentro da conta era justamente o que diluía.
 * 4. **A fração entra numa curva de retorno decrescente.** Ver `CURVA`. Num
 *    medidor que cobre vinte e tantas áreas, tratar 0→50% e 50→100% como o
 *    mesmo esforço pune quem faz o que o app pede.
 */

export const AREAS = ['memoria', 'sequencia', 'velocidade'] as const
export type Area = (typeof AREAS)[number]

export const ROTULO_AREA: Record<Area, string> = {
  memoria: 'Repertório',
  sequencia: 'Sequências',
  velocidade: 'Cálculo',
}

export const DESCRICAO_AREA: Record<Area, string> = {
  memoria: 'conteúdo decorado: elementos, fórmulas, constantes, símbolos',
  sequencia: 'dígitos e termos em ordem, sem errar nenhum',
  velocidade: 'contas e derivadas contra o relógio',
}

export interface Criterio {
  readonly jogoId: string
  /** Pontuação que vale nota cheia naquele jogo. */
  readonly meta: number
  readonly peso: number
  readonly area: Area
}

/**
 * Peso e meta fazem coisas diferentes, e confundir as duas custou caro aqui.
 *
 * **Peso não soma ponto: ele amplifica a sua fração.** A nota é
 * `Σ(fração × peso) / Σ(peso)`, então subir o peso de um jogo em que você vai
 * mal puxa a média *para baixo*, não para cima. Peso 3 num jogo onde você tem
 * 20% machuca três vezes mais. Ele responde "quanto este jogo fala sobre
 * alguém", não "quanto este jogo é difícil".
 *
 * **Quem paga a dificuldade é a meta.** E era aqui que estava o erro: países e
 * bandeiras nasceram com meta 195, o dataset inteiro. Isso contraria a regra
 * número 1 deste arquivo — π tem meta 100 e não as milhares de casas
 * embutidas, porque a meta é o que dá para decorar de verdade. Saber 150
 * países já é coisa de gente muito fora da curva; exigir os 195 para dar nota
 * cheia transformava dois dos jogos maiores em poço sem fundo.
 *
 * A escala de peso tem três degraus:
 *   3 — feito de repertório grande, de dezenas a centenas de itens
 *   2 — repertório de tamanho normal
 *   1 — cronometrado, que treina reflexo e não acervo
 */
export const CRITERIOS: readonly Criterio[] = [
  // 4 — os grandes feitos de repertório. Saber isto diz muito sobre alguém.
  { jogoId: 'tabela-periodica', meta: 118, peso: 4, area: 'memoria' },
  { jogoId: 'paises', meta: 195, peso: 4, area: 'memoria' },
  { jogoId: 'bandeiras', meta: 120, peso: 4, area: 'memoria' },
  { jogoId: 'capitais', meta: 130, peso: 4, area: 'memoria' },

  // 3 — repertório duro, ou o feito que é sinônimo de nerd.
  { jogoId: 'pi', meta: 100, peso: 3, area: 'sequencia' },
  { jogoId: 'constantes-fisicas', meta: 14, peso: 3, area: 'memoria' },
  { jogoId: 'formulas', meta: 54, peso: 3, area: 'memoria' },

  // 2 — repertório fechado e decorável.
  { jogoId: 'alfabeto-grego', meta: 24, peso: 2, area: 'memoria' },
  { jogoId: 'prefixos-si', meta: 24, peso: 2, area: 'memoria' },
  { jogoId: 'geometria-molecular', meta: 32, peso: 2, area: 'memoria' },
  { jogoId: 'filosofia', meta: 45, peso: 2, area: 'memoria' },
  { jogoId: 'sociologia', meta: 32, peso: 2, area: 'memoria' },
  { jogoId: 'estados', meta: 27, peso: 2, area: 'memoria' },
  { jogoId: 'capitais-estados', meta: 27, peso: 2, area: 'memoria' },

  // 1 — sequências curtas e cronometrados: treinam reflexo, não acervo.
  { jogoId: 'e', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'phi', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'raiz-2', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'primos', meta: 40, peso: 1, area: 'sequencia' },
  { jogoId: 'fibonacci', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'potencias-2', meta: 40, peso: 1, area: 'sequencia' },
  { jogoId: 'derivadas-rapidas', meta: 25, peso: 1, area: 'velocidade' },
  { jogoId: 'ordem-de-grandeza', meta: 25, peso: 1, area: 'velocidade' },
  { jogoId: 'nox', meta: 25, peso: 1, area: 'velocidade' },
  { jogoId: 'massa-molar', meta: 25, peso: 1, area: 'velocidade' },
  { jogoId: 'cronologia', meta: 30, peso: 1, area: 'velocidade' },

  // 0,5 — somar rápido é a coisa que menos diz sobre repertório. Peso
  // fracionário existe para isto: não havia degrau abaixo de 1 e "cálculo
  // rápido valendo o mesmo que decorar as constantes" era desproporcional.
  { jogoId: 'aritmetica', meta: 40, peso: 0.5, area: 'velocidade' },
]

export interface LinhaNerdometro {
  readonly jogoId: string
  readonly nome: string
  readonly icone: string
  readonly area: Area
  /**
   * A matéria do jogo, vinda de `JOGOS` — é a mesma divisão do menu, e é
   * ortogonal à área: "Repertório" corta geografia e química ao mesmo tempo.
   * `null` só se o critério apontar para um jogo inexistente.
   */
  readonly categoria: Categoria | null
  readonly recorde: number
  readonly meta: number
  /** 0 a 1. */
  readonly fracao: number
  readonly peso: number
  /** Quanto a nota final sobe se este jogo for ao máximo. */
  readonly potencial: number
  readonly partidas: number
  /** Chegou na meta. */
  readonly dominado: boolean
}

export interface NotaArea {
  readonly area: Area
  /** 0 a 100 dentro da própria área. */
  readonly nota: number
  readonly dominados: number
  readonly jogos: number
}

export interface NotaCategoria {
  readonly categoria: Categoria
  /**
   * 0 a 100 dentro da própria matéria, pela mesma regra da nota geral.
   *
   * `null` — e não 0 — quando nenhum jogo da matéria foi jogado: zero é um
   * desempenho ruim, "não jogou" é ausência de desempenho, e o mostrador
   * precisa dizer coisas diferentes para cada um.
   */
  readonly nota: number | null
  readonly jogados: number
  readonly dominados: number
  readonly jogos: number
}

export interface Faixa {
  readonly minimo: number
  readonly titulo: string
  readonly lema: string
}

export const FAIXAS: readonly Faixa[] = [
  { minimo: 95, titulo: 'Tem fórmula tatuada', lema: 'cara, vai arrumar uma namorada' },
  {
    minimo: 85,
    titulo: 'Perigo em jantar de família',
    lema: 'no churrasco ninguém mais senta do seu lado',
  },
  {
    minimo: 70,
    titulo: 'Enciclopédia ambulante',
    lema: 'seu último date foi explicando a tabela periódica',
  },
  {
    minimo: 55,
    titulo: 'Nerd de carteirinha',
    lema: 'seus amigos já mudam de assunto quando você começa a falar',
  },
  { minimo: 40, titulo: 'Nerd assumido', lema: 'assumiu de vez, agora não tem volta' },
  {
    minimo: 25,
    titulo: 'Estudante aplicado',
    lema: 'ainda dá pra fingir que é normal, aproveita',
  },
  { minimo: 10, titulo: 'Curioso', lema: 'fraco. nem nerd direito você é' },
  { minimo: 1, titulo: 'Só passando', lema: 'entrou, se assustou e fugiu' },
  { minimo: 0, titulo: 'Ainda não começou', lema: 'zero. abriu isso aqui pra quê?' },
]

/** Um jogo, e a pontuação a fazer nele. Ver `montarComoSubir`. */
export interface PassoParaSubir {
  readonly jogoId: string
  readonly nome: string
  readonly icone: string
  /** A pontuação a alcançar naquele jogo. */
  readonly alvo: number
  /** `alvo - recorde`: o que falta conquistar. */
  readonly faltam: number
  readonly partidas: number
}

export interface Nerdometro {
  /** 0 a 100. */
  readonly nota: number
  readonly faixa: Faixa
  /** A próxima faixa, e quantos pontos faltam. `null` no topo. */
  readonly proximaFaixa: { readonly faixa: Faixa; readonly falta: number } | null
  /**
   * O que fazer para subir de faixa: até 3 jogos com a pontuação exata que,
   * **sozinha**, levaria a nota ao mínimo da próxima faixa. Vazio no topo.
   */
  readonly comoSubir: readonly PassoParaSubir[]
  /**
   * Nenhum jogo sozinho alcança a próxima faixa — `comoSubir` traz então os que
   * mais aproximam, e a tela precisa dizer que o caminho passa por mais de um.
   */
  readonly subirPedeMaisDeUmJogo: boolean
  readonly linhas: readonly LinhaNerdometro[]
  readonly areas: readonly NotaArea[]
  /** A mesma nota, recortada pelas matérias do menu. */
  readonly categorias: readonly NotaCategoria[]
  /** Onde há mais nota a ganhar. */
  readonly proximoPasso: LinhaNerdometro | null
  readonly jogados: number
  readonly total: number
  readonly dominados: number
  readonly partidas: number
  /** Tempo somado de todas as partidas registradas, em ms. */
  readonly tempoMs: number
}

/**
 * Média ponderada sobre os jogos jogados, opcionalmente fingindo que um deles
 * está no máximo — é assim que sai o `potencial` de cada linha.
 *
 * Um jogo intocado que vai ao máximo entra também no denominador. Ainda assim
 * nunca derruba a nota: com `fracao ≤ 1` vale sempre `soma ≤ peso`, e daí
 * `(soma+p)/(peso+p) ≥ soma/peso`. No máximo empata, quando tudo que foi
 * jogado já está no teto.
 */
/**
 * A curva de retorno decrescente.
 *
 * A fração crua é linear, e linear está errado aqui: ir de 0 a 40 países leva
 * uma tarde, de 140 a 150 leva semanas. A escala linear diz que o primeiro
 * trecho vale 40 e o segundo vale 10, quando o esforço é o contrário. Num
 * medidor que cobre 18 áreas, isso pune exatamente quem faz o que o app pede —
 * saber de tudo um pouco — e premia quem mói um jogo só.
 *
 * `0.65` foi escolhido contra dados reais de uma sessão de um dia: 66% da
 * tabela periódica passa a valer 76, e 29% dos países passa a valer 44. Os dois
 * extremos continuam honestos — 100% continua 100%, e uma partida abandonada no
 * primeiro card (1 de 120) sobe de 1% para 4%, ou seja, a curva não resgata
 * lixo.
 */
export const CURVA = 0.65

const comCurva = (fracao: number) => fracao ** CURVA

function media(
  linhas: readonly LinhaNerdometro[],
  noMaximo?: string,
  filtro?: (l: LinhaNerdometro) => boolean,
): number {
  let soma = 0
  let peso = 0

  for (const l of linhas) {
    if (filtro && !filtro(l)) continue
    const cheio = l.jogoId === noMaximo
    if (!cheio && l.recorde === 0) continue
    soma += comCurva(cheio ? 1 : l.fracao) * l.peso
    peso += l.peso
  }

  return peso === 0 ? 0 : (soma * 100) / peso
}

/**
 * A mesma média, fingindo uma pontuação diferente num jogo — a base de toda a
 * recomendação de "como subir".
 *
 * Repare que um jogo intocado que recebe pontuação entra também no denominador:
 * é por isso que não dá para inverter a fórmula tratando o peso total como
 * constante, e é por isso que ele pode até *baixar* a nota se a pontuação for
 * fraca. A busca lida com os dois casos sem precisar saber qual é qual.
 */
function mediaCom(
  linhas: readonly LinhaNerdometro[],
  jogoId: string,
  pontuacao: number,
): number {
  let soma = 0
  let peso = 0

  for (const l of linhas) {
    const p = l.jogoId === jogoId ? pontuacao : l.recorde
    if (p <= 0) continue
    soma += comCurva(Math.min(1, p / l.meta)) * l.peso
    peso += l.peso
  }

  return peso === 0 ? 0 : (soma * 100) / peso
}

/** No máximo 3: uma lista de tarefas mais longa que isso não é recomendação. */
const MAX_COMO_SUBIR = 3

/**
 * A menor pontuação neste jogo que, sozinha, faz a nota geral alcançar
 * `minimo`. `null` se nem a meta cheia chega lá.
 *
 * Busca binária em vez de inversão algébrica: a nota exibida é
 * `Math.round(base)`, o denominador muda quando um jogo intocado entra, e a
 * curva tem expoente fracionário — inverter isso na mão dá três casos e um erro
 * de arredondamento. O domínio é de 1 até a meta (no máximo 195 valores), e a
 * nota é monótona não-decrescente em `pontuacao` dentro dele (o jogo já está no
 * denominador a partir de 1 ponto), então a busca é exata.
 */
function alvoParaFaixa(
  linhas: readonly LinhaNerdometro[],
  linha: LinhaNerdometro,
  minimo: number,
): number | null {
  let baixo = Math.max(1, linha.recorde + 1)
  let alto = linha.meta

  if (baixo > alto) return null
  if (Math.round(mediaCom(linhas, linha.jogoId, alto)) < minimo) return null

  while (baixo < alto) {
    const meio = Math.floor((baixo + alto) / 2)
    if (Math.round(mediaCom(linhas, linha.jogoId, meio)) >= minimo) alto = meio
    else baixo = meio + 1
  }

  return baixo
}

/**
 * A ordem da recomendação — e esta é uma decisão de produto, não de matemática.
 *
 * O ranking óbvio seria "quem rende mais nota", que é o `potencial`. Ele está
 * errado aqui: o jogo que mais rende é quase sempre um de peso 4 e meta grande
 * que a pessoa nunca abriu, e mandar alguém decorar 130 capitais do zero não é
 * conselho, é desistência disfarçada. A recomendação só vale se for **feita**.
 *
 * Então o critério é probabilidade de execução, feita de dois sinais:
 *
 * - **familiaridade** — `partidas` daquele jogo, o único sinal honesto de "eu
 *   gosto deste". Entra em `log2`, porque a diferença entre 2 e 8 partidas diz
 *   muito e entre 40 e 60 não diz nada; sem a compressão, o jogo viciado
 *   esmagaria todo o resto da lista.
 * - **salto** — quanto falta do recorde até o alvo, medido em frações da meta
 *   do próprio jogo. Em pontos crus não dá para comparar: 10 pontos em π (meta
 *   100) e 10 em derivadas (meta 25) são esforços diferentes.
 *
 * `(familiaridade + 0.3) / (0.25 + salto)`. O `+0.3` mantém um jogo nunca
 * jogado na disputa — ele fica atrás de qualquer jogo conhecido, mas a ordem
 * *entre* os desconhecidos passa a ser pelo menor salto, em vez de um empate em
 * zero resolvido pela ordem de `CRITERIOS`. O `0.25` no denominador impede que
 * um salto minúsculo ("faltam 2 pontos") vire uma divisão por quase zero e
 * domine sozinho a lista.
 */
function prioridade(linha: LinhaNerdometro, alvo: number): number {
  const familiaridade = Math.log2(1 + linha.partidas)
  const salto = (alvo - linha.recorde) / linha.meta
  return (familiaridade + 0.3) / (0.25 + salto)
}

function passo(linha: LinhaNerdometro, alvo: number): PassoParaSubir {
  return {
    jogoId: linha.jogoId,
    nome: linha.nome,
    icone: linha.icone,
    alvo,
    faltam: alvo - linha.recorde,
    partidas: linha.partidas,
  }
}

function montarComoSubir(
  linhas: readonly LinhaNerdometro[],
  minimo: number | null,
): { comoSubir: readonly PassoParaSubir[]; subirPedeMaisDeUmJogo: boolean } {
  // Já na faixa mais alta: não há o que recomendar.
  if (minimo === null) return { comoSubir: [], subirPedeMaisDeUmJogo: false }

  // Jogo no máximo não entra: não há pontuação a pedir dele.
  const candidatos = linhas.filter((l) => l.recorde < l.meta)

  const alcancam = candidatos
    .map((linha) => ({ linha, alvo: alvoParaFaixa(linhas, linha, minimo) }))
    .filter((c): c is { linha: LinhaNerdometro; alvo: number } => c.alvo !== null)

  if (alcancam.length > 0) {
    return {
      comoSubir: alcancam
        .sort((a, b) => prioridade(b.linha, b.alvo) - prioridade(a.linha, a.alvo))
        .slice(0, MAX_COMO_SUBIR)
        .map((c) => passo(c.linha, c.alvo)),
      subirPedeMaisDeUmJogo: false,
    }
  }

  // Ninguém sozinho chega lá. Em vez de inventar um alvo que não cumpre o que
  // promete, devolvemos os que mais aproximam — aqui o critério volta a ser o
  // rendimento puro (`potencial`), porque a pergunta mudou de "o que você faria"
  // para "por onde o caminho passa".
  return {
    comoSubir: [...candidatos]
      .sort((a, b) => b.potencial - a.potencial)
      .slice(0, MAX_COMO_SUBIR)
      .map((l) => passo(l, l.meta)),
    subirPedeMaisDeUmJogo: candidatos.length > 0,
  }
}

export function calcular(banco: Banco): Nerdometro {
  const cru = CRITERIOS.map((c) => {
    const jogo = JOGOS.find((j) => j.id === c.jogoId)
    const entrada = banco.entradas[c.jogoId]
    const recorde = entrada?.recorde.pontuacao ?? 0
    const fracao = Math.min(1, recorde / c.meta)

    return {
      jogoId: c.jogoId,
      nome: jogo?.nome ?? c.jogoId,
      icone: jogo?.icone ?? '?',
      area: c.area,
      categoria: jogo?.categoria ?? null,
      recorde,
      meta: c.meta,
      fracao,
      peso: c.peso,
      potencial: 0,
      partidas: entrada?.partidas ?? 0,
      dominado: fracao >= 1,
    }
  })

  const base = media(cru)

  // O potencial precisa da nota inteira recalculada, não de uma fração do peso
  // total: para um jogo ainda intocado, levá-lo ao máximo mexe nos dois lados
  // da divisão.
  const linhas: readonly LinhaNerdometro[] = cru.map((l) => ({
    ...l,
    potencial: media(cru, l.jogoId) - base,
  }))

  const nota = Math.round(base)

  const indiceFaixa = FAIXAS.findIndex((f) => nota >= f.minimo)
  const faixa = FAIXAS[indiceFaixa] ?? (FAIXAS[FAIXAS.length - 1] as Faixa)
  const acima = indiceFaixa > 0 ? FAIXAS[indiceFaixa - 1] : undefined

  const areas = AREAS.map((area): NotaArea => {
    const daArea = linhas.filter((l) => l.area === area)
    return {
      area,
      // Mesma regra da nota geral: área só conta o que foi jogado dentro dela.
      nota: Math.round(media(linhas, undefined, (l) => l.area === area)),
      dominados: daArea.filter((l) => l.dominado).length,
      jogos: daArea.length,
    }
  })

  const categorias = CATEGORIAS.map((categoria): NotaCategoria => {
    const daCategoria = linhas.filter((l) => l.categoria === categoria)
    const jogados = daCategoria.filter((l) => l.recorde > 0).length

    return {
      categoria,
      // Mesma `media`, mesmos pesos, mesma curva — só o filtro muda. Se a nota
      // por matéria tivesse fórmula própria, as duas divergiriam no primeiro
      // ajuste de balanceamento.
      nota: jogados === 0 ? null : Math.round(media(linhas, undefined, (l) => l.categoria === categoria)),
      jogados,
      dominados: daCategoria.filter((l) => l.dominado).length,
      jogos: daCategoria.length,
    }
  })

  // Tempo e partidas somam o banco inteiro, não só os critérios.
  const todas = Object.values(banco.entradas)

  const { comoSubir, subirPedeMaisDeUmJogo } = montarComoSubir(linhas, acima?.minimo ?? null)

  return {
    nota,
    faixa,
    proximaFaixa: acima ? { faixa: acima, falta: acima.minimo - nota } : null,
    comoSubir,
    subirPedeMaisDeUmJogo,
    linhas,
    areas,
    categorias,
    proximoPasso: [...linhas].sort((a, b) => b.potencial - a.potencial)[0] ?? null,
    jogados: linhas.filter((l) => l.recorde > 0).length,
    total: linhas.length,
    dominados: linhas.filter((l) => l.dominado).length,
    partidas: todas.reduce((s, e) => s + e.partidas, 0),
    tempoMs: todas.reduce(
      (s, e) => s + e.historico.reduce((t, p) => t + p.duracaoMs, 0),
      0,
    ),
  }
}
