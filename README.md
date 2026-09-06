# TenFour

Trip planning and Hours-of-Service compliance for truck drivers. A driver
signs in, describes a trip, and immediately sees whether it's legal under
HOS rules and where the mandatory stops are — before filling in any
paperwork. See `docs/overview.md` for the product rationale and
`docs/spec.md` for the full technical spec this scaffold implements.

This repo currently has: project scaffolding for both apps, Clerk-backed
sign-up/sign-in, a Clerk-JWT-authenticated Django API with a driver/carrier
profile endpoint, and the marketing homepage. The trip form, route map, and
log sheet generation described in the spec are not built yet.

## Structure

```
backend/    Django + DRF, Clerk JWT auth, deployed as a Vercel Python function
frontend/   React + Vite, Clerk for sign-up/sign-in
vercel.json Ties both into one deployment (same origin, no CORS needed)
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

Runs at `http://localhost:5173` and calls the API at
`VITE_API_BASE_URL` (defaults to `http://127.0.0.1:8000`).

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

## Deployment

`vercel.json` at the repo root builds the frontend as a static site and the
backend as a Python (WSGI) serverless function on one Vercel project, so
they share an origin and no CORS configuration is needed in production. Set
`DATABASE_URL` (Neon, pooled), `REDIS_URL` (Upstash), `CLERK_JWKS_URL`,
`CLERK_ISSUER`, and `ORS_API_KEY` (OpenRouteService) as environment
variables on the Vercel project, plus `VITE_CLERK_PUBLISHABLE_KEY` for the
frontend build.
