# Bike Flux

Company-owned scooty rental system for NUST campus.

**Flow:** scooties parked in geofenced zones → app shows nearest available
scooty on a map → user scans QR to unlock (IoT relay/kill-switch, gated on
backend validating payment + account) → user takes an in-app photo
confirming scooty condition before riding → GPS tracks the ride → ride is
auto-billed to the user's linked virtual card on completion.

## Project structure

```
bike-flux/
├── database/
│   └── schema.sql          # MySQL schema (all 11 ERD entities)
├── backend/                # Node.js / Express API
│   └── src/
│       ├── config/         # MySQL pool
│       ├── models/         # One file per table
│       ├── controllers/    # Route handlers
│       ├── routes/         # Express routers
│       ├── middleware/     # JWT auth, error handler
│       └── services/       # IoT relay control, billing/fare logic
├── python-services/        # Flask microservice
│   ├── app.py               # /calculate-fare, /resolve-zone endpoints
│   ├── geofence.py          # Point-in-polygon zone matching (shapely)
│   ├── fare_calculator.py
│   └── iot_simulator.py     # Simulates GPS pings for local dev without real hardware
└── frontend/                # React (Vite) app
    └── src/
        ├── pages/            # Login, Register, MapHome, ScanUnlock, ActiveRide, RideHistory, Wallet
        ├── components/       # Navbar, ScootyMarker, ProtectedRoute
        ├── context/          # AuthContext (JWT-based)
        └── api/              # Axios client
```

## Setup

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in DB credentials + JWT_SECRET
npm install
npm run dev             # http://localhost:5000
```

### 3. Python microservice (optional but recommended)
```bash
cd python-services
cp .env.example .env
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py           # http://localhost:8001
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:3000
```

## What's stubbed vs. real

This is a **starter scaffold** — the flows are wired end-to-end but a few
integration points are placeholders you'll want to replace:

- **IoT hardware**: `backend/src/services/iotService.js` simulates the
  relay/kill-switch call. Swap in your real MQTT/HTTP call to the device
  gateway.
- **Condition photo upload**: the frontend currently sends a fake photo URL.
  Wire up real file upload (e.g. `multer` + S3/local disk) before hitting
  `POST /api/rides/condition-photo`.
- **Virtual card issuance**: `VirtualCard.create` on registration creates a
  placeholder card row. Connect it to your real card-issuing/payment
  provider.
- **Geofence polygons**: `parking_zones.geofence_geojson` is seeded with
  empty polygons — fill in real campus zone boundaries.

## Next steps
- Add an admin dashboard (scooty status, maintenance logs, zone management)
- Add role-based routes for `maintenance` role using `requireRole('maintenance')`
- Hook the Python `/resolve-zone` and `/calculate-fare` endpoints into the
  Node ride flow if you want pricing/geofencing logic centralized in Python
