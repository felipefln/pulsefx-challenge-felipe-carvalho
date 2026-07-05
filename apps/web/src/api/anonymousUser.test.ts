import { beforeEach, describe, expect, it } from "vitest";
import { getOrCreateAnonymousUserId } from "./anonymousUser";

beforeEach(() => {
  localStorage.clear();
});

describe("getOrCreateAnonymousUserId", () => {
  it("gera e persiste um UUID na primeira chamada", () => {
    const id = getOrCreateAnonymousUserId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(localStorage.getItem("pulsefx.anonymousUserId")).toBe(id);
  });

  it("retorna o mesmo id em chamadas subsequentes, sem gerar outro", () => {
    const first = getOrCreateAnonymousUserId();
    const second = getOrCreateAnonymousUserId();
    expect(second).toBe(first);
  });
});
