import NodeCache from 'node-cache';

declare module 'fastify' {
  interface FastifyInstance {
    cache: NodeCache
    ghostAdminAPI: GhostAdminAPI
    config: {
      PORT: number
      GHOST_API_URL: string
      GHOST_ADMIN_API_KEY: string
      ALLOWED_ORIGINS: string
    }
  }
}

export interface MakeRequestArgs {
  url: string
   method: 'GET' | 'POST'
   data: unknown,
   params: unknown
   headers: unknown
}

export interface Label {
  id?: string,
  name: string,
  slug?: string,
  created_at?: Date
  updated_at?: Date
}
