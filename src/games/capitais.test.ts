import { describe, expect, it } from 'vitest'
import { validar } from '@/core/answer'
import { normalizarTexto } from '@/core/answer/normalize'
import { CAPITAIS } from '@/data/capitais'
import { PAISES } from '@/data/paises'
import { capitais } from './capitais'

/**
 * O tabuleiro de capitais, medido como o de países.
 *
 * O risco da mecânica livre é sempre o mesmo: uma resposta que serve a duas
 * células cai na primeira que o laço encontrar, e o jogador vê a capital certa
 * acendendo o país errado. Aqui isso é pior que no mapa de países, porque a
 * resposta não tem nada a ver com o desenho — ninguém desconfia de "San José".
 */
const CONFIG = capitais.config()
const CELULAS = CONFIG.celulas

describe('tabuleiro de capitais', () => {
  it('tem uma célula por país, com forma no mapa', () => {
    expect(CELULAS).toHaveLength(PAISES.length)
    for (const c of CELULAS) expect(c.forma, c.id).toBeDefined()
  })

  it('a canônica de cada célula é a capital do país, e acerta ela mesma', () => {
    for (const c of CELULAS) {
      if (c.resposta.tipo !== 'texto') throw new Error(`${c.id}: resposta devia ser texto`)
      expect(c.resposta.canonica, c.id).toBe(CAPITAIS[c.id]?.nome)
      expect(validar(c.resposta.canonica, c.resposta, { rigor: 'estrito' }).veredito, c.id).toBe(
        'certo',
      )
    }
  })

  it('nenhuma forma aceita serve a dois países ao mesmo tempo', () => {
    // Colisão exata a trava de vizinhança não resolve: ela recusa o ambíguo, e o
    // jogador ficaria sem conseguir preencher nenhuma das duas células.
    const dono = new Map<string, string>()
    for (const c of CELULAS) {
      if (c.resposta.tipo !== 'texto') continue
      for (const forma of c.resposta.aceitas) {
        const chave = normalizarTexto(forma)
        const anterior = dono.get(chave)
        // Repetição DENTRO da mesma célula é só sinônimo que a normalização
        // achatou — "Godthåb" e "Godthab" viram a mesma chave, e tudo bem.
        expect(anterior ?? c.id, `"${forma}" serve a ${anterior} e a ${c.id}`).toBe(c.id)
        dono.set(chave, c.id)
      }
    }
  })

  it('diz o país junto da capital no gabarito e no tooltip', () => {
    // No fim da partida quem lê a lista está olhando o mapa: "Gitega" sozinho
    // não diz que foi o Burundi que ficou vermelho.
    for (const p of PAISES) {
      const celula = CELULAS.find((c) => c.id === p.id)
      expect(celula?.gabarito, p.id).toContain(p.nome)
      expect(celula?.detalhe, p.id).toContain(CAPITAIS[p.id]?.nome as string)
    }
  })

  it('agrupa o gabarito por continente e marca as 195 da ONU', () => {
    for (const c of CELULAS) expect(c.secao, c.id).toBeTruthy()
    const marco = CONFIG.marcos?.[0]
    expect(marco?.ids).toHaveLength(PAISES.filter((p) => p.soberano).length)
  })
})
