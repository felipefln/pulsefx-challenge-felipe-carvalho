import { Router } from "express";
import type { FavoriteRepository } from "../../../domain/repositories/favoriteRepository";
import type { IndicatorRepository } from "../../../domain/repositories/indicatorRepository";

/**
 * Rotas de "Meus indicadores". Diferente de /indicators (onde o usuário
 * anônimo é opcional), aqui é obrigatório — não existe favorito sem alguém
 * pra associar. Usa `code` na URL (não o id interno do Prisma) pra manter a
 * mesma superfície pública das outras rotas de indicador.
 */
export function createFavoriteRouter(
  indicatorRepository: IndicatorRepository,
  favoriteRepository: FavoriteRepository,
): Router {
  const router = Router();

  router.use((req, res, next) => {
    if (!req.anonymousUserId) {
      res.status(400).json({ status: "error", message: "Header X-Anonymous-Id é obrigatório" });
      return;
    }
    next();
  });

  /**
   * @openapi
   * /favorites:
   *   get:
   *     summary: Lista os códigos dos indicadores favoritados pelo usuário anônimo atual
   *     tags: [Favorites]
   *     parameters:
   *       - in: header
   *         name: X-Anonymous-Id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Lista de códigos favoritados }
   *       400: { description: Header X-Anonymous-Id ausente }
   */
  router.get("/", async (req, res) => {
    const [favoriteIndicatorIds, indicators] = await Promise.all([
      favoriteRepository.findIndicatorIdsByAnonymousUserId(req.anonymousUserId as string),
      indicatorRepository.findAll(),
    ]);
    const favoriteIdSet = new Set(favoriteIndicatorIds);
    const codes = indicators.filter((indicator) => favoriteIdSet.has(indicator.id)).map((indicator) => indicator.code);
    res.json({ codes });
  });

  /**
   * @openapi
   * /favorites/{code}:
   *   post:
   *     summary: Marca um indicador como favorito (idempotente)
   *     tags: [Favorites]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema: { type: string }
   *       - in: header
   *         name: X-Anonymous-Id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204: { description: Favoritado }
   *       400: { description: Header X-Anonymous-Id ausente }
   *       404: { description: Indicador não encontrado }
   */
  router.post("/:code", async (req, res) => {
    const indicator = await indicatorRepository.findByCode(req.params.code);
    if (!indicator) {
      res.status(404).json({ status: "error", message: `Indicador não encontrado: ${req.params.code}` });
      return;
    }
    await favoriteRepository.add(req.anonymousUserId as string, indicator.id);
    res.status(204).end();
  });

  /**
   * @openapi
   * /favorites/{code}:
   *   delete:
   *     summary: Desmarca um indicador como favorito (idempotente)
   *     tags: [Favorites]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema: { type: string }
   *       - in: header
   *         name: X-Anonymous-Id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204: { description: Desfavoritado }
   *       400: { description: Header X-Anonymous-Id ausente }
   *       404: { description: Indicador não encontrado }
   */
  router.delete("/:code", async (req, res) => {
    const indicator = await indicatorRepository.findByCode(req.params.code);
    if (!indicator) {
      res.status(404).json({ status: "error", message: `Indicador não encontrado: ${req.params.code}` });
      return;
    }
    await favoriteRepository.remove(req.anonymousUserId as string, indicator.id);
    res.status(204).end();
  });

  return router;
}
