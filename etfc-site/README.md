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

## Email OTP backend (Vercel serverless functions)
`api/send-otp.js` and `api/verify-otp.js` handle the email code — generate,
store in Firestore with a 10-min expiry, email via Resend, then verify and
sign the user in. This runs on Vercel (not Firebase Cloud Functions), so
**no Firebase Blaze plan / credit card is required** — Vercel's free Hobby
plan covers serverless functions.

Before it works:
1. Get a Resend API key from resend.com (free tier: 3,000 emails/mo)
2. In Firebase Console → Project settings → Service Accounts → **Generate
   new private key** — downloads a JSON file. Keep it out of the repo.
3. In Vercel → your project → Settings → Environment Variables, add:
   - `RESEND_API_KEY` — the Resend key from step 1
   - `FIREBASE_SERVICE_ACCOUNT_KEY` — the entire contents of the JSON file
     from step 2, minified to one line
4. Redeploy on Vercel so the new env vars take effect
5. In `api/send-otp.js`, replace the `from:` address
   (`ETFC <onboarding@resend.dev>`) with a verified sending domain once one
   is set up in Resend — `onboarding@resend.dev` is only for testing/low volume

## Deploy
```
firebase deploy --only firestore:rules,storage
vercel --prod
```

## Not yet built (flagged in the architecture doc)
- Real-time seat locking (Firestore transaction) — currently a TODO in `seatmap.js`
- QR e-ticket generation on order approval
- Live wiring of the admin order-review table to Firestore
