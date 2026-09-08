import { Router } from 'express';
import { searchAddress, reverseGeocode } from '../services/nominatim.service.js';

export const geocodeRouter = Router();

// GET /api/geocode/search?q=...&nearLat=&nearLon=
geocodeRouter.get('/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (q.length < 2) return res.json({ results: [] });

  const nearLat = parseFloat(req.query.nearLat);
  const nearLon = parseFloat(req.query.nearLon);
  const near = !Number.isNaN(nearLat) && !Number.isNaN(nearLon) ? [nearLat, nearLon] : null;

  try {
    const results = await searchAddress(q, near);
    res.json({ results });
  } catch (err) {
    res.status(502).json({ error: 'Address search failed', detail: err.message, results: [] });
  }
});

// GET /api/geocode/reverse?lat=&lon=
geocodeRouter.get('/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon query params are required numbers' });
  }
  try {
    const result = await reverseGeocode(lat, lon);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'Reverse geocoding failed', detail: err.message, label: `${lat.toFixed(5)}, ${lon.toFixed(5)}` });
  }
});
