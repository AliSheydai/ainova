import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      'src/components/**/*.test.tsx',
      'src/hooks/**/*.test.ts',
      'src/lib/cookies.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
