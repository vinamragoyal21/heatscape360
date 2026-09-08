import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../common/Icon';
import { NAV_ITEMS } from './nav';

const PRIMARY = NAV_ITEMS.filter((i) => i.primary);
const MORE = NAV_ITEMS.filter((i) => !i.primary);

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-16 left-3 right-3 bg-brand-900 rounded-2xl p-2 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE.map((item) => (
              <button
                key={item.to}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-brand-100 hover:bg-brand-800 text-sm font-medium"
                onClick={() => {
                  setMoreOpen(false);
                  navigate(item.to);
                }}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-brand-900 border-t border-white/10 safe-bottom">
        <div className="grid grid-cols-5">
          {PRIMARY.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  isActive ? 'text-white' : 'text-brand-100/50'
                }`
              }
            >
              <Icon name={item.icon} size={20} />
              {item.label.split(' ')[0]}
            </NavLink>
          ))}
          <button
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-brand-100/50"
            onClick={() => setMoreOpen((v) => !v)}
          >
            <Icon name="layers" size={20} />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
