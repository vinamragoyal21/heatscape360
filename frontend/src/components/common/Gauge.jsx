import { riskColor } from './HeatBadge';

// Circular heat-score gauge, matching the "72/100 High Risk" dial in the design.
export function Gauge({ score = 0, level = 'Moderate', size = 160 }) {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const dash = circumference * pct;
  const color = riskColor(level);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2ea" strokeWidth="12" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-brand-950">{score}</span>
        <span className="text-xs text-brand-950/50">/ 100</span>
        <span className="mt-1 text-sm font-semibold" style={{ color }}>{level} Risk</span>
      </div>
    </div>
  );
}
