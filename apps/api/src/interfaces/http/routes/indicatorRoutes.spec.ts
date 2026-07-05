import type { IndicatorSummary } from "@pulsefx/shared";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
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
  variation: { currentValue: 5.1, currentRefDate: "2026-07-03", previousValue: 5.2, previousRefDate: "2026-07-02", changePercent: -1.92 },
  isFavorite: false,
};

function buildApp(execute: ReturnType<typeof vi.fn>) {
  const app = express();
  app.use(anonymousUser);
  app.use("/indicators", createIndicatorRouter({ execute } as unknown as ListIndicatorsUseCase));
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
