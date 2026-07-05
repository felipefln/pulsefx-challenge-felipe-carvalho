import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../db/prismaClient";
import { PrismaIndicatorRepository } from "./prismaIndicatorRepository";
import { PrismaSyncStateRepository } from "./prismaSyncStateRepository";

describe("PrismaSyncStateRepository", () => {
  const indicatorRepository = new PrismaIndicatorRepository();
  const syncStateRepository = new PrismaSyncStateRepository();
  const testCode = "test-syncstate-repo";
  let indicatorId: string;

  beforeAll(async () => {
    const indicator = await indicatorRepository.upsertByCode({
      code: testCode,
      name: "Indicador de teste",
      description: "Usado só pelo teste de integração do SyncStateRepository.",
      source: "FRED",
      sourceSeriesId: "TEST",
      frequency: "MONTHLY",
      unit: null,
    });
    indicatorId = indicator.id;
  });

  afterAll(async () => {
    await prisma.indicator.delete({ where: { id: indicatorId } }); // cascade limpa sync_state
    await prisma.$disconnect();
  });

  it("findByIndicatorId retorna null antes de qualquer sincronização", async () => {
    const result = await syncStateRepository.findByIndicatorId(indicatorId);
    expect(result).toBeNull();
  });

  it("upsert cria o estado na primeira sincronização", async () => {
    const syncedAt = new Date("2026-07-05T13:00:00.000Z");
    const created = await syncStateRepository.upsert(indicatorId, {
      lastSyncedAt: syncedAt,
      lastRefDate: "2026-06-01",
      status: "ok",
    });

    expect(created.indicatorId).toBe(indicatorId);
    expect(created.lastRefDate).toBe("2026-06-01");
    expect(created.status).toBe("ok");
    expect(created.lastSyncedAt).toEqual(syncedAt);
  });

  it("upsert atualiza o mesmo registro numa segunda sincronização", async () => {
    const updated = await syncStateRepository.upsert(indicatorId, {
      lastSyncedAt: new Date("2026-07-05T14:00:00.000Z"),
      lastRefDate: "2026-07-01",
      status: "ok",
    });

    expect(updated.lastRefDate).toBe("2026-07-01");

    const all = await prisma.syncState.findMany({ where: { indicatorId } });
    expect(all).toHaveLength(1); // não duplicou registro
  });
});
