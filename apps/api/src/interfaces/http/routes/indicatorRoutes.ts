import { Router } from "express";
import type { GetIndicatorHistoryUseCase } from "../../../application/useCases/getIndicatorHistoryUseCase";
import type { ListIndicatorsUseCase } from "../../../application/useCases/listIndicatorsUseCase";

/**
 * Rotas de indicadores (dashboard e detalhe). Recebe os use cases já
 * montados pelo composition root via parâmetro — não instancia
 * repositório nenhum aqui dentro.
 */
export function createIndicatorRouter(
  listIndicatorsUseCase: ListIndicatorsUseCase,
  getIndicatorHistoryUseCase: GetIndicatorHistoryUseCase,
): Router {
  const router = Router();

  /**
   * @openapi
   * /indicators:
   *   get:
   *     summary: Lista os indicadores com último valor, data de referência e variação
   *     tags: [Indicators]
   *     parameters:
   *       - in: header
   *         name: X-Anonymous-Id
   *         schema: { type: string }
   *         description: UUID anônimo do usuário (opcional); quando presente, preenche isFavorite.
   *     responses:
   *       200:
   *         description: Lista de indicadores (cards do dashboard)
   */
  router.get("/", async (req, res) => {
    const indicators = await listIndicatorsUseCase.execute(req.anonymousUserId);
    res.json({ indicators });
  });

  /**
   * @openapi
   * /indicators/{code}/history:
   *   get:
   *     summary: Série temporal de um indicador, com janela por tipo de série
   *     tags: [Indicators]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: window
   *         schema: { type: integer }
   *         description: >
   *           Quantidade de observações mais recentes a retornar (dias úteis
   *           para séries diárias, meses para mensais). Default e teto variam
   *           por tipo de série; valores acima do teto são reduzidos ao teto.
   *     responses:
   *       200:
   *         description: Série temporal + metadados (incluindo texto de limitações dos dados)
   *       400:
   *         description: window inválido (não numérico ou não positivo)
   *       404:
   *         description: Indicador não encontrado
   */
  router.get("/:code/history", async (req, res) => {
    const rawWindow = req.query.window;
    let requestedWindow: number | undefined;
    if (rawWindow !== undefined) {
      requestedWindow = Number(rawWindow);
      if (!Number.isFinite(requestedWindow) || requestedWindow <= 0) {
        res.status(400).json({ status: "error", message: "window precisa ser um número positivo" });
        return;
      }
    }

    const history = await getIndicatorHistoryUseCase.execute(req.params.code, requestedWindow);
    if (!history) {
      res.status(404).json({ status: "error", message: `Indicador não encontrado: ${req.params.code}` });
      return;
    }

    res.json(history);
  });

  return router;
}
