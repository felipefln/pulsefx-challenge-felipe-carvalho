import { Router } from "express";
import type { ListIndicatorsUseCase } from "../../../application/useCases/listIndicatorsUseCase";

/**
 * Rotas de indicadores (dashboard e detalhe). Recebe os use cases já
 * montados pelo composition root via parâmetro — não instancia
 * repositório nenhum aqui dentro.
 */
export function createIndicatorRouter(listIndicatorsUseCase: ListIndicatorsUseCase): Router {
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

  return router;
}
