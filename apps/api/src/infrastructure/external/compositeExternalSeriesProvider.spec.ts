import type { Indicator } from "@pulsefx/shared";
import { describe, expect, it, vi } from "vitest";
import { fetchPtaxRange } from "./bcbPtaxClient";
import { fetchSgsSeries } from "./bcbSgsClient";
import { BCB_PTAX_SENTINEL, CompositeExternalSeriesProvider } from "./compositeExternalSeriesProvider";
import { fetchFredSeries } from "./fredClient";

vi.mock("./bcbPtaxClient", () => ({ fetchPtaxRange: vi.fn().mockResolvedValue([{ refDate: "2026-07-01", value: 5.1 }]) }));
vi.mock("./bcbSgsClient", () => ({ fetchSgsSeries: vi.fn().mockResolvedValue([{ refDate: "2026-06-01", value: 0.5 }]) }));
vi.mock("./fredClient", () => ({ fetchFredSeries: vi.fn().mockResolvedValue([{ refDate: "2026-06-01", value: 5.33 }]) }));

function indicator(overrides: Partial<Indicator>): Indicator {
  return {
    id: "ind-1",
    code: "test",
    name: "Teste",
    description: "Teste",
    source: "BCB",
    sourceSeriesId: BCB_PTAX_SENTINEL,
    frequency: "DAILY",
    unit: null,
    ...overrides,
  };
}

const startDate = new Date("2026-06-01");
const endDate = new Date("2026-07-01");

describe("CompositeExternalSeriesProvider", () => {
  it("roteia para fetchPtaxRange quando source=BCB e sourceSeriesId é o sentinela PTAX", async () => {
    const provider = new CompositeExternalSeriesProvider();
    const result = await provider.fetch(indicator({ source: "BCB", sourceSeriesId: BCB_PTAX_SENTINEL }), startDate, endDate);

    expect(fetchPtaxRange).toHaveBeenCalledWith(startDate, endDate);
    expect(result).toEqual([{ refDate: "2026-07-01", value: 5.1 }]);
  });

  it("roteia para fetchSgsSeries quando source=BCB e sourceSeriesId é um código numérico", async () => {
    const provider = new CompositeExternalSeriesProvider();
    const result = await provider.fetch(
      indicator({ source: "BCB", sourceSeriesId: "433", frequency: "MONTHLY" }),
      startDate,
      endDate,
    );

    expect(fetchSgsSeries).toHaveBeenCalledWith(433, startDate, endDate);
    expect(result).toEqual([{ refDate: "2026-06-01", value: 0.5 }]);
  });

  it("roteia para fetchFredSeries quando source=FRED", async () => {
    const provider = new CompositeExternalSeriesProvider();
    const result = await provider.fetch(
      indicator({ source: "FRED", sourceSeriesId: "FEDFUNDS", frequency: "MONTHLY" }),
      startDate,
      endDate,
    );

    expect(fetchFredSeries).toHaveBeenCalledWith("FEDFUNDS", startDate, endDate);
    expect(result).toEqual([{ refDate: "2026-06-01", value: 5.33 }]);
  });

  it("lança erro quando sourceSeriesId de um indicador BCB não é o sentinela nem um número", async () => {
    const provider = new CompositeExternalSeriesProvider();
    await expect(
      provider.fetch(indicator({ source: "BCB", sourceSeriesId: "não-é-nem-ptax-nem-numero" }), startDate, endDate),
    ).rejects.toThrow("sourceSeriesId inválido");
  });
});
