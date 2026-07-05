import type { Observation } from "@pulsefx/shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoryTable } from "./HistoryTable";

const observations: Observation[] = [
  { indicatorId: "ind-1", refDate: "2026-07-01", value: 5.1 },
  { indicatorId: "ind-1", refDate: "2026-07-02", value: 5.2 },
  { indicatorId: "ind-1", refDate: "2026-07-03", value: 5.15 },
];

describe("HistoryTable", () => {
  it("lista as observações da mais recente pra mais antiga", () => {
    render(<HistoryTable observations={observations} unit="BRL" />);

    const rows = screen.getAllByRole("row").slice(1); // pula o cabeçalho
    expect(rows[0]).toHaveTextContent("03/07/2026");
    expect(rows[0]).toHaveTextContent("R$ 5.1500");
    expect(rows[2]).toHaveTextContent("01/07/2026");
  });

  it("formata o valor conforme a unidade recebida", () => {
    render(<HistoryTable observations={[observations[0]]} unit="%" />);
    expect(screen.getByText("5.10%")).toBeInTheDocument();
  });
});
