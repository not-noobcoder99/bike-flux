# Bike Flux — Setup & Run Guide

A campus e-scooter rental system: React frontend, Node/Express backend, MySQL database, and a Python/Flask microservice for geofencing and fare calculation.

This guide assumes **Windows + PowerShell** and a project folder laid out like this:

```
bike-flux\
  database\          (schema.sql, schema_seed_fix.sql)
  backend\           (Node/Express API — package.json lives here, code in backend\src)
  frontend\          (React app — package.json lives here, code in frontend\src)
  python-services\   (Flask microservice)
```

You will run **4 things at once**, each in its own PowerShell window: MySQL (one-off commands only), the Python service, the Node backend, and the frontend. Leave the Python, Node, and frontend windows open and running the whole time you're using the app.

---

## 0. One-time tools check

**MySQL CLI must be on PATH.** Test it:
```powershell
mysql --version
```
If that fails with "not recognized," MySQL is installed but not on PATH. Find it and add it:
```powershell
Get-ChildItem "C:\Program Files\MySQL" -Recurse -Filter mysql.exe
```
Then add the folder it's in (something like `C:\Program Files\MySQL\MySQL Server 8.0\bin`) to your **User** environment variable `Path` (search "Edit environment variables for your account" in the Start menu → select `Path` → Edit → New → paste the folder → OK everything → close and reopen every PowerShell window).

You'll also need **Node.js** and **Python 3.10+** installed — check with:
```powershell
node --version
python --version
```

---

## 1. Database setup (do this once)

Open a PowerShell window, go to the project root:
```powershell
cd C:\Users\<you>\Documents\bike-flux
```

Run the schema, then the two patch files, **in this exact order**:
```powershell
Get-Content database\schema.sql | mysql -u root -p
Get-Content database\schema_seed_fix.sql | mysql -u root -p bike_flux
Get-Content database\erd_alignment_fix.sql | mysql -u root -p bike_flux
```
It'll ask for your MySQL root password each time — type it and hit Enter (it won't show characters on screen, that's normal).

**Verify it worked:**
```powershell
mysql -u root -p bike_flux -e "SHOW TABLES;"
```
You should see 11 tables: `condition_photos`, `iot_units`, `maintenance_logs`, `parking_zones`, `pricing_plans`, `rides`, `scooties`, `subscriptions`, `transactions`, `users`, `virtual_cards`.

You only need to do this section again if you wipe the database or set it up on a new machine.

---

## 2. Python microservice (handles geofencing + fare math)

Open a **new** PowerShell window:
```powershell
cd C:\Users\<you>\Documents\bike-flux\python-services
pip install -r requirements.txt
```

First time only — create your env file:
```powershell
Copy-Item .env.example .env
notepad .env
```
Fill in your real MySQL password under `DB_PASSWORD=`, save, close.

Start it:
```powershell
python app.py
```
You should see `Running on http://0.0.0.0:8001`. **Leave this window open.**

---

## 3. Node backend (main API)

Open a **new** PowerShell window:
```powershell
cd C:\Users\<you>\Documents\bike-flux\backend
npm install
```

First time only — create your env file:
```powershell
Copy-Item .env.example .env
notepad .env
```
Fill in `DB_PASSWORD` (your MySQL password) and set `JWT_SECRET` to any long random string (mash the keyboard, 30+ characters). Save, close.

Start it:
```powershell
npm run dev
```
You should see `Bike Flux backend running on port 5000`. **Leave this window open.** It auto-restarts whenever you edit a file (via `nodemon`) — no need to stop/start it manually while developing.

---

## 4. Frontend (the actual website)

Open a **new** PowerShell window:
```powershell
cd C:\Users\<you>\Documents\bike-flux\frontend
npm install
npm run dev
```
You should see a local URL, typically `http://localhost:3000/`. **Leave this window open.** Vite hot-reloads automatically on file changes.

Open that URL in your browser.

---

## 5. Create your first admin account

You can't skip this — a fresh database has zero admins, and new accounts start out unable to log in until approved.

1. In the browser, click **Register**, create an account with any email/password.
2. Trying to log in immediately will fail with "awaiting admin approval" — that's expected.
3. In a **new** PowerShell window, promote yourself:
   ```powershell
   cd C:\Users\<you>\Documents\bike-flux
   mysql -u root -p bike_flux
   ```
   Then at the `mysql>` prompt:
   ```sql
   UPDATE users SET role='admin', status='active' WHERE email='the_email_you_registered_with';
   exit
   ```
4. Go back to the browser and log in with that same email/password. You should land on the map page with an **Admin** link in the navbar.

---

## Daily startup (after the first-time setup above is done)

Every time you sit down to work on this, you need **3 terminal windows** running simultaneously (MySQL is already running as a background Windows service, no need to start it manually):

| Window | Command |
|---|---|
| 1 | `cd python-services` → `python app.py` |
| 2 | `cd backend` → `npm run dev` |
| 3 | `cd frontend` → `npm run dev` |

Then open the frontend's `localhost` URL in your browser.

To stop everything: click into each window and press `Ctrl+C`.

---

## Quick troubleshooting

| Symptom | Likely cause |
|---|---|
| `mysql : term not recognized` | MySQL not on PATH — see Section 0 |
| `Get-Content : Cannot find path` | You're in the wrong folder — run `cd` back to project root first, or check you're not still inside `python-services`/`backend`/`frontend` |
| Backend won't start, error mentions a missing module | Run `npm install` again inside `backend` |
| Frontend loads but API calls fail / "Network Error" | Backend isn't running, or crashed — check that terminal window for red error text |
| Login says "Invalid credentials" | You haven't registered that email yet, or typo'd the password |
| Login says "awaiting admin approval" | Expected for new accounts — see Section 5 |
| Photo upload silently fails | Check the backend terminal for the actual error; confirm `backend\uploads` folder exists (it's auto-created on server start) |
| Wallet's subscription list is empty | Go to Admin → Pricing Plans and confirm at least one plan has "Is a subscription plan" checked |

---

## What each piece actually does

- **`database\`** — MySQL schema and one-time data patches. Not a running service — just SQL files you execute once.
- **`python-services\`** — Flask microservice on port 8001. Does two jobs only: geofencing (is this GPS point inside this parking zone polygon?) and fare math. The Node backend calls it over HTTP; it never talks to the frontend directly.
- **`backend\`** — Node/Express API on port 5000. Owns the database connection, handles auth, and exposes every feature (rides, wallet, admin panel, etc.) as REST endpoints.
- **`frontend\`** — React app, served by Vite on port 3000 during development. Everything the user sees and clicks.
