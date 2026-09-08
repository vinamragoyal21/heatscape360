import { useEffect, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { api } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';

export function CostEstimate() {
  const [areaKm2, setAreaKm2] = useState(1);
  const [trees, setTrees] = useState(500);
  const debouncedArea = useDebounce(areaKm2, 250);
  const debouncedTrees = useDebounce(trees, 250);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .costEstimate(debouncedArea, debouncedTrees)
      .then(setData)
      .finally(() => setLoading(false));
  }, [debouncedArea, debouncedTrees]);

  return (
    <div>
      <TopBar title="Estimated Cost" subtitle="Rough, order-of-magnitude planning estimates" />
      <div className="px-4 md:px-6 pb-8 space-y-4 max-w-2xl">
        <Card>
          <label className="text-xs font-semibold text-brand-950/60">Area to fit with cool roofs (sq km)</label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              value={areaKm2}
              onChange={(e) => setAreaKm2(parseFloat(e.target.value))}
              className="flex-1 accent-brand-700"
            />
            <input
              type="number"
              value={areaKm2}
              min="0.01"
              step="0.1"
              onChange={(e) => setAreaKm2(parseFloat(e.target.value) || 0)}
              className="w-20 text-sm rounded-lg border border-black/10 px-2 py-1.5"
            />
          </div>

          <label className="text-xs font-semibold text-brand-950/60 mt-4 block">Number of trees to plant</label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="range"
              min="0"
              max="10000"
              step="50"
              value={trees}
              onChange={(e) => setTrees(parseInt(e.target.value, 10))}
              className="flex-1 accent-brand-700"
            />
            <input
              type="number"
              value={trees}
              min="0"
              step="10"
              onChange={(e) => setTrees(parseInt(e.target.value, 10) || 0)}
              className="w-20 text-sm rounded-lg border border-black/10 px-2 py-1.5"
            />
          </div>
        </Card>

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
                    <Icon name="roof" size={16} />
                  </span>
                  <p className="text-sm font-semibold text-brand-950">Cool Roofs</p>
                </div>
                <p className="text-2xl font-extrabold text-brand-950">{data.coolRoofs.formatted}</p>
                <p className="text-xs text-brand-950/50 mt-1">for {areaKm2} km² area</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
                    <Icon name="tree" size={16} />
                  </span>
                  <p className="text-sm font-semibold text-brand-950">Trees</p>
                </div>
                <p className="text-2xl font-extrabold text-brand-950">{data.trees.formatted}</p>
                <p className="text-xs text-brand-950/50 mt-1">for {trees.toLocaleString('en-IN')} trees</p>
              </Card>
            </div>

            <Card className="bg-brand-100/60">
              <p className="text-xs font-semibold text-brand-950/60 uppercase tracking-wide">Combined estimate</p>
              <p className="text-xl font-extrabold text-brand-950 mt-1">{data.combinedTotal.formatted}</p>
            </Card>

            <div className="rounded-xl bg-white shadow-card p-3.5 text-xs text-brand-950/50 leading-relaxed flex gap-2">
              <Icon name="info" size={16} className="text-brand-950/30 shrink-0 mt-0.5" />
              <div>
                <p>{data.coolRoofs.basis}.</p>
                <p className="mt-1">{data.trees.basis}.</p>
                <p className="mt-1 font-medium">{data.disclaimer}</p>
              </div>
            </div>
          </>
        )}
        {loading && !data && <p className="text-sm text-brand-950/40">Calculating…</p>}
      </div>
    </div>
  );
}
