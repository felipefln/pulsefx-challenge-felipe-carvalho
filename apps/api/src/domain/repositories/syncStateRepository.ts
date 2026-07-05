/** Estado de sincronização de um indicador — a base da política de TTL/cache da Fase 4. */
export interface SyncStateRecord {
  indicatorId: string;
  lastSyncedAt: Date | null;
  /** Data de referência (YYYY-MM-DD) da observação mais recente já sincronizada, ou null se nunca sincronizou. */
  lastRefDate: string | null;
  status: string;
}

export interface UpsertSyncStateInput {
  lastSyncedAt: Date;
  lastRefDate: string | null;
  status: string;
}

/**
 * Porta de persistência do estado de sincronização por indicador. Existe
 * separado do Indicator para deixar claro que é metadado operacional (quando
 * sincronizou, se deu erro), não parte da identidade do indicador em si.
 */
export interface SyncStateRepository {
  findByIndicatorId(indicatorId: string): Promise<SyncStateRecord | null>;
  upsert(indicatorId: string, input: UpsertSyncStateInput): Promise<SyncStateRecord>;
}
