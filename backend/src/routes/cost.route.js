import { Router } from 'express';

export const costRouter = Router();

// Rough, order-of-magnitude planning estimates, not quotes. Rates are
// scaled from a real reference project (cool-roof retrofit in Ahmedabad,
// India) and a typical urban tree-planting programme cost, as instructed by
// the product brief. Every response is explicit that this is an estimate.
const COOL_ROOF_RATE_PER_KM2 = 25_000_000; // Rs 12.5 Cr for 5 km^2 => Rs 2.5 Cr/km^2
const TREE_RATE = 820; // Rs 8.2 Lakh per 1000 trees => Rs 820/tree

costRouter.get('/', (req, res) => {
  const areaKm2 = clampNum(parseFloat(req.query.areaKm2) || 1, 0.01, 500);
  const trees = clampNum(parseInt(req.query.trees, 10) || 0, 0, 200000);

  const coolRoofCost = areaKm2 * COOL_ROOF_RATE_PER_KM2;
  const treeCost = trees * TREE_RATE;

  res.json({
    inputs: { areaKm2, trees },
    coolRoofs: {
      totalRupees: Math.round(coolRoofCost),
      formatted: formatRupees(coolRoofCost),
      basis: 'Scaled from a real cool-roof retrofit project (~Rs 12.5 Cr for 5 sq km, Ahmedabad)',
    },
    trees: {
      totalRupees: Math.round(treeCost),
      formatted: formatRupees(treeCost),
      basis: 'Scaled from a typical urban tree-planting cost (~Rs 8.2 Lakh per 1,000 trees)',
    },
    combinedTotal: {
      totalRupees: Math.round(coolRoofCost + treeCost),
      formatted: formatRupees(coolRoofCost + treeCost),
    },
    disclaimer:
      'These are rough, order-of-magnitude planning estimates based on past project costs, not a detailed budget or a vendor quote. Actual costs vary significantly by location, materials, labor and vendor.',
  });
});

function clampNum(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function formatRupees(n) {
  if (n >= 1e7) return `Rs ${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `Rs ${(n / 1e5).toFixed(2)} Lakh`;
  return `Rs ${Math.round(n).toLocaleString('en-IN')}`;
}
