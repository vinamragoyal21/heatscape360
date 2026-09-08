import NodeCache from 'node-cache';

// One shared in-memory cache for everything the backend computes/fetches.
// TTLs are chosen per data type when callers call .set(). This keeps us from
// hammering Overpass/Open-Meteo/Nominatim on every map pan, and keeps the
// app fast even on the free tiers of these public APIs.
export const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Round a coordinate to a grid cell so nearby requests hit the same cache key
// (heat doesn't meaningfully change street-to-street, so ~110m grid cells are fine).
export function gridKey(prefix, lat, lon, precision = 3) {
  return `${prefix}:${lat.toFixed(precision)}:${lon.toFixed(precision)}`;
}
