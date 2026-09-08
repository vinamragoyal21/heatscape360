# Deploying HeatScape 360: GitHub → Railway → Vercel

This deploys the backend on Railway and the frontend on Vercel, wired
together with environment variables. Total time: ~15 minutes.

## 1. Push the code to GitHub

```bash
cd heatscape360
git init
git add .
git commit -m "HeatScape 360 - initial deploy"
```

Create a new empty repo on GitHub (github.com/new, no README/license), then:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/heatscape360.git
git push -u origin main
```

## 2. Deploy the backend on Railway

1. Go to https://railway.app, sign in with GitHub, click **New Project →
   Deploy from GitHub repo**, and pick your `heatscape360` repo.
2. Railway will ask which directory to deploy - set the **Root Directory**
   to `backend`. (Project settings → General → Root Directory.)
3. Railway auto-detects Node from `backend/package.json` and runs
   `npm install && npm start`. No extra build command needed.
4. Under **Variables**, add:
   - `CORS_ORIGIN` - leave it as `http://localhost:5173` for now; you'll
     update it to your real Vercel URL after step 3 below.
   - (Optional) `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` if you want the AI
     Assistant to use a real LLM instead of its built-in knowledge base.
   - Railway sets `PORT` automatically - you don't need to set it.
5. Click **Deploy**. Once it's live, open **Settings → Networking → Generate
   Domain** to get a public URL, e.g. `https://heatscape360-backend-production.up.railway.app`.
6. Sanity check: visit `<that URL>/api/health` in a browser - you should see
   `{"status":"ok", ...}`.

## 3. Deploy the frontend on Vercel

1. Go to https://vercel.com, sign in with GitHub, click **Add New → Project**,
   and import the same `heatscape360` repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset should auto-detect as **Vite**. Build command
   `npm run build`, output directory `dist` (Vercel fills these in
   automatically for Vite).
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = the Railway backend URL from step 2.6 (no
     trailing slash), e.g. `https://heatscape360-backend-production.up.railway.app`
   - (Optional) `VITE_GOOGLE_MAPS_API_KEY` - only if you've wired up the
     Google Maps provider, see `frontend/src/components/map/README.md`.
5. Click **Deploy**. Vercel gives you a URL like
   `https://heatscape360.vercel.app`.

`vercel.json` in `frontend/` already adds the SPA rewrite so client-side
routes like `/route` or `/settings` work on refresh/direct link.

## 4. Connect the two: update CORS

Back in Railway, set the backend's `CORS_ORIGIN` variable to your real
Vercel URL (comma-separate multiple origins if you have a preview URL too):

```
CORS_ORIGIN=https://heatscape360.vercel.app
```

Railway redeploys automatically when you save a variable. Reload the Vercel
site - Route Planner, Nearby Assistance, etc. should now successfully call
the backend.

## 5. (Optional) Custom domain

Both Railway and Vercel support adding a custom domain under their
respective project **Settings → Domains** - point your DNS as each
dashboard instructs, then update `CORS_ORIGIN` / `VITE_API_BASE_URL` to
match.

## Notes on the free public APIs this app depends on

- **Nominatim, Overpass, OSRM (routing.openstreetmap.de)** are shared public
  services with fair-use rate limits (roughly 1 request/second per IP).
  Fine for a demo, a class project, or moderate real traffic thanks to the
  backend's caching layer. For heavy production traffic, self-host:
  - OSRM: `docker run -p 5000:5000 osrm/osrm-backend` with a pre-processed
    `.osrm` extract for your region (see https://github.com/Project-OSRM/osrm-backend),
    then point `OSRM_URL_FOOT`/`OSRM_URL_BIKE`/`OSRM_URL_CAR` at it.
  - Overpass: run your own instance or use a paid mirror, then set
    `OVERPASS_URL`.
- **Open-Meteo** has a generous free tier (no key) and is fine as-is for
  most traffic levels.

## Redeploying after changes

Both Railway and Vercel redeploy automatically on every `git push` to the
branch you connected. No extra steps needed.
