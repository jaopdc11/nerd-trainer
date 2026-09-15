import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // jsdom para todos os testes: os puros não se importam, e os de storage e de
  // componente precisam de `window`.
  test: { environment: 'jsdom' },
  // Caminhos relativos: funciona tanto em domínio próprio (nerd.jaopd.dev) quanto
  // servido de um subcaminho. O roteamento é por hash, então não há URL de rota
  // para prefixar — `base` só afeta os assets.
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
