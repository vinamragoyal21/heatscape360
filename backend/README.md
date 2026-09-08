# HeatScape 360 - Backend

Express API providing:

- `GET /api/heat-score?lat=&lon=` - five-factor heat risk score for a point
- `POST /api/heat-score/batch` - scores for many points
- `GET /api/heat-score/grid?lat=&lon=&radius=&resolution=` - a grid for the map's heat overlay
- `POST /api/route` - heat-aware routing (real OSRM road routing + heat cost)
- `POST /api/route/heat-cost` - score an arbitrary client-supplied route (e.g. from Google Directions)
- `GET /api/geocode/search?q=` / `GET /api/geocode/reverse?lat=&lon=` - address search & reverse geocoding
- `GET /api/nearby?lat=&lon=&type=` / `GET /api/nearby/all?lat=&lon=` - cooling/water/hospital/shade POIs
- `GET /api/cost-estimate?areaKm2=&trees=` - rough cool-roof/tree-planting cost estimate
- `POST /api/assistant` - AI assistant (Claude/OpenAI if a key is set, else a built-in knowledge base)
- `GET /api/health` - health check

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

See `src/services/*.service.js` for the data-source integrations and
`src/services/heatModel.service.js` for the scoring model itself - both are
commented with the reasoning behind the formulas.
