import { cache } from './cache.service.js';

// Real address search/autocomplete via OpenStreetMap Nominatim - this is
// what powers the "Enter current location / Enter destination" boxes,
// exactly like Google Maps' search box, without needing a paid API key.
//
// Nominatim's usage policy requires: a descriptive User-Agent, no more than
// ~1 request/sec, and results not to be heavily cached/redistributed beyond
// short-term. We honor all three here (server-side proxy, short cache,
// identifying UA) and the frontend debounces keystrokes before calling this.
// Docs: https://nominatim.org/release-docs/latest/api/Overview/

const UA = 'HeatScape360/1.0 (https://github.com/ ; contact: app-support@example.com)';

export async function searchAddress(query, near) {
  const key = `geo:${query.toLowerCase()}:${near ? near.join(',') : ''}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  if (near) {
    // Bias results toward the user's current location, like Google Maps does.
    const [lat, lon] = near;
    const delta = 0.6; // ~degrees, generous local bias without hard-excluding results
    url.searchParams.set('viewbox', `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`);
    url.searchParams.set('bounded', '0');
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
  const data = await res.json();

  const results = data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
    type: d.type,
    importance: d.importance,
  }));

  cache.set(key, results, 300); // 5 min
  return results;
}

export async function reverseGeocode(lat, lon) {
  const key = `rev:${lat.toFixed(5)}:${lon.toFixed(5)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('format', 'jsonv2');

  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
  const data = await res.json();
  const result = { label: data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`, lat, lon };
  cache.set(key, result, 300);
  return result;
}
