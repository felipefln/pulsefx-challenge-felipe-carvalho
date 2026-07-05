import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "./__fixtures__/bcb-ptax-period.json";
import { fetchPtaxRange } from "./bcbPtaxClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPtaxRange", () => {
  it("mapeia cotacaoVenda como o valor e normaliza a data de referência", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture), { status: 200 })),
    );

    const result = await fetchPtaxRange(new Date("2026-06-29"), new Date("2026-07-03"));

    expect(result).toEqual([
      { refDate: "2026-06-29", value: 5.1717 },
      { refDate: "2026-06-30", value: 5.1766 },
      { refDate: "2026-07-01", value: 5.195 },
      { refDate: "2026-07-02", value: 5.1945 },
      { refDate: "2026-07-03", value: 5.1717 },
    ]);
  });

  it("lança erro quando a resposta da BCB não é ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));

    await expect(fetchPtaxRange(new Date("2026-06-29"), new Date("2026-07-03"))).rejects.toThrow(
      "BCB PTAX respondeu 500",
    );
  });
});
