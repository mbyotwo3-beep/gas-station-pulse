You picked all four focus areas. That's a lot, so I'll ship it in 4 tight passes and check in after each. Each pass is scoped so you can stop at any point and still have a working app.

## Pass 1 — Payments end-to-end (server-enforced)

Goal: nothing marks itself paid on the client.

- Add SQL migration for a `enforce_ride_payment_completion` trigger on `ride_payments`:
  - Reject client-side inserts/updates that set `status='completed'` for card/mobile_money without a matching wallet debit `transactions` row.
  - Restrict cash `completed` to `service_role`.
- Same pattern via `enforce_order_payment_completion` trigger for delivery/errand orders.
- New edge function `dpo-charge-order` that starts a DPO token tied to a `ride_id` or `order_id` (not just wallet top-up).
- Extend `dpo-verify-token`: on success, credit wallet AND (if `ride_id`/`order_id` present) atomically debit wallet + mark the ride/order payment `completed` via a `settle_service_payment` RPC.
- UI: `RidePaymentDialog` and delivery checkout: "Pay with card / mobile money" routes through DPO instead of instantly marking completed. Wallet path stays instant (already server-enforced).
- Refund path: `refund_service_payment` RPC (admin/service_role) that reverses wallet debit and flips payment to `refunded`.

## Pass 2 — Rideshare polish

- Cancellation reasons enum + `ride_cancellations` table + dialog on cancel (rider & driver).
- Driver tips: `tip_amount` column on `ride_payments` + tip prompt on `RideCompletionSummary` (adds a wallet debit, re-generates receipt).
- Live ETA badge in `ActiveRideTracker` computed from OSRM `duration` + last driver ping.
- Dispute flow: "Report an issue" from ride history → `ride_disputes` table (RLS: owner + admin).

## Pass 3 — Food & errands polish

- Cart persistence in `localStorage` keyed by user id (survives refresh).
- Courier chat: reuse `RideChatDialog` component against an `order_messages` table.
- Delivery proof photo: courier uploads to `delivery-proofs` bucket at handoff; shown in `OrderHistory`.
- Order tips (same pattern as ride tips).
- Errand runner cancellation + auto-reassign via `assign_nearest_runner` if runner cancels within 2 min.

## Pass 4 — Production readiness

- Legal pages: `/terms`, `/privacy`, `/refunds` (Zambia-appropriate boilerplate, editable). Link from `Auth` and footer.
- Global error tracking: lightweight `logError()` util writing to a `client_errors` table (RLS: insert-only for authenticated), wired into `ErrorBoundary`.
- Push notifications (browser Web Push): service worker + `push_subscriptions` table + edge function `send-push`; triggers on ride status, order status, chat message.
- Admin tools: `/manager` gets tabs for disputes, refunds, and error log (admin-only via `has_role`).
- Final a11y/SEO pass: alt text audit on remaining images, per-route `usePageSeo` on `/terms`, `/privacy`, `/refunds`, `/manager`, DpoReturn.

## Technical notes

- All new tables get explicit `GRANT` blocks + RLS + `WITH CHECK`.
- All `SECURITY DEFINER` functions set `search_path = public` and revoke `EXECUTE` from `anon`.
- No new paid APIs — Web Push, OSRM, and existing DPO only.
- Each pass ends with a security scan; findings fixed before moving to the next pass.

## Order of execution

I'll do Pass 1 immediately after you approve, then check in before Pass 2. Reply "go" to start, or tell me to reorder / drop a pass.