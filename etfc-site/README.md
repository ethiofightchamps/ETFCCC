# ETFC Fight Night Platform

## What's built
- Home, Fight Card, Fighter Profile, About, Betting, Tickets (interactive
  seat map), User Dashboard, and a real, working **Admin Panel**
- Auth: Google sign-in + manual signup with email OTP (no SMS/phone OTP — dropped
  in favor of zero-cost email verification). Email box is shown up front on both
  login and signup, no "Continue with Email" middle step.
- Site defaults to **light mode** (was dark) — toggle still works and is remembered
  per-visitor via `localStorage`.
- Ticket checkout: seat selection → bank transfer instructions → screenshot upload →
  order written to Firestore as `pending`
- **Betting is fully wired end-to-end**: `betting.html` pulls fights + live odds
  straight from Firestore (no more hardcoded HTML), gates bet buttons on
  `config.bettingEnabled`, and the bet slip walks through stake → payout preview →
  bank transfer → screenshot upload → `/api/create-bet`, which looks up the fight's
  REAL odds server-side (never trusts a client-sent odds value) and stores
  `potentialPayout = stake × odds` on a `pending` bet doc.
- **Admin panel**: password-protected login
  - **Order Review** — lists pending/confirmed/rejected ticket orders with the
    payment screenshot, Approve/Reject buttons that actually update Firestore
  - **Betting Odds** — edit odds per fight, plus a **Betting Status** toggle that
    flips `config.bettingEnabled` live (this is the single flag that unlocks bet
    buttons everywhere)
  - **Bet Review** (new) — same Approve/Reject flow as orders for pending bets;
    once a bet is `confirmed`, mark it **Won** or **Lost** after the fight

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

## How betting works end-to-end
1. Organizer loads the fight card once (`Load ETFC's Fight Card` button on
   Betting Odds, if not already seeded) and edits `oddsA` / `oddsB` per fight.
2. Organizer flips **Betting Status → Turn On** on the Betting Odds page. This
   sets `config/site.bettingEnabled = true` in Firestore.
3. `betting.html` reads that flag on load — locked banner disappears, Bet buttons
   enable, real odds are shown (pulled live from `fights`).
4. User taps **Bet** on a fighter → bet slip shows stake input with a live
   payout preview (`stake × odds`) → bank transfer instructions → uploads a
   screenshot → **Submit Bet**.
5. `/api/create-bet` re-reads the fight's odds server-side (ignores anything the
   client claims the odds are), computes the real payout, uploads the
   screenshot, and writes the bet as `pending`.
6. Organizer reviews it on **Bet Review**, Approves (→ `confirmed`, bet is live)
   or Rejects. After the fight airs, mark each confirmed bet **Won** or **Lost**.

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
- `api/create-order.js` and `api/create-bet.js` don't yet verify a Firebase Auth
  ID token — they trust the buyer info the client sends. Before real money is on
  the line, have the client send `auth.currentUser.getIdToken()` and verify it
  server-side with `admin.auth().verifyIdToken()`
- No QR code image generation yet on approval — `ticketCode` is stored, but nothing
  renders it as a scannable QR in the user dashboard yet
- Seat map uses placeholder layout (`js/seatmap.js` → `SEAT_CONFIG`) — swap for
  ETFC's real venue chart
- `screenshotUrl` files are made public in Storage for simplicity — swap for signed
  URLs if screenshots need to stay private long-term
- Won/Lost bets don't trigger an actual payout transfer — that's still a manual
  bank transfer the organizer does outside the app; the admin panel just tracks status

## Deploy
```
firebase deploy --only firestore:rules,storage
vercel --prod
```
