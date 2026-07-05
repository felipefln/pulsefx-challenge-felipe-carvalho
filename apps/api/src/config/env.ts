/** Variáveis de ambiente que a API efetivamente usa, já validadas e tipadas. */
export interface Env {
  port: number;
  databaseUrl: string;
  /** Ausente até o candidato registrar uma key em fredaccount.stlouisfed.org/apikeys; só é exigida na hora de chamar o FRED (ver fredClient.ts), não no boot. */
  fredApiKey: string | undefined;
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
};
