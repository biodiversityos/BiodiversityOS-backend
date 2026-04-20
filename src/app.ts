import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import sensible from "@fastify/sensible";
import { uploadRoutes } from "./routes/upload.js";

const app = Fastify({ logger: true });

app.register(swagger, {
  openapi: {
    info: {
      title: "BiodiversityOS Backend",
      version: "0.1.0",
      description: "IPFS file upload for BiodiversityOS",
    },
  },
});

app.register(swaggerUi, { routePrefix: "/docs" });
app.register(cors, { origin: true });
app.register(multipart);
app.register(sensible);
app.register(uploadRoutes, { prefix: "/upload" });

app.get("/health", async () => ({ status: "ok" }));

export default app;
