import L from 'leaflet';

// We build markers as inline-SVG divIcons instead of Leaflet's default PNG
// marker images, so there's no bundler asset-path fixup needed and the pins
// match the app's own icon style/colors exactly.
function pinSvg(color, glyph) {
  return `
    <svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="9" fill="white"/>
      <g transform="translate(7.5,7.5)">${glyph}</g>
    </svg>`;
}

const GLYPHS = {
  origin: '<circle cx="7.5" cy="7.5" r="5" fill="#1a4527"/>',
  destination: '<path d="M7.5 1 13 12H2z" fill="#e5484d"/>',
  cooling: '<path d="M7.5 0v15M0 7.5h15M2.5 2.5l10 10M12.5 2.5l-10 10" stroke="#2d6e3a" stroke-width="1.6"/>',
  water: '<path d="M7.5 0S1 8.5 1 12a6.5 6.5 0 0 0 13 0C14 8.5 7.5 0 7.5 0z" fill="#2b7fd6"/>',
  hospital: '<rect x="6" y="1" width="3" height="13" fill="#e5484d"/><rect x="1" y="6" width="13" height="3" fill="#e5484d"/>',
  shade: '<circle cx="7.5" cy="5" r="5" fill="#3fb950"/><rect x="6.5" y="9" width="2" height="6" fill="#3fb950"/>',
  zone: '<path d="M7.5 0S1 8.5 1 12a6.5 6.5 0 0 0 13 0C14 8.5 7.5 0 7.5 0z" fill="#e5484d"/>',
};

export function pinIcon(kind, color) {
  const colors = { origin: '#1a4527', destination: '#e5484d', cooling: '#2d6e3a', water: '#2b7fd6', hospital: '#e5484d', shade: '#3fb950', zone: '#e5484d' };
  const html = pinSvg(color || colors[kind] || '#1a4527', GLYPHS[kind] || '');
  return L.divIcon({ html, className: '', iconSize: [30, 38], iconAnchor: [15, 38], popupAnchor: [0, -32] });
}

export function dotIcon(color, sizePx = 14) {
  const html = `<div style="width:${sizePx}px;height:${sizePx}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 2px ${color}55"></div>`;
  return L.divIcon({ html, className: '', iconSize: [sizePx, sizePx], iconAnchor: [sizePx / 2, sizePx / 2] });
}
