export function Card({ children, className = '', padded = true }) {
  return (
    <div className={`bg-surface-card rounded-xl2 shadow-card ${padded ? 'p-4' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h3 className="font-semibold text-brand-950 text-[15px]">{title}</h3>
        {subtitle && <p className="text-xs text-brand-950/60 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
