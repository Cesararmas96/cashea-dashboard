import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import crypto from 'node:crypto'

// Polyfill for Node 16 compatibility with Vite 5.4+ plugins/rollup
if (!Array.prototype.at) {
  Array.prototype.at = function (i: number) {
    return this[i < 0 ? this.length + i : i];
  };
}

if (!(crypto as any).getRandomValues && crypto.webcrypto && crypto.webcrypto.getRandomValues) {
  (crypto as any).getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
}

export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: ['..'] },
  },
})
