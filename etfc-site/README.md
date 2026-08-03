# ETFC Fight Night Platform — Scaffold

Full site scaffold, ready to fill with real content and deploy to Vercel.

## What's built
- Home, Fight Card, Fighter Profile (template), About/License, Betting, Tickets
  (with interactive seat map), User Dashboard, Admin Panel
- Auth modal wired for phone OTP (Lomisend for +251 / Firebase for others) + email OTP
- Firestore + Storage security rules matching the data model
- Betting fully built but flag-gated behind `config.bettingEnabled`

## Before it's live — replace these placeholders
1. **`js/firebase-config.js`** — real Firebase project keys (Blaze plan required for phone auth)
2. **`js/firebase-config.js`** — `LOMISEND_API_KEY`, confirm `LOMISEND_SENDER_ID` approval status
3. **`js/main.js`** — real `EVENT_DATE`
4. **`js/seatmap.js`** — real `SEAT_CONFIG` from ETFC's venue chart
5. **All `[bracketed placeholders]`** across the HTML files — ticket prices, fighter roster,
   venue, license text, bank account details
6. **`js/auth.js`** — replace `// TODO` stubs with real Lomisend/Firebase/Resend calls
   (recommend a Cloud Function for OTP generation/verification — don't verify client-side only)
7. **Admin auth** — set a custom claim `admin: true` on ETFC's organizer account(s) via
   Firebase Admin SDK before deploying `firestore.rules` — the rules file assumes this exists

## Deploy
```
firebase deploy --only firestore:rules,storage
vercel --prod
```

## Not yet built (flagged in the architecture doc)
- Real-time seat locking (Firestore transaction) — currently a TODO in `seatmap.js`
- QR e-ticket generation on order approval
- Live wiring of the admin order-review table to Firestore
