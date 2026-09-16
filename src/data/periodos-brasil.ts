/**
 * Os períodos da História do Brasil, do pré-cabralino à Nova República.
 *
 * **Por que a lista é esta e não outra.** Periodização não é fato, é convenção
 * — e convenção discutida. O recorte adotado é o dos livros didáticos
 * brasileiros, que é o que a escola cobra e o que o vestibular pergunta, com
 * duas escolhas que merecem ser ditas em voz alta:
 *
 * 1. **A Colônia termina em 1815, não em 1822.** Há manual que estica o período
 *    colonial até a Independência e trata o Reino Unido como um detalhe. Aqui
 *    ele é um período próprio, porque 1815 é exatamente quando o Brasil deixa
 *    de ser colônia no papel — e sem essa linha a sequência teria um buraco
 *    conceitual entre a chegada da corte e o Grito do Ipiranga.
 * 2. **O Estado Novo não é um período desta lista.** Ele é uma fase dentro da
 *    Era Vargas, e promovê-lo a item faria a lista misturar duas réguas: a de
 *    regime e a de governo. Pelo mesmo motivo o período joanino (1808–1821) não
 *    entra: ele **atravessa** a fronteira de 1815, e um item que se sobrepõe a
 *    dois outros destrói a única propriedade que segura este dataset em pé.
 *
 * **Essa propriedade é a continuidade.** Cada período começa exatamente onde o
 * anterior termina: sem buraco e sem sobreposição. Não é enfeite de teste — é a
 * definição do que uma periodização é. Se dois períodos vizinhos discordassem
 * de um ano, o jogo estaria ensinando que existe um intervalo da história do
 * Brasil que não pertence a época nenhuma. O teste cobra isso em todas as dez
 * fronteiras internas.
 *
 * Só as duas pontas ficam abertas, e por razões opostas: o pré-cabralino não
 * tem marco inicial (a ocupação humana do território é de milhares de anos
 * antes, e a data é objeto de pesquisa, não de gabarito) e a Nova República não
 * tem fim porque estamos dentro dela.
 *
 * Aqui o ano basta e a data cheia atrapalharia: períodos são marcados por
 * processos, não por dias. 1930 é a Revolução de 30, que dura meses; 1985 é uma
 * transição de anos. Fingir precisão de calendário seria inventar exatidão que
 * o objeto não tem — ao contrário da lista de presidentes, em que o dia da
 * posse é fato duro e necessário para ordenar.
 */
export interface Periodo {
  readonly id: string
  /** O que se digita e o que aparece na fita. */
  readonly nome: string
  /** Formas aceitas. A primeira é sempre `nome`. */
  readonly aceitas: readonly string[]
  /** `null` só no pré-cabralino: sem marco inicial. */
  readonly inicio: number | null
  /** `null` só na Nova República: em curso. */
  readonly fim: number | null
  /** O acontecimento que abre o período. É o que vai para o gabarito. */
  readonly marco: string
}

export const PERIODOS: readonly Periodo[] = [
  {
    id: 'pre-cabralino',
    nome: 'Pré-cabralino',
    aceitas: ['Pré-cabralino', 'Pré-colonial', 'Período pré-colonial'],
    inicio: null,
    fim: 1500,
    marco: 'a ocupação indígena do território, milhares de anos antes de 1500',
  },
  {
    id: 'colonia',
    nome: 'Colônia',
    aceitas: ['Colônia', 'Brasil Colônia', 'Período colonial', 'Colonial'],
    inicio: 1500,
    // 1815 e não 1822: ver a nota do topo.
    fim: 1815,
    marco: 'a chegada da esquadra de Cabral',
  },
  {
    id: 'reino-unido',
    nome: 'Reino Unido',
    aceitas: [
      'Reino Unido',
      'Reino Unido de Portugal, Brasil e Algarves',
      'Período do Reino Unido',
    ],
    inicio: 1815,
    fim: 1822,
    marco: 'a elevação do Brasil a Reino Unido a Portugal e Algarves',
  },
  {
    id: 'primeiro-reinado',
    nome: 'Primeiro Reinado',
    /*
     * "1º Reinado" ficou de fora, e não por gosto: a normalização do projeto
     * apaga o indicador de ordinal ("2ª lei" → "2 lei"), então "1º Reinado" e
     * "2º Reinado" viram "1reinado" e "2reinado" — oito caracteres, um só de
     * diferença, dentro da tolerância a erro de digitação. Aceitar as duas
     * formas faria o jogo dar de graça justamente a distinção que ele existe
     * para cobrar. Medido em `periodos-brasil.test.ts`, não suposto.
     */
    aceitas: ['Primeiro Reinado'],
    inicio: 1822,
    fim: 1831,
    marco: 'a Independência e a coroação de D. Pedro I',
  },
  {
    id: 'regencia',
    nome: 'Regência',
    aceitas: ['Regência', 'Período regencial', 'Regencial'],
    inicio: 1831,
    fim: 1840,
    marco: 'a abdicação de D. Pedro I, com o herdeiro de cinco anos',
  },
  {
    id: 'segundo-reinado',
    nome: 'Segundo Reinado',
    /** Sem "2º Reinado", pelo motivo explicado no Primeiro Reinado. */
    aceitas: ['Segundo Reinado'],
    inicio: 1840,
    fim: 1889,
    marco: 'o Golpe da Maioridade, que declarou D. Pedro II apto aos 14 anos',
  },
  {
    id: 'republica-velha',
    nome: 'República Velha',
    aceitas: [
      'República Velha',
      'Primeira República',
      'República Oligárquica',
      'República do café com leite',
    ],
    inicio: 1889,
    fim: 1930,
    marco: 'a Proclamação da República',
  },
  {
    id: 'era-vargas',
    nome: 'Era Vargas',
    // 'Estado Novo' não é sinônimo: é uma fase de dentro, e aceitá-la ensinaria
    // que o período começa em 1937. Ver a nota do topo.
    aceitas: ['Era Vargas', 'Governo Vargas'],
    inicio: 1930,
    fim: 1945,
    marco: 'a Revolução de 1930, que derrubou Washington Luís',
  },
  {
    id: 'republica-46',
    // O nome vem da Constituição de 1946, mas o período começa em 1945, com a
    // queda de Vargas: chamar de "República de 1946" um período que abre em
    // 1945 é confuso e é, mesmo assim, como a escola chama. Ficam aceitos os
    // dois apelidos pelos quais ela também é conhecida.
    nome: 'República de 1946',
    aceitas: [
      'República de 1946',
      'República de 46',
      'Quarta República',
      'República populista',
      'República liberal',
    ],
    inicio: 1945,
    fim: 1964,
    marco: 'a deposição de Vargas e a redemocratização',
  },
  {
    id: 'ditadura-militar',
    nome: 'Ditadura Militar',
    /*
     * "Quinta República" existe na literatura e mesmo assim não entra:
     * compactada dá "quintarepublica", a dois caracteres de "quartarepublica"
     * — que é a República de 1946, o período **imediatamente anterior**. Com a
     * tolerância de dois erros que uma palavra de quinze caracteres ganha, uma
     * das duas respostas valeria pela outra. Entre perder um sinônimo pouco
     * usado e aceitar o período errado, perde-se o sinônimo.
     */
    aceitas: ['Ditadura Militar', 'Regime Militar', 'Ditadura civil-militar'],
    inicio: 1964,
    fim: 1985,
    marco: 'o golpe de 31 de março de 1964',
  },
  {
    id: 'nova-republica',
    nome: 'Nova República',
    aceitas: ['Nova República', 'Sexta República'],
    inicio: 1985,
    fim: null,
    marco: 'o fim do governo militar e a posse de um presidente civil',
  },
]

/** "1822–1831", "até 1500", "1985 até hoje". */
export function exibirPeriodo(p: Periodo): string {
  if (p.inicio === null) return `até ${p.fim}`
  if (p.fim === null) return `${p.inicio} até hoje`
  return `${p.inicio}–${p.fim}`
}
