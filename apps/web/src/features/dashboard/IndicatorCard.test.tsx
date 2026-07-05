import type { IndicatorSummary } from "@pulsefx/shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

describe("IndicatorCard", () => {
  it("formata valor em BRL com 4 casas e a data de referência", () => {
    render(<IndicatorCard indicator={base} />);

    expect(screen.getByText("R$ 5.1717")).toBeInTheDocument();
    expect(screen.getByText(/03\/07\/2026/)).toBeInTheDocument();
  });

  it("formata valor em % com 2 casas para indicadores de macro", () => {
    const ipca: IndicatorSummary = {
      ...base,
      unit: "%",
      latestObservation: { indicatorId: "ind-2", refDate: "2026-06-01", value: 0.58 },
    };

    render(<IndicatorCard indicator={ipca} />);

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

    render(<IndicatorCard indicator={withVariation} />);

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

    render(<IndicatorCard indicator={withVariation} />);

    expect(screen.getByText("▼ 1.96%")).toBeInTheDocument();
  });

  it('mostra "sem histórico suficiente" quando variation é null', () => {
    render(<IndicatorCard indicator={base} />);
    expect(screen.getByText("Sem histórico suficiente")).toBeInTheDocument();
  });

  it('mostra "ainda não sincronizado" quando não há latestObservation', () => {
    render(<IndicatorCard indicator={{ ...base, latestObservation: null }} />);
    expect(screen.getByText("Ainda não sincronizado")).toBeInTheDocument();
  });
});
