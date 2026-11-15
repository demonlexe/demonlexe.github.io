import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { robloxHeadshotPlugin } from './build/robloxHeadshot.ts'
import { siteConfig } from './src/config.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), robloxHeadshotPlugin(siteConfig.robloxUserId)],
})
