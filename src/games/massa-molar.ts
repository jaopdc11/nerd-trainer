import { COMPOSTOS_MASSA, massaArredondada, massaMolar } from '@/data/massa-molar'
import type { CompostoMassa } from '@/data/massa-molar'
import type { Rng } from '@/core/rng'
import type { Exercicio, JogoGerador } from '@/core/types'

/**
 * Massa molar de cabeça, contra o relógio.
 *
 * A resposta é o inteiro mais próximo, e isso não é uma concessão: o dataset só
 * aceita composto em que a massa precisa e a massa decorada arredondam para o
 * mesmo número, então "responda o inteiro" é uma pergunta bem posta, não um
 * arredondamento perdoando erro. Quem soma 2+32+64 chega no mesmo 98 de quem
 * soma 2,016+32,06+63,996.
 *
 * Por ser inteiro, aceita sem Enter: nenhum outro número continua a partir da
 * resposta certa, então o auto-commit de `inteiroGrande` resolve sozinho.
 */
function exercicio(c: CompostoMassa): Exercicio {
  const valor = massaArredondada(c)

  return {
    tipo: 'digitado',
    chave: `massa:${c.formula}`,
    enunciado: { kind: 'texto', valor: `massa molar de ${c.formula}` },
    resposta: { tipo: 'inteiroGrande', valor: String(valor) },
    gabarito: `${valor} g/mol (${massaMolar(c).toFixed(2).replace('.', ',')})`,
    teclado: 'numerico',
  }
}

const POR_NIVEL: readonly (readonly CompostoMassa[])[] = [0, 1, 2].map((n) =>
  COMPOSTOS_MASSA.filter((c) => c.nivel === n),
)

export function gerarMassaMolar(rng: Rng, nivel: number): Exercicio {
  const n = Math.min(Math.max(nivel, 0), POR_NIVEL.length - 1)
  const atuais = POR_NIVEL[n] ?? []
  return exercicio(rng.pick([...POR_NIVEL.slice(0, n).flat(), ...atuais, ...atuais]))
}

export const massaMolarJogo: JogoGerador = {
  id: 'massa-molar',
  mecanica: 'gerador',
  nome: 'Massa molar',
  icone: 'g/mol',
  resumo: 'Some os pesos atômicos de cabeça, da água à sacarose.',
  categoria: 'quimica',
  unidade: { singular: 'acerto', plural: 'acertos' },
  comoJogar: [
    'Responda o inteiro mais próximo: H₂SO₄ é 98.',
    'Use as massas de cabeça (H=1, C=12, N=14, O=16, S=32): todo composto aqui dá o mesmo inteiro que a massa exata.',
    'Não precisa de Enter — a resposta é aceita assim que fica inequívoca.',
  ],
  config: () => ({
    gerar: gerarMassaMolar,
    segundosIniciais: 60,
    bonusPorAcertoS: 5,
    tetoSegundos: 120,
    escala: (acertos) => Math.min(2, Math.floor(acertos / 6)),
    teclado: 'numerico',
  }),
}
