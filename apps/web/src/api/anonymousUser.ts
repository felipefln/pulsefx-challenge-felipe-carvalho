const STORAGE_KEY = "pulsefx.anonymousUserId";

/**
 * Retorna o UUID anônimo persistido em localStorage, gerando um na primeira
 * visita. É a identidade usada só para "Meus indicadores" — não há
 * login/cadastro no MVP (ver README, seção de decisões).
 */
export function getOrCreateAnonymousUserId(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, generated);
  return generated;
}
