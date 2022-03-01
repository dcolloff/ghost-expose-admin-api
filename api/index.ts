import Fastify, { FastifyReply, FastifyRequest } from 'fastify'

const app = Fastify({ logger: true })

app.register(import('./server'), { })

export default async function vercelHandler(request: FastifyRequest, reply: FastifyReply) {
    await app.ready()
    app.server.emit('request', request, reply)
}
