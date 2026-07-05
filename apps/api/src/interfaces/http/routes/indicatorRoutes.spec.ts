import type { IndicatorHistoryResponse, IndicatorSummary } from "@pulsefx/shared";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { GetIndicatorHistoryUseCase } from "../../../application/useCases/getIndicatorHistoryUseCase";
import type { ListIndicatorsUseCase } from "../../../application/useCases/listIndicatorsUseCase";
import { anonymousUser } from "../middlewares/anonymousUser";
import { createIndicatorRouter } from "./indicatorRoutes";

const summary: IndicatorSummary = {
  code: "usd-brl",
  name: "USD/BRL",
  description: "d",
  unit: "BRL",
  frequency: "DAILY",
  source: "BCB",
  latestObservation: { indicatorId: "ind-1", refDate: "2026-07-03", value: 5.1 },
  variation: {
    currentValue: 5.1,
    currentRefDate: "2026-07-03",
    previousValue: 5.2,
    previousRefDate: "2026-07-02",
    changePercent: -1.92,
  },
  isFavorite: false,
};

const historyResponse: IndicatorHistoryResponse = {
  code: "usd-brl",
  name: "USD/BRL",
  description: "d",
  unit: "BRL",
  frequency: "DAILY",
  source: "BCB",
  limitationsNote: "nota",
  observations: [{ indicatorId: "ind-1", refDate: "2026-07-03", value: 5.1 }],
};

function buildApp(
  listExecute: ReturnType<typeof vi.fn>,
  historyExecute: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue(historyResponse),
) {
  const app = express();
  app.use(anonymousUser);
  app.use(
    "/indicators",
    createIndicatorRouter(
      { execute: listExecute } as unknown as ListIndicatorsUseCase,
      { execute: historyExecute } as unknown as GetIndicatorHistoryUseCase,
    ),
  );
  return app;
}

describe("GET /indicators", () => {
  it("retorna a lista de indicadores e repassa undefined quando não há X-Anonymous-Id", async () => {
    const execute = vi.fn().mockResolvedValue([summary]);

    const response = await request(buildApp(execute)).get("/indicators");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ indicators: [summary] });
    expect(execute).toHaveBeenCalledWith(undefined);
  });

  it("repassa o X-Anonymous-Id pro use case quando presente", async () => {
    const execute = vi.fn().mockResolvedValue([summary]);

    await request(buildApp(execute)).get("/indicators").set("X-Anonymous-Id", "user-123");

    expect(execute).toHaveBeenCalledWith("user-123");
  });
});

describe("GET /indicators/:code/history", () => {
  it("retorna a série + metadados quando o indicador existe", async () => {
    const historyExecute = vi.fn().mockResolvedValue(historyResponse);

    const response = await request(buildApp(vi.fn(), historyExecute)).get("/indicators/usd-brl/history");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(historyResponse);
    expect(historyExecute).toHaveBeenCalledWith("usd-brl", undefined);
  });

  it("repassa window numérico da query pro use case", async () => {
    const historyExecute = vi.fn().mockResolvedValue(historyResponse);

    await request(buildApp(vi.fn(), historyExecute)).get("/indicators/usd-brl/history?window=7");

    expect(historyExecute).toHaveBeenCalledWith("usd-brl", 7);
  });

  it("retorna 400 quando window não é um número positivo", async () => {
    const historyExecute = vi.fn();

    const response = await request(buildApp(vi.fn(), historyExecute)).get(
      "/indicators/usd-brl/history?window=abc",
    );

    expect(response.status).toBe(400);
    expect(historyExecute).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o indicador não existe", async () => {
    const historyExecute = vi.fn().mockResolvedValue(null);

    const response = await request(buildApp(vi.fn(), historyExecute)).get("/indicators/inexistente/history");

    expect(response.status).toBe(404);
  });
});
