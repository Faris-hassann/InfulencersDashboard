export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string> = {}) { super(message); }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers }, cache: "no-store", signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError("Could not reach the server. Check that the backend is running and try again.", 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.message ?? "Unable to complete this request", response.status, Object.fromEntries((body.errors ?? []).map((error: { field: string; message: string }) => [error.field, error.message])));
  }
  return response.status === 204 ? undefined as T : response.json();
}
