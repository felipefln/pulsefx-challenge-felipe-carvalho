import type { Indicator, Observation } from "@pulsefx/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { FavoriteRepository } from "../../domain/repositories/favoriteRepository";
import type { IndicatorRepository, UpsertIndicatorInput } from "../../domain/repositories/indicatorRepository";
import type { FindObservationsOptions, ObservationInput, ObservationRepository } from "../../domain/repositories/observationRepository";
import { ListIndicatorsUseCase } from "./listIndicatorsUseCase";

class FakeIndicatorRepository implements IndicatorRepository {
  constructor(private readonly indicators: Indicator[]) {}
  async findAll(): Promise<Indicator[]> {
    return this.indicators;
  }
  async findByCode(code: string): Promise<Indicator | null> {
    return this.indicators.find((i) => i.code === code) ?? null;
  }
  async upsertByCode(input: UpsertIndicatorInput): Promise<Indicator> {
    return { id: input.code, ...input };
  }
}

class FakeObservationRepository implements ObservationRepository {
  constructor(private readonly byIndicatorId: Map<string, Observation[]>) {}
  async findByIndicatorId(indicatorId: string, options?: FindObservationsOptions): Promise<Observation[]> {
    const all = this.byIndicatorId.get(indicatorId) ?? [];
    return options?.limit ? all.slice(-options.limit) : all;
  }
  async saveMany(_indicatorId: string, observations: ObservationInput[]): Promise<number> {
    return observations.length;
  }
}

class FakeFavoriteRepository implements FavoriteRepository {
  constructor(private readonly favorites: Map<string, string[]>) {}
  async findIndicatorIdsByAnonymousUserId(anonymousUserId: string): Promise<string[]> {
    return this.favorites.get(anonymousUserId) ?? [];
  }
  async add(): Promise<void> {}
  async remove(): Promise<void> {}
}

const usdBrl: Indicator = {
  id: "ind-usd-brl",
  code: "usd-brl",
  name: "USD/BRL",
  description: "d",
  source: "BCB",
  sourceSeriesId: "PTAX",
  frequency: "DAILY",
  unit: "BRL",
};

const ipca: Indicator = {
  id: "ind-ipca",
  code: "ipca",
  name: "IPCA",
  description: "d",
  source: "BCB",
  sourceSeriesId: "433",
  frequency: "MONTHLY",
  unit: "%",
};

describe("ListIndicatorsUseCase", () => {
  let observationsByIndicator: Map<string, Observation[]>;
  let favoritesByUser: Map<string, string[]>;
  let useCase: ListIndicatorsUseCase;

  beforeEach(() => {
    observationsByIndicator = new Map([
      [
        usdBrl.id,
        [
          { indicatorId: usdBrl.id, refDate: "2026-07-02", value: 5.2 },
          { indicatorId: usdBrl.id, refDate: "2026-07-03", value: 5.1 },
        ],
      ],
      [ipca.id, [{ indicatorId: ipca.id, refDate: "2026-06-01", value: 0.5 }]], // só 1 observação
    ]);
    favoritesByUser = new Map([["user-1", [usdBrl.id]]]);

    useCase = new ListIndicatorsUseCase(
      new FakeIndicatorRepository([usdBrl, ipca]),
      new FakeObservationRepository(observationsByIndicator),
      new FakeFavoriteRepository(favoritesByUser),
    );
  });

  it("monta o resumo com último valor e variação calculada", async () => {
    const [summary] = await useCase.execute();

    expect(summary.code).toBe("usd-brl");
    expect(summary.latestObservation).toEqual({ indicatorId: usdBrl.id, refDate: "2026-07-03", value: 5.1 });
    expect(summary.variation?.changePercent).toBeCloseTo(((5.1 - 5.2) / 5.2) * 100, 6);
  });

  it("retorna variation null quando não há histórico suficiente", async () => {
    const [, ipcaSummary] = await useCase.execute();
    expect(ipcaSummary.latestObservation).toEqual({ indicatorId: ipca.id, refDate: "2026-06-01", value: 0.5 });
    expect(ipcaSummary.variation).toBeNull();
  });

  it("sem anonymousUserId, isFavorite vem false para todos", async () => {
    const summaries = await useCase.execute();
    expect(summaries.every((s) => s.isFavorite === false)).toBe(true);
  });

  it("com anonymousUserId, isFavorite reflete os favoritos daquele usuário", async () => {
    const summaries = await useCase.execute("user-1");
    expect(summaries.find((s) => s.code === "usd-brl")?.isFavorite).toBe(true);
    expect(summaries.find((s) => s.code === "ipca")?.isFavorite).toBe(false);
  });
});
