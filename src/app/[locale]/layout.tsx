import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Rubik, Unbounded } from "next/font/google";
import { dirOf, getDict, isLocale, locales } from "@/lib/i18n";
import "../globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew", "arabic", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return {
    metadataBase: new URL(base),
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      images: [{ url: "/img/og.jpg", width: 1200, height: 630 }],
      locale,
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applies saved accessibility preferences and reduced-motion before paint.
const prefsScript = `(function(){try{var d=document.documentElement,p=JSON.parse(localStorage.getItem('ng.a11y')||'{}');['text','contrast','motion','links'].forEach(function(k){if(p[k])d.classList.add('a11y-'+k)});if(p.motion||matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('static')}catch(e){}})();`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${rubik.variable} ${unbounded.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
