import type { IndicatorFrequency } from "@pulsefx/shared";
import cron from "node-cron";
import type { SyncIndicatorUseCase } from "../../application/useCases/syncIndicatorUseCase";
import type { IndicatorRepository } from "../../domain/repositories/indicatorRepository";

/**
 * Sincroniza todos os indicadores de uma frequência, sem deixar um
 * indicador com erro travar os demais — cada um roda isolado, e falha vira
 * log, não exceção não tratada subindo pro cron.
 */
export async function runScheduledSync(
  indicatorRepository: IndicatorRepository,
  syncIndicatorUseCase: SyncIndicatorUseCase,
  frequency: IndicatorFrequency,
): Promise<void> {
  const indicators = await indicatorRepository.findAll();
  const targets = indicators.filter((indicator) => indicator.frequency === frequency);

  for (const indicator of targets) {
    try {
      const result = await syncIndicatorUseCase.execute(indicator.code);
      console.log(`Sync agendado ok: ${indicator.code} (+${result.insertedCount} observações novas)`);
    } catch (error) {
      console.error(`Sync agendado falhou para ${indicator.code}`, error);
    }
  }
}

/**
 * Agenda a sincronização automática por tipo de série, evitando chamadas
 * descontroladas às fontes externas: diária uma vez por dia útil (14h BRT,
 * depois do fechamento PTAX ~13h) e mensal uma vez por mês (dia 1º, 15h).
 * Fora desses horários, a única forma de sincronizar é o gatilho manual
 * em POST /admin/sync.
 */
export function startSyncScheduler(
  indicatorRepository: IndicatorRepository,
  syncIndicatorUseCase: SyncIndicatorUseCase,
): void {
  cron.schedule("0 14 * * 1-5", () => {
    void runScheduledSync(indicatorRepository, syncIndicatorUseCase, "DAILY");
  });

  cron.schedule("0 15 1 * *", () => {
    void runScheduledSync(indicatorRepository, syncIndicatorUseCase, "MONTHLY");
  });
}
