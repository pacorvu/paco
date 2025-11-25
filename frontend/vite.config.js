import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
  optimizeDeps: {
    include: [
      '@chakra-ui/react',
      '@chakra-ui/theme',
      '@chakra-ui/icons',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion',
      '@popperjs/core'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  resolve: {
    dedupe: ['@chakra-ui/react', '@emotion/react', '@emotion/styled']
  },
  server: {
    fs: {
      strict: false
    }
  }
})