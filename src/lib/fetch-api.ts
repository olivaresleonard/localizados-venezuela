export interface ApiErrorData {
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiErrorData };

export async function fetchApi<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      credentials: "include",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    let body: unknown = {};
    try {
      body = await res.json();
    } catch {
      body = { error: `Error ${res.status}` };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: {
          error:
            ((body as Record<string, unknown>)?.error as string) ??
            `HTTP ${res.status}`,
          code: (body as Record<string, unknown>)?.code as string | undefined,
        },
      };
    }

    return { ok: true, data: body as T };
  } catch (err) {
    return {
      ok: false,
      error: {
        error:
          err instanceof TypeError
            ? "Error de conexión. Verifica tu red."
            : "Error inesperado",
      },
    };
  }
}
