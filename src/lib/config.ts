// Per-store configuration. To sell this site to a new detailing studio,
// copy the repo and edit this file (brand, contacts, hours, services, prices).

export type ServiceId =
  | "wash"
  | "interior"
  | "polish"
  | "correction"
  | "ceramic"
  | "ppf"
  | "headlights"
  | "engine";

export type VehicleId = "small" | "sedan" | "suv" | "large" | "van";

export interface Service {
  id: ServiceId;
  /** Base price in ILS for a sedan */
  price: number;
  /** Base duration in minutes for a sedan */
  minutes: number;
  featured?: boolean;
}

export interface Vehicle {
  id: VehicleId;
  /** Multiplies service price */
  priceFactor: number;
  /** Multiplies service duration */
  timeFactor: number;
}

/** Opening hours per weekday, 0 = Sunday. null = closed. "HH:MM" strings. */
export type WeekHours = Record<number, { open: string; close: string } | null>;

export const siteConfig = {
  brand: "NOIR GLOSS",
  tagline: "Detailing Studio",
  city: "Tel Aviv",
  address: {
    he: "רחוב המסגר 42, תל אביב",
    ar: "شارع هامسغير 42، تل أبيب",
    ru: "ул. ха-Масгер 42, Тель-Авив",
    en: "42 HaMasger St, Tel Aviv",
  },
  mapUrl: "https://maps.google.com/?q=HaMasger+42+Tel+Aviv",
  /** International format without "+" — used for wa.me and tel: links */
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "972500000000",
  instagram: "https://instagram.com/",
  defaultLocale: "he" as const,
  currency: "ILS",
  /** How many cars can be worked on at the same time */
  bays: 2,
  /** Slot grid in minutes */
  slotStep: 30,
  /** How many days ahead customers can book */
  bookingDaysAhead: 30,
  /** Israel work week: Sun–Thu full day, Fri short day, Sat closed */
  hours: {
    0: { open: "08:00", close: "19:00" },
    1: { open: "08:00", close: "19:00" },
    2: { open: "08:00", close: "19:00" },
    3: { open: "08:00", close: "19:00" },
    4: { open: "08:00", close: "19:00" },
    5: { open: "08:00", close: "14:00" },
    6: null,
  } as WeekHours,
  services: [
    { id: "wash", price: 120, minutes: 60, featured: true },
    { id: "interior", price: 450, minutes: 180, featured: true },
    { id: "polish", price: 950, minutes: 240, featured: true },
    { id: "correction", price: 1800, minutes: 420 },
    { id: "ceramic", price: 2900, minutes: 480, featured: true },
    { id: "ppf", price: 4500, minutes: 540 },
    { id: "headlights", price: 250, minutes: 60 },
    { id: "engine", price: 200, minutes: 45 },
  ] as Service[],
  vehicles: [
    { id: "small", priceFactor: 0.9, timeFactor: 0.9 },
    { id: "sedan", priceFactor: 1, timeFactor: 1 },
    { id: "suv", priceFactor: 1.2, timeFactor: 1.15 },
    { id: "large", priceFactor: 1.4, timeFactor: 1.3 },
    { id: "van", priceFactor: 1.5, timeFactor: 1.4 },
  ] as Vehicle[],
};

export type SiteConfig = typeof siteConfig;
