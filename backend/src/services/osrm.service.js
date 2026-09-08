// Real road-network routing via OSRM (Open Source Routing Machine).
//
// This is what fixes the "route went through buildings" bug from the last
// build: OSRM routes are snapped to the actual OpenStreetMap road/path
// graph, so a returned route only ever follows real streets, paths and
// footways - it is geometrically impossible for it to cut through a
// building the way a naive straight-line/grid route could.
//
// We use the free public instances at routing.openstreetmap.de, one per
// travel profile. These are fine for development and demos; see
// DEPLOYMENT.md for how to point OSRM_URL_* at your own self-hosted OSRM
// (recommended for real production traffic - the public demo servers are
// rate-limited and offered on a best-effort basis).

const PROFILE_HOSTS = {
  foot: process.env.OSRM_URL_FOOT || 'https://routing.openstreetmap.de/routed-foot',
  bike: process.env.OSRM_URL_BIKE || 'https://routing.openstreetmap.de/routed-bike',
  car: process.env.OSRM_URL_CAR || 'https://routing.openstreetmap.de/routed-car',
};

function hostFor(profile) {
  return PROFILE_HOSTS[profile] || PROFILE_HOSTS.foot;
}

// origin/destination are [lat, lon]. Returns an array of route alternatives,
// each as { geometry: [lat,lon][], distanceM, durationS }.
export async function getRouteAlternatives(origin, destination, profile = 'foot') {
  const host = hostFor(profile);
  const coords = `${origin[1]},${origin[0]};${destination[1]},${destination[0]}`;
  const url = `${host}/route/v1/${profile === 'bike' ? 'cycling' : profile === 'car' ? 'driving' : 'foot'}/${coords}` +
    `?alternatives=true&overview=full&geometries=geojson&steps=false`;

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) {
    throw new Error(`OSRM responded ${res.status}`);
  }
  const data = await res.json();
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(`OSRM could not find a route (${data.code || 'no routes'})`);
  }

  return data.routes.map((r) => ({
    geometry: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceM: r.distance,
    durationS: r.duration,
  }));
}
