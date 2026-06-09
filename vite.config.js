import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { cloudflare } from '@cloudflare/vite-plugin'

// El plugin de Cloudflare corre el Worker en el runtime de Workers durante
// `npm run dev`, con HMR de Vite y los bindings emulados (incluido el secret de .dev.vars).
// https://developers.cloudflare.com/workers/vite-plugin/
export default defineConfig({
  plugins: [vue(), cloudflare()],
})
