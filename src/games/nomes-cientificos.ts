import { ESPECIES, comGrafia, variantesDeCaixa } from '@/data/nomes-cientificos'
import type { Especie } from '@/data/nomes-cientificos'
import type { Rng } from '@/core/rng'
import type { Carta, JogoFlashcard } from '@/core/types'

/**
 * Nome científico → nome popular, mais oito cartas sobre a regra da caixa.
 *
 * O porquê da direção, o porquê de a caixa ser cobrada e o porquê de o itálico
 * não ser estão em `data/nomes-cientificos.ts`, junto do acervo. Aqui ficam só
 * as decisões de montagem.
 *
 * **A dica é o grupo, e não "nome popular".** Foi uma troca deliberada: dizer
 * "nome popular" seria repetir o enunciado, enquanto "crustáceo" faz duas coisas
 * de uma vez. Recorta o campo de busca no que ninguém arriscaria — diante de
 * *Armadillidium vulgare* a dica é a diferença entre pensar e desistir — e amarra
 * os dois jogos de biológicas: o vocabulário é o mesmo de `taxonomia`, importado
 * e não recriado. E não entrega a resposta: saber que *Rhinella marina* é anfíbio
 * não diz qual anfíbio.
 *
 * **A carta de grafia não mostra o nome popular.** Poderia — "qual a grafia certa
 * do nome da onça-pintada?" soa melhor —, mas as duas cartas da mesma espécie
 * convivem no baralho, e a pergunta entregaria de graça a resposta da outra. A
 * pergunta genérica custa um pouco de elegância e não vaza nada.
 */

/** As duas metades do baralho têm prefixo de id diferente: elas não são a mesma pergunta. */
function cartaPopular(e: Especie): Carta {
  return {
    tipo: 'digitada',
    id: `nome-${e.id}`,
    pergunta: { kind: 'texto', valor: e.binomio },
    dica: e.grupo,
    resposta: {
      tipo: 'texto',
      canonica: e.popular,
      aceitas: [e.popular, ...e.sinonimos],
      // A tolerância a erro de digitação fica no padrão — ligada. As respostas
      // são palavras longas em português ("tatuzinho-de-jardim",
      // "mosquito-da-dengue") e o teste do dataset mede que nenhuma cabe dentro
      // do raio de perdão de outra. É o oposto do grego e dos prefixos SI, onde
      // as respostas são curtas e parecidas entre si.
    },
    gabarito: e.popular,
    ...(e.aviso ? { aviso: e.aviso } : {}),
  }
}

/**
 * A carta que cobra a regra: quatro grafias do mesmo nome, uma certa.
 *
 * Os três errados saem de `variantesDeCaixa`, embaralhados — no trinômio há
 * quatro erros possíveis e só três cabem, então qual deles fica de fora varia
 * por partida. O `aviso` da espécie **não** é repetido aqui: ele já sai na carta
 * digitada da mesma espécie, e o recado sobre o nome revisto do tomate não tem
 * nada a ver com a pergunta sobre maiúscula.
 */
function cartaGrafia(e: Especie, rng: Rng): Carta {
  const erradas = rng.shuffle([...variantesDeCaixa(e.binomio)]).slice(0, 3)
  const opcoes = rng.shuffle([e.binomio, ...erradas])

  return {
    tipo: 'escolha',
    id: `grafia-${e.id}`,
    pergunta: { kind: 'texto', valor: 'Qual grafia segue a regra da nomenclatura binomial?' },
    alternativas: opcoes.map((v) => ({ kind: 'texto' as const, valor: v })),
    indiceCorreto: opcoes.indexOf(e.binomio),
    // O gabarito diz a regra inteira, e não só qual das quatro era. Quem errou
    // não precisa saber que era a terceira: precisa saber por quê.
    gabarito: `${e.binomio} — gênero com inicial maiúscula, espécie sempre minúscula (e subespécie também). No papel, os dois em itálico.`,
  }
}

function baralho(rng: Rng): readonly Carta[] {
  return rng.shuffle([
    ...ESPECIES.map(cartaPopular),
    ...comGrafia().map((e) => cartaGrafia(e, rng)),
  ])
}

export const nomesCientificos: JogoFlashcard = {
  id: 'nomes-cientificos',
  mecanica: 'flashcard',
  nome: 'Nomes científicos',
  icone: '🦁',
  resumo: 'Panthera onca é a onça-pintada. Aparece o binômio, você diz quem é.',
  categoria: 'biologicas',
  unidade: { singular: 'carta', plural: 'cartas' },
  comoJogar: [
    'Aparece o nome científico e você escreve o nome popular: Panthera onca é a onça-pintada.',
    'A dica é o grupo — mamífero, inseto, planta —, que recorta o campo sem entregar a espécie.',
    'Oito cartas viram do avesso e pedem a grafia certa entre quatro: gênero com maiúscula e espécie com minúscula é regra da nomenclatura, não estilo. "Panthera Onca" está errado.',
    'No papel o binômio ainda vai em itálico; a carta não tem como mostrar isso, então só a caixa é cobrada.',
  ],
  config: () => ({
    montarBaralho: baralho,
    fim: 'baralho',
    teclado: 'texto',
  }),
}
