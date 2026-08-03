export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type ApiFailure = {
  success: false;
  message: string;
  errors?: unknown;
};

function buildUrl(path: string, params?: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function parseResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || payload.success === false) {
    throw new ApiError(
      payload?.message || "Khong the ket noi may chu.",
      response.status,
      payload && "errors" in payload ? payload.errors : undefined,
    );
  }

  return payload;
}

export const apiClient = {
  async get<T>(path: string, params?: Record<string, string | number | null | undefined>) {
    const response = await fetch(buildUrl(path, params), {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      credentials: "include",
    });

    return parseResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    });

    return parseResponse<T>(response);
  },

  async patch<T>(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    });

    return parseResponse<T>(response);
  },

  async delete<T>(path: string) {
    const response = await fetch(path, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    return parseResponse<T>(response);
  },
};
