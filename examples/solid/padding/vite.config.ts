import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import rollupReplace from '@rollup/plugin-replace'

export default defineConfig({
  plugins: [
    rollupReplace({
      preventAssignment: true,
      values: {
        __DEV__: JSON.stringify(true),
        'process.env.NODE_ENV': JSON.stringify('development'),
      },
    }),
    solidPlugin(),
  ],
  build: {
    target: 'esnext',
    polyfillDynamicImport: false,
  },
})
