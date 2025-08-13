// server.js
// Load environment variables in local dev
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch').default; // node-fetch v3 CJS interop

const app = express();

// Use 8081 by default so it matches your Service (port/targetPort 8081)
const PORT = Number(process.env.PORT) || 8081;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// --- Startup logs -----------------------------------------------------------
console.log('weather-backend starting…');
if (!OPENWEATHER_API_KEY) {
  console.error('ERROR: OPENWEATHER_API_KEY is not set. /api/weather will fail.');
  console.warn('Inject it via an OpenShift Secret, or use a local .env file for dev.');
} else {
  console.log(
    'OpenWeather API key present (first 5 chars):',
    OPENWEATHER_API_KEY.substring(0, 5) + '…'
  );
}

// --- Middleware -------------------------------------------------------------
app.use(cors({ origin: '*' }));

// Serve static files (this will serve public/index.html at "/")
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes -----------------------------------------------------------------
app.get('/api/weather', async (req, res) => {
  const city = (req.query.city || '').trim();
  console.log(`Request: /api/weather?city=${city}`);

  if (!city) return res.status(400).json({ error: 'City parameter is required.' });
  if (!OPENWEATHER_API_KEY)
    return res.status(500).json({ error: 'Server missing OPENWEATHER_API_KEY.' });

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;

  try {
    console.log('Fetching:', url.split('&appid=')[0] + '&appid=…');
    const response = await fetch(url);
    const data = await response.json();
    console.log('Upstream status:', response.status);

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data?.message || 'Error from OpenWeather' });
    }

    const payload = {
      city: data.name,
      country: data.sys?.country,
      temperature: data.main?.temp,
      feelsLike: data.main?.feels_like,
      description: data.weather?.[0]?.description,
      icon: data.weather?.[0]?.icon,
      humidity: data.main?.humidity,
    };

    res.json(payload);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch weather data.' });
  }
});

app.get('/health', (_req, res) => res.status(200).send('Backend is healthy!'));

// --- Start ------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on ${PORT}`);
  console.log(`Try: / (HTML UI), /health, /api/weather?city=Singapore`);
});

