const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

/**
 * Cliente HTTP mínimo: monta a URL absoluta, lança em resposta não-ok (o
 * react-query trata como erro de query) e faz o parse de JSON. A API é
 * pequena o bastante pra não justificar um client gerado a partir do
 * OpenAPI ou uma lib como axios.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha na requisição ${path}: HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
