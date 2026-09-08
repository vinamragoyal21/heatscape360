// Built-in heat-safety knowledge base. This powers the AI Assistant when no
// LLM API key is configured, AND is passed to the LLM as grounding context
// when one is, so answers stay consistent and safe either way.

export const HEAT_SAFETY_STEPS = [
  { step: 1, text: 'Get to shade immediately.' },
  { step: 2, text: 'Sip water slowly (not too much at once, no gulping).' },
  { step: 3, text: 'Loosen or remove tight/extra clothing.' },
  { step: 4, text: 'Cool the body with a wet cloth on the neck, wrists, and forehead.' },
  { step: 5, text: 'If dizzy, sit or lie down with legs slightly raised.' },
];

export const HEAT_STROKE_WARNING =
  'If they stop sweating, seem confused, or start vomiting - that can be heat stroke, a real medical emergency. Get medical help right away instead of just water and rest.';

export const FAQ = [
  {
    keywords: ['heat stroke', 'stopped sweating', 'confused', 'vomit', 'emergency'],
    answer: `${HEAT_STROKE_WARNING} While waiting for help: move the person to shade or a cooled space, remove excess clothing, and cool their skin with cool (not ice-cold) wet cloths on the neck, wrists and forehead. Do not force them to drink if they are not fully alert.`,
  },
  {
    keywords: ['not feeling well', 'feel dizzy', 'overheating', 'too hot', 'heat exhaustion'],
    answer: `Here's what to do right now: ${HEAT_SAFETY_STEPS.map((s) => s.text).join(' ')} ${HEAT_STROKE_WARNING} Tap "I'm not feeling well" on the Home screen to find the nearest cooling station, shade, water point, or pharmacy using your location.`,
  },
  {
    keywords: ['route', 'directions', 'navigate', 'walk', 'path'],
    answer: 'Open Route Planner, enter your start and destination (or use "current location"), and HeatScape 360 will compare a heat-aware route against the shortest route - it adds each street\'s heat risk as an extra "cost" on top of distance, then picks the path with the lowest combined heat + distance cost. It always gives you a route, even if some heat is unavoidable.',
  },
  {
    keywords: ['heat score', 'risk score', 'why is this area hot', 'why is it hot', 'main cause'],
    answer: 'The heat score (0-100) combines five factors - temperature, greenery, built-up density, nearby water, and airflow - each weighted, with temperature weighted highest. The "main cause" is simply whichever factor(s) scored highest for that spot, and the recommended actions (more trees, reflective roofs, ventilation corridors, water points) are matched to that cause.',
  },
  {
    keywords: ['cost', 'estimate', 'budget', 'how much', 'price'],
    answer: 'Cost figures on the Cost Estimate screen are rough, order-of-magnitude estimates: cool-roof cost is scaled from a real past project (~Rs 12.5 Cr for 5 sq km in Ahmedabad), and tree-planting cost is scaled from a per-tree rate (~Rs 8.2 Lakh per 1,000 trees). These are planning estimates, not quotes - actual costs vary by location, materials and vendor.',
  },
  {
    keywords: ['vehicle', 'car', 'ac', 'engine'],
    answer: "This build of HeatScape 360 focuses on personal safety and city planning, not vehicle-specific heat effects, so that section has been removed to keep the app focused. I'm happy to help with routes, heat zones, or safety steps instead.",
  },
];

export function matchFAQ(message) {
  const lower = message.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const entry of FAQ) {
    const score = entry.keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best.answer : null;
}

export const DEFAULT_ANSWER =
  "I can help with heat risk in an area, heat-aware routes, safety steps for feeling overheated, or the cost estimates. Try asking something like \"why is this area hot?\", \"what should I do if I feel dizzy from heat?\", or \"how does the route avoid heat?\"";
