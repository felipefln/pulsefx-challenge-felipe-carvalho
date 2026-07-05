import { normalizeToISODate } from "@pulsefx/shared";
import type { SyncState as PrismaSyncStateRow } from "@prisma/client";
import type {
  SyncStateRecord,
  SyncStateRepository,
  UpsertSyncStateInput,
} from "../../domain/repositories/syncStateRepository";
import { prisma } from "../db/prismaClient";

/** Converte a linha do Prisma para o tipo de domínio. */
function toSyncStateRecord(row: PrismaSyncStateRow): SyncStateRecord {
  return {
    indicatorId: row.indicatorId,
    lastSyncedAt: row.lastSyncedAt,
    lastRefDate: row.lastRefDate ? normalizeToISODate(row.lastRefDate) : null,
    status: row.status,
  };
}

/** Implementação Prisma/Postgres do SyncStateRepository. */
export class PrismaSyncStateRepository implements SyncStateRepository {
  async findByIndicatorId(indicatorId: string): Promise<SyncStateRecord | null> {
    const row = await prisma.syncState.findUnique({ where: { indicatorId } });
    return row ? toSyncStateRecord(row) : null;
  }

  async upsert(indicatorId: string, input: UpsertSyncStateInput): Promise<SyncStateRecord> {
    const data = {
      lastSyncedAt: input.lastSyncedAt,
      lastRefDate: input.lastRefDate ? new Date(input.lastRefDate) : null,
      status: input.status,
    };

    const row = await prisma.syncState.upsert({
      where: { indicatorId },
      create: { indicatorId, ...data },
      update: data,
    });

    return toSyncStateRecord(row);
  }
}
