import swaggerJsdoc from "swagger-jsdoc";

/**
 * Gera a especificação OpenAPI a partir dos blocos `@openapi` em JSDoc
 * espalhados pelos arquivos de rota. Em dev (tsx) escaneia o `.ts` fonte;
 * em produção (após `tsc build`) escaneia o `.js` compilado, já que o
 * `dist/` não contém mais os arquivos `.ts` originais.
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Pulse FX API",
      version: "0.1.0",
      description:
        "API do Pulse FX — câmbio (BRL) e indicadores macro a partir de fontes públicas (BCB, FRED). " +
        "Conteúdo educacional; não é recomendação de investimento.",
    },
    servers: [{ url: "/", description: "Servidor atual" }],
    tags: [{ name: "Meta", description: "Status e diagnóstico da API" }],
  },
  apis: [process.env.NODE_ENV === "production" ? "./dist/**/*.js" : "./src/**/*.ts"],
};

export const openapiSpec = swaggerJsdoc(options);
