/**
 * Análise dimensional: `[F] = MLT⁻²`.
 *
 * **A notação não está escrita em lugar nenhum**, exatamente como o nox não está
 * escrito em `data/nox.ts`. Ela é montada a partir dos expoentes que
 * `data/grandezas.ts` já guarda para a unidade, trocando cada unidade de base
 * pela letra da dimensão correspondente:
 *
 *     kg → M   m → L   s → T   A → I   K → Θ   mol → N   cd → J
 *
 * A tradução é biunívoca porque o SI a fez assim — cada grandeza de base tem uma
 * unidade de base e uma letra dimensional, e nada mais. Por isso **este arquivo
 * não tem tabela própria**: se tivesse, `capacitância` apareceria como
 * `kg⁻¹·m⁻²·s⁴·A²` lá e como `M⁻¹L⁻²T⁴I²` aqui, e a segunda cópia estaria livre
 * para envelhecer errado. Do jeito que está, um expoente trocado aparece nos
 * dois jogos ao mesmo tempo e quebra no teste dos dois — que é onde tem de
 * quebrar. A alternativa descartada era guardar aqui as dimensões e derivar as
 * unidades: dá no mesmo matematicamente, mas inverte a hierarquia dos dados, já
 * que é a unidade que o SI define e a dimensão que se lê dela.
 *
 * A ordem das letras é a de ISO 80000 — M, L, T, I, Θ, N, J —, que é a mesma
 * ordem de `BASES_SI`. Não é coincidência: as duas listas foram escritas juntas
 * justamente para que a tradução seja posição a posição.
 */

import { BASES_SI, GRANDEZAS, expoentes, sobrescrito } from './grandezas'
import type { BaseSI, Expoentes, Grandeza } from './grandezas'

/** A tradução, e o arquivo inteiro depende dela. */
const LETRA: Readonly<Record<BaseSI, string>> = {
  kg: 'M',
  m: 'L',
  s: 'T',
  A: 'I',
  K: 'Θ',
  mol: 'N',
  cd: 'J',
}

/**
 * Sem `·` entre os fatores, ao contrário da unidade.
 *
 * `MLT⁻²` é como se escreve em análise dimensional, e é o formato em que o
 * jogador vai reconhecer a resposta na prova. A unidade usa ponto (`kg·m·s⁻²`)
 * porque lá os símbolos têm mais de uma letra e `kgms⁻²` seria ilegível; aqui
 * cada fator é uma letra só e o ponto só atrapalharia a comparação visual entre
 * quatro alternativas parecidas.
 */
function notacao(base: Expoentes, contexto: string): string {
  // Passa por `expoentes()` de propósito: são as mesmas guardas da unidade —
  // expoente fracionário, zero escrito à mão, dimensão vazia. Uma dimensão não
  // pode ser mais frouxa que a unidade de que ela sai.
  return expoentes({ id: contexto, nome: contexto, base, definicao: '—' })
    .map(([b, e]) => `${LETRA[b]}${sobrescrito(e)}`)
    .join('')
}

export function notacaoDimensional(g: Grandeza): string {
  return notacao(g.base, g.id)
}

/** Devolve uma cópia com um expoente trocado; zero remove a base da lista. */
function comExpoente(base: Expoentes, b: BaseSI, valor: number): Expoentes {
  const saida: Partial<Record<BaseSI, number>> = { ...base }
  if (valor === 0) delete saida[b]
  else saida[b] = valor
  return saida
}

const expoenteDe = (base: Expoentes, b: BaseSI): number => base[b] ?? 0

/** Quantos degraus de expoente separam duas grandezas, somando todas as bases. */
function distancia(a: Expoentes, b: Expoentes): number {
  let total = 0
  for (const base of BASES_SI) total += Math.abs(expoenteDe(a, base) - expoenteDe(b, base))
  return total
}

/**
 * As alternativas erradas que alguém de fato marca, em ordem de prioridade.
 *
 * Distrator aleatório não mede nada: `M³L⁵I⁷` se elimina sozinho sem que a
 * pessoa saiba o que é pressão. Os dois primeiros da lista são erros com nome, e
 * são os dois pedidos:
 *
 * 1. **o sinal trocado** — `MLT²` no lugar de `MLT⁻²`. É o erro de quem decorou
 *    o desenho da cadeia e não a conta: divisão por tempo ao quadrado vira
 *    multiplicação, e a alternativa fica idêntica à certa menos por um traço.
 *    O sinal é trocado no tempo porque é lá que ele mora em quase toda grandeza
 *    de mecânica; onde não há tempo, troca-se o da última base que existir.
 * 2. **a grandeza vizinha** — energia contra potência (um `T` de diferença),
 *    pressão contra força (dois `L`), velocidade contra aceleração. A vizinhança
 *    **não é uma lista escrita à mão**: é a distância entre os expoentes de duas
 *    grandezas do próprio dataset, e quem estiver a até dois degraus entra,
 *    do mais perto para o mais longe. Lista à mão envelheceria calada — bastaria
 *    alguém acrescentar uma grandeza para o par óbvio nunca aparecer.
 * 3. **a conta quase feita** — dividir por tempo, multiplicar por comprimento.
 *    É o que sobra quando a grandeza tem poucos vizinhos, e ainda assim é um
 *    erro plausível: é literalmente parar um passo antes do fim.
 * 4. Qualquer outra dimensão da tabela, só para fechar quatro opções.
 *
 * Mora no dataset, e não no jogo, pelo mesmo motivo que os distratores do nox:
 * a lista é física, e quem mexer nos expoentes tem de ver os erros plausíveis na
 * mesma tela.
 *
 * A comparação de repetidos é feita **pela notação**, não pelos expoentes, e
 * isso é essencial: torque e energia têm exatamente os mesmos expoentes, então
 * "a grandeza vizinha" do torque seria a resposta certa escrita de outro jeito.
 * O filtro derruba, e a carta continua com quatro opções distintas.
 */
export function distratoresDimensionais(g: Grandeza): readonly string[] {
  const certa = notacaoDimensional(g)

  // 1. o sinal trocado, no tempo quando ele existe.
  const baseDoSinal = BASES_SI.filter((b) => expoenteDe(g.base, b) !== 0)
  const alvoSinal = g.base.s !== undefined ? 's' : baseDoSinal[baseDoSinal.length - 1]
  const sinalTrocado =
    alvoSinal === undefined ? [] : [comExpoente(g.base, alvoSinal, -expoenteDe(g.base, alvoSinal))]

  // 2. os vizinhos do dataset, do mais perto para o mais longe.
  const vizinhos = GRANDEZAS.filter((outra) => outra.id !== g.id)
    .map((outra) => ({ base: outra.base, d: distancia(g.base, outra.base) }))
    .filter((v) => v.d <= 2)
    .sort((a, b) => a.d - b.d)
    .map((v) => v.base)

  // 3. a conta quase feita.
  const quaseFeita = [
    comExpoente(g.base, 's', expoenteDe(g.base, 's') - 1),
    comExpoente(g.base, 'm', expoenteDe(g.base, 'm') + 1),
    comExpoente(g.base, 's', expoenteDe(g.base, 's') + 1),
    comExpoente(g.base, 'm', expoenteDe(g.base, 'm') - 1),
  ]

  // 4. o resto da tabela, em ordem fixa — determinismo importa: quem embaralha
  // é o jogo, com o RNG semeado da partida.
  const resto = GRANDEZAS.filter((outra) => outra.id !== g.id).map((outra) => outra.base)

  const vistas = new Set<string>([certa])
  const saida: string[] = []
  for (const candidata of [...sinalTrocado, ...vizinhos, ...quaseFeita, ...resto]) {
    // Uma candidata pode ter ficado sem nenhuma base (dividir `T⁻¹` por tempo
    // uma vez de novo não, mas `T` por tempo sim): adimensional está fora do
    // jogo, e `notacao()` quebraria. Aqui ela só não entra.
    if (BASES_SI.every((b) => expoenteDe(candidata, b) === 0)) continue

    const texto = notacao(candidata, g.id)
    if (vistas.has(texto)) continue
    vistas.add(texto)
    saida.push(texto)
  }
  return saida
}
