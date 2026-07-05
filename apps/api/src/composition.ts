import { GetIndicatorHistoryUseCase } from "./application/useCases/getIndicatorHistoryUseCase";
import { ListIndicatorsUseCase } from "./application/useCases/listIndicatorsUseCase";
import { SyncIndicatorUseCase } from "./application/useCases/syncIndicatorUseCase";
import { CompositeExternalSeriesProvider } from "./infrastructure/external/compositeExternalSeriesProvider";
import { PrismaFavoriteRepository } from "./infrastructure/repositories/prismaFavoriteRepository";
import { PrismaIndicatorRepository } from "./infrastructure/repositories/prismaIndicatorRepository";
import { PrismaObservationRepository } from "./infrastructure/repositories/prismaObservationRepository";
import { PrismaSyncStateRepository } from "./infrastructure/repositories/prismaSyncStateRepository";

/**
 * Composition root: único lugar onde as implementações concretas (Prisma,
 * clientes externos) são instanciadas e ligadas às portas que os use cases
 * esperam. Rotas e o scheduler importam as instâncias já montadas daqui —
 * nunca fazem `new PrismaXRepository()` soltos dentro de um handler.
 */
export const indicatorRepository = new PrismaIndicatorRepository();
export const observationRepository = new PrismaObservationRepository();
export const favoriteRepository = new PrismaFavoriteRepository();
export const syncStateRepository = new PrismaSyncStateRepository();
export const externalSeriesProvider = new CompositeExternalSeriesProvider();

export const syncIndicatorUseCase = new SyncIndicatorUseCase(
  indicatorRepository,
  observationRepository,
  syncStateRepository,
  externalSeriesProvider,
);

export const listIndicatorsUseCase = new ListIndicatorsUseCase(
  indicatorRepository,
  observationRepository,
  favoriteRepository,
);

export const getIndicatorHistoryUseCase = new GetIndicatorHistoryUseCase(indicatorRepository, observationRepository);
