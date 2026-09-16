/**
 * A escala de tempo geológico, do Hadeano ao Holoceno, com os limites em milhões
 * de anos.
 *
 * ## A lista desce de nível, e desce de propósito
 *
 * A escala é uma hierarquia — éon ⊃ era ⊃ período ⊃ época — e uma lista plana
 * teria de escolher **um** nível. Nenhum dos três sobrevive à escolha: só os
 * quatro éons dá quatro itens e nenhum dinossauro; só os doze períodos do
 * Fanerozoico apaga quatro bilhões de anos de Terra, que são 88% da história
 * dela; só as épocas é uma lista que a escola não cobra.
 *
 * O que o dataset faz é o que a própria escala faz: **fica mais fino perto do
 * presente**, porque é lá que o registro dá para ler. A lista tem três trechos,
 * um por nível, e a regra que os costura é uma só — *cada trecho abre o último
 * item do trecho anterior*:
 *
 * 1. Os quatro éons, do Hadeano ao **Fanerozoico**;
 * 2. os doze períodos do Fanerozoico, do Cambriano ao **Quaternário**;
 * 3. as duas épocas do Quaternário: Pleistoceno e Holoceno.
 *
 * Isso tem duas consequências boas. A primeira é que o tempo nunca anda para
 * trás: cada trecho subdivide o item recém-nomeado, em vez de voltar ao começo
 * de outra coisa. (A alternativa tentadora — terminar com as sete épocas do
 * Cenozoico, os sete "-cenos" — foi descartada exatamente por isso: depois de
 * "Quaternário" o jogador teria de voltar 66 milhões de anos até o Paleoceno,
 * e um item que anda para trás no meio de uma sequência cronológica é uma
 * armadilha de regulamento, não de geologia.) A segunda é que os limites fecham
 * sozinhos: o primeiro período começa onde o Fanerozoico começa, o último
 * termina onde ele termina, e o teste cobra as duas costuras.
 *
 * **As eras ficam de fora da lista e dentro do dado.** Paleozoico, Mesozoico e
 * Cenozoico seriam um quarto trecho de três itens cujos limites já são os dos
 * períodos — e, além disso, são o nível que todo mundo já recita de cor. Como
 * trecho, seriam três casas de graça; como campo `era`, dizem no gabarito a que
 * bloco cada período pertence, que é a informação que faltava.
 *
 * ## Continuidade é a propriedade que segura tudo em pé
 *
 * Dentro de cada trecho, cada intervalo começa exatamente onde o anterior
 * terminou — sem buraco e sem sobreposição —, e cada trecho cobre exatamente o
 * intervalo do pai. É a mesma exigência de `periodos-brasil.ts` e pela mesma
 * razão: um buraco significaria um pedaço da história da Terra que não pertence
 * a unidade nenhuma, e uma sobreposição significaria que "o que vem depois" não
 * tem resposta única. Aqui a exigência é mais forte que lá, porque há três
 * escalas encaixadas: o teste cobra as costuras internas **e** o encaixe de cada
 * trecho no pai.
 *
 * ## De onde vêm os números
 *
 * Da tabela cronoestratigráfica da IUGS/ICS (versão 2023), que é o padrão
 * internacional e o que os livros brasileiros mais recentes reproduzem. Os
 * valores são copiados como estão, sem arredondar, e isso é decisão:
 *
 * - **251,902 Ma** (limite Permiano–Triássico) tem três casas porque é um GSSP
 *   datado com essa precisão; arredondar para 252 quebraria a continuidade com
 *   o Permiano ou inventaria 98 mil anos de nada.
 * - **538,8 Ma** e não 541: o limite Ediacarano–Cambriano foi revisto em 2022.
 *   **143,1 Ma** e não 145, **201,4 Ma** e não 201,3, pelo mesmo motivo — quem
 *   estudou por tabela antiga vai achar estranho, e está certo em achar.
 * - **4.031 Ma** para o começo do Arqueano, e não os 4.000 redondos das tabelas
 *   anteriores; o Hadeano começa em **4.567 Ma**, que é a idade da formação da
 *   Terra e não um limite estratigráfico — é a única ponta do dataset que é uma
 *   medida astronômica disfarçada de fronteira.
 *
 * O jogo **não cobra número nenhum**: os limites existem para o gabarito e para
 * o teste de continuidade. Pedir "quando começa o Siluriano" com Enter mediria
 * decoreba de decimal, que é o contrário do que uma escala de tempo ensina.
 */

export const NIVEIS = ['éon', 'período', 'época'] as const
export type Nivel = (typeof NIVEIS)[number]

export const ERAS = ['Paleozoico', 'Mesozoico', 'Cenozoico'] as const
export type Era = (typeof ERAS)[number]

export interface Intervalo {
  readonly id: string
  /** O que se digita e o que aparece na fita. */
  readonly nome: string
  /** Formas aceitas. A primeira é sempre `nome` — conferido na carga. */
  readonly aceitas: readonly string[]
  readonly nivel: Nivel
  /** Id do intervalo que este subdivide. `null` só nos éons, que não têm pai. */
  readonly dentroDe: string | null
  /** A era do Fanerozoico a que pertence. `null` nos éons — era é nível de dentro. */
  readonly era: Era | null
  /** Milhões de anos atrás em que começa. Sempre maior que `fim`. */
  readonly inicio: number
  /** Milhões de anos atrás em que termina. 0 = agora. */
  readonly fim: number
  /** O que define o intervalo. É o que vai para o gabarito. */
  readonly marco: string
}

export const INTERVALOS: readonly Intervalo[] = [
  // ---- Trecho 1: os quatro éons -------------------------------------------
  {
    id: 'hadeano',
    nome: 'Hadeano',
    aceitas: ['Hadeano', 'Hadeico'],
    nivel: 'éon',
    dentroDe: null,
    era: null,
    // 4.567 é a idade da Terra, não um GSSP: ver a nota do topo.
    inicio: 4567,
    fim: 4031,
    marco: 'a Terra se forma e esfria: oceano de magma, o impacto que fez a Lua, sem rocha preservada',
  },
  {
    id: 'arqueano',
    nome: 'Arqueano',
    aceitas: ['Arqueano', 'Arqueozoico'],
    nivel: 'éon',
    dentroDe: null,
    era: null,
    inicio: 4031,
    fim: 2500,
    marco: 'as rochas mais antigas que sobraram, os primeiros procariontes e os estromatólitos',
  },
  {
    id: 'proterozoico',
    nome: 'Proterozoico',
    aceitas: ['Proterozoico'],
    nivel: 'éon',
    dentroDe: null,
    era: null,
    // 2.500 é um limite definido por idade redonda, e não por afloramento: no
    // Pré-Cambriano a escala é cronométrica, não estratigráfica.
    inicio: 2500,
    fim: 538.8,
    marco: 'a Grande Oxidação, as glaciações globais e a vida pluricelular mole do Ediacarano',
  },
  {
    id: 'fanerozoico',
    nome: 'Fanerozoico',
    aceitas: ['Fanerozoico'],
    nivel: 'éon',
    dentroDe: null,
    era: null,
    inicio: 538.8,
    fim: 0,
    marco: 'a vida com carapaça e esqueleto — "vida visível" é o que o nome diz, e é o que muda',
  },

  // ---- Trecho 2: os doze períodos do Fanerozoico --------------------------
  {
    id: 'cambriano',
    nome: 'Cambriano',
    aceitas: ['Cambriano'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Paleozoico',
    inicio: 538.8,
    fim: 486.85,
    marco: 'a explosão cambriana: quase todos os filos animais modernos aparecem no registro',
  },
  {
    id: 'ordoviciano',
    nome: 'Ordoviciano',
    aceitas: ['Ordoviciano', 'Ordovício'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Paleozoico',
    inicio: 486.85,
    fim: 443.8,
    marco: 'as primeiras plantas em terra firme; termina na primeira das cinco grandes extinções',
  },
  {
    id: 'siluriano',
    nome: 'Siluriano',
    aceitas: ['Siluriano', 'Silúrico'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Paleozoico',
    inicio: 443.8,
    fim: 419.2,
    marco: 'os primeiros peixes com mandíbula e as plantas vasculares se espalhando',
  },
  {
    id: 'devoniano',
    nome: 'Devoniano',
    aceitas: ['Devoniano', 'Devônico'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Paleozoico',
    inicio: 419.2,
    fim: 358.9,
    marco: 'a idade dos peixes, as primeiras florestas e os tetrápodes saindo da água',
  },
  {
    id: 'carbonifero',
    nome: 'Carbonífero',
    aceitas: ['Carbonífero'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Paleozoico',
    inicio: 358.9,
    fim: 298.9,
    marco: 'as florestas de licófitas que viraram carvão, insetos gigantes e os primeiros répteis',
  },
  {
    id: 'permiano',
    nome: 'Permiano',
    aceitas: ['Permiano', 'Pérmico'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Paleozoico',
    inicio: 298.9,
    // 251,902: três casas porque o GSSP é datado assim. Ver a nota do topo.
    fim: 251.902,
    marco: 'a Pangeia montada; termina na maior extinção em massa que já houve',
  },
  {
    id: 'triassico',
    nome: 'Triássico',
    aceitas: ['Triássico'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Mesozoico',
    inicio: 251.902,
    fim: 201.4,
    marco: 'a recuperação depois da grande extinção; surgem os dinossauros e os primeiros mamíferos',
  },
  {
    id: 'jurassico',
    nome: 'Jurássico',
    aceitas: ['Jurássico'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Mesozoico',
    inicio: 201.4,
    fim: 143.1,
    marco: 'a Pangeia se parte, os dinossauros dominam e aparecem as primeiras aves',
  },
  {
    id: 'cretaceo',
    nome: 'Cretáceo',
    aceitas: ['Cretáceo', 'Cretácico'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Mesozoico',
    inicio: 143.1,
    fim: 66.0,
    marco: 'as plantas com flor se espalham; termina no impacto de Chicxulub',
  },
  {
    id: 'paleogeno',
    nome: 'Paleogeno',
    // "Paleógeno", a grafia mais comum no Brasil, não precisa entrar: a
    // normalização tira o acento e as duas viram a mesma chave. Registrar as
    // duas seria ruído no dataset fingindo generosidade.
    aceitas: ['Paleogeno'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Cenozoico',
    inicio: 66.0,
    fim: 23.03,
    marco: 'os mamíferos ocupam os nichos vagos; Alpes e Himalaia começam a subir',
  },
  {
    id: 'neogeno',
    nome: 'Neogeno',
    aceitas: ['Neogeno'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Cenozoico',
    inicio: 23.03,
    fim: 2.58,
    marco: 'os campos abertos se espalham e os primeiros hominíneos aparecem na África',
  },
  {
    id: 'quaternario',
    nome: 'Quaternário',
    aceitas: ['Quaternário'],
    nivel: 'período',
    dentroDe: 'fanerozoico',
    era: 'Cenozoico',
    inicio: 2.58,
    fim: 0,
    marco: 'os ciclos de glaciação e o gênero Homo',
  },

  // ---- Trecho 3: as duas épocas do Quaternário ----------------------------
  {
    id: 'pleistoceno',
    nome: 'Pleistoceno',
    aceitas: ['Pleistoceno'],
    nivel: 'época',
    dentroDe: 'quaternario',
    era: 'Cenozoico',
    inicio: 2.58,
    // 0,0117 Ma = 11,7 mil anos. `exibirIntervalo` troca de unidade aqui, porque
    // "0,0117 milhão de anos" é um jeito ruim de escrever onze mil e setecentos.
    fim: 0.0117,
    marco: 'as grandes glaciações e a megafauna; o Homo sapiens aparece e se espalha',
  },
  {
    id: 'holoceno',
    nome: 'Holoceno',
    aceitas: ['Holoceno'],
    nivel: 'época',
    dentroDe: 'quaternario',
    era: 'Cenozoico',
    inicio: 0.0117,
    fim: 0,
    marco: 'o interglacial em que couberam a agricultura e tudo aquilo que se chama de história',
  },
]

/** Quantos itens tem cada trecho, na ordem em que aparecem. */
export const TAMANHO_DOS_TRECHOS: Readonly<Record<Nivel, number>> = {
  'éon': INTERVALOS.filter((i) => i.nivel === 'éon').length,
  'período': INTERVALOS.filter((i) => i.nivel === 'período').length,
  'época': INTERVALOS.filter((i) => i.nivel === 'época').length,
}

const POR_ID: ReadonlyMap<string, Intervalo> = new Map(INTERVALOS.map((i) => [i.id, i]))

/** Lança em id inexistente: intervalo sem ficha é casa sem gabarito. */
export function intervaloDe(id: string): Intervalo {
  const i = POR_ID.get(id)
  if (!i) throw new Error(`eras-geologicas: o intervalo "${id}" não existe no dataset`)
  return i
}

/**
 * Guardas de carga, no espírito do `fichaDe` de `relacoes-ecologicas.ts`: dado
 * quebrado tem de falhar barulhento e cedo, e não virar uma casa sem resposta
 * possível no meio da partida.
 *
 * As quatro coisas conferidas são as que ninguém enxerga relendo a lista: id
 * repetido, `aceitas[0]` diferente de `nome` (a fita mostraria um texto que a
 * validação recusa), intervalo andando para trás e `dentroDe` apontando para
 * fora do dataset ou para um intervalo que não contém o filho. As continuidades
 * — costura interna de cada trecho e encaixe no pai — ficam no teste, porque são
 * varreduras e não invariantes de uma linha só.
 */
function conferirDataset(): void {
  const vistos = new Set<string>()
  for (const i of INTERVALOS) {
    if (vistos.has(i.id)) throw new Error(`eras-geologicas: id repetido "${i.id}"`)
    vistos.add(i.id)
    if (i.aceitas[0] !== i.nome) {
      throw new Error(`eras-geologicas: a primeira forma aceita de "${i.id}" não é o nome`)
    }
    if (i.inicio <= i.fim) {
      throw new Error(`eras-geologicas: "${i.id}" começa em ${i.inicio} e termina em ${i.fim}`)
    }
    if (i.dentroDe === null) continue
    const pai = intervaloDe(i.dentroDe)
    if (i.inicio > pai.inicio || i.fim < pai.fim) {
      throw new Error(`eras-geologicas: "${i.id}" não cabe dentro de "${pai.id}"`)
    }
  }
}
conferirDataset()

/**
 * "4.567", "538,8", "251,902" — ponto de milhar e vírgula decimal, à mão.
 *
 * Sem `toLocaleString`: o resultado dele depende dos dados de localidade do
 * ambiente, e um teste que passa aqui e falha no CI por causa de um ICU
 * diferente é o pior tipo de teste. A conversão é uma troca de separadores, não
 * vale a dependência.
 */
export function exibirMa(ma: number): string {
  const [inteiro = '0', decimal] = String(ma).split('.')
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimal === undefined ? comMilhar : `${comMilhar},${decimal}`
}

/**
 * Uma idade, na unidade que não obriga a contar zeros: milhões de anos acima de
 * 1 Ma, milhares abaixo disso.
 *
 * A troca existe por causa do Holoceno, que começa em 0,0117 Ma. Escrever isso
 * como "0,0117 Ma" é tecnicamente certo e ilegível — e a escala geológica é
 * justamente a matéria em que a ordem de grandeza é o conteúdo. O
 * arredondamento passa por inteiro (× 10.000, `Math.round`, ÷ 10) porque
 * `0,0117 × 1000` em ponto flutuante dá 11,700000000000001.
 */
export function exibirIdade(ma: number): string {
  if (ma === 0) return 'hoje'
  if (ma >= 1) return `${exibirMa(ma)} Ma`
  return `${exibirMa(Math.round(ma * 10000) / 10)} mil anos`
}

/** "538,8–486,85 Ma", "2,58 Ma até hoje", "11,7 mil anos até hoje". */
export function exibirIntervalo(i: Intervalo): string {
  if (i.fim === 0) return `${exibirIdade(i.inicio)} até hoje`
  // Os dois em milhões: a unidade sai uma vez só, no fim, para não repetir "Ma".
  if (i.fim >= 1) return `${exibirMa(i.inicio)}–${exibirMa(i.fim)} Ma`
  return `${exibirIdade(i.inicio)} a ${exibirIdade(i.fim)}`
}
