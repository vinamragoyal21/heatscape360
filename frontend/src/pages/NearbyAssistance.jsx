import { useEffect, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { MapView } from '../components/map/MapView';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

const TABS = [
  { id: 'cooling', label: 'Cooling Stations', icon: 'sun' },
  { id: 'water', label: 'Water Points', icon: 'droplet' },
  { id: 'hospital', label: 'Hospitals', icon: 'hospital' },
  { id: 'shade', label: 'Shade Spots', icon: 'tree' },
];

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function NearbyAssistance() {
  const { currentLocation, requestLocation, locationStatus } = useApp();
  const [tab, setTab] = useState('cooling');
  const [data, setData] = useState({ pois: [], dataAvailable: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentLocation) {
      requestLocation();
      return;
    }
    setLoading(true);
    api
      .nearby(currentLocation.lat, currentLocation.lon, tab, 2000)
      .then(setData)
      .catch(() => setData({ pois: [], dataAvailable: false }))
      .finally(() => setLoading(false));
  }, [currentLocation, tab, requestLocation]);

  const center = currentLocation ? [currentLocation.lat, currentLocation.lon] : [28.6139, 77.209];

  return (
    <div className="md:flex md:h-screen">
      <div className="md:w-[420px] md:h-screen md:overflow-y-auto md:border-r md:border-black/5 bg-surface">
        <TopBar title="Nearby Assistance" subtitle="Find help near you, from live map data" />
        <div className="px-4 md:px-6 pb-8 space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ${
                  tab === t.id ? 'bg-brand-700 text-white' : 'bg-white text-brand-950/60 shadow-card'
                }`}
              >
                <Icon name={t.icon} size={14} /> {t.label}
              </button>
            ))}
          </div>

          {!currentLocation && (
            <Card>
              <p className="text-sm text-brand-950/60">
                {locationStatus === 'denied'
                  ? 'Location access was denied - enable it in your browser settings to see nearby help.'
                  : 'Getting your location…'}
              </p>
            </Card>
          )}

          {loading && <p className="text-sm text-brand-950/40 px-1">Loading…</p>}
          {!loading && currentLocation && !data.dataAvailable && (
            <Card>
              <p className="text-sm text-heat-veryhigh">
                Live map data is temporarily unavailable for this area. Try again in a moment.
              </p>
            </Card>
          )}
          {!loading && currentLocation && data.dataAvailable && data.pois.length === 0 && (
            <Card>
              <p className="text-sm text-brand-950/60">No results found within 2 km. Try a different category.</p>
            </Card>
          )}

          <div className="space-y-2.5">
            {data.pois.map((p) => (
              <Card key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                    <Icon name={TABS.find((t) => t.id === tab)?.icon} size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-950 truncate">{p.name}</p>
                    <p className="text-xs text-brand-950/50">{fmtDist(p.distanceM)} away</p>
                  </div>
                </div>
                <a
                  href={`https://www.openstreetmap.org/directions?to=${p.lat}%2C${p.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand-700 shrink-0"
                >
                  Get Directions
                </a>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 relative h-[45vh] md:h-full">
        <MapView
          center={center}
          zoom={14}
          markers={[
            ...(currentLocation ? [{ id: 'me', lat: currentLocation.lat, lon: currentLocation.lon, dot: true, color: '#2d6e3a' }] : []),
            ...data.pois.map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, kind: p.category, popup: p.name })),
          ]}
        />
      </div>
    </div>
  );
}
