import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);

const SETTINGS_KEY = 'heatscape360.settings.v1';

const DEFAULT_SETTINGS = {
  profileName: 'Guest',
  notifications: { heatAlerts: true, routeSuggestions: true, nearbyAssistance: true },
  mapDefaultStyle: 'heat', // 'heat' | 'satellite'
  useMyLocation: true,
  showHeatLayer: true,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);
  const [currentLocation, setCurrentLocation] = useState(null); // { lat, lon, label, accuracyM }
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | locating | granted | denied | error
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota errors */
    }
  }, [settings]);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          label: 'Current location',
        });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (settings.useMyLocation) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      currentLocation,
      setCurrentLocation,
      locationStatus,
      requestLocation,
      emergencyOpen,
      openEmergency: () => setEmergencyOpen(true),
      closeEmergency: () => setEmergencyOpen(false),
    }),
    [settings, updateSettings, currentLocation, locationStatus, requestLocation, emergencyOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
