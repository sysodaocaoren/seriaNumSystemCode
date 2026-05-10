import path from 'path'
import type { IncomingMessage } from 'node:http'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { handleRedeemCodeApiRequest } from './src/server/api-handler'
import { createLocalFileRepository } from './src/server/local-file-repository'

const repository = createLocalFileRepository(path.join(__dirname, '.data', 'redeem-store.json'))

async function parseRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  if (chunks.length === 0) {
    return {}
  }

  const raw = Buffer.concat(chunks).toString('utf-8')
  if (!raw.trim()) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export default defineConfig({
  appType: 'spa',
  plugins: [
    react(),
    {
      name: 'redeem-code-local-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url) {
            next()
            return
          }

          const url = new URL(req.url, 'http://127.0.0.1:5175')
          if (!url.pathname.startsWith('/api/')) {
            next()
            return
          }

          const body = ['POST', 'PUT', 'PATCH'].includes(req.method || '') ? await parseRequestBody(req) : {}
          const result = await handleRedeemCodeApiRequest({
            method: req.method || 'GET',
            pathname: url.pathname,
            searchParams: url.searchParams,
            body,
            repository,
          })

          if (!result) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, error: '接口不存在' }))
            return
          }

          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(result.body))
        })
      },
    },
  ],
  server: {
    port: 5175,
    strictPort: true,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
