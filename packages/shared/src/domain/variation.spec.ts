import { describe, expect, it } from "vitest";
import type { Observation } from "../types";
import { calculateVariation } from "./variation";

function observation(refDate: string, value: number): Observation {
  return { indicatorId: "ind-1", refDate, value };
}

describe("calculateVariation — série diária (N=1, D-1 dia útil)", () => {
  it("calcula a variação entre o último fechamento e o dia útil anterior", () => {
    const observations: Observation[] = [
      observation("2026-07-01", 5.0),
      observation("2026-07-02", 5.1),
      observation("2026-07-03", 5.2), // sexta
      // 2026-07-04/05 são fim de semana, sem observação persistida
      observation("2026-07-06", 5.15), // segunda seguinte
    ];

    const result = calculateVariation(observations, "DAILY");

    expect(result).not.toBeNull();
    expect(result?.currentRefDate).toBe("2026-07-06");
    expect(result?.previousRefDate).toBe("2026-07-03");
    expect(result?.changePercent).toBeCloseTo(((5.15 - 5.2) / 5.2) * 100, 6);
  });

  it("retorna null quando só existe uma observação (sem anterior para comparar)", () => {
    const observations: Observation[] = [observation("2026-07-06", 5.15)];
    expect(calculateVariation(observations, "DAILY")).toBeNull();
  });
});

describe("calculateVariation — série mensal (N=1, mês contra mês anterior)", () => {
  it("calcula a variação MoM entre o mês atual e o anterior", () => {
    const observations: Observation[] = [
      observation("2026-05-01", 0.4),
      observation("2026-06-01", 0.44),
      observation("2026-07-01", 0.5),
    ];

    const result = calculateVariation(observations, "MONTHLY");

    expect(result?.currentRefDate).toBe("2026-07-01");
    expect(result?.previousRefDate).toBe("2026-06-01");
    expect(result?.changePercent).toBeCloseTo(((0.5 - 0.44) / 0.44) * 100, 6);
  });
});

describe("calculateVariation — casos de borda", () => {
  it("retorna changePercent null quando o valor anterior é zero", () => {
    const observations: Observation[] = [
      observation("2026-06-01", 0),
      observation("2026-07-01", 0.25),
    ];

    const result = calculateVariation(observations, "MONTHLY");

    expect(result).not.toBeNull();
    expect(result?.changePercent).toBeNull();
    expect(result?.currentValue).toBe(0.25);
  });

  it("retorna null quando não há observações", () => {
    expect(calculateVariation([], "DAILY")).toBeNull();
  });
});
