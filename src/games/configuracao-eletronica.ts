import { ELEMENTOS } from '@/data/tabela-periodica'
import type { Elemento } from '@/data/tabela-periodica'
import {
  EXCECOES,
  PRIMEIRO_PREVISTO,
  configuracao,
  distratores,
  exibir,
} from '@/data/configuracao-eletronica'
import type { Forma } from '@/data/configuracao-eletronica'
import type { Rng } from '@/core/rng'
import type { Conteudo, Exercicio, JogoGerador } from '@/core/types'

/**
 * Configuração eletrônica contra o relógio, em quatro opções.
 *
 * **Por que não é digitada.** É o mesmo argumento do topo de
 * `derivadas-rapidas.ts`, e aqui ele é ainda mais gritante: digitar
 * "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰" mede teclado numérico, paciência com
 * expoente Unicode e nada de química. Seriam trinta e poucos caracteres por
 * item, com três formatos plausíveis para a mesma resposta certa (`3d10`,
 * `3d¹⁰`, `3d^10`) e uma disputa de espaçamento a cada carta. Com quatro
 * opções, o item volta a cobrar a única coisa que interessa — para onde vai o
 * próximo elétron — e o relógio anda.
 *
 * **Por que abreviado a partir do Z=21.** Na forma completa as quatro opções do
 * ferro começariam com os mesmos 24 caracteres e a pergunta viraria "ache a
 * diferença", que é teste de leitura; num telefone, ainda quebrariam em três
 * linhas cada. A forma com gás nobre corta o caroço, que é justamente a parte
 * que já deveria estar automatizada, e deixa na tela só o que o item cobra.
 * Até o Z=20 a forma completa fica, porque ali o caroço *é* a resposta —
 * "[Ne] 3s² 3p⁵" esconderia todo o exercício do cloro.
 *
 * **Os quatro degraus.** Os leves primeiro, onde a fila é uma fila; depois a
 * inversão 4s/3d, que é o primeiro lugar onde a diagonal importa; depois o f
 * entrando no meio do 6º e 7º períodos; e por fim as vinte exceções medidas,
 * que é o nível pelo qual este jogo existe — ver o mapa comentado em
 * `data/configuracao-eletronica.ts`.
 */

/**
 * Do Z=104 em diante a configuração é calculada e não medida, e o jogo não
 * pergunta o que ninguém conferiu na bancada.
 */
export const JOGAVEIS: readonly Elemento[] = ELEMENTOS.filter((e) => e.z < PRIMEIRO_PREVISTO)

const POR_Z = new Map<number, Elemento>(ELEMENTOS.map((e) => [e.z, e]))

/**
 * O nível do elemento.
 *
 * As exceções saem das faixas e vão todas para o topo: o cromo solto no meio do
 * nível dos metais de transição seria uma pegadinha aleatória, e no nível
 * próprio ele é o conteúdo.
 */
export function nivelDe(z: number): number {
  if (EXCECOES[z] !== undefined) return 3
  if (z <= 20) return 0
  if (z <= 56) return 1
  return 2
}

const POR_NIVEL: readonly (readonly Elemento[])[] = [0, 1, 2, 3].map((n) =>
  JOGAVEIS.filter((e) => nivelDe(e.z) === n),
)

export const NIVEL_MAX = POR_NIVEL.length - 1

/** Ver o cabeçalho: o caroço só é escondido quando não é ele a resposta. */
const formaDe = (z: number): Forma => (z <= 20 ? 'completa' : 'abreviada')

/**
 * O item de um elemento, pelo Z.
 *
 * Recebe o Z e não o `Elemento` para que o teste possa varrer os 103 jogáveis
 * um a um: o sorteio é aleatório, e "nenhum elemento produz opção repetida" é
 * afirmação que só vale se for conferida em todos.
 */
export function exercicioDe(rng: Rng, z: number): Exercicio {
  const e = POR_Z.get(z)
  if (!e) throw new Error(`configuração: não há elemento com Z=${z}`)

  const forma = formaDe(e.z)
  const certo = exibir(configuracao(e.z), forma)

  const errados: string[] = []
  for (const c of distratores(e.z)) {
    const texto = exibir(c, forma)
    // A comparação é no texto exibido e não na configuração: dois distratores
    // distintos na forma completa poderiam colapsar depois de cortar o caroço,
    // e duas opções iguais dariam pista de graça.
    if (texto !== certo && !errados.includes(texto)) errados.push(texto)
    if (errados.length === 3) break
  }
  if (errados.length < 3) {
    // O teste percorre os 103 elementos jogáveis, então isto não acontece em
    // partida — e se um dia acontecer, é dado quebrado e tem de aparecer.
    throw new Error(`Z=${e.z}: só ${errados.length} distratores distintos`)
  }

  const opcoes = rng.shuffle([certo, ...errados])
  const excecao = EXCECOES[e.z]

  return {
    tipo: 'escolha',
    chave: `config:${e.z}`,
    // O Z vem escrito porque sem ele o item viraria duas perguntas empilhadas —
    // "qual o número atômico do ferro?" e só então a configuração. Quem não
    // decorou o Z não erra química, erra outra coisa, e isso já é o jogo da
    // tabela periódica. Com o Z na tela, o distrator de contagem continua
    // custando uma soma de verdade.
    enunciado: { kind: 'texto', valor: `configuração do ${e.simbolo} (Z = ${e.z})` },
    alternativas: opcoes.map((v): Conteudo => ({ kind: 'texto', valor: v })),
    indiceCorreto: opcoes.indexOf(certo),
    gabarito: certo,
    // Só as exceções explicam: "o cromo é 4s¹ 3d⁵" sem o motivo não sobrevive à
    // próxima partida. Nos outros níveis a resposta certa já é a regra inteira.
    ...(excecao ? { porque: excecao.porque } : {}),
  }
}

export function gerarConfiguracao(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), NIVEL_MAX)
  const atuais = POR_NIVEL[n] ?? []
  // O nível novo entra em dobro: acumula os anteriores sem afogá-los.
  const sorteio = [...POR_NIVEL.slice(0, n).flat(), ...atuais, ...atuais]
  return exercicioDe(rng, rng.pick(sorteio).z)
}

export const configuracaoEletronica: JogoGerador = {
  id: 'configuracao-eletronica',
  mecanica: 'gerador',
  nome: 'Configuração eletrônica',
  icone: '1s²',
  resumo: 'Distribua os elétrons pela diagonal de Pauling, do hidrogênio ao ouro.',
  categoria: 'quimica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Escolha a configuração certa entre as quatro opções, na ordem energética: 4s² vem antes de 3d⁶.',
    'A partir do Z=21 a forma é abreviada: [Ar] vale pelos 18 elétrons do argônio.',
    'As erradas são os erros clássicos: preencher por camada, aplicar Aufbau na exceção, errar a contagem.',
    'No último nível só caem as exceções — cromo, cobre, prata, ouro e companhia. Cada acerto devolve 6 segundos.',
  ],
  config: () => ({
    gerar: gerarConfiguracao,
    // Um pouco mais folgado que os outros geradores (60 s e 5 s de bônus):
    // aqui a pessoa lê quatro cadeias de orbitais antes de decidir, e o tempo
    // de leitura não é o que o jogo quer medir.
    segundosIniciais: 75,
    bonusPorAcertoS: 6,
    tetoSegundos: 150,
    escala: (acertos) => Math.min(NIVEL_MAX, Math.floor(acertos / 5)),
    teclado: 'texto',
  }),
}
