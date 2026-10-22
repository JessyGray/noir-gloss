import en, { type Dict } from "./en";
import he from "./he";
import ar from "./ar";
import ru from "./ru";

export const locales = ["he", "ar", "ru", "en"] as const;
export type Locale = (typeof locales)[number];

const dicts: Record<Locale, Dict> = { he, ar, ru, en };

export function isLocale(x: string): x is Locale {
  return (locales as readonly string[]).includes(x);
}

export function getDict(locale: Locale): Dict {
  return dicts[locale];
}

export function dirOf(locale: Locale) {
  return locale === "he" || locale === "ar" ? "rtl" : "ltr";
}

/** BCP-47 tag used for Intl formatting */
export function intlTag(locale: Locale) {
  return { he: "he-IL", ar: "ar-IL", ru: "ru-RU", en: "en-IL" }[locale];
}

export function formatPrice(locale: Locale, value: number) {
  return new Intl.NumberFormat(intlTag(locale), {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  } as Intl.NumberFormatOptions).format(value);
}

export type { Dict };
