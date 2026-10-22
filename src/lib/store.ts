"use client";

// Data layer. Without Supabase env vars the site runs in DEMO mode and keeps
// everything in the browser (localStorage), so the demo works on Vercel with
// zero setup. With NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY it
// switches to a real shared database (see supabase/schema.sql).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type Booking, dateKey, newId, quote } from "./booking";
import type { ServiceId, VehicleId } from "./config";

export type PaymentMode = "off" | "link" | "provider";
export type PaymentProvider = "grow" | "cardcom" | "tranzila" | "payplus" | "bit";

export interface Settings {
  /** WhatsApp number that receives booking notifications (972...) */
  whatsapp: string;
  payment: {
    mode: PaymentMode;
    provider: PaymentProvider;
    /** Hosted payment page / Bit / PayBox link used in "link" mode */
    link: string;
    /** Deposit as % of the total (0 = full amount) */
    depositPercent: number;
  };
}

export const defaultSettings = (phone: string): Settings => ({
  whatsapp: phone,
  payment: { mode: "off", provider: "grow", link: "", depositPercent: 20 },
});

export type BusyItem = Pick<Booking, "date" | "start" | "duration" | "status">;
export type NewBooking = Omit<Booking, "id" | "createdAt">;

export interface Store {
  mode: "demo" | "supabase";
  busy(from: string, to: string): Promise<BusyItem[]>;
  create(b: NewBooking): Promise<Booking>;
  getSettings(): Promise<Settings | null>;
  // admin only
  signIn(email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  isSignedIn(): Promise<boolean>;
  list(): Promise<Booking[]>;
  update(id: string, patch: Partial<Booking>): Promise<void>;
  remove(id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
}

/* ---------------- demo (localStorage) ---------------- */

const LS_BOOKINGS = "ng.bookings.v1";
const LS_SETTINGS = "ng.settings.v1";
const SS_AUTH = "ng.admin";
export const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "noir2026";

function safeGet<T>(key: string, fallback: T, storage: "local" | "session" = "local"): T {
  try {
    const s = storage === "local" ? window.localStorage : window.sessionStorage;
    const raw = s.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function safeSet(key: string, value: unknown, storage: "local" | "session" = "local") {
  try {
    const s = storage === "local" ? window.localStorage : window.sessionStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function seed(): Booking[] {
  const today = new Date();
  const day = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    if (d.getDay() === 6) d.setDate(d.getDate() + 1); // skip Saturday
    return dateKey(d);
  };
  const mk = (
    offset: number,
    start: string,
    services: ServiceId[],
    vehicle: VehicleId,
    name: string,
    phone: string,
    carModel: string,
    status: Booking["status"],
    source: Booking["source"],
  ): Booking => {
    const q = quote(services, vehicle);
    const [h, m] = start.split(":").map(Number);
    const created = new Date(today);
    created.setHours(created.getHours() - Math.abs(offset) * 7 - 3);
    return {
      id: newId(),
      createdAt: created.toISOString(),
      date: day(offset),
      start: h * 60 + m,
      duration: q.minutes,
      services,
      vehicle,
      name,
      phone,
      carModel,
      price: q.price,
      status,
      source,
    };
  };
  return [
    mk(0, "09:00", ["ceramic"], "suv", "Yossi Levi", "972521234567", "Toyota RAV4", "in_progress", "website"),
    mk(0, "10:00", ["wash", "interior"], "sedan", "Daniel Cohen", "972547654321", "Mazda 3", "confirmed", "phone"),
    mk(1, "08:00", ["polish"], "sedan", "Noa Mizrahi", "972503334455", "Tesla Model 3", "new", "website"),
    mk(1, "13:00", ["wash"], "large", "Ahmad Khalil", "972586667788", "Hyundai Palisade", "new", "whatsapp"),
    mk(2, "11:30", ["headlights", "wash"], "small", "Irina Petrova", "972529998877", "Kia Picanto", "confirmed", "instagram"),
    mk(3, "08:00", ["ppf"], "suv", "Avi Ben-David", "972541112233", "BMW X5", "new", "website"),
    mk(-1, "09:00", ["correction"], "sedan", "Maya Shapiro", "972502223344", "Audi A4", "done", "website"),
    mk(-2, "15:00", ["interior"], "van", "Sergey Ivanov", "972535556677", "Ford Transit", "no_show", "phone"),
  ];
}

class DemoStore implements Store {
  mode = "demo" as const;
  private all(): Booking[] {
    const existing = safeGet<Booking[] | null>(LS_BOOKINGS, null);
    if (existing) return existing;
    const s = seed();
    safeSet(LS_BOOKINGS, s);
    return s;
  }
  private write(list: Booking[]) {
    safeSet(LS_BOOKINGS, list);
  }
  async busy(from: string, to: string) {
    return this.all()
      .filter((b) => b.date >= from && b.date <= to)
      .map(({ date, start, duration, status }) => ({ date, start, duration, status }));
  }
  async create(b: NewBooking) {
    const full: Booking = { ...b, id: newId(), createdAt: new Date().toISOString() };
    this.write([...this.all(), full]);
    return full;
  }
  async getSettings() {
    return safeGet<Settings | null>(LS_SETTINGS, null);
  }
  async signIn(_email: string, password: string) {
    const ok = password === DEMO_PASSWORD;
    if (ok) safeSet(SS_AUTH, true, "session");
    return ok;
  }
  async signOut() {
    safeSet(SS_AUTH, null, "session");
  }
  async isSignedIn() {
    return safeGet<boolean>(SS_AUTH, false, "session");
  }
  async list() {
    return this.all();
  }
  async update(id: string, patch: Partial<Booking>) {
    this.write(this.all().map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  async remove(id: string) {
    this.write(this.all().filter((b) => b.id !== id));
  }
  async saveSettings(s: Settings) {
    safeSet(LS_SETTINGS, s);
  }
}

/* ---------------- Supabase ---------------- */

type Row = {
  id: string;
  created_at: string;
  date: string;
  start_min: number;
  duration: number;
  services: ServiceId[];
  vehicle: VehicleId;
  name: string;
  phone: string;
  car_model: string | null;
  notes: string | null;
  price: number;
  status: Booking["status"];
  source: Booking["source"];
  locale: string | null;
};

const fromRow = (r: Row): Booking => ({
  id: r.id,
  createdAt: r.created_at,
  date: r.date,
  start: r.start_min,
  duration: r.duration,
  services: r.services,
  vehicle: r.vehicle,
  name: r.name,
  phone: r.phone,
  carModel: r.car_model ?? undefined,
  notes: r.notes ?? undefined,
  price: r.price,
  status: r.status,
  source: r.source,
  locale: r.locale ?? undefined,
});

function toRow(b: Partial<Booking>) {
  const r: Record<string, unknown> = {};
  if (b.date !== undefined) r.date = b.date;
  if (b.start !== undefined) r.start_min = b.start;
  if (b.duration !== undefined) r.duration = b.duration;
  if (b.services !== undefined) r.services = b.services;
  if (b.vehicle !== undefined) r.vehicle = b.vehicle;
  if (b.name !== undefined) r.name = b.name;
  if (b.phone !== undefined) r.phone = b.phone;
  if (b.carModel !== undefined) r.car_model = b.carModel || null;
  if (b.notes !== undefined) r.notes = b.notes || null;
  if (b.price !== undefined) r.price = b.price;
  if (b.status !== undefined) r.status = b.status;
  if (b.source !== undefined) r.source = b.source;
  if (b.locale !== undefined) r.locale = b.locale;
  return r;
}

class SupabaseStore implements Store {
  mode = "supabase" as const;
  constructor(private sb: SupabaseClient) {}
  async busy(from: string, to: string) {
    const { data, error } = await this.sb.rpc("busy_slots", { from_date: from, to_date: to });
    if (error) throw error;
    return (data as { date: string; start_min: number; duration: number; status: Booking["status"] }[]).map((r) => ({
      date: r.date,
      start: r.start_min,
      duration: r.duration,
      status: r.status,
    }));
  }
  async create(b: NewBooking) {
    const id = crypto.randomUUID();
    // anon users can insert but not read back, so build the result locally
    const { error } = await this.sb.from("bookings").insert({ id, ...toRow(b) });
    if (error) throw error;
    return { ...b, id, createdAt: new Date().toISOString() };
  }
  async getSettings() {
    const { data } = await this.sb.from("settings").select("data").eq("id", 1).maybeSingle();
    return (data?.data as Settings) ?? null;
  }
  async signIn(email: string, password: string) {
    const { error } = await this.sb.auth.signInWithPassword({ email, password });
    return !error;
  }
  async signOut() {
    await this.sb.auth.signOut();
  }
  async isSignedIn() {
    const { data } = await this.sb.auth.getSession();
    return !!data.session;
  }
  async list() {
    const { data, error } = await this.sb.from("bookings").select("*").order("date").order("start_min");
    if (error) throw error;
    return (data as Row[]).map(fromRow);
  }
  async update(id: string, patch: Partial<Booking>) {
    const { error } = await this.sb.from("bookings").update(toRow(patch)).eq("id", id);
    if (error) throw error;
  }
  async remove(id: string) {
    const { error } = await this.sb.from("bookings").delete().eq("id", id);
    if (error) throw error;
  }
  async saveSettings(s: Settings) {
    const { error } = await this.sb.from("settings").upsert({ id: 1, data: s });
    if (error) throw error;
  }
}

let instance: Store | null = null;

export function getStore(): Store {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  instance = url && key ? new SupabaseStore(createClient(url, key)) : new DemoStore();
  return instance;
}
