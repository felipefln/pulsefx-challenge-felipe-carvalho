import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "./__fixtures__/fred-fedfunds.json";
import { fetchFredSeries } from "./fredClient";

beforeEach(() => {
  process.env.FRED_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.FRED_API_KEY;
});

describe("fetchFredSeries", () => {
  it("descarta observações com value '.' (dado ausente) e converte o restante para number", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture), { status: 200 })),
    );

    const result = await fetchFredSeries("FEDFUNDS", new Date("2026-04-01"), new Date("2026-06-30"));

    expect(result).toEqual([
      { refDate: "2026-04-01", value: 5.33 },
      { refDate: "2026-05-01", value: 5.33 },
    ]);
  });

  it("lança erro quando FRED_API_KEY não está configurada", async () => {
    delete process.env.FRED_API_KEY;

    await expect(
      fetchFredSeries("FEDFUNDS", new Date("2026-04-01"), new Date("2026-06-30")),
    ).rejects.toThrow("FRED_API_KEY não configurada");
  });

  it("lança erro quando a resposta do FRED não é ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 400 })));

    await expect(
      fetchFredSeries("FEDFUNDS", new Date("2026-04-01"), new Date("2026-06-30")),
    ).rejects.toThrow("FRED (série FEDFUNDS) respondeu 400");
  });
});
