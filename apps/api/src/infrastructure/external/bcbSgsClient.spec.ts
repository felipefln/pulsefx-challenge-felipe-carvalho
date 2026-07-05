import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "./__fixtures__/bcb-sgs-433.json";
import { fetchSgsSeries } from "./bcbSgsClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchSgsSeries", () => {
  it("converte data BR (DD/MM/YYYY) para ISO e valor string para number", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture), { status: 200 })),
    );

    const result = await fetchSgsSeries(433, new Date("2026-03-01"), new Date("2026-05-31"));

    expect(result).toEqual([
      { refDate: "2026-03-01", value: 0.88 },
      { refDate: "2026-04-01", value: 0.67 },
      { refDate: "2026-05-01", value: 0.58 },
    ]);
  });

  it("lança erro quando a resposta do SGS não é ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));

    await expect(
      fetchSgsSeries(433, new Date("2026-03-01"), new Date("2026-05-31")),
    ).rejects.toThrow("BCB SGS (série 433) respondeu 500");
  });
});
