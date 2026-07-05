import type { Indicator, Observation } from "@pulsefx/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { IndicatorRepository, UpsertIndicatorInput } from "../../domain/repositories/indicatorRepository";
import type {
  FindObservationsOptions,
  ObservationInput,
  ObservationRepository,
} from "../../domain/repositories/observationRepository";
import { GetIndicatorHistoryUseCase } from "./getIndicatorHistoryUseCase";

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
  requestedLimits: Array<number | undefined> = [];
  constructor(private readonly observations: Observation[]) {}
  async findByIndicatorId(_indicatorId: string, options?: FindObservationsOptions): Promise<Observation[]> {
    this.requestedLimits.push(options?.limit);
    return options?.limit ? this.observations.slice(-options.limit) : this.observations;
  }
  async saveMany(_indicatorId: string, observations: ObservationInput[]): Promise<number> {
    return observations.length;
  }
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

describe("GetIndicatorHistoryUseCase", () => {
  let observationRepository: FakeObservationRepository;
  let useCase: GetIndicatorHistoryUseCase;

  beforeEach(() => {
    observationRepository = new FakeObservationRepository([
      { indicatorId: usdBrl.id, refDate: "2026-07-01", value: 5.1 },
      { indicatorId: usdBrl.id, refDate: "2026-07-02", value: 5.2 },
      { indicatorId: usdBrl.id, refDate: "2026-07-03", value: 5.15 },
    ]);
    useCase = new GetIndicatorHistoryUseCase(new FakeIndicatorRepository([usdBrl]), observationRepository);
  });

  it("retorna null quando o código não existe", async () => {
    const result = await useCase.execute("codigo-inexistente");
    expect(result).toBeNull();
  });

  it("sem window, usa o default de 30 (DAILY) e traz os metadados + limitationsNote", async () => {
    const result = await useCase.execute("usd-brl");

    expect(result?.name).toBe("USD/BRL");
    expect(result?.limitationsNote).toMatch(/fins de semana|finais de semana/i);
    expect(result?.observations).toHaveLength(3);
    expect(observationRepository.requestedLimits).toEqual([30]);
  });

  it("com window explícito, usa o valor pedido", async () => {
    await useCase.execute("usd-brl", 7);
    expect(observationRepository.requestedLimits).toEqual([7]);
  });

  it("com window acima do teto (180 para DAILY), aplica o teto", async () => {
    await useCase.execute("usd-brl", 999);
    expect(observationRepository.requestedLimits).toEqual([180]);
  });
});
