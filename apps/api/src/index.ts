import "dotenv/config";
import express from "express";

const app = express();
const port = process.env.PORT ?? 3333;

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
