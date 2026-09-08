import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { useApp } from '../context/AppContext';

const STEPS = [
  { icon: 'tree', text: 'Get to shade immediately' },
  { icon: 'droplet', text: 'Sip water slowly (not too much at once)' },
  { icon: 'wind', text: 'Loosen or remove tight clothing' },
  { icon: 'droplet', text: 'Cool with a wet cloth (neck, wrists, forehead)' },
  { icon: 'heart', text: 'If dizzy, sit or lie down with legs slightly raised' },
];

export function SafetyFirstAid() {
  const { openEmergency } = useApp();

  return (
    <div>
      <TopBar title="What to do if someone is overheating" />
      <div className="px-4 md:px-6 pb-8 space-y-4 max-w-2xl">
        <Card>
          <p className="text-sm font-semibold text-brand-950 mb-3">Quick steps</p>
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="h-8 w-8 shrink-0 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-brand-950/80">{s.text}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="!bg-heat-veryhigh/10 border border-heat-veryhigh/20">
          <div className="flex gap-3">
            <Icon name="warning" size={20} className="text-heat-veryhigh shrink-0" />
            <div>
              <p className="text-sm font-bold text-heat-veryhigh">This could be heat stroke</p>
              <p className="text-sm text-heat-veryhigh/80 mt-1 leading-relaxed">
                If they stop sweating, seem confused, or start vomiting - that's a real medical emergency. Get
                medical help right away instead of just suggesting water and rest.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-brand-950 mb-1">Need help nearby?</p>
          <p className="text-xs text-brand-950/60 mb-3">
            Use your location to find the nearest cooling station, shaded spot, water point or pharmacy/hospital.
          </p>
          <Button className="w-full" variant="danger" onClick={openEmergency}>
            <Icon name="heart" size={16} /> I'm not feeling well / feeling too hot
          </Button>
        </Card>
      </div>
    </div>
  );
}
