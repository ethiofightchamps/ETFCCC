# ETFC Fight Night Platform

## What's built
- Home, Fight Card, Fighter Profile, About/License, Betting, Tickets (interactive
  seat map), User Dashboard, and a real, working **Admin Panel**
- Auth: Google sign-in + manual signup with email OTP (no SMS/phone OTP — dropped
  in favor of zero-cost email verification)
- Ticket checkout: seat selection → bank transfer instructions → screenshot upload →
  order written to Firestore as `pending`
- **Admin panel**: password-protected login, lists pending/confirmed/rejected orders
  with the payment screenshot, Approve/Reject buttons that actually update Firestore
- Betting UI fully built, flag-gated behind `config.bettingEnabled`

## Environment variables (set in Vercel → Settings → Environment Variables)
| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Sends the email OTP code |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full service account JSON (minified to one line) — lets serverless functions read/write Firestore & Storage as admin |
| `ADMIN_PASSWORD` | Password ETFC's organizer uses to log into `/admin/login.html` |
| `ADMIN_SESSION_SECRET` | Any long random string — signs the admin session cookie |

Get the service account JSON from Firebase Console → Project settings →
Service Accounts → Generate new private key. Never commit it to the repo.

Redeploy on Vercel after adding/changing any of these.

## How the admin panel works
1. Organizer goes to `/admin/login.html`, enters `ADMIN_PASSWORD`
2. On success, a signed HttpOnly cookie is set (12hr expiry) — no database session needed
3. `/admin/index.html` fetches `/api/admin-orders?status=pending` and lists every order
   with its screenshot, buyer, seats, and amount
4. **Approve** → `/api/admin-order-action` marks the order `confirmed`, marks the
   purchased seats `sold` in `seatMap` (so they can't be double-booked), and stamps
   a `ticketCode`
5. **Reject** → marks the order `rejected`, seats stay available
6. All of this runs through `firebase-admin` server-side — it bypasses `firestore.rules`
   entirely, which is normal and expected for trusted backend code

## Known gaps / TODOs
- `api/create-order.js` doesn't yet verify a Firebase Auth ID token — it trusts the
  buyer info the client sends. Before real money is on the line, have the client send
  `auth.currentUser.getIdToken()` and verify it server-side with `admin.auth().verifyIdToken()`
- No QR code image generation yet on approval — `ticketCode` is stored, but nothing
  renders it as a scannable QR in the user dashboard yet
- **`js/seatmap.js` still shows a hardcoded placeholder seat layout and a hardcoded
  `SOLD_SEATS` set — it does NOT yet read live seat status from Firestore.** Seat
  locking on the backend (below) is fully live and correct; the visual map just
  doesn't reflect it yet. A buyer could see a seat as green/available in the UI and
  still get a 409 "seat taken" error on submit (handled gracefully, but not ideal —
  worth wiring the map to read `seatMap` live next)
- `screenshotUrl` files are made public in Storage for simplicity — swap for signed
  URLs if screenshots need to stay private long-term

## Betting odds (admin-editable, no code changes needed)
- Odds live in Firestore's `fights` collection, not hardcoded in HTML anymore
- First time only: go to `/admin/odds.html` → click **"Load ETFC's Fight Card"** to
  seed the real roster (Sedo vs Jonny main event + full MMA/Boxing/Muaythai card)
- After that, edit any fighter's odds directly on that page — Save updates Firestore,
  goes live on `betting.html` immediately (it reads the same collection client-side,
  already allowed by `firestore.rules`)
- The seed button is idempotent — it won't run again once fights exist, so it's safe
  to leave live on the page

## Seat locking & release
- `api/create-order.js` now claims seats inside a Firestore **transaction** — if two
  people try to buy the same seat at once, only one succeeds; the other gets a clean
  409 error and `tickets.html` sends them back to reselect automatically
- Seats move `available → pending` (on checkout submit) `→ sold` (on admin approve)
  `→ available` again (on admin reject)
- **`/admin/seats.html`** — new page listing every pending/sold seat with the buyer's
  name and order status. **Release** button frees the seat immediately. Releasing any
  seat on a multi-seat order revokes the WHOLE order (all its seats), not just one —
  this is meant for "undo this booking entirely" (e.g. an approved order turns out to
  be a scammer), not partial edits
- Revoked orders get `status: "revoked"` in Firestore, distinct from `"rejected"`
  (never-approved) so you can tell the two apart in order history

## Deploy
```
firebase deploy --only firestore:rules,storage
vercel --prod
```
