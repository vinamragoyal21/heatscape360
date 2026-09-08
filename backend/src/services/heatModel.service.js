import { getCurrentWeather } from './openMeteo.service.js';
import { getGroundTruth } from './overpass.service.js';
import { haversineMeters, bboxAround, clamp } from '../utils/geo.util.js';
import { cache, gridKey } from './cache.service.js';

// ---------------------------------------------------------------------------
// The five-factor heat risk model.
//
// Each factor is scored 0-100, where a HIGHER score means that factor
// contributes MORE to heat risk (matches the app's "Factor Breakdown" UI,
// e.g. "Zero greenery: 95"). We combine them with weights (temperature
// matters most) into one overall risk score, and separately report which
// factor(s) are driving the score so the app can name a specific cause and
// recommend a fix that matches it.
//
// Data sources (multi-source fusion, as described in the product brief):
//  - Temperature: Open-Meteo current weather (real, live, ground station /
//    reanalysis blend) - stands in for satellite Land Surface Temperature,
//    which is not practical to pull and process live in a 48-hour build.
//  - Greenery (NDVI proxy): OpenStreetMap tree/park/forest coverage within
//    the sample radius.
//  - Built-up density (NDBI proxy): OpenStreetMap building footprint count
//    within the sample radius.
//  - Water proximity: distance to the nearest mapped water body or
//    drinking-water point.
//  - Airflow: approximated (as documented) from building density plus the
//    ratio of narrow/residential streets to wide/primary roads, since real
//    wind-flow simulation is out of scope for this build.
// ---------------------------------------------------------------------------

const WEIGHTS = {
  temperature: 0.35,
  greenery: 0.2,
  builtUp: 0.2,
  water: 0.1,
  airflow: 0.15,
};

const FACTOR_LABEL = {
  temperature: 'High temperature',
  greenery: 'Zero greenery',
  builtUp: 'High built-up (NDBI)',
  water: 'Low water nearby',
  airflow: 'Poor airflow',
};

const RADIUS_M = 300;

function scoreTemperature(tempC) {
  if (tempC == null) return 50; // unknown -> neutral, don't over/under-claim
  // 20C -> 0 risk, 42C -> ~100 risk
  return Math.round(clamp((tempC - 20) * (100 / 22), 0, 100));
}

function scoreGreenery(ground) {
  const { trees, greenAreas } = ground.counts;
  // crude "green index": trees are worth less individually than a mapped
  // park/forest polygon, both saturate quickly within a 300m radius.
  const greenIndex = clamp(trees / 40 + greenAreas / 3, 0, 1);
  return Math.round((1 - greenIndex) * 100);
}

function scoreBuiltUp(ground) {
  const { buildings } = ground.counts;
  // saturates around ~120 buildings in a 300m radius (dense urban core)
  const builtIndex = clamp(buildings / 120, 0, 1);
  return Math.round(builtIndex * 100);
}

function scoreWater(nearestWaterMeters) {
  if (nearestWaterMeters == null) return 70; // no water found within search radius
  // within 150m -> low risk, beyond 1.2km -> max risk
  return Math.round(clamp(((nearestWaterMeters - 150) / (1200 - 150)) * 100, 0, 100));
}

function scoreAirflow(ground, builtUpScore) {
  const { wideRoads, narrowRoads } = ground.counts;
  const totalRoads = wideRoads + narrowRoads;
  const narrowRatio = totalRoads === 0 ? 0.5 : narrowRoads / totalRoads;
  // packed buildings (builtUpScore) + a street grid dominated by narrow
  // streets (poor cross-ventilation) both push this up.
  return Math.round(clamp(builtUpScore * 0.6 + narrowRatio * 100 * 0.4, 0, 100));
}

function nearestWaterDistance([lat, lon], ground) {
  const candidates = [...ground.elements.waterBodies, ...ground.elements.waterPoints];
  let min = null;
  for (const el of candidates) {
    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    if (elLat == null || elLon == null) continue;
    const d = haversineMeters([lat, lon], [elLat, elLon]);
    if (min == null || d < min) min = d;
  }
  return min;
}

const RECOMMENDATION = {
  temperature: { icon: 'sun', text: 'Provide shaded rest stops and public hydration points' },
  greenery: { icon: 'tree', text: 'Plant more trees / expand urban canopy cover' },
  builtUp: { icon: 'roof', text: 'Use reflective ("cool") roofing on nearby buildings' },
  water: { icon: 'droplet', text: 'Add a public water point or misting station' },
  airflow: { icon: 'wind', text: 'Open up ventilation corridors between buildings' },
};

const CAUSE_PHRASES = {
  'greenery+builtUp': 'Low tree cover + too much concrete',
  'builtUp+greenery': 'Low tree cover + too much concrete',
  'airflow+builtUp': 'Packed buildings blocking air circulation',
  'builtUp+airflow': 'Packed buildings blocking air circulation',
  'greenery+airflow': 'No shade and poor air circulation',
  'airflow+greenery': 'No shade and poor air circulation',
  'water+greenery': 'No water or greenery nearby to cool the area',
  'greenery+water': 'No water or greenery nearby to cool the area',
  'temperature+builtUp': 'High ambient heat trapped by dense concrete',
  'builtUp+temperature': 'High ambient heat trapped by dense concrete',
};

const SINGLE_CAUSE = {
  temperature: 'Elevated ambient temperature for this time of day',
  greenery: 'Very little tree cover in this area',
  builtUp: 'High built-up density with dark, heat-absorbing surfaces',
  water: 'No water bodies nearby to help cool the area',
  airflow: 'Buildings packed close together, blocking air circulation',
};

function riskLevel(score) {
  if (score <= 35) return 'Low';
  if (score <= 55) return 'Moderate';
  if (score <= 75) return 'High';
  return 'Very High';
}

export async function scoreLocation(lat, lon) {
  const key = gridKey('score', lat, lon, 4); // ~11m cells
  const cached = cache.get(key);
  if (cached) return cached;

  const [weather, ground] = await Promise.all([
    getCurrentWeather(lat, lon),
    getGroundTruth(lat, lon, RADIUS_M),
  ]);

  const nearestWaterMeters = nearestWaterDistance([lat, lon], ground);

  const factors = {
    temperature: scoreTemperature(weather.temperatureC),
    greenery: scoreGreenery(ground),
    builtUp: scoreBuiltUp(ground),
    water: scoreWater(nearestWaterMeters),
  };
  factors.airflow = scoreAirflow(ground, factors.builtUp);

  const overall = Math.round(
    Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + factors[k] * w, 0)
  );

  const sortedFactors = Object.entries(factors).sort((a, b) => b[1] - a[1]);
  const [topKey, topScore] = sortedFactors[0];
  const [secondKey, secondScore] = sortedFactors[1];

  const useCombo = secondScore >= topScore - 8 && topScore >= 50;
  const comboKey = `${topKey}+${secondKey}`;
  const mainCause = useCombo && CAUSE_PHRASES[comboKey]
    ? CAUSE_PHRASES[comboKey]
    : SINGLE_CAUSE[topKey];

  const recommendations = [...new Set([topKey, secondKey, sortedFactors[2][0]])]
    .slice(0, 3)
    .map((k) => RECOMMENDATION[k]);

  const result = {
    lat,
    lon,
    score: clamp(overall, 0, 100),
    riskLevel: riskLevel(overall),
    factors: Object.fromEntries(
      Object.entries(factors).map(([k, v]) => [k, { score: v, label: FACTOR_LABEL[k] }])
    ),
    mainCause,
    recommendations,
    weather: {
      temperatureC: weather.temperatureC,
      feelsLikeC: weather.feelsLikeC,
      humidity: weather.humidity,
      source: weather.source,
    },
    nearestWaterMeters,
    dataAvailable: ground.dataAvailable && weather.source !== 'unavailable',
    sampledAt: new Date().toISOString(),
  };

  cache.set(key, result, 900); // 15 min
  return result;
}

// Score a batch of points (used for route heat-cost and for the map's heat
// overlay grid). Runs with limited concurrency so we don't get rate-limited
// by Overpass/Open-Meteo on a single request.
export async function scoreBatch(points, concurrency = 4) {
  const results = new Array(points.length);
  let i = 0;
  async function worker() {
    while (i < points.length) {
      const idx = i++;
      const [lat, lon] = points[idx];
      results[idx] = await scoreLocation(lat, lon);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, points.length) }, worker));
  return results;
}

export { bboxAround };
