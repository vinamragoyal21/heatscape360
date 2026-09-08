import { Router } from 'express';
import { scoreLocation, scoreBatch } from '../services/heatModel.service.js';
import { bboxAround } from '../utils/geo.util.js';

export const heatScoreRouter = Router();

heatScoreRouter.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon query params are required numbers' });
  }
  try {
    const result = await scoreLocation(lat, lon);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'Failed to compute heat score', detail: err.message });
  }
});

heatScoreRouter.post('/batch', async (req, res) => {
  const points = req.body?.points;
  if (!Array.isArray(points) || points.length === 0) {
    return res.status(400).json({ error: 'body.points must be a non-empty array of [lat, lon]' });
  }
  if (points.length > 60) {
    return res.status(400).json({ error: 'Max 60 points per batch request' });
  }
  try {
    const results = await scoreBatch(points);
    res.json({ results });
  } catch (err) {
    res.status(502).json({ error: 'Failed to compute batch heat scores', detail: err.message });
  }
});

// A coarse grid of heat scores across a map viewport, used to paint the
// live heat overlay. Grid is capped so we never fire an unbounded number of
// Overpass/Open-Meteo calls from a single request.
heatScoreRouter.get('/grid', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const radiusMeters = clampNum(parseFloat(req.query.radius) || 1200, 300, 3000);
  const resolution = clampNum(parseInt(req.query.resolution, 10) || 5, 3, 7); // NxN grid

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon query params are required numbers' });
  }

  const box = bboxAround([lat, lon], radiusMeters);
  const points = [];
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const gLat = box.south + ((box.north - box.south) * i) / (resolution - 1);
      const gLon = box.west + ((box.east - box.west) * j) / (resolution - 1);
      points.push([gLat, gLon]);
    }
  }

  try {
    const results = await scoreBatch(points, 5);
    res.json({ points: results.map((r) => ({ lat: r.lat, lon: r.lon, score: r.score, riskLevel: r.riskLevel })) });
  } catch (err) {
    res.status(502).json({ error: 'Failed to compute heat grid', detail: err.message });
  }
});

function clampNum(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
