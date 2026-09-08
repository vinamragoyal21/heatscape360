import { config } from '../config.js';
import { cache, gridKey } from './cache.service.js';
import { bboxAround } from '../utils/geo.util.js';

// Overpass is the free query API over OpenStreetMap's ground-truth data.
// We use it for two jobs:
//   1) "Diagnosis" data for the heat model: building footprints (NDBI proxy),
//      tree/park coverage (NDVI proxy), water features, and road widths
//      (airflow proxy).
//   2) Real nearby-assistance POIs: cooling stations, drinking water points,
//      hospitals/pharmacies, shaded spots.
//
// IMPORTANT (fixes the "nearby water-body" bug from the last build): every
// query here is wrapped in a timeout + try/catch and returns a well-defined
// empty/partial shape instead of throwing, and water points
// (amenity=drinking_water / man_made=water_tap) are queried SEPARATELY from
// water bodies (natural=water / waterway=*) - the previous build mixed the
// two tags together which is what produced bogus "nearby water" results.

async function runOverpassQuery(ql) {
  const res = await fetch(config.overpassUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: ql,
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    throw new Error(`Overpass responded ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data.elements) ? data.elements : [];
}

// --- Ground-truth "diagnosis" data used by the heat model -----------------

export async function getGroundTruth(lat, lon, radiusMeters = 300) {
  const key = gridKey('ground', lat, lon, 3) + `:${radiusMeters}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const box = bboxAround([lat, lon], radiusMeters);
  const bboxStr = `${box.south},${box.west},${box.north},${box.east}`;

  const ql = `
    [out:json][timeout:10];
    (
      way["building"](${bboxStr});
      way["landuse"="forest"](${bboxStr});
      way["natural"="wood"](${bboxStr});
      way["leisure"="park"](${bboxStr});
      node["natural"="tree"](${bboxStr});
      way["natural"="water"](${bboxStr});
      way["waterway"](${bboxStr});
      node["amenity"="drinking_water"](${bboxStr});
      node["man_made"="water_tap"](${bboxStr});
      way["highway"~"^(motorway|trunk|primary|secondary)$"](${bboxStr});
      way["highway"~"^(residential|service|living_street|footway)$"](${bboxStr});
    );
    out tags center;
  `;

  let elements = [];
  let dataAvailable = true;
  try {
    elements = await runOverpassQuery(ql);
  } catch (err) {
    dataAvailable = false;
  }

  const buildings = elements.filter((e) => e.tags?.building);
  const greenAreas = elements.filter(
    (e) => e.tags?.landuse === 'forest' || e.tags?.natural === 'wood' || e.tags?.leisure === 'park'
  );
  const trees = elements.filter((e) => e.tags?.natural === 'tree');
  const waterBodies = elements.filter((e) => e.tags?.natural === 'water' || e.tags?.waterway);
  const waterPoints = elements.filter(
    (e) => e.tags?.amenity === 'drinking_water' || e.tags?.man_made === 'water_tap'
  );
  const wideRoads = elements.filter((e) => e.tags?.highway && ['motorway', 'trunk', 'primary', 'secondary'].includes(e.tags.highway));
  const narrowRoads = elements.filter((e) => e.tags?.highway && ['residential', 'service', 'living_street', 'footway'].includes(e.tags.highway));

  const result = {
    dataAvailable,
    counts: {
      buildings: buildings.length,
      greenAreas: greenAreas.length,
      trees: trees.length,
      waterBodies: waterBodies.length,
      waterPoints: waterPoints.length,
      wideRoads: wideRoads.length,
      narrowRoads: narrowRoads.length,
    },
    nearestWaterMeters: null, // filled in by caller (needs haversine to each element)
    elements: { waterBodies, waterPoints },
  };

  cache.set(key, result, 1800); // 30 min - land cover doesn't change fast
  return result;
}

// --- Nearby assistance POIs -------------------------------------------------

const NEARBY_QUERIES = {
  cooling: `
    node["amenity"~"^(cafe|library|community_centre|mall|marketplace)$"](area);
    node["shop"="mall"](area);
    node["railway"~"^(station|subway_entrance)$"](area);
    node["public_transport"="station"](area);
  `,
  water: `
    node["amenity"="drinking_water"](area);
    node["man_made"="water_tap"](area);
  `,
  hospital: `
    node["amenity"~"^(hospital|clinic|pharmacy)$"](area);
  `,
  shade: `
    way["leisure"="park"](area);
    way["natural"="wood"](area);
    node["natural"="tree"](area);
  `,
};

export async function getNearbyPOIs(lat, lon, type, radiusMeters = 1500) {
  const q = NEARBY_QUERIES[type];
  if (!q) throw new Error(`Unknown nearby type "${type}"`);

  const key = gridKey(`poi:${type}`, lat, lon, 3) + `:${radiusMeters}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const ql = `
    [out:json][timeout:10];
    (
      ${q.replace(/\(area\)/g, `(around:${radiusMeters},${lat},${lon})`)}
    );
    out tags center ${type === 'cooling' || type === 'hospital' ? 20 : 30};
  `;

  let elements = [];
  let dataAvailable = true;
  try {
    elements = await runOverpassQuery(ql);
  } catch (err) {
    dataAvailable = false;
  }

  const pois = elements
    .map((e) => {
      const elLat = e.lat ?? e.center?.lat;
      const elLon = e.lon ?? e.center?.lon;
      if (elLat == null || elLon == null) return null;
      return {
        id: `${e.type}/${e.id}`,
        lat: elLat,
        lon: elLon,
        name: e.tags?.name || labelFor(type, e.tags),
        tags: e.tags || {},
        category: type,
      };
    })
    .filter(Boolean);

  const result = { dataAvailable, pois };
  cache.set(key, result, 900); // 15 min
  return result;
}

function labelFor(type, tags = {}) {
  if (type === 'cooling') {
    if (tags.railway || tags.public_transport) return 'Metro / transit station';
    if (tags.shop === 'mall') return 'Shopping mall';
    if (tags.amenity === 'library') return 'Library';
    if (tags.amenity === 'community_centre') return 'Community centre';
    return 'Cooling station';
  }
  if (type === 'water') return 'Drinking water point';
  if (type === 'hospital') {
    if (tags.amenity === 'pharmacy') return 'Pharmacy';
    if (tags.amenity === 'clinic') return 'Clinic';
    return 'Hospital';
  }
  if (type === 'shade') {
    if (tags.leisure === 'park') return 'Park';
    if (tags.natural === 'wood') return 'Wooded area';
    return 'Shade tree';
  }
  return 'Point of interest';
}
