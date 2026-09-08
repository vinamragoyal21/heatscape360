import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { Home } from './pages/Home';
import { LiveMap } from './pages/LiveMap';
import { RoutePlanner } from './pages/RoutePlanner';
import { HeatRisk } from './pages/HeatRisk';
import { NearbyAssistance } from './pages/NearbyAssistance';
import { SafetyFirstAid } from './pages/SafetyFirstAid';
import { AIAssistant } from './pages/AIAssistant';
import { Settings } from './pages/Settings';
import { CostEstimate } from './pages/CostEstimate';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<LiveMap />} />
            <Route path="/route" element={<RoutePlanner />} />
            <Route path="/heat-risk" element={<HeatRisk />} />
            <Route path="/nearby" element={<NearbyAssistance />} />
            <Route path="/safety" element={<SafetyFirstAid />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/cost-estimate" element={<CostEstimate />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
