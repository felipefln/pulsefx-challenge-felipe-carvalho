import type { IndicatorFrequency } from "@pulsefx/shared";
import type { IndicatorRepository } from "../../domain/repositories/indicatorRepository";
import type { ObservationRepository } from "../../domain/repositories/observationRepository";
import type { SyncStateRecord, SyncStateRepository } from "../../domain/repositories/syncStateRepository";
import type { ExternalSeriesProvider } from "../../domain/services/externalSeriesProvider";

/** Janela de busca inicial (sem sincronização prévia), em dias corridos, por tipo de série. */
const INITIAL_LOOKBACK_DAYS: Record<IndicatorFrequency, number> = {
  DAILY: 30,
  MONTHLY: 730, // ~24 meses, o suficiente pra qualquer janela de histórico que o detalhe venha a oferecer
};

export interface SyncIndicatorResult {
  indicatorCode: string;
  insertedCount: number;
  syncState: SyncStateRecord;
}

/**
 * Orquestra a sincronização de um indicador: resolve de onde buscar
 * (ExternalSeriesProvider), persiste o que vier (ObservationRepository) e
 * registra o resultado (SyncStateRepository) — nunca chama BCB/FRED nem o
 * Prisma diretamente, só depende das portas injetadas no construtor.
 */
export class SyncIndicatorUseCase {
  constructor(
    private readonly indicatorRepository: IndicatorRepository,
    private readonly observationRepository: ObservationRepository,
    private readonly syncStateRepository: SyncStateRepository,
    private readonly externalSeriesProvider: ExternalSeriesProvider,
  ) {}

  async execute(indicatorCode: string, now: Date = new Date()): Promise<SyncIndicatorResult> {
    const indicator = await this.indicatorRepository.findByCode(indicatorCode);
    if (!indicator) {
      throw new Error(`Indicador não encontrado: ${indicatorCode}`);
    }

    const previousState = await this.syncStateRepository.findByIndicatorId(indicator.id);
    const startDate = this.resolveStartDate(indicator.frequency, previousState, now);

    try {
      const observations = await this.externalSeriesProvider.fetch(indicator, startDate, now);
      const insertedCount = await this.observationRepository.saveMany(indicator.id, observations);

      const latestRefDate = observations.at(-1)?.refDate ?? previousState?.lastRefDate ?? null;
      const syncState = await this.syncStateRepository.upsert(indicator.id, {
        lastSyncedAt: now,
        lastRefDate: latestRefDate,
        status: "ok",
      });

      return { indicatorCode, insertedCount, syncState };
    } catch (error) {
      // Preserva o lastRefDate anterior — uma falha na busca não apaga o
      // progresso já persistido, só registra que essa tentativa deu errado.
      await this.syncStateRepository.upsert(indicator.id, {
        lastSyncedAt: now,
        lastRefDate: previousState?.lastRefDate ?? null,
        status: "error",
      });
      throw error;
    }
  }

  /**
   * Sem sincronização prévia, usa uma janela inicial de backfill por tipo de
   * série. Com sincronização prévia, retoma a partir do último refDate
   * conhecido (inclusive) — reprocessar esse dia é seguro porque saveMany
   * ignora duplicatas, e evita ter que somar/subtrair dias/meses à mão.
   */
  private resolveStartDate(
    frequency: IndicatorFrequency,
    previousState: SyncStateRecord | null,
    now: Date,
  ): Date {
    if (previousState?.lastRefDate) {
      return new Date(previousState.lastRefDate);
    }
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - INITIAL_LOOKBACK_DAYS[frequency]);
    return start;
  }
}
