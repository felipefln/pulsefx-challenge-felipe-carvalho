import type { IndicatorSummary } from "@pulsefx/shared";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GetIndicatorHistoryUseCase } from "../application/useCases/getIndicatorHistoryUseCase";
import { ListIndicatorsUseCase } from "../application/useCases/listIndicatorsUseCase";
import { SyncIndicatorUseCase } from "../application/useCases/syncIndicatorUseCase";
import type { ExternalObservation, ExternalSeriesProvider } from "../domain/services/externalSeriesProvider";
import { prisma } from "../infrastructure/db/prismaClient";
import { PrismaFavoriteRepository } from "../infrastructure/repositories/prismaFavoriteRepository";
import { PrismaIndicatorRepository } from "../infrastructure/repositories/prismaIndicatorRepository";
import { PrismaObservationRepository } from "../infrastructure/repositories/prismaObservationRepository";
import { PrismaSyncStateRepository } from "../infrastructure/repositories/prismaSyncStateRepository";
import { anonymousUser } from "../interfaces/http/middlewares/anonymousUser";
import { createIndicatorRouter } from "../interfaces/http/routes/indicatorRoutes";

/** Provider falso (sem rede): devolve sempre as mesmas 2 observações, simulando um BCB/FRED real. */
class FakeExternalSeriesProvider implements ExternalSeriesProvider {
  async fetch(): Promise<ExternalObservation[]> {
    return [
      { refDate: "2026-07-01", value: 5.0 },
      { refDate: "2026-07-02", value: 5.1 },
    ];
  }
}

/**
 * Teste de integração de ponta a ponta: SyncIndicatorUseCase persiste no
 * Postgres real via os repositórios Prisma, e GET /indicators (rota HTTP de
 * verdade, sem stub) precisa refletir exatamente o que foi sincronizado —
 * fecha o loop fetch externo -> persistência -> API que o Phase 8 pede.
 */
describe("sync -> GET /indicators (integração real)", () => {
  const testCode = "test-integration-sync";
  const indicatorRepository = new PrismaIndicatorRepository();
  const observationRepository = new PrismaObservationRepository();
  const syncStateRepository = new PrismaSyncStateRepository();
  const favoriteRepository = new PrismaFavoriteRepository();

  let indicatorId: string;

  beforeAll(async () => {
    const indicator = await indicatorRepository.upsertByCode({
      code: testCode,
      name: "Indicador de teste (integração)",
      description: "Usado só pelo teste de integração sync -> GET /indicators.",
      source: "BCB",
      sourceSeriesId: "test-integration-series",
      frequency: "DAILY",
      unit: "BRL",
    });
    indicatorId = indicator.id;
  });

  afterAll(async () => {
    await prisma.indicator.delete({ where: { id: indicatorId } }); // cascade limpa observations + syncState
    await prisma.$disconnect();
  });

  it("persiste as observações buscadas e a API expõe último valor + variação corretos", async () => {
    const syncUseCase = new SyncIndicatorUseCase(
      indicatorRepository,
      observationRepository,
      syncStateRepository,
      new FakeExternalSeriesProvider(),
    );
    const result = await syncUseCase.execute(testCode, new Date("2026-07-03T12:00:00Z"));
    expect(result.insertedCount).toBe(2);

    const listIndicatorsUseCase = new ListIndicatorsUseCase(indicatorRepository, observationRepository, favoriteRepository);
    const getIndicatorHistoryUseCase = new GetIndicatorHistoryUseCase(indicatorRepository, observationRepository);
    const app = express();
    app.use(anonymousUser);
    app.use("/indicators", createIndicatorRouter(listIndicatorsUseCase, getIndicatorHistoryUseCase));

    const response = await request(app).get("/indicators");
    expect(response.status).toBe(200);

    const synced = (response.body.indicators as IndicatorSummary[]).find((i) => i.code === testCode);
    expect(synced).toBeDefined();
    expect(synced?.latestObservation).toEqual({ indicatorId, refDate: "2026-07-02", value: 5.1 });
    expect(synced?.variation?.changePercent).toBeCloseTo(2, 5); // (5.1 - 5.0) / 5.0 * 100
  });

  it("uma segunda sincronização não duplica as mesmas observações (idempotência)", async () => {
    const syncUseCase = new SyncIndicatorUseCase(
      indicatorRepository,
      observationRepository,
      syncStateRepository,
      new FakeExternalSeriesProvider(),
    );

    const result = await syncUseCase.execute(testCode, new Date("2026-07-03T12:00:00Z"));
    expect(result.insertedCount).toBe(0);

    const all = await observationRepository.findByIndicatorId(indicatorId);
    expect(all).toHaveLength(2);
  });
});
