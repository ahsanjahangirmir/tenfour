/**
 * Local, in-browser location autocomplete. Hitting a network API (even a
 * cached one) on every keystroke costs 100s of ms to seconds — nowhere
 * near "instant." Instead we ship a bundled US city/state dataset
 * (~29,700 places, lazy-loaded once as its own chunk) and filter it
 * entirely in memory, so every keystroke after the first load is a pure
 * synchronous array scan with zero network round-trips.
 *
 * The actual trip-creation geocode (precise lat/lon, address resolution)
 * still happens server-side via OpenRouteService at submit time — this
 * module only needs to produce good candidate strings fast.
 */

let citiesPromise = null;
let index = null;

function buildIndex(records) {
  return records.map(([city, state, lat, lon]) => ({
    label: `${city}, ${state}`,
    citySearchKey: city.toLowerCase(),
    labelSearchKey: `${city.toLowerCase()}, ${state.toLowerCase()}`,
    lat,
    lon,
  }));
}

function loadIndex() {
  if (!citiesPromise) {
    citiesPromise = import("../data/usCities.json").then((mod) => {
      index = buildIndex(mod.default);
      return index;
    });
  }
  return citiesPromise;
}

// Kick off the (one-time) load as soon as this module is used anywhere,
// so the dataset is usually already warm by the time a user focuses a
// location field.
loadIndex();

const MAX_RESULTS = 8;

/** Synchronous once the dataset has loaded; returns [] before that (callers
 * should also `await ensureLoaded()` once, e.g. on first focus). */
export function searchCities(query) {
  const q = query.trim().toLowerCase();
  if (!index || q.length < 2) return [];

  const startsWith = [];
  const contains = [];
  for (const entry of index) {
    if (entry.citySearchKey.startsWith(q)) {
      startsWith.push(entry);
    } else if (entry.labelSearchKey.includes(q)) {
      contains.push(entry);
    }
    if (startsWith.length >= MAX_RESULTS) break;
  }

  return startsWith.length >= MAX_RESULTS
    ? startsWith
    : [...startsWith, ...contains].slice(0, MAX_RESULTS);
}

export function ensureLoaded() {
  return loadIndex();
}

export function isLoaded() {
  return index !== null;
}
