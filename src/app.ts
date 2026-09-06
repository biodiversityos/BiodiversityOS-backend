import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import sensible from "@fastify/sensible";
import { uploadRoutes } from "./routes/upload.js";
import { config } from "./config.js";

const app = Fastify({ logger: true, trustProxy: true });

app.register(swagger, {
  openapi: {
    info: {
      title: "BiodiversityOS Backend",
      version: "0.2.0",
      description: "IPFS upload for accredited BiodiversityOS reporters",
    },
  },
});

app.register(swaggerUi, { routePrefix: "/docs" });

// An open origin would let any page drive an authenticated reporter's browser.
app.register(cors, {
  origin: config.corsOrigins.length > 0 ? config.corsOrigins : false,
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-address", "x-issued-at", "x-signature"],
});

app.register(rateLimit, { global: false, max: 60, timeWindow: "1 minute" });
app.register(multipart, { limits: { fileSize: config.upload.maxFileBytes, files: 1 } });
app.register(sensible);
app.register(uploadRoutes, { prefix: "/upload" });

app.get("/health", async () => ({ status: "ok" }));

export default app;
