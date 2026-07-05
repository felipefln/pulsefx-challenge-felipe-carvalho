import type { Indicator } from "@pulsefx/shared";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { FavoriteRepository } from "../../../domain/repositories/favoriteRepository";
import type { IndicatorRepository, UpsertIndicatorInput } from "../../../domain/repositories/indicatorRepository";
import { anonymousUser } from "../middlewares/anonymousUser";
import { createFavoriteRouter } from "./favoriteRoutes";

const usdBrl: Indicator = {
  id: "ind-usd-brl",
  code: "usd-brl",
  name: "USD/BRL",
  description: "d",
  source: "BCB",
  sourceSeriesId: "PTAX",
  frequency: "DAILY",
  unit: "BRL",
};

class FakeIndicatorRepository implements IndicatorRepository {
  constructor(private readonly indicators: Indicator[]) {}
  async findAll(): Promise<Indicator[]> {
    return this.indicators;
  }
  async findByCode(code: string): Promise<Indicator | null> {
    return this.indicators.find((i) => i.code === code) ?? null;
  }
  async upsertByCode(input: UpsertIndicatorInput): Promise<Indicator> {
    return { id: input.code, ...input };
  }
}

function buildApp(favoriteRepository: FavoriteRepository) {
  const app = express();
  app.use(anonymousUser);
  app.use("/favorites", createFavoriteRouter(new FakeIndicatorRepository([usdBrl]), favoriteRepository));
  return app;
}

function fakeFavoriteRepository(overrides: Partial<FavoriteRepository> = {}): FavoriteRepository {
  return {
    findIndicatorIdsByAnonymousUserId: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("rotas de /favorites", () => {
  it("retorna 400 em qualquer rota sem X-Anonymous-Id", async () => {
    const app = buildApp(fakeFavoriteRepository());

    const getResponse = await request(app).get("/favorites");
    const postResponse = await request(app).post("/favorites/usd-brl");

    expect(getResponse.status).toBe(400);
    expect(postResponse.status).toBe(400);
  });

  it("GET /favorites resolve indicatorIds favoritados para os codes correspondentes", async () => {
    const favoriteRepository = fakeFavoriteRepository({
      findIndicatorIdsByAnonymousUserId: vi.fn().mockResolvedValue([usdBrl.id]),
    });

    const response = await request(buildApp(favoriteRepository))
      .get("/favorites")
      .set("X-Anonymous-Id", "user-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ codes: ["usd-brl"] });
  });

  it("POST /favorites/:code favorita usando o indicatorId resolvido do code", async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const favoriteRepository = fakeFavoriteRepository({ add });

    const response = await request(buildApp(favoriteRepository))
      .post("/favorites/usd-brl")
      .set("X-Anonymous-Id", "user-1");

    expect(response.status).toBe(204);
    expect(add).toHaveBeenCalledWith("user-1", usdBrl.id);
  });

  it("POST /favorites/:code retorna 404 para código inexistente", async () => {
    const response = await request(buildApp(fakeFavoriteRepository()))
      .post("/favorites/nao-existe")
      .set("X-Anonymous-Id", "user-1");

    expect(response.status).toBe(404);
  });

  it("DELETE /favorites/:code desfavorita usando o indicatorId resolvido do code", async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const favoriteRepository = fakeFavoriteRepository({ remove });

    const response = await request(buildApp(favoriteRepository))
      .delete("/favorites/usd-brl")
      .set("X-Anonymous-Id", "user-1");

    expect(response.status).toBe(204);
    expect(remove).toHaveBeenCalledWith("user-1", usdBrl.id);
  });
});
