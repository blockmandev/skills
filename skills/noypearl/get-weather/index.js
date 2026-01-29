#!/usr/bin/env node
/**
 * Weather Data Fetcher (Open-Meteo)
 *
 * Usage:
 *   node index.js '{"latitude":32.0853,"longitude":34.7818}'
 *   node index.js '{"latitude":32.0853,"longitude":34.7818,"hours":48,"days":5,"timezone":"Asia/Jerusalem","units":"metric"}'
 *
 * Output:
 *   JSON object { location, current, hourly, daily, source }
 */

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

function parseInput(argv) {
  if (!argv.length) return null;

  const first = argv[0].trim();

  // Expect JSON input as first arg (recommended for clawdbot usage)
  if (first.startsWith("{") || first.startsWith("[")) {
    return JSON.parse(first);
  }

  // Fallback: allow "lat lon" args
  // e.g. node index.js 32.0853 34.7818
  const parts = argv.join(" ").split(/[,\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return { latitude: Number(parts[0]), longitude: Number(parts[1]) };
  }

  return null;
}

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function clampInt(x, min, max, def) {
  const n = Number.parseInt(String(x ?? ""), 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function pickArray(obj, key) {
  const v = obj?.[key];
  return Array.isArray(v) ? v : [];
}

function sliceTo(arr, n) {
  return Array.isArray(arr) ? arr.slice(0, n) : [];
}

async function main() {
  const input = parseInput(process.argv.slice(2));

  if (!input || (typeof input !== "object")) {
    console.error(JSON.stringify({
      error: "Missing/invalid input",
      expected: {
        latitude: "number (required)",
        longitude: "number (required)",
        timezone: 'string (optional, default "auto")',
        hours: "number (optional, default 24)",
        days: "number (optional, default 3)",
        units: 'string (optional: "metric" or "imperial", default "metric")'
      },
      examples: [
        '{ "latitude": 32.0853, "longitude": 34.7818 }',
        '{ "latitude": 31.7683, "longitude": 35.2137, "days": 5, "hours": 48, "timezone": "Asia/Jerusalem" }'
      ]
    }, null, 2));
    process.exit(2);
  }

  const latitude = toNum(input.latitude);
  const longitude = toNum(input.longitude);

  if (latitude === null || longitude === null) {
    console.error(JSON.stringify({
      error: "latitude and longitude are required numbers",
      got: { latitude: input.latitude, longitude: input.longitude }
    }, null, 2));
    process.exit(2);
  }

  const units = String(input.units ?? "metric").toLowerCase();
  const timezone = String(input.timezone ?? "auto");

  const hours = clampInt(input.hours, 1, 168, 24); // up to 7 days hourly
  const days = clampInt(input.days, 1, 16, 3);     // open-meteo supports up to 16 days (varies)

  // Unit mapping for Open-Meteo params
  // - metric (default): °C, km/h
  // - imperial: °F, mph
  const temperature_unit = units === "imperial" ? "fahrenheit" : "celsius";
  const windspeed_unit = units === "imperial" ? "mph" : "kmh";

  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("timezone", timezone);

  // Current
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "weather_code"
    ].join(",")
  );

  // Hourly
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "precipitation"
    ].join(",")
  );

  // Daily
  url.searchParams.set(
    "daily",
    [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum"
    ].join(",")
  );

  url.searchParams.set("temperature_unit", temperature_unit);
  url.searchParams.set("windspeed_unit", windspeed_unit);

  // Reduce payload a bit (Open-Meteo supports this)
  url.searchParams.set("forecast_hours", String(hours));
  url.searchParams.set("forecast_days", String(days));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  let res;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "clawdbot-weather-data-fetcher/1.0" }
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(JSON.stringify({
      error: "Open-Meteo request failed",
      status: res.status,
      body: body.slice(0, 500)
    }, null, 2));
    process.exit(1);
  }

  const data = await res.json();

  // Normalize output
  const out = {
    location: {
      latitude,
      longitude,
      timezone: data?.timezone ?? timezone
    },
    current: {
      temperature: toNum(data?.current?.temperature_2m),
      windSpeed: toNum(data?.current?.wind_speed_10m),
      windDirection: toNum(data?.current?.wind_direction_10m),
      weatherCode: toNum(data?.current?.weather_code),
      time: data?.current?.time ?? null
    },
    hourly: {
      time: sliceTo(pickArray(data?.hourly, "time"), hours),
      temperature: sliceTo(pickArray(data?.hourly, "temperature_2m"), hours),
      precipitation: sliceTo(pickArray(data?.hourly, "precipitation"), hours)
    },
    daily: {
      time: sliceTo(pickArray(data?.daily, "time"), days),
      tempMax: sliceTo(pickArray(data?.daily, "temperature_2m_max"), days),
      tempMin: sliceTo(pickArray(data?.daily, "temperature_2m_min"), days),
      precipitationSum: sliceTo(pickArray(data?.daily, "precipitation_sum"), days)
    },
    source: "open-meteo"
  };

  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main().catch(err => {
  const msg =
    err?.name === "AbortError"
      ? "Request timed out"
      : (err?.message || String(err));

  console.error(JSON.stringify({ error: msg }, null, 2));
  process.exit(1);
});