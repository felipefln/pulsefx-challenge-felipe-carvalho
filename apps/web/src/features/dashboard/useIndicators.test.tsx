import type { IndicatorSummary } from "@pulsefx/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIndicators } from "./useIndicators";

const indicator: IndicatorSummary = {
  code: "usd-brl",
  name: "USD/BRL",
  description: "d",
  unit: "BRL",
  frequency: "DAILY",
  source: "BCB",
  latestObservation: { indicatorId: "ind-1", refDate: "2026-07-03", value: 5.1 },
  variation: null,
  isFavorite: false,
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIndicators", () => {
  it("busca GET /indicators e retorna a lista", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ indicators: [indicator] }), { status: 200 })),
    );

    const { result } = renderHook(() => useIndicators(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([indicator]);
  });

  it("expõe erro quando a API responde com falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));

    const { result } = renderHook(() => useIndicators(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
