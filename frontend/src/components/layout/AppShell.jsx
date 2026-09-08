import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Icon } from '../common/Icon';
import { EmergencyModal } from './EmergencyModal';
import { useApp } from '../../context/AppContext';

const TITLES = {
  '/': ['Home', 'Real-time heat insights for your area'],
  '/map': ['Live Map', 'Satellite + ground data heat overlay'],
  '/route': ['Route Planner', 'Compare heat-aware vs shortest routes'],
  '/heat-risk': ['Heat Risk', 'Why this area is hot, and what helps'],
  '/safety': ['Safety & First Aid', 'What to do if someone is overheating'],
  '/nearby': ['Nearby Assistance', 'Cooling stations, water, hospitals'],
  '/assistant': ['AI Assistant', 'Ask about heat risk, routes or safety'],
  '/settings': ['Settings', 'Profile, data sources & notifications'],
};

export function AppShell() {
  const { pathname } = useLocation();
  const { emergencyOpen, openEmergency, closeEmergency } = useApp();
  const showFab = pathname !== '/onboarding';

  return (
    <div className="min-h-screen md:flex bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />

      {showFab && (
        <button
          onClick={openEmergency}
          className="fixed z-30 right-4 bottom-20 md:bottom-6 h-14 w-14 rounded-full bg-heat-veryhigh text-white shadow-card flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]"
          aria-label="I'm not feeling well"
          title="I'm not feeling well"
        >
          <Icon name="heart" size={24} />
        </button>
      )}

      <EmergencyModal open={emergencyOpen} onClose={closeEmergency} />
    </div>
  );
}

export function pageTitle(pathname) {
  return TITLES[pathname] || ['HeatScape 360', ''];
}
