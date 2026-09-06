function pad(n) {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DDTHH:mm" for 6:00 AM today, for a datetime-local input's default value. */
export function defaultTripStart() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T06:00`;
}

/** Converts a datetime-local input's value ("YYYY-MM-DDTHH:mm") to an ISO
 * string the backend will store as-is. This app has no per-trip timezone
 * concept — "time base" on the log sheet is just a label the driver fills
 * in (docs/overview.md), and every duty-status block is meant to track
 * plain wall-clock hours. Routing this through `new Date(value).toISOString()`
 * would reinterpret the typed wall-clock time through the browser's own
 * timezone offset and shift the hours, so instead the value is labeled UTC
 * without being converted — the wall-clock numbers the user typed are
 * exactly what gets sent and exactly what should show up in the schedule. */
export function localDatetimeToIso(value) {
  return `${value}:00Z`;
}

/** Formats a wall-clock-as-UTC ISO datetime (see localDatetimeToIso above)
 * as "M/D/YYYY" using UTC getters, so the date shown doesn't shift for
 * users whose browser isn't set to UTC. */
export function formatUtcDate(isoString) {
  const d = new Date(isoString);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}
