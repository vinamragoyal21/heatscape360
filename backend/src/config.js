import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  openaiKey: process.env.OPENAI_API_KEY || '',
  overpassUrl: process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter',
  osrmUrl: process.env.OSRM_URL || 'https://router.project-osrm.org',
};
