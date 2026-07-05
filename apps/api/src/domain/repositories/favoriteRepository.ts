/**
 * Porta de persistência dos favoritos ("Meus indicadores"). Não há conceito
 * de usuário autenticado no MVP — `anonymousUserId` é um UUID gerado pelo
 * frontend e persistido em localStorage (ver README, seção de decisões).
 */
export interface FavoriteRepository {
  /** IDs dos indicadores favoritados por esse usuário anônimo. */
  findIndicatorIdsByAnonymousUserId(anonymousUserId: string): Promise<string[]>;
  /** Idempotente: favoritar duas vezes o mesmo indicador não é erro nem duplica linha. */
  add(anonymousUserId: string, indicatorId: string): Promise<void>;
  /** Idempotente: desfavoritar algo que não estava favoritado não é erro. */
  remove(anonymousUserId: string, indicatorId: string): Promise<void>;
}
