import type { Indicator, Observation } from "@pulsefx/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { IndicatorRepository, UpsertIndicatorInput } from "../../domain/repositories/indicatorRepository";
import type { ObservationInput, ObservationRepository } from "../../domain/repositories/observationRepository";
import type {
  SyncStateRecord,
  SyncStateRepository,
  UpsertSyncStateInput,
} from "../../domain/repositories/syncStateRepository";
import type { ExternalObservation, ExternalSeriesProvider } from "../../domain/services/externalSeriesProvider";
import { SyncIndicatorUseCase } from "./syncIndicatorUseCase";

/** Fakes em memória das 4 portas — testam a orquestração sem tocar Postgres nem rede. */

class FakeIndicatorRepository implements IndicatorRepository {
  private readonly byCode = new Map<string, Indicator>();

  seed(indicator: Indicator): void {
    this.byCode.set(indicator.code, indicator);
  }

  async findAll(): Promise<Indicator[]> {
    return [...this.byCode.values()];
  }

  async findByCode(code: string): Promise<Indicator | null> {
    return this.byCode.get(code) ?? null;
  }

  async upsertByCode(input: UpsertIndicatorInput): Promise<Indicator> {
    const indicator: Indicator = { id: input.code, ...input };
    this.byCode.set(input.code, indicator);
    return indicator;
  }
}

class FakeObservationRepository implements ObservationRepository {
  readonly saved: Array<{ indicatorId: string; observations: ObservationInput[] }> = [];
  private readonly byIndicatorId = new Map<string, Observation[]>();

  async findByIndicatorId(indicatorId: string): Promise<Observation[]> {
    return this.byIndicatorId.get(indicatorId) ?? [];
  }

  async saveMany(indicatorId: string, observations: ObservationInput[]): Promise<number> {
    this.saved.push({ indicatorId, observations });
    const existing = this.byIndicatorId.get(indicatorId) ?? [];
    const existingDates = new Set(existing.map((o) => o.refDate));
    const toInsert = observations.filter((o) => !existingDates.has(o.refDate));
    this.byIndicatorId.set(indicatorId, [...existing, ...toInsert.map((o) => ({ indicatorId, ...o }))]);
    return toInsert.length;
  }
}

class FakeSyncStateRepository implements SyncStateRepository {
  private readonly byIndicatorId = new Map<string, SyncStateRecord>();

  async findByIndicatorId(indicatorId: string): Promise<SyncStateRecord | null> {
    return this.byIndicatorId.get(indicatorId) ?? null;
  }

  async upsert(indicatorId: string, input: UpsertSyncStateInput): Promise<SyncStateRecord> {
    const record: SyncStateRecord = { indicatorId, ...input };
    this.byIndicatorId.set(indicatorId, record);
    return record;
  }
}

class FakeExternalSeriesProvider implements ExternalSeriesProvider {
  calls: Array<{ indicator: Indicator; startDate: Date; endDate: Date }> = [];
  response: ExternalObservation[] = [];
  shouldFail = false;

  async fetch(indicator: Indicator, startDate: Date, endDate: Date): Promise<ExternalObservation[]> {
    this.calls.push({ indicator, startDate, endDate });
    if (this.shouldFail) {
      throw new Error("falha simulada na fonte externa");
    }
    return this.response;
  }
}

const testIndicator: Indicator = {
  id: "ind-1",
  code: "usd-brl",
  name: "USD/BRL",
  description: "Teste",
  source: "BCB",
  sourceSeriesId: "PTAX",
  frequency: "DAILY",
  unit: "BRL",
};

describe("SyncIndicatorUseCase", () => {
  let indicatorRepository: FakeIndicatorRepository;
  let observationRepository: FakeObservationRepository;
  let syncStateRepository: FakeSyncStateRepository;
  let externalSeriesProvider: FakeExternalSeriesProvider;
  let useCase: SyncIndicatorUseCase;

  beforeEach(() => {
    indicatorRepository = new FakeIndicatorRepository();
    indicatorRepository.seed(testIndicator);
    observationRepository = new FakeObservationRepository();
    syncStateRepository = new FakeSyncStateRepository();
    externalSeriesProvider = new FakeExternalSeriesProvider();
    useCase = new SyncIndicatorUseCase(
      indicatorRepository,
      observationRepository,
      syncStateRepository,
      externalSeriesProvider,
    );
  });

  it("lança erro quando o indicador não existe", async () => {
    await expect(useCase.execute("codigo-inexistente")).rejects.toThrow("Indicador não encontrado");
  });

  it("sem sincronização prévia, busca uma janela de backfill inicial e persiste o resultado", async () => {
    externalSeriesProvider.response = [
      { refDate: "2026-06-01", value: 5.1 },
      { refDate: "2026-06-02", value: 5.2 },
    ];
    const now = new Date("2026-07-05T12:00:00.000Z");

    const result = await useCase.execute("usd-brl", now);

    expect(result.insertedCount).toBe(2);
    expect(result.syncState.status).toBe("ok");
    expect(result.syncState.lastRefDate).toBe("2026-06-02");

    const [call] = externalSeriesProvider.calls;
    expect(call.endDate).toEqual(now);
    expect(call.startDate.toISOString().slice(0, 10)).toBe("2026-06-05"); // now - 30 dias (DAILY)
  });

  it("com sincronização prévia, retoma a busca a partir do último refDate conhecido", async () => {
    await syncStateRepository.upsert(testIndicator.id, {
      lastSyncedAt: new Date("2026-07-01T12:00:00.000Z"),
      lastRefDate: "2026-06-30",
      status: "ok",
    });
    externalSeriesProvider.response = [{ refDate: "2026-07-01", value: 5.3 }];

    await useCase.execute("usd-brl", new Date("2026-07-05T12:00:00.000Z"));

    const [call] = externalSeriesProvider.calls;
    expect(call.startDate.toISOString().slice(0, 10)).toBe("2026-06-30");
  });

  it("em caso de falha na fonte externa, marca status=error e preserva o lastRefDate anterior", async () => {
    await syncStateRepository.upsert(testIndicator.id, {
      lastSyncedAt: new Date("2026-07-01T12:00:00.000Z"),
      lastRefDate: "2026-06-30",
      status: "ok",
    });
    externalSeriesProvider.shouldFail = true;

    await expect(useCase.execute("usd-brl")).rejects.toThrow("falha simulada");

    const state = await syncStateRepository.findByIndicatorId(testIndicator.id);
    expect(state?.status).toBe("error");
    expect(state?.lastRefDate).toBe("2026-06-30"); // não foi apagado pela falha
  });

  it("quando a fonte não retorna observações novas, mantém o lastRefDate anterior em vez de null", async () => {
    await syncStateRepository.upsert(testIndicator.id, {
      lastSyncedAt: new Date("2026-07-01T12:00:00.000Z"),
      lastRefDate: "2026-06-30",
      status: "ok",
    });
    externalSeriesProvider.response = [];

    const result = await useCase.execute("usd-brl");

    expect(result.insertedCount).toBe(0);
    expect(result.syncState.lastRefDate).toBe("2026-06-30");
  });
});
