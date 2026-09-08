import { Router } from 'express';
import { getRouteAlternatives } from '../services/osrm.service.js';
import { scoreBatch } from '../services/heatModel.service.js';
import { getNearbyPOIs } from '../services/overpass.service.js';
import { samplePolyline, polylineLengthMeters, haversineMeters } from '../utils/geo.util.js';

export const routeRouter = Router();

const SAMPLE_COUNT = 8; // points sampled along each candidate route for heat scoring

// POST /api/route  { origin: [lat,lon], destination: [lat,lon], profile?: 'foot'|'bike'|'car' }
routeRouter.post('/', async (req, res) => {
  const { origin, destination, profile = 'foot' } = req.body || {};
  if (!isCoord(origin) || !isCoord(destination)) {
    return res.status(400).json({ error: 'origin and destination must be [lat, lon] arrays' });
  }

  try {
    const alternatives = await getRouteAlternatives(origin, destination, profile);

    // Score every alternative's sampled points in one batch to reuse the
    // scoreLocation cache efficiently and stay within rate limits.
    const sampledPerRoute = alternatives.map((r) => samplePolyline(r.geometry, SAMPLE_COUNT));
    const flatPoints = sampledPerRoute.flat();
    const flatScores = await scoreBatch(flatPoints, 6);

    let cursor = 0;
    const annotated = alternatives.map((r, idx) => {
      const n = sampledPerRoute[idx].length;
      const scores = flatScores.slice(cursor, cursor + n);
      cursor += n;

      const avgRisk = Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length);
      const distanceKm = r.distanceM / 1000;
      // Heat cost model: each km effectively "costs" more distance the
      // hotter the streets it passes through - this is what lets the app
      // trade distance against heat instead of a blind avoid-all-heat rule.
      const heatCostKm = distanceKm * (1 + avgRisk / 100);

      return {
        geometry: r.geometry,
        distanceM: Math.round(r.distanceM),
        durationS: Math.round(r.durationS),
        avgRisk,
        riskAlongRoute: scores.map((s) => ({ lat: s.lat, lon: s.lon, score: s.score, riskLevel: s.riskLevel })),
        heatCostKm: Math.round(heatCostKm * 100) / 100,
      };
    });

    annotated.sort((a, b) => a.heatCostKm - b.heatCostKm);
    const recommended = annotated[0];
    const shortest = [...annotated].sort((a, b) => a.distanceM - b.distanceM)[0];

    annotated.forEach((r) => {
      r.isRecommended = r === recommended;
      r.isShortest = r === shortest;
    });

    // "Along the way" real POIs near the recommended route's midpoint.
    const mid = recommended.geometry[Math.floor(recommended.geometry.length / 2)];
    let alongTheWay = [];
    try {
      const [cooling, water] = await Promise.all([
        getNearbyPOIs(mid[0], mid[1], 'cooling', 1200),
        getNearbyPOIs(mid[0], mid[1], 'water', 1200),
      ]);
      alongTheWay = [
        ...cooling.pois.slice(0, 2).map((p) => withDistance(p, mid)),
        ...water.pois.slice(0, 1).map((p) => withDistance(p, mid)),
      ];
    } catch {
      alongTheWay = [];
    }

    const extraMinutesVsShortest = Math.round((recommended.durationS - shortest.durationS) / 60);

    res.json({
      routes: annotated,
      recommended,
      shortest,
      extraMinutesVsShortest,
      heatSavingsPercent: shortest.heatCostKm > 0
        ? Math.round((1 - recommended.heatCostKm / shortest.heatCostKm) * 100)
        : 0,
      alongTheWay,
    });
  } catch (err) {
    res.status(502).json({ error: 'Failed to compute route', detail: err.message });
  }
});

// POST /api/route/heat-cost  { points: [[lat,lon], ...] }
// Generic scorer for a client-computed polyline (e.g. from the Google Maps
// Directions API when VITE_GOOGLE_MAPS_API_KEY is configured on the frontend).
routeRouter.post('/heat-cost', async (req, res) => {
  const points = req.body?.points;
  if (!Array.isArray(points) || points.length < 2) {
    return res.status(400).json({ error: 'body.points must be an array of at least 2 [lat, lon] pairs' });
  }
  try {
    const sampled = samplePolyline(points, SAMPLE_COUNT);
    const scores = await scoreBatch(sampled, 6);
    const avgRisk = Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length);
    const distanceKm = polylineLengthMeters(points) / 1000;
    const heatCostKm = Math.round(distanceKm * (1 + avgRisk / 100) * 100) / 100;
    res.json({
      avgRisk,
      distanceKm: Math.round(distanceKm * 100) / 100,
      heatCostKm,
      riskAlongRoute: scores.map((s) => ({ lat: s.lat, lon: s.lon, score: s.score, riskLevel: s.riskLevel })),
    });
  } catch (err) {
    res.status(502).json({ error: 'Failed to score route', detail: err.message });
  }
});

function isCoord(v) {
  return Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && !Number.isNaN(n));
}

function withDistance(poi, from) {
  return { ...poi, distanceM: Math.round(haversineMeters(from, [poi.lat, poi.lon])) };
}
