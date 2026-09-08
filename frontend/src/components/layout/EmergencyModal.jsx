import { useEffect, useState } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

const STEPS = [
  { icon: 'tree', text: 'Get to shade immediately' },
  { icon: 'droplet', text: 'Sip water slowly (not too much)' },
  { icon: 'wind', text: 'Loosen or remove tight clothing' },
  { icon: 'droplet', text: 'Cool with a wet cloth (neck, wrists, forehead)' },
];

function formatDistance(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function EmergencyModal({ open, onClose }) {
  const { currentLocation, requestLocation } = useApp();
  const [nearby, setNearby] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!currentLocation) {
      requestLocation();
      return;
    }
    setLoading(true);
    setError(null);
    api
      .nearbyAll(currentLocation.lat, currentLocation.lon)
      .then(setNearby)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, currentLocation, requestLocation]);

  if (!open) return null;

  const best = nearby
    ? [...(nearby.cooling || []), ...(nearby.water || []), ...(nearby.hospital || []), ...(nearby.shade || [])]
        .sort((a, b) => a.distanceM - b.distanceM)
        .slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl max-h-[88vh] overflow-y-auto shadow-card">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-heat-veryhigh/15 flex items-center justify-center text-heat-veryhigh">
              <Icon name="warning" size={18} />
            </span>
            <h2 className="font-bold text-brand-950">I'm not feeling well</h2>
          </div>
          <button onClick={onClose} className="text-brand-950/50 hover:text-brand-950">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-brand-950 mb-2">Quick steps</p>
            <ol className="space-y-2">
              {STEPS.map((s, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-brand-950/80">
                  <span className="h-7 w-7 shrink-0 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                    {i + 1}
                  </span>
                  {s.text}
                </li>
              ))}
            </ol>
            <p className="text-sm text-brand-950/80 mt-2 pl-10">
              If dizzy, sit or lie down with legs slightly raised.
            </p>
          </div>

          <div className="rounded-xl bg-heat-veryhigh/10 border border-heat-veryhigh/20 p-3 flex gap-2.5">
            <Icon name="warning" size={18} className="text-heat-veryhigh shrink-0 mt-0.5" />
            <p className="text-xs text-heat-veryhigh/90 leading-relaxed">
              <b>If they stop sweating, seem confused, or start vomiting</b> - that could be heat
              stroke, a medical emergency. Get medical help right away instead of just water and rest.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-brand-950 mb-2">Nearest help, using your location</p>
            {!currentLocation && <p className="text-xs text-brand-950/50">Getting your location...</p>}
            {loading && <p className="text-xs text-brand-950/50">Finding nearby help...</p>}
            {error && <p className="text-xs text-heat-veryhigh">Couldn't load nearby help right now: {error}</p>}
            {!loading && best.length === 0 && currentLocation && !error && (
              <p className="text-xs text-brand-950/50">No results found nearby yet.</p>
            )}
            <ul className="space-y-2">
              {best.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-8 w-8 shrink-0 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
                      <Icon name={categoryIcon(p.category)} size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-950 truncate">{p.name}</p>
                      <p className="text-[11px] text-brand-950/50">{formatDistance(p.distanceM)} away</p>
                    </div>
                  </div>
                  <a
                    className="text-xs font-semibold text-brand-700 shrink-0"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.openstreetmap.org/directions?to=${p.lat}%2C${p.lon}`}
                  >
                    Directions
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function categoryIcon(cat) {
  return { cooling: 'sun', water: 'droplet', hospital: 'hospital', shade: 'tree' }[cat] || 'pin';
}
