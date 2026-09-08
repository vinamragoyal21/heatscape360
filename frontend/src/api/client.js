const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function request(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.detail = data.detail;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),

  heatScore: (lat, lon) => request(`/api/heat-score?lat=${lat}&lon=${lon}`),
  heatGrid: (lat, lon, radius = 1200, resolution = 5) =>
    request(`/api/heat-score/grid?lat=${lat}&lon=${lon}&radius=${radius}&resolution=${resolution}`),

  route: (origin, destination, profile = 'foot') =>
    request('/api/route', { method: 'POST', body: { origin, destination, profile } }),

  geocodeSearch: (q, near, signal) => {
    const nearQs = near ? `&nearLat=${near[0]}&nearLon=${near[1]}` : '';
    return request(`/api/geocode/search?q=${encodeURIComponent(q)}${nearQs}`, { signal });
  },
  reverseGeocode: (lat, lon) => request(`/api/geocode/reverse?lat=${lat}&lon=${lon}`),

  nearby: (lat, lon, type, radius = 1500) =>
    request(`/api/nearby?lat=${lat}&lon=${lon}&type=${type}&radius=${radius}`),
  nearbyAll: (lat, lon) => request(`/api/nearby/all?lat=${lat}&lon=${lon}`),

  costEstimate: (areaKm2, trees) => request(`/api/cost-estimate?areaKm2=${areaKm2}&trees=${trees}`),

  assistant: (message, history) =>
    request('/api/assistant', { method: 'POST', body: { message, history } }),
};

export { BASE_URL };
