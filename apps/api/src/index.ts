import "dotenv/config";
import express from "express";
import { prisma } from "./infrastructure/db/prismaClient";

const app = express();
const port = process.env.PORT ?? 3333;

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok" });
  } catch (error) {
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
