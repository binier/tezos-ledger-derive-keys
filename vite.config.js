import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte()
    // rollupNodePolyFill()
  ],
  // optimizeDeps: {
  //   define: {
  //     global: 'globalThis'
  //   },
  //   // Enable esbuild polyfill plugins
  //   plugins: [
  //     NodeGlobalsPolyfillPlugin({
  //         process: true,
  //         buffer: true
  //     }),
  //     NodeModulesPolyfillPlugin()
  //   ]
  // },
  // resolve: {
  //   alias: {
  //     stream: 'rollup-plugin-node-polyfills/polyfills/stream'
  //   }
  // }
})
