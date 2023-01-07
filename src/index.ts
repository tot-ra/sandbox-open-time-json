import fastify from 'fastify'

const server = fastify({
  bodyLimit: 1024 * 1048576 // 1GB
})

server.post('/availability', async (request, reply) => {
  const { body: json } = request

  console.log({json});
  // Traverse the JSON object here

  reply.send({ success: true })
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