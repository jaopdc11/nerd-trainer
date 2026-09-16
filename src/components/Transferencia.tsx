import { useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { JOGOS } from '@/core/registry'
import { compararBancos, lerBancoImportado, nomeArquivoExport } from '@/core/storage'
import type { Banco, Preview, Situacao } from '@/core/storage'
import { Botao, Etiqueta, Painel } from './ui'

/**
 * Levar os recordes de uma máquina para outra.
 *
 * Duas decisões moldam esta tela:
 *
 * 1. **Importar nunca é um clique só.** O backup é lido, comparado item a item
 *    com o que já existe e só depois aplicado — e o botão que apaga alguma
 *    coisa é sempre diferente do botão que não apaga nada.
 * 2. **Dois caminhos de entrada.** Arquivo, para o fluxo normal, e área de
 *    colar, para quando o JSON veio por mensagem e não vale a pena salvar.
 */

const NOMES = new Map(JOGOS.map((j) => [j.id, j.nome]))

/** `tabela-periodica::simbolo` → "Tabela periódica · simbolo". */
function nomeDaChave(chave: string): string {
  const [jogoId = chave, modoId] = chave.split('::')
  const nome = NOMES.get(jogoId) ?? jogoId
  return modoId ? `${nome} · ${modoId}` : nome
}

const ESTILO: Record<Situacao, { rotulo: string; valor: string; etiqueta: string }> = {
  sobe: { rotulo: 'sobe', valor: 'text-acento', etiqueta: 'border-acento/40 text-acento' },
  novo: { rotulo: 'novo', valor: 'text-texto', etiqueta: 'text-suave' },
  pior: { rotulo: 'pior', valor: 'text-quase', etiqueta: 'border-quase/40 text-quase' },
  igual: { rotulo: 'igual', valor: 'text-tenue', etiqueta: 'text-tenue' },
}

/** Botão desligado: apagado e sem reagir ao ponteiro, para não prometer clique. */
const INERTE = 'disabled:pointer-events-none disabled:opacity-40'

interface Analise {
  readonly banco: Banco
  readonly resumo: Preview
  readonly origem: string
  readonly descartadas: number
}

export function Transferencia({
  banco,
  exportar,
  onJuntar,
  onSubstituir,
  onLimpar,
}: {
  banco: Banco
  exportar: () => string
  onJuntar: (vindo: Banco) => void
  onSubstituir: (vindo: Banco) => void
  onLimpar: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [analise, setAnalise] = useState<Analise | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<'substituir' | 'apagar' | null>(null)
  const arquivoRef = useRef<HTMLInputElement>(null)
  const idColar = useId()

  const temRecordes = Object.keys(banco.entradas).length > 0

  const fechar = () => {
    setAberto(false)
    setTexto('')
    setErro(null)
    setAnalise(null)
    setConfirmando(null)
  }

  const analisar = (conteudo: string, origem: string) => {
    setConfirmando(null)
    const leitura = lerBancoImportado(conteudo)
    if (!leitura.ok) {
      setAnalise(null)
      setErro(leitura.erro)
      return
    }
    setErro(null)
    setAnalise({
      banco: leitura.banco,
      resumo: compararBancos(banco, leitura.banco),
      origem,
      descartadas: leitura.descartadas,
    })
  }

  const aoEscolherArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    // Zerar o input permite escolher o mesmo arquivo duas vezes seguidas.
    e.target.value = ''
    if (!arquivo) return
    try {
      analisar(await arquivo.text(), arquivo.name)
    } catch {
      setAnalise(null)
      setErro('Não consegui ler esse arquivo. Tente abri-lo e colar o conteúdo abaixo.')
    }
  }

  const baixar = () => {
    const nome = nomeArquivoExport()
    const url = URL.createObjectURL(new Blob([exportar()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setAviso(`baixado: ${nome}`)
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(exportar())
      setAviso('JSON copiado para a área de transferência')
    } catch {
      // Clipboard bloqueado (http, permissão negada): o arquivo sempre funciona.
      setAviso('o navegador bloqueou a cópia — use "Baixar backup"')
    }
  }

  const aplicar = (modo: 'juntar' | 'substituir') => {
    if (!analise) return
    const { jogos } = analise.resumo
    if (modo === 'juntar') {
      onJuntar(analise.banco)
      setAviso(`backup juntado: ${jogos} ${jogos === 1 ? 'jogo lido' : 'jogos lidos'}`)
    } else {
      onSubstituir(analise.banco)
      setAviso(`recordes substituídos pelo backup (${jogos})`)
    }
    fechar()
  }

  return (
    <Painel className="flex flex-col gap-5 p-5">
      <div className="flex items-center gap-3">
        <h2 className="fonte-display text-sm font-semibold tracking-[0.2em] text-suave uppercase">
          Backup dos recordes
        </h2>
        <span className="h-px flex-1 bg-borda" />
      </div>

      <p className="text-sm text-tenue">
        Os recordes ficam guardados só neste navegador. Um backup é o que leva o seu histórico para
        outro computador — ou o traz de volta se você limpar os dados do site.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="flex flex-col gap-2">
          <Rotulo>levar embora</Rotulo>
          <p className="text-sm text-tenue">
            Salva tudo num arquivo <span className="font-mono">.json</span> — ou copia o mesmo
            conteúdo, para mandar por mensagem.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Botao
              variante="secundario"
              tamanho="md"
              onClick={baixar}
              disabled={!temRecordes}
              className={INERTE}
            >
              Baixar backup
            </Botao>
            <Botao
              variante="secundario"
              tamanho="md"
              onClick={copiar}
              disabled={!temRecordes}
              className={INERTE}
            >
              Copiar JSON
            </Botao>
          </div>
        </section>

        <section className="flex flex-col gap-2 sm:border-l sm:border-borda sm:pl-5">
          <Rotulo>trazer de volta</Rotulo>
          <p className="text-sm text-tenue">
            Lê um backup e mostra, jogo a jogo, o que muda. Nada é gravado antes de você ver o
            resumo.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Botao
              variante="secundario"
              tamanho="md"
              aria-expanded={aberto}
              onClick={() => {
                setAviso(null)
                if (aberto) fechar()
                else setAberto(true)
              }}
            >
              {aberto ? 'Cancelar importação' : 'Importar backup'}
            </Botao>
          </div>
        </section>
      </div>

      {aviso && (
        <p role="status" className="text-sm text-suave">
          {aviso}
        </p>
      )}

      {aberto && (
        <div className="motion-safe:animate-surgir flex flex-col gap-4 rounded-xl border border-borda bg-fundo-alt/60 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={arquivoRef}
              type="file"
              accept="application/json,.json"
              onChange={aoEscolherArquivo}
              className="sr-only"
              aria-label="Arquivo de backup"
            />
            <Botao variante="secundario" tamanho="md" onClick={() => arquivoRef.current?.click()}>
              Escolher arquivo…
            </Botao>
            <span className="text-sm text-tenue">ou cole o JSON aqui embaixo</span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={idColar} className="sr-only">
              JSON do backup
            </label>
            <textarea
              id={idColar}
              value={texto}
              spellCheck={false}
              onChange={(e) => setTexto(e.target.value)}
              placeholder='{ "versao": 1, "entradas": { … } }'
              className="h-28 w-full resize-y rounded-xl border border-borda bg-fundo-alt p-3 font-mono text-xs text-suave placeholder:text-tenue focus:border-borda-forte"
            />
            <Botao
              variante="secundario"
              tamanho="md"
              className={`self-start ${INERTE}`}
              disabled={texto.trim() === ''}
              onClick={() => analisar(texto, 'texto colado')}
            >
              Analisar texto colado
            </Botao>
          </div>

          {erro && (
            <p className="rounded-xl border border-erro/40 bg-erro-fundo/40 p-3 text-sm text-erro">
              {erro}
            </p>
          )}

          {analise && (
            <Comparacao
              analise={analise}
              confirmando={confirmando === 'substituir'}
              onConfirmar={() => setConfirmando('substituir')}
              onDesistir={() => setConfirmando(null)}
              onJuntar={() => aplicar('juntar')}
              onSubstituir={() => aplicar('substituir')}
            />
          )}
        </div>
      )}

      {temRecordes && (
        <section className="flex flex-col gap-2 border-t border-borda pt-4">
          <Rotulo className="text-erro">zona de perigo</Rotulo>

          {confirmando === 'apagar' ? (
            <>
              <p className="text-sm text-erro">
                Apagar todos os recordes? Não dá para desfazer — se ainda não baixou um backup,
                baixe antes.
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Botao
                  variante="perigo"
                  tamanho="md"
                  onClick={() => {
                    onLimpar()
                    setConfirmando(null)
                    setAviso('recordes apagados')
                  }}
                >
                  Apagar
                </Botao>
                <button
                  type="button"
                  onClick={() => setConfirmando(null)}
                  className="text-sm text-suave transition-colors hover:text-texto"
                >
                  cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-tenue">
                Zera o histórico inteiro deste navegador. Pede confirmação antes.
              </p>
              <div className="mt-1">
                <Botao
                  variante="secundario"
                  tamanho="md"
                  onClick={() => setConfirmando('apagar')}
                  className="border-erro/40 text-erro hover:border-erro hover:bg-erro-fundo/40"
                >
                  Apagar todos os recordes
                </Botao>
              </div>
            </>
          )}
        </section>
      )}
    </Painel>
  )
}

/** Rótulo de subseção: caixa alta com respiro entre as letras, como no Nerdômetro. */
function Rotulo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs tracking-[0.25em] text-tenue uppercase ${className}`}>{children}</p>
  )
}

/**
 * O preview: o que o backup traz, jogo a jogo, antes de qualquer escrita.
 *
 * A coluna do meio é a comparação inteira em duas colunas — "87 → 112" diz
 * sozinho o que uma frase levaria uma linha para dizer.
 */
function Comparacao({
  analise,
  confirmando,
  onConfirmar,
  onDesistir,
  onJuntar,
  onSubstituir,
}: {
  analise: Analise
  confirmando: boolean
  onConfirmar: () => void
  onDesistir: () => void
  onJuntar: () => void
  onSubstituir: () => void
}) {
  const { resumo, origem, descartadas } = analise
  const { jogos, partidas, sobem, novos, iguais, piores, perdidos } = resumo

  return (
    <div className="flex flex-col gap-3 border-t border-borda pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Etiqueta className="text-suave">{origem}</Etiqueta>
        <Etiqueta className="text-suave">
          {jogos} {jogos === 1 ? 'jogo' : 'jogos'}
        </Etiqueta>
        <Etiqueta className="text-suave">
          {partidas} {partidas === 1 ? 'partida' : 'partidas'}
        </Etiqueta>
        {sobem > 0 && (
          <Etiqueta className="border-acento/40 text-acento">▲ {sobem} sobem</Etiqueta>
        )}
        {novos > 0 && <Etiqueta className="text-suave">{novos} novos</Etiqueta>}
        {piores > 0 && (
          <Etiqueta className="border-quase/40 text-quase">{piores} piores que o atual</Etiqueta>
        )}
        {iguais > 0 && <Etiqueta className="text-tenue">{iguais} iguais</Etiqueta>}
        {descartadas > 0 && (
          <Etiqueta className="border-erro/40 text-erro">
            {descartadas} corrompidas, ignoradas
          </Etiqueta>
        )}
      </div>

      <ul className="max-h-64 divide-y divide-borda overflow-y-auto rounded-xl border border-borda">
        {resumo.itens.map((i) => {
          const estilo = ESTILO[i.situacao]
          return (
            <li key={i.chave} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{nomeDaChave(i.chave)}</span>
              <span className="font-mono tabular text-tenue">{i.atual ?? '—'}</span>
              <span aria-hidden className="text-tenue">
                →
              </span>
              <span className={`w-12 text-right font-mono tabular font-bold ${estilo.valor}`}>
                {i.vindo}
              </span>
              <Etiqueta className={`shrink-0 ${estilo.etiqueta}`}>{estilo.rotulo}</Etiqueta>
            </li>
          )
        })}
      </ul>

      {confirmando ? (
        <div className="flex flex-col gap-2 rounded-xl border border-erro/40 bg-erro-fundo/40 p-3">
          <p className="text-sm text-erro">
            Substituir tudo apaga o que está aqui e deixa só o backup.
            {piores > 0 && ` ${piores} ${piores === 1 ? 'recorde fica' : 'recordes ficam'} pior.`}
            {perdidos > 0 &&
              ` ${perdidos} ${perdidos === 1 ? 'jogo some' : 'jogos somem'} por não estar no arquivo.`}{' '}
            Não dá para desfazer.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Botao variante="perigo" tamanho="md" onClick={onSubstituir}>
              Substituir mesmo assim
            </Botao>
            <button
              type="button"
              onClick={onDesistir}
              className="text-sm text-suave hover:text-texto"
            >
              cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Botao tamanho="md" onClick={onJuntar}>
            Juntar
          </Botao>
          <span className="text-sm text-tenue">
            fica com o melhor de cada jogo — nada do que está aqui se perde
          </span>
          <button
            type="button"
            onClick={onConfirmar}
            className="ml-auto text-sm text-tenue transition-colors hover:text-erro"
          >
            substituir tudo
          </button>
        </div>
      )}
    </div>
  )
}
