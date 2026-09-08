// Small geo helpers shared across services/routes.

const EARTH_RADIUS_M = 6371000;

export function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Great-circle distance in meters between two [lat, lon] points.
export function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

// Total length of a [lat, lon][] polyline, in meters.
export function polylineLengthMeters(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

// Sample N evenly-spaced points along a [lat, lon][] polyline (inclusive of ends).
export function samplePolyline(points, count) {
  if (points.length === 0) return [];
  if (points.length === 1 || count <= 1) return [points[0]];

  const total = polylineLengthMeters(points);
  if (total === 0) return [points[0]];

  const step = total / (count - 1);
  const samples = [points[0]];
  let travelled = 0;
  let segIdx = 0;
  let nextTarget = step;

  while (samples.length < count - 1 && segIdx < points.length - 1) {
    const segStart = points[segIdx];
    const segEnd = points[segIdx + 1];
    const segLen = haversineMeters(segStart, segEnd);

    if (travelled + segLen >= nextTarget) {
      const ratio = segLen === 0 ? 0 : (nextTarget - travelled) / segLen;
      const lat = segStart[0] + (segEnd[0] - segStart[0]) * ratio;
      const lon = segStart[1] + (segEnd[1] - segStart[1]) * ratio;
      samples.push([lat, lon]);
      nextTarget += step;
    } else {
      travelled += segLen;
      segIdx++;
    }
  }

  samples.push(points[points.length - 1]);
  return samples;
}

// Bounding box [south, west, north, east] around a center point given a radius in meters.
export function bboxAround([lat, lon], radiusMeters) {
  const latDelta = radiusMeters / 111320; // ~meters per degree latitude
  const lonDelta = radiusMeters / (111320 * Math.cos(toRad(lat)) || 1);
  return {
    south: lat - latDelta,
    north: lat + latDelta,
    west: lon - lonDelta,
    east: lon + lonDelta,
  };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
