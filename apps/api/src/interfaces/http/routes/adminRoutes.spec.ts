import "dotenv/config";
import type { Indicator } from "@pulsefx/shared";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncIndicatorUseCase } from "../../../application/useCases/syncIndicatorUseCase";
import type { IndicatorRepository, UpsertIndicatorInput } from "../../../domain/repositories/indicatorRepository";
import { createAdminRouter } from "./adminRoutes";

// Depende de ADMIN_SYNC_TOKEN configurado em apps/api/.env (ver .env.example) —
// mesma premissa dos testes de repositório dependerem do Postgres do docker-compose.
const adminToken = process.env.ADMIN_SYNC_TOKEN;
if (!adminToken) {
  throw new Error("ADMIN_SYNC_TOKEN precisa estar configurado em apps/api/.env para rodar este teste");
}

class FakeIndicatorRepository implements IndicatorRepository {
  constructor(private readonly indicators: Indicator[]) {}
  async findAll(): Promise<Indicator[]> {
    return this.indicators;
  }
  async findByCode(code: string): Promise<Indicator | null> {
    return this.indicators.find((indicator) => indicator.code === code) ?? null;
  }
  async upsertByCode(input: UpsertIndicatorInput): Promise<Indicator> {
    return { id: input.code, ...input };
  }
}

const testIndicator: Indicator = {
  id: "ind-1",
  code: "usd-brl",
  name: "USD/BRL",
  description: "teste",
  source: "BCB",
  sourceSeriesId: "PTAX",
  frequency: "DAILY",
  unit: null,
};

function buildApp(execute: ReturnType<typeof vi.fn>) {
  const app = express();
  const repository = new FakeIndicatorRepository([testIndicator]);
  const useCase = { execute } as unknown as SyncIndicatorUseCase;
  app.use("/admin", createAdminRouter(repository, useCase));
  return app;
}

describe("POST /admin/sync", () => {
  let execute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    execute = vi.fn();
  });

  it("retorna 401 sem o header X-Admin-Token", async () => {
    const response = await request(buildApp(execute)).post("/admin/sync");
    expect(response.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("retorna 401 com token incorreto", async () => {
    const response = await request(buildApp(execute)).post("/admin/sync").set("X-Admin-Token", "token-errado");
    expect(response.status).toBe(401);
  });

  it("com token correto e sem `code`, sincroniza todos os indicadores cadastrados", async () => {
    execute.mockResolvedValue({ indicatorCode: "usd-brl", insertedCount: 3, syncState: {} });

    const response = await request(buildApp(execute)).post("/admin/sync").set("X-Admin-Token", adminToken);

    expect(response.status).toBe(200);
    expect(execute).toHaveBeenCalledWith("usd-brl");
    expect(response.body.results).toEqual([{ indicatorCode: "usd-brl", insertedCount: 3 }]);
  });

  it("com `code` na query, sincroniza só aquele indicador", async () => {
    execute.mockResolvedValue({ indicatorCode: "usd-brl", insertedCount: 1, syncState: {} });

    await request(buildApp(execute)).post("/admin/sync?code=usd-brl").set("X-Admin-Token", adminToken);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith("usd-brl");
  });

  it("reporta erro por indicador sem quebrar a resposta inteira", async () => {
    execute.mockRejectedValue(new Error("falha simulada"));

    const response = await request(buildApp(execute)).post("/admin/sync").set("X-Admin-Token", adminToken);

    expect(response.status).toBe(200);
    expect(response.body.results).toEqual([{ indicatorCode: "usd-brl", error: "falha simulada" }]);
  });
});
