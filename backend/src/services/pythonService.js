// HTTP client for the Python microservice (geofencing + fare calculation).

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

async function postJson(path, body) {
  const res = await fetch(`${PYTHON_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Python service error: ${res.status}`);
  }
  return res.json();
}

async function resolveZone(lat, lng, zones) {
  const payload = zones.map((z) => ({
    zone_id: z.zone_id,
    geofence_geojson: typeof z.geofence_geojson === 'string'
      ? JSON.parse(z.geofence_geojson)
      : z.geofence_geojson,
  }));
  const data = await postJson('/resolve-zone', { lat, lng, zones: payload });
  return data.zone_id ?? null;
}

async function calculateFare({ distance_km, duration_minutes, plan, surge_multiplier = 1.0 }) {
  const data = await postJson('/calculate-fare', {
    distance_km,
    duration_minutes,
    base_fare: Number(plan.base_fare),
    per_minute_rate: Number(plan.per_minute_rate),
    per_km_rate: Number(plan.per_km_rate),
    surge_multiplier,
  });
  return data.fare_amount;
}

module.exports = { resolveZone, calculateFare };
