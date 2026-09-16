/**
 * Gera `src/data/estados.ts` e `src/data/estados-mapa.ts`.
 *
 * Uma fonte só, e oficial: a malha das 27 unidades da federação do IBGE, em
 * GeoJSON, na qualidade intermediária.
 *
 *   https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR
 *     ?formato=application/vnd.geo+json&intrarregiao=UF&qualidade=intermediaria
 *
 * A resposta é **cacheada em `scripts/malha-uf-ibge.json`**: o gerador é de
 * build e não pode depender de o serviço do IBGE estar de pé — e, cacheado, a
 * saída é reprodutível byte a byte. Apague o arquivo para rebaixar de novo.
 *
 * A malha traz só `properties.codarea`, o código do IBGE (11 a 53). Sigla, nome,
 * capital e região vêm da tabela escrita à mão aqui embaixo: são 27 linhas que
 * não mudam desde 1988, e uma segunda fonte de rede para isso seria mais frágil
 * que digitá-las. `estados.test.ts` confere as capitais contra uma terceira
 * lista, escrita de novo lá dentro — o dado não se autoaprova.
 *
 * Uso: node scripts/gen-estados.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoMercator, geoPath } from 'd3-geo'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..')
const CACHE = join(AQUI, 'malha-uf-ibge.json')

const URL_IBGE =
  'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR' +
  '?formato=application/vnd.geo+json&intrarregiao=UF&qualidade=intermediaria'

/**
 * Código do IBGE → unidade da federação.
 *
 * São 26 estados mais o Distrito Federal, que **não** é estado mas é UF, tem
 * malha própria e é onde fica Brasília — deixá-lo de fora abriria um buraco no
 * meio do Centro-Oeste. As cinco regiões são as oficiais do IBGE, e o primeiro
 * dígito do código já é a região (1 Norte, 2 Nordeste, 3 Sudeste, 4 Sul,
 * 5 Centro-Oeste): a checagem abaixo usa isso para pegar linha trocada.
 */
const UFS = {
  11: { sigla: 'RO', nome: 'Rondônia', capital: 'Porto Velho', regiao: 'Norte' },
  12: { sigla: 'AC', nome: 'Acre', capital: 'Rio Branco', regiao: 'Norte' },
  13: { sigla: 'AM', nome: 'Amazonas', capital: 'Manaus', regiao: 'Norte' },
  14: { sigla: 'RR', nome: 'Roraima', capital: 'Boa Vista', regiao: 'Norte' },
  15: { sigla: 'PA', nome: 'Pará', capital: 'Belém', regiao: 'Norte' },
  16: { sigla: 'AP', nome: 'Amapá', capital: 'Macapá', regiao: 'Norte' },
  17: { sigla: 'TO', nome: 'Tocantins', capital: 'Palmas', regiao: 'Norte' },
  21: { sigla: 'MA', nome: 'Maranhão', capital: 'São Luís', regiao: 'Nordeste' },
  22: { sigla: 'PI', nome: 'Piauí', capital: 'Teresina', regiao: 'Nordeste' },
  23: { sigla: 'CE', nome: 'Ceará', capital: 'Fortaleza', regiao: 'Nordeste' },
  24: { sigla: 'RN', nome: 'Rio Grande do Norte', capital: 'Natal', regiao: 'Nordeste' },
  25: { sigla: 'PB', nome: 'Paraíba', capital: 'João Pessoa', regiao: 'Nordeste' },
  26: { sigla: 'PE', nome: 'Pernambuco', capital: 'Recife', regiao: 'Nordeste' },
  27: { sigla: 'AL', nome: 'Alagoas', capital: 'Maceió', regiao: 'Nordeste' },
  28: { sigla: 'SE', nome: 'Sergipe', capital: 'Aracaju', regiao: 'Nordeste' },
  29: { sigla: 'BA', nome: 'Bahia', capital: 'Salvador', regiao: 'Nordeste' },
  31: { sigla: 'MG', nome: 'Minas Gerais', capital: 'Belo Horizonte', regiao: 'Sudeste' },
  32: { sigla: 'ES', nome: 'Espírito Santo', capital: 'Vitória', regiao: 'Sudeste' },
  33: { sigla: 'RJ', nome: 'Rio de Janeiro', capital: 'Rio de Janeiro', regiao: 'Sudeste' },
  35: { sigla: 'SP', nome: 'São Paulo', capital: 'São Paulo', regiao: 'Sudeste' },
  41: { sigla: 'PR', nome: 'Paraná', capital: 'Curitiba', regiao: 'Sul' },
  42: { sigla: 'SC', nome: 'Santa Catarina', capital: 'Florianópolis', regiao: 'Sul' },
  43: { sigla: 'RS', nome: 'Rio Grande do Sul', capital: 'Porto Alegre', regiao: 'Sul' },
  50: { sigla: 'MS', nome: 'Mato Grosso do Sul', capital: 'Campo Grande', regiao: 'Centro-Oeste' },
  51: { sigla: 'MT', nome: 'Mato Grosso', capital: 'Cuiabá', regiao: 'Centro-Oeste' },
  52: { sigla: 'GO', nome: 'Goiás', capital: 'Goiânia', regiao: 'Centro-Oeste' },
  53: { sigla: 'DF', nome: 'Distrito Federal', capital: 'Brasília', regiao: 'Centro-Oeste' },
}

/** Primeiro dígito do código do IBGE → região. Pega linha trocada na tabela. */
const REGIAO_POR_DIGITO = {
  1: 'Norte',
  2: 'Nordeste',
  3: 'Sudeste',
  4: 'Sul',
  5: 'Centro-Oeste',
}

for (const [codigo, uf] of Object.entries(UFS)) {
  const esperada = REGIAO_POR_DIGITO[codigo[0]]
  if (uf.regiao !== esperada) {
    throw new Error(`${uf.sigla}: código ${codigo} é ${esperada}, e a tabela diz ${uf.regiao}`)
  }
}

// --- malha ------------------------------------------------------------------

async function malha() {
  if (existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, 'utf8'))

  console.log('sem cache: baixando a malha do IBGE...')
  const resposta = await fetch(URL_IBGE)
  if (!resposta.ok) throw new Error(`IBGE respondeu ${resposta.status}`)
  const texto = await resposta.text()
  writeFileSync(CACHE, texto)
  return JSON.parse(texto)
}

const geo = desenrolar(await malha())

if (geo.features.length !== 27) {
  throw new Error(`esperava 27 feições na malha, vieram ${geo.features.length}`)
}

/**
 * Inverte os anéis que vêm com o sentido trocado.
 *
 * **Sem isto o mapa sai errado e não sai quebrado**, que é o pior jeito de
 * errar: o `d3-geo` trata polígono como região da esfera, e quem decide se o
 * anel delimita o Acre ou *todo o resto do planeta menos o Acre* é o sentido em
 * que ele foi percorrido. A malha do IBGE vem no sentido oposto ao que o d3
 * espera, então cada UF virava o mundo inteiro, o `fitSize` enxergava uma caixa
 * de 360×180 graus e o Brasil saía do tamanho de uma unha no canto do viewBox.
 *
 * A regra: anel externo no sentido horário (área positiva pela fórmula do
 * cadarço abaixo, com a longitude em x e a latitude em y), buracos no sentido
 * contrário.
 */
function desenrolar(bruto) {
  const area = (anel) => {
    let soma = 0
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      soma += (anel[i][0] - anel[j][0]) * (anel[i][1] + anel[j][1])
    }
    return soma / 2
  }

  const ajustar = (aneis) =>
    aneis.map((anel, i) => {
      const horario = area(anel) > 0
      // Externo horário, buraco anti-horário: o inverso de um deles é furo.
      return horario === (i === 0) ? anel : [...anel].reverse()
    })

  return {
    ...bruto,
    features: bruto.features.map((f) => ({
      ...f,
      geometry:
        f.geometry.type === 'Polygon'
          ? { ...f.geometry, coordinates: ajustar(f.geometry.coordinates) }
          : { ...f.geometry, coordinates: f.geometry.coordinates.map(ajustar) },
    })),
  }
}

/*
 * Mercator, e não a Natural Earth do mapa-múndi: aquela existe para não deformar
 * um planeta inteiro, e aqui o recorte tem 39 graus de latitude — na escala do
 * Brasil, Mercator é o desenho que todo mundo reconhece.
 *
 * A caixa sai do próprio contorno: dois passos, o primeiro só para medir a
 * proporção do país, o segundo para projetar de verdade numa caixa dessa
 * proporção. Sem isso, um `viewBox` chutado deixaria tarja vazia num dos lados.
 */
const ALTURA = 1000
const medida = geoPath(geoMercator().fitSize([ALTURA, ALTURA], geo)).bounds(geo)
const proporcao = (medida[1][0] - medida[0][0]) / (medida[1][1] - medida[0][1])
const LARGURA = Math.round(ALTURA * proporcao)

const projecao = geoMercator().fitSize([LARGURA, ALTURA], geo)
const caminho = geoPath(projecao)

/** Uma casa decimal, o mesmo corte do mapa-múndi: ~32 KB gzip, e nada some. */
const arredondar = (d) => d.replace(/-?\d+\.?\d*/g, (n) => String(Number(Number(n).toFixed(1))))

const formaPorSigla = new Map()
for (const f of geo.features) {
  const codigo = String(f.properties.codarea)
  const uf = UFS[codigo]
  if (!uf) throw new Error(`malha trouxe o código ${codigo}, que não está na tabela`)
  const d = caminho(f)
  if (!d) throw new Error(`${uf.sigla} não gerou contorno`)
  formaPorSigla.set(uf.sigla, arredondar(d))
}

const estados = Object.entries(UFS)
  .map(([codigo, uf]) => ({ codigo, ...uf }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

for (const e of estados) {
  if (!formaPorSigla.has(e.sigla)) throw new Error(`${e.nome} ficou sem forma na malha`)
}

// --- saída ------------------------------------------------------------------

/*
 * Dois arquivos, e a divisão é de peso e não de organização — a mesma de
 * `paises.ts`/`paises-mapa.ts`. Os contornos são praticamente o dataset
 * inteiro; sigla, nome, capital e região somam alguns kilobytes. O jogo de
 * capitais só precisa do segundo grupo, e enquanto tudo morasse num módulo só
 * ele arrastaria o mapa do Brasil para dentro do bundle sem desenhar nada.
 */
const CABECALHO = `// GERADO POR scripts/gen-estados.mjs — não edite à mão.
//
// Contornos: malha das UFs do IBGE, qualidade intermediária (dado público).
// Sigla, nome, capital e região: tabela escrita à mão no gerador, conferida
// contra uma segunda lista em \`estados.test.ts\`.`

const linhaEstado = (e) =>
  `  { sigla: '${e.sigla}', nome: ${JSON.stringify(e.nome)}, capital: ${JSON.stringify(
    e.capital,
  )}, regiao: '${e.regiao}' },`

writeFileSync(
  join(RAIZ, 'src/data/estados.ts'),
  `${CABECALHO}

export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'

export interface Estado {
  /** Sigla de duas letras maiúsculas. É a chave das formas do mapa. */
  readonly sigla: string
  readonly nome: string
  readonly capital: string
  readonly regiao: Regiao
}

/** As 27 unidades da federação: 26 estados mais o Distrito Federal. */
export const ESTADOS: readonly Estado[] = [
${estados.map(linhaEstado).join('\n')}
]
`,
)

writeFileSync(
  join(RAIZ, 'src/data/estados-mapa.ts'),
  `${CABECALHO}
//
// Módulo separado de \`estados.ts\` porque os contornos são quase todo o peso do
// dataset. Importe só onde o mapa é desenhado.

/** Caixa da projeção Mercator. A proporção é a do próprio contorno do país. */
export const LARGURA_MAPA = ${LARGURA}
export const ALTURA_MAPA = ${ALTURA}

/** Contorno projetado, por sigla. Toda UF tem o seu: aqui não existe ponto. */
export const FORMAS: Readonly<Record<string, { readonly d: string }>> = {
${estados.map((e) => `  ${e.sigla}: { d: ${JSON.stringify(formaPorSigla.get(e.sigla))} },`).join('\n')}
}
`,
)

const bytes = estados.reduce((total, e) => total + formaPorSigla.get(e.sigla).length, 0)
console.log(`estados.ts:      ${estados.length} UFs`)
console.log(`estados-mapa.ts: ${estados.length} contornos, caixa ${LARGURA}×${ALTURA}, ${(bytes / 1024).toFixed(0)} KB de path`)
