import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../db/prismaClient";
import { PrismaIndicatorRepository } from "./prismaIndicatorRepository";

/**
 * Teste de integração: roda contra o Postgres real do docker-compose (não
 * mocka o Prisma) — exercita a constraint de unicidade e o mapeamento
 * enum/tipo de fato aplicados pelo banco, não uma suposição sobre eles.
 */
describe("PrismaIndicatorRepository", () => {
  const repository = new PrismaIndicatorRepository();
  const testCode = "test-indicator-repo";

  afterAll(async () => {
    await prisma.indicator.deleteMany({ where: { code: testCode } });
    await prisma.$disconnect();
  });

  it("upsertByCode cria na primeira chamada e atualiza os campos na segunda", async () => {
    const created = await repository.upsertByCode({
      code: testCode,
      name: "Indicador de teste",
      description: "Usado só pelo teste de integração do IndicatorRepository.",
      source: "BCB",
      sourceSeriesId: "test-series",
      frequency: "DAILY",
      unit: null,
    });
    expect(created.name).toBe("Indicador de teste");

    const updated = await repository.upsertByCode({
      code: testCode,
      name: "Indicador de teste (atualizado)",
      description: "Descrição atualizada.",
      source: "BCB",
      sourceSeriesId: "test-series",
      frequency: "DAILY",
      unit: "%",
    });

    expect(updated.id).toBe(created.id); // mesmo registro, não duplicou
    expect(updated.name).toBe("Indicador de teste (atualizado)");
    expect(updated.unit).toBe("%");
  });

  it("findByCode retorna null quando o código não existe", async () => {
    const result = await repository.findByCode("codigo-que-nao-existe");
    expect(result).toBeNull();
  });

  it("findAll inclui o indicador de teste criado acima", async () => {
    const all = await repository.findAll();
    expect(all.some((indicator) => indicator.code === testCode)).toBe(true);
  });
});
