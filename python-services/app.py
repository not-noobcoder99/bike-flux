"""
Bike Flux Python microservice.
Handles geofencing checks and fare calculations that the Node backend
can call over HTTP, and can also be used standalone for analytics scripts.
"""
import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv

from geofence import find_zone_for_point
from fare_calculator import calculate_fare

load_dotenv()

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "bike-flux-python-service"})


@app.post("/calculate-fare")
def fare_endpoint():
    data = request.get_json(force=True)
    required = ["distance_km", "duration_minutes", "base_fare", "per_minute_rate", "per_km_rate"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    fare = calculate_fare(
        distance_km=data["distance_km"],
        duration_minutes=data["duration_minutes"],
        base_fare=data["base_fare"],
        per_minute_rate=data["per_minute_rate"],
        per_km_rate=data["per_km_rate"],
        surge_multiplier=data.get("surge_multiplier", 1.0),
    )
    return jsonify({"fare_amount": fare})


@app.post("/resolve-zone")
def resolve_zone_endpoint():
    """
    Body: { "lat": .., "lng": .., "zones": [ { "zone_id": 1, "geofence_geojson": {...} }, ... ] }
    Returns the zone_id the point falls inside, or null.
    """
    data = request.get_json(force=True)
    zone_id = find_zone_for_point(data["lat"], data["lng"], data.get("zones", []))
    return jsonify({"zone_id": zone_id})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    app.run(host="0.0.0.0", port=port, debug=True)
