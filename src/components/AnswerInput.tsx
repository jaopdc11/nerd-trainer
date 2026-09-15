import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, RefObject } from 'react'
import type { Veredito } from '@/core/answer/types'
import type { Teclado } from '@/core/types'

/**
 * O campo de resposta, usado pelas quatro mecânicas.
 *
 * É a peça de maior risco do projeto, porque é onde o celular quebra. Três
 * decisões não óbvias, todas com motivo concreto:
 *
 * 1. **Ler de `onChange`, nunca de `onKeyDown`.** Teclados virtuais do Android
 *    (GBoard) mandam `keyCode 229` / `key: 'Unidentified'` em teclas comuns;
 *    com `onKeyDown` as casas de pi ficariam injogáveis no celular. Só o Enter
 *    vem por `onKeyDown`, que é das poucas teclas confiáveis em soft keyboard.
 * 2. **Nunca `type="number"`.** Traz spinner, muda de valor com o scroll e trata
 *    "." e "," conforme o locale. `inputMode` pede o teclado numérico sem nada
 *    disso.
 * 3. **Nunca `blur()` no erro.** No celular o teclado fecharia e a partida
 *    travaria. Pelo mesmo motivo o input fica sempre montado entre exercícios:
 *    trocar o componente derruba o teclado a cada questão.
 */

export interface AnswerInputProps {
  /** 'caractere': cada tecla é julgada na hora. 'linha': acumula até o Enter. */
  readonly modo: 'caractere' | 'linha'
  readonly teclado: Teclado
  /** Chamado por caractere no modo 'caractere'. O veredito só pinta o flash. */
  readonly onCaractere?: (c: string) => Veredito
  /** Chamado no Enter no modo 'linha'. */
  readonly onEnviar?: (texto: string) => Veredito
  /**
   * Se devolve `true` para o que já foi digitado, a resposta é enviada sem
   * esperar o Enter. Quem decide é a engine, que sabe o que ainda está em jogo.
   */
  readonly autoCommit?: (texto: string) => boolean
  /** Espelha a digitação parcial para a engine (fita, prefixo, dica). */
  readonly onMudar?: (texto: string) => void
  readonly bloqueado?: boolean
  readonly placeholder?: string
  readonly rotuloAria: string
  /** Área que devolve o foco ao input quando tocada — normalmente a tela do jogo. */
  readonly ancora?: RefObject<HTMLElement | null>
}

const DURACAO_FLASH_MS = 400

const ANEL: Record<Veredito, string> = {
  certo: 'border-acento bg-acento-fundo/40 motion-safe:animate-brilho',
  quase: 'border-quase bg-quase-fundo/40',
  errado: 'border-erro bg-erro-fundo/40 motion-safe:animate-tremer',
}

export function AnswerInput({
  modo,
  teclado,
  onCaractere,
  onEnviar,
  onMudar,
  autoCommit,
  bloqueado = false,
  placeholder,
  rotuloAria,
  ancora,
}: AnswerInputProps) {
  const refInput = useRef<HTMLInputElement>(null)
  const [texto, setTexto] = useState('')
  const [flash, setFlash] = useState<Veredito | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const piscar = useCallback((v: Veredito) => {
    setFlash(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setFlash(null), DURACAO_FLASH_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  // Devolve o foco quando o jogador toca em qualquer lugar da área de jogo.
  useEffect(() => {
    const alvo = ancora?.current
    if (!alvo) return
    const focar = () => refInput.current?.focus({ preventScroll: true })
    alvo.addEventListener('pointerdown', focar)
    return () => alvo.removeEventListener('pointerdown', focar)
  }, [ancora])

  useEffect(() => {
    if (!bloqueado) refInput.current?.focus({ preventScroll: true })
  }, [bloqueado])

  const aoMudar = (e: ChangeEvent<HTMLInputElement>) => {
    if (bloqueado) return
    const valor = e.target.value

    if (modo === 'linha') {
      // Resposta já inequívoca: envia sem esperar o Enter. É o que dá fluidez à
      // tabela periódica e ao cálculo cronometrado.
      if (autoCommit?.(valor.trim())) {
        const veredito = onEnviar?.(valor.trim())
        if (veredito) piscar(veredito)
        setTexto('')
        onMudar?.('')
        return
      }
      setTexto(valor)
      onMudar?.(valor)
      return
    }

    // Modo caractere: processa TUDO que chegou, não só o último. Digitação
    // rápida (e o autocomplete do Android) entrega vários de uma vez, e comer
    // os do meio seria uma morte súbita injusta.
    let ultimo: Veredito | null = null
    for (const c of valor) {
      if (c.trim() === '') continue
      ultimo = onCaractere?.(c) ?? null
    }
    if (ultimo) piscar(ultimo)
    // O campo sempre volta a vazio: ele é um gatilho, não um acumulador.
    e.target.value = ''
  }

  const aoTeclar = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || modo !== 'linha' || bloqueado) return
    e.preventDefault()
    const limpo = texto.trim()
    if (limpo === '') return

    const veredito = onEnviar?.(limpo)
    if (veredito) piscar(veredito)
    setTexto('')
    onMudar?.('')
  }

  const comumMobile = {
    autoComplete: 'off' as const,
    autoCorrect: 'off',
    autoCapitalize: 'off' as const,
    spellCheck: false,
  }

  return (
    <div
      className={`relative flex items-center gap-3 rounded-2xl border-2 border-borda bg-superficie/80 px-4 py-3.5 backdrop-blur-sm transition-colors duration-200 ${
        flash ? ANEL[flash] : 'focus-within:border-borda-forte'
      }`}
    >
      {/* Cursor de prompt: dá o ar de terminal e mostra onde o texto entra. */}
      <span
        aria-hidden
        className={`font-mono text-xl transition-colors ${
          flash === 'errado' ? 'text-erro' : 'text-acento'
        }`}
      >
        ›
      </span>
      <input
        ref={refInput}
        type="text"
        value={modo === 'linha' ? texto : ''}
        onChange={aoMudar}
        onKeyDown={aoTeclar}
        disabled={bloqueado}
        placeholder={placeholder}
        aria-label={rotuloAria}
        // Nunca type="number": ver o comentário no topo do arquivo.
        inputMode={teclado === 'numerico' ? 'numeric' : 'text'}
        pattern={teclado === 'numerico' ? '[0-9]*' : undefined}
        enterKeyHint={modo === 'linha' ? 'send' : 'done'}
        {...comumMobile}
        className="w-full bg-transparent font-mono text-2xl tabular text-texto outline-none placeholder:text-tenue/70 disabled:opacity-40"
      />
    </div>
  )
}
