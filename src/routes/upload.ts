import type { FastifyInstance } from "fastify";
import { uploadFile } from "../ipfs/pinata.js";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/", {
    schema: {
      description: "Upload a file to IPFS via Pinata",
      tags: ["upload"],
      consumes: ["multipart/form-data"],
      response: {
        201: {
          type: "object",
          properties: {
            cid: { type: "string" },
            url: { type: "string" },
            filename: { type: "string" },
            mimetype: { type: "string" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const data = await request.file({ limits: { fileSize: MAX_FILE_SIZE } });

    if (!data) {
      return reply.badRequest("No file provided");
    }

    const buffer = await data.toBuffer();
    const result = await uploadFile(buffer, data.filename);

    return reply.code(201).send({
      cid: result.cid,
      url: result.url,
      filename: data.filename,
      mimetype: data.mimetype,
    });
  });
}
