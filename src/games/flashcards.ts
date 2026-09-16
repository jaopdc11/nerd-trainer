import { ALFABETO_GREGO } from '@/data/alfabeto-grego'
import { CONSTANTES_FISICAS } from '@/data/constantes-fisicas'
import { MOLECULAS } from '@/data/geometria-molecular'
import type { Geometria, Molecula } from '@/data/geometria-molecular'
import { FILOSOFIA, SOCIOLOGIA } from '@/data/pensadores'
import type { Item } from '@/data/pensadores'
import { PAISES } from '@/data/paises'
import type { Pais } from '@/data/paises'
import { PREFIXOS_SI } from '@/data/prefixos-si'
import { AVISOS } from './avisos'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Os baralhos que rodam sobre a mecânica C.
 *
 * Cada `montarBaralho` recebe o RNG da engine e devolve as cartas já embaralhadas
 * — é dentro dele que os modos bidirecionais decidem a direção da pergunta.
 */

// --- alfabeto grego ---------------------------------------------------------

/** Símbolo → nome. A resposta é texto: acento e caixa não importam. */
function gregoParaNome(rng: Rng): readonly Carta[] {
  return rng.shuffle(ALFABETO_GREGO).map((letra): Carta => {
    const glifo = rng.chance(0.5) ? letra.minuscula : letra.maiuscula
    return {
      tipo: 'digitada',
      id: `grego-nome-${letra.ordem}`,
      pergunta: { kind: 'texto', valor: glifo },
      resposta: {
        tipo: 'texto',
        canonica: letra.nome,
        aceitas: [letra.nome, ...letra.sinonimos],
        // Nomes gregos são curtos e parecidos entre si (ni/mi, csi/qui):
        // tolerar um caractere aceitaria a letra errada.
        opcoes: { tolerarTypo: false },
      },
      gabarito: letra.nome,
    }
  })
}

export const alfabetoGrego: JogoFlashcard = {
  id: 'alfabeto-grego',
  mecanica: 'flashcard',
  nome: 'Alfabeto grego',
  icone: 'αβγ',
  resumo: 'As 24 letras: aparece o glifo, você escreve o nome.',
  categoria: 'matematica',
  unidade: { singular: 'letra', plural: 'letras' },
  comoJogar: [
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
    'A letra aparece em maiúscula ou minúscula, sorteada.',
    '"mi" e "mu" valem igual; acento é opcional.',
  ],
  config: () => ({
    montarBaralho: gregoParaNome,
    fim: 'baralho',
    teclado: 'texto',
  }),
}

// --- prefixos SI ------------------------------------------------------------

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const
const sobrescrito = (n: number): string => {
  const corpo = [...Math.abs(n).toString()].map((d) => SUP[Number(d)] ?? '').join('')
  return n < 0 ? `⁻${corpo}` : corpo
}

export const prefixosSI: JogoFlashcard = {
  id: 'prefixos-si',
  mecanica: 'flashcard',
  nome: 'Prefixos SI',
  icone: 'n·μ·M',
  resumo: 'De quetta a quecto: aparece a potência, você escreve o nome.',
  categoria: 'fisica',
  unidade: { singular: 'prefixo', plural: 'prefixos' },
  comoJogar: [
    'Aparece 10⁻⁹ e você escreve "nano".',
    'São 24, incluindo os quatro adotados pela CGPM em 2022.',
    'Acento e maiúscula não importam.',
  ],
  config: () => ({
    montarBaralho: (rng) =>
      rng.shuffle(PREFIXOS_SI).map(
        (p): Carta => ({
          tipo: 'digitada',
          id: `si-${p.nome}`,
          pergunta: { kind: 'texto', valor: `10${sobrescrito(p.expoente)}` },
          resposta: {
            tipo: 'texto',
            canonica: p.nome,
            aceitas: [p.nome, ...p.sinonimos],
            // Nomes de prefixo são curtos e parecidos (pico/peta, zepto/zetta):
            // tolerar um caractere aceitaria o prefixo errado.
            opcoes: { tolerarTypo: false },
          },
          gabarito: `${p.nome} (${p.simbolo})`,
        }),
      ),
    fim: 'baralho',
    teclado: 'texto',
  }),
}

// --- constantes físicas -----------------------------------------------------

/**
 * Quantos algarismos você lembra — agora em quatro opções.
 *
 * Era digitado, e digitar "6,674×10⁻¹¹" contra uma lista de catorze constantes
 * é castigo, não treino. Como card fica até melhor: os distratores podem ser a
 * mesma mantissa com o expoente trocado, que é exatamente o erro que interessa
 * pegar — quem confunde 10⁻¹¹ com 10⁻⁹ em G não sabe a constante.
 */
function cartaConstante(k: (typeof CONSTANTES_FISICAS)[number], rng: Rng): Carta {
  const certo = exibirValor(k.mantissa, k.expoente, k.unidade)

  // Três erros plausíveis: ordem de grandeza para mais, para menos, e a
  // mantissa de outra constante com o expoente certo.
  const outra = rng.pick(CONSTANTES_FISICAS.filter((c) => c.id !== k.id))
  const candidatos = [
    exibirValor(k.mantissa, k.expoente + rng.pick([1, 2, 3]), k.unidade),
    exibirValor(k.mantissa, k.expoente - rng.pick([1, 2, 3]), k.unidade),
    exibirValor(outra.mantissa.slice(0, k.mantissa.length), k.expoente, k.unidade),
  ]

  const errados = [...new Set(candidatos.filter((c) => c !== certo))]
  let ajuste = 4
  while (errados.length < 3) {
    const extra = exibirValor(k.mantissa, k.expoente + ajuste, k.unidade)
    if (extra !== certo && !errados.includes(extra)) errados.push(extra)
    ajuste++
  }

  const opcoes = rng.shuffle([certo, ...errados.slice(0, 3)])

  return {
    tipo: 'escolha',
    id: `const-${k.id}`,
    pergunta: { kind: 'texto', valor: `${k.nome}  (${k.simbolo})` },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(certo),
    gabarito: certo,
  }
}

function exibirValor(mantissa: string, expoente: number, unidade: string): string {
  const cabeca = mantissa.length > 1 ? `${mantissa[0]},${mantissa.slice(1)}` : mantissa
  const corpo = expoente === 0 ? cabeca : `${cabeca}×10${sobrescrito(expoente)}`
  return `${corpo} ${unidade}`
}

export const constantesFisicas: JogoFlashcard = {
  id: 'constantes-fisicas',
  mecanica: 'flashcard',
  nome: 'Constantes físicas',
  icone: 'ħ',
  resumo: 'c, h, G, k_B, N_A — reconheça o valor certo entre quatro.',
  categoria: 'fisica',
  unidade: { singular: 'constante', plural: 'constantes' },
  comoJogar: [
    'Escolha o valor certo da constante entre as quatro opções.',
    'As erradas costumam ter a mantissa certa e o expoente trocado.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(CONSTANTES_FISICAS).map((k) => cartaConstante(k, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}

// --- geometria molecular ----------------------------------------------------

/**
 * As formas que a VSEPR admite para cada número de domínios eletrônicos.
 *
 * É daqui que saem os melhores distratores: uma forma irmã tem o mesmo número
 * de domínios que a certa, então escolher entre elas é exatamente contar os
 * pares isolados — que é a única coisa que o jogo quer medir. Oferecer
 * "octaédrica" para a água não testa nada, porque ninguém erra assim.
 */
const IRMAS: Readonly<Record<number, readonly Geometria[]>> = {
  2: ['linear'],
  3: ['trigonal plana', 'angular'],
  4: ['tetraédrica', 'piramidal trigonal', 'angular'],
  5: ['bipiramidal trigonal', 'gangorra', 'forma de T', 'linear'],
  6: ['octaédrica', 'piramidal quadrada', 'quadrada planar'],
}

const TODAS: readonly Geometria[] = [...new Set(Object.values(IRMAS).flat())]

function cartaGeometria(m: Molecula, rng: Rng): Carta {
  const dominios = m.ligados + m.isolados

  /*
   * Os errados, em ordem de quão tentadores são:
   * 1. a geometria eletrônica — o erro de quem esqueceu os pares isolados;
   * 2. as irmãs do mesmo número de domínios;
   * 3. qualquer outra, só para fechar quatro opções quando falta.
   */
  const candidatos = [
    ...(m.eletronica === m.geometria ? [] : [m.eletronica]),
    ...rng.shuffle([...(IRMAS[dominios] ?? [])]),
    ...rng.shuffle([...TODAS]),
  ]

  const errados: Geometria[] = []
  for (const c of candidatos) {
    if (c !== m.geometria && !errados.includes(c)) errados.push(c)
    if (errados.length === 3) break
  }

  const opcoes = rng.shuffle([m.geometria, ...errados])

  return {
    tipo: 'escolha',
    id: `geo-${m.formula}`,
    pergunta: { kind: 'texto', valor: m.formula },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(m.geometria),
    // Quem errou precisa ver a conta, não só a resposta: é a contagem de
    // domínios que decide a forma.
    gabarito: `${m.geometria} — ${m.axe}, ${m.ligados} ligados e ${m.isolados} isolado${
      m.isolados === 1 ? '' : 's'
    }`,
  }
}

export const geometriaMolecular: JogoFlashcard = {
  id: 'geometria-molecular',
  mecanica: 'flashcard',
  nome: 'Geometria molecular',
  icone: '⌬',
  resumo: 'VSEPR: aparece a fórmula, você diz a forma.',
  categoria: 'quimica',
  unidade: { singular: 'molécula', plural: 'moléculas' },
  comoJogar: [
    'Escolha a geometria da molécula entre as quatro opções.',
    'Conte os domínios do átomo central e desconte os pares isolados: H₂O tem quatro domínios e mesmo assim é angular.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(MOLECULAS).map((m) => cartaGeometria(m, rng)),
    fim: 'baralho',
    teclado: 'texto',
  }),
}

// --- pensadores: filosofia e sociologia -------------------------------------

/**
 * Conceito ou obra → autor.
 *
 * Digitado, e não múltipla escolha, pela régua do projeto: a resposta é um
 * sobrenome curto e o desafio é *lembrar* quem foi, não reconhecer numa lista.
 * Card aqui trocaria recordar por reconhecer, que é o erro oposto ao das
 * fórmulas.
 *
 * `tolerarTypo` fica ligado — "Nietzsche" e "Durkheim" passam dos sete
 * caracteres e ninguém deveria perder o ponto por uma letra. A trava contra dar
 * a resposta do vizinho de baralho continua valendo: se o que foi digitado
 * também estiver a um caractere de outro autor do mesmo deck, a entrada é
 * ambígua e não passa.
 */
function cartaPensador(item: Item, prefixo: string): Carta {
  return {
    tipo: 'digitada',
    id: `${prefixo}-${item.id}`,
    pergunta: { kind: 'texto', valor: item.pergunta },
    dica: item.tipo === 'obra' ? 'obra' : 'conceito',
    resposta: {
      tipo: 'texto',
      canonica: item.autor,
      aceitas: [...item.aceitas],
    },
    gabarito: item.autor,
  }
}

export const filosofia: JogoFlashcard = {
  id: 'filosofia',
  mecanica: 'flashcard',
  nome: 'Filosofia',
  icone: '🏛',
  resumo: 'Conceito ou obra na tela, você escreve de quem é.',
  categoria: 'humanas',
  unidade: { singular: 'carta', plural: 'cartas' },
  comoJogar: [
    'Aparece "imperativo categórico", você escreve Kant.',
    'Só o sobrenome basta; acento e maiúscula não importam.',
    'Nada de interpretação: aqui só se pergunta autoria, que é o que tem resposta.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(FILOSOFIA).map((i) => cartaPensador(i, 'filo')),
    fim: 'baralho',
    teclado: 'texto',
  }),
}

export const sociologia: JogoFlashcard = {
  id: 'sociologia',
  mecanica: 'flashcard',
  nome: 'Sociologia',
  icone: '👥',
  resumo: 'Dos três clássicos ao pensamento social brasileiro.',
  categoria: 'humanas',
  unidade: { singular: 'carta', plural: 'cartas' },
  comoJogar: [
    'Aparece "fato social", você escreve Durkheim.',
    'Só o sobrenome basta — menos onde ele não identifica, como Sérgio Buarque de Holanda.',
    'Tem Marx, Weber e Durkheim, e tem Florestan, Gilberto Freyre e Djamila Ribeiro.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(SOCIOLOGIA).map((i) => cartaPensador(i, 'socio')),
    fim: 'baralho',
    teclado: 'texto',
  }),
}

// --- bandeiras --------------------------------------------------------------

/**
 * Bandeira → país.
 *
 * A bandeira vem de `public/bandeiras/`, um arquivo por país, e não do bundle.
 * As 202 somam 1,3 MB — a da Sérvia sozinha tem 177 KB por causa do brasão — e
 * embutir isso custaria mais que o app inteiro. Como asset, cada carta baixa só
 * a sua, e a mediana é de 0,8 KB.
 *
 * **O baralho é filtrado por `bandeira`, não pelos 195.** Taiwan, Kosovo,
 * Groenlândia e os outros territórios têm SVG no `flag-icons` e entram; só
 * Somalilândia e Chipre do Norte ficam de fora, porque sem código ISO não têm
 * arquivo no pacote e a carta viraria um 404. O dataset carrega essa informação
 * para que ela não vire uma lista paralela esquecida aqui.
 *
 * A tolerância a erro de digitação fica **ligada**, ao contrário do grego e dos
 * prefixos SI. A medição que a mantinha desligada estava errada: ela comparava
 * todas as formas contra todas e contava como perigosos cinco pares que eram
 * sinônimos do mesmo país. Refeita país contra país, e já com a tolerância
 * escalada por tamanho, não sobra nenhum par ambíguo entre os 195 — e o que
 * sobrasse cairia na trava de vizinhança, que recusa qualquer texto que encoste
 * em duas cartas ao mesmo tempo. Ver `paises.test.ts`.
 */
function cartaBandeira(p: Pais): Carta {
  return {
    tipo: 'digitada',
    id: `bandeira-${p.id}`,
    pergunta: {
      kind: 'imagem',
      valor: `${import.meta.env.BASE_URL}bandeiras/${p.id}.svg`,
      alt: 'Bandeira a identificar',
    },
    // O mesmo recado dos dois mapas, na mesma lista: uma posição dessas não
    // pode valer num tabuleiro e sumir aqui porque o jogo é de outro tipo.
    ...(AVISOS[p.id] ? { aviso: AVISOS[p.id] } : {}),
    resposta: {
      tipo: 'texto',
      canonica: p.nome,
      aceitas: [p.nome, ...p.sinonimos],
    },
    gabarito: p.nome,
  }
}

export const bandeiras: JogoFlashcard = {
  id: 'bandeiras',
  mecanica: 'flashcard',
  nome: 'Bandeiras',
  icone: '🏳',
  resumo: 'As 202 bandeiras: aparece a bandeira, você escreve o país.',
  categoria: 'geografia',
  unidade: { singular: 'bandeira', plural: 'bandeiras' },
  comoJogar: [
    'Os 193 membros da ONU, mais Vaticano, Palestina e sete territórios.',
    'Acento, maiúscula e espaço não importam; "Holanda" e "EUA" valem.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(PAISES.filter((p) => p.bandeira)).map(cartaBandeira),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
