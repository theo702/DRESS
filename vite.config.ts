import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

type ProxyFn = (raw: string) => Promise<unknown>

function productProxy(): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const rawUrl = req.url ?? ''
    const path = rawUrl.split('?')[0]
    if (path !== '/api/proxy') {
      next()
      return
    }
    const target = new URL(rawUrl, 'http://127.0.0.1').searchParams.get('url')
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'no-store')
    try {
      if (!target) {
        res.statusCode = 400
        res.end(JSON.stringify({ ok: false, error: 'Paramètre url manquant.' }))
        return
      }
      // @ts-expect-error Netlify function is untyped JS; a .d.mts sibling broke the function name.
      const mod = (await import('./netlify/functions/proxy.mjs')) as { fetchPublic: ProxyFn }
      const result = await mod.fetchPublic(target)
      res.statusCode = 200
      res.end(JSON.stringify(result))
    } catch (err) {
      res.statusCode = 400
      res.end(
        JSON.stringify({
          ok: false,
          error: err instanceof Error ? err.message : 'Import impossible.',
        }),
      )
    }
  }
  return {
    name: 'dress-product-proxy',
    configureServer(server) {
      server.middlewares.use(handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), productProxy()],
  server: {
    host: true,
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
