# Yango-style platform: MapLibre + PostGIS + 6% commission + driver trust

## Goal
Move mapping to MapLibre GL JS with free OpenFreeMap vector tiles, add PostGIS geospatial matching in the backend, take a 6% platform commission on every ride/delivery, and make sure only vetted, verified drivers can ever be assigned to a passenger or package.

## 1. Map rendering (MapLibre + OpenFreeMap)
- Add `maplibre-gl`, keep Leaflet only until each screen is migrated.
- New shared `MapLibreMap` component: OpenFreeMap "liberty" style (`https://tiles.openfreemap.org/styles/liberty`), centered on Lusaka (28.2833, -15.4167), no API key, no tile cost.
- Migrate the three existing maps: main station map, rideshare map, live driver-tracking map.
- Keep current behaviors: persistent selection highlight, no re-centering while the user pans, bold blue route line with dark navy outline, hidden attribution controls.
- Manual "Drop a precise pin" mode for addresses OSM does not know (Lusaka outskirts).

## 2. Geospatial backend (PostGIS)
- Enable PostGIS; add a `geography(POINT,4326)` location column plus GiST index for drivers.
- Keep driver location writes going to the existing driver profile record so nothing breaks; the point column is filled alongside.
- Replace the current distance-loop matching with a radius search function that returns only online, approved, non-suspended drivers ordered by true distance.
- Errand/food/ride auto-assignment all use that one function.

## 3. Routing and ETA
- Keep the free OSRM route/ETA path as default.
- Add Geoapify as a fallback through a backend function when OSRM fails or is rate-limited (key stored securely; only requested if you want the fallback).

## 4. Commission (6%)
- Every completed ride, food order, and errand splits: 6% platform fee, 94% to the driver/courier.
- Fee is computed and recorded server-side at settlement time so it cannot be altered from the app.
- Driver earnings rows store gross, commission, and net; drivers see the breakdown; admin sees platform revenue totals.

## 5. Driver trust and safety (no fake or criminal drivers)
- Drivers stay `pending` and invisible to matching until an admin approves them.
- Required before approval: government ID, driver licence, vehicle registration, licence plate, a clear selfie matching the ID, and a police clearance / criminal record certificate.
- Documents stored in a private bucket, readable only by the driver and admins.
- Admin verification panel gains document previews, an expiry date per document, and approve / reject-with-reason / suspend actions.
- Auto-suspend on expired documents or on a confirmed serious dispute; suspended drivers are removed from matching immediately.
- Passenger-side: driver photo, name, rating, plate and vehicle shown before pickup, plus the existing OTP start-ride check so the package or passenger never goes to the wrong car.

## Technical notes
- Migrations: PostGIS extension, driver geography column + index, radius-search function, commission columns on earnings/settlement functions, driver document table with strict access rules, private storage bucket.
- Settlement functions (`settle_service_payment`, ride payment completion trigger) are extended to write the commission split atomically.
- No change to the DPO payment flow itself.

## Suggested order
1. PostGIS + driver radius matching + verification/commission schema
2. Commission split in settlement + earnings UI
3. Driver document upload + upgraded admin verification panel
4. MapLibre migration of the three maps + precise-pin mode
