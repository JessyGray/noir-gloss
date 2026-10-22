import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { privacy } from "@/lib/i18n/legal";
import LegalPage from "@/components/site/LegalPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: `${privacy[locale].title} · NOIR GLOSS` } : {};
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} t={getDict(locale)} doc={privacy[locale]} />;
}
