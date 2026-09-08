# Swapping in Google Maps ("Link with Google API")

By default HeatScape 360 uses OpenStreetMap-based services for everything
map-related - map tiles, address search/autocomplete, and road routing. All
three are real, live, free APIs and need **zero setup or API key**, which is
why the app works immediately after you deploy it. This is what the
`AddressInput`, `MapView` and the backend's `/api/route` endpoint use today.

If you specifically want Google Maps (e.g. because your review/demo expects
the literal Google Maps look, or you need Google's traffic-aware ETAs),
here's the smallest path to wire it in without restructuring the app:

1. In Google Cloud Console, enable **Maps JavaScript API**, **Places API**
   and **Directions API** on one project, create an API key, and restrict it
   to your deployed domain (HTTP referrer restriction).
2. `npm install @react-google-maps/api` in `frontend/`.
3. Set `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env` (see `.env.example`).
4. Create `GoogleMapView.jsx` next to `MapView.jsx` that renders
   `<GoogleMap>` from `@react-google-maps/api` instead of react-leaflet's
   `<MapContainer>`, keeping the **same props** (`center`, `zoom`,
   `heatPoints`, `markers`, `routes`, `onMapClick`) so every page that
   already uses `<MapView />` keeps working unchanged. Draw `heatPoints` as
   `<Circle>` overlays and `routes[].geometry` as `<Polyline>`, same as the
   Leaflet version.
5. In `AddressInput.jsx`, swap the call to `api.geocodeSearch()` for
   Google's `Autocomplete`/`AutocompleteService` when
   `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` is set.
6. For routing, call Google's `DirectionsService` with
   `provideRouteAlternatives: true` from the browser, then POST the
   resulting `[lat, lon][]` path(s) to the backend's existing
   `POST /api/route/heat-cost` endpoint (already built for exactly this) to
   get the same heat-cost scoring the OSRM path uses, and pick the best
   alternative client-side.
7. Gate the whole thing with one flag, e.g. in `MapView.jsx`:
   `const Provider = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? GoogleMapView : LeafletMapView;`

This keeps the free, no-key OpenStreetMap stack as the default (so the app
still works for anyone who clones the repo without a Google billing
account), while making Google Maps a clean opt-in for teams that want it.
