import { Router } from 'express';
import { getNearbyPOIs } from '../services/overpass.service.js';
import { haversineMeters } from '../utils/geo.util.js';

export const nearbyRouter = Router();

const VALID_TYPES = ['cooling', 'water', 'hospital', 'shade'];

// GET /api/nearby?lat=&lon=&type=cooling|water|hospital|shade&radius=1500
nearbyRouter.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const type = (req.query.type || '').toString();
  const radius = clampNum(parseFloat(req.query.radius) || 1500, 200, 5000);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon query params are required numbers' });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${VALID_TYPES.join(', ')}` });
  }

  try {
    const { dataAvailable, pois } = await getNearbyPOIs(lat, lon, type, radius);
    const withDistance = pois
      .map((p) => ({ ...p, distanceM: Math.round(haversineMeters([lat, lon], [p.lat, p.lon])) }))
      .sort((a, b) => a.distanceM - b.distanceM);

    res.json({ dataAvailable, count: withDistance.length, pois: withDistance });
  } catch (err) {
    // Graceful degradation instead of a hard failure the previous build had.
    res.status(200).json({ dataAvailable: false, count: 0, pois: [], error: err.message });
  }
});

// GET /api/nearby/all?lat=&lon=  -> one call for the "Find help near me" sheet
nearbyRouter.get('/all', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon query params are required numbers' });
  }

  const results = {};
  await Promise.all(
    VALID_TYPES.map(async (type) => {
      try {
        const { pois } = await getNearbyPOIs(lat, lon, type, 2000);
        results[type] = pois
          .map((p) => ({ ...p, distanceM: Math.round(haversineMeters([lat, lon], [p.lat, p.lon])) }))
          .sort((a, b) => a.distanceM - b.distanceM)
          .slice(0, 5);
      } catch {
        results[type] = [];
      }
    })
  );

  res.json(results);
});

function clampNum(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
