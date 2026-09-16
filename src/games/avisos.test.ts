import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/core/rng'
import { AVISOS } from './avisos'
import { bandeiras } from './flashcards'
import { capitais } from './capitais'
import { paises } from './paises'

/**
 * O recado tem de sair em todo jogo que pergunta sobre aquele país.
 *
 * É o tipo de coisa que some por esquecimento: alguém acrescenta um baralho
 * novo de geografia e a posição vale em dois lugares e não no terceiro, o que é
 * pior que não ter — parece que o jogo mudou de ideia dependendo da tela.
 */
const ID = 'il'

describe('avisos dos jogos de geografia', () => {
  it('o país avisado existe nos três baralhos', () => {
    expect(Object.keys(AVISOS)).toContain(ID)
  })

  it('sai no mapa de países', () => {
    const celula = paises.config().celulas.find((c) => c.id === ID)
    expect(celula?.aviso).toBe(AVISOS[ID])
  })

  it('sai no mapa de capitais', () => {
    const celula = capitais.config().celulas.find((c) => c.id === ID)
    expect(celula?.aviso).toBe(AVISOS[ID])
  })

  it('sai no baralho de bandeiras', () => {
    const baralho = bandeiras.config().montarBaralho(mulberry32(3))
    const carta = baralho.find((c) => c.id === `bandeira-${ID}`)
    expect(carta, 'Israel tem bandeira no pacote e entra no baralho').toBeDefined()
    expect(carta?.aviso).toBe(AVISOS[ID])
  })
})
