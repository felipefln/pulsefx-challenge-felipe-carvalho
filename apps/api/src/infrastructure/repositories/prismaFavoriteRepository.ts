import type { FavoriteRepository } from "../../domain/repositories/favoriteRepository";
import { prisma } from "../db/prismaClient";

/** Implementação Prisma/Postgres do FavoriteRepository. */
export class PrismaFavoriteRepository implements FavoriteRepository {
  async findIndicatorIdsByAnonymousUserId(anonymousUserId: string): Promise<string[]> {
    const rows = await prisma.favorite.findMany({
      where: { anonymousUserId },
      select: { indicatorId: true },
    });
    return rows.map((row) => row.indicatorId);
  }

  async add(anonymousUserId: string, indicatorId: string): Promise<void> {
    // upsert em vez de create: favoritar duas vezes o mesmo indicador não é
    // erro (constraint única violada) nem duplica linha — é um no-op.
    await prisma.favorite.upsert({
      where: { anonymousUserId_indicatorId: { anonymousUserId, indicatorId } },
      create: { anonymousUserId, indicatorId },
      update: {},
    });
  }

  async remove(anonymousUserId: string, indicatorId: string): Promise<void> {
    // deleteMany em vez de delete: desfavoritar algo que não estava
    // favoritado não é erro, só deleta zero linhas.
    await prisma.favorite.deleteMany({ where: { anonymousUserId, indicatorId } });
  }
}
