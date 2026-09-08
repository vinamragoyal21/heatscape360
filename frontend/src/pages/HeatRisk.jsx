import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/common/Card';
import { Gauge } from '../components/common/Gauge';
import { Icon } from '../components/common/Icon';
import { AddressInput } from '../components/map/AddressInput';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

export function HeatRisk() {
  const navState = useLocation().state || {};
  const { currentLocation } = useApp();
  const [place, setPlace] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const lat = navState.lat ?? currentLocation?.lat;
    const lon = navState.lon ?? currentLocation?.lon;
    if (lat != null && lon != null && !place) {
      setPlace({ lat, lon, label: 'Current location' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation]);

  useEffect(() => {
    if (!place) return;
    setLoading(true);
    setError(null);
    api.heatScore(place.lat, place.lon).then(setScore).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [place]);

  return (
    <div>
      <TopBar title="Heat Risk Analysis" />
      <div className="px-4 md:px-6 pb-8 space-y-4 max-w-2xl">
        <AddressInput placeholder="Check a different location" value={place} onSelect={setPlace} />

        {loading && <p className="text-sm text-brand-950/40">Analyzing this location…</p>}
        {error && <p className="text-sm text-heat-veryhigh">{error}</p>}

        {score && !loading && (
          <>
            <Card className="flex flex-col items-center py-6">
              <Gauge score={score.score} level={score.riskLevel} />
              <p className="text-xs text-brand-950/40 mt-3">
                {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
                {!score.dataAvailable && ' · some live data unavailable, showing best estimate'}
              </p>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-brand-950 mb-3">Factor Breakdown</p>
              <div className="space-y-3">
                {Object.entries(score.factors)
                  .sort((a, b) => b[1].score - a[1].score)
                  .map(([key, f]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-brand-950/70 font-medium">{f.label}</span>
                        <span className="font-bold text-brand-950">{f.score}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-brand-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${f.score}%`,
                            background: f.score > 70 ? '#e5484d' : f.score > 45 ? '#f0883e' : '#3fb950',
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-brand-950 mb-2">What this means</p>
              <p className="text-sm text-brand-950/70 leading-relaxed">
                {score.factors.builtUp.score > 55 && score.factors.greenery.score > 55
                  ? 'High built-up density and low tree canopy are keeping this area hotter than its surroundings.'
                  : 'This area\'s risk score comes mostly from ' + score.mainCause.toLowerCase() + '.'}
              </p>
              <div className="mt-3 rounded-lg bg-heat-veryhigh/10 px-3 py-2">
                <p className="text-[11px] text-heat-veryhigh/60 font-semibold uppercase tracking-wide">Main cause</p>
                <p className="text-xs text-heat-veryhigh/90 font-medium">{score.mainCause}</p>
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-brand-950 mb-3">Suggested fixes</p>
              <div className="grid grid-cols-1 gap-2">
                {score.recommendations.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-black/5 px-3 py-2.5">
                    <span className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                      <Icon name={r.icon} size={16} />
                    </span>
                    <span className="text-sm text-brand-950/80">{r.text}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/cost-estimate"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
              >
                Estimate the cost of these fixes <Icon name="chevronRight" size={14} />
              </Link>
            </Card>

            {score.weather.temperatureC != null && (
              <p className="text-xs text-brand-950/40 text-center">
                Live reading: {Math.round(score.weather.temperatureC)}°C, feels like{' '}
                {Math.round(score.weather.feelsLikeC ?? score.weather.temperatureC)}°C (Open-Meteo)
                {score.nearestWaterMeters != null && ` · nearest water ${Math.round(score.nearestWaterMeters)} m away`}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
