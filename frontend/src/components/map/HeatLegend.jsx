const LEVELS = [
  { label: 'Low', color: '#3fb950' },
  { label: 'Moderate', color: '#e3b341' },
  { label: 'High', color: '#f0883e' },
  { label: 'Very High', color: '#e5484d' },
];

export function HeatLegend({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-card text-[11px] font-medium text-brand-950/70 ${className}`}>
      {LEVELS.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
          {l.label}
        </span>
      ))}
    </div>
  );
}
