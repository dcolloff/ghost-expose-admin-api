import { FastifyRequest, FastifyReply } from 'fastify';
import { Label } from './types/global';
import { server } from './server';

async function fetchMemberApi (uuid: string): Promise<{ id: string; labels: Label[] }> {
  const members = await server.ghostAdminAPI.members.browse({ filter: `uuid:${uuid}` })

  return members[0]
}

async function fetchLabelsApi (uuid: string): Promise<Label[]> {
  const member = await fetchMemberApi(uuid)
  const labels: Label[] = member.labels ?? []

  server.cache.set(uuid, labels)

  return labels
}

export async function getLabels(request: FastifyRequest, reply: FastifyReply) {
  const uuid: string = encodeURIComponent((request.params as any).userId)
  const labels: Label[] = server.cache.get(uuid) ?? await fetchLabelsApi(uuid)

  return reply.send(labels.map(({ name }) => ({ name })))
}

export async function updateLabels(request: FastifyRequest, reply: FastifyReply) {
  const uuid: string = encodeURIComponent((request.params as any).userId)
  const member = await fetchMemberApi(uuid)
  const labels: Label[] = request.body as any
  const data = { id: member.id, labels }
  const response = await server.ghostAdminAPI.members.edit(data, { include: encodeURIComponent('labels,email_recipients') })

  return reply.send(response)
}
