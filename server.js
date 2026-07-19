// Alpha Learning Academy — Payments Backend
// Handles à la carte, per-school Stripe subscriptions.
//
// This is a real, runnable server — deploy it (Render, Railway, Fly.io, a VPS, etc.)
// and it will actually create Stripe Checkout sessions and confirm real payments.
// It CANNOT run inside the browser artifact — Stripe's secret key must never be
// client-side code, which is why this lives here as its own deployable service.

const express = require('express');
const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// ---- Your real school pricing lives here (Stripe Price IDs, not raw numbers) ----
const SCHOOL_PRICES = {
  english: process.env.PRICE_ID_ENGLISH,
  arabic:  process.env.PRICE_ID_ARABIC,
  it:      process.env.PRICE_ID_IT,
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// --- webhook route needs the raw body, so it's registered BEFORE json() ---
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { email, school } = session.metadata;
    console.log(`✅ Payment confirmed: grant "${school}" access to ${email}`);
    // Example: await db.users.update({ email }, { $push: { enrollments: school } });
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    console.log(`⚠️ Subscription cancelled: ${sub.id} — revoke access accordingly.`);
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(require('cors')());

app.post('/create-checkout-session', async (req, res) => {
  const { school, email } = req.body;

  const priceId = SCHOOL_PRICES[school];
  if (!priceId) {
    return res.status(400).json({ error: 'Unknown school: ' + school });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { email, school },
      success_url: `${FRONTEND_URL}/auth.html?checkout=success&school=${school}`,
      cancel_url: `${FRONTEND_URL}/auth.html?checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Payments backend running on port ${PORT}`));
