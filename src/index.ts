import fastify, { FastifyReply, FastifyRequest } from 'fastify'

import parse from './parser';

const server = fastify({
  logger: true,
  bodyLimit: 1024 * 1048576 // 1GB
})

server.post('/availability', async (request: FastifyRequest, reply: FastifyReply) => {
  reply.send(parse(request?.body, request.log))
})

server.listen({
    host:'0.0.0.0',
    port: 1234
}, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Started server at ${address}`)
})