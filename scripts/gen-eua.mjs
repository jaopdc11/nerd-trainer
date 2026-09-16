/**
 * Gera `src/data/eua.ts` e `src/data/eua-mapa.ts`.
 *
 * Uma fonte só, e de domínio público: a malha dos estados dos EUA do pacote
 * `us-atlas` (Natural Earth / Census, TopoJSON), no arquivo já projetado em
 * **Albers USA** — `states-albers-10m.json`.
 *
 * Por que o "-albers" e não o `states-10m` cru: a Albers USA **reposiciona
 * Alasca e Havaí** dentro do enquadramento do continente, encolhidos e trazidos
 * para o canto inferior esquerdo. É o mesmo problema que o gerador do Brasil
 * resolve invertendo anéis para o país não sair "do tamanho de uma unha": aqui,
 * se o Alasca entrasse na projeção do continente pela longitude real, as ilhas
 * Aleutas cruzariam o antimeridiano e o `fitSize` esticaria a caixa por meio
 * planeta, deixando o país-continente minúsculo no canto. O `us-atlas` já
 * entrega isso resolvido: as coordenadas do arquivo albers são **pixels já
 * projetados** (a caixa padrão do d3 é ~975×610, y para baixo), então aqui não
 * há projeção geográfica a fazer — só uma `geoIdentity` que reescala os pixels
 * para dentro da nossa caixa. Confirmado lendo o `transform`/`bbox` do arquivo:
 * é plano, não graus.
 *
 * O arquivo vem do pacote em `node_modules/us-atlas`, consumido **no build** —
 * nada disso vira dependência de runtime, do mesmo jeito que `world-atlas` no
 * gerador dos países. Sigla (USPS), nome em português do Brasil, sinônimos e
 * região do Censo vêm da tabela escrita à mão aqui embaixo; `eua.test.ts`
 * confere a região contra uma segunda lista agrupada de outro jeito — o dado
 * não se autoaprova.
 *
 * DC entra. O `us-atlas` traz o Distrito de Colúmbia com geometria própria
 * (FIPS 11), e ele é o análogo exato do Distrito Federal no jogo do Brasil, que
 * já é uma célula respondível: um distrito federal, sede do governo, com sigla
 * de duas letras e resposta que quem sabe geografia acerta. Deixá-lo de fora
 * abriria um furo no mapa entre Maryland e Virgínia. Assim FORMAS e as células
 * têm bijeção perfeita e não sobra nenhuma peça inerte.
 *
 * Uso: node scripts/gen-eua.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoIdentity, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..')

/**
 * Nome no arquivo (inglês, como vem no `properties.name`) → estado.
 *
 * `sigla` é o código postal USPS de duas letras, que é a chave das formas do
 * mapa. `nome` é o português do Brasil: só o que **difere** do inglês recebe
 * tradução corrente (Califórnia, Havaí, Luisiana, Novo México, Carolina do
 * Norte, Pensilvânia, Virgínia...); Texas, Utah, Ohio e afins ficam como são.
 * `sinonimos` traz o nome em inglês (quem digita "California" sabe onde fica) e
 * as grafias alternativas correntes ("Nova Iorque", "Dacota do Norte").
 * `regiao` é a das quatro regiões do Census Bureau, traduzidas: Nordeste
 * (Northeast), Meio-Oeste (Midwest), Sul (South), Oeste (West).
 */
const ESTADOS = {
  Alabama: { sigla: 'AL', nome: 'Alabama', sinonimos: [], regiao: 'Sul' },
  Alaska: { sigla: 'AK', nome: 'Alasca', sinonimos: ['Alaska'], regiao: 'Oeste' },
  Arizona: { sigla: 'AZ', nome: 'Arizona', sinonimos: [], regiao: 'Oeste' },
  Arkansas: { sigla: 'AR', nome: 'Arkansas', sinonimos: [], regiao: 'Sul' },
  California: { sigla: 'CA', nome: 'Califórnia', sinonimos: ['California'], regiao: 'Oeste' },
  Colorado: { sigla: 'CO', nome: 'Colorado', sinonimos: [], regiao: 'Oeste' },
  Connecticut: { sigla: 'CT', nome: 'Connecticut', sinonimos: ['Conecticut'], regiao: 'Nordeste' },
  Delaware: { sigla: 'DE', nome: 'Delaware', sinonimos: [], regiao: 'Sul' },
  Florida: { sigla: 'FL', nome: 'Flórida', sinonimos: ['Florida'], regiao: 'Sul' },
  Georgia: { sigla: 'GA', nome: 'Geórgia', sinonimos: ['Georgia'], regiao: 'Sul' },
  Hawaii: { sigla: 'HI', nome: 'Havaí', sinonimos: ['Hawaii'], regiao: 'Oeste' },
  Idaho: { sigla: 'ID', nome: 'Idaho', sinonimos: [], regiao: 'Oeste' },
  Illinois: { sigla: 'IL', nome: 'Illinois', sinonimos: [], regiao: 'Meio-Oeste' },
  Indiana: { sigla: 'IN', nome: 'Indiana', sinonimos: [], regiao: 'Meio-Oeste' },
  Iowa: { sigla: 'IA', nome: 'Iowa', sinonimos: [], regiao: 'Meio-Oeste' },
  Kansas: { sigla: 'KS', nome: 'Kansas', sinonimos: [], regiao: 'Meio-Oeste' },
  Kentucky: { sigla: 'KY', nome: 'Kentucky', sinonimos: [], regiao: 'Sul' },
  Louisiana: { sigla: 'LA', nome: 'Luisiana', sinonimos: ['Louisiana', 'Luisiânia'], regiao: 'Sul' },
  Maine: { sigla: 'ME', nome: 'Maine', sinonimos: [], regiao: 'Nordeste' },
  Maryland: { sigla: 'MD', nome: 'Maryland', sinonimos: [], regiao: 'Sul' },
  Massachusetts: { sigla: 'MA', nome: 'Massachusetts', sinonimos: [], regiao: 'Nordeste' },
  Michigan: { sigla: 'MI', nome: 'Michigan', sinonimos: [], regiao: 'Meio-Oeste' },
  Minnesota: { sigla: 'MN', nome: 'Minnesota', sinonimos: [], regiao: 'Meio-Oeste' },
  Mississippi: { sigla: 'MS', nome: 'Mississippi', sinonimos: ['Mississipi'], regiao: 'Sul' },
  Missouri: { sigla: 'MO', nome: 'Missouri', sinonimos: [], regiao: 'Meio-Oeste' },
  Montana: { sigla: 'MT', nome: 'Montana', sinonimos: [], regiao: 'Oeste' },
  Nebraska: { sigla: 'NE', nome: 'Nebraska', sinonimos: [], regiao: 'Meio-Oeste' },
  Nevada: { sigla: 'NV', nome: 'Nevada', sinonimos: [], regiao: 'Oeste' },
  'New Hampshire': { sigla: 'NH', nome: 'Nova Hampshire', sinonimos: ['New Hampshire'], regiao: 'Nordeste' },
  'New Jersey': { sigla: 'NJ', nome: 'Nova Jersey', sinonimos: ['New Jersey', 'Nova Jérsei'], regiao: 'Nordeste' },
  'New Mexico': { sigla: 'NM', nome: 'Novo México', sinonimos: ['New Mexico'], regiao: 'Oeste' },
  'New York': { sigla: 'NY', nome: 'Nova York', sinonimos: ['New York', 'Nova Iorque'], regiao: 'Nordeste' },
  'North Carolina': { sigla: 'NC', nome: 'Carolina do Norte', sinonimos: ['North Carolina'], regiao: 'Sul' },
  'North Dakota': { sigla: 'ND', nome: 'Dakota do Norte', sinonimos: ['North Dakota', 'Dacota do Norte'], regiao: 'Meio-Oeste' },
  Ohio: { sigla: 'OH', nome: 'Ohio', sinonimos: [], regiao: 'Meio-Oeste' },
  Oklahoma: { sigla: 'OK', nome: 'Oklahoma', sinonimos: [], regiao: 'Sul' },
  Oregon: { sigla: 'OR', nome: 'Oregon', sinonimos: ['Óregon'], regiao: 'Oeste' },
  Pennsylvania: { sigla: 'PA', nome: 'Pensilvânia', sinonimos: ['Pennsylvania'], regiao: 'Nordeste' },
  'Rhode Island': { sigla: 'RI', nome: 'Rhode Island', sinonimos: [], regiao: 'Nordeste' },
  'South Carolina': { sigla: 'SC', nome: 'Carolina do Sul', sinonimos: ['South Carolina'], regiao: 'Sul' },
  'South Dakota': { sigla: 'SD', nome: 'Dakota do Sul', sinonimos: ['South Dakota', 'Dacota do Sul'], regiao: 'Meio-Oeste' },
  Tennessee: { sigla: 'TN', nome: 'Tennessee', sinonimos: [], regiao: 'Sul' },
  Texas: { sigla: 'TX', nome: 'Texas', sinonimos: [], regiao: 'Sul' },
  Utah: { sigla: 'UT', nome: 'Utah', sinonimos: [], regiao: 'Oeste' },
  Vermont: { sigla: 'VT', nome: 'Vermont', sinonimos: [], regiao: 'Nordeste' },
  Virginia: { sigla: 'VA', nome: 'Virgínia', sinonimos: ['Virginia'], regiao: 'Sul' },
  Washington: { sigla: 'WA', nome: 'Washington', sinonimos: [], regiao: 'Oeste' },
  'West Virginia': { sigla: 'WV', nome: 'Virgínia Ocidental', sinonimos: ['West Virginia'], regiao: 'Sul' },
  Wisconsin: { sigla: 'WI', nome: 'Wisconsin', sinonimos: [], regiao: 'Meio-Oeste' },
  Wyoming: { sigla: 'WY', nome: 'Wyoming', sinonimos: [], regiao: 'Oeste' },
  'District of Columbia': {
    sigla: 'DC',
    nome: 'Distrito de Colúmbia',
    sinonimos: ['Washington DC', 'Distrito de Columbia', 'District of Columbia'],
    regiao: 'Sul',
  },
}

/** Contagem oficial do Census Bureau por região, com DC no Sul. Pega linha trocada. */
const CONTAGEM_REGIAO = { Nordeste: 9, 'Meio-Oeste': 12, Sul: 17, Oeste: 13 }

const porRegiao = {}
for (const e of Object.values(ESTADOS)) porRegiao[e.regiao] = (porRegiao[e.regiao] ?? 0) + 1
for (const [regiao, n] of Object.entries(CONTAGEM_REGIAO)) {
  if (porRegiao[regiao] !== n) {
    throw new Error(`região ${regiao}: a tabela tem ${porRegiao[regiao] ?? 0}, o Census diz ${n}`)
  }
}
if (Object.keys(ESTADOS).length !== 51) {
  throw new Error(`esperava 51 linhas (50 estados + DC), tem ${Object.keys(ESTADOS).length}`)
}

// --- geometria --------------------------------------------------------------

const topo = JSON.parse(
  readFileSync(join(RAIZ, 'node_modules/us-atlas/states-albers-10m.json'), 'utf8'),
)
const eua = feature(topo, topo.objects.states)

if (eua.features.length !== 51) {
  throw new Error(`esperava 51 feições na malha, vieram ${eua.features.length}`)
}

/*
 * `geoIdentity`, não uma projeção geográfica: o arquivo albers já vem projetado
 * em pixels (y para baixo), então só resta reescalar essa caixa para a nossa. A
 * caixa sai do próprio contorno, em dois passos como no gerador do Brasil: o
 * primeiro mede a proporção, o segundo projeta numa caixa dessa proporção, para
 * não sobrar tarja vazia em nenhum lado.
 */
const ALTURA = 1000
const medida = geoPath(geoIdentity().fitSize([ALTURA, ALTURA], eua)).bounds(eua)
const proporcao = (medida[1][0] - medida[0][0]) / (medida[1][1] - medida[0][1])
const LARGURA = Math.round(ALTURA * proporcao)

const projecao = geoIdentity().fitSize([LARGURA, ALTURA], eua)
const caminho = geoPath(projecao)

/** Uma casa decimal, o mesmo corte dos outros mapas: some peso, não some desenho. */
const arredondar = (d) => d.replace(/-?\d+\.?\d*/g, (n) => String(Number(Number(n).toFixed(1))))

const formaPorSigla = new Map()
for (const f of eua.features) {
  const nomeEn = f.properties.name
  const e = ESTADOS[nomeEn]
  if (!e) throw new Error(`a malha trouxe "${nomeEn}", que não está na tabela`)
  const d = caminho(f)
  if (!d) throw new Error(`${e.sigla} não gerou contorno`)
  formaPorSigla.set(e.sigla, arredondar(d))
}

const estados = Object.values(ESTADOS)
  .map((e) => ({ ...e }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

for (const e of estados) {
  if (!formaPorSigla.has(e.sigla)) throw new Error(`${e.nome} ficou sem forma na malha`)
}

// --- saída ------------------------------------------------------------------

const CABECALHO = `// GERADO POR scripts/gen-eua.mjs — não edite à mão.
//
// Contornos: malha dos estados dos EUA do pacote \`us-atlas\`, arquivo já
// projetado em Albers USA (Alasca e Havaí reposicionados) — dado público.
// Sigla (USPS), nome em português do Brasil, sinônimos e região do Census:
// tabela escrita à mão no gerador, conferida contra uma segunda lista em
// \`eua.test.ts\`.`

const linhaEstado = (e) =>
  `  { sigla: '${e.sigla}', nome: ${JSON.stringify(e.nome)}, sinonimos: ${JSON.stringify(
    e.sinonimos,
  )}, regiao: '${e.regiao}' },`

writeFileSync(
  join(RAIZ, 'src/data/eua.ts'),
  `${CABECALHO}

export type Regiao = 'Nordeste' | 'Meio-Oeste' | 'Sul' | 'Oeste'

export interface EstadoEUA {
  /** Código postal USPS de duas letras maiúsculas. É a chave das formas do mapa. */
  readonly sigla: string
  readonly nome: string
  /** Nome em inglês e grafias alternativas correntes. Todos valem como resposta. */
  readonly sinonimos: readonly string[]
  /** Uma das quatro regiões do Census Bureau, traduzida. */
  readonly regiao: Regiao
}

/** Os 50 estados mais o Distrito de Colúmbia (DC), como no jogo do Brasil com o DF. */
export const ESTADOS_EUA: readonly EstadoEUA[] = [
${estados.map(linhaEstado).join('\n')}
]
`,
)

writeFileSync(
  join(RAIZ, 'src/data/eua-mapa.ts'),
  `${CABECALHO}
//
// Módulo separado de \`eua.ts\` porque os contornos são quase todo o peso do
// dataset. Importe só onde o mapa é desenhado.

/** Caixa da projeção Albers USA. A proporção é a do próprio contorno do país. */
export const LARGURA_MAPA = ${LARGURA}
export const ALTURA_MAPA = ${ALTURA}

/** Contorno projetado, por sigla. Todo estado tem o seu: aqui não existe ponto. */
export const FORMAS: Readonly<Record<string, { readonly d: string }>> = {
${estados.map((e) => `  ${e.sigla}: { d: ${JSON.stringify(formaPorSigla.get(e.sigla))} },`).join('\n')}
}

/**
 * O mapa é a soma dos 51 contornos respondíveis — 50 estados mais DC. Não sobra
 * peça para desenhar em cinza, então a lista de inertes é vazia; existe só para
 * o layout de mapa da engine, que sempre a percorre.
 */
export const INERTES: readonly { readonly id: string; readonly d: string }[] = []
`,
)

const bytes = estados.reduce((total, e) => total + formaPorSigla.get(e.sigla).length, 0)
console.log(`eua.ts:      ${estados.length} estados (50 + DC)`)
console.log(`eua-mapa.ts: ${estados.length} contornos, caixa ${LARGURA}×${ALTURA}, ${(bytes / 1024).toFixed(0)} KB de path`)
