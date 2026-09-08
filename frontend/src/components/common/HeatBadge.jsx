const LEVEL_STYLES = {
  Low: 'bg-heat-low/15 text-heat-low',
  Moderate: 'bg-heat-moderate/20 text-[#8a6a12]',
  High: 'bg-heat-high/15 text-heat-high',
  'Very High': 'bg-heat-veryhigh/15 text-heat-veryhigh',
};

export function riskColor(level) {
  return { Low: '#3fb950', Moderate: '#e3b341', High: '#f0883e', 'Very High': '#e5484d' }[level] || '#6b7280';
}

export function HeatBadge({ level, score }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${LEVEL_STYLES[level] || 'bg-gray-100 text-gray-600'}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: riskColor(level) }} />
      {level} risk{typeof score === 'number' ? ` · ${score}/100` : ''}
    </span>
  );
}
