import GhostAdminAPI from '@tryghost/admin-api'
import axios from 'axios'
import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { MakeRequestArgs } from '../types/global'

function plugin(fastify: FastifyInstance, _options: FastifyPluginOptions, next: HookHandlerDoneFunction) {
  const ghostAdminAPI = new GhostAdminAPI({
    url: fastify.config.GHOST_API_URL,
    key: fastify.config.GHOST_ADMIN_API_KEY,
    version: "canary",
    async makeRequest({ url, method, data, params = {}, headers = {}}: MakeRequestArgs) {
      return axios({ url, method, params, data, headers, maxContentLength: Infinity }).then((res) => res.data);
    }
  })

  fastify.decorate('ghostAdminAPI',  ghostAdminAPI)

  next()
}

export default fastifyPlugin(plugin, { name: 'ghostAdminAPI' })
