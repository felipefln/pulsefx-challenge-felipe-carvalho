import type { Observation } from "@pulsefx/shared";

/** Uma observação ainda sem indicatorId atribuído, como os clientes externos (BCB/FRED) retornam. */
export interface ObservationInput {
  refDate: string;
  value: number;
}

/** Opções de consulta do histórico de um indicador. */
export interface FindObservationsOptions {
  /** Quando definido, retorna só as `limit` observações mais recentes (ainda em ordem crescente). */
  limit?: number;
}

/**
 * Porta de persistência das observações (os pontos da série temporal). A
 * regra de "nunca duplicar" é responsabilidade do adapter (via constraint
 * única de banco em indicatorId+refDate), não de quem chama `saveMany`.
 */
export interface ObservationRepository {
  /** Observações de um indicador ordenadas por refDate crescente — a ordem que `calculateVariation` espera. */
  findByIndicatorId(indicatorId: string, options?: FindObservationsOptions): Promise<Observation[]>;
  /** Persiste observações novas e ignora silenciosamente as que já existem. Retorna quantas foram de fato inseridas. */
  saveMany(indicatorId: string, observations: ObservationInput[]): Promise<number>;
}
