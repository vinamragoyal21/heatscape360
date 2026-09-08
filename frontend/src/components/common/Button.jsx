const VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900',
  outline: 'border border-brand-700/30 text-brand-800 hover:bg-brand-100',
  danger: 'bg-heat-veryhigh text-white hover:brightness-95',
  ghost: 'text-brand-800 hover:bg-brand-100',
};

export function Button({ children, variant = 'primary', className = '', icon, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
