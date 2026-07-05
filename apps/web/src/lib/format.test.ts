import { describe, expect, it } from "vitest";
import { formatRefDate, formatValue } from "./format";

describe("formatValue", () => {
  it("formata BRL com 4 casas decimais", () => {
    expect(formatValue(5.1717, "BRL")).toBe("R$ 5.1717");
  });

  it("formata % com 2 casas decimais", () => {
    expect(formatValue(0.58, "%")).toBe("0.58%");
  });

  it("sem unidade conhecida, retorna o número como string", () => {
    expect(formatValue(42, null)).toBe("42");
  });
});

describe("formatRefDate", () => {
  it("formata YYYY-MM-DD como DD/MM/YYYY em pt-BR, sem virar o dia anterior", () => {
    expect(formatRefDate("2026-07-03")).toBe("03/07/2026");
    expect(formatRefDate("2026-01-01")).toBe("01/01/2026");
  });
});
