import { describe, expect, it } from "vitest";
import { isBusinessDay, isWeekend, normalizeToISODate } from "./business-days";

describe("normalizeToISODate", () => {
  it("formata uma Date em UTC como YYYY-MM-DD", () => {
    const date = new Date(Date.UTC(2026, 6, 4)); // 2026-07-04
    expect(normalizeToISODate(date)).toBe("2026-07-04");
  });

  it("aceita uma string ISO e preserva o mesmo dia", () => {
    expect(normalizeToISODate("2026-01-05T00:00:00.000Z")).toBe("2026-01-05");
  });

  it("preenche mês e dia com zero à esquerda", () => {
    const date = new Date(Date.UTC(2026, 0, 9)); // 2026-01-09
    expect(normalizeToISODate(date)).toBe("2026-01-09");
  });
});

describe("isWeekend / isBusinessDay", () => {
  it("identifica sábado e domingo como fim de semana", () => {
    const saturday = new Date(Date.UTC(2026, 6, 4)); // sábado
    const sunday = new Date(Date.UTC(2026, 6, 5)); // domingo
    expect(isWeekend(saturday)).toBe(true);
    expect(isWeekend(sunday)).toBe(true);
  });

  it("identifica dias de segunda a sexta como dia útil", () => {
    const monday = new Date(Date.UTC(2026, 6, 6));
    expect(isWeekend(monday)).toBe(false);
    expect(isBusinessDay(monday)).toBe(true);
  });

  it("isBusinessDay é o inverso de isWeekend", () => {
    const saturday = "2026-07-04";
    expect(isBusinessDay(saturday)).toBe(false);
  });
});
