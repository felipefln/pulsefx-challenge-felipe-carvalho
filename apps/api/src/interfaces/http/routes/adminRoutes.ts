import { Router } from "express";
import type { SyncIndicatorUseCase } from "../../../application/useCases/syncIndicatorUseCase";
import type { IndicatorRepository } from "../../../domain/repositories/indicatorRepository";
import { requireAdminToken } from "../middlewares/adminAuth";

interface SyncOutcome {
  indicatorCode: string;
  insertedCount?: number;
  error?: string;
}

/**
 * Rotas administrativas — hoje só a sincronização manual. Recebe as
 * dependências já montadas pelo composition root via parâmetro (injeção),
 * em vez de importar infraestrutura concreta aqui dentro.
 */
export function createAdminRouter(
  indicatorRepository: IndicatorRepository,
  syncIndicatorUseCase: SyncIndicatorUseCase,
): Router {
  const router = Router();

  /**
   * @openapi
   * /admin/sync:
   *   post:
   *     summary: Dispara sincronização manual de um indicador ou de todos
   *     tags: [Admin]
   *     security: [{ adminToken: [] }]
   *     parameters:
   *       - in: query
   *         name: code
   *         schema: { type: string }
   *         description: Código do indicador a sincronizar; se omitido, sincroniza todos os indicadores cadastrados.
   *     responses:
   *       200:
   *         description: Resultado por indicador (sucesso ou erro individual — uma falha não derruba a resposta inteira)
   *       401:
   *         description: Token ausente ou inválido
   */
  router.post("/sync", requireAdminToken, async (req, res) => {
    const requestedCode = typeof req.query.code === "string" ? req.query.code : undefined;
    const codes = requestedCode
      ? [requestedCode]
      : (await indicatorRepository.findAll()).map((indicator) => indicator.code);

    const results: SyncOutcome[] = [];
    for (const code of codes) {
      try {
        const result = await syncIndicatorUseCase.execute(code);
        results.push({ indicatorCode: code, insertedCount: result.insertedCount });
      } catch (error) {
        results.push({ indicatorCode: code, error: error instanceof Error ? error.message : String(error) });
      }
    }

    res.json({ results });
  });

  return router;
}
