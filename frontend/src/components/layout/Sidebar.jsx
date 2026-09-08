import { NavLink } from 'react-router-dom';
import { Icon } from '../common/Icon';
import { NAV_ITEMS } from './nav';

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-brand-900 text-brand-100 shrink-0 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Icon name="logo" size={18} className="text-white" />
        </div>
        <div>
          <p className="font-extrabold text-white leading-tight">HeatScape 360</p>
          <p className="text-[11px] text-brand-100/60 leading-tight">Cooler Cities. Safer Lives.</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-700 text-white' : 'text-brand-100/70 hover:bg-brand-800 hover:text-white'
              }`
            }
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 text-xs text-brand-100/50">
        Greener today, cooler tomorrow.
      </div>
    </aside>
  );
}
