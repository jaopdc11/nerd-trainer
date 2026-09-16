/**
 * Gera `src/data/paises.ts` e copia as bandeiras para `public/bandeiras/`.
 *
 * Três fontes, todas de licença livre, e todas consumidas **no build** — nada
 * disso vira dependência de runtime:
 *
 * - `world-atlas` (Natural Earth, domínio público): os contornos, na resolução
 *   110m. O 50m custaria 306 KB gzip contra 43 KB, e a diferença não aparece
 *   num mapa que cabe na tela.
 * - `world-countries` (ODbL): código ISO, região e coordenada. Daqui sai só o
 *   que é estrutural — os nomes em português do pacote são de Portugal.
 * - `flag-icons` (MIT): os SVGs das bandeiras.
 *
 * **Soberanos são 195**: os 193 membros da ONU mais Vaticano e Palestina, que
 * são Estados observadores. Além deles entram **9 territórios** — Taiwan,
 * Kosovo, Groenlândia, Saara Ocidental, Porto Rico, Nova Caledônia,
 * Somalilândia, Chipre do Norte e Malvinas —, que o mapa já desenhava e que
 * agora valem ponto, marcados com `soberano: false`.
 *
 * A distinção existe porque a lista dos 195 é um fato verificável (quem está na
 * ONU), e a dos territórios não: cada um deles é um caso diferente de
 * reconhecimento parcial, dependência ou disputa. Quem digitou "Taiwan" sabe
 * geografia e merece o ponto; quem precisa da lista canônica de Estados — uma
 * estatística, um texto de gabarito — filtra por `soberano` e não é enganado.
 * Só a Antártida e as Terras Austrais Francesas seguem inertes: ali não há
 * população nem governo a lembrar, só um desenho para o planeta não ficar
 * furado.
 *
 * **Micro-estado vira ponto.** 29 dos 195 não têm contorno no 110m — Singapura,
 * Malta, Nauru, Vaticano — porque ali são menores que um pixel. Recebem um
 * círculo na própria coordenada, pela mesma projeção. Sem isso, "todos os
 * países" seria mentira.
 *
 * Uso: node scripts/gen-paises.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..')

// O pacote é ESM com export default, mas o entry aponta para um .json — o Node
// recusa sem a attribute de tipo, e com ela recusa por ser módulo. Ler o arquivo
// direto é mais simples que discutir com o loader.
const PAISES_MUNDO = JSON.parse(
  readFileSync(join(RAIZ, 'node_modules/world-countries/countries.json'), 'utf8'),
)

/** Estados observadores da ONU: entram junto dos 193 membros. */
const OBSERVADORES = ['VA', 'PS']

/**
 * Nomes em português do BRASIL.
 *
 * O `world-countries` traz `translations.por`, que é português europeu — a
 * mesma armadilha dos elementos químicos, onde "Azoto" tentava entrar no lugar
 * de Nitrogênio. Aqui a regra do -ónio/-ônio reaparece como -ónia/-ônia
 * (Polónia, Estónia, Macedónia) e vem acompanhada de Irão, Vietname, Iémen e
 * Zimbabué. Só está listado abaixo o que **difere**; o resto vem do pacote.
 *
 * `Azerbeijão` e `São Vincente` não são lusitanismos, são erro de digitação do
 * próprio pacote. Corrigidos aqui do mesmo jeito.
 */
const EM_PT_BR = {
  AM: 'Armênia', AZ: 'Azerbaijão', BW: 'Botsuana', BY: 'Belarus',
  CZ: 'Tchéquia', DJ: 'Djibuti', EE: 'Estônia', IR: 'Irã',
  KE: 'Quênia', KN: 'São Cristóvão e Neves', LV: 'Letônia', MC: 'Mônaco',
  MG: 'Madagascar', MK: 'Macedônia do Norte', MM: 'Mianmar', NL: 'Países Baixos',
  PE: 'Peru', PL: 'Polônia', RO: 'Romênia', SI: 'Eslovênia',
  SZ: 'Essuatíni', TM: 'Turcomenistão', TT: 'Trinidad e Tobago', VA: 'Vaticano',
  VC: 'São Vicente e Granadinas', VN: 'Vietnã', YE: 'Iêmen', ZW: 'Zimbábue',
}

/**
 * Formas que também valem. Nome corrente, sigla, e o nome que caiu em desuso.
 *
 * **"Congo" vale para os dois Congos**, e isso é de propósito. São dois países
 * de verdade, mas ninguém tem na cabeça qual dos dois é "o" Congo: o jogo é de
 * lembrar países, não de adivinhar qual metade da fronteira o quiz escolheu.
 * Como a grade preenche a primeira célula ainda vazia que aceita o texto,
 * digitar "congo" duas vezes preenche os dois — e digitar uma vez nunca deixa o
 * jogador travado achando que errou.
 *
 * Coreia **não** entra na mesma regra: "Coreia do Norte" e "Coreia do Sul" não
 * têm forma curta corrente em português — ninguém chama nenhuma das duas só de
 * "Coreia" sem completar —, e aceitar a abreviação daria ponto para quem lembrou
 * de meia resposta. Sudão, Guiné e Irlanda também ficam de fora: nesses três o
 * nome curto já É o nome oficial de um dos países (Sudão, Guiné, Irlanda), então
 * não há nada a acrescentar.
 */
const SINONIMOS = {
  AE: ['Emirados Árabes'],
  BY: ['Bielorrússia', 'Bielorússia'],
  CD: ['RDC', 'Congo-Kinshasa', 'Congo'],
  CG: ['República do Congo', 'Congo-Brazzaville'],
  CZ: ['República Tcheca', 'Chéquia'],
  CI: ['Marfim'],
  GB: ['Grã-Bretanha', 'UK'],
  MM: ['Myanmar', 'Birmânia'],
  MD: ['Moldova'],
  MW: ['Maláui'],
  NL: ['Holanda'],
  SC: ['Seychelles'],
  SZ: ['Suazilândia', 'Eswatini'],
  TL: ['Timor Leste'],
  US: ['EUA', 'Estados Unidos da América'],
  VA: ['Cidade do Vaticano', 'Santa Sé'],
}

const CONTINENTE = {
  Africa: 'África',
  Americas: 'América',
  Asia: 'Ásia',
  Europe: 'Europa',
  Oceania: 'Oceania',
}

/**
 * Os territórios que valem ponto sem serem Estados soberanos.
 *
 * Todos já estavam desenhados no mapa e não eram respondíveis, o que fazia o
 * jogador digitar "Taiwan" e ver o nada acontecer. Eles entram com
 * `soberano: false` — não são os 195, e o dataset não finge que são.
 *
 * `ne` é como achar o contorno no Natural Earth 110m: o ISO numérico quando o
 * território tem um, e o nome da feature quando não tem. Somalilândia, Chipre
 * do Norte e Kosovo caem no segundo caso porque o Natural Earth os traz com id
 * `-99`; indexá-los pelo id faria os três colidirem numa entrada só — que é
 * exatamente o bug que deixava Somalilândia e Chipre do Norte sem geometria
 * nenhuma.
 *
 * `id` é ISO 3166-1 alfa-2 onde existe. Somalilândia e Chipre do Norte não têm
 * código ISO: recebem `xs` e `xc`, da faixa XA–XZ reservada a uso privado — a
 * mesma de onde vem o `xk` do Kosovo. O formato de duas letras minúsculas é
 * contrato, porque o id também é o nome do arquivo da bandeira.
 */
const TERRITORIOS = [
  { id: 'tw', ne: '158', nome: 'Taiwan', continente: 'Ásia',
    sinonimos: ['Formosa', 'Ilha Formosa', 'República da China'] },
  { id: 'xk', ne: 'Kosovo', nome: 'Kosovo', continente: 'Europa',
    sinonimos: ['Kosova'] },
  { id: 'gl', ne: '304', nome: 'Groenlândia', continente: 'América',
    sinonimos: [] },
  { id: 'eh', ne: '732', nome: 'Saara Ocidental', continente: 'África',
    sinonimos: ['Sahara Ocidental'] },
  { id: 'pr', ne: '630', nome: 'Porto Rico', continente: 'América',
    sinonimos: ['Puerto Rico'] },
  { id: 'nc', ne: '540', nome: 'Nova Caledônia', continente: 'Oceania',
    sinonimos: [] },
  { id: 'xs', ne: 'Somaliland', nome: 'Somalilândia', continente: 'África',
    sinonimos: ['Somaliland'] },
  { id: 'xc', ne: 'N. Cyprus', nome: 'Chipre do Norte', continente: 'Ásia',
    sinonimos: ['Chipre Setentrional', 'República Turca de Chipre do Norte'] },
  { id: 'fk', ne: '238', nome: 'Ilhas Malvinas', continente: 'América',
    sinonimos: ['Malvinas', 'Falklands', 'Ilhas Falkland'] },
]

// --- geometria --------------------------------------------------------------

const LARGURA = 1000
const ALTURA = 500

const topo = JSON.parse(
  readFileSync(join(RAIZ, 'node_modules/world-atlas/countries-110m.json'), 'utf8'),
)
const mundo = feature(topo, topo.objects.countries)
const projecao = geoNaturalEarth1().fitSize([LARGURA, ALTURA], mundo)
const caminho = geoPath(projecao)

/** Uma casa decimal: 43 KB gzip contra 54 KB, e a diferença não é visível. */
const arredondar = (d) => d.replace(/-?\d+\.?\d*/g, (n) => String(Number(Number(n).toFixed(1))))

/**
 * Chave de cada feature: o ISO numérico quando ela tem um, e o nome quando não
 * tem. O Natural Earth dá id `-99` a Kosovo, Somalilândia e Chipre do Norte;
 * enquanto a chave era só o id, os três se sobrescreviam e dois deles sumiam do
 * mapa. Nomes e números não se cruzam — um tem três dígitos, o outro não.
 */
const geometriaPorChave = new Map()
for (const f of mundo.features) {
  const d = caminho(f)
  if (!d) continue
  const temIso = f.id !== undefined && f.id !== null && Number(f.id) > 0
  const chave = temIso ? String(f.id).padStart(3, '0') : f.properties.name
  geometriaPorChave.set(chave, { d: arredondar(d), nome: f.properties.name })
}

// --- países respondíveis ----------------------------------------------------

const respondiveis = PAISES_MUNDO.filter(
  (c) => c.unMember === true || OBSERVADORES.includes(c.cca2),
).sort((a, b) => a.cca2.localeCompare(b.cca2))

if (respondiveis.length !== 195) {
  throw new Error(`esperava 195 respondíveis, vieram ${respondiveis.length}`)
}

const usados = new Set()
const soberanos = respondiveis.map((c) => {
  const nome = EM_PT_BR[c.cca2] ?? c.translations.por.common
  const geo = geometriaPorChave.get(c.ccn3)
  if (geo) usados.add(c.ccn3)

  // Sem contorno: vira ponto na própria coordenada, pela mesma projeção.
  const [lat, lon] = c.latlng
  const ponto = projecao([lon, lat])

  const continente = CONTINENTE[c.region]
  if (!continente) throw new Error(`${nome}: região desconhecida "${c.region}"`)

  return {
    id: c.cca2.toLowerCase(),
    nome,
    sinonimos: SINONIMOS[c.cca2] ?? [],
    continente,
    soberano: true,
    ...(geo ? { d: geo.d } : { x: Number(ponto[0].toFixed(1)), y: Number(ponto[1].toFixed(1)) }),
  }
})

// Territórios: todos os nove têm contorno no 110m, então nenhum vira ponto. Se
// um dia algum deixar de ter, é melhor o gerador quebrar que o mapa mentir.
const territorios = TERRITORIOS.map((t) => {
  const geo = geometriaPorChave.get(t.ne)
  if (!geo) throw new Error(`${t.nome}: sem contorno para a chave "${t.ne}" no Natural Earth 110m`)
  usados.add(t.ne)
  return { id: t.id, nome: t.nome, sinonimos: t.sinonimos, continente: t.continente, soberano: false, d: geo.d }
})

const paises = [...soberanos, ...territorios].sort((a, b) => a.id.localeCompare(b.id))

/**
 * O que o mapa desenha mas não pergunta: Antártida e Terras Austrais Francesas.
 * Sem isso o planeta fica furado; com isso valendo ponto o jogo perguntaria por
 * geleira desabitada.
 */
const inertes = [...geometriaPorChave.entries()]
  .filter(([chave]) => !usados.has(chave))
  .map(([chave, g]) => ({ id: chave, d: g.d }))
  .sort((a, b) => a.id.localeCompare(b.id))

// --- bandeiras --------------------------------------------------------------

const destino = join(RAIZ, 'public/bandeiras')
rmSync(destino, { recursive: true, force: true })
mkdirSync(destino, { recursive: true })

/*
 * O `flag-icons` cobre os 195 e sete dos nove territórios. Faltam Somalilândia
 * e Chipre do Norte, que não têm código ISO e por isso não têm arquivo no
 * pacote. Eles continuam no mapa e nas capitais; o que não podem é entrar no
 * baralho de bandeiras, onde virariam um 404 em cima da carta. Daí o campo
 * `bandeira`: quem monta o baralho filtra por ele, e a ausência é um dado do
 * dataset e não uma lista paralela que alguém esquece de atualizar.
 */
let bytes = 0
for (const p of paises) {
  const origem = join(RAIZ, 'node_modules/flag-icons/flags/4x3', `${p.id}.svg`)
  if (!existsSync(origem)) {
    if (p.soberano) throw new Error(`${p.nome}: o flag-icons não tem ${p.id}.svg`)
    p.bandeira = false
    continue
  }
  p.bandeira = true
  copyFileSync(origem, join(destino, `${p.id}.svg`))
  bytes += readFileSync(origem).length
}

// --- saída ------------------------------------------------------------------

/*
 * Dois arquivos, e a divisão não é organizacional — é de peso.
 *
 * Os contornos são 130 KB dos 132; nomes e continentes são o resto. O jogo de
 * bandeiras só precisa dos nomes, e enquanto tudo morava num módulo só ele
 * arrastava o mapa-múndi inteiro para dentro do bundle: 45 KB gzip a mais para
 * exibir um SVG de 1 KB. Separados, cada jogo importa o que usa.
 */
const linhaPais = (p) =>
  `  { id: '${p.id}', nome: ${JSON.stringify(p.nome)}, sinonimos: ${JSON.stringify(p.sinonimos)}, continente: '${p.continente}', soberano: ${p.soberano}, bandeira: ${p.bandeira} },`

const linhaForma = (p) =>
  `  ${p.id}: ${p.d ? `{ d: ${JSON.stringify(p.d)} }` : `{ x: ${p.x}, y: ${p.y} }`},`

const CABECALHO = `// GERADO POR scripts/gen-paises.mjs — não edite à mão.
//
// Contornos: Natural Earth 110m via world-atlas (domínio público).
// Código ISO e coordenada: world-countries (ODbL).
// Nomes em português do Brasil conferidos um a um contra a tradução europeia do
// pacote; ver o script para a lista de correções e os invariantes em
// \`paises.test.ts\`.`

writeFileSync(
  join(RAIZ, 'src/data/paises.ts'),
  `${CABECALHO}

export type Continente = 'África' | 'América' | 'Ásia' | 'Europa' | 'Oceania'

export interface Pais {
  /**
   * ISO 3166-1 alfa-2 em minúsculas, e também o nome do arquivo da bandeira.
   * Somalilândia (\`xs\`) e Chipre do Norte (\`xc\`) não têm código ISO: usam a
   * faixa XA–XZ, de uso privado, a mesma de onde vem o \`xk\` do Kosovo.
   */
  readonly id: string
  readonly nome: string
  readonly sinonimos: readonly string[]
  readonly continente: Continente
  /**
   * \`true\` para os 195 Estados — os 193 membros da ONU mais Vaticano e
   * Palestina, observadores. \`false\` para os 9 territórios, que valem ponto no
   * jogo mas não são países.
   *
   * A separação existe porque as duas listas têm naturezas diferentes: a dos
   * soberanos é verificável (quem está na ONU), a dos territórios é um punhado
   * de casos de reconhecimento parcial, dependência ou disputa, cada um pelo
   * seu motivo. O jogo aceita os dois — quem digitou "Taiwan" sabe geografia —,
   * mas quem precisa da lista canônica de Estados filtra por este campo.
   */
  readonly soberano: boolean
  /**
   * Se existe \`public/bandeiras/<id>.svg\`. Falso só para Somalilândia e Chipre
   * do Norte, que sem código ISO não têm arquivo no \`flag-icons\`. O baralho de
   * bandeiras filtra por aqui; sem isso a carta viraria um 404.
   */
  readonly bandeira: boolean
}

/** Os 195 soberanos mais os 9 territórios respondíveis. Ver \`soberano\`. */
export const PAISES: readonly Pais[] = [
${paises.map(linhaPais).join('\n')}
]

/** Só os Estados: os 193 membros da ONU mais Vaticano e Palestina. */
export const SOBERANOS: readonly Pais[] = PAISES.filter((p) => p.soberano)
`,
)

writeFileSync(
  join(RAIZ, 'src/data/paises-mapa.ts'),
  `${CABECALHO}
//
// Módulo separado de \`paises.ts\` porque os contornos são quase todo o peso do
// dataset. Importe só onde o mapa é desenhado.

/** Contorno projetado, ou ponto quando o país é pequeno demais para ter um. */
export type Forma = { readonly d: string } | { readonly x: number; readonly y: number }

/** Caixa da projeção Natural Earth usada nos contornos e nos pontos. */
export const LARGURA_MAPA = ${LARGURA}
export const ALTURA_MAPA = ${ALTURA}

/** Por id de país. Os micro-estados são pontos: no 110m não chegam a um pixel. */
export const FORMAS: Readonly<Record<string, Forma>> = {
${paises.map(linhaForma).join('\n')}
}

/**
 * O que o mapa desenha e o jogo não pergunta: Antártida e Terras Austrais
 * Francesas. Desenhá-las evita um planeta esburacado; perguntá-las seria cobrar
 * geleira desabitada. Taiwan, Kosovo, Groenlândia e os outros territórios saíram
 * daqui e hoje valem ponto — estão em \`FORMAS\`, com \`soberano: false\`.
 */
export const INERTES: readonly { readonly id: string; readonly d: string }[] = [
${inertes.map((t) => `  { id: '${t.id}', d: ${JSON.stringify(t.d)} },`).join('\n')}
]
`,
)

const comContorno = paises.filter((p) => p.d).length
const comBandeira = paises.filter((p) => p.bandeira).length
console.log(`paises.ts:      ${paises.length} países (${soberanos.length} soberanos + ${territorios.length} territórios)`)
console.log(`paises-mapa.ts: ${comContorno} contornos, ${paises.length - comContorno} pontos, ${inertes.length} inertes`)
console.log(`bandeiras:      ${comBandeira} arquivos, ${(bytes / 1024).toFixed(0)} KB`)
const semBandeira = paises.filter((p) => !p.bandeira).map((p) => p.nome)
if (semBandeira.length) console.log(`sem bandeira:   ${semBandeira.join(', ')}`)
