const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Calls the Django API with the signed-in user's Clerk JWT attached.
 * `getToken` is the function returned by Clerk's `useAuth()` hook.
 */
export async function apiFetch(path, { getToken, ...options } = {}) {
  const token = await getToken?.();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const body = JSON.parse(text);
      message = body.detail || body.non_field_errors?.[0] || flattenFieldErrors(body) || text;
    } catch {
      // response wasn't JSON — fall back to the raw text above
    }
    const error = new Error(message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json();
}

function flattenFieldErrors(body) {
  const entries = Object.entries(body).filter(([key]) => key !== "detail");
  if (entries.length === 0) return null;
  return entries
    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages[0] : messages}`)
    .join(" ");
}
