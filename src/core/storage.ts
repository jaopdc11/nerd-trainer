import type { ResultadoRun } from './types'

/**
 * Persistência local dos recordes.
 *
 * Três princípios, nesta ordem de importância:
 *
 * 1. **Nunca perder recorde.** Um recorde de 900 casas de pi apagado por bug de
 *    migração é o pior desfecho possível deste projeto. Por isso há backup do
 *    bruto antes de migrar, e a validação é por entrada — corrupção num jogo não
 *    pode derrubar os outros quinze junto.
 * 2. **Nunca derrubar o site.** localStorage indisponível (aba privada do iOS,
 *    quota estourada, usuário mexendo no DevTools) degrada para memória, não
 *    para tela branca.
 * 3. **Só fatos crus.** Guardamos pontuação e duração; "84 dígitos por minuto" é
 *    derivado na hora de exibir. Dado derivado no storage é dado que desatualiza.
 */

export const CHAVE = 'nerd-trainer:recordes'
export const CHAVE_BACKUP = 'nerd-trainer:backup'
export const VERSAO_ATUAL = 1

export interface Recorde {
  readonly pontuacao: number
  readonly duracaoMs: number
  readonly erros: number
  readonly completou: boolean
  readonly emISO: string
}

/** Uma partida no histórico. Só os fatos crus; média e evolução se derivam. */
export interface Partida {
  readonly pontuacao: number
  readonly duracaoMs: number
  readonly erros: number
  readonly emISO: string
  /** Qual run gerou esta partida, para poder atualizá-la se ela continuar. */
  readonly runId?: string
}

/**
 * Uma run já gravada, com a pontuação que tinha quando foi gravada.
 *
 * Guardar a pontuação é o que permite distinguir dois casos que antes eram o
 * mesmo: gravar a mesma coisa de novo (ignora) e **terminar uma partida que já
 * tinha sido salva pela metade** (atualiza).
 */
export interface RunGravada {
  readonly id: string
  readonly pontuacao: number
}

export interface Entrada {
  readonly recorde: Recorde
  readonly partidas: number
  readonly ultimaPontuacao: number
  readonly ultimaEmISO: string
  /**
   * Toda partida jogada, da mais recente para a mais antiga. É o que permite
   * média, consistência e "quantas vezes por dia" — não só a escada de recordes.
   */
  readonly historico: readonly Partida[]
  /** Últimas runs gravadas, para não contar a mesma partida duas vezes. */
  readonly ultimosRuns: readonly RunGravada[]
}

export interface Banco {
  readonly versao: number
  readonly entradas: Record<string, Entrada>
}

const VAZIO: Banco = { versao: VERSAO_ATUAL, entradas: {} }

/** Quantos runIds lembrar por jogo. O suficiente para o StrictMode e o Suspense. */
const MEMORIA_DE_RUNS = 8

/**
 * Teto do histórico por jogo. O localStorage dá ~5 MB por origem e cada partida
 * ocupa ~90 bytes, então 500 por jogo em dez jogos usa menos de meio megabyte —
 * folgado. Passando disso, as mais antigas caem.
 */
export const LIMITE_HISTORICO = 500

/**
 * `MIGRACOES[n]` leva os dados da versão n para a n+1. Subir `VERSAO_ATUAL`
 * significa acrescentar uma entrada aqui e nada mais — `if` avulso espalhado
 * pelo módulo é o que transforma migração em perda de dado.
 */
const MIGRACOES: Record<number, (d: Record<string, unknown>) => Record<string, unknown>> = {}

// --- acesso bruto, tolerante a ambiente sem localStorage --------------------

let memoria: string | null = null
let avisouIndisponivel = false

function disponivel(): boolean {
  try {
    const sonda = '__nt__'
    window.localStorage.setItem(sonda, '1')
    window.localStorage.removeItem(sonda)
    return true
  } catch {
    avisouIndisponivel = true
    return false
  }
}

/** A UI usa isto para avisar, discretamente, que os recordes não estão sendo salvos. */
export function persistenciaIndisponivel(): boolean {
  return avisouIndisponivel
}

function lerBruto(chave: string): string | null {
  if (!disponivel()) return chave === CHAVE ? memoria : null
  try {
    return window.localStorage.getItem(chave)
  } catch {
    return null
  }
}

function escreverBruto(chave: string, valor: string): void {
  if (!disponivel()) {
    if (chave === CHAVE) memoria = valor
    return
  }
  try {
    window.localStorage.setItem(chave, valor)
  } catch {
    // Quota estourada: guarda em memória para a sessão não perder o progresso.
    if (chave === CHAVE) memoria = valor
  }
}

// --- validação --------------------------------------------------------------

const ehObjeto = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)

const numeroFinito = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

function validarRecorde(x: unknown): Recorde | null {
  if (!ehObjeto(x)) return null
  if (!numeroFinito(x.pontuacao) || x.pontuacao < 0) return null
  if (!numeroFinito(x.duracaoMs) || x.duracaoMs < 0) return null
  if (!numeroFinito(x.erros) || x.erros < 0) return null
  if (typeof x.completou !== 'boolean') return null
  if (typeof x.emISO !== 'string') return null
  return {
    pontuacao: x.pontuacao,
    duracaoMs: x.duracaoMs,
    erros: x.erros,
    completou: x.completou,
    emISO: x.emISO,
  }
}

function validarPartida(x: unknown): Partida | null {
  if (!ehObjeto(x)) return null
  if (!numeroFinito(x.pontuacao) || x.pontuacao < 0) return null
  if (!numeroFinito(x.duracaoMs) || x.duracaoMs < 0) return null
  if (typeof x.emISO !== 'string') return null
  return {
    pontuacao: x.pontuacao,
    duracaoMs: x.duracaoMs,
    erros: numeroFinito(x.erros) ? x.erros : 0,
    emISO: x.emISO,
    ...(typeof x.runId === 'string' ? { runId: x.runId } : {}),
  }
}

/**
 * Uma run só entra em `ultimosRuns` se souber a própria pontuação.
 *
 * O formato antigo era uma lista de strings, sem pontuação, e a migração
 * inventava `Number.MAX_SAFE_INTEGER` para esses ids — "já terminou, ignore
 * qualquer regravação". Era uma mentira cara: `registrar` compara
 * `r.pontuacao <= jaGravada.pontuacao`, então aquele runId ficava envenenado
 * para sempre e **o desfecho real de uma partida salva pela metade seria
 * descartado**, congelando o recorde no parcial. Pior: o valor era gravado de
 * volta e ia no JSON exportado, espalhando o problema.
 *
 * Descartar é o certo. `ultimosRuns` é só uma memória curta (oito ids) contra
 * efeito duplicado do StrictMode dentro da mesma sessão; um id vindo de sessão
 * anterior nunca será regravado, porque cada run sorteia um `runId` novo. Perde-se
 * nada e deixa de se mentir. O teto também rejeita o lixo já gravado por
 * versões anteriores.
 */
function validarRun(x: unknown): RunGravada | null {
  if (typeof x === 'string') return null
  if (!ehObjeto(x) || typeof x.id !== 'string') return null
  if (!numeroFinito(x.pontuacao) || x.pontuacao < 0) return null
  if (x.pontuacao >= Number.MAX_SAFE_INTEGER) return null
  return { id: x.id, pontuacao: x.pontuacao }
}

/** Valida uma entrada isoladamente. Entrada ruim é descartada, as boas ficam. */
function validarEntrada(x: unknown): Entrada | null {
  if (!ehObjeto(x)) return null
  const recorde = validarRecorde(x.recorde)
  if (!recorde) return null

  // Uma partida corrompida no meio do histórico não pode levar junto o recorde:
  // filtra as ruins e mantém o resto.
  const historico = Array.isArray(x.historico)
    ? x.historico
        .map(validarPartida)
        .filter((p): p is Partida => p !== null)
        .slice(0, LIMITE_HISTORICO)
    : []

  return {
    recorde,
    partidas: numeroFinito(x.partidas) ? x.partidas : historico.length || 1,
    ultimaPontuacao: numeroFinito(x.ultimaPontuacao) ? x.ultimaPontuacao : recorde.pontuacao,
    ultimaEmISO: typeof x.ultimaEmISO === 'string' ? x.ultimaEmISO : recorde.emISO,
    historico,
    ultimosRuns: Array.isArray(x.ultimosRuns)
      ? x.ultimosRuns.map(validarRun).filter((r): r is RunGravada => r !== null)
      : [],
  }
}

function migrar(bruto: Record<string, unknown>): Record<string, unknown> | null {
  let versao = numeroFinito(bruto.versao) ? bruto.versao : 0
  let dados = bruto

  // Versão do futuro: ele abriu um deploy novo e voltou num cache velho.
  // Ler o que der, e nunca escrever por cima — ver `somenteLeitura`.
  if (versao > VERSAO_ATUAL) return dados

  while (versao < VERSAO_ATUAL) {
    const passo = MIGRACOES[versao]
    if (!passo) return null
    dados = passo(dados)
    versao += 1
  }
  return dados
}

let somenteLeitura = false

/** Lê o banco inteiro, já validado. Nunca lança. */
export function carregar(): Banco {
  const texto = lerBruto(CHAVE)
  if (!texto) return VAZIO

  let bruto: unknown
  try {
    bruto = JSON.parse(texto)
  } catch {
    return VAZIO
  }
  if (!ehObjeto(bruto)) return VAZIO

  const versaoLida = numeroFinito(bruto.versao) ? bruto.versao : 0
  if (versaoLida > VERSAO_ATUAL) somenteLeitura = true

  if (versaoLida !== VERSAO_ATUAL && !somenteLeitura) {
    // O bruto original vai para o backup antes de qualquer transformação.
    escreverBruto(CHAVE_BACKUP, texto)
  }

  const migrado = migrar(bruto)
  if (!migrado || !ehObjeto(migrado.entradas)) return VAZIO

  const entradas: Record<string, Entrada> = {}
  for (const [chave, valor] of Object.entries(migrado.entradas)) {
    const entrada = validarEntrada(valor)
    if (entrada) entradas[chave] = entrada
  }

  return { versao: VERSAO_ATUAL, entradas }
}

function salvar(banco: Banco): void {
  if (somenteLeitura) return
  escreverBruto(CHAVE, JSON.stringify(banco))
}

/** `pi` ou `tabela-periodica::simbolo`. `::` nunca aparece num id kebab-case. */
export function chaveRecorde(jogoId: string, modoId?: string): string {
  return modoId ? `${jogoId}::${modoId}` : jogoId
}

export function entradaDe(banco: Banco, jogoId: string, modoId?: string): Entrada | null {
  return banco.entradas[chaveRecorde(jogoId, modoId)] ?? null
}

/**
 * Maior pontuação vence; empate desempata por menor tempo.
 *
 * É a regra de recorde do projeto, exportada para que a junção de backups e o
 * preview da importação decidam exatamente como o jogo decide.
 */
export function melhor(a: Recorde, b: Recorde): Recorde {
  if (b.pontuacao !== a.pontuacao) return b.pontuacao > a.pontuacao ? b : a
  return b.duracaoMs < a.duracaoMs ? b : a
}

export interface Gravacao {
  readonly banco: Banco
  readonly recordeNovo: boolean
  readonly entrada: Entrada
}

/**
 * Função pura: recebe o banco, devolve o próximo. Quem persiste é o hook —
 * é isso que torna a regra de recorde testável sem navegador.
 *
 * Idempotente por `runId`: o StrictMode do React invoca efeitos duas vezes, e
 * contar a mesma partida duas vezes inflaria o contador de partidas em dev.
 */
export function registrar(banco: Banco, r: ResultadoRun): Gravacao {
  const chave = chaveRecorde(r.jogoId, r.modoId)
  const anterior = banco.entradas[chave]

  const jaGravada = anterior?.ultimosRuns.find((x) => x.id === r.runId)

  // A mesma run chegando de novo sem ter avançado: nada a fazer.
  if (jaGravada && r.pontuacao <= jaGravada.pontuacao) {
    return { banco, recordeNovo: false, entrada: anterior as Entrada }
  }

  /*
   * A run já foi gravada, mas agora vem com pontuação maior: é uma partida que
   * foi salva pela metade (ao trocar de aba, por exemplo) e depois terminou.
   * Ela ATUALIZA a partida existente em vez de criar outra — senão uma única
   * partida contaria duas vezes, e, pior, o desfecho real seria descartado pela
   * idempotência e o recorde ficaria congelado no parcial.
   */
  const atualizando = jaGravada !== undefined

  const agora = new Date().toISOString()
  const candidato: Recorde = {
    pontuacao: r.pontuacao,
    duracaoMs: r.duracaoMs,
    erros: r.erros,
    completou: r.completou,
    emISO: agora,
  }

  const recorde = anterior ? melhor(anterior.recorde, candidato) : candidato
  const recordeNovo = recorde === candidato

  const partida: Partida = {
    pontuacao: r.pontuacao,
    duracaoMs: r.duracaoMs,
    erros: r.erros,
    emISO: agora,
    runId: r.runId,
  }

  const historicoAnterior = atualizando
    ? (anterior?.historico ?? []).filter((p) => p.runId !== r.runId)
    : (anterior?.historico ?? [])

  const entrada: Entrada = {
    recorde,
    partidas: (anterior?.partidas ?? 0) + (atualizando ? 0 : 1),
    ultimaPontuacao: r.pontuacao,
    ultimaEmISO: agora,
    historico: [partida, ...historicoAnterior].slice(0, LIMITE_HISTORICO),
    ultimosRuns: [
      { id: r.runId, pontuacao: r.pontuacao },
      ...(anterior?.ultimosRuns ?? []).filter((x) => x.id !== r.runId),
    ].slice(0, MEMORIA_DE_RUNS),
  }

  return {
    banco: { versao: VERSAO_ATUAL, entradas: { ...banco.entradas, [chave]: entrada } },
    recordeNovo,
    entrada,
  }
}

/**
 * Descarta entradas de jogos que não existem mais.
 *
 * Um jogo removido — ou um modo, como os `formulas::nome` de quando havia
 * seleção de modo — deixa a entrada órfã no storage para sempre, contando nas
 * estatísticas de um jogo que ninguém mais vê. Quem sabe quais ids são válidos
 * é o registry, e `core/storage` não pode importá-lo sem criar ciclo; por isso
 * a lista vem de fora.
 */
export function limparOrfas(banco: Banco, idsValidos: readonly string[]): Banco {
  const validos = new Set(idsValidos)
  const entradas: Record<string, Entrada> = {}
  let mudou = false

  for (const [chave, entrada] of Object.entries(banco.entradas)) {
    // A chave pode ser "jogo" ou "jogo::modo"; o jogo é o que importa.
    const jogoId = chave.split('::')[0] ?? chave
    if (validos.has(jogoId) && !chave.includes('::')) entradas[chave] = entrada
    else mudou = true
  }

  return mudou ? { versao: VERSAO_ATUAL, entradas } : banco
}

export function apagarTudo(): Banco {
  salvar(VAZIO)
  return VAZIO
}

export function persistir(banco: Banco): void {
  salvar(banco)
}

// --- exportar / importar ----------------------------------------------------

export function exportarJSON(banco: Banco): string {
  return JSON.stringify(banco, null, 2)
}

/** `nerd-trainer-2026-09-15.json`. Data local: às 21h de terça ainda é terça. */
export function nomeArquivoExport(em: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `nerd-trainer-${em.getFullYear()}-${pad(em.getMonth() + 1)}-${pad(em.getDate())}.json`
}

/**
 * O que saiu de errado na leitura de um backup, em português e específico.
 *
 * "JSON inválido" não ajuda ninguém a consertar nada: o usuário precisa saber
 * se colou o arquivo pela metade, se escolheu o arquivo errado ou se o backup
 * está mesmo corrompido.
 */
export type Leitura =
  | { readonly ok: true; readonly banco: Banco; readonly descartadas: number }
  | { readonly ok: false; readonly erro: string }

export function lerBancoImportado(texto: string): Leitura {
  if (texto.trim() === '') {
    return { ok: false, erro: 'Nada para ler: o arquivo (ou a área de texto) está vazio.' }
  }

  let bruto: unknown
  try {
    bruto = JSON.parse(texto)
  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      erro: `Isto não é um JSON válido (${detalhe}). Se você colou à mão, provavelmente veio cortado.`,
    }
  }

  if (!ehObjeto(bruto)) {
    return {
      ok: false,
      erro: 'O JSON é válido, mas não é um backup: o conteúdo precisa ser um objeto.',
    }
  }
  if (!ehObjeto(bruto.entradas)) {
    return {
      ok: false,
      erro: 'Falta o campo "entradas". Este arquivo não parece um backup do Nerd Trainer.',
    }
  }

  const entradas: Record<string, Entrada> = {}
  let descartadas = 0
  for (const [chave, valor] of Object.entries(bruto.entradas)) {
    const entrada = validarEntrada(valor)
    if (entrada) entradas[chave] = entrada
    else descartadas += 1
  }

  if (Object.keys(entradas).length === 0) {
    return {
      ok: false,
      erro:
        descartadas > 0
          ? `Nenhum recorde aproveitável: as ${descartadas} entradas do arquivo estão corrompidas.`
          : 'O backup está vazio — não há nenhum recorde dentro dele.',
    }
  }

  return { ok: true, banco: { versao: VERSAO_ATUAL, entradas }, descartadas }
}

/** O que acontece com um jogo se o backup for aplicado. */
export type Situacao = 'novo' | 'sobe' | 'igual' | 'pior'

export interface ItemPreview {
  readonly chave: string
  readonly situacao: Situacao
  /** Pontuação do recorde de hoje, ou `null` se o jogo ainda não existe aqui. */
  readonly atual: number | null
  /** Pontuação do recorde que vem no arquivo. */
  readonly vindo: number
  /** Partidas que o arquivo traz para este jogo. */
  readonly partidas: number
}

export interface Preview {
  readonly jogos: number
  readonly partidas: number
  readonly itens: readonly ItemPreview[]
  readonly novos: number
  readonly sobem: number
  readonly iguais: number
  readonly piores: number
  /** Jogos que existem aqui e **não** vêm no arquivo: o que "substituir tudo" apaga. */
  readonly perdidos: number
}

/** Ordem de exibição: primeiro o que muda para melhor, por último o que empata. */
const PESO: Record<Situacao, number> = { sobe: 0, novo: 1, pior: 2, igual: 3 }

/**
 * Compara, item a item, o backup com o que já existe — antes de escrever nada.
 *
 * Usa `melhor`, a mesma função que decide recorde durante o jogo, para que o
 * preview não possa discordar do que a junção vai fazer de fato.
 */
export function compararBancos(atual: Banco, vindo: Banco): Preview {
  const itens: ItemPreview[] = Object.entries(vindo.entradas).map(([chave, entrada]) => {
    const anterior = atual.entradas[chave]
    const vindoPts = entrada.recorde.pontuacao

    if (!anterior) {
      return { chave, situacao: 'novo', atual: null, vindo: vindoPts, partidas: entrada.partidas }
    }

    const a = anterior.recorde
    const b = entrada.recorde
    const situacao: Situacao =
      a.pontuacao === b.pontuacao && a.duracaoMs === b.duracaoMs
        ? 'igual'
        : melhor(a, b) === b
          ? 'sobe'
          : 'pior'

    return { chave, situacao, atual: a.pontuacao, vindo: vindoPts, partidas: entrada.partidas }
  })

  itens.sort((x, y) => PESO[x.situacao] - PESO[y.situacao] || x.chave.localeCompare(y.chave))

  const conta = (s: Situacao) => itens.filter((i) => i.situacao === s).length
  const chegando = new Set(Object.keys(vindo.entradas))

  return {
    jogos: itens.length,
    partidas: itens.reduce((s, i) => s + i.partidas, 0),
    itens,
    novos: conta('novo'),
    sobem: conta('sobe'),
    iguais: conta('igual'),
    piores: conta('pior'),
    perdidos: Object.keys(atual.entradas).filter((c) => !chegando.has(c)).length,
  }
}

/** Identidade de uma partida, para não contar duas vezes o mesmo jogo importado. */
function chaveDaPartida(p: Partida): string {
  return p.runId ? `run:${p.runId}` : `${p.emISO}|${p.pontuacao}|${p.duracaoMs}`
}

/**
 * Junta dois registros do mesmo jogo, mantendo o melhor de cada lado.
 *
 * Não dá para reaproveitar `registrar` aqui: ele carimba `new Date()` em tudo o
 * que grava, e replayar o backup por ele reescreveria as datas das partidas
 * antigas para hoje. O que importa reaproveitar é a *regra* — daí `melhor`.
 */
function juntarEntradas(a: Entrada, b: Entrada): Entrada {
  const vistas = new Map<string, Partida>()
  for (const p of [...a.historico, ...b.historico]) {
    const k = chaveDaPartida(p)
    if (!vistas.has(k)) vistas.set(k, p)
  }
  const historico = [...vistas.values()]
    .sort((x, y) => (x.emISO < y.emISO ? 1 : x.emISO > y.emISO ? -1 : 0))
    .slice(0, LIMITE_HISTORICO)

  // Quem tem a partida mais recente dita "última pontuação".
  const recente = a.ultimaEmISO >= b.ultimaEmISO ? a : b

  const runs = new Map<string, number>()
  for (const r of [...a.ultimosRuns, ...b.ultimosRuns]) {
    runs.set(r.id, Math.max(runs.get(r.id) ?? 0, r.pontuacao))
  }

  return {
    recorde: melhor(a.recorde, b.recorde),
    // O histórico tem teto, então ele pode conhecer menos partidas do que
    // realmente houve; o maior dos três é o número menos errado disponível.
    partidas: Math.max(a.partidas, b.partidas, vistas.size),
    ultimaPontuacao: recente.ultimaPontuacao,
    ultimaEmISO: recente.ultimaEmISO,
    historico,
    ultimosRuns: [...runs].map(([id, pontuacao]) => ({ id, pontuacao })).slice(0, MEMORIA_DE_RUNS),
  }
}

/**
 * Junta o backup com o que já existe: cada jogo fica com o melhor dos dois, e
 * jogo que só existe de um lado entra inteiro. Nada é perdido — é a importação
 * que se pode fazer sem confirmação assustadora.
 */
export function juntar(atual: Banco, vindo: Banco): Banco {
  const entradas: Record<string, Entrada> = { ...atual.entradas }
  for (const [chave, entrada] of Object.entries(vindo.entradas)) {
    const anterior = entradas[chave]
    entradas[chave] = anterior ? juntarEntradas(anterior, entrada) : entrada
  }
  return { versao: VERSAO_ATUAL, entradas }
}
