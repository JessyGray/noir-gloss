// Online payments are intentionally pluggable. The studio picks a mode in
// Admin → Settings:
//   off      — customers pay at the studio (default)
//   link     — a static payment link (Bit / PayBox / a provider's hosted page)
//              is shown after booking; works without any API keys
//   provider — server-side integration with an Israeli payment provider.
//
// To enable "provider" for a client: implement `createPaymentUrl` for their
// provider in an API route (app/api/pay/route.ts), using keys from Vercel env
// vars (never NEXT_PUBLIC_*). Each provider returns a hosted payment page URL
// for a given amount; the booking id goes in the provider's reference field.

import type { PaymentProvider } from "./store";

export const PROVIDERS: Record<PaymentProvider, { name: string; docs: string; env: string[] }> = {
  grow: { name: "Grow (Meshulam)", docs: "https://grow-il.readme.io/", env: ["GROW_PAGE_CODE", "GROW_USER_ID"] },
  cardcom: { name: "Cardcom", docs: "https://secure.cardcom.solutions/swagger/index.html", env: ["CARDCOM_TERMINAL", "CARDCOM_API_NAME"] },
  tranzila: { name: "Tranzila", docs: "https://docs.tranzila.com/", env: ["TRANZILA_TERMINAL", "TRANZILA_API_KEY"] },
  payplus: { name: "PayPlus", docs: "https://docs.payplus.co.il/", env: ["PAYPLUS_API_KEY", "PAYPLUS_SECRET_KEY", "PAYPLUS_PAGE_UID"] },
  bit: { name: "Bit Business", docs: "https://www.bitpay.co.il/", env: ["BIT_MERCHANT_ID"] },
};

export interface PaymentRequest {
  bookingId: string;
  amount: number; // ILS
  description: string;
  customerName: string;
  customerPhone: string;
}

export type CreatePaymentUrl = (req: PaymentRequest) => Promise<string>;
