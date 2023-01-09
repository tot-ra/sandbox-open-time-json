import fastify, { FastifyReply, FastifyRequest } from "fastify";

import parse from "./models/parser";

const server = fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  bodyLimit: 1024 * 1048576, // 1GB
});

server.get("/", async () => {
  return "☀️";
});

server.post(
  "/availability",
  async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send(parse(request?.body));
  }
);

server.listen(
  {
    host: "0.0.0.0",
    port: 1234,
  },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Started server at ${address}`);
  }
);
