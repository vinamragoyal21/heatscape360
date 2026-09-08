import { cache, gridKey } from './cache.service.js';

// Open-Meteo is a free, no-API-key weather API. We use it to calibrate the
// satellite-style "land surface temperature" estimate against a real,
// current, ground-level reading for the point being scored.
// Docs: https://open-meteo.com/en/docs

export async function getCurrentWeather(lat, lon) {
  const key = gridKey('weather', lat, lon, 2); // ~1.1km cells, weather doesn't need finer
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m');
  url.searchParams.set('timezone', 'auto');

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
    const data = await res.json();
    const c = data.current || {};
    const result = {
      temperatureC: typeof c.temperature_2m === 'number' ? c.temperature_2m : null,
      feelsLikeC: typeof c.apparent_temperature === 'number' ? c.apparent_temperature : null,
      humidity: typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : null,
      windSpeedKmh: typeof c.wind_speed_10m === 'number' ? c.wind_speed_10m : null,
      weatherCode: c.weather_code ?? null,
      source: 'open-meteo',
      fetchedAt: new Date().toISOString(),
    };
    cache.set(key, result, 900); // 15 min
    return result;
  } catch (err) {
    // Never let a weather hiccup break the heat model - fall back to a
    // conservative estimate and flag it so the UI can be honest about it.
    return {
      temperatureC: null,
      feelsLikeC: null,
      humidity: null,
      windSpeedKmh: null,
      weatherCode: null,
      source: 'unavailable',
      error: err.message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

export function describeWeatherCode(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
    80: 'Rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
  };
  return map[code] || 'Weather data unavailable';
}
