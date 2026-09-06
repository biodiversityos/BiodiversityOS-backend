import type { FastifyInstance } from "fastify";
import { uploadFile } from "../ipfs/pinata.js";
import { authorizeUpload } from "../auth/whitelist.js";
import { config } from "../config.js";

/** Pinning is for sighting photography; anything else is rejected outright. */
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/", {
    config: {
      rateLimit: { max: 20, timeWindow: "1 minute" },
    },
    schema: {
      description:
        "Upload a sighting photo to IPFS via Pinata. Requires x-address, x-issued-at " +
        "and x-signature headers proving control of a whitelisted reporter address.",
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
    const auth = await authorizeUpload(
      request.headers["x-address"] as string | undefined,
      request.headers["x-issued-at"] as string | undefined,
      request.headers["x-signature"] as string | undefined,
    );
    if (!auth.ok) {
      return reply.unauthorized(auth.reason);
    }

    const data = await request.file({ limits: { fileSize: config.upload.maxFileBytes } });
    if (!data) {
      return reply.badRequest("No file provided");
    }

    if (!ALLOWED_MIME.has(data.mimetype)) {
      return reply.unsupportedMediaType(`Unsupported file type: ${data.mimetype}`);
    }

    let buffer: Buffer;
    try {
      buffer = await data.toBuffer();
    } catch {
      // @fastify/multipart throws once the stream passes the configured limit.
      return reply.payloadTooLarge(
        `File exceeds ${config.upload.maxFileBytes / (1024 * 1024)} MB`,
      );
    }

    const result = await uploadFile(buffer, data.filename);
    request.log.info({ cid: result.cid, reporter: auth.address }, "pinned sighting media");

    return reply.code(201).send({
      cid: result.cid,
      url: result.url,
      filename: data.filename,
      mimetype: data.mimetype,
    });
  });
}
