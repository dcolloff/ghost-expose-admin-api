import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { Label } from '../types/global';

export class Controller {
  async fetchMemberApi (uuid: string): Promise<{ id: string; labels: Label[] }> {
    const members = await this.server.ghostAdminAPI.members.browse({ filter: `uuid:${uuid}` })

    return members[0]
  }
  constructor(private server: FastifyInstance) {}


  async fetchLabelsApi (uuid: string): Promise<Label[]> {
    const member = await this.fetchMemberApi(uuid)
    const labels: Label[] = (member?.labels ?? []).map(({ name }) => ({ name }))

    this.server.cache.set(uuid, labels)

    return labels
  }

  async getLabels(request: FastifyRequest, reply: FastifyReply) {
    const uuid: string = encodeURIComponent((request.params as any).userId)
    const labels: Label[] = this.server.cache.get(uuid) ?? await this.fetchLabelsApi(uuid)

    return reply.send(labels)
  }

  async updateLabels(request: FastifyRequest, reply: FastifyReply) {
    const uuid: string = encodeURIComponent((request.params as any).userId)
    const member = await this.fetchMemberApi(uuid)
    const labels: Label[] = request.body as any
    const data = { id: member?.id, labels }
    const sameLabels = new Set([...labels, ...member?.labels].map(({ name }) => name)).size === member?.labels.length

    if (sameLabels) return reply.send(labels)

    const response = await this.server.ghostAdminAPI.members.edit(data, { include: encodeURIComponent('labels,email_recipients') })

    this.server.cache.set(uuid, labels)

    return reply.send(response.labels.map(({ name }: Label) => ({ name })))
  }
}
