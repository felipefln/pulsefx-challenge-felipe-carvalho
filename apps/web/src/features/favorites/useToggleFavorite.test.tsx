import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useToggleFavorite } from "./useToggleFavorite";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useToggleFavorite", () => {
  it("chama POST quando o indicador ainda não é favorito", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });
    result.current.mutate({ code: "usd-brl", isFavorite: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [, requestInit] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toContain("/favorites/usd-brl");
    expect(requestInit.method).toBe("POST");
  });

  it("chama DELETE quando o indicador já é favorito", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });
    result.current.mutate({ code: "usd-brl", isFavorite: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit.method).toBe("DELETE");
  });
});
