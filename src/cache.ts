import NodeCache from 'node-cache'
import fastifyPlugin from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

const nodeCache = new NodeCache({ maxKeys: 1000 })
const rootDirectory = resolve(require.resolve('node-cache'), '../../../')

export function persistCache(cache: NodeCache, directoryPath = rootDirectory) {
  process.stdin.resume()

  const keys = cache.keys()
  const data = cache.mget(keys)
  const stringifiedData = JSON.stringify(data);

  writeFileSync(join(directoryPath, 'cache.json'), stringifiedData)

  process.exit()
}

export function loadCache(cache: NodeCache, directoryPath = rootDirectory) {
  const filePath = join(directoryPath, 'cache.json');

  if (!existsSync(filePath)) return

  const jsonData = readFileSync(filePath, 'utf8');
  const data = JSON.parse(jsonData);
  for (const [key, val] of Object.entries(data)) {
    if (data.hasOwnProperty(key)) {
      cache.set(key, val);
    }
  }
};

async function plugin(fastify: FastifyInstance) {
  fastify.decorate('cache',  nodeCache)
}

process.on('beforeExit', () => persistCache(nodeCache))
process.on('exit', () => persistCache(nodeCache));

//catches ctrl+c event
process.on('SIGINT', () => persistCache(nodeCache));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', () => persistCache(nodeCache));
process.on('SIGUSR2', () => persistCache(nodeCache));

//catches uncaught exceptions
process.on('uncaughtException', () => persistCache(nodeCache));

export default fastifyPlugin(plugin, { name: 'cache' })
