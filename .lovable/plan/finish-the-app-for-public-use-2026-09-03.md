# Finish the app for public use

Everything major is built (rides, food, send, errands, wallet/DPO, driver verification, 6% commission, PostGIS matching). What remains is finishing the last inconsistencies and the public-launch essentials.

## 1. Finish the map migration
The main fuel-finder map is still on Leaflet while rideshare, driver tracking and pin-drop already use MapLibre. Two map engines means two behaviours and double the bundle.
- Rebuild the station map on the shared MapLibre component (Lusaka centre, free OpenFreeMap tiles).
- Keep today's behaviour: persistent selected-station highlight, no re-centering while panning, hidden attribution, colour-coded availability markers.
- Drop the Leaflet dependency and its CSS once nothing uses it.

## 2. Close the remaining product gaps
- **Errands & Send**: runner assignment exists, but the customer still needs a cancel action and a dispute/report path like rides have.
- **Food**: restaurant owners can create menu items but have no order queue screen (accept → preparing → ready for pickup). Add a simple restaurant orders view.
- **Ratings**: rides and food orders are rated; errands/package deliveries are not. Reuse the existing rating dialog for them.
- **Notifications**: make sure every state change a user cares about (driver assigned, arrived, delivered, payment settled) raises a notification, not just some of them.

## 3. Launch essentials
- Legal pages: Terms of Service and Privacy Policy routes, linked from the profile menu and signup (required before taking real payments).
- Help / contact screen with support email and how to report a driver.
- Empty and error states everywhere a list can be blank (no rides yet, no orders, no documents).
- Account settings: change password, delete account.

## 4. Final quality pass
- Security scan sweep, fix everything that comes back.
- SEO check: title, description, sitemap already exist — verify they're accurate post-changes.
- Accessibility re-check on any new screens.
- Run the existing integration test suite; add tests for the commission split and driver-approval gate.

## Technical notes
- No schema changes expected except a small `order_cancellations` path reusing the ride pattern, plus notification triggers.
- Legal pages are static React routes, no backend.
- Leaflet removal touches `Index.tsx`, `LeafletMap.tsx`, `main.tsx`, `index.css`.

## Order of work
1. MapLibre migration + Leaflet removal
2. Product gaps (errand cancel/dispute, restaurant order queue, ratings, notifications)
3. Legal + help + account settings
4. Security / SEO / a11y / tests sweep
