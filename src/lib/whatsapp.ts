import { siteConfig } from "./config";
import { fromMinutes, parseDateKey, type Booking } from "./booking";
import { formatPrice, getDict, intlTag, isLocale, type Locale } from "./i18n";

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function formatDay(locale: Locale, key: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat(intlTag(locale), { ...opts, numberingSystem: "latn" } as Intl.DateTimeFormatOptions).format(parseDateKey(key));
}

/** Message the customer sends to the studio right after booking */
export function customerMessage(locale: Locale, b: Pick<Booking, "services" | "vehicle" | "date" | "start" | "price" | "name">) {
  const t = getDict(locale);
  const services = b.services.map((s) => t.services.items[s]?.name ?? s).join(", ");
  return [
    t.booking.waGreeting,
    `${t.booking.waServices}: ${services}`,
    `${t.booking.waVehicle}: ${t.booking.vehicles[b.vehicle]?.name ?? b.vehicle}`,
    `${t.booking.waWhen}: ${formatDay(locale, b.date, { weekday: "long", day: "numeric", month: "long" })}, ${fromMinutes(b.start)}`,
    `${t.booking.waTotal}: ${formatPrice(locale, b.price)}`,
    `${t.booking.waName}: ${b.name}`,
  ].join("\n");
}

const confirmTpl: Record<Locale, (name: string, when: string) => string> = {
  he: (n, w) => `שלום ${n}, ההזמנה שלך ב-${siteConfig.brand} אושרה ל-${w}. נתראה!`,
  ar: (n, w) => `مرحبًا ${n}، تم تأكيد حجزك في ${siteConfig.brand} يوم ${w}. نراك قريبًا!`,
  ru: (n, w) => `Здравствуйте, ${n}! Ваша запись в ${siteConfig.brand} подтверждена: ${w}. Ждём вас!`,
  en: (n, w) => `Hi ${n}, your booking at ${siteConfig.brand} is confirmed for ${w}. See you soon!`,
};

/** Message the studio sends to the customer from the admin panel (in the customer's language) */
export function confirmMessage(b: Pick<Booking, "name" | "date" | "start" | "locale">) {
  const locale: Locale = b.locale && isLocale(b.locale) ? b.locale : siteConfig.defaultLocale;
  const when = `${formatDay(locale, b.date, { weekday: "long", day: "numeric", month: "long" })}, ${fromMinutes(b.start)}`;
  return confirmTpl[locale](b.name.split(" ")[0], when);
}
