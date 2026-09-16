import { ENDOCRINOS, GLANDULAS, HORMONIOS, IRMAS, IRMAS_GLANDULA } from '@/data/hormonios'
import type { Endocrino, Glandula, Hormonio } from '@/data/hormonios'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Hormônio → glândula que o fabrica, em quatro alternativas.
 *
 * **Por que a glândula é a resposta.** O caminho contrário — mostrar a glândula
 * e pedir o hormônio — não funciona: a hipófise sozinha fabrica seis dos vinte
 * hormônios do baralho, e a carta teria seis respostas certas. E responder com o
 * *efeito* poria quatro frases de vinte palavras na tela, que é o erro de
 * leitura contra o relógio que este projeto já evitou nas derivadas e nas
 * funções orgânicas. A glândula é o rótulo curto, fechado em dez valores, que se
 * compara de relance.
 *
 * **A direção é sorteada carta a carta**, como no alfabeto grego: metade das
 * cartas pergunta quem fabrica, metade mostra o efeito e pede o hormônio. A
 * alternativa descartada era gerar as duas cartas para todo hormônio, num
 * baralho de quarenta: o gabarito da carta de produção diz o que o hormônio faz,
 * que é justamente a pergunta da outra — o baralho ensinaria a resposta e depois
 * a cobraria. Com uma carta por hormônio, cada partida testa os vinte e nenhuma
 * entrega a outra.
 *
 * **"Quem fabrica" está escrito na pergunta, e não só no comoJogar.** É a
 * armadilha central do assunto: TSH é o hormônio *tireo*estimulante e quem o
 * produz é a hipófise; ACTH cita a suprarrenal e sai da mesma hipófise. Se o
 * enunciado fosse só "TSH", metade dos acertos e dos erros seria sobre o que a
 * pergunta queria dizer, e não sobre fisiologia. Por isso todo enunciado começa
 * com "Quem fabrica:" — e por isso a glândula-alvo é sempre o **primeiro**
 * distrator oferecido, o mesmo papel que a geometria eletrônica faz na VSEPR: a
 * opção errada tem de ser a que a pessoa marcaria.
 */

function tresErrados<T>(candidatos: readonly T[], certa: T): T[] {
  const errados: T[] = []
  for (const c of candidatos) {
    if (c !== certa && !errados.includes(c)) errados.push(c)
    if (errados.length === 3) break
  }
  return errados
}

/** Nome na tela: a sigla sozinha é um enigma, então vem com o nome por extenso. */
function rotulo(h: Endocrino): string {
  return h.porExtenso ? `${h.nome} (${h.porExtenso})` : h.nome
}

function cartaProducao(h: Endocrino, rng: Rng): Carta {
  /*
   * Os errados, em ordem de quão tentadores são:
   * 1. a glândula-alvo — o erro de quem lê o nome do hormônio e responde quem
   *    obedece. É o distrator que justifica o jogo existir;
   * 2. as glândulas que se respondem no lugar da certa;
   * 3. qualquer outra, só para fechar quatro opções se um dia alguém encolher o
   *    mapa. Hoje esse terceiro trecho nunca é alcançado, e o teste do dataset
   *    (`toda glândula tem três irmãs ou mais`) é o que mantém isso verdadeiro.
   */
  const candidatos: readonly Glandula[] = [
    ...rng.shuffle([...h.alvos]),
    ...rng.shuffle([...IRMAS_GLANDULA[h.glandula]]),
    ...rng.shuffle([...GLANDULAS]),
  ]

  const opcoes = rng.shuffle([h.glandula, ...tresErrados(candidatos, h.glandula)])

  return {
    tipo: 'escolha',
    id: `hormonio-${h.nome}`,
    pergunta: { kind: 'texto', valor: `Quem fabrica: ${rotulo(h)}` },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(h.glandula),
    // Quem errou precisa ver por que é esta glândula e não a vizinha: repetir o
    // nome dela não ensina a diferença entre córtex e medula da suprarrenal.
    gabarito: `${h.glandula} — ${h.detalhe}`,
    ...(h.ressalva ? { aviso: h.ressalva } : {}),
  }
}

/** Efeito → hormônio. Os distratores são os irmãos: o antagonista vem primeiro. */
function cartaEfeito(h: Endocrino, rng: Rng): Carta {
  const candidatos: readonly Hormonio[] = [
    ...rng.shuffle([...IRMAS[h.nome]]),
    ...rng.shuffle([...HORMONIOS]),
  ]

  const opcoes = rng.shuffle([h.nome, ...tresErrados(candidatos, h.nome)])

  return {
    tipo: 'escolha',
    id: `hormonio-efeito-${h.nome}`,
    pergunta: { kind: 'texto', valor: `Qual hormônio: ${h.efeito}` },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(h.nome),
    // A glândula entra no gabarito mesmo não sendo a pergunta: é a metade do
    // conteúdo que esta direção não cobrou.
    gabarito: `${h.nome}, ${h.glandula} — ${h.detalhe}`,
    ...(h.ressalva ? { aviso: h.ressalva } : {}),
  }
}

export const hormonios: JogoFlashcard = {
  id: 'hormonios',
  mecanica: 'flashcard',
  nome: 'Hormônios',
  icone: '🩸',
  resumo: 'Aparece o hormônio, você diz quem o fabrica — a fábrica, não o alvo.',
  categoria: 'biologicas',
  unidade: { singular: 'hormônio', plural: 'hormônios' },
  comoJogar: [
    'Aparece o hormônio e você escolhe a glândula que o fabrica — ou aparece o efeito e você diz qual hormônio faz aquilo.',
    'A pergunta é sempre quem fabrica, nunca quem obedece: o TSH estimula a tireoide, mas quem o produz é a hipófise.',
    'Ocitocina e ADH contam como hipotálamo: a neuro-hipófise só armazena e libera o que ele fabricou.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    // Uma carta por hormônio, com a direção sorteada — ver o cabeçalho do
    // módulo. O `shuffle` externo é o que embaralha o baralho; o `chance` de
    // dentro decide a direção de cada carta.
    montarBaralho: (rng) =>
      rng.shuffle(ENDOCRINOS).map((h) => (rng.chance(0.5) ? cartaProducao(h, rng) : cartaEfeito(h, rng))),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
