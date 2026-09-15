import { comUnidade } from '@/core/format'
import { href } from '@/core/route'
import type { JogoModule } from '@/core/types'
import { useRecordes } from '@/core/useRecords'

/**
 * Escolha de modo, para os jogos que têm mais de um. Cada modo tem recorde
 * próprio, então o cartão mostra o recorde daquele modo, não o do jogo.
 */
export function ModeSelect({ jogo }: { jogo: JogoModule }) {
  const { recordeDe } = useRecordes()

  return (
    <ul className="flex flex-col gap-3">
      {jogo.modos?.map((modo) => {
        const entrada = recordeDe(jogo.id, modo.id)
        return (
          <li key={modo.id}>
            <a
              href={href({ nome: 'jogo', jogoId: jogo.id, modoId: modo.id })}
              className="flex items-center justify-between gap-4 rounded-xl border border-borda bg-superficie p-4 transition-colors hover:border-acento hover:bg-superficie-alta"
            >
              <span>
                <span className="block font-semibold">{modo.nome}</span>
                {modo.resumo && <span className="block text-sm text-suave">{modo.resumo}</span>}
              </span>
              <span className="shrink-0 text-sm text-tenue">
                {entrada ? comUnidade(entrada.recorde.pontuacao, jogo.unidade) : '—'}
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
