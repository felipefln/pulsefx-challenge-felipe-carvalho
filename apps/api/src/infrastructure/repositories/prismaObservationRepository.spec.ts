import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../db/prismaClient";
import { PrismaIndicatorRepository } from "./prismaIndicatorRepository";
import { PrismaObservationRepository } from "./prismaObservationRepository";

/** Teste de integração contra o Postgres real — exercita a constraint única (indicatorId, refDate) de fato. */
describe("PrismaObservationRepository", () => {
  const indicatorRepository = new PrismaIndicatorRepository();
  const observationRepository = new PrismaObservationRepository();
  const testCode = "test-observation-repo";
  let indicatorId: string;

  beforeAll(async () => {
    const indicator = await indicatorRepository.upsertByCode({
      code: testCode,
      name: "Indicador de teste",
      description: "Usado só pelo teste de integração do ObservationRepository.",
      source: "BCB",
      sourceSeriesId: "test-series",
      frequency: "DAILY",
      unit: null,
    });
    indicatorId = indicator.id;
  });

  afterAll(async () => {
    await prisma.indicator.delete({ where: { id: indicatorId } }); // cascade limpa observations
    await prisma.$disconnect();
  });

  it("persiste observações novas e ignora duplicatas de (indicatorId, refDate)", async () => {
    const firstBatch = await observationRepository.saveMany(indicatorId, [
      { refDate: "2026-07-01", value: 5.1 },
      { refDate: "2026-07-02", value: 5.2 },
    ]);
    expect(firstBatch).toBe(2);

    const secondBatch = await observationRepository.saveMany(indicatorId, [
      { refDate: "2026-07-02", value: 999 }, // duplicata — deve ser ignorada, não sobrescrita
      { refDate: "2026-07-03", value: 5.3 },
    ]);
    expect(secondBatch).toBe(1);

    const all = await observationRepository.findByIndicatorId(indicatorId);
    expect(all.map((o) => o.refDate)).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
    expect(all.find((o) => o.refDate === "2026-07-02")?.value).toBe(5.2);
  });

  it("com limit, retorna só as observações mais recentes, ainda em ordem crescente", async () => {
    const limited = await observationRepository.findByIndicatorId(indicatorId, { limit: 2 });
    expect(limited.map((o) => o.refDate)).toEqual(["2026-07-02", "2026-07-03"]);
  });

  it("saveMany com lista vazia não faz nenhuma chamada ao banco e retorna 0", async () => {
    const count = await observationRepository.saveMany(indicatorId, []);
    expect(count).toBe(0);
  });
});
