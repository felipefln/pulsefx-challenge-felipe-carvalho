import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { openapiSpec } from "./docs/openapi";
import { prisma } from "./infrastructure/db/prismaClient";

const app = express();

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get("/openapi.json", (_req, res) => {
  res.json(openapiSpec);
});

/**
 * @openapi
 * /:
 *   get:
 *     summary: Status básico da API
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: API no ar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Verifica conectividade com o banco de dados
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: Postgres acessível
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 db: { type: string, example: ok }
 *       503:
 *         description: Postgres inacessível
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: error }
 *                 db: { type: string, example: unreachable }
 */
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok" });
  } catch (error) {
    console.error("Healthcheck falhou: Postgres inacessível", error);
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

app.listen(env.port, () => {
  console.log(`API rodando na porta ${env.port}`);
  console.log(`Documentação OpenAPI/Swagger em http://localhost:${env.port}/docs`);
});
