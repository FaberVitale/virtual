import { RollupOptions, Plugin as RollupPlugin } from 'rollup'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import visualizer from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import path from 'path'
import svelte from 'rollup-plugin-svelte'

type PkgType = 'svelte' | 'react' | 'vue' | 'solid';

type Options = {
  pkgType: PkgType
  input: string
  packageDir: string
  external: RollupOptions['external']
  banner: string
  jsName: string
  outputFile: string
  globals: Record<string, string>,
  babelPlugin: RollupPlugin
}

const umdDevPlugin = (type: 'development' | 'production') =>
  replace({
    'process.env.NODE_ENV': `"${type}"`,
    delimiters: ['', ''],
    preventAssignment: true,
  })

export default function rollup(options: RollupOptions): RollupOptions[] {
  return [
    ...buildConfigs({
      name: 'virtual-core',
      pkgType: 'react',
      packageDir: 'packages/virtual-core',
      jsName: 'VirtualCore',
      outputFile: 'virtual-core',
      entryFile: 'src/index.ts',
      globals: {},
    }),
    ...buildConfigs({
      pkgType: 'react',
      name: 'react-virtual',
      packageDir: 'packages/react-virtual',
      jsName: 'ReactVirtual',
      outputFile: 'react-virtual',
      entryFile: 'src/index.tsx',
      globals: {
        react: 'React',
      },
    }),
    ...buildConfigs({
      pkgType: 'solid',
      name: 'solid-virtual',
      packageDir: 'packages/solid-virtual',
      jsName: 'SolidVirtual',
      outputFile: 'solid-virtual',
      entryFile: 'src/index.tsx',
      globals: {
        "solid-js": 'SolidJs',
        "solid-js/web": "SolidJsWeb"
      },
    })
  ]
}

function buildConfigs(opts: {
  packageDir: string
  pkgType: PkgType,
  name: string,
  jsName: string
  outputFile: string
  entryFile: string
  globals: Record<string, string>
}): RollupOptions[] {

  const presetOfPkgType: Partial<Record<PkgType, Parameters<typeof babel>['0']['presets']>> = {
    'solid':  ["solid", "@babel/preset-typescript"]
  }

  const babelPlugin = babel({
    babelHelpers: 'bundled',
    exclude: /node_modules/,
    extensions: ['.ts', '.tsx'],
    presets: presetOfPkgType[opts.pkgType]
  })

  const input = path.resolve(opts.packageDir, opts.entryFile)
  const externalDeps = Object.keys(opts.globals)

  const external = (moduleName) => externalDeps.includes(moduleName)
  const banner = createBanner(opts.name)

  const options: Options = {
    babelPlugin,
    pkgType: opts.pkgType,
    input,
    jsName: opts.jsName,
    outputFile: opts.outputFile,
    packageDir: opts.packageDir,
    external,
    banner,
    globals: opts.globals,
  }

  return [esm(options), cjs(options), umdDev(options), umdProd(options)]
}

function esm({ input, packageDir, external, banner,pkgType, babelPlugin }: Options): RollupOptions {
  return {
    // ESM
    external,
    input,
    output: {
      format: 'esm',
      sourcemap: true,
      dir: `${packageDir}/build/esm`,
      banner,
    },
    plugins: [
      pkgType === 'svelte' && svelte(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
    ],
  }
}

function cjs({ input, external, packageDir, banner, pkgType, babelPlugin }: Options): RollupOptions {
  return {
    // CJS
    external,
    input,
    output: {
      format: 'cjs',
      sourcemap: true,
      dir: `${packageDir}/build/cjs`,
      preserveModules: true,
      exports: 'named',
      banner,
    },
    plugins: [
      pkgType === 'svelte' && svelte(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
    ],
  }
}

function umdDev({
  input,
  external,
  packageDir,
  outputFile,
  globals,
  banner,
  pkgType,
  babelPlugin,
  jsName,
}: Options): RollupOptions {
  return {
    // UMD (Dev)
    external,
    input,
    output: {
      format: 'umd',
      sourcemap: true,
      file: `${packageDir}/build/umd/index.development.js`,
      name: jsName,
      globals,
      banner,
    },
    plugins: [
      pkgType === 'svelte' && svelte(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
      umdDevPlugin('development'),
    ],
  }
}

function umdProd({
  input,
  external,
  packageDir,
  outputFile,
  babelPlugin,
  globals,
  banner,
  jsName,
}: Options): RollupOptions {
  return {
    // UMD (Prod)
    external,
    input,
    output: {
      format: 'umd',
      sourcemap: true,
      file: `${packageDir}/build/umd/index.production.js`,
      name: jsName,
      globals,
      banner,
    },
    plugins: [
      svelte(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
      umdDevPlugin('production'),
      terser({
        mangle: true,
        compress: true,
      }),
      size({}),
      visualizer({
        filename: `${packageDir}/build/stats-html.html`,
        gzipSize: true,
      }),
      visualizer({
        filename: `${packageDir}/build/stats-react.json`,
        json: true,
        gzipSize: true,
      }),
    ],
  }
}

function createBanner(libraryName: string) {
  return `/**
 * ${libraryName}
 *
 * Copyright (c) TanStack
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */`
}
