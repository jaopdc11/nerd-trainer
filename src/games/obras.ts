import { OBRAS, exibirAno } from '@/data/obras'
import type { Obra } from '@/data/obras'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Obra → autor, digitado.
 *
 * **Digitado, e não escolha de quatro, pela régua do projeto.** A régua tem dois
 * lados, e este baralho cai no mesmo lado de capitais-estados e dos pensadores: a
 * resposta é um nome próprio curto e o desafio inteiro é *lembrar* de quem é, não
 * reconhecer numa lista. Com quatro opções na tela, "Dom Casmurro" se resolve
 * sozinho — ninguém que já ouviu falar de Machado hesita entre ele e Kafka —, e o
 * card mediria reconhecimento, que é o erro oposto ao das fórmulas e das funções
 * orgânicas, onde digitar mediria ortografia. "Machado" tem sete letras; "ácido
 * carboxílico" tem dezoito. É essa a diferença que decide.
 *
 * **A tolerância a erro de digitação fica ligada**, no padrão. "Dostoiévski",
 * "García Márquez" e "Manuel Antônio de Almeida" são longos o bastante para que
 * uma letra trocada seja dedo e não desconhecimento, e o limite escala com o
 * tamanho do nome. A trava que segura isso em pé não é o limite apertado, é a
 * vizinhança: se o que foi digitado também encostar em outro autor do mesmo
 * baralho, a entrada é ambígua e não passa. O teste do dataset garante que nenhum
 * par de autores está a um caractere de distância — que é a condição para a
 * tolerância ser misericórdia, e não gabarito de graça.
 *
 * Com um detalhe do qual este baralho depende mais que os antigos: metade das
 * cartas tem autor repetido — Machado responde por quatro, Alencar por três,
 * Kafka, Tolstói, Dostoiévski, Clarice, Graciliano e Guimarães Rosa por duas. A
 * vizinhança que a engine monta tira dela as formas que também respondem pela
 * carta atual; sem essa subtração, "Dostoiévsky" encostaria na *outra* carta de
 * Dostoiévski, viraria ambíguo e seria recusado — a tolerância morreria
 * justamente para quem mais aparece. O teste do jogo prende esse comportamento,
 * porque ele é invisível até o dia em que alguém mexer na engine.
 *
 * O gênero vira `dica` porque ele desambigua sem entregar nada: "Fausto" é teatro
 * e não romance, e saber isso não aproxima ninguém de Goethe. O ano fica só no
 * gabarito — na pergunta, ele entregaria metade das cartas por eliminação de
 * época.
 */
function cartaObra(o: Obra): Carta {
  return {
    tipo: 'digitada',
    id: `obra-${o.id}`,
    pergunta: { kind: 'texto', valor: o.titulo },
    dica: o.genero,
    resposta: {
      tipo: 'texto',
      canonica: o.autor,
      aceitas: [...o.aceitas],
    },
    // O ano entra no gabarito, e não é enfeite: é ele que liga este baralho ao
    // das escolas literárias. Quem erra "Vidas Secas" costuma ser quem não situa
    // 1938 no romance de 30.
    gabarito: `${o.autor}, ${exibirAno(o.ano)}`,
  }
}

export const obras: JogoFlashcard = {
  id: 'obras',
  mecanica: 'flashcard',
  nome: 'Obras e autores',
  icone: '📚',
  resumo: 'Aparece o título, você escreve quem escreveu.',
  categoria: 'humanas',
  unidade: { singular: 'obra', plural: 'obras' },
  comoJogar: [
    'Aparece "Grande Sertão: Veredas" e você escreve Guimarães Rosa.',
    'Só o sobrenome basta — menos onde ele não identifica ninguém: "Andrade" é Mário e é Oswald, e nenhum dos dois vale sozinho.',
    'Metade do baralho é literatura brasileira, metade é o cânone de fora. Acento e maiúscula não importam.',
    'O baralho vai até o fim: errar custa o ponto, não a partida.',
  ],
  config: () => ({
    montarBaralho: (rng) => rng.shuffle(OBRAS).map(cartaObra),
    fim: 'baralho',
    teclado: 'texto',
  }),
}
