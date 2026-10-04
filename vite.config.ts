import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { skillStoreApi } from './server/plugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), skillStoreApi()],
})
