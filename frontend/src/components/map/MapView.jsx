import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { riskColor } from '../common/HeatBadge';
import { pinIcon, dotIcon } from './icons';

const TILE_LAYERS = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    // Esri World Imagery - free, no API key, real satellite/aerial tiles.
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
  },
};

// Leaflet needs an explicit pixel height on its container and needs to be
// told when that container is resized (e.g. after a tab switch on mobile,
// or a sidebar collapsing) - missing this is the classic cause of a map
// that renders blank/broken on phones. This component fixes both.
function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const invalidate = () => map.invalidateSize();
    const raf = requestAnimationFrame(invalidate);
    const t = setTimeout(invalidate, 250);
    const ro = new ResizeObserver(() => invalidate());
    ro.observe(container);
    window.addEventListener('orientationchange', invalidate);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener('orientationchange', invalidate);
    };
  }, [map]);
  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (!center) return;
    if (first.current) {
      map.setView(center, zoom ?? map.getZoom());
      first.current = false;
    } else {
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48] });
    }
  }, [bounds, map]);
  return null;
}

export function MapView({
  center = [28.6139, 77.209],
  zoom = 14,
  tileStyle = 'streets',
  heatPoints = [],
  markers = [],
  routes = [],
  bounds = null,
  onMapClick,
  className = '',
  children,
}) {
  const tile = TILE_LAYERS[tileStyle] || TILE_LAYERS.streets;

  return (
    <div className={`relative w-full h-full min-h-[280px] ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="w-full h-full rounded-none"
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} maxZoom={19} />
        <ResizeHandler />
        <FlyTo center={center} zoom={zoom} />
        {bounds && <FitBounds bounds={bounds} />}
        {onMapClick && <ClickHandler onClick={onMapClick} />}

        {heatPoints.map((p, i) => (
          <Circle
            key={i}
            center={[p.lat, p.lon]}
            radius={p.radiusM || 140}
            pathOptions={{
              color: riskColor(p.riskLevel),
              fillColor: riskColor(p.riskLevel),
              fillOpacity: 0.28,
              opacity: 0.35,
              weight: 1,
            }}
          />
        ))}

        {routes.map((r, i) => (
          <Polyline
            key={i}
            positions={r.geometry}
            pathOptions={{
              color: r.color || (r.isRecommended ? '#2d6e3a' : '#9aa5a0'),
              weight: r.isRecommended ? 6 : 4,
              opacity: r.isRecommended ? 0.95 : 0.6,
              dashArray: r.dashed ? '2 10' : undefined,
            }}
          />
        ))}

        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lon]} icon={m.dot ? dotIcon(m.color) : pinIcon(m.kind, m.color)}>
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}

        {children}
      </MapContainer>
    </div>
  );
}
