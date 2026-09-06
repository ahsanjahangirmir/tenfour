# TenFour

Trip planning and Hours-of-Service compliance for truck drivers. A driver
signs in, describes a trip, and immediately sees whether it's legal under
HOS rules and where the mandatory stops are — before filling in any
paperwork. If they want the official paperwork, they can generate it,
export it, and find it again later in their history. See `docs/overview.md`
for the product rationale and `docs/spec.md` for the full technical spec.

**Live**: https://tenfour-inky.vercel.app

## What's built

The app is feature-complete against `docs/spec.md`:

- **Accounts** — sign-up/sign-in with email+password or Google, via Clerk.
- **Phase 1 — Generate Trip.** A guided wizard collects current location,
  pickup, dropoff, current cycle hours used, and trip start time (with
  optional presets for common trips), then simulates the trip against HOS
  rules and returns a driving route, color-coded mandatory stops (30-minute
  breaks, fuel stops, 10-hour rests, 34-hour restarts), and a breakdown
  (distance, driving hours, days, time per duty status).
- **Location autocomplete** is fully client-side: a bundled ~29,700-place
  US city/state dataset is searched in memory on every keystroke (no
  network round-trip), and the field only accepts a value actually picked
  from the suggestion list — free-typed, unselected text is discarded and
  can't be submitted.
- **Route map** — an interactive Leaflet map showing the calculated route
  and every stop, with a legend.
- **Phase 2 — Generate Logs.** The user confirms/edits their driver/carrier
  profile and fills in the two remaining trip-specific fields; the backend
  reverse-geocodes every stop (parallelized across a thread pool) and
  produces one fully filled-out daily log sheet per calendar day the trip
  spans, rendered as pixel-precise SVG matching the official DOT layout.
- **Export** — each log sheet exports as PNG or PDF.
- **History** — a drawer listing past trips, each reopenable to its full
  route, breakdown, and generated logs.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite, React Router, Leaflet/react-leaflet for maps, html2canvas + jsPDF for export |
| Backend | Django 5 + Django REST Framework |
| Auth | Clerk (frontend components + JWT verification against Clerk's JWKS on the backend) |
| Database | Postgres (Neon, pooled connection) in production; SQLite locally |
| Cache | Redis (Upstash) in production; local in-memory cache locally |
| Routing/geocoding | OpenRouteService (`driving-hgv` profile), with a US Census Geocoder fallback and a bundled offline city dataset as a last resort |
| Deployment | Vercel, as two services (static frontend build + Python/WSGI Django function) in one project |

## Structure

```
backend/    Django + DRF, Clerk JWT auth, HOS simulation, log sheet generation
frontend/   React + Vite SPA, Clerk for sign-up/sign-in
docs/       Product spec, rulebook, acceptance criteria
vercel.json Defines the frontend + backend as two Vercel services in one project
```

## Local development

**Backend**

```
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in CLERK_JWKS_URL / CLERK_ISSUER at minimum
python manage.py migrate
python manage.py runserver
```

Without `DATABASE_URL` set, it falls back to a local SQLite file so you can
run it with zero external services. Without `REDIS_URL`, it falls back to
an in-memory cache.

**Frontend**

```
cd frontend
npm install
cp .env.example .env   # fill in VITE_CLERK_PUBLISHABLE_KEY
npm run dev
```

Runs at `http://localhost:5173` and calls the API at `VITE_API_BASE_URL`
(defaults to `http://127.0.0.1:8000`).

## Clerk setup

1. Create a Clerk application at https://dashboard.clerk.com.
2. Enable email/password and Google as sign-in options.
3. Copy the **Publishable key** into `frontend/.env`.
4. Under API Keys > Advanced, copy the **JWKS URL** and **Issuer** into
   `backend/.env`.

The frontend attaches the signed-in user's Clerk JWT as a `Bearer` token on
every API call (`frontend/src/lib/api.js`); the backend verifies it against
Clerk's JWKS and lazily creates a matching `core.User` row on first sight
(`backend/core/authentication.py`).

The deployed instance currently runs on a Clerk **development** instance —
fine for testing, but a production instance (with its own custom domain,
live keys, and real OAuth credentials) is needed before onboarding real
users.

## Deployment

`vercel.json` at the repo root defines the frontend and backend as two
Vercel **services** in one project — a static build (`frontend/`) and a
Python/WSGI Django function (`backend/`) — unified by top-level rewrites so
they share an origin and no CORS configuration is needed in production.

```
vercel link       # first time only
vercel --prod
```

Required environment variables on the Vercel project (Production and
Preview): `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`,
`DATABASE_URL` (Neon, pooled), `REDIS_URL` (Upstash), `ORS_API_KEY`
(OpenRouteService), `CLERK_JWKS_URL`, `CLERK_ISSUER`, and
`VITE_CLERK_PUBLISHABLE_KEY` / `VITE_API_BASE_URL` for the frontend build.
Migrations don't run automatically on deploy — run
`python manage.py migrate` locally against the production `DATABASE_URL`
after adding a new one.
