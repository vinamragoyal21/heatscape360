import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { HeatBadge } from '../components/common/HeatBadge';
import { AddressInput } from '../components/map/AddressInput';
import { MapView } from '../components/map/MapView';
import { HeatLegend } from '../components/map/HeatLegend';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

const QUICK_ACTIONS = [
  { to: '/heat-risk', icon: 'flame', label: 'Heat Risk' },
  { to: '/nearby', icon: 'pin', label: 'Nearby Help' },
  { to: '/safety', icon: 'heart', label: 'Safety' },
  { to: '/assistant', icon: 'bot', label: 'AI Assistant' },
];

export function Home() {
  const navigate = useNavigate();
  const { currentLocation } = useApp();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [heatGrid, setHeatGrid] = useState([]);
  const [score, setScore] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);

  useEffect(() => {
    if (currentLocation && !origin) {
      setOrigin({ lat: currentLocation.lat, lon: currentLocation.lon, label: 'Current location' });
    }
  }, [currentLocation, origin]);

  useEffect(() => {
    const loc = currentLocation;
    if (!loc) return;
    setLoadingScore(true);
    api.heatScore(loc.lat, loc.lon).then(setScore).catch(() => {}).finally(() => setLoadingScore(false));
    api.heatGrid(loc.lat, loc.lon, 1000, 5).then((r) => setHeatGrid(r.points)).catch(() => {});
  }, [currentLocation]);

  function goPlanRoute() {
    navigate('/route', { state: { origin, destination } });
  }

  return (
    <div>
      <TopBar title="HeatScape 360" subtitle="Cooler Cities. Safer Lives." />

      <div className="px-4 md:px-6 pb-8 space-y-4 max-w-3xl">
        <Card className="space-y-2.5">
          <AddressInput placeholder="Enter current location" value={origin} onSelect={setOrigin} />
          <AddressInput placeholder="Enter destination" value={destination} onSelect={setDestination} allowCurrentLocation={false} />
          <Button className="w-full" onClick={goPlanRoute} disabled={!origin || !destination}>
            <Icon name="route" size={16} /> Find a heat-safe route
          </Button>
        </Card>

        {currentLocation && (
          <Card padded={false} className="overflow-hidden">
            <div className="h-56 relative">
              <MapView
                center={[currentLocation.lat, currentLocation.lon]}
                zoom={14}
                heatPoints={heatGrid}
                markers={[{ id: 'me', lat: currentLocation.lat, lon: currentLocation.lon, dot: true, color: '#2d6e3a' }]}
              />
              <HeatLegend className="absolute left-3 bottom-3" />
              <button
                onClick={() => navigate('/map')}
                className="absolute right-3 bottom-3 bg-white shadow-card rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-800"
              >
                Open full map
              </button>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-950">Live Heat Risk</p>
              <p className="text-xs text-brand-950/50 mt-0.5">Your current location</p>
            </div>
            {score && <HeatBadge level={score.riskLevel} score={score.score} />}
          </div>

          {!currentLocation && (
            <p className="text-sm text-brand-950/60 mt-3">
              Turn on location access to see live heat risk for where you are.
            </p>
          )}
          {loadingScore && <p className="text-sm text-brand-950/40 mt-3">Checking conditions…</p>}
          {score && (
            <div className="mt-3 flex items-center gap-4 text-sm text-brand-950/70">
              {score.weather.temperatureC != null && (
                <span className="flex items-center gap-1.5">
                  <Icon name="sun" size={16} className="text-heat-high" />
                  {Math.round(score.weather.temperatureC)}°C
                  {score.weather.feelsLikeC != null && ` · feels ${Math.round(score.weather.feelsLikeC)}°C`}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Icon name="warning" size={16} className="text-brand-950/40" />
                {score.mainCause}
              </span>
            </div>
          )}
          {score && (
            <button
              className="mt-3 text-sm font-semibold text-brand-700"
              onClick={() => navigate('/heat-risk', { state: { lat: score.lat, lon: score.lon } })}
            >
              See full breakdown →
            </button>
          )}
        </Card>

        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.to}
              onClick={() => navigate(a.to)}
              className="flex flex-col items-center gap-1.5 bg-white rounded-xl2 shadow-card py-3.5 text-brand-800"
            >
              <Icon name={a.icon} size={20} />
              <span className="text-[11px] font-medium text-brand-950/70">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
