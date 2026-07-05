import "dotenv/config";
import { BCB_PTAX_SENTINEL } from "../src/infrastructure/external/compositeExternalSeriesProvider";
import { PrismaIndicatorRepository } from "../src/infrastructure/repositories/prismaIndicatorRepository";

/**
 * Os 3 indicadores do MVP, com a justificativa (2–5 linhas) de por que cada
 * um faz sentido para o usuário — ver também README, seção de séries
 * escolhidas. Rodar com `pnpm prisma:seed`.
 */
const INDICATORS = [
  {
    code: "usd-brl",
    name: "Dólar comercial (USD/BRL)",
    description:
      "Cotação de fechamento do dólar frente ao real, publicada diariamente pelo Banco Central via PTAX. " +
      "É a referência mais usada no Brasil para conversão cambial e acompanhamento do câmbio no dia a dia — " +
      "a razão de existir do Pulse FX.",
    source: "BCB" as const,
    sourceSeriesId: BCB_PTAX_SENTINEL,
    frequency: "DAILY" as const,
    unit: "BRL",
  },
  {
    code: "ipca",
    name: "IPCA (variação mensal)",
    description:
      "Variação mensal do Índice de Preços ao Consumidor Amplo, a inflação oficial do Brasil e a referência " +
      "usada pelo Banco Central para decidir a taxa Selic. Ajuda o usuário a entender o contexto por trás das " +
      "decisões de juros que, por sua vez, afetam o câmbio.",
    source: "BCB" as const,
    sourceSeriesId: "433",
    frequency: "MONTHLY" as const,
    unit: "%",
  },
  {
    code: "fed-funds-rate",
    name: "Federal Funds Rate (EUA)",
    description:
      "Taxa básica de juros dos Estados Unidos, definida pelo Federal Reserve. O diferencial entre os juros " +
      "brasileiros e americanos é um dos principais motores de fluxo de capital e, consequentemente, do câmbio " +
      "USD/BRL — dá ao usuário o contexto internacional que falta olhando só para o Brasil.",
    source: "FRED" as const,
    sourceSeriesId: "FEDFUNDS",
    frequency: "MONTHLY" as const,
    unit: "%",
  },
];

async function main() {
  const indicatorRepository = new PrismaIndicatorRepository();
  for (const input of INDICATORS) {
    const indicator = await indicatorRepository.upsertByCode(input);
    console.log(`Seed ok: ${indicator.code} (${indicator.id})`);
  }
}

main()
  .catch((error) => {
    console.error("Seed falhou:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../src/infrastructure/db/prismaClient");
    await prisma.$disconnect();
  });
