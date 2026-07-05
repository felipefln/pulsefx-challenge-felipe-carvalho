import type { IndicatorHistoryResponse } from "@pulsefx/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IndicatorDetailPage } from "./IndicatorDetailPage";

const history: IndicatorHistoryResponse = {
  code: "usd-brl",
  name: "Dólar comercial (USD/BRL)",
  description: "descrição de teste",
  unit: "BRL",
  frequency: "DAILY",
  source: "BCB",
  limitationsNote: "nota de limitações de teste",
  observations: [
    { indicatorId: "ind-1", refDate: "2026-07-02", value: 5.2 },
    { indicatorId: "ind-1", refDate: "2026-07-03", value: 5.1 },
  ],
};

function renderPage(response: unknown, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status })));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/indicators/usd-brl"]}>
        <Routes>
          <Route path="/indicators/:code" element={<IndicatorDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IndicatorDetailPage", () => {
  it("mostra nome, descrição, tabela e nota de limitações após carregar", async () => {
    renderPage(history);

    await waitFor(() => expect(screen.getByRole("heading", { name: history.name })).toBeInTheDocument());
    expect(screen.getByText(history.description)).toBeInTheDocument();
    expect(screen.getByText(history.limitationsNote)).toBeInTheDocument();
    expect(screen.getByText("03/07/2026")).toBeInTheDocument();
  });

  it('mostra mensagem de "sem observações" quando a série está vazia', async () => {
    renderPage({ ...history, observations: [] });

    await waitFor(() => expect(screen.getByRole("heading", { name: history.name })).toBeInTheDocument());
    expect(screen.getByText("Ainda não há observações sincronizadas para este indicador.")).toBeInTheDocument();
  });

  it("mostra erro quando o indicador não é encontrado", async () => {
    renderPage({ status: "error", message: "não encontrado" }, 404);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
