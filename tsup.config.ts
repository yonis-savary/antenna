import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/antenna.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
})
