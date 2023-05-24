import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
    __VERSION__: '"test"',
  },
  resolve: {
    alias: {
      '@dlovely/mysql': join(__dirname, 'packages/mysql/src'),
      '@dlovely/utils': join(__dirname, 'packages/utils/src'),
      '@dlovely/sql-editor': join(__dirname, 'packages/sql-editor/src'),
    },
  },
  test: {
    globals: true,
    threads: !process.env.GITHUB_ACTIONS,
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      exclude: ['packages/utils/src/type-check.ts'],
    },
  },
})
