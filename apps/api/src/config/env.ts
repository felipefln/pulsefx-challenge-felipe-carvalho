/** Variáveis de ambiente que a API efetivamente usa, já validadas e tipadas. */
export interface Env {
  port: number;
  databaseUrl: string;
  /** Ausente até o candidato registrar uma key em fredaccount.stlouisfed.org/apikeys; só é exigida na hora de chamar o FRED (ver fredClient.ts), não no boot. */
  fredApiKey: string | undefined;
  /** Token exigido no header X-Admin-Token para acionar POST /admin/sync. Sem ele configurado, o endpoint fica bloqueado por padrão (fail-closed). */
  adminSyncToken: string | undefined;
  /** Origem(ns) autorizada(s) a chamar a API via browser (CORS), separadas por vírgula. */
  corsOrigins: string[];
}

/** Lê uma env var obrigatória ou falha rápido com uma mensagem clara, em vez de deixar `undefined` se propagar até quebrar em outro lugar depois. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name} (ver .env.example)`);
  }
  return value;
}

export const env: Env = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: requireEnv("DATABASE_URL"),
  fredApiKey: process.env.FRED_API_KEY,
  adminSyncToken: process.env.ADMIN_SYNC_TOKEN,
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
