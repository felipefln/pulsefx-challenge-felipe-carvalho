import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../db/prismaClient";
import { PrismaFavoriteRepository } from "./prismaFavoriteRepository";
import { PrismaIndicatorRepository } from "./prismaIndicatorRepository";

describe("PrismaFavoriteRepository", () => {
  const indicatorRepository = new PrismaIndicatorRepository();
  const favoriteRepository = new PrismaFavoriteRepository();
  const testCode = "test-favorite-repo";
  const anonymousUserId = "test-anonymous-user";
  let indicatorId: string;

  beforeAll(async () => {
    const indicator = await indicatorRepository.upsertByCode({
      code: testCode,
      name: "Indicador de teste",
      description: "Usado só pelo teste de integração do FavoriteRepository.",
      source: "BCB",
      sourceSeriesId: "test-series",
      frequency: "DAILY",
      unit: null,
    });
    indicatorId = indicator.id;
  });

  afterAll(async () => {
    await prisma.indicator.delete({ where: { id: indicatorId } }); // cascade limpa favorites
    await prisma.$disconnect();
  });

  it("add é idempotente: favoritar duas vezes não duplica nem lança erro", async () => {
    await favoriteRepository.add(anonymousUserId, indicatorId);
    await favoriteRepository.add(anonymousUserId, indicatorId);

    const favorites = await favoriteRepository.findIndicatorIdsByAnonymousUserId(anonymousUserId);
    expect(favorites).toEqual([indicatorId]);
  });

  it("remove é idempotente: desfavoritar duas vezes não lança erro", async () => {
    await favoriteRepository.remove(anonymousUserId, indicatorId);
    await favoriteRepository.remove(anonymousUserId, indicatorId);

    const favorites = await favoriteRepository.findIndicatorIdsByAnonymousUserId(anonymousUserId);
    expect(favorites).toEqual([]);
  });

  it("findIndicatorIdsByAnonymousUserId retorna vazio para usuário sem favoritos", async () => {
    const favorites = await favoriteRepository.findIndicatorIdsByAnonymousUserId("usuario-sem-favoritos");
    expect(favorites).toEqual([]);
  });
});
