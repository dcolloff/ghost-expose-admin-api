import fastify, { FastifyInstance } from 'fastify'
import fastifyCORS from 'fastify-cors'
import { Controller } from './controllers'
import fastifyCache, { loadCache, persistCache } from './cache'
import ghostAdminApi from './ghost.api'
import fastifyEnv from 'fastify-env'

export default function Server(server: FastifyInstance): FastifyInstance {
  const labelSchema = { type: 'object', properties: { name: { type: 'string' }, slug: { type: 'string' } } }
  const labelsParamsSchema = { userId: { type: 'string', format: 'uuid' } }
  const labelsBodySchema = { type: 'array', items: labelSchema }
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

  server.register(fastifyEnv, { schema: envSchema, dotenv: true })
    .after(() => server.register(fastifyCache))
    .after(() => server.register(ghostAdminApi))
    .after(() => server.register(fastifyCORS, { methods: ['GET', 'PUT'],  origin: server.config.ALLOWED_ORIGINS }))
    .after(() => server.addHook('onClose', ({ cache }) => persistCache(cache)))
    .after(() => server.addHook('onReady', () => loadCache(server.cache)))
    .after(() => {
      const controller = new Controller(server)

      server.get(
        '/members/:userId/labels',
        {
          schema: {
            params: labelsParamsSchema,
            response: {
              200: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string'
                  },
                  labels: {
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
            }
          }
        },
        controller.getLabels.bind(controller)
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
        controller.updateLabels.bind(controller)
      )
    })

  return server
}

if (require.main === module) Server(fastify({ logger: true })).listen(process.env.PORT ?? 3001).catch(console.log)
