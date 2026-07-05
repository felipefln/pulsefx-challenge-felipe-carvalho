import type { Indicator } from "@pulsefx/shared";

/** Dados necessários para criar ou atualizar um Indicator, identificado pelo `code`. */
export interface UpsertIndicatorInput {
  code: string;
  name: string;
  description: string;
  source: Indicator["source"];
  sourceSeriesId: string;
  frequency: Indicator["frequency"];
  unit: string | null;
}

/**
 * Porta (interface de domínio) para persistência de indicadores. A camada de
 * aplicação/HTTP depende só disso — não de Prisma diretamente — para que a
 * troca de storage (ou o uso de um repositório fake em teste) não exija
 * mudar quem consome o repositório (Dependency Inversion Principle).
 */
export interface IndicatorRepository {
  findAll(): Promise<Indicator[]>;
  findByCode(code: string): Promise<Indicator | null>;
  /** Cria o indicador se `code` não existir, ou atualiza os campos se existir. Usado pelo seed e pela sincronização. */
  upsertByCode(input: UpsertIndicatorInput): Promise<Indicator>;
}
