# Parent Biomedical Workshop Landing Page

Conversion-focused landing page for Global Child Wellness Centre’s paid parent workshop.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

## Configure before launch

### 1. Razorpay (required for checkout)

Live checkout **must** create an order on the server (Key Secret stays in `.env`, never in the browser).

```bash
cp .env.example .env
```

1. Open [Razorpay Dashboard → API Keys](https://dashboard.razorpay.com/app/keys)
2. Switch to **Live** (or **Test** for safe local testing)
3. Generate keys and copy **both** Key ID and Key Secret (they must be a matching pair)
4. Put them in `.env`:

```env
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
WORKSHOP_FEE_INR=1499
```

5. Restart `npm run dev`

If checkout shows **Authentication failed**, the Key ID and Secret do not match — regenerate both in the dashboard.

**Test cards (test mode only):** [Razorpay test payment methods](https://razorpay.com/docs/payments/payments/test-card-upi-details/)

`RAZORPAY_PLAN_ID` is for subscriptions and is not used by this one-time workshop checkout.

### 2. Workshop content

Edit `src/config.ts`:

- Workshop date, time, venue, fee, seats
- Registration close date (countdown)
- Expert bios / Dr. Neha credentials
- WhatsApp number and group invite link
- Meta Pixel ID via `VITE_META_PIXEL_ID`

Replace avatar placeholders with real photos of Dr. Priyanka Kalra and Dr. Neha (hero + experts section). Swap `/public/hero-bg.svg` for a compressed warm photo of doctor-with-child.

## Features

- Mobile-first layout with sticky **Reserve My Seat** CTA
- Countdown timer to registration close
- Remaining seats display
- Floating WhatsApp button
- Razorpay Checkout (parent name, mobile, email)
- Success screen with WhatsApp group join CTA
- Meta Pixel: PageView, ViewContent, InitiateCheckout, Purchase

## Build

```bash
npm run build
npm run preview
```
