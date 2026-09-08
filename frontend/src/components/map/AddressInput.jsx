import { useEffect, useRef, useState } from 'react';
import { Icon } from '../common/Icon';
import { api } from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { useApp } from '../../context/AppContext';

// A real address search box with live autocomplete (OpenStreetMap Nominatim,
// biased toward the user's current location) plus a "use my current
// location" shortcut - the same interaction pattern as Google Maps' search
// boxes, without requiring a billed API key.
export function AddressInput({ placeholder, value, onSelect, allowCurrentLocation = true }) {
  const { currentLocation, requestLocation, locationStatus } = useApp();
  const [query, setQuery] = useState(value?.label || '');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const boxRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    setQuery(value?.label || '');
  }, [value]);

  useEffect(() => {
    if (!open || debouncedQuery.trim().length < 3) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    api
      .geocodeSearch(debouncedQuery, currentLocation ? [currentLocation.lat, currentLocation.lon] : null, controller.signal)
      .then((r) => setResults(r.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQuery, open, currentLocation]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function selectResult(r) {
    onSelect({ lat: r.lat, lon: r.lon, label: r.label });
    setQuery(r.label);
    setOpen(false);
  }

  function useCurrentLocation() {
    if (currentLocation) {
      onSelect({ lat: currentLocation.lat, lon: currentLocation.lon, label: 'Current location' });
      setQuery('Current location');
      setOpen(false);
    } else {
      requestLocation();
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <div className="flex items-center gap-2 bg-white rounded-xl border border-black/10 px-3 py-2.5 focus-within:border-brand-500">
        <Icon name="search" size={16} className="text-brand-950/40 shrink-0" />
        <input
          className="flex-1 min-w-0 text-sm outline-none placeholder:text-brand-950/40"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {allowCurrentLocation && (
          <button
            type="button"
            title="Use my current location"
            onClick={useCurrentLocation}
            className="text-brand-700 shrink-0"
          >
            <Icon name="target" size={17} />
          </button>
        )}
      </div>

      {open && (query.trim().length >= 3 || (allowCurrentLocation && currentLocation)) && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-card border border-black/5 overflow-hidden max-h-64 overflow-y-auto">
          {allowCurrentLocation && (
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-brand-100/60 border-b border-black/5"
              onClick={useCurrentLocation}
            >
              <Icon name="target" size={16} className="text-brand-700" />
              <span className="font-medium text-brand-800">
                {locationStatus === 'locating' ? 'Locating…' : 'Use my current location'}
              </span>
            </button>
          )}
          {loading && <div className="px-3 py-2.5 text-xs text-brand-950/40">Searching…</div>}
          {!loading && results.length === 0 && query.trim().length >= 3 && (
            <div className="px-3 py-2.5 text-xs text-brand-950/40">No matches yet - keep typing…</div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-brand-100/60"
              onClick={() => selectResult(r)}
            >
              <Icon name="pin" size={16} className="text-brand-950/40 mt-0.5 shrink-0" />
              <span className="text-brand-950/80 line-clamp-2">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
