import { handleRequest } from './api'
import type { ApiBindings } from './api'

export { BingoRoom } from './BingoRoom'

/** Worker routes /api to its Durable Object; the built Vite app is served as assets. */
export default {
  async fetch(request: Request, env: ApiBindings): Promise<Response> {
    try {
      return await handleRequest(request, env)
    } catch (error) {
      console.error('API request failed', error)
      return new Response(JSON.stringify({ error: {
        code: 'INTERNAL_ERROR', message: 'Serverfehler. Bitte erneut versuchen.',
      } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }
  },
}
