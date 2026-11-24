import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleStateApiRequest } from './server/stateStore.mjs'
import { handleSheetCsvProxyRequest } from './server/sheetProxy.mjs'

function tuesSlayCloudStatePlugin(): Plugin {
  return {
    name: 'tuesslay-cloud-state-api',
    configureServer(server) {
      server.middlewares.use('/api/state', async (req, res) => {
        await handleStateApiRequest(req, res)
      })
      server.middlewares.use('/api/sheet-csv', async (req, res) => {
        await handleSheetCsvProxyRequest(req, res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/state', async (req, res) => {
        await handleStateApiRequest(req, res)
      })
      server.middlewares.use('/api/sheet-csv', async (req, res) => {
        await handleSheetCsvProxyRequest(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tuesSlayCloudStatePlugin()],
  server: {
    host: true,
    port: 8080,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 8080,
    allowedHosts: true,
  },
})
