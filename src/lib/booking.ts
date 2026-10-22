import { siteConfig, type ServiceId, type VehicleId } from "./config";

export type BookingStatus =
  | "new"
  | "confirmed"
  | "in_progress"
  | "done"
  | "cancelled"
  | "no_show";

export const STATUSES: BookingStatus[] = [
  "new",
  "confirmed",
  "in_progress",
  "done",
  "cancelled",
  "no_show",
];

export type BookingSource = "website" | "phone" | "walk_in" | "whatsapp" | "instagram" | "block";

export interface Booking {
  id: string;
  createdAt: string;
  /** YYYY-MM-DD (studio local date) */
  date: string;
  /** minutes from midnight */
  start: number;
  /** minutes */
  duration: number;
  services: ServiceId[];
  vehicle: VehicleId;
  name: string;
  phone: string;
  carModel?: string;
  notes?: string;
  price: number;
  status: BookingStatus;
  source: BookingSource;
  locale?: string;
}

/** Statuses that do not occupy a bay */
const FREE_STATUSES: BookingStatus[] = ["cancelled", "no_show"];

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function quote(services: ServiceId[], vehicle: VehicleId) {
  const v = siteConfig.vehicles.find((x) => x.id === vehicle) ?? siteConfig.vehicles[1];
  let price = 0;
  let minutes = 0;
  for (const id of services) {
    const s = siteConfig.services.find((x) => x.id === id);
    if (!s) continue;
    price += s.price * v.priceFactor;
    minutes += s.minutes * v.timeFactor;
  }
  // round price to 10 ₪, duration up to the slot grid
  price = Math.round(price / 10) * 10;
  const step = siteConfig.slotStep;
  minutes = Math.ceil(minutes / step) * step;
  return { price, minutes };
}

export function hoursFor(date: Date) {
  return siteConfig.hours[date.getDay()] ?? null;
}

/**
 * Approximate available start times for a day. A start is available when, for
 * its whole duration, fewer than `bays` active bookings overlap it.
 */
export function availableSlots(dayKey: string, duration: number, bookings: Pick<Booking, "date" | "start" | "duration" | "status">[], now = new Date()) {
  const day = parseDateKey(dayKey);
  const h = hoursFor(day);
  if (!h || duration <= 0) return [];
  const open = toMinutes(h.open);
  const close = toMinutes(h.close);
  const active = bookings.filter((b) => b.date === dayKey && !FREE_STATUSES.includes(b.status));
  const isToday = dateKey(now) === dayKey;
  const nowMin = now.getHours() * 60 + now.getMinutes() + 60; // need at least 1h notice
  const step = siteConfig.slotStep;
  const out: number[] = [];
  for (let t = open; t + duration <= close; t += step) {
    if (isToday && t < nowMin) continue;
    let ok = true;
    // check every grid cell inside [t, t + duration)
    for (let c = t; c < t + duration && ok; c += step) {
      const overlapping = active.filter((b) => b.start < c + step && b.start + b.duration > c).length;
      if (overlapping >= siteConfig.bays) ok = false;
    }
    if (ok) out.push(t);
  }
  return out;
}

/** Normalize an Israeli phone to 972XXXXXXXXX, or null if invalid */
export function normalizeIlPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("972")) local = "0" + local.slice(3);
  if (!/^0(5\d{8}|[2-4689]\d{7}|7\d{8})$/.test(local)) return null;
  return "972" + local.slice(1);
}

export function formatPhone(intl: string) {
  const local = intl.startsWith("972") ? "0" + intl.slice(3) : intl;
  if (local.length === 10) return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  return local;
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
