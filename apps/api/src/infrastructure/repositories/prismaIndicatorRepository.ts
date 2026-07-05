import type { Indicator } from "@pulsefx/shared";
import type { Indicator as PrismaIndicatorRow } from "@prisma/client";
import type { IndicatorRepository, UpsertIndicatorInput } from "../../domain/repositories/indicatorRepository";
import { prisma } from "../db/prismaClient";

/** Converte a linha do Prisma para o tipo de domínio — mantém @prisma/client fora do resto da aplicação. */
function toIndicator(row: PrismaIndicatorRow): Indicator {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    source: row.source,
    sourceSeriesId: row.sourceSeriesId,
    frequency: row.frequency,
    unit: row.unit,
  };
}

/** Implementação Prisma/Postgres do IndicatorRepository. */
export class PrismaIndicatorRepository implements IndicatorRepository {
  async findAll(): Promise<Indicator[]> {
    const rows = await prisma.indicator.findMany({ orderBy: { code: "asc" } });
    return rows.map(toIndicator);
  }

  async findByCode(code: string): Promise<Indicator | null> {
    const row = await prisma.indicator.findUnique({ where: { code } });
    return row ? toIndicator(row) : null;
  }

  async upsertByCode(input: UpsertIndicatorInput): Promise<Indicator> {
    const row = await prisma.indicator.upsert({
      where: { code: input.code },
      create: input,
      update: input,
    });
    return toIndicator(row);
  }
}
