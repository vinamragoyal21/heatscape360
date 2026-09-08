import { Link } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { useApp } from '../context/AppContext';

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-brand-700' : 'bg-black/15'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-brand-950/80">{label}</span>
      {children}
    </div>
  );
}

export function Settings() {
  const { settings, updateSettings, currentLocation, locationStatus, requestLocation } = useApp();

  return (
    <div>
      <TopBar title="Settings" />
      <div className="px-4 md:px-6 pb-8 space-y-4 max-w-2xl">
        <Card>
          <p className="text-sm font-semibold text-brand-950 mb-1">Profile</p>
          <input
            className="w-full text-sm rounded-lg border border-black/10 px-3 py-2 mt-2"
            value={settings.profileName}
            onChange={(e) => updateSettings({ profileName: e.target.value })}
            placeholder="Your name"
          />
        </Card>

        <Card>
          <p className="text-sm font-semibold text-brand-950 mb-1">Notifications</p>
          <div className="divide-y divide-black/5">
            <Row label="Heat alerts">
              <Toggle
                checked={settings.notifications.heatAlerts}
                onChange={(v) => updateSettings({ notifications: { ...settings.notifications, heatAlerts: v } })}
              />
            </Row>
            <Row label="Route suggestions">
              <Toggle
                checked={settings.notifications.routeSuggestions}
                onChange={(v) => updateSettings({ notifications: { ...settings.notifications, routeSuggestions: v } })}
              />
            </Row>
            <Row label="Nearby assistance">
              <Toggle
                checked={settings.notifications.nearbyAssistance}
                onChange={(v) => updateSettings({ notifications: { ...settings.notifications, nearbyAssistance: v } })}
              />
            </Row>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-brand-950 mb-1">Map & Location</p>
          <div className="divide-y divide-black/5">
            <Row label="Default map style">
              <select
                className="text-sm rounded-lg border border-black/10 px-2 py-1.5"
                value={settings.mapDefaultStyle}
                onChange={(e) => updateSettings({ mapDefaultStyle: e.target.value })}
              >
                <option value="heat">Heat risk (default)</option>
                <option value="satellite">Satellite</option>
              </select>
            </Row>
            <Row label="Use my location">
              <Toggle checked={settings.useMyLocation} onChange={(v) => { updateSettings({ useMyLocation: v }); if (v) requestLocation(); }} />
            </Row>
            <Row label="Show heat layer">
              <Toggle checked={settings.showHeatLayer} onChange={(v) => updateSettings({ showHeatLayer: v })} />
            </Row>
          </div>
          <p className="text-xs text-brand-950/40 mt-2">
            Location: {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}` : locationStatus}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-brand-950 mb-2">Data Sources</p>
          <ul className="text-sm text-brand-950/70 space-y-1.5">
            <li>• Weather & temperature - Open-Meteo (live)</li>
            <li>• Roads, buildings, greenery, water - OpenStreetMap / Overpass</li>
            <li>• Address search - OpenStreetMap Nominatim</li>
            <li>• Routing - OSRM, snapped to the real road network</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-950">Cost Estimate calculator</p>
              <p className="text-xs text-brand-950/50">Plan cool-roof and tree-planting budgets</p>
            </div>
            <Link to="/cost-estimate" className="text-brand-700">
              <Icon name="chevronRight" size={18} />
            </Link>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-brand-950 mb-1">About HeatScape 360</p>
          <p className="text-xs text-brand-950/50">Version 1.0.0 · Built for cooler, healthier, more sustainable cities.</p>
        </Card>
      </div>
    </div>
  );
}
