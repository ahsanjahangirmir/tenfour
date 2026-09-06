export function getCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000, ...options },
    );
  });
}

/** Turns coordinates into a "City, State" label via Nominatim's public reverse-geocoding API. */
export async function reverseGeocode(lat, lon, signal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Could not look up that location.");
  const data = await response.json();
  const address = data.address || {};
  const city = address.city || address.town || address.village || address.hamlet || address.county;
  const state = address.state;
  if (city && state) return `${city}, ${state}`;
  return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}
