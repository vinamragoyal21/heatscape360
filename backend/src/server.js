import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';

import { heatScoreRouter } from './routes/heatScore.route.js';
import { routeRouter } from './routes/route.route.js';
import { geocodeRouter } from './routes/geocode.route.js';
import { nearbyRouter } from './routes/nearby.route.js';
import { costRouter } from './routes/cost.route.js';
import { assistantRouter } from './routes/assistant.route.js';

const app = express();

app.use(express.json({ limit: '256kb' }));

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, server-to-server, health checks).
      if (!origin) return callback(null, true);
      if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);

// Be a good citizen to the free public APIs we depend on (Overpass,
// Nominatim, Open-Meteo, OSRM) by capping how hard our own clients can hit us.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/heat-score', heatScoreRouter);
app.use('/api/route', routeRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/nearby', nearbyRouter);
app.use('/api/cost-estimate', costRouter);
app.use('/api/assistant', assistantRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`HeatScape 360 backend listening on port ${config.port}`);
});
