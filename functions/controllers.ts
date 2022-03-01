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
    const labels: Label[] = member.labels ?? []

    this.server.cache.set(uuid, labels)

    return labels
  }

  async getLabels(request: FastifyRequest, reply: FastifyReply) {
    const uuid: string = encodeURIComponent((request.params as any).userId)
    const labels: Label[] = this.server.cache.get(uuid) ?? await this.fetchLabelsApi(uuid)

    return reply.send(labels.map(({ name }) => ({ name })))
  }

  async updateLabels(request: FastifyRequest, reply: FastifyReply) {
    const uuid: string = encodeURIComponent((request.params as any).userId)
    const member = await this.fetchMemberApi(uuid)
    const labels: Label[] = request.body as any
    const data = { id: member.id, labels }
    const response = await this.server.ghostAdminAPI.members.edit(data, { include: encodeURIComponent('labels,email_recipients') })

    return reply.send(response)
  }
}
