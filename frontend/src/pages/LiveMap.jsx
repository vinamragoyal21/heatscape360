import { useEffect, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { MapView } from '../components/map/MapView';
import { HeatLegend } from '../components/map/HeatLegend';
import { Icon } from '../components/common/Icon';
import { HeatBadge } from '../components/common/HeatBadge';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

export function LiveMap() {
  const { currentLocation, requestLocation } = useApp();
  const [tileStyle, setTileStyle] = useState('streets');
  const [heatGrid, setHeatGrid] = useState([]);
  const [selected, setSelected] = useState(null); // heat-score result for a clicked point
  const [loadingPoint, setLoadingPoint] = useState(false);
  const center = currentLocation ? [currentLocation.lat, currentLocation.lon] : [28.6139, 77.209];

  useEffect(() => {
    if (!currentLocation) return;
    api.heatGrid(currentLocation.lat, currentLocation.lon, 1400, 6).then((r) => setHeatGrid(r.points)).catch(() => {});
  }, [currentLocation]);

  async function handleMapClick(lat, lon) {
    setLoadingPoint(true);
    setSelected({ lat, lon, loading: true });
    try {
      const result = await api.heatScore(lat, lon);
      setSelected(result);
    } catch (err) {
      setSelected({ lat, lon, error: err.message });
    } finally {
      setLoadingPoint(false);
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar title="Live Map" subtitle="Tap anywhere to check heat risk" />
      <div className="flex-1 relative">
        <MapView
          center={center}
          zoom={15}
          tileStyle={tileStyle}
          heatPoints={heatGrid}
          onMapClick={handleMapClick}
          markers={[
            ...(currentLocation ? [{ id: 'me', lat: currentLocation.lat, lon: currentLocation.lon, dot: true, color: '#2d6e3a' }] : []),
            ...(selected && !selected.loading && !selected.error
              ? [{ id: 'sel', lat: selected.lat, lon: selected.lon, kind: 'zone', popup: null }]
              : []),
          ]}
        />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <HeatLegend />
          <div className="flex bg-white rounded-lg shadow-card overflow-hidden text-xs font-semibold">
            <button
              className={`px-3 py-2 ${tileStyle === 'streets' ? 'bg-brand-700 text-white' : 'text-brand-800'}`}
              onClick={() => setTileStyle('streets')}
            >
              Map
            </button>
            <button
              className={`px-3 py-2 ${tileStyle === 'satellite' ? 'bg-brand-700 text-white' : 'text-brand-800'}`}
              onClick={() => setTileStyle('satellite')}
            >
              Satellite
            </button>
          </div>
        </div>

        <button
          onClick={requestLocation}
          className="absolute right-3 bottom-6 md:bottom-3 h-11 w-11 bg-white rounded-full shadow-card flex items-center justify-center text-brand-800"
        >
          <Icon name="target" size={18} />
        </button>

        {selected && (
          <div className="absolute left-3 right-3 bottom-3 md:left-auto md:right-4 md:bottom-4 md:w-96">
            <div className="bg-white rounded-xl2 shadow-card p-4">
              <button className="absolute right-3 top-3 text-brand-950/40" onClick={() => setSelected(null)}>
                <Icon name="close" size={18} />
              </button>
              {loadingPoint || selected.loading ? (
                <p className="text-sm text-brand-950/50">Checking heat risk for this spot…</p>
              ) : selected.error ? (
                <p className="text-sm text-heat-veryhigh">Couldn't check this spot: {selected.error}</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="warning" size={16} className="text-heat-veryhigh" />
                    <p className="font-bold text-brand-950 text-sm">Heat Zone Detected</p>
                  </div>
                  <div className="mb-3"><HeatBadge level={selected.riskLevel} score={selected.score} /></div>

                  <p className="text-xs font-semibold text-brand-950/70 mb-1.5">Why this zone is hot</p>
                  <div className="space-y-1.5 mb-3">
                    {Object.entries(selected.factors)
                      .sort((a, b) => b[1].score - a[1].score)
                      .map(([key, f]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-brand-950/60">{f.label}</span>
                          <span className="font-semibold text-brand-950">{f.score}</span>
                        </div>
                      ))}
                  </div>

                  <div className="rounded-lg bg-heat-veryhigh/10 px-3 py-2 mb-3">
                    <p className="text-[11px] text-heat-veryhigh/60 font-semibold uppercase tracking-wide">Main cause</p>
                    <p className="text-xs text-heat-veryhigh/90 font-medium">{selected.mainCause}</p>
                  </div>

                  <p className="text-xs font-semibold text-brand-950/70 mb-1.5">Recommended actions</p>
                  <ul className="space-y-1">
                    {selected.recommendations.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-brand-950/70">
                        <Icon name={r.icon} size={14} className="text-brand-600" />
                        {r.text}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
