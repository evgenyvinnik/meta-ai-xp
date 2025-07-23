import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    include: "**/*.{jsx,js}",
  })],
  esbuild: {
    loader: "jsx",
    include: /src.*\.[jt]sx?$/,
    exclude: [],
  },
  resolve: {
    alias: {
      // Map all the common absolute import paths used in the project
      'assets': path.resolve(__dirname, './src/assets'),
      'components': path.resolve(__dirname, './src/components'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'WinXP': path.resolve(__dirname, './src/WinXP'),
      'src': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
  },
})
