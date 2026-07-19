# Alpha Learning Academy — Payments Backend

Real payment-processing half of the à la carte enrollment system. Deployed
separately since a Stripe secret key can never live in browser-side code.

## Setup
1. `npm install`
2. Create three Stripe products (English Language, Arabic & Islamic Studies,
   IT School), each with a recurring monthly Price. Copy each Price ID.
3. Copy `.env.example` to `.env` and fill in your real values.
4. Deploy to Render/Railway/Fly.io/etc. with the same environment variables set.
5. In Stripe Dashboard → Webhooks, add an endpoint at
   `https://your-deployed-server.com/webhook`, subscribed to
   `checkout.session.completed` and `customer.subscription.deleted`.
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
6. In `auth.html`, set `PAYMENTS_API` to your deployed server's URL.
