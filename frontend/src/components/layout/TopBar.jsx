import { Icon } from '../common/Icon';
import { useApp } from '../../context/AppContext';

export function TopBar({ title, subtitle }) {
  const { settings } = useApp();
  return (
    <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-2">
      <div>
        <h1 className="text-lg font-extrabold text-brand-950">{title}</h1>
        {subtitle && <p className="text-xs text-brand-950/50">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="h-9 w-9 rounded-full bg-white shadow-card flex items-center justify-center text-brand-800 relative">
          <Icon name="bell" size={17} />
          {settings.notifications.heatAlerts && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-heat-veryhigh" />
          )}
        </button>
        <div className="h-9 w-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold">
          {settings.profileName?.[0]?.toUpperCase() || 'G'}
        </div>
      </div>
    </div>
  );
}
