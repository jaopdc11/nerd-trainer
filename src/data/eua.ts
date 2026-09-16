// GERADO POR scripts/gen-eua.mjs — não edite à mão.
//
// Contornos: malha dos estados dos EUA do pacote `us-atlas`, arquivo já
// projetado em Albers USA (Alasca e Havaí reposicionados) — dado público.
// Sigla (USPS), nome em português do Brasil, sinônimos e região do Census:
// tabela escrita à mão no gerador, conferida contra uma segunda lista em
// `eua.test.ts`.

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
  { sigla: 'AL', nome: "Alabama", sinonimos: [], regiao: 'Sul' },
  { sigla: 'AK', nome: "Alasca", sinonimos: ["Alaska"], regiao: 'Oeste' },
  { sigla: 'AZ', nome: "Arizona", sinonimos: [], regiao: 'Oeste' },
  { sigla: 'AR', nome: "Arkansas", sinonimos: [], regiao: 'Sul' },
  { sigla: 'CA', nome: "Califórnia", sinonimos: ["California"], regiao: 'Oeste' },
  { sigla: 'NC', nome: "Carolina do Norte", sinonimos: ["North Carolina"], regiao: 'Sul' },
  { sigla: 'SC', nome: "Carolina do Sul", sinonimos: ["South Carolina"], regiao: 'Sul' },
  { sigla: 'CO', nome: "Colorado", sinonimos: [], regiao: 'Oeste' },
  { sigla: 'CT', nome: "Connecticut", sinonimos: ["Conecticut"], regiao: 'Nordeste' },
  { sigla: 'ND', nome: "Dakota do Norte", sinonimos: ["North Dakota","Dacota do Norte"], regiao: 'Meio-Oeste' },
  { sigla: 'SD', nome: "Dakota do Sul", sinonimos: ["South Dakota","Dacota do Sul"], regiao: 'Meio-Oeste' },
  { sigla: 'DE', nome: "Delaware", sinonimos: [], regiao: 'Sul' },
  { sigla: 'DC', nome: "Distrito de Colúmbia", sinonimos: ["Washington DC","Distrito de Columbia","District of Columbia"], regiao: 'Sul' },
  { sigla: 'FL', nome: "Flórida", sinonimos: ["Florida"], regiao: 'Sul' },
  { sigla: 'GA', nome: "Geórgia", sinonimos: ["Georgia"], regiao: 'Sul' },
  { sigla: 'HI', nome: "Havaí", sinonimos: ["Hawaii"], regiao: 'Oeste' },
  { sigla: 'ID', nome: "Idaho", sinonimos: [], regiao: 'Oeste' },
  { sigla: 'IL', nome: "Illinois", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'IN', nome: "Indiana", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'IA', nome: "Iowa", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'KS', nome: "Kansas", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'KY', nome: "Kentucky", sinonimos: [], regiao: 'Sul' },
  { sigla: 'LA', nome: "Luisiana", sinonimos: ["Louisiana","Luisiânia"], regiao: 'Sul' },
  { sigla: 'ME', nome: "Maine", sinonimos: [], regiao: 'Nordeste' },
  { sigla: 'MD', nome: "Maryland", sinonimos: [], regiao: 'Sul' },
  { sigla: 'MA', nome: "Massachusetts", sinonimos: [], regiao: 'Nordeste' },
  { sigla: 'MI', nome: "Michigan", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'MN', nome: "Minnesota", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'MS', nome: "Mississippi", sinonimos: ["Mississipi"], regiao: 'Sul' },
  { sigla: 'MO', nome: "Missouri", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'MT', nome: "Montana", sinonimos: [], regiao: 'Oeste' },
  { sigla: 'NE', nome: "Nebraska", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'NV', nome: "Nevada", sinonimos: [], regiao: 'Oeste' },
  { sigla: 'NH', nome: "Nova Hampshire", sinonimos: ["New Hampshire"], regiao: 'Nordeste' },
  { sigla: 'NJ', nome: "Nova Jersey", sinonimos: ["New Jersey","Nova Jérsei"], regiao: 'Nordeste' },
  { sigla: 'NY', nome: "Nova York", sinonimos: ["New York","Nova Iorque"], regiao: 'Nordeste' },
  { sigla: 'NM', nome: "Novo México", sinonimos: ["New Mexico"], regiao: 'Oeste' },
  { sigla: 'OH', nome: "Ohio", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'OK', nome: "Oklahoma", sinonimos: [], regiao: 'Sul' },
  { sigla: 'OR', nome: "Oregon", sinonimos: ["Óregon"], regiao: 'Oeste' },
  { sigla: 'PA', nome: "Pensilvânia", sinonimos: ["Pennsylvania"], regiao: 'Nordeste' },
  { sigla: 'RI', nome: "Rhode Island", sinonimos: [], regiao: 'Nordeste' },
  { sigla: 'TN', nome: "Tennessee", sinonimos: [], regiao: 'Sul' },
  { sigla: 'TX', nome: "Texas", sinonimos: [], regiao: 'Sul' },
  { sigla: 'UT', nome: "Utah", sinonimos: [], regiao: 'Oeste' },
  { sigla: 'VT', nome: "Vermont", sinonimos: [], regiao: 'Nordeste' },
  { sigla: 'VA', nome: "Virgínia", sinonimos: ["Virginia"], regiao: 'Sul' },
  { sigla: 'WV', nome: "Virgínia Ocidental", sinonimos: ["West Virginia"], regiao: 'Sul' },
  { sigla: 'WA', nome: "Washington", sinonimos: [], regiao: 'Oeste' },
  { sigla: 'WI', nome: "Wisconsin", sinonimos: [], regiao: 'Meio-Oeste' },
  { sigla: 'WY', nome: "Wyoming", sinonimos: [], regiao: 'Oeste' },
]
