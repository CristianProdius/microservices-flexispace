import useAuthStore from "@/stores/authStore";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Unauthenticated");
    this.name = "UnauthenticatedError";
  }
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { getToken, isAdmin, actingHostId } = useAuthStore.getState();
  const token = await getToken();
  if (!token) throw new UnauthenticatedError();

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (isAdmin && actingHostId) {
    headers.set("X-Acting-Host-Id", actingHostId);
  }
  return fetch(input, { ...init, headers });
}
