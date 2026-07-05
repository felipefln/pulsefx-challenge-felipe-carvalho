import type { Observation } from "@pulsefx/shared";
import { formatRefDate, formatValue } from "../../lib/format";
import "./HistoryTable.css";

interface HistoryTableProps {
  observations: Observation[];
  unit: string | null;
}

/** Mais recente primeiro — o oposto do gráfico, que é cronológico da esquerda pra direita. */
export function HistoryTable({ observations, unit }: HistoryTableProps) {
  const rows = [...observations].reverse();

  return (
    <table className="history-table">
      <thead>
        <tr>
          <th>Data de referência</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((observation) => (
          <tr key={observation.refDate}>
            <td>{formatRefDate(observation.refDate)}</td>
            <td>{formatValue(observation.value, unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
