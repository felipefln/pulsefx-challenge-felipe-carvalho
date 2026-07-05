import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @testing-library/react não limpa o DOM entre testes por conta própria
// fora do Jest — sem isso, renders de um `it` vazam pro próximo.
afterEach(() => {
  cleanup();
});
