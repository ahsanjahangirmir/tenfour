import { apiFetch } from "./api";

export function listTrips(getToken) {
  return apiFetch("/api/trips/", { getToken });
}

export function getTrip(getToken, tripId) {
  return apiFetch(`/api/trips/${tripId}/`, { getToken });
}

export function createTrip(getToken, payload) {
  return apiFetch("/api/trips/", {
    getToken,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generateLogs(getToken, tripId, payload) {
  return apiFetch(`/api/trips/${tripId}/generate-logs/`, {
    getToken,
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTrip(getToken, tripId) {
  return apiFetch(`/api/trips/${tripId}/`, {
    getToken,
    method: "DELETE",
  });
}
