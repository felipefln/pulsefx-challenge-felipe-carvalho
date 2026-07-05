import type { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** UUID anônimo gerado pelo frontend (localStorage), lido de X-Anonymous-Id. Ver README — não há login no MVP. */
      anonymousUserId?: string;
    }
  }
}

/**
 * Lê X-Anonymous-Id e disponibiliza em `req.anonymousUserId`. Opcional por
 * design: em GET /indicators, sem o header a resposta segue normalmente,
 * só sem informação de favoritos (isFavorite sempre false).
 */
export function anonymousUser(req: Request, _res: Response, next: NextFunction): void {
  const headerValue = req.header("X-Anonymous-Id");
  req.anonymousUserId = headerValue && headerValue.trim() !== "" ? headerValue : undefined;
  next();
}
