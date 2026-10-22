import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { getAdminDict } from "@/lib/i18n/admin";
import Admin from "@/components/admin/Admin";
import "./admin.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? `${getAdminDict(locale).title} · NOIR GLOSS` : "Admin", robots: { index: false, follow: false } };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Admin locale={locale} />;
}
