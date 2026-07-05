import "dotenv/config";
import { PrismaClient } from "@prisma/client";

/**
 * Instância única do PrismaClient. Carrega dotenv aqui (não só em index.ts)
 * porque testes de repositório importam este módulo diretamente, sem passar
 * pelo entrypoint da aplicação.
 */
export const prisma = new PrismaClient();
