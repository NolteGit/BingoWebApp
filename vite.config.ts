import preact from '@preact/preset-vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:8787', ws: true } },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
