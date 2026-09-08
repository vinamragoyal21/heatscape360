// Small hand-rolled icon set (no extra icon-library dependency). Each icon
// is a simple stroke-based SVG that inherits `currentColor`.
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9',
  map: 'M9 3v15M15 6v15M3 6.5l6-2.5 6 2.5 6-2.5v15l-6 2.5-6-2.5-6 2.5V6.5Z',
  route: 'M5 19c3 0 3-6 6-6s3 6 6 6M5 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm14 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  flame: 'M12 2c1 3-3 4-3 8a3 3 0 0 0 6 0c1 1 1 3 1 4a5 5 0 1 1-10-2c0-4 4-5 6-10Z',
  heart: 'M12 21s-7-4.35-9.5-8.5C.5 8.5 3 5 6.5 5c2 0 3.5 1.5 4 2.5C11 6.5 12.5 5 14.5 5 18 5 20.5 8.5 18.5 12.5 16 16.65 12 21 12 21Z',
  pin: 'M12 22s7-7.58 7-12.5A7 7 0 0 0 5 9.5C5 14.42 12 22 12 22Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  bot: 'M9 8V5a3 3 0 1 1 6 0v3M4 12h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Zm0 0a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2M9 16h.01M15 16h.01',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5c0 .66-.06 1.3-.17 1.92l2.02 1.58-2 3.46-2.36-.96a7.4 7.4 0 0 1-1.66.97L15.4 21h-4l-.43-2.53a7.4 7.4 0 0 1-1.66-.97l-2.36.96-2-3.46 2.02-1.58A8 8 0 0 1 4 12c0-.66.06-1.3.17-1.92L2.15 8.5l2-3.46 2.36.96c.5-.4 1.06-.73 1.66-.97L8.6 1.5h4l.43 2.53c.6.24 1.16.57 1.66.97l2.36-.96 2 3.46-2.02 1.58c.11.62.17 1.26.17 1.92Z',
  chevronRight: 'M9 18l6-6-6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  close: 'M6 6l12 12M18 6 6 18',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  target: 'M12 2v3m0 14v3M2 12h3m14 0h3M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  swap: 'M7 4v13M7 4 3 8m4-4 4 4M17 20V7m0 13 4-4m-4 4-4-4',
  droplet: 'M12 2s7 8.5 7 13a7 7 0 1 1-14 0c0-4.5 7-13 7-13Z',
  tree: 'M12 2 6 11h3l-4 6h5v5h4v-5h5l-4-6h3L12 2Z',
  roof: 'M3 12 12 4l9 8M6 11v9h12v-9',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h8',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.42-1.42M4.92 19.08l1.42-1.42M19.08 19.08l-1.42-1.42M4.92 4.92 6.34 6.34M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  warning: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  info: 'M12 16v-4m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  logo: 'M12 2c2 5-4 6-4 11a4 4 0 0 0 8 0c1 1 2 3 2 5a6 6 0 1 1-12 0c0-7 5-9 6-16Z',
  hospital: 'M12 3v6m-3-3h6M4 21V5a1 1 0 0 1 1-1h5v4h4V4h5a1 1 0 0 1 1 1v16H4Zm5-4h6',
  train: 'M6 2h12a2 2 0 0 1 2 2v11a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V4a2 2 0 0 1 2-2Zm0 0v0M8 21l-2 2m10-2 2 2M4 11h16M9 17h.01M15 17h.01',
  layers: 'M12 2 2 7l10 5 10-5-10-5Zm0 10-10 5 10 5 10-5-10-5Z',
  car: 'M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13m-18 0v5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-5m-18 0h18M7 16h.01M17 16h.01',
  bike: 'M5 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 16l4-7h5l3 7M9 9 7 5h3',
};

export function Icon({ name, size = 20, className = '', strokeWidth = 1.8 }) {
  const d = PATHS[name] || PATHS.info;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
