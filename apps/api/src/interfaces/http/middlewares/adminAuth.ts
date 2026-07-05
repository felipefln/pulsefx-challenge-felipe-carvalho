import type { NextFunction, Request, Response } from "express";
import { env } from "../../../config/env";

/**
 * Exige o header `X-Admin-Token` igual a ADMIN_SYNC_TOKEN. Fail-closed por
 * design: se a env var não estiver configurada, ninguém passa — não existe
 * um "modo aberto" por omissão de configuração.
 */
export function requireAdminToken(req: Request, res: Response, next: NextFunction): void {
  const providedToken = req.header("X-Admin-Token");
  if (!env.adminSyncToken || providedToken !== env.adminSyncToken) {
    res.status(401).json({ status: "error", message: "Token de admin ausente ou inválido" });
    return;
  }
  next();
}
