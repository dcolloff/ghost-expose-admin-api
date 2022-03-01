import fastifyCORS from 'fastify-cors'
import { getLabels, updateLabels } from './controllers'
import fastifyCache, { loadCache, persistCache } from './cache'
import ghostAdminApi from './ghost.api'
import fastifyEnv from 'fastify-env'
import { server } from './server'

const envSchema = {
  type: 'object',
  required: ['PORT', 'GHOST_API_URL', 'GHOST_ADMIN_API_KEY', 'ALLOWED_ORIGINS'],
  properties: {
    PORT: {
      type: 'string',
      default: 3001
    },
    GHOST_API_URL: {
      type: 'string',
      default: 'localhost'
    },
    GHOST_ADMIN_API_KEY: {
      type: 'string'
    },
    ALLOWED_ORIGINS: {
      type: 'string',
      default: 'localhost'
    }
  }
}

const labelSchema = { type: 'object', properties: { name: { type: 'string' }, slug: { type: 'string' } } }
const labelsParamsSchema = { userId: { type: 'string', format: 'uuid' } }
const labelsBodySchema = { type: 'array', items: labelSchema }

server.addHook('onClose', ({ cache }) => persistCache(cache))
server.addHook('onReady', () => loadCache(server.cache))

server.register(fastifyEnv, { schema: envSchema, dotenv: true })
server.register(fastifyCache)
server.register(ghostAdminApi)
server.register(fastifyCORS, { methods: ['GET'],  origin: process.env.ALLOWED_ORIGINS })

server.get(
  '/members/:userId/labels',
  {
    schema: {
      params: labelsParamsSchema,
      response: {
        200: {
          type: 'array',
          items: labelSchema
        }
      }
    }
  },
  getLabels
)

server.put(
  '/members/:userId/labels',
  {
    schema: {
      params: labelsParamsSchema,
      body: labelsBodySchema,
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              active: {
                type: 'boolean'
              }
            }
          }
        }
      }
    }
  },
  updateLabels
)

async function start() {
  try {
    await server.listen(server?.config?.PORT ?? process.env.PORT ?? 3001)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
