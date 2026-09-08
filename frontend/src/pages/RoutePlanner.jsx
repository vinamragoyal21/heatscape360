import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { AddressInput } from '../components/map/AddressInput';
import { MapView } from '../components/map/MapView';
import { HeatLegend } from '../components/map/HeatLegend';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

const PROFILES = [
  { id: 'foot', label: 'Walking', icon: 'route' },
  { id: 'bike', label: 'Cycling', icon: 'bike' },
  { id: 'car', label: 'Driving', icon: 'car' },
];

function fmtKm(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
function fmtMin(s) {
  return `${Math.max(1, Math.round(s / 60))} min`;
}

export function RoutePlanner() {
  const navState = useLocation().state || {};
  const { currentLocation } = useApp();
  const [origin, setOrigin] = useState(navState.origin || null);
  const [destination, setDestination] = useState(navState.destination || null);
  const [profile, setProfile] = useState('foot');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (currentLocation && !origin) {
      setOrigin({ lat: currentLocation.lat, lon: currentLocation.lon, label: 'Current location' });
    }
  }, [currentLocation, origin]);

  async function planRoute() {
    if (!origin || !destination) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.route([origin.lat, origin.lon], [destination.lat, destination.lon], profile);
      setResult(r);
      setSelectedIdx(r.routes.findIndex((x) => x.isRecommended));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const routes = result?.routes || [];
  const selected = routes[selectedIdx];
  const bounds = selected ? selected.geometry : null;

  function openExternalNavigation() {
    if (!origin || !destination) return;
    const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_${profile === 'car' ? 'car' : profile}&route=${origin.lat}%2C${origin.lon}%3B${destination.lat}%2C${destination.lon}`;
    window.open(url, '_blank', 'noreferrer');
  }

  return (
    <div className="md:flex md:h-screen">
      <div className="md:w-[420px] md:h-screen md:overflow-y-auto md:border-r md:border-black/5 bg-surface">
        <TopBar title="Route Planner" subtitle="Real road routing, weighted by heat risk" />
        <div className="px-4 md:px-6 pb-8 space-y-4">
          <Card className="space-y-2.5">
            <AddressInput placeholder="Enter current location" value={origin} onSelect={setOrigin} />
            <div className="flex justify-center -my-1">
              <Icon name="swap" size={16} className="text-brand-950/30" />
            </div>
            <AddressInput placeholder="Enter destination" value={destination} onSelect={setDestination} allowCurrentLocation={false} />

            <div className="flex gap-2 pt-1">
              {PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProfile(p.id)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold border ${
                    profile === p.id ? 'bg-brand-700 text-white border-brand-700' : 'border-black/10 text-brand-950/60'
                  }`}
                >
                  <Icon name={p.icon} size={16} />
                  {p.label}
                </button>
              ))}
            </div>

            <Button className="w-full mt-1" onClick={planRoute} disabled={!origin || !destination || loading}>
              {loading ? 'Finding heat-safe route…' : 'Search routes'}
            </Button>
            {error && <p className="text-xs text-heat-veryhigh">{error}</p>}
          </Card>

          {routes.length > 0 && (
            <Card padded={false} className="divide-y divide-black/5">
              {routes.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full text-left px-4 py-3.5 ${selectedIdx === i ? 'bg-brand-100/60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-brand-950">
                      {r.isRecommended ? 'Recommended (lowest heat cost)' : r.isShortest ? 'Shortest distance' : 'Alternative route'}
                    </p>
                    {i === 0 && <span className="text-[10px] font-bold text-brand-700 bg-brand-100 rounded px-1.5 py-0.5">BEST</span>}
                  </div>
                  <p className="text-xs text-brand-950/50 mt-0.5">
                    {fmtKm(r.distanceM)} · {fmtMin(r.durationS)}
                    {r.isRecommended && result.extraMinutesVsShortest > 0 && ` (+${result.extraMinutesVsShortest} min vs shortest)`}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${r.avgRisk > 60 ? 'text-heat-veryhigh' : r.avgRisk > 40 ? 'text-heat-high' : 'text-heat-low'}`}>
                    Avg. heat risk along route: {r.avgRisk}/100
                  </p>
                </button>
              ))}
            </Card>
          )}

          {result && result.alongTheWay.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-brand-950 mb-2">Along the way</p>
              <ul className="space-y-2">
                {result.alongTheWay.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-brand-950/70">{p.name}</span>
                    <span className="text-brand-950/40 text-xs">{fmtKm(p.distanceM)}</span>
                  </li>
                ))}
              </ul>
              {result.heatSavingsPercent > 0 && (
                <p className="text-xs text-brand-700 mt-3 bg-brand-100 rounded-lg px-3 py-2">
                  This route avoids the hottest zones - total heat cost is {result.heatSavingsPercent}% lower than the
                  shortest path.
                </p>
              )}
            </Card>
          )}

          {routes.length > 0 && (
            <Button className="w-full" onClick={openExternalNavigation}>
              <Icon name="route" size={16} /> Start Navigation
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 relative h-[50vh] md:h-full">
        <MapView
          center={origin ? [origin.lat, origin.lon] : [28.6139, 77.209]}
          zoom={14}
          bounds={bounds}
          routes={routes.map((r, i) => ({ ...r, isRecommended: i === selectedIdx, dashed: i !== selectedIdx }))}
          markers={[
            ...(origin ? [{ id: 'o', lat: origin.lat, lon: origin.lon, kind: 'origin' }] : []),
            ...(destination ? [{ id: 'd', lat: destination.lat, lon: destination.lon, kind: 'destination' }] : []),
            ...(result?.alongTheWay || []).map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, kind: p.category })),
          ]}
        />
        <HeatLegend className="absolute left-3 bottom-3" />
      </div>
    </div>
  );
}
