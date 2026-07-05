import { normalizeToISODate, type Observation } from "@pulsefx/shared";
import type { Observation as PrismaObservationRow } from "@prisma/client";
import type {
  FindObservationsOptions,
  ObservationInput,
  ObservationRepository,
} from "../../domain/repositories/observationRepository";
import { prisma } from "../db/prismaClient";

/** Converte a linha do Prisma (Decimal, DateTime) para o tipo de domínio (number, string ISO). */
function toObservation(row: PrismaObservationRow): Observation {
  return {
    indicatorId: row.indicatorId,
    refDate: normalizeToISODate(row.refDate),
    value: row.value.toNumber(),
  };
}

/** Implementação Prisma/Postgres do ObservationRepository. */
export class PrismaObservationRepository implements ObservationRepository {
  async findByIndicatorId(indicatorId: string, options?: FindObservationsOptions): Promise<Observation[]> {
    const rows = await prisma.observation.findMany({
      where: { indicatorId },
      orderBy: { refDate: "desc" },
      take: options?.limit,
    });
    // Busca desc pra pegar as N mais recentes quando há `limit`, depois
    // inverte pra crescente — a ordem que calculateVariation espera.
    return rows.map(toObservation).reverse();
  }

  async saveMany(indicatorId: string, observations: ObservationInput[]): Promise<number> {
    if (observations.length === 0) {
      return 0;
    }

    // skipDuplicates delega a idempotência à constraint única do banco
    // (indicatorId + refDate) em vez de fazer um SELECT prévio na aplicação
    // — mais simples e sem condição de corrida entre checar e inserir.
    const result = await prisma.observation.createMany({
      data: observations.map((observation) => ({
        indicatorId,
        refDate: new Date(observation.refDate),
        value: observation.value,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }
}
