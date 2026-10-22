# NOIR GLOSS — detailing studio website (Israel)

A cinematic, scroll-driven website for car detailing studios, built to be sold to
studios in Israel. Each studio gets its own copy of this repo.

- **4 languages**: Hebrew (default, RTL), Arabic (RTL), Russian, English — `/he`, `/ar`, `/ru`, `/en`
- **Scroll scenes**: dirty car is "washed" by a light beam as you scroll, macro paint
  close-up, golden-hour reveal
- **Booking panel** (slides in from the side): vehicle size → services (price and
  duration change with the vehicle) → day + approximate start time within opening hours
  (respects bays already taken) → contact details → WhatsApp confirmation
- **Admin** at `/{lang}/admin`: leads with statuses, offline bookings (phone,
  walk-in, WhatsApp, Instagram) that block time, schedule view with bay usage,
  blocked time, WhatsApp confirm button, CSV export, payment settings
- **Accessibility**: IS 5568 / WCAG 2.0 AA oriented, accessibility menu, statement
  page, keyboard + screen reader support, reduced-motion mode
- Fully responsive (phone, tablet, desktop)

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
```

## Deploy (Vercel)

1. vercel.com → **Add New → Project** → import this GitHub repo → **Deploy**.
   No settings needed: without Supabase the site runs in **demo mode**.
2. Demo admin: `/he/admin`, password `noir2026`
   (change with env var `NEXT_PUBLIC_DEMO_PASSWORD`).

In demo mode bookings are saved in the visitor's browser, so a booking made on a
phone is not visible in the admin on a laptop. That is fine for showing the product;
for a real client, connect Supabase.

## Going live for a client (Supabase)

1. supabase.com → New project (region: Frankfurt).
2. SQL Editor → paste and run [`supabase/schema.sql`](supabase/schema.sql).
3. Authentication → Users → **Add user** (the studio owner's email + password).
4. Vercel → Project → Settings → Environment Variables:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` public key |
| `NEXT_PUBLIC_BUSINESS_PHONE` | Studio WhatsApp number, e.g. `972501234567` |
| `NEXT_PUBLIC_SITE_URL` | The final domain, e.g. `https://studio.co.il` |

5. Redeploy. The admin now asks for email + password and bookings are shared across devices.

## Customising for a new studio

Everything studio-specific lives in **`src/lib/config.ts`**: brand, address, phone,
opening hours, number of bays, services with base prices/durations, vehicle size
multipliers. Texts are in `src/lib/i18n/*.ts`, images in `public/img/`
(`dirty` and `clean` must have identical framing for the wash effect).

## Online payments

Off by default. In Admin → Settings the studio can enable:
- **Payment link** — works today with any Bit / PayBox / hosted payment page link;
  shown after booking with an optional deposit %.
- **Provider integration** — prepared in `src/lib/payments.ts` for Grow (Meshulam),
  Cardcom, Tranzila, PayPlus and Bit. Requires the studio's business account; keys go
  into Vercel env vars.
