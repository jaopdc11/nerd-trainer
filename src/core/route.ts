import { useSyncExternalStore } from 'react'

/**
 * Roteador por hash, à mão.
 *
 * GitHub Pages não tem rewrite de servidor: com History API, dar F5 em
 * `/jogo/pi` devolve 404, e a saída padrão é duplicar `index.html` como
 * `404.html`. Com `#/jogo/pi` o servidor sempre serve `index.html`, deep link e
 * F5 funcionam, e o `base` do Vite deixa de importar para o roteamento. O
 * conjunto de rotas é fechado e pequeno; `react-router-dom` não se pagaria.
 */

export type Rota =
  | { readonly nome: 'menu' }
  | { readonly nome: 'jogo'; readonly jogoId: string; readonly modoId?: string }
  | { readonly nome: 'recordes' }

export function parseHash(hash: string): Rota {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean)

  if (partes[0] === 'jogo' && partes[1]) {
    return { nome: 'jogo', jogoId: partes[1], ...(partes[2] ? { modoId: partes[2] } : {}) }
  }
  if (partes[0] === 'recordes') return { nome: 'recordes' }
  return { nome: 'menu' }
}

export function href(rota: Rota): string {
  switch (rota.nome) {
    case 'menu':
      return '#/'
    case 'recordes':
      return '#/recordes'
    case 'jogo':
      return `#/jogo/${rota.jogoId}${rota.modoId ? `/${rota.modoId}` : ''}`
  }
}

export function navegar(rota: Rota, substituir = false): void {
  const destino = href(rota)
  if (substituir) {
    window.history.replaceState(null, '', destino)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = destino
  }
}

function inscrever(f: () => void): () => void {
  window.addEventListener('hashchange', f)
  return () => window.removeEventListener('hashchange', f)
}

// Cache do objeto: `useSyncExternalStore` compara por identidade, e um objeto
// novo a cada leitura faria o React entrar em laço.
let cacheHash = ''
let cacheRota: Rota = { nome: 'menu' }

function ler(): Rota {
  const hash = window.location.hash
  if (hash !== cacheHash) {
    cacheHash = hash
    cacheRota = parseHash(hash)
  }
  return cacheRota
}

export function useRota(): Rota {
  return useSyncExternalStore(inscrever, ler, ler)
}
