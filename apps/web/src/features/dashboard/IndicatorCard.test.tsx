import type { IndicatorSummary } from "@pulsefx/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IndicatorCard } from "./IndicatorCard";

const base: IndicatorSummary = {
  code: "usd-brl",
  name: "Dólar comercial (USD/BRL)",
  description: "descrição de teste",
  unit: "BRL",
  frequency: "DAILY",
  source: "BCB",
  latestObservation: { indicatorId: "ind-1", refDate: "2026-07-03", value: 5.1717 },
  variation: null,
  isFavorite: false,
};

// FavoriteButton usa react-query e o título usa <Link> — todo render precisa dos dois providers.
function renderCard(indicator: IndicatorSummary): ReturnType<typeof render> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <IndicatorCard indicator={indicator} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IndicatorCard", () => {
  it("formata valor em BRL com 4 casas e a data de referência", () => {
    renderCard(base);

    expect(screen.getByText("R$ 5.1717")).toBeInTheDocument();
    expect(screen.getByText(/03\/07\/2026/)).toBeInTheDocument();
  });

  it("formata valor em % com 2 casas para indicadores de macro", () => {
    const ipca: IndicatorSummary = {
      ...base,
      unit: "%",
      latestObservation: { indicatorId: "ind-2", refDate: "2026-06-01", value: 0.58 },
    };

    renderCard(ipca);

    expect(screen.getByText("0.58%")).toBeInTheDocument();
  });

  it("mostra variação positiva com seta pra cima", () => {
    const withVariation: IndicatorSummary = {
      ...base,
      variation: {
        currentValue: 5.2,
        currentRefDate: "2026-07-03",
        previousValue: 5.1,
        previousRefDate: "2026-07-02",
        changePercent: 1.96,
      },
    };

    renderCard(withVariation);

    expect(screen.getByText("▲ 1.96%")).toBeInTheDocument();
  });

  it("mostra variação negativa com seta pra baixo", () => {
    const withVariation: IndicatorSummary = {
      ...base,
      variation: {
        currentValue: 5.0,
        currentRefDate: "2026-07-03",
        previousValue: 5.1,
        previousRefDate: "2026-07-02",
        changePercent: -1.96,
      },
    };

    renderCard(withVariation);

    expect(screen.getByText("▼ 1.96%")).toBeInTheDocument();
  });

  it('mostra "sem histórico suficiente" quando variation é null', () => {
    renderCard(base);
    expect(screen.getByText("Sem histórico suficiente")).toBeInTheDocument();
  });

  it('mostra "ainda não sincronizado" quando não há latestObservation', () => {
    renderCard({ ...base, latestObservation: null });
    expect(screen.getByText("Ainda não sincronizado")).toBeInTheDocument();
  });

  it("mostra a estrela vazia quando não é favorito e preenchida quando é", () => {
    const { rerender } = renderCard(base);
    expect(screen.getByRole("button", { name: "Adicionar aos meus indicadores" })).toHaveTextContent("☆");

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IndicatorCard indicator={{ ...base, isFavorite: true }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("button", { name: "Remover dos meus indicadores" })).toHaveTextContent("★");
  });

  it("clicar na estrela chama POST /favorites/:code", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    renderCard(base);
    await userEvent.click(screen.getByRole("button", { name: "Adicionar aos meus indicadores" }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/favorites/usd-brl"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
