import type { IndicatorHistoryResponse } from "@pulsefx/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIndicatorHistory } from "./useIndicatorHistory";

const history: IndicatorHistoryResponse = {
  code: "usd-brl",
  name: "USD/BRL",
  description: "d",
  unit: "BRL",
  frequency: "DAILY",
  source: "BCB",
  limitationsNote: "nota",
  observations: [{ indicatorId: "ind-1", refDate: "2026-07-03", value: 5.1 }],
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIndicatorHistory", () => {
  it("busca GET /indicators/:code/history e retorna a resposta", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(history), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useIndicatorHistory("usd-brl"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(history);
    expect(fetchMock.mock.calls[0][0]).toContain("/indicators/usd-brl/history");
  });
});
