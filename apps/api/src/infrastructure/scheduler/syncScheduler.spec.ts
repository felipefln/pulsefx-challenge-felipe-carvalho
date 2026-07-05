import type { Indicator } from "@pulsefx/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncIndicatorUseCase } from "../../application/useCases/syncIndicatorUseCase";
import type { IndicatorRepository, UpsertIndicatorInput } from "../../domain/repositories/indicatorRepository";
import { runScheduledSync } from "./syncScheduler";

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

function indicator(overrides: Partial<Indicator>): Indicator {
  return {
    id: overrides.code ?? "id",
    code: "code",
    name: "name",
    description: "description",
    source: "BCB",
    sourceSeriesId: "PTAX",
    frequency: "DAILY",
    unit: null,
    ...overrides,
  };
}

describe("runScheduledSync", () => {
  let execute: ReturnType<typeof vi.fn>;
  let useCase: SyncIndicatorUseCase;

  beforeEach(() => {
    execute = vi.fn();
    useCase = { execute } as unknown as SyncIndicatorUseCase;
  });

  it("sincroniza só os indicadores da frequência pedida", async () => {
    const daily = indicator({ code: "daily-1", frequency: "DAILY" });
    const monthly = indicator({ code: "monthly-1", frequency: "MONTHLY" });
    const repository = new FakeIndicatorRepository([daily, monthly]);
    execute.mockResolvedValue({ indicatorCode: "daily-1", insertedCount: 1, syncState: {} });

    await runScheduledSync(repository, useCase, "DAILY");

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith("daily-1");
  });

  it("uma falha num indicador não impede a sincronização dos demais", async () => {
    const first = indicator({ code: "daily-1", frequency: "DAILY" });
    const second = indicator({ code: "daily-2", frequency: "DAILY" });
    const repository = new FakeIndicatorRepository([first, second]);
    execute.mockRejectedValueOnce(new Error("falha simulada")).mockResolvedValueOnce({
      indicatorCode: "daily-2",
      insertedCount: 1,
      syncState: {},
    });

    await expect(runScheduledSync(repository, useCase, "DAILY")).resolves.toBeUndefined();

    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenNthCalledWith(1, "daily-1");
    expect(execute).toHaveBeenNthCalledWith(2, "daily-2");
  });
});
