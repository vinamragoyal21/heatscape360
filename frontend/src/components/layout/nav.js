// Single source of truth for navigation, shared by the desktop Sidebar and
// the mobile BottomNav/More sheet so both surfaces always stay in sync.
export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home', primary: true },
  { to: '/map', label: 'Live Map', icon: 'map', primary: true },
  { to: '/route', label: 'Route Planner', icon: 'route', primary: true },
  { to: '/heat-risk', label: 'Heat Risk', icon: 'flame', primary: true },
  { to: '/safety', label: 'Safety & First Aid', icon: 'heart', primary: false },
  { to: '/nearby', label: 'Nearby Assistance', icon: 'pin', primary: false },
  { to: '/assistant', label: 'AI Assistant', icon: 'bot', primary: false },
  { to: '/settings', label: 'Settings', icon: 'settings', primary: false },
];
