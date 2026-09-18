import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { dadosDoCertificado, nomeDoArquivo } from '@/core/certificado'
import {
  CORES,
  cordasDoGuilloche,
  correnteDaBorda,
  denteadoDoSelo,
  estrela,
  faixa,
  fitasDoSelo,
  FOLHA,
  FRASE_MIUDA,
  moldura,
  rosetasDosCantos,
  separador,
} from '@/core/certificado-arte'
import type { Poligono } from '@/core/certificado-arte'
import { desenharCertificado, FICHA, SELO } from '@/core/certificado-pdf'
import type { DadosDoCertificado } from '@/core/certificado-pdf'
import { ELO_DO_CERTIFICADO } from '@/core/nerdometro'
import type { Nerdometro } from '@/core/nerdometro'
import type { Fonte, Medidor } from '@/core/pdf'
import { Botao } from './ui'

/**
 * O diploma de nerdice.
 *
 * O documento é desenhado duas vezes: aqui em HTML, para conferir na tela, e em
 * PDF (`core/certificado-pdf.ts`) para baixar. As frases dos dois vêm prontas de
 * `dadosDoCertificado`, então elas não têm como divergir — só a tipografia e a
 * posição são decididas em cada lado.
 *
 * **Por que o PDF é escrito na mão.** Ver `core/pdf.ts`. Em resumo: nenhuma
 * dependência nova num app que tem duas, e o arquivo sai vetorial, com o texto
 * selecionável, em cinco quilobytes.
 *
 * **Por que tudo em `cqw` na folha da tela.** Ela tem a largura que couber na
 * janela. Com `container-type: size` e o texto em unidades do contêiner, o mesmo
 * layout serve ao desktop e ao telefone sem um único `@media`: encolher a folha
 * encolhe a tipografia junto. Em `rem`, o nome estouraria a moldura no telefone.
 */

/** Só letras, e curto: é um diploma, não um formulário. */
const LIMITE_DO_NOME = 38

const CHAVE_DO_NOME = 'nerd-trainer:nome-no-certificado'

/**
 * O nome fica no `localStorage` e não no banco de recordes de propósito: ele não
 * é dado de jogo, não entra em exportação nem em mesclagem de bancos, e o banco
 * é justamente a coisa que as pessoas trocam entre dispositivos. Um nome que
 * viaja junto com os recordes acabaria emitindo diploma no nome de outra pessoa.
 */
function lerNome(): string {
  try {
    return localStorage.getItem(CHAVE_DO_NOME) ?? ''
  } catch {
    // Modo privado, site bloqueado, iframe sem permissão: o certificado sai com
    // o campo vazio, que é degradação aceitável para um enfeite.
    return ''
  }
}

function guardarNome(nome: string) {
  try {
    localStorage.setItem(CHAVE_DO_NOME, nome)
  } catch {
    // Ver `lerNome`: não poder lembrar o nome não é motivo para quebrar a tela.
  }
}

/**
 * A régua do PDF, medida no Canvas.
 *
 * O PDF usa as fontes base-14 (Times-Roman e companhia), que não vêm embarcadas
 * no arquivo — é o que o mantém em poucos quilobytes. Para centralizar uma
 * linha, porém, é preciso saber a largura dela, e essa conta mora nas métricas
 * da fonte. Medir "Times New Roman" no Canvas resolve sem embutir tabela
 * nenhuma: ela foi desenhada para ser metricamente compatível com a Times-Roman
 * do PostScript, e no Linux o substituto (Liberation Serif) também é. O erro
 * fica bem abaixo de um por cento — invisível num diploma.
 *
 * Sem Canvas (jsdom, navegador exótico), a aproximação por meio em por caractere
 * deixa o texto levemente fora de centro, e isso é melhor que não emitir nada.
 */
function medidorDoNavegador(): Medidor {
  const ctx = document.createElement('canvas').getContext('2d')
  const prefixo: Record<Fonte, string> = { normal: '', negrito: 'bold ', italico: 'italic ' }

  return (texto, fonte, tamanho) => {
    if (!ctx) return texto.length * tamanho * 0.5
    ctx.font = `${prefixo[fonte]}${tamanho}px "Times New Roman", Times, serif`
    return ctx.measureText(texto).width
  }
}

export function Certificado({ m, onFechar }: { m: Nerdometro; onFechar: () => void }) {
  const [nome, setNome] = useState(lerNome)
  const tituloId = useId()
  const painel = useRef<HTMLDivElement>(null)

  // A data entra uma vez e não a cada tecla digitada no nome: sem isto, o
  // registro do rodapé se recalcularia a cada letra, e o número que a folha
  // mostra poderia não ser o que o PDF grava.
  const dados = useMemo(() => dadosDoCertificado(m, nome), [m, nome])

  // Mesmas três regras de diálogo do tutorial, e pelos mesmos motivos: Esc
  // fecha, o corpo não rola atrás, e o foco entra no painel para o Tab seguinte
  // não cair no menu coberto.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = antes
    }
  }, [])

  useEffect(() => {
    painel.current?.focus()
  }, [])

  const aoMudarNome = (valor: string) => {
    const limpo = valor.slice(0, LIMITE_DO_NOME)
    setNome(limpo)
    guardarNome(limpo)
  }

  /**
   * Baixar, e não imprimir.
   *
   * O caminho anterior era `window.print()` e o diálogo do sistema, onde a
   * pessoa tinha de achar "Salvar como PDF" no meio das impressoras. Agora o
   * arquivo é gerado aqui e entregue: `Blob` → link temporário → clique. O
   * `revokeObjectURL` devolve a memória do blob — sem ele, cada emissão deixa o
   * arquivo inteiro preso até a aba fechar.
   */
  const baixar = () => {
    const pdf = desenharCertificado(dados, medidorDoNavegador())
    const url = URL.createObjectURL(new Blob([pdf as BlobPart], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = nomeDoArquivo(dados.elo)
    link.click()
    URL.revokeObjectURL(url)
  }

  /*
    Portal para o `body`, e isto não é preferência de arquitetura: o medidor que
    abre este diálogo é uma `section` com `backdrop-blur`, e `backdrop-filter`
    cria containing block para descendentes `position: fixed`. Renderizado ali
    dentro, o `fixed inset-0` abaixo não cobria a tela — ele cobria a caixa do
    medidor, e o diálogo saía espremido numa faixa de trezentos pixels com a
    folha cortada no meio do título. O tutorial não sofre disto porque nasce
    direto no menu, fora de qualquer `backdrop-blur`.
  */
  return createPortal(
    <div className="motion-safe:animate-surgir fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-fundo/80 p-4 backdrop-blur-sm sm:p-6">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onFechar}
        className="absolute inset-0 cursor-default"
      />

      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className="relative my-auto flex w-full max-w-5xl flex-col gap-4 rounded-2xl border border-borda bg-superficie p-4 shadow-2xl outline-none sm:p-6"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs tracking-[0.25em] text-tenue uppercase">
              {ELO_DO_CERTIFICADO} ou acima
            </p>
            <h2 id={tituloId} className="fonte-display text-2xl leading-none font-bold">
              Seu certificado
            </h2>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-borda text-tenue transition-colors hover:border-borda-forte hover:text-suave"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-sm text-suave">
            nome no diploma
            <input
              value={nome}
              onChange={(e) => aoMudarNome(e.target.value)}
              maxLength={LIMITE_DO_NOME}
              placeholder="como você quer ser chamado"
              className="rounded-xl border border-borda bg-fundo-alt px-3 py-2 text-texto outline-none placeholder:text-tenue focus-visible:border-borda-forte"
            />
          </label>

          <Botao tamanho="md" onClick={baixar}>
            baixar PDF
          </Botao>
        </div>

        <Folha dados={dados} />
      </div>
    </div>,
    document.body,
  )
}

/**
 * A folha, como ela vai sair.
 *
 * O que vai nela é o que resiste a ser guardado: o elo, a nota, a cobertura e a
 * data. As coisas que mudam toda semana — a ferrugem, o "como subir" — ficam de
 * fora de propósito; um diploma que envelhece em três dias não é diploma.
 */
function Folha({ dados }: { dados: DadosDoCertificado }) {
  return (
    <div className="flex justify-center">
      <div className="folha font-serif text-[#1b1710]">
        {/* A faixa acompanha o nome da patente, como no PDF: `Nerd V` numa
            faixa feita para `Ultra Virgem` ficaria boiando dentro dela. A conta
            é a mesma dos dois lados, só que aqui a régua é aproximada — a folha
            é conferência, o arquivo é que mede com a métrica da fonte. */}
        <Ornamentos elo={dados.elo} larguraDaFaixa={Math.max(210, dados.elo.length * 21 + 70)} />

        <Linha y={62} corpo={11} className="tracking-[0.5cqw] uppercase" cor={CORES.ouroEscuro}>
          Nerd Trainer
        </Linha>
        {/* Só o elo é negrito nesta folha — ver a nota sobre peso em
            `certificado-pdf.ts`. */}
        <Linha y={84} corpo={32}>
          Certificado de Nerdice
        </Linha>

        <Linha y={168} corpo={13}>
          Certificamos que
        </Linha>
        <Linha y={194} corpo={36}>
          {dados.nome}
        </Linha>
        <Linha y={258} corpo={13}>
          alcançou, no ranking do Nerdômetro, a patente de
        </Linha>
        <Linha y={286} corpo={42} className="font-bold" cor={CORES.ouroEscuro}>
          {dados.elo}
        </Linha>
        <Linha y={340} corpo={14} className="italic">
          “{dados.lema}”
        </Linha>

        {/* A régua sob o nome acompanha a largura dele, como no PDF. */}
        <span
          className="absolute h-px -translate-x-1/2 bg-[#b08d3f]"
          style={{ ...emPontos(FOLHA.largura / 2, 240), width: '26%' }}
        />

        {/* A ficha técnica, na mesma grade do PDF: rótulo miúdo, valor grande. */}
        <span
          className="absolute h-px bg-[#b08d3f]"
          style={{
            ...emPontos(FICHA.x, FICHA.y - 12),
            width: `${((FICHA.colunas * FICHA.larguraDaColuna - 20) / FOLHA.largura) * 100}%`,
          }}
        />

        {/* Rótulo e valor são dois elementos absolutos, e não um bloco com o
            valor empurrado por margem: a margem teria de ser dita em `cqw` — uma
            fração da largura —, enquanto o PDF desce exatos 10 pontos. Os dois
            números batem numa largura de folha só, e em qualquer outra a tela
            passa a mostrar um espaçamento que o arquivo não tem. Empilhado em
            quatro linhas, o erro se soma e a ficha sai torta. */}
        {dados.fichas.map((f, i) => {
          const x = FICHA.x + (i % FICHA.colunas) * FICHA.larguraDaColuna
          const y = FICHA.y + Math.floor(i / FICHA.colunas) * FICHA.alturaDaLinha

          return (
            <div key={f.rotulo} className="contents">
              <p
                className="absolute leading-none tracking-[0.17cqw] whitespace-nowrap"
                style={{ ...emPontos(x, y), fontSize: corpoEmCqw(6.5), color: CORES.rotulo }}
              >
                {f.rotulo}
              </p>
              <p
                className="absolute leading-none whitespace-nowrap"
                style={{ ...emPontos(x, y + 10), fontSize: corpoEmCqw(12) }}
              >
                {f.valor}
              </p>
            </div>
          )
        })}

        <span
          className="absolute h-px bg-[#b08d3f]"
          style={{
            // A mesma conta do PDF: o filete fecha abaixo do último valor, não
            // no fim de uma linha de grade vazia.
            ...emPontos(
              FICHA.x,
              FICHA.y +
                (Math.ceil(dados.fichas.length / FICHA.colunas) - 1) * FICHA.alturaDaLinha +
                22 +
                FICHA.respiro,
            ),
            width: `${((FICHA.colunas * FICHA.larguraDaColuna - 20) / FOLHA.largura) * 100}%`,
          }}
        />

        {dados.materias.length > 0 && (
          <>
            <Linha y={512} corpo={6.5} cor={CORES.rotulo} className="tracking-[0.17cqw]">
              MELHORES MATÉRIAS
            </Linha>
            <Linha y={523} corpo={10} cor={CORES.ouroEscuro}>
              {dados.materias.join('   ·   ')}
            </Linha>
          </>
        )}

        <div
          className="absolute flex -translate-x-full flex-col items-end gap-[0.4cqw] text-right"
          style={{ ...emPontos(FOLHA.largura - 70, 426), fontSize: corpoEmCqw(10) }}
        >
          <p>emitido em {dados.emitidoEm}</p>
          <p className="font-mono">registro {dados.registro}</p>
          <span className="mt-[2.4cqw] block h-px w-[19cqw] bg-[#1b1710]" />
          <p style={{ fontSize: corpoEmCqw(9.5) }}>Departamento de Assuntos Virgens</p>
        </div>
      </div>
    </div>
  )
}

/**
 * As mesmas coordenadas do PDF, em porcentagem da folha.
 *
 * A folha da tela existe para mostrar o que o arquivo vai ser. Enquanto ela era
 * um `flex` com `justify-between`, isso era mentira por construção: o texto se
 * acomodava na altura disponível e caía em lugares que o PDF — que posiciona
 * cada linha num ponto fixo — nunca usaria. Aqui cada bloco pousa na mesma
 * coordenada dos dois lados.
 */
const emPontos = (x: number, y: number) => ({
  left: `${(x / FOLHA.largura) * 100}%`,
  top: `${(y / FOLHA.altura) * 100}%`,
})

/** Um corpo em pontos de A4, dito na unidade do contêiner da folha. */
const corpoEmCqw = (pt: number) => `${(pt / FOLHA.largura) * 100}cqw`

/** Uma linha centrada na folha, no mesmo ponto em que o PDF a desenha. */
function Linha({
  y,
  corpo,
  cor = CORES.tinta,
  className = '',
  children,
}: {
  y: number
  corpo: number
  cor?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <p
      className={`absolute -translate-x-1/2 text-center leading-none whitespace-nowrap ${className}`}
      style={{ ...emPontos(FOLHA.largura / 2, y), fontSize: corpoEmCqw(corpo), color: cor }}
    >
      {children}
    </p>
  )
}

/**
 * Os ornamentos da folha: moldura, cantoneiras, guilhochê, microtexto e selo.
 *
 * Um SVG só, no `viewBox` do A4 em pontos — as **mesmas coordenadas do PDF**.
 * É o que permite aos dois desenhos saírem da mesma `certificado-arte` em vez
 * de cada um ter a própria cópia dos números, que foi como o selo da tela
 * acabou com um texto em arco que o PDF nunca teve, e que em qualquer largura
 * menor que a do desktop virava um borrão em volta da borda.
 *
 * `preserveAspectRatio` no padrão e a folha com `aspect-ratio: 297/210`: o SVG
 * escala junto com o contêiner, e o desenho nunca se deforma.
 */
function Ornamentos({ elo, larguraDaFaixa }: { elo: string; larguraDaFaixa: number }) {
  const borda = moldura()
  const corrente = correnteDaBorda()
  const sep = separador(FOLHA.largura / 2, 130, 150)
  const pontos = (p: Poligono) => p.map(([x, y]) => `${x},${y}`).join(' ')
  const fita = FRASE_MIUDA.repeat(9)
  const meio = FOLHA.largura / 2

  return (
    <svg
      viewBox={`0 0 ${FOLHA.largura} ${FOLHA.altura}`}
      className="absolute inset-0 size-full"
      aria-hidden
    >
      <g stroke={CORES.teia} strokeWidth="0.25">
        {cordasDoGuilloche(meio, 318, 172).map((c) => (
          <line key={`${c.x1}-${c.y1}-${c.x2}`} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} />
        ))}
      </g>

      {/* As rosetas de canto: o mesmo truque de cordas, em miniatura, no único
          lugar liso que sobrava depois da corrente. */}
      <g stroke={CORES.teiaForte} strokeWidth="0.22">
        {rosetasDosCantos().map((c) => (
          <line key={`${c.x1}-${c.y1}-${c.x2}`} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} />
        ))}
      </g>

      <g fill="none" stroke={CORES.ouro}>
        {borda.filetes.map((f) => (
          <rect
            key={f.espessura}
            x={f.x}
            y={f.y}
            width={f.largura}
            height={f.altura}
            strokeWidth={f.espessura}
          />
        ))}
        {[...borda.tracos, ...sep.tracos, ...corrente.tracos].map((t) => (
          <line
            key={`${t.x1}-${t.y1}-${t.x2}-${t.y2}`}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={t.espessura}
          />
        ))}
      </g>

      <g fill={CORES.ouro}>
        {[...borda.losangos, ...sep.losangos, ...corrente.losangos].map((l) => (
          <polygon key={pontos(l)} points={pontos(l)} />
        ))}
      </g>

      {/* A faixa em que o elo se apoia: sem ela, a palavra mais importante do
          documento fica boiando no vazio. */}
      <polygon
        points={pontos(faixa(meio, 302, larguraDaFaixa, 52))}
        fill={CORES.faixa}
        stroke={CORES.ouro}
        strokeWidth="0.6"
      />

      {/* O microtexto: ilegível a olho nu e nítido no zoom, como em documento de
          segurança. `textLength` prende a fita dentro da moldura em vez de
          depender da métrica da fonte do sistema. */}
      <g fill={CORES.miudo} fontSize="3.6" textAnchor="middle">
        <text x={meio} y={49} textLength={FOLHA.largura - 130} lengthAdjust="spacing">
          {fita}
        </text>
        <text
          x={meio}
          y={FOLHA.altura - 48}
          textLength={FOLHA.largura - 130}
          lengthAdjust="spacing"
        >
          {fita}
        </text>
      </g>

      <Selo elo={elo} />
    </svg>
  )
}

/** O selo, nas coordenadas do PDF: anéis denteados, o átomo e o elo gravado. */
function Selo({ elo }: { elo: string }) {
  const { cx, cy, raio } = SELO
  const pontos = (p: Poligono) => p.map(([x, y]) => `${x},${y}`).join(' ')

  return (
    <g>
      {/* As fitas primeiro: elas saem de baixo do lacre, e o disco por cima é o
          que faz a junção desaparecer. */}
      {fitasDoSelo(cx, cy, raio).map((f) => (
        <polygon
          key={pontos(f)}
          points={pontos(f)}
          fill={CORES.faixa}
          stroke={CORES.ouro}
          strokeWidth="0.6"
        />
      ))}

      <circle cx={cx} cy={cy} r={raio} fill={CORES.papel} stroke={CORES.ouro} strokeWidth="1.6" />
      <circle cx={cx} cy={cy} r={raio - 5} fill="none" stroke={CORES.ouro} strokeWidth="3" />

      <g stroke={CORES.ouro} strokeWidth="1.1">
        {denteadoDoSelo(cx, cy, raio).map((d) => (
          <line key={`${d.x1}-${d.y1}`} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} />
        ))}
      </g>

      {/* O átomo do app: três elipses giradas e o núcleo. */}
      <g stroke={CORES.ouroEscuro} strokeWidth="1.4" fill="none">
        {[0, 60, 120].map((giro) => (
          <ellipse
            key={giro}
            cx={cx}
            cy={cy - 8}
            rx="19"
            ry="8"
            transform={`rotate(${giro} ${cx} ${cy - 8})`}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy - 8} r="3.4" fill={CORES.ouroEscuro} />

      <g fill={CORES.ouroEscuro}>
        {[-1, 1].map((lado) => (
          <polygon key={lado} points={pontos(estrela(cx + lado * 34, cy + 25, 3.4))} />
        ))}
      </g>

      <text
        x={cx}
        y={cy + 28}
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="bold"
        fill={CORES.ouroEscuro}
      >
        {elo}
      </text>
    </g>
  )
}
